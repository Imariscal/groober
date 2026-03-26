import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CampaignRepository } from '../repositories/campaign.repository';
import { CampaignService } from './campaign.service';
import { CampaignStatus } from '@/database/entities/campaign.entity';

/**
 * Campaign Scheduler Service
 * 
 * Handles automatic execution of scheduled campaigns
 * - Runs every minute to check for campaigns that should be executed
 * - Executes campaigns whose scheduledAt time has arrived
 * - Handles error handling and logging
 */
@Injectable()
export class CampaignSchedulerService {
  private readonly logger = new Logger(CampaignSchedulerService.name);

  constructor(
    private readonly campaignRepo: CampaignRepository,
    private readonly campaignService: CampaignService,
  ) {}

  /**
   * Check and execute scheduled campaigns
   * Runs every minute: at the start of each minute (00 seconds)
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async executeScheduledCampaigns(): Promise<void> {
    try {
      const now = new Date();
      
      // Find all campaigns with SCHEDULED status and scheduledAt <= now
      const scheduledCampaigns = await this.campaignRepo.findScheduledForExecution(now);

      if (scheduledCampaigns.length === 0) {
        // No campaigns to execute, silent return
        return;
      }

      this.logger.log(
        `Found ${scheduledCampaigns.length} campaign(s) ready for execution`,
      );

      // Execute each campaign
      const results = await Promise.allSettled(
        scheduledCampaigns.map(campaign =>
          this._executeScheduledCampaign(campaign.id, campaign.clinicId),
        ),
      );

      // Log results
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      this.logger.log(
        `Campaign execution batch completed: ${successful} successful, ${failed} failed`,
      );

      // Log failures
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const campaign = scheduledCampaigns[index];
          this.logger.error(
            `Failed to execute campaign ${campaign.id}: ${result.reason?.message}`,
          );
        }
      });
    } catch (error) {
      this.logger.error(
        `Error in campaign scheduler: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Execute a single scheduled campaign
   * Private method to handle individual campaign execution
   */
  private async _executeScheduledCampaign(
    campaignId: string,
    clinicId: string,
  ): Promise<void> {
    try {
      const campaign = await this.campaignRepo.findById(campaignId);

      if (!campaign) {
        this.logger.warn(`Campaign ${campaignId} not found for execution`);
        return;
      }

      // Double-check status hasn't changed
      if (campaign.status !== CampaignStatus.SCHEDULED) {
        this.logger.debug(
          `Campaign ${campaignId} status is ${campaign.status}, skipping auto-execution`,
        );
        return;
      }

      // Execute the campaign
      this.logger.log(`Auto-executing campaign: ${campaignId} (${campaign.name})`);
      await this.campaignService.startCampaign(clinicId, campaignId);
      this.logger.log(`Campaign ${campaignId} auto-executed successfully`);
    } catch (error) {
      throw new Error(
        `Failed to auto-execute campaign ${campaignId}: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Manual trigger for testing
   * Can be called directly via API endpoint
   */
  async triggerScheduledCampaignCheck(): Promise<{
    executedCount: number;
    errors: Array<{ campaignId: string; error: string }>;
  }> {
    const errors: Array<{ campaignId: string; error: string }> = [];
    let executedCount = 0;

    try {
      const now = new Date();
      const scheduledCampaigns = await this.campaignRepo.findScheduledForExecution(now);

      for (const campaign of scheduledCampaigns) {
        try {
          await this._executeScheduledCampaign(campaign.id, campaign.clinicId);
          executedCount++;
        } catch (error) {
          errors.push({
            campaignId: campaign.id,
            error: (error as Error).message,
          });
        }
      }

      return { executedCount, errors };
    } catch (error) {
      throw new Error(
        `Campaign scheduler check failed: ${(error as Error).message}`,
      );
    }
  }
}
