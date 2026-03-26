import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServicePackage } from '@/database/entities/service-package.entity';
import { ServicePackageItem } from '@/database/entities/service-package-item.entity';
import { Service } from '@/database/entities/service.entity';
import { ServicePrice } from '@/database/entities/service-price.entity';
import { PriceList } from '@/database/entities/price-list.entity';
import { ServicePackagePrice } from '@/database/entities/service-package-price.entity';
import { CreateServicePackageDto } from './dtos/create-package.dto';

export interface PackageResponse {
  id: string;
  clinicId: string;
  name: string;
  description?: string;
  isActive: boolean;
  items: Array<{
    serviceId: string;
    serviceName?: string;
    quantity: number;
    price?: number;
    currency?: string;
  }>;
  totalPrice?: number;
  currency?: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class PackagesService {
  constructor(
    @InjectRepository(ServicePackage)
    private readonly packageRepo: Repository<ServicePackage>,
    @InjectRepository(ServicePackageItem)
    private readonly packageItemRepo: Repository<ServicePackageItem>,
    @InjectRepository(Service)
    private readonly serviceRepo: Repository<Service>,
    @InjectRepository(ServicePrice)
    private readonly servicePriceRepo: Repository<ServicePrice>,
    @InjectRepository(PriceList)
    private readonly priceListRepo: Repository<PriceList>,
    @InjectRepository(ServicePackagePrice)
    private readonly packagePriceRepo: Repository<ServicePackagePrice>,
  ) {}

  async getPackagesByClinic(clinicId: string) {
    const packages = await this.packageRepo.find({
      where: { clinicId },
      order: { createdAt: 'DESC' },
      relations: ['items', 'items.service'],
    });

    return Promise.all(packages.map(pkg => this.formatPackageWithItems(pkg)));
  }

  async getPackageById(clinicId: string, packageId: string) {
    const pkg = await this.packageRepo.findOne({
      where: { id: packageId, clinicId },
      relations: ['items', 'items.service'],
    });

    if (!pkg) {
      throw new NotFoundException('Service package not found');
    }

    return this.formatPackageWithItems(pkg);
  }

  async createPackage(clinicId: string, dto: CreateServicePackageDto) {
    // Validate items
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Package must contain at least one service');
    }

    // Validate services exist and belong to clinic
    for (const item of dto.items) {
      const service = await this.serviceRepo.findOne({
        where: { id: item.serviceId, clinicId },
      });
      if (!service) {
        throw new BadRequestException(`Service ${item.serviceId} not found or doesn't belong to this clinic`);
      }
    }

    // Create package
    const pkg = this.packageRepo.create({
      clinicId,
      name: dto.name,
      description: dto.description,
      isActive: true,
    });

    const savedPackage = await this.packageRepo.save(pkg);

    // Create package items
    for (let i = 0; i < dto.items.length; i++) {
      const itemDto = dto.items[i];

      const item = this.packageItemRepo.create({
        clinicId,
        packageId: savedPackage.id,
        serviceId: itemDto.serviceId,
        quantity: itemDto.quantity,
        sortOrder: i,
      });

      await this.packageItemRepo.save(item);
    }

    // 🆕 Auto-link to DEFAULT price list
    const defaultPriceList = await this.priceListRepo.findOne({
      where: { clinicId, isDefault: true, isActive: true },
    });

    if (defaultPriceList) {
      // Create package price entry in default price list (with price 0 as placeholder)
      const packagePrice = this.packagePriceRepo.create({
        clinicId,
        priceListId: defaultPriceList.id,
        packageId: savedPackage.id,
        price: 0, // Placeholder - user must set actual price
        currency: 'MXN',
        isAvailable: true,
      });
      await this.packagePriceRepo.save(packagePrice);
    }

    // Reload and format with prices
    const fullPackage = await this.packageRepo.findOne({
      where: { id: savedPackage.id, clinicId },
      relations: ['items', 'items.service'],
    });

    return this.formatPackageWithItems(fullPackage!);
  }

  /**
   * Calculate the total price of a package based on its items and their prices in default price list
   * Total = sum(service.price * quantity) for all items
   */
  async calculatePackagePrice(clinicId: string, packageId: string): Promise<number> {
    const pkg = await this.packageRepo.findOne({
      where: { id: packageId, clinicId },
      relations: ['items'],
    });

    if (!pkg) {
      throw new NotFoundException('Service package not found');
    }

    // Get default price list
    const defaultPriceList = await this.priceListRepo.findOne({
      where: { clinicId, isDefault: true, isActive: true },
    });

    if (!defaultPriceList) {
      console.warn('[PackagesService] No default price list found for clinic:', clinicId);
      return 0;
    }

    // Calculate total price
    let totalPrice = 0;
    for (const item of pkg.items || []) {
      const servicePrice = await this.servicePriceRepo.findOne({
        where: {
          clinicId,
          priceListId: defaultPriceList.id,
          serviceId: item.serviceId,
        },
      });

      if (servicePrice) {
        totalPrice += Number(servicePrice.price) * item.quantity;
      }
    }

    console.log('[PackagesService] Calculated package price:', { packageId, totalPrice });
    return totalPrice;
  }

