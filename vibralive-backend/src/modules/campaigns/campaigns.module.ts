import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

// Entities
import {
  CampaignTemplate,
  Campaign,
  CampaignRecipient,
  EmailOutbox,
  Client,
  Pet,
  Clinic,
} from '@/database/entities';

// Services
import {
  CampaignService,
  CampaignTemplateService,
  CampaignFilterService,
  CampaignSchedulerService,
  CampaignAnalyticsService,
} from './services';

// Repositories
import {
  CampaignTemplateRepository,
  CampaignRepository,
  CampaignRecipientRepository,
  EmailOutboxRepository,
} from './repositories';

// Controllers
import {
  CampaignController,
  CampaignTemplateController,
} from './controllers';

// Shared services
import { TemplateRendererService } from '@/shared/services/template-renderer.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CampaignTemplate,
      Campaign,
      CampaignRecipient,
      EmailOutbox,
      Client,
      Pet,
      Clinic,
    ]),
    ScheduleModule.forRoot(),
  ],
  providers: [
    // Repositories
    CampaignTemplateRepository,
    CampaignRepository,
    CampaignRecipientRepository,
    EmailOutboxRepository,

    // Services
    CampaignService,
    CampaignTemplateService,
    CampaignFilterService,
    CampaignSchedulerService,
    CampaignAnalyticsService,

    // Shared services
    TemplateRendererService,
  ],
  controllers: [CampaignController, CampaignTemplateController],
  exports: [
    CampaignService,
    CampaignTemplateService,
    CampaignFilterService,
    CampaignSchedulerService,
    CampaignAnalyticsService,
    TemplateRendererService,
  ],
})
export class CampaignsModule {}
