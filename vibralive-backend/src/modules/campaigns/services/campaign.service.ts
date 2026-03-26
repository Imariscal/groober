import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { Campaign, CampaignStatus, RecurrenceType } from '@/database/entities/campaign.entity';
import { CampaignRecipient, RecipientStatus } from '@/database/entities/campaign-recipient.entity';
import { CreateCampaignDto, UpdateCampaignDto, CampaignFilterDto } from '../dtos';
import {
  CampaignRepository,
  CampaignTemplateRepository,
  CampaignRecipientRepository,
} from '../repositories';
import { CampaignFilterService, FilteredRecipient } from './campaign-filter.service';
import { CampaignTemplateService } from './campaign-template.service';
import { TemplateRendererService } from '@/shared/services/template-renderer.service';

@Injectable()
export class CampaignService {
  constructor(
    private readonly campaignRepo: CampaignRepository,
    private readonly templateService: CampaignTemplateService,
    private readonly filterService: CampaignFilterService,
    private readonly recipientRepo: CampaignRecipientRepository,
    private readonly renderer: TemplateRendererService,
  ) {}

  /**
   * Calculate next scheduled date for recurring campaigns
   */
  private calculateNextScheduledDate(
    baseDate: Date,
    recurrenceType: RecurrenceType,
    recurrenceInterval: number = 1,
    recurrenceEndDate?: Date,
  ): Date | null {
    const next = new Date(baseDate);

    switch (recurrenceType) {
      case RecurrenceType.DAILY:
        next.setDate(next.getDate() + recurrenceInterval);
        break;
      case RecurrenceType.WEEKLY:
        next.setDate(next.getDate() + 7 * recurrenceInterval);
        break;
      case RecurrenceType.MONTHLY:
        next.setMonth(next.getMonth() + recurrenceInterval);
        break;
      case RecurrenceType.ONCE:
      default:
        return null; // No next scheduled date for one-time campaigns
    }

    // Check if nextScheduledDate exceeds recurrenceEndDate
    if (recurrenceEndDate && next > recurrenceEndDate) {
      return null; // No more occurrences
    }

    return next;
  }

  /**
   * Get campaign by ID with authorization check
   */
  async getCampaign(clinicId: string, campaignId: string): Promise<Campaign> {
    const campaign = await this.campaignRepo.findById(campaignId);

    if (!campaign) {
      throw new NotFoundException(`Campaign ${campaignId} not found`);
    }

    if (campaign.clinicId !== clinicId) {
      throw new ForbiddenException('Cannot access campaign from another clinic');
    }

    return campaign;
  }

  /**
   * List campaigns for clinic with filters
   */
  async listCampaigns(
    clinicId: string,
    options?: { status?: CampaignStatus; page?: number; limit?: number },
  ): Promise<{ data: Campaign[]; total: number }> {
    const [campaigns, total] = await this.campaignRepo.findByClinic(
      clinicId,
      options,
    );
    return { data: campaigns, total };
  }

  /**
   * Create new campaign
   */
  async createCampaign(
    clinicId: string,
    createdByUserId: string,
    dto: CreateCampaignDto,
  ): Promise<Campaign> {
    // Validate template exists and belongs to clinic
    const template = await this.templateService.getTemplate(
      clinicId,
      dto.campaignTemplateId,
    );

    if (!template.isActive) {
      throw new BadRequestException('Cannot use inactive template');
    }

    // Validate filter
    const filterValidation = this.filterService.validateFilter(dto.filter);
    if (!filterValidation.valid) {
      throw new BadRequestException(`Invalid filter: ${filterValidation.errors.join(', ')}`);
    }

    // Calculate estimated audience
    const estimatedRecipients = await this.filterService.estimateAudience(
      clinicId,
      dto.filter,
    );

    if (estimatedRecipients === 0) {
      throw new BadRequestException('No recipients match the specified filter');
    }

    // Calculate next scheduled date if recurring
    let nextScheduledAt: Date | undefined = undefined;
    if (dto.isRecurring && dto.recurrenceType && dto.recurrenceType !== RecurrenceType.ONCE) {
      const baseDate = dto.scheduledAt ? new Date(dto.scheduledAt) : new Date();
      const nextDate = this.calculateNextScheduledDate(
        baseDate,
        dto.recurrenceType,
        dto.recurrenceInterval || 1,
        dto.recurrenceEndDate ? new Date(dto.recurrenceEndDate) : undefined,
      );
      nextScheduledAt = nextDate || undefined;
    }

    // Create campaign
    const campaign = await this.campaignRepo.create({
      clinicId,
      createdByUserId,
      name: dto.name,
      description: dto.description,
      channel: dto.channel,
      campaignTemplateId: dto.campaignTemplateId,
      status: CampaignStatus.DRAFT,
      filtersJson: dto.filter,
      estimatedRecipients,
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
      isRecurring: dto.isRecurring || false,
      recurrenceType: dto.recurrenceType || RecurrenceType.ONCE,
      recurrenceInterval: dto.recurrenceInterval || 1,
      recurrenceEndDate: dto.recurrenceEndDate ? new Date(dto.recurrenceEndDate) : undefined,
      nextScheduledAt,
    });

    return campaign;
  }

