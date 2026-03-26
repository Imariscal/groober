import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { ServicePackagePrice } from '@/database/entities';

@Injectable()
export class ServicePackagePriceRepository extends Repository<ServicePackagePrice> {
  constructor(private dataSource: DataSource) {
    super(ServicePackagePrice, dataSource.createEntityManager());
  }

  async getPackagePricesForPriceList(clinicId: string, priceListId: string): Promise<ServicePackagePrice[]> {
    return this.find({
      where: { clinicId, priceListId },
      relations: ['package'],
      order: { createdAt: 'DESC' },
    });
  }

  async getPackagePrice(clinicId: string, priceListId: string, packageId: string): Promise<ServicePackagePrice | null> {
    return this.findOne({
      where: { clinicId, priceListId, packageId },
      relations: ['package'],
    });
  }

  async upsertPackagePrice(
    clinicId: string,
    priceListId: string,
    packageId: string,
    data: {
      price: number;
      currency?: string;
      isAvailable?: boolean;
    }
  ): Promise<ServicePackagePrice> {
    let packagePrice = await this.findOne({
      where: { clinicId, priceListId, packageId },
    });

    if (!packagePrice) {
      packagePrice = this.create({
        clinicId,
        priceListId,
        packageId,
        price: data.price,
        currency: data.currency || 'MXN',
        isAvailable: data.isAvailable !== undefined ? data.isAvailable : true,
      });
    } else {
      packagePrice.price = data.price;
      packagePrice.currency = data.currency ?? packagePrice.currency;
      packagePrice.isAvailable = data.isAvailable ?? packagePrice.isAvailable;
    }

    return this.save(packagePrice);
  }
}
