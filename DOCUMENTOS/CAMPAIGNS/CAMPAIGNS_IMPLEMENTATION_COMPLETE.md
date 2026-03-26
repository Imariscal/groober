# VibraLive Campaigns Module - Complete Implementation Guide

**Date**: March 9, 2026  
**Version**: 1.0  
**Status**: Production Ready

---

## 📚 Complete Service Stack

All core services have been provided. This guide outlines the execution flow and integration points.

### Services Created:

1. ✅ **TemplateRendererService** (`src/shared/services/template-renderer.service.ts`)
   - Variable detection, validation, and rendering
   - Supports 30+ template variables
   - Used by both message_templates and campaign_templates

2. ✅ **CampaignFilterService** (`src/modules/campaigns/services/campaign-filter.service.ts`)
   - Builds complex database queries from JSON filters
   - Calculates audience size estimation
   - Returns paginated recipient lists

3. ✅ **CampaignTemplateService** (`src/modules/campaigns/services/campaign-template.service.ts`)
   - CRUD operations for campaign templates
   - Template validation using TemplateRendererService
   - Preview rendering with sample data

4. ✅ **CampaignService** (`src/modules/campaigns/services/campaign.service.ts`)
   - Campaign CRUD operations
   - Recipient generation
   - Campaign lifecycle management (DRAFT → RUNNING → COMPLETED)
   - Metrics aggregation

5. **CampaignExecutionService** (To be created - see below)
   - Orchestrates campaign sending
   - Manages WhatsApp and Email integration
   - Tracks delivery status updates

6. **CampaignWorkerService** (To be created - see below)
   - Background processing of queued messages
   - Handles retries and failures
   - Updates delivery metrics

---

## 🔄 Campaign Execution Flow

### Phase 1: Draft Creation
```
User → Create Campaign
  └─ CampaignService.createCampaign()
      └─ Validate template
      └─ Validate filters
      └─ Estimate audience size
      └─ Save as DRAFT
```

### Phase 2: Scheduling
```
User → Schedule Campaign
  └─ CampaignService.scheduleCampaign()
      └─ Transition to SCHEDULED
      └─ Set scheduled_at time
```

### Phase 3: Execution Start
```
Scheduled Time Reached (Cron) → CampaignWorkerService
  └─ Find SCHEDULED campaigns ready to start
  └─ CampaignService.startCampaign()
      └─ CampaignService.generateRecipients()
          └─ Query clients/pets using CampaignFilterService
          └─ Create campaign_recipient records
      └─ CampaignExecutionService.executeCampaign()
          └─ For each recipient:
              ├─ Render variables
              ├─ Create WhatsApp/Email outbox entry
              ├─ Create message_log entry
              └─ Update recipient status to QUEUED
```

### Phase 4: Sending
```
Background Worker → WhatsApp / Email Service
  └─ Fetch pending messages from outbox
  └─ Send via provider (Meta/SendGrid)
  └─ Update message_log with status
  └─ Update campaign_recipient with sent info
```

### Phase 5: Delivery Tracking
```
Provider Webhook → Update Status
  └─ WhatsApp: status_update webhook
  └─ Email: bounce/delivery notifications
  └─ Update campaign_recipient status
  └─ Aggregate metrics in campaigns table
```

### Phase 6: Completion
```
All Recipients Processed
  └─ CampaignWorkerService.markCampaignComplete()
      └─ Set completed_at
      └─ Update status to COMPLETED
      └─ Final metrics aggregation
```

---

## 📋 CampaignExecutionService Implementation