  /**
   * Update campaign (only allowed in DRAFT status)
   */
  async updateCampaign(
    clinicId: string,
    campaignId: string,
    dto: UpdateCampaignDto,
  ): Promise<Campaign> {
    const campaign = await this.getCampaign(clinicId, campaignId);

    if (campaign.status !== CampaignStatus.DRAFT) {
      throw new ConflictException('Can only update campaigns in DRAFT status');
    }

    // If filters changed, recalculate estimated audience
    let updates: Partial<Campaign> = {
      name: dto.name,
      description: dto.description,
      filtersJson: dto.filter,
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
      isRecurring: dto.isRecurring !== undefined ? dto.isRecurring : campaign.isRecurring,
      recurrenceType: dto.recurrenceType || campaign.recurrenceType,
      recurrenceInterval: dto.recurrenceInterval !== undefined ? dto.recurrenceInterval : campaign.recurrenceInterval,
      recurrenceEndDate: dto.recurrenceEndDate ? new Date(dto.recurrenceEndDate) : (campaign.recurrenceEndDate || undefined),
    };

    if (dto.filter && JSON.stringify(dto.filter) !== JSON.stringify(campaign.filtersJson)) {
      const filterValidation = this.filterService.validateFilter(dto.filter);
      if (!filterValidation.valid) {
        throw new BadRequestException(
          `Invalid filter: ${filterValidation.errors.join(', ')}`,
        );
      }

      const estimatedRecipients = await this.filterService.estimateAudience(
        clinicId,
        dto.filter,
      );

      if (estimatedRecipients === 0) {
        throw new BadRequestException(
          'No recipients match the updated filter',
        );
      }

      updates.estimatedRecipients = estimatedRecipients;
    }

    // Recalculate nextScheduledAt if recurrence settings changed
    if (
      (dto.isRecurring !== undefined || dto.recurrenceType || dto.recurrenceInterval !== undefined || dto.recurrenceEndDate)
    ) {
      const isRecurring = dto.isRecurring !== undefined ? dto.isRecurring : campaign.isRecurring;
      const recurrenceType = dto.recurrenceType || campaign.recurrenceType;
      const baseDate = dto.scheduledAt ? new Date(dto.scheduledAt) : (campaign.scheduledAt || new Date());

      if (isRecurring && recurrenceType !== RecurrenceType.ONCE) {
        const nextDate = this.calculateNextScheduledDate(
          baseDate,
          recurrenceType,
          dto.recurrenceInterval !== undefined ? dto.recurrenceInterval : campaign.recurrenceInterval,
          dto.recurrenceEndDate ? new Date(dto.recurrenceEndDate) : campaign.recurrenceEndDate,
        );
        updates.nextScheduledAt = nextDate || undefined;
      } else {
        updates.nextScheduledAt = undefined;
      }
    }

    return this.campaignRepo.update(campaignId, updates);
  }

  /**
   * Schedule campaign for execution
   * Transitions from DRAFT → SCHEDULED
   */
  async scheduleCampaign(
    clinicId: string,
    campaignId: string,
    scheduledAt?: Date,
  ): Promise<Campaign> {
    const campaign = await this.getCampaign(clinicId, campaignId);

    if (campaign.status !== CampaignStatus.DRAFT) {
      throw new ConflictException(
        'Can only schedule campaigns in DRAFT status',
      );
    }

    // Must have recipients generated or be able to generate them
    if (campaign.estimatedRecipients === 0) {
      throw new BadRequestException(
        'Campaign has no estimated recipients. Cannot schedule.',
      );
    }

    const scheduledTime = scheduledAt || new Date();

    return this.campaignRepo.update(campaignId, {
      status: CampaignStatus.SCHEDULED,
      scheduledAt: scheduledTime,
    } as Partial<Campaign>);
  }

