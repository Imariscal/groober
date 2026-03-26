import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { CampaignTemplate } from '@/database/entities/campaign-template.entity';
import { CampaignChannel } from '@/database/entities/campaign-template.entity';

@Injectable()
export class CampaignTemplateRepository {
  constructor(
    @InjectRepository(CampaignTemplate)
    private repo: Repository<CampaignTemplate>,
  ) {}

  async findById(id: string): Promise<CampaignTemplate | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['clinic', 'createdBy'],
    });
  }

  async findByClinicId(
    clinicId: string,
    filters?: { channel?: CampaignChannel; isActive?: boolean },
  ): Promise<CampaignTemplate[]> {
    const query = this.repo
      .createQueryBuilder('t')
      .where('t.clinicId = :clinicId', { clinicId })
      .orderBy('t.createdAt', 'DESC');

    if (filters?.channel) {
      query.andWhere('t.channel = :channel', { channel: filters.channel });
    }

    if (filters?.isActive !== undefined) {
      query.andWhere('t.isActive = :isActive', { isActive: filters.isActive });
    }

    return query.getMany();
  }

  async findActiveTemplatesByClinic(clinicId: string): Promise<CampaignTemplate[]> {
    return this.repo.find({
      where: { clinicId, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async create(template: Partial<CampaignTemplate>): Promise<CampaignTemplate> {
    return this.repo.save(this.repo.create(template));
  }

  async update(
    id: string,
    updates: Partial<CampaignTemplate>,
  ): Promise<CampaignTemplate> {
    await this.repo.update(id, updates);
    const updated = await this.findById(id);
    if (!updated) throw new Error('Template not found after update');
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repo.delete(id);
    return result.affected ? result.affected > 0 : false;
  }

  async countByClinic(clinicId: string): Promise<number> {
    return this.repo.count({ where: { clinicId } });
  }
}