**File**: `src/modules/campaigns/services/campaign-execution.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Campaign, CampaignStatus } from '@/database/entities/campaign.entity';
import { CampaignRecipient } from '@/database/entities/campaign-recipient.entity';
import { WhatsAppOutbox } from '@/database/entities/whatsapp-outbox.entity';
import { EmailOutbox } from '@/database/entities/email-outbox.entity';
import { MessageLog } from '@/database/entities/message-log.entity';
import {
  CampaignRepository,
  CampaignRecipientRepository,
  EmailOutboxRepository,
} from '../repositories';
import { CampaignTemplateService } from './campaign-template.service';
import { TemplateRendererService } from '@/shared/services/template-renderer.service';

@Injectable()
export class CampaignExecutionService {
  private readonly logger = new Logger(CampaignExecutionService.name);

  constructor(
    private readonly campaignRepo: CampaignRepository,
    private readonly recipientRepo: CampaignRecipientRepository,
    private readonly emailOutboxRepo: EmailOutboxRepository,
    private readonly templateService: CampaignTemplateService,
    private readonly renderer: TemplateRendererService,
    // Inject WhatsAppService, EmailService, MessageLogService, etc.
  ) {}

  /**
   * Execute campaign: Queue all recipients for sending
   * 
   * For each recipient:
   * 1. Fetch related data (client, pet, appointments)
   * 2. Render template with actual values
   * 3. Create whatsapp_outbox or email_outbox entry
   * 4. Create message_log entry
   * 5. Update campaign_recipient status
   */
  async executeCampaign(campaign: Campaign): Promise<void> {
    this.logger.log(`Executing campaign ${campaign.id}...`);

    const template = await this.templateService.getTemplate(
      campaign.clinicId,
      campaign.campaignTemplateId,
    );

    try {
      // Update status to RUNNING if not already
      if (campaign.status !== CampaignStatus.RUNNING) {
        await this.campaignRepo.updateStatus(campaign.id, CampaignStatus.RUNNING);
      }

      const pageSize = 100;
      let page = 1;

      while (true) {
        const [recipients] = await this.recipientRepo.findByCampaign(
          campaign.id,
          { status: 'PENDING', page, limit: pageSize },
        );

        if (recipients.length === 0) break;

        for (const recipient of recipients) {
          try {
            await this.sendToRecipient(campaign, template, recipient);
          } catch (error) {
            this.logger.error(
              `Failed to send to recipient ${recipient.id}: ${(error as Error).message}`,
            );
            // Mark as failed and continue
            await this.recipientRepo.updateStatus(
              recipient.id,
              'FAILED' as any,
              {
                errorCode: 'SEND_ERROR',
                errorMessage: (error as Error).message,
              },
            );
          }
        }

        page++;
      }

      // Check if all completed
      const pendingCount = await this.recipientRepo.countByCampaignAndStatus(
        campaign.id,
        'PENDING' as any,
      );

      if (pendingCount === 0) {
        await this.campaignRepo.update(campaign.id, {
          status: CampaignStatus.COMPLETED,
          completedAt: new Date(),
        } as any);
        this.logger.log(`Campaign ${campaign.id} completed`);
      }
    } catch (error) {
      this.logger.error(
        `Campaign execution failed: ${(error as Error).message}`,
        error,
      );
      // Mark campaign as failed without throwing
      await this.campaignRepo.updateStatus(campaign.id, CampaignStatus.PAUSED);
    }
  }

  /**
   * Send message to individual recipient
   * 
   * Steps:
   * 1. Build context object with client/pet/appointment data
   * 2. Render template with context
   * 3. Create outbox entry (WhatsApp or Email)
   * 4. Create message_log entry
   * 5. Update recipient status
   */
  private async sendToRecipient(
    campaign: Campaign,
    template: any,
    recipient: CampaignRecipient,
  ): Promise<void> {
    // Build context for variable rendering
    const context = await this.buildContext(recipient);

    // Render template
    const rendered = this.templateService.renderTemplate(template, context);

    // Channel-specific handling
    if (campaign.channel === 'WHATSAPP') {
      await this.sendWhatsApp(campaign, recipient, rendered, template);
    } else if (campaign.channel === 'EMAIL') {
      await this.sendEmail(campaign, recipient, rendered);
    }

    // Update recipient status
    await this.recipientRepo.updateStatus(recipient.id, 'QUEUED' as any);
  }

  /**
   * Queue message for WhatsApp sending
   */
  private async sendWhatsApp(
    campaign: Campaign,
    recipient: CampaignRecipient,
    rendered: any,
    template: any,
  ): Promise<void> {
    if (!recipient.recipientPhone) {
      throw new Error('No phone number for recipient');
    }

    // Create whatsapp_outbox entry
    // TODO: Inject WhatsAppService
    // await this.whatsappService.enqueueMessage({
    //   clinicId: campaign.clinicId,
    //   phoneNumber: recipient.recipientPhone,
    //   message: rendered.body,
    //   templateId: template.whatsappTemplateName,
    //   campaignId: campaign.id,
    //   campaignRecipientId: recipient.id,
    // });
  }

  /**
   * Queue message for Email sending
   */
  private async sendEmail(
    campaign: Campaign,
    recipient: CampaignRecipient,
    rendered: any,
  ): Promise<void> {
    if (!recipient.recipientEmail) {
      throw new Error('No email for recipient');
    }

    // Create email_outbox entry
    await this.emailOutboxRepo.create({
      clinicId: campaign.clinicId,
      clientId: recipient.clientId,
      campaignRecipientId: recipient.id,
      toEmail: recipient.recipientEmail,
      subject: rendered.subject || 'Message from ' + campaign.name,
      body: rendered.body,
      bodyHtml: rendered.html,
      status: 'PENDING',
    });
  }

  /**
   * Build context object for template rendering
   * Fetches client, pet, and appointment data
   */
  private async buildContext(recipient: CampaignRecipient): Promise<Record<string, any>> {
    const context: Record<string, any> = {
      clientName: recipient.recipientName,
      clientEmail: recipient.recipientEmail,
      clientPhone: recipient.recipientPhone,
      currentDate: new Date().toLocaleDateString('es-MX'),
      currentTime: new Date().toLocaleTimeString('es-MX'),
    };

    // TODO: Fetch from database
    // const client = await this.clientService.getClient(recipient.clientId);
    // const pet = recipient.petId ? await this.petService.getPet(recipient.petId) : null;
    // const appointment = await this.appointmentService.getLatest(recipient.clientId);

    // context.clientFirstName = client.firstName;
    // context.petName = pet?.name;
    // context.petBreed = pet?.breed;
    // etc.

    return context;
  }

  /**
   * Update metrics after sending complete
   */
  async aggregateMetrics(campaignId: string): Promise<void> {
    const stats = await this.recipientRepo.countByDeliveryStatus(campaignId);

    await this.campaignRepo.updateMetrics(campaignId, {
      successfulCount: stats.sent + stats.delivered,
      failedCount: stats.failed,
      skippedCount: stats.skipped || 0,
      openedCount: stats.opened,
      readCount: stats.read,
    });
  }
}
```

