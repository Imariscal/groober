import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from '@/database/entities/service.entity';
import { ServiceSizePrice } from '@/database/entities/service-size-price.entity';
import { PriceList } from '@/database/entities/price-list.entity';
import { ServicePrice } from '@/database/entities/service-price.entity';
import { ServicePackageItem } from '@/database/entities/service-package-item.entity';
import { ServicePackagePrice } from '@/database/entities/service-package-price.entity';
import { PriceListsService } from '@/modules/price-lists/price-lists.service';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepo: Repository<Service>,
    @InjectRepository(ServiceSizePrice)
    private readonly sizePriceRepo: Repository<ServiceSizePrice>,
    @InjectRepository(PriceList)
    private readonly priceListRepo: Repository<PriceList>,
    @InjectRepository(ServicePrice)
    private readonly priceRepo: Repository<ServicePrice>,
    @InjectRepository(ServicePackageItem)
    private readonly packageItemRepo: Repository<ServicePackageItem>,
    @InjectRepository(ServicePackagePrice)
    private readonly packagePriceRepo: Repository<ServicePackagePrice>,
    private readonly priceListsService: PriceListsService,
  ) {}

  async getServicesByClinic(clinicId: string) {
    return this.serviceRepo.find({
      where: { clinicId },
      order: { createdAt: 'DESC' },
    });
  }

  async getServiceById(clinicId: string, serviceId: string) {
    const service = await this.serviceRepo.findOne({
      where: { id: serviceId, clinicId },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return service;
  }

  async createService(clinicId: string, dto: any) {
    console.log('[ServicesService] Creating service with:', dto);
    
    const service = this.serviceRepo.create({ ...dto, clinicId });
    const savedService = await this.serviceRepo.save(service) as Service | Service[];
    const serviceId = Array.isArray(savedService) ? (savedService[0] as Service).id : (savedService as Service).id;

    console.log('[ServicesService] Service created with ID:', serviceId);

    // Ensure default price list exists and get it (critical requirement)
    const priceList = await this.priceListsService.ensureDefaultPriceListExists(clinicId);
    console.log('[ServicesService] Default price list:', priceList?.id);

    // Create service price with the specified price (or 0 if not provided)
    const price = dto.price ?? 0;
    console.log('[ServicesService] Creating service price:', { serviceId, priceListId: priceList.id, price });
    
    const servicePrice = await this.priceRepo.save(
      this.priceRepo.create({
        clinicId,
        priceListId: priceList.id,
        serviceId: serviceId,
        price,
        currency: 'MXN',
        isAvailable: true,
      })
    );
    
    console.log('[ServicesService] Service price created:', servicePrice);
    return savedService;
  }

  async updateService(clinicId: string, serviceId: string, dto: Partial<any>) {
    const service = await this.getServiceById(clinicId, serviceId);

    // Update only provided fields
    Object.assign(service, dto);
    
    const updatedService = await this.serviceRepo.save(service);

    // If price is being updated, also update the DEFAULT price list and affected packages
    if (dto.price !== undefined) {
      const priceList = await this.priceListsService.ensureDefaultPriceListExists(clinicId);
      console.log('[ServicesService] Updating service price in DEFAULT list:', { serviceId, price: dto.price });

      const existingPrice = await this.priceRepo.findOne({
        where: { clinicId, priceListId: priceList.id, serviceId },
      });

      if (existingPrice) {
        existingPrice.price = dto.price;
        await this.priceRepo.save(existingPrice);
        console.log('[ServicesService] Service price updated in DEFAULT list');
      } else {
        // Create if doesn't exist
        const newPrice = await this.priceRepo.save(
          this.priceRepo.create({
            clinicId,
            priceListId: priceList.id,
            serviceId,
            price: dto.price,
            currency: 'MXN',
            isAvailable: true,
          })
        );
        console.log('[ServicesService] Service price created in DEFAULT list:', newPrice);
      }

      // 🔄 Recalculate prices for all packages that contain this service
      await this.updateAffectedPackagePrices(clinicId, serviceId);
    }

    return updatedService;
  }

  /**
   * Find all packages that contain a given service and recalculate their prices
   * This is called when a service price is updated
   */
  private async updateAffectedPackagePrices(clinicId: string, serviceId: string): Promise<void> {
    try {
      // Find all package items that contain this service
      const packageItems = await this.packageItemRepo.find({
        where: { clinicId, serviceId },
        relations: ['package'],
      });

      if (packageItems.length === 0) {
        console.log('[ServicesService] No packages contain service:', serviceId);
        return;
      }

      console.log(
        '[ServicesService] Found',
        packageItems.length,
        'affected packages. Recalculating prices...'
      );

      // Get unique package IDs
      const affectedPackageIds = [...new Set(packageItems.map(item => item.packageId))];

      // Get default price list
      const defaultPriceList = await this.priceListRepo.findOne({
        where: { clinicId, isDefault: true, isActive: true },
      });

      if (!defaultPriceList) {
        console.warn('[ServicesService] No default price list found');
        return;
      }

      // For each affected package, recalculate its price
      for (const packageId of affectedPackageIds) {
        const newPrice = await this.calculatePackagePrice(clinicId, packageId);
        await this.updatePackagePricesInAllLists(clinicId, packageId, newPrice);
      }

      console.log('[ServicesService] All affected package prices updated');
    } catch (error) {
      console.error('[ServicesService] Error updating affected package prices:', error);
      // Don't throw - this is a cascading update and shouldn't fail the main operation
    }
  }

  /**
   * Calculate the total price of a package based on its items and their prices
   */
  private async calculatePackagePrice(clinicId: string, packageId: string): Promise<number> {
    // Get default price list
    const defaultPriceList = await this.priceListRepo.findOne({
      where: { clinicId, isDefault: true, isActive: true },
    });

    if (!defaultPriceList) {
      console.warn('[ServicesService] No default price list for package price calculation');
      return 0;
    }

    // Get package items
    const items = await this.packageItemRepo.find({
      where: { clinicId, packageId },
    });

    // Calculate total
    let totalPrice = 0;
    for (const item of items) {
      const servicePrice = await this.priceRepo.findOne({
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

    console.log('[ServicesService] Calculated package price:', { packageId, totalPrice });
    return totalPrice;
  }

  /**
   * Update package price in all price lists
   */
  private async updatePackagePricesInAllLists(
    clinicId: string,
    packageId: string,
    newPrice: number,
  ): Promise<void> {
    const packagePrices = await this.packagePriceRepo.find({
      where: { clinicId, packageId },
    });

    console.log(
      '[ServicesService] Updating package price in',
      packagePrices.length,
      'price lists. New price:',
      newPrice,
    );

    for (const priceEntry of packagePrices) {
      priceEntry.price = newPrice;
      await this.packagePriceRepo.save(priceEntry);
    }
  }

  async deleteService(clinicId: string, serviceId: string) {
    const service = await this.getServiceById(clinicId, serviceId);

    // Delete all service prices associated with this service
    await this.priceRepo.delete({ serviceId, clinicId });

    // Delete the service
    return this.serviceRepo.remove(service);
  }

  async deactivateService(clinicId: string, serviceId: string) {
    const service = await this.getServiceById(clinicId, serviceId);

    // Toggle active state
    service.isActive = !service.isActive;
    await this.serviceRepo.save(service);

    // 🔄 Also toggle availability in ALL price lists
    const servicePrices = await this.priceRepo.find({
      where: { clinicId, serviceId },
    });

    console.log(
      '[ServicesService] Toggling service availability in',
      servicePrices.length,
      'price lists. New state:',
      service.isActive,
    );

    for (const priceEntry of servicePrices) {
      priceEntry.isAvailable = service.isActive;
      await this.priceRepo.save(priceEntry);
    }

    console.log('[ServicesService] Service availability updated in all price lists');

    return service;
  }

  // ==================== SERVICE SIZE PRICES ====================

  /**
   * Get all size prices for a service
   */
  async getSizePricesByService(clinicId: string, serviceId: string) {
    // Verify service exists
    await this.getServiceById(clinicId, serviceId);

    const prices = await this.sizePriceRepo.find({
      where: { clinicId, serviceId },
      order: { petSize: 'ASC' },
    });

    return prices;
  }

  /**
   * Get price for a specific pet size
   */
  async getSizePrice(clinicId: string, serviceId: string, petSize: string) {
    // Verify service exists
    await this.getServiceById(clinicId, serviceId);

    // 1️⃣ Try to get the exact size price
    let price = await this.sizePriceRepo.findOne({
      where: { clinicId, serviceId, petSize: petSize as any },
    });

    // 2️⃣ If not found, fallback to 'M' (medium) as default size
    if (!price && petSize !== 'M') {
      console.log(`⚠️ [SIZE PRICE] Size ${petSize} not found, falling back to 'M' for service ${serviceId}`);
      price = await this.sizePriceRepo.findOne({
        where: { clinicId, serviceId, petSize: 'M' },
      });
    }

    // 3️⃣ If still not found, return null instead of throwing error
    // This allows clients to implement their own fallback logic
    if (!price) {
      console.log(`ℹ️ [SIZE PRICE] No price found for service ${serviceId} and size ${petSize} (fallback to M also failed)`);
      return null;
    }

    return price;
  }

  /**
   * Create a new size price
   */
  async createSizePrice(
    clinicId: string,
    serviceId: string,
    dto: { petSize: string; price: number; currency?: string },
  ) {
    // Verify service exists
    await this.getServiceById(clinicId, serviceId);

    // Check if price already exists for this size
    const existing = await this.sizePriceRepo.findOne({
      where: { clinicId, serviceId, petSize: dto.petSize as any },
    });

    if (existing) {
      throw new BadRequestException(
        `Size price already exists for service ${serviceId} and size ${dto.petSize}`,
      );
    }

    const sizePrice = this.sizePriceRepo.create({
      clinicId,
      serviceId,
      petSize: dto.petSize as any,
      price: dto.price,
      currency: dto.currency || 'MXN',
    });

    return await this.sizePriceRepo.save(sizePrice);
  }

  /**
   * Create multiple size prices at once (for bulk operations)
   * Supports durationMinutes field for size-specific durations
   */
  async createMultipleSizePrices(
    clinicId: string,
    serviceId: string,
    prices: Array<{ petSize: string; price: number; currency?: string; durationMinutes?: number }>,
  ) {
    // Verify service exists
    await this.getServiceById(clinicId, serviceId);

    const results = [];
    for (const priceData of prices) {
      const existing = await this.sizePriceRepo.findOne({
        where: { clinicId, serviceId, petSize: priceData.petSize as any },
      });

      if (!existing) {
        const sizePrice = this.sizePriceRepo.create({
          clinicId,
          serviceId,
          petSize: priceData.petSize as any,
          price: priceData.price,
          currency: priceData.currency || 'MXN',
          // Support durationMinutes
          ...(priceData.durationMinutes !== undefined && { durationMinutes: priceData.durationMinutes }),
        });
        console.log(`[createMultipleSizePrices] Creating size price:`, { size: priceData.petSize, price: priceData.price, duration: priceData.durationMinutes });
        results.push(await this.sizePriceRepo.save(sizePrice));
      } else {
        // Update if exists
        existing.price = priceData.price;
        existing.currency = priceData.currency || 'MXN';
        // Update durationMinutes if provided
        if (priceData.durationMinutes !== undefined) {
          existing.durationMinutes = priceData.durationMinutes;
        }
        console.log(`[createMultipleSizePrices] Updating size price:`, { size: priceData.petSize, price: priceData.price, duration: existing.durationMinutes });
        results.push(await this.sizePriceRepo.save(existing));
      }
    }

    return results;
  }

  /**
   * Update a size price
   * Supports durationMinutes field for size-specific durations
   */
  async updateSizePrice(
    clinicId: string,
    serviceId: string,
    petSize: string,
    dto: { price?: number; currency?: string; is_active?: boolean; durationMinutes?: number },
  ) {
    const price = await this.getSizePrice(clinicId, serviceId, petSize);

    if (!price) {
      throw new NotFoundException(
        `Size price not found for service ${serviceId} and size ${petSize}`,
      );
    }

    if (dto.price !== undefined) price.price = dto.price;
    if (dto.currency) price.currency = dto.currency;
    if (dto.is_active !== undefined) price.isActive = dto.is_active;
    // Support durationMinutes
    if (dto.durationMinutes !== undefined) price.durationMinutes = dto.durationMinutes;

    console.log(`[updateSizePrice] Updating service ${serviceId} size ${petSize}:`, { price: dto.price, duration: dto.durationMinutes });
    return await this.sizePriceRepo.save(price);
  }

  /**
   * Delete a size price
   */
  async deleteSizePrice(clinicId: string, serviceId: string, petSize: string) {
    const price = await this.getSizePrice(clinicId, serviceId, petSize);
    
    if (!price) {
      throw new NotFoundException(
        `Size price not found for service ${serviceId} and size ${petSize}`,
      );
    }
    
    await this.sizePriceRepo.remove(price);
  }

  /**
   * Apply the same price to all pet sizes
   */
  async applyPriceToAllSizes(
    clinicId: string,
    serviceId: string,
    price: number,
    currency: string = 'MXN',
  ) {
    // Verify service exists
    await this.getServiceById(clinicId, serviceId);

    const sizes = ['XS', 'S', 'M', 'L', 'XL'];
    const results = [];

    for (const size of sizes) {
      const existing = await this.sizePriceRepo.findOne({
        where: { clinicId, serviceId, petSize: size as any },
      });

      if (existing) {
        existing.price = price;
        existing.currency = currency;
        results.push(await this.sizePriceRepo.save(existing));
      } else {
        const sizePrice = this.sizePriceRepo.create({
          clinicId,
          serviceId,
          petSize: size as any,
          price,
          currency,
        });
        results.push(await this.sizePriceRepo.save(sizePrice));
      }
    }

    return results;
  }
}
