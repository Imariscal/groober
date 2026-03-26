import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { PriceListHistory } from '@/database/entities';

@Injectable()
export class PriceListHistoryRepository extends Repository<PriceListHistory> {
  constructor(private dataSource: DataSource) {
    super(PriceListHistory, dataSource.createEntityManager());
  }

  async recordPriceChange(
    clinicId: string,
    priceListId: string,
    serviceId: string,
    newPrice: number,
    oldPrice?: number,
    changedByUserId?: string,
    reason?: string
  ): Promise<PriceListHistory> {
    const history = this.create({
      clinicId,
      priceListId,
      serviceId,
      oldPrice: oldPrice || null,
      newPrice,
      changedByUserId,
      reason,
    });
    return this.save(history);
  }

  async getServicePriceHistory(
    priceListId: string,
    serviceId: string,
    limit: number = 10
  ): Promise<PriceListHistory[]> {
    return this.find({
      where: { priceListId, serviceId },
      order: { changedAt: 'DESC' },
      take: limit,
    });
  }

  async getPriceListHistory(
    priceListId: string,
    limit: number = 50
  ): Promise<PriceListHistory[]> {
    return this.find({
      where: { priceListId },
      relations: ['service'],
      order: { changedAt: 'DESC' },
      take: limit,
    });
  }

  async getClinicPriceHistory(
    clinicId: string,
    limit: number = 50
  ): Promise<PriceListHistory[]> {
    return this.find({
      where: { clinicId },
      relations: ['priceList', 'service'],
      order: { changedAt: 'DESC' },
      take: limit,
    });
  }
}
