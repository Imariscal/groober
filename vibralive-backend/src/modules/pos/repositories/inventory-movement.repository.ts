import { Injectable } from '@nestjs/common';
import { Repository, Between } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { InventoryMovement } from '../../../database/entities/inventory-movement.entity';

@Injectable()
export class InventoryMovementRepository {
  constructor(
    @InjectRepository(InventoryMovement)
    private readonly repo: Repository<InventoryMovement>,
  ) {}

  async create(data: Partial<InventoryMovement>): Promise<InventoryMovement> {
    return this.repo.save(this.repo.create(data));
  }

  async findMovementHistory(
    clinicId: string,
    filters: {
      productId?: string;
      movementType?: string;
      dateFrom?: Date;
      dateTo?: Date;
      page?: number;
      limit?: number;
    } = {},
  ): Promise<[InventoryMovement[], number]> {
    const query = this.repo
      .createQueryBuilder('m')
      .innerJoin('m.saleProduct', 'product')
      .where('product.clinicId = :clinicId', { clinicId })
      .leftJoinAndSelect('m.saleProduct', 'saleProduct')
      .leftJoinAndSelect('m.sale', 'sale')
      .leftJoinAndSelect('m.saleItem', 'saleItem');

    if (filters.productId) {
      query.andWhere('m.saleProductId = :productId', { productId: filters.productId });
    }
    if (filters.movementType) {
      query.andWhere('m.movementType = :movementType', {
        movementType: filters.movementType,
      });
    }
    if (filters.dateFrom) {
      query.andWhere('m.createdAt >= :dateFrom', { dateFrom: filters.dateFrom });
    }
    if (filters.dateTo) {
      query.andWhere('m.createdAt <= :dateTo', { dateTo: filters.dateTo });
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;

    query
      .orderBy('m.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    return query.getManyAndCount();
  }

  async findProductMovements(
    productId: string,
    limit: number = 100,
  ): Promise<InventoryMovement[]> {
    return this.repo
      .createQueryBuilder('m')
      .where('m.saleProductId = :productId', { productId })
      .leftJoinAndSelect('m.sale', 'sale')
      .leftJoinAndSelect('m.saleItem', 'saleItem')
      .orderBy('m.createdAt', 'DESC')
      .limit(limit)
      .getMany();
  }

  async calculateBalance(productId: string): Promise<number> {
    const result = await this.repo
      .createQueryBuilder('m')
      .select('SUM(m.quantity)', 'balance')
      .where('m.saleProductId = :productId', { productId })
      .getRawOne();

    return parseInt(result?.balance || 0);
  }

  async findByTypeAndProduct(
    productId: string,
    movementType: string,
  ): Promise<InventoryMovement[]> {
    return this.repo
      .createQueryBuilder('m')
      .where('m.saleProductId = :productId', { productId })
      .andWhere('m.movementType = :movementType', { movementType })
      .orderBy('m.createdAt', 'DESC')
      .getMany();
  }

  async findByDateRange(
    clinicId: string,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<InventoryMovement[]> {
    return this.repo
      .createQueryBuilder('m')
      .innerJoin('m.saleProduct', 'product')
      .where('product.clinicId = :clinicId', { clinicId })
      .andWhere('m.createdAt BETWEEN :dateFrom AND :dateTo', { dateFrom, dateTo })
      .leftJoinAndSelect('m.saleProduct', 'saleProduct')
      .leftJoinAndSelect('m.sale', 'sale')
      .orderBy('m.createdAt', 'DESC')
      .getMany();
  }

  async getMovementSummary(
    clinicId: string,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<
    Array<{
      movementType: string;
      totalQuantity: number;
      count: number;
    }>
  > {
    return this.repo
      .createQueryBuilder('m')
      .select('m.movementType', 'movementType')
      .addSelect('SUM(m.quantity)', 'totalQuantity')
      .addSelect('COUNT(m.id)', 'count')
      .innerJoin('m.saleProduct', 'product')
      .where('product.clinicId = :clinicId', { clinicId })
      .andWhere('m.createdAt BETWEEN :dateFrom AND :dateTo', { dateFrom, dateTo })
      .groupBy('m.movementType')
      .getRawMany();
  }

  async save(movement: InventoryMovement): Promise<InventoryMovement> {
    return this.repo.save(movement);
  }

  async delete(movementId: string): Promise<void> {
    await this.repo.delete({ id: movementId });
  }

  async findById(movementId: string): Promise<InventoryMovement | null> {
    return this.repo
      .createQueryBuilder('m')
      .where('m.id = :movementId', { movementId })
      .leftJoinAndSelect('m.saleProduct', 'saleProduct')
      .leftJoinAndSelect('m.sale', 'sale')
      .getOne();
  }
}