  /**
   * Generate recipients for campaign
   * Creates individual campaign_recipient records
   * IMPORTANT: Must be called before execution
   */
  async generateRecipients(
    clinicId: string,
    campaignId: string,
  ): Promise<{ count: number; errors: string[] }> {
    const campaign = await this.getCampaign(clinicId, campaignId);
    const errors: string[] = [];

    try {
      // Fetch all recipients in batches
      const pageSize = 1000;
      let page = 1;
      let totalGenerated = 0;

      while (true) {
        const recipients: FilteredRecipient[] = await this.filterService.getRecipients(
          clinicId,
          campaign.filtersJson as CampaignFilterDto,
          page,
          pageSize,
        );

        if (recipients.length === 0) break;

        // Convert to campaign_recipient records
        const recipientRecords: Partial<CampaignRecipient>[] = recipients.map(
          (r) => ({
            campaignId,
            clinicId,
            clientId: r.clientId,
            petId: r.petId,
            channel: campaign.channel,
            recipientName: r.clientName,
            recipientEmail: r.clientEmail,
            recipientPhone: r.clientPhone,
            status: RecipientStatus.PENDING,
          }),
        );

        await this.recipientRepo.createMany(recipientRecords as any);
        totalGenerated += recipients.length;
        page++;
      }

      // Update campaign with actual recipient count
      await this.campaignRepo.updateMetrics(campaignId, {
        actualRecipients: totalGenerated,
      });

      return { count: totalGenerated, errors };
    } catch (error) {
      const errorMsg = (error as Error).message;
      errors.push(errorMsg);
      throw new BadRequestException(
        `Failed to generate recipients: ${errorMsg}`,
      );
    }
  }

  /**
   * Start campaign execution
   * Transitions from SCHEDULED/DRAFT → RUNNING
   */
  async startCampaign(clinicId: string, campaignId: string): Promise<Campaign> {
    const campaign = await this.getCampaign(clinicId, campaignId);

    if (
      campaign.status !== CampaignStatus.DRAFT &&
      campaign.status !== CampaignStatus.SCHEDULED
    ) {
      throw new ConflictException(
        `Cannot start campaign in ${campaign.status} status`,
      );
    }

    // Ensure recipients are generated
    const recipientCount = await this.recipientRepo.countByCampaignAndStatus(
      campaignId,
    );
    if (recipientCount === 0) {
      // Auto-generate recipients if not done yet
      await this.generateRecipients(clinicId, campaignId);
    }

    // Update lastSentAt and calculate nextScheduledAt if recurring
    let updates: Partial<Campaign> = {
      status: CampaignStatus.RUNNING,
      startedAt: new Date(),
      lastSentAt: new Date(),
    };

    // If recurring, calculate next scheduled date
    if (campaign.isRecurring && campaign.recurrenceType !== RecurrenceType.ONCE) {
      const baseDate = new Date();
      const nextDate = this.calculateNextScheduledDate(
        baseDate,
        campaign.recurrenceType,
        campaign.recurrenceInterval || 1,
        campaign.recurrenceEndDate,
      );
      updates.nextScheduledAt = nextDate || undefined;
    }

    return this.campaignRepo.update(campaignId, updates);
  }

  /**
   * Pause a running campaign
   */
  async pauseCampaign(
    clinicId: string,
    campaignId: string,
    pausedByUserId: string,
  ): Promise<Campaign> {
    const campaign = await this.getCampaign(clinicId, campaignId);

    if (campaign.status !== CampaignStatus.RUNNING) {
      throw new ConflictException(
        `Can only pause campaigns in RUNNING status`,
      );
    }

    return this.campaignRepo.update(campaignId, {
      status: CampaignStatus.PAUSED,
      pausedByUserId,
      pausedAt: new Date(),
    } as Partial<Campaign>);
  }

  /**
   * Resume a paused campaign
   */
  async resumeCampaign(clinicId: string, campaignId: string): Promise<Campaign> {
    const campaign = await this.getCampaign(clinicId, campaignId);

    if (campaign.status !== CampaignStatus.PAUSED) {
      throw new ConflictException(
        'Can only resume paused campaigns',
      );
    }

    return this.campaignRepo.update(campaignId, {
      status: CampaignStatus.RUNNING,
      pausedByUserId: undefined,
      pausedAt: undefined,
    } as Partial<Campaign>);
  }

  /**
   * Cancel campaign
   * Allowed from any status except COMPLETED
   */
  async cancelCampaign(
    clinicId: string,
    campaignId: string,
    reason: string,
  ): Promise<Campaign> {
    const campaign = await this.getCampaign(clinicId, campaignId);

    if (campaign.status === CampaignStatus.COMPLETED) {
      throw new ConflictException('Cannot cancel completed campaigns');
    }

    return this.campaignRepo.update(campaignId, {
      status: CampaignStatus.CANCELLED,
    } as Partial<Campaign>);
  }

