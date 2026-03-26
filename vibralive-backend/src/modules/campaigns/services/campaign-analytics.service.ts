import { Injectable } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common';
import { CampaignRepository } from '../repositories/campaign.repository';
import { CampaignRecipientRepository } from '../repositories/campaign-recipient.repository';
import { RecipientStatus } from '@/database/entities/campaign-recipient.entity';

/**
 * Campaign Analytics & Reporting Service
 * 
 * Provides detailed analytics and reporting for campaigns
 * - Recipient status breakdown
 * - Delivery metrics
 * - Engagement analytics
 */
@Injectable()
export class CampaignAnalyticsService {
  constructor(
    private readonly campaignRepo: CampaignRepository,
    private readonly recipientRepo: CampaignRecipientRepository,
  ) {}

  /**
   * Get recipient status breakdown for a campaign
   */
  async getRecipientStatusBreakdown(campaignId: string): Promise<{
    total: number;
    statusCounts: Record<string, number>;
    percentages: Record<string, number>;
  }> {
    const statusCounts = await this.recipientRepo.countByDeliveryStatus(campaignId);
    const total = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);

    if (total === 0) {
      return {
        total: 0,
        statusCounts: {} as Record<string, number>,
        percentages: {} as Record<string, number>,
      };
    }

    const percentages: Record<string, number> = {};
    Object.keys(statusCounts).forEach(status => {
      const count = statusCounts[status as keyof typeof statusCounts];
      percentages[status] = Number(((count / total) * 100).toFixed(2));
    });

    return {
      total,
      statusCounts: statusCounts as Record<string, number>,
      percentages,
    };
  }

  /**
   * Get detailed campaign metrics
   */
  async getCampaignMetrics(campaignId: string): Promise<{
    campaign: any; // Campaign entity
    delivery: {
      total: number;
      sent: number;
      delivered: number;
      failed: number;
      pending: number;
      skipped: number;
    };
    engagement: {
      opened: number;
      read: number;
      openRate: number;
      readRate: number;
    };
    statusBreakdown: Record<string, number>;
  }> {
    const campaign = await this.campaignRepo.findById(campaignId);
    if (!campaign) {
      throw new NotFoundException(`Campaign ${campaignId} not found`);
    }

    const statusCounts = await this.recipientRepo.countByDeliveryStatus(campaignId);
    const total = campaign.actualRecipients || 0;

    const sent = (statusCounts as any)[RecipientStatus.SENT] || 0;
    const delivered = (statusCounts as any)[RecipientStatus.DELIVERED] || 0;
    const failed = (statusCounts as any)[RecipientStatus.FAILED] || 0;
    const pending = (statusCounts as any)[RecipientStatus.PENDING] || 0;
    const skipped = (statusCounts as any)[RecipientStatus.SKIPPED] || 0;
    const opened = campaign.openedCount || 0;
    const read = campaign.readCount || 0;

    const openRate = total > 0 ? Number(((opened / total) * 100).toFixed(2)) : 0;
    const readRate = total > 0 ? Number(((read / total) * 100).toFixed(2)) : 0;

    return {
      campaign: {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        channel: campaign.channel,
        scheduledAt: campaign.scheduledAt,
        startedAt: campaign.startedAt,
        completedAt: campaign.completedAt,
      },
      delivery: {
        total,
        sent,
        delivered,
        failed,
        pending,
        skipped,
      },
      engagement: {
        opened,
        read,
        openRate,
        readRate,
      },
      statusBreakdown: statusCounts as Record<string, number>,
    };
  }

  /**
   * Get recipients list with pagination and filtering
   */
  async getRecipients(
    campaignId: string,
    options?: {
      status?: RecipientStatus;
      page?: number;
      limit?: number;
    },
  ): Promise<{
    data: any[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = options?.page || 1;
    const limit = options?.limit || 50;

    const [recipients, total] = await this.recipientRepo.findByCampaign(campaignId, {
      status: options?.status,
      page,
      limit,
    });

    return {
      data: recipients,
      total,
      page,
      limit,
    };
  }

  /**
   * Get recipients with specific status
   */
  async getRecipientsByStatus(
    campaignId: string,
    status: RecipientStatus,
    limit: number = 50,
  ): Promise<any[]> {
    const [recipients] = await this.recipientRepo.findByCampaign(campaignId, {
      status,
      limit,
    });
    return recipients;
  }

  /**
   * Compare metrics between campaigns
   */
  async compareCampaigns(campaignIds: string[]): Promise<
    Array<{
      campaignId: string;
      name: string;
      totalRecipients: number;
      sentCount: number;
      deliveredCount: number;
      failedCount: number;
      openRate: number;
      readRate: number;
    }>
  > {
    const comparisons = await Promise.all(
      campaignIds.map(async id => {
        const campaign = await this.campaignRepo.findById(id);
        if (!campaign) return null;

        const statusCounts = await this.recipientRepo.countByDeliveryStatus(id);
        const total = campaign.actualRecipients || 0;
        const sent = statusCounts[RecipientStatus.SENT] || 0;
        const delivered = statusCounts[RecipientStatus.DELIVERED] || 0;
        const failed = statusCounts[RecipientStatus.FAILED] || 0;
        const opened = campaign.openedCount || 0;
        const read = campaign.readCount || 0;

        return {
          campaignId: id,
          name: campaign.name,
          totalRecipients: total,
          sentCount: sent,
          deliveredCount: delivered,
          failedCount: failed,
          openRate: total > 0 ? Number(((opened / total) * 100).toFixed(2)) : 0,
          readRate: total > 0 ? Number(((read / total) * 100).toFixed(2)) : 0,
        };
      }),
    );

    return comparisons.filter(Boolean) as any[];
  }
}
