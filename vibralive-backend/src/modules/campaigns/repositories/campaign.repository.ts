import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Campaign, CampaignStatus, CampaignChannel } from '@/database/entities/campaign.entity';

export interface CampaignQueryOptions {
  status?: CampaignStatus;
  channel?: CampaignChannel;
  page?: number;
  limit?: number;
}

@Injectable()
export class CampaignRepository {
  constructor(
    @InjectRepository(Campaign)
    private repo: Repository<Campaign>,
  ) {}

  async findById(id: string): Promise<Campaign | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['clinic', 'template', 'createdBy', 'pausedBy'],
    });
  }

  async findByClinic(
    clinicId: string,
    options?: CampaignQueryOptions,
  ): Promise<[Campaign[], number]> {
    const query = this.repo
      .createQueryBuilder('c')
      .where('c.clinicId = :clinicId', { clinicId })
      .leftJoinAndSelect('c.template', 'template')
      .leftJoinAndSelect('c.createdBy', 'createdBy');

    if (options?.status) {
      query.andWhere('c.status = :status', { status: options.status });
    }

    if (options?.channel) {
      query.andWhere('c.channel = :channel', { channel: options.channel });
    }

    query.orderBy('c.createdAt', 'DESC');

    const page = options?.page || 1;
    const limit = options?.limit || 20;

    query.skip((page - 1) * limit).take(limit);

    return query.getManyAndCount();
  }

  async findScheduledCampaigns(beforeTime: Date): Promise<Campaign[]> {
    return this.repo
      .createQueryBuilder('c')
      .where('c.status = :status', { status: CampaignStatus.SCHEDULED })
      .andWhere('c.scheduledAt <= :beforeTime', { beforeTime })
      .orderBy('c.scheduledAt', 'ASC')
      .getMany();
  }

  /**
   * Find campaigns ready for scheduled execution
   * Alias for findScheduledCampaigns - used by scheduler service
   */
  async findScheduledForExecution(beforeTime: Date): Promise<Campaign[]> {
    return this.findScheduledCampaigns(beforeTime);
  }

  async findRunningCampaigns(clinicId?: string): Promise<Campaign[]> {
    const query = this.repo
      .createQueryBuilder('c')
      .where('c.status = :status', { status: CampaignStatus.RUNNING });

    if (clinicId) {
      query.andWhere('c.clinicId = :clinicId', { clinicId });
    }

    return query.getMany();
  }

  async create(campaign: Partial<Campaign>): Promise<Campaign> {
    return this.repo.save(this.repo.create(campaign));
  }

  async update(id: string, updates: Partial<Campaign>): Promise<Campaign> {
    await this.repo.update(id, updates);
    const updated = await this.findById(id);
    if (!updated) throw new Error('Campaign not found after update');
    return updated;
  }

  async updateStatus(id: string, status: CampaignStatus): Promise<Campaign> {
    return this.update(id, { status } as Partial<Campaign>);
  }

  async updateMetrics(
    id: string,
    metrics: {
      actualRecipients?: number;
      successfulCount?: number;
      failedCount?: number;
      skippedCount?: number;
      openedCount?: number;
      readCount?: number;
    },
  ): Promise<Campaign> {
    return this.update(id, metrics as Partial<Campaign>);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repo.delete(id);
    return result.affected ? result.affected > 0 : false;
  }

  async countByClinic(clinicId: string): Promise<number> {
    return this.repo.count({ where: { clinicId } as FindOptionsWhere<Campaign> });
  }

  async countByStatus(clinicId: string, status: CampaignStatus): Promise<number> {
    return this.repo.count({
      where: { clinicId, status } as FindOptionsWhere<Campaign>,
    });
  }
}