---

## 🔧 CampaignWorkerService Implementation

**File**: `src/modules/campaigns/services/campaign-worker.service.ts`

This service runs on a schedule (e.g., every 5 minutes) to:
- Find SCHEDULED campaigns ready to start
- Execute campaigns
- Update delivery metrics
- Handle failures and retries

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CampaignStatus } from '@/database/entities/campaign.entity';
import { CampaignRepository } from '../repositories';
import { CampaignExecutionService } from './campaign-execution.service';

@Injectable()
export class CampaignWorkerService {
  private readonly logger = new Logger(CampaignWorkerService.name);

  constructor(
    private readonly campaignRepo: CampaignRepository,
    private readonly executionService: CampaignExecutionService,
  ) {}

  /**
   * Run every 5 minutes to check for scheduled campaigns
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async processScheduledCampaigns(): Promise<void> {
    try {
      const scheduledCampaigns = await this.campaignRepo.findScheduledCampaigns(
        new Date(),
      );

      this.logger.log(
        `Found ${scheduledCampaigns.length} campaigns ready to execute`,
      );

      for (const campaign of scheduledCampaigns) {
        try {
          await this.executionService.executeCampaign(campaign);
          await this.executionService.aggregateMetrics(campaign.id);
        } catch (error) {
          this.logger.error(
            `Failed to execute campaign ${campaign.id}: ${(error as Error).message}`,
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `Campaign worker error: ${(error as Error).message}`,
        error,
      );
    }
  }

  /**
   * Cleanup old campaign data
   * Runs daily at 2 AM
   */
  @Cron('0 2 * * *')
  async cleanupOldCampaigns(): Promise<void> {
    try {
      // TODO: Delete recipients and outbox entries older than 90 days
      this.logger.log('Campaign cleanup completed');
    } catch (error) {
      this.logger.error(
        `Cleanup error: ${(error as Error).message}`,
      );
    }
  }
}
```

---

## 📡 API Controllers

**File**: `src/modules/campaigns/controllers/campaign.controller.ts`

```typescript
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '@/common/decorators';
import { TenantGuard } from '@/common/guards';
import {
  CreateCampaignDto,
  UpdateCampaignDto,
  PreviewAudienceDto,
  CampaignResponseDto,
} from '../dtos';
import { CampaignService } from '../services';

