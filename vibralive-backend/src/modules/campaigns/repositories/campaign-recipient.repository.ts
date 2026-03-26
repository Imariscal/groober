import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CampaignRecipient, RecipientStatus } from '@/database/entities/campaign-recipient.entity';

export interface RecipientQueryOptions {
  status?: RecipientStatus;
  page?: number;
  limit?: number;
}

@Injectable()
export class CampaignRecipientRepository {
  constructor(
    @InjectRepository(CampaignRecipient)
    private repo: Repository<CampaignRecipient>,
  ) {}

  async findById(id: string): Promise<CampaignRecipient | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['campaign', 'clinic', 'client', 'pet', 'messageLog'],
    });
  }

  async findByCampaign(
    campaignId: string,
    options?: RecipientQueryOptions,
  ): Promise<[CampaignRecipient[], number]> {
    const query = this.repo
      .createQueryBuilder('r')
      .where('r.campaignId = :campaignId', { campaignId });

    if (options?.status) {
      query.andWhere('r.status = :status', { status: options.status });
    }

    query.orderBy('r.createdAt', 'DESC');

    const page = options?.page || 1;
    const limit = options?.limit || 100;

    query.skip((page - 1) * limit).take(limit);

    return query.getManyAndCount();
  }

  async findByCampaignAndStatus(
    campaignId: string,
    status: RecipientStatus,
  ): Promise<CampaignRecipient[]> {
    return this.repo.find({
      where: { campaignId, status },
      order: { createdAt: 'DESC' },
    });
  }

  async findPendingByClinic(
    clinicId: string,
    limit: number = 100,
  ): Promise<CampaignRecipient[]> {
    return this.repo.find({
      where: { clinicId, status: RecipientStatus.PENDING },
      order: { createdAt: 'ASC' },
      take: limit,
    });
  }

  async countByCampaignAndStatus(
    campaignId: string,
    status?: RecipientStatus,
  ): Promise<number> {
    const query = this.repo
      .createQueryBuilder('r')
      .where('r.campaignId = :campaignId', { campaignId });

    if (status) {
      query.andWhere('r.status = :status', { status });
    }

    return query.getCount();
  }

  /**
   * Alias for countByCampaignAndStatus with simplified naming
   */
  async countByStatus(
    campaignId: string,
    status: RecipientStatus,
  ): Promise<number> {
    return this.countByCampaignAndStatus(campaignId, status);
  }

  async countByDeliveryStatus(campaignId: string): Promise<
    Record<RecipientStatus, number>
  > {
    const query = this.repo
      .createQueryBuilder('r')
      .select('r.status', 'status')
      .addSelect('COUNT(r.id)', 'count')
      .where('r.campaignId = :campaignId', { campaignId })
      .groupBy('r.status');

    const results = await query.getRawMany();

    return {
      [RecipientStatus.PENDING]: results.find((r) => r.status === RecipientStatus.PENDING)?.count || 0,
      [RecipientStatus.QUEUED]: results.find((r) => r.status === RecipientStatus.QUEUED)?.count || 0,
      [RecipientStatus.SENT]: results.find((r) => r.status === RecipientStatus.SENT)?.count || 0,
      [RecipientStatus.DELIVERED]: results.find((r) => r.status === RecipientStatus.DELIVERED)?.count || 0,
      [RecipientStatus.READ]: results.find((r) => r.status === RecipientStatus.READ)?.count || 0,
      [RecipientStatus.OPENED]: results.find((r) => r.status === RecipientStatus.OPENED)?.count || 0,
      [RecipientStatus.FAILED]: results.find((r) => r.status === RecipientStatus.FAILED)?.count || 0,
      [RecipientStatus.SKIPPED]: results.find((r) => r.status === RecipientStatus.SKIPPED)?.count || 0,
    } as Record<RecipientStatus, number>;
  }

  async create(recipient: Partial<CampaignRecipient>): Promise<CampaignRecipient> {
    return this.repo.save(this.repo.create(recipient));
  }

  async createMany(
    recipients: Partial<CampaignRecipient>[],
  ): Promise<CampaignRecipient[]> {
    return this.repo.save(recipients.map((r) => this.repo.create(r)));
  }

  async update(
    id: string,
    updates: Partial<CampaignRecipient>,
  ): Promise<CampaignRecipient> {
    await this.repo.update(id, updates);
    const updated = await this.findById(id);
    if (!updated) throw new Error('Recipient not found after update');
    return updated;
  }

  async updateStatus(
    id: string,
    status: RecipientStatus,
    metadata?: Record<string, any>,
  ): Promise<CampaignRecipient> {
    const updates: Partial<CampaignRecipient> = { status } as Partial<CampaignRecipient>;

    if (status === RecipientStatus.SENT) {
      updates.sentAt = new Date();
    } else if (status === RecipientStatus.DELIVERED) {
      updates.deliveredAt = new Date();
    } else if (status === RecipientStatus.READ) {
      updates.readAt = new Date();
    } else if (status === RecipientStatus.OPENED) {
      updates.openedAt = new Date();
    } else if (status === RecipientStatus.FAILED) {
      updates.failedAt = new Date();
    }

    if (metadata) {
      if (metadata.errorCode) {
        updates.errorCode = metadata.errorCode as string;
      }
      if (metadata.errorMessage) {
        updates.errorMessage = metadata.errorMessage as string;
      }
    }

    return this.update(id, updates);
  }

  async deleteAllForCampaign(campaignId: string): Promise<number> {
    const result = await this.repo.delete({ campaignId });
    return result.affected || 0;
  }
}
