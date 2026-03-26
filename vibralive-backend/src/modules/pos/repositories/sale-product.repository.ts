import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { SaleProduct } from '../../../database/entities/sale-product.entity';

@Injectable()
export class SaleProductRepository {
  constructor(
    @InjectRepository(SaleProduct)
    private readonly repo: Repository<SaleProduct>,
  ) {}

  async create(data: Partial<SaleProduct>): Promise<SaleProduct> {
    return this.repo.save(this.repo.create(data));
  }

  async findById(productId: string): Promise<SaleProduct | null> {
    return this.repo
      .createQueryBuilder('p')
      .where('p.id = :productId', { productId })
      .leftJoinAndSelect('p.product', 'product')
      .getOne();
  }

  async findByClinic(
    clinicId: string,
    filters: {
      search?: string;
      page?: number;
      limit?: number;
      inStock?: boolean;
    } = {},
  ): Promise<[SaleProduct[], number]> {
    const query = this.repo
      .createQueryBuilder('p')
      .where('p.clinicId = :clinicId', { clinicId })
      .leftJoinAndSelect('p.product', 'product');

    if (filters.search) {
      query.andWhere('(p.name ILIKE :search OR p.sku ILIKE :search)', {
        search: `%${filters.search}%`,
      });
    }

    if (filters.inStock) {
      query.andWhere('p.currentStock > :minStock', { minStock: 0 });
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;

    query
      .orderBy('p.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    return query.getManyAndCount();
  }

  async findBySku(sku: string, clinicId: string): Promise<SaleProduct | null> {
    return this.repo
      .createQueryBuilder('p')
      .where('p.sku = :sku', { sku })
      .andWhere('p.clinicId = :clinicId', { clinicId })
      .getOne();
  }

  async findLowStockProducts(
    clinicId: string,
    threshold: number = 10,
  ): Promise<SaleProduct[]> {
    return this.repo
      .createQueryBuilder('p')
      .where('p.clinicId = :clinicId', { clinicId })
      .andWhere('p.stockQuantity <= :threshold', { threshold })
      .orderBy('p.stockQuantity', 'ASC')
      .getMany();
  }

  async updateStock(productId: string, newStock: number): Promise<void> {
    await this.repo.update({ id: productId }, { stockQuantity: newStock });
  }

  async incrementStock(productId: string, quantity: number): Promise<void> {
    await this.repo.increment({ id: productId }, 'stockQuantity', quantity);
  }

  async decrementStock(productId: string, quantity: number): Promise<void> {
    await this.repo.decrement({ id: productId }, 'stockQuantity', quantity);
  }

  async save(product: SaleProduct): Promise<SaleProduct> {
    return this.repo.save(product);
  }

  async delete(productId: string): Promise<void> {
    await this.repo.delete({ id: productId });
  }

  async findAllForClinic(clinicId: string): Promise<SaleProduct[]> {
    return this.repo
      .createQueryBuilder('p')
      .where('p.clinicId = :clinicId', { clinicId })
      .orderBy('p.name', 'ASC')
      .getMany();
  }

  async findActiveProducts(clinicId: string): Promise<SaleProduct[]> {
    return this.repo
      .createQueryBuilder('p')
      .where('p.clinicId = :clinicId', { clinicId })
      .andWhere('p.isActive = :isActive', { isActive: true })
      .orderBy('p.name', 'ASC')
      .getMany();
  }
}