  /**
   * Delete campaign
   * Only allowed for DRAFT campaigns
   */
  async deleteCampaign(clinicId: string, campaignId: string): Promise<void> {
    const campaign = await this.getCampaign(clinicId, campaignId);

    if (campaign.status !== CampaignStatus.DRAFT) {
      throw new ConflictException(
        'Can only delete campaigns in DRAFT status',
      );
    }

    // Delete recipients first
    await this.recipientRepo.deleteAllForCampaign(campaignId);

    const deleted = await this.campaignRepo.delete(campaignId);
    if (!deleted) {
      throw new NotFoundException('Campaign not found for deletion');
    }
  }

  /**
   * Get campaign metrics/analytics
   */
  async getCampaignMetrics(
    clinicId: string,
    campaignId: string,
  ): Promise<{
    campaign: Campaign;
    deliveryStats: Record<string, number>;
    conversionRate: number;
    openRate: number;
  }> {
    const campaign = await this.getCampaign(clinicId, campaignId);
    const deliveryStats = await this.recipientRepo.countByDeliveryStatus(
      campaignId,
    );

    const openRate =
      campaign.actualRecipients > 0
        ? (campaign.openedCount / campaign.actualRecipients) * 100
        : 0;

    const conversionRate =
      campaign.actualRecipients > 0
        ? (campaign.readCount / campaign.actualRecipients) * 100
        : 0;

    return {
      campaign,
      deliveryStats,
      openRate,
      conversionRate,
    };
  }

  /**
   * Preview recipients who will receive campaign
   */
  async previewRecipients(
    clinicId: string,
    campaignId: string,
    limit: number = 50,
  ): Promise<CampaignRecipient[]> {
    const campaign = await this.getCampaign(clinicId, campaignId);

    const [recipients] = await this.recipientRepo.findByCampaign(
      campaignId,
      { limit },
    );

    return recipients;
  }

  /**
   * Complete or reschedule a campaign after execution
   * Called when a campaign finishes sending all messages
   * 
   * If recurring and nextScheduledAt exists:
   *   - Update status to SCHEDULED (for next execution)
   * If not recurring or no nextScheduledAt:
   *   - Update status to COMPLETED
   */
  async completeCampaignExecution(
    clinicId: string,
    campaignId: string,
  ): Promise<Campaign> {
    const campaign = await this.getCampaign(clinicId, campaignId);

    if (campaign.status !== CampaignStatus.RUNNING) {
      throw new ConflictException(
        'Campaign must be in RUNNING status to complete execution',
      );
    }

    // Check if campaign is recurring and has a next scheduled date
    if (
      campaign.isRecurring &&
      campaign.nextScheduledAt &&
      campaign.recurrenceType !== RecurrenceType.ONCE
    ) {
      // Campaign will run again - transition to SCHEDULED
      const updates: Partial<Campaign> = {
        status: CampaignStatus.SCHEDULED,
        scheduledAt: campaign.nextScheduledAt,
      };

      return this.campaignRepo.update(campaignId, updates);
    } else {
      // Campaign won't run again - mark as completed
      const updates: Partial<Campaign> = {
        status: CampaignStatus.COMPLETED,
        completedAt: new Date(),
      };

      return this.campaignRepo.update(campaignId, updates);
    }
  }

  /**
   * Check if campaign execution is complete
   * Compares pending recipients count vs total
   */
  async isCampaignExecutionComplete(campaignId: string): Promise<boolean> {
    const pendingCount = await this.recipientRepo.countByStatus(
      campaignId,
      RecipientStatus.PENDING,
    );

    // If no pending recipients, execution is complete
    return pendingCount === 0;
  }

  /**
   * Get campaign execution progress
   */
  async getCampaignExecutionProgress(campaignId: string): Promise<{
    total: number;
    pending: number;
    sent: number;
    delivered: number;
    failed: number;
    skipped: number;
    percentage: number;
  }> {
    const campaign = await this.campaignRepo.findById(campaignId);
    if (!campaign) {
      throw new NotFoundException(`Campaign ${campaignId} not found`);
    }

    const statusCounts = await this.recipientRepo.countByDeliveryStatus(campaignId);
    const total = campaign.actualRecipients || 0;
    const pending = statusCounts[RecipientStatus.PENDING] || 0;
    const sent = statusCounts[RecipientStatus.SENT] || 0;
    const delivered = statusCounts[RecipientStatus.DELIVERED] || 0;
    const failed = statusCounts[RecipientStatus.FAILED] || 0;
    const skipped = statusCounts[RecipientStatus.SKIPPED] || 0;

    const processed = total - pending;
    const percentage = total > 0 ? Math.round((processed / total) * 100) : 0;

    return {
      total,
      pending,
      sent,
      delivered,
      failed,
      skipped,
      percentage,
    };
  }
}