  /**
   * Update the package price in ALL price lists where the package exists
   * This ensures consistency across all price lists when package composition changes
   */
  async updatePackagePricesInAllLists(
    clinicId: string,
    packageId: string,
    newPrice: number,
  ): Promise<void> {
    // Find all price entries for this package (in all price lists)
    const packagePrices = await this.packagePriceRepo.find({
      where: { clinicId, packageId },
    });

    console.log(
      '[PackagesService] Updating package price in',
      packagePrices.length,
      'price lists. New price:',
      newPrice,
    );

    // Update all price entries
    for (const priceEntry of packagePrices) {
      priceEntry.price = newPrice;
      await this.packagePriceRepo.save(priceEntry);
    }

    console.log('[PackagesService] Package price updated in all price lists');
  }

  async updatePackage(
    clinicId: string,
    packageId: string,
    dto: Partial<CreateServicePackageDto>,
  ) {
    const pkg = await this.packageRepo.findOne({
      where: { id: packageId, clinicId },
    });

    if (!pkg) {
      throw new NotFoundException('Service package not found');
    }

    // Update basic fields
    if (dto.name) pkg.name = dto.name;
    if (dto.description !== undefined) pkg.description = dto.description;

    await this.packageRepo.save(pkg);

    // Update items if provided
    if (dto.items) {
      // Validate items
      if (dto.items.length === 0) {
        throw new BadRequestException('Package must contain at least one service');
      }

      // Validate services exist
      for (const item of dto.items) {
        const service = await this.serviceRepo.findOne({
          where: { id: item.serviceId, clinicId },
        });
        if (!service) {
          throw new BadRequestException(`Service ${item.serviceId} not found or doesn't belong to this clinic`);
        }
      }

      // Delete old items
      await this.packageItemRepo.delete({ packageId });

      // Create new items
      for (let i = 0; i < dto.items.length; i++) {
        const itemDto = dto.items[i];

        const item = this.packageItemRepo.create({
          clinicId,
          packageId,
          serviceId: itemDto.serviceId,
          quantity: itemDto.quantity,
          sortOrder: i,
        });

        await this.packageItemRepo.save(item);
      }

      // 🔄 After items updated, recalculate package price and update in all price lists
      console.log('[PackagesService] Items changed, recalculating package price...');
      const newPrice = await this.calculatePackagePrice(clinicId, packageId);
      await this.updatePackagePricesInAllLists(clinicId, packageId, newPrice);
    }

    // Reload and format with prices
    const fullPackage = await this.packageRepo.findOne({
      where: { id: packageId, clinicId },
      relations: ['items', 'items.service'],
    });

    return this.formatPackageWithItems(fullPackage!);
  }

  async deletePackage(clinicId: string, packageId: string) {
    const pkg = await this.getPackageById(clinicId, packageId);

    // Delete items first (CASCADE should handle this, but let's be explicit)
    await this.packageItemRepo.delete({ packageId });

    // Delete package
    await this.packageRepo.delete({ id: packageId, clinicId });
  }

  async deactivatePackage(clinicId: string, packageId: string) {
    const pkg = await this.packageRepo.findOne({
      where: { id: packageId, clinicId },
      relations: ['items', 'items.service'],
    });

    if (!pkg) {
      throw new NotFoundException('Service package not found');
    }

    // Toggle active state
    pkg.isActive = !pkg.isActive;
    await this.packageRepo.save(pkg);

    // 🔄 Also toggle availability in ALL price lists
    const packagePrices = await this.packagePriceRepo.find({
      where: { clinicId, packageId },
    });

    console.log(
      '[PackagesService] Toggling package availability in',
      packagePrices.length,
      'price lists. New state:',
      pkg.isActive,
    );

    for (const priceEntry of packagePrices) {
      priceEntry.isAvailable = pkg.isActive;
      await this.packagePriceRepo.save(priceEntry);
    }

    console.log('[PackagesService] Package availability updated in all price lists');

    return this.formatPackageWithItems(pkg);
  }

  private async formatPackageWithItems(pkg: ServicePackage): Promise<PackageResponse> {
    const items = await Promise.all(
      (pkg.items || []).map(async (item) => {
        // Get first available price for this service
        const servicePrice = await this.servicePriceRepo.findOne({
          where: {
            serviceId: item.serviceId,
            clinicId: pkg.clinicId,
            isAvailable: true,
          },
          order: { createdAt: 'DESC' },
        });

        return {
          serviceId: item.serviceId,
          serviceName: item.service?.name,
          quantity: item.quantity,
          price: servicePrice ? Number(servicePrice.price) : undefined,
          currency: servicePrice?.currency || 'MXN',
        };
      }),
    );

    const totalPrice = items.reduce((sum, item) => {
      if (item.price) {
        return sum + item.price * item.quantity;
      }
      return sum;
    }, 0);

    return {
      id: pkg.id,
      clinicId: pkg.clinicId,
      name: pkg.name,
      description: pkg.description,
      isActive: pkg.isActive,
      items,
      totalPrice: totalPrice > 0 ? totalPrice : undefined,
      currency: 'MXN',
      createdAt: pkg.createdAt,
      updatedAt: pkg.updatedAt,
    };
  }
}