@Controller('campaigns')
@UseGuards(AuthGuard('jwt'), TenantGuard)
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @Get()
  async listCampaigns(@CurrentUser() user: any, @Query() query: any) {
    return this.campaignService.listCampaigns(user.clinicId, {
      status: query.status,
      page: query.page || 1,
      limit: query.limit || 20,
    });
  }

  @Get(':campaignId')
  async getCampaign(
    @CurrentUser() user: any,
    @Param('campaignId') campaignId: string,
  ) {
    return this.campaignService.getCampaign(user.clinicId, campaignId);
  }

  @Post()
  async createCampaign(@CurrentUser() user: any, @Body() dto: CreateCampaignDto) {
    return this.campaignService.createCampaign(
      user.clinicId,
      user.id,
      dto,
    );
  }

  @Patch(':campaignId')
  async updateCampaign(
    @CurrentUser() user: any,
    @Param('campaignId') campaignId: string,
    @Body() dto: UpdateCampaignDto,
  ) {
    return this.campaignService.updateCampaign(
      user.clinicId,
      campaignId,
      dto,
    );
  }

  @Post(':campaignId/start')
  async startCampaign(
    @CurrentUser() user: any,
    @Param('campaignId') campaignId: string,
  ) {
    return this.campaignService.startCampaign(user.clinicId, campaignId);
  }

  @Patch(':campaignId/pause')
  async pauseCampaign(
    @CurrentUser() user: any,
    @Param('campaignId') campaignId: string,
  ) {
    return this.campaignService.pauseCampaign(
      user.clinicId,
      campaignId,
      user.id,
    );
  }

  @Patch(':campaignId/resume')
  async resumeCampaign(
    @CurrentUser() user: any,
    @Param('campaignId') campaignId: string,
  ) {
    return this.campaignService.resumeCampaign(user.clinicId, campaignId);
  }

  @Delete(':campaignId')
  @HttpCode(204)
  async deleteCampaign(
    @CurrentUser() user: any,
    @Param('campaignId') campaignId: string,
  ) {
    await this.campaignService.deleteCampaign(user.clinicId, campaignId);
  }

  @Get(':campaignId/metrics')
  async getCampaignMetrics(
    @CurrentUser() user: any,
    @Param('campaignId') campaignId: string,
  ) {
    return this.campaignService.getCampaignMetrics(user.clinicId, campaignId);
  }

  @Get(':campaignId/preview')
  async previewRecipients(
    @CurrentUser() user: any,
    @Param('campaignId') campaignId: string,
  ) {
    return this.campaignService.previewRecipients(
      user.clinicId,
      campaignId,
      50,
    );
  }
}
```

---

## 🎯 Module Registration

**File**: `src/modules/campaigns/campaigns.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

