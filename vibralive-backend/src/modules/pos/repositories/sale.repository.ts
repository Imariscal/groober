import { Injectable } from '@nestjs/common';
import { Repository, Between } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Sale } from '../../../database/entities/sale.entity';

@Injectable()
export class SaleRepository {
  constructor(
    @InjectRepository(Sale)
    private readonly repo: Repository<Sale>,
  ) {}

  async create(data: Partial<Sale>): Promise<Sale> {
    return this.repo.save(this.repo.create(data));
  }

  async findById(saleId: string, clinicId?: string): Promise<Sale | null> {
    const query = this.repo
      .createQueryBuilder('s')
      .where('s.id = :saleId', { saleId })
      .leftJoinAndSelect('s.client', 'client')
      .leftJoinAndSelect('s.items', 'items')
      .leftJoinAndSelect('items.saleProduct', 'saleProduct')
      .leftJoinAndSelect('s.payments', 'payments')
      .leftJoinAndSelect('s.appointment', 'appointment');

    if (clinicId) {
      query.andWhere('s.clinicId = :clinicId', { clinicId });
    }

    return query.getOne();
  }

  async findByClinic(
    clinicId: string,
    filters: {
      saleType?: string;
      status?: string;
      clientId?: string;
      dateFrom?: Date;
      dateTo?: Date;
      page?: number;
      limit?: number;
    } = {},
  ): Promise<[Sale[], number]> {
    const query = this.repo
      .createQueryBuilder('s')
      .where('s.clinicId = :clinicId', { clinicId })
      .leftJoinAndSelect('s.client', 'client')
      .leftJoinAndSelect('s.items', 'items')
      .leftJoinAndSelect('items.saleProduct', 'saleProduct')
      .leftJoinAndSelect('s.payments', 'payments');

    if (filters.saleType) {
      query.andWhere('s.saleType = :saleType', { saleType: filters.saleType });
    }
    if (filters.status) {
      const statuses = filters.status.split(',').map(s => s.trim());
      query.andWhere('s.status IN (:...statuses)', { statuses });
    }
    if (filters.clientId) {
      query.andWhere('s.clientId = :clientId', { clientId: filters.clientId });
    }
    if (filters.dateFrom) {
      query.andWhere('s.createdAt >= :dateFrom', { dateFrom: filters.dateFrom });
    }
    if (filters.dateTo) {
      query.andWhere('s.createdAt <= :dateTo', { dateTo: filters.dateTo });
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;

    query
      .orderBy('s.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    return query.getManyAndCount();
  }

  async findByStatus(clinicId: string, status: string): Promise<Sale[]> {
    return this.repo
      .createQueryBuilder('s')
      .where('s.clinicId = :clinicId', { clinicId })
      .andWhere('s.status = :status', { status })
      .leftJoinAndSelect('s.client', 'client')
      .leftJoinAndSelect('s.items', 'items')
      .orderBy('s.createdAt', 'DESC')
      .getMany();
  }

  async findSalesByDateRange(
    clinicId: string,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<Sale[]> {
    return this.repo
      .createQueryBuilder('s')
      .where('s.clinicId = :clinicId', { clinicId })
      .andWhere('s.createdAt BETWEEN :dateFrom AND :dateTo', { dateFrom, dateTo })
      .andWhere("s.status IN ('COMPLETED', 'REFUNDED')")
      .leftJoinAndSelect('s.client', 'client')
      .leftJoinAndSelect('s.items', 'items')
      .leftJoinAndSelect('items.saleProduct', 'saleProduct')
      .leftJoinAndSelect('s.payments', 'payments')
      .orderBy('s.createdAt', 'DESC')
      .getMany();
  }

  async calculateRevenue(
    clinicId: string,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<{ total: number; count: number }> {
    const result = await this.repo
      .createQueryBuilder('s')
      .select('SUM(s.totalAmount)', 'total')
      .addSelect('COUNT(s.id)', 'count')
      .where('s.clinicId = :clinicId', { clinicId })
      .andWhere('s.createdAt BETWEEN :dateFrom AND :dateTo', { dateFrom, dateTo })
      .andWhere("s.status IN ('COMPLETED', 'REFUNDED')")
      .getRawOne();

    return {
      total: parseFloat(result?.total || 0),
      count: parseInt(result?.count || 0),
    };
  }

  async updateStatus(saleId: string, status: string): Promise<void> {
    await this.repo.update({ id: saleId }, { status: status as 'COMPLETED' | 'CANCELLED' | 'DRAFT' | 'REFUNDED' });
  }

  async save(sale: Sale): Promise<Sale> {
    return this.repo.save(sale);
  }

  async delete(saleId: string): Promise<void> {
    await this.repo.delete({ id: saleId });
  }

  async findDraftSalesForClient(clientId: string): Promise<Sale[]> {
    return this.repo
      .createQueryBuilder('s')
      .where('s.clientId = :clientId', { clientId })
      .andWhere("s.status = 'DRAFT'")
      .leftJoinAndSelect('s.items', 'items')
      .leftJoinAndSelect('items.saleProduct', 'saleProduct')
      .getMany();
  }
}