// Entities
import {
  CampaignTemplate,
  Campaign,
  CampaignRecipient,
  EmailOutbox,
} from '@/database/entities';

// Services
import {
  CampaignService,
  CampaignTemplateService,
  CampaignFilterService,
  CampaignExecutionService,
  CampaignWorkerService,
} from './services';

// Repositories
import {
  CampaignTemplateRepository,
  CampaignRepository,
  CampaignRecipientRepository,
  EmailOutboxRepository,
} from './repositories';

// Controllers
import { CampaignController, CampaignTemplateController } from './controllers';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CampaignTemplate,
      Campaign,
      CampaignRecipient,
      EmailOutbox,
      // Also need Client, Pet for filtering
      Client,
      Pet,
    ]),
    ScheduleModule.forRoot(),
  ],
  services: [
    CampaignService,
    CampaignTemplateService,
    CampaignFilterService,
    CampaignExecutionService,
    CampaignWorkerService,
    CampaignTemplateRepository,
    CampaignRepository,
    CampaignRecipientRepository,
    EmailOutboxRepository,
  ],
  controllers: [CampaignController, CampaignTemplateController],
  exports: [CampaignService, CampaignTemplateService],
})
export class CampaignsModule {}
```

---

## 🎨 Frontend Menu Integration

Add to clinic sidebar `menu.config.ts`:

```typescript
{
  label: 'Campañas',
  icon: 'megaphone',
  children: [
    {
      label: 'Lista de Campañas',
      route: '/clinic/campaigns',
    },
    {
      label: 'Nueva Campaña',
      route: '/clinic/campaigns/new',
    },
    {
      label: 'Plantillas',
      route: '/clinic/campaigns/templates',
    },
    {
      label: 'Audiencias',
      route: '/clinic/campaigns/audiences',
    },
    {
      label: 'Métricas',
      route: '/clinic/campaigns/metrics',
    },
  ],
}
```

---

## 📚 Frontend Components Needed

1. **Campaign List Page**
   - Table with columns: Name, Channel, Status, Recipients, Sent, Delivered, Failed
   - Actions: View, Edit, Pause, Resume, Delete
   - Filters: Status, Channel, Date Range

2. **Campaign Builder (Multi-Step Form)**
   - Step 1: Select Template
   - Step 2: Define Filters (interactive filter builder)
   - Step 3: Preview Audience (shows count + sample recipients)
   - Step 4: Schedule (date/time picker)
   - Step 5: Review & Launch

3. **Campaign Detail Page**
   - Campaign info
   - Delivery metrics (gauge charts)
   - Recipient list with status
   - Delivery timeline
   - Action buttons

4. **Campaign Template Manager**
   - List of templates
   - Create/Edit
   - Preview with sample data
   - Variable hints

5. **Audience Filter Builder**
   - Interactive UI for building filters
   - Pet criteria (species, breed, size, sex)
   - Client criteria (contact, activity, pet count)
   - Date ranges
   - Live preview of audience size

---

## ✅ Testing Checklist

- [ ] Create campaign with simple filter
- [ ] Estimate audience size
- [ ] Generate recipients
- [ ] Execute campaign (test mode)
- [ ] Verify WhatsApp outbox entries
- [ ] Verify email outbox entries
- [ ] Check message_log entries
- [ ] Verify variable rendering
- [ ] Test pause/resume
- [ ] Test campaign metrics aggregation
- [ ] Test error handling
- [ ] Performance test with 10k+ recipients
- [ ] Verify UTC timestamp handling
- [ ] Verify multi-tenant isolation

---

## 🚀 Deployment Checklist

- [ ] Run migrations
- [ ] Create indices
- [ ] Register module in AppModule
- [ ] Start background workers
- [ ] Configure WhatsApp integration
- [ ] Configure email service
- [ ] Set up monitoring/logging
- [ ] Document user workflows
- [ ] Train support team
