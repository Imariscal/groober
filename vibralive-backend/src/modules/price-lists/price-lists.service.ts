import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { PriceList, ServicePrice, PriceListHistory, ServicePackagePrice, ServicePackage, ServiceSizePrice } from '@/database/entities';
import { ServicePackagePriceRepository } from '../pricing/repositories/service-package-price.repository';

@Injectable()
export class PriceListsService {
  constructor(
    @InjectRepository(PriceList)
    private readonly priceListRepo: Repository<PriceList>,
    @InjectRepository(ServicePrice)
    private readonly servicePriceRepo: Repository<ServicePrice>,
    @InjectRepository(ServiceSizePrice)
    private readonly serviceSizePriceRepo: Repository<ServiceSizePrice>,
    @InjectRepository(ServicePackagePrice)
    private readonly packagePriceRepo: Repository<ServicePackagePrice>,
    @InjectRepository(ServicePackage)
    private readonly packageRepo: Repository<ServicePackage>,
    @InjectRepository(PriceListHistory)
    private readonly historyRepo: Repository<PriceListHistory>,
    private readonly packagePriceRepository: ServicePackagePriceRepository,
  ) {}

  /**
   * Get all active price lists for a clinic
   * Used for client price list selector
   */
  async getActivePriceLists(clinicId: string): Promise<PriceList[]> {
    return this.priceListRepo.find({
      where: {
        clinicId,
        isActive: true,
      },
      order: {
        isDefault: 'DESC',
        name: 'ASC',
      },
    });
  }

  /**
   * Get default price list for a clinic
   */
  async getDefaultPriceList(clinicId: string): Promise<PriceList | null> {
    return this.priceListRepo.findOne({
      where: {
        clinicId,
        isDefault: true,
        isActive: true,
      },
    });
  }

  /**
   * Get price list by ID with all service prices
   */
  async getPriceListById(clinicId: string, priceListId: string): Promise<PriceList | null> {
    return this.priceListRepo.findOne({
      where: {
        id: priceListId,
        clinicId,
      },
    });
  }

  /**
   * Create a new price list
   */
  async createPriceList(
    clinicId: string,
    dto: {
      name: string;
      description?: string;
      is_default?: boolean;
      copyFromPriceListId?: string;
    },
  ): Promise<PriceList> {
    // Only one default list per clinic
    if (dto.is_default) {
      await this.priceListRepo.update(
        { clinicId, isDefault: true },
        { isDefault: false },
      );
    }

    const priceList = this.priceListRepo.create({
      clinicId,
      name: dto.name,
      description: dto.description,
      isDefault: dto.is_default || false,
      isActive: true,
    });

    const saved = await this.priceListRepo.save(priceList);

    // Copy service prices from another list if specified
    if (dto.copyFromPriceListId) {
      const sourceListPrices = await this.servicePriceRepo.find({
        where: {
          priceListId: dto.copyFromPriceListId,
          clinicId,
        },
      });

      for (const sourcePrice of sourceListPrices) {
        const newPrice = this.servicePriceRepo.create({
          clinicId,
          priceListId: saved.id,
          serviceId: sourcePrice.serviceId,
          price: sourcePrice.price,
          currency: sourcePrice.currency,
          isAvailable: sourcePrice.isAvailable,
        });
        await this.servicePriceRepo.save(newPrice);
      }
    }

    return saved;
  }

  /**
   * Update a price list
   */
  async updatePriceList(
    clinicId: string,
    priceListId: string,
    dto: Partial<{ name: string; description: string; is_active: boolean; is_default: boolean }>,
  ): Promise<PriceList> {
    const priceList = await this.getPriceListById(clinicId, priceListId);
    if (!priceList) {
      throw new NotFoundException('Price list not found');
    }

    // Prevent deactivating default list
    if (priceList.isDefault && dto.is_active === false) {
      throw new BadRequestException('Cannot deactivate the default price list');
    }

    // Handle setting as default
    if (dto.is_default === true && !priceList.isDefault) {
      // Unset previous default
      await this.priceListRepo.update(
        { clinicId, isDefault: true },
        { isDefault: false },
      );
    }

    if (dto.name) priceList.name = dto.name;
    if (dto.description !== undefined) priceList.description = dto.description;
    if (dto.is_active !== undefined) priceList.isActive = dto.is_active;
    if (dto.is_default !== undefined) priceList.isDefault = dto.is_default;
    
    return this.priceListRepo.save(priceList);
  }

  /**
   * Delete a price list
   */
  async deletePriceList(clinicId: string, priceListId: string): Promise<void> {
    const priceList = await this.getPriceListById(clinicId, priceListId);
    if (!priceList) {
      throw new NotFoundException('Price list not found');
    }

    if (priceList.isDefault) {
      throw new BadRequestException('Cannot delete the default price list');
    }

    // Delete associated service prices and history
    await this.servicePriceRepo.delete({ priceListId, clinicId });
    await this.historyRepo.delete({ priceListId, clinicId });
    await this.priceListRepo.remove(priceList);
  }

  /**
   * Get all service prices for a price list
   */
  async getServicePrices(
    clinicId: string,
    priceListId: string,
    serviceId?: string,
  ): Promise<ServicePrice[]> {
    const where: any = { clinicId, priceListId };
    if (serviceId) {
      where.serviceId = serviceId;
    }

    const prices = await this.servicePriceRepo.find({
      where,
      relations: ['service'],
      order: { createdAt: 'DESC' },
    });

    // Convert string prices to numbers (TypeORM returns numeric types as strings)
    // and extract service name for convenience
    return prices.map((price) => ({
      ...price,
      price: Number(price.price),
      serviceName: price.service?.name || 'Unknown Service',
    }));
  }

  /**
   * Update a service price in a price list
   * If service doesn't exist in price list, creates it first (for "add service" flow)
   */
  async updateServicePrice(
    clinicId: string,
    priceListId: string,
    serviceId: string,
    dto: { price?: number; currency?: string; is_available?: boolean },
  ): Promise<ServicePrice> {
    let servicePrice = await this.servicePriceRepo.findOne({
      where: { clinicId, priceListId, serviceId },
      relations: ['service'],
    });

    if (!servicePrice) {
      // Service not in this price list yet - CREATE it (for "add service" flow)
      servicePrice = this.servicePriceRepo.create({
        clinicId,
        priceListId,
        serviceId,
        price: dto.price || 0,
        currency: dto.currency || 'MXN',
        isAvailable: dto.is_available !== undefined ? dto.is_available : true,
      });
      return this.servicePriceRepo.save(servicePrice);
    }

    // Service already exists - UPDATE it
    const oldPrice = servicePrice.price;
    servicePrice.price = dto.price ?? servicePrice.price;
    servicePrice.currency = dto.currency ?? servicePrice.currency;
    servicePrice.isAvailable = dto.is_available ?? servicePrice.isAvailable;

    const saved = await this.servicePriceRepo.save(servicePrice);

    // Record history if price changed
    if (oldPrice !== saved.price) {
      await this.historyRepo.save(
        this.historyRepo.create({
          clinicId,
          priceListId,
          serviceId,
          oldPrice,
          newPrice: saved.price,
          changedByUserId: null,
          reason: 'Price updated',
        }),
      );
    }

    return saved;
  }

  /**
   * Get price change history for a service
   */
  async getPriceHistory(
    clinicId: string,
    priceListId: string,
    serviceId: string,
    limit = 20,
  ): Promise<PriceListHistory[]> {
    const history = await this.historyRepo.find({
      where: { clinicId, priceListId, serviceId },
      order: { changedAt: 'DESC' },
      take: limit,
    });

    // Convert string prices to numbers (TypeORM returns numeric types as strings)
    return history.map((record) => ({
      ...record,
      oldPrice: record.oldPrice ? Number(record.oldPrice) : null,
      newPrice: Number(record.newPrice),
    }));
  }

  /**
   * Remove a service from a price list
   * ⚠️ Cannot remove services from the DEFAULT price list
   */
  async removeServiceFromPriceList(
    clinicId: string,
    priceListId: string,
    serviceId: string,
  ): Promise<void> {
    // Check if price list exists and belongs to this clinic
    const priceList = await this.priceListRepo.findOne({
      where: { id: priceListId, clinicId },
    });

    if (!priceList) {
      throw new NotFoundException('Price list not found');
    }

    // Prevent deletion of services from the default price list
    if (priceList.isDefault) {
      throw new BadRequestException(
        'Cannot remove services from the default price list. Only prices can be updated.',
      );
    }

    // Delete the service price and related history
    await this.servicePriceRepo.delete({
      clinicId,
      priceListId,
      serviceId,
    });
    await this.historyRepo.delete({
      clinicId,
      priceListId,
      serviceId,
    });
  }

  /**
   * CRITICAL: Ensure a default price list always exists for a clinic
   * If it doesn't exist, create it automatically
   * Used when creating clients and services to guarantee a fallback price list
   */
  async ensureDefaultPriceListExists(clinicId: string): Promise<PriceList> {
    let priceList = await this.priceListRepo.findOne({
      where: {
        clinicId,
        isDefault: true,
        isActive: true,
      },
    });

    // If no default price list exists, create it
    if (!priceList) {
      priceList = this.priceListRepo.create({
        clinicId,
        name: 'Default Price List',
        isDefault: true,
        isActive: true,
      });

      priceList = await this.priceListRepo.save(priceList);
    }

    return priceList;
  }

  /**
   * Get all package prices for a price list
   */
  async getPackagePrices(
    clinicId: string,
    priceListId: string,
    packageId?: string,
  ): Promise<ServicePackagePrice[]> {
    const where: any = { clinicId, priceListId };
    if (packageId) {
      where.packageId = packageId;
    }

    const prices = await this.packagePriceRepository.find({
      where,
      relations: ['package'],
      order: { createdAt: 'DESC' },
    });

    return prices.map((price) => ({
      ...price,
      price: Number(price.price),
      packageName: price.package?.name || 'Unknown Package',
    }));
  }

  /**
   * Update a package price in a price list
   * If package doesn't exist in price list, creates it first (for "add package" flow)
   */
  async updatePackagePrice(
    clinicId: string,
    priceListId: string,
    packageId: string,
    dto: { price?: number; currency?: string; is_available?: boolean },
  ): Promise<ServicePackagePrice> {
    // Verify package exists and belongs to clinic
    const pkg = await this.packageRepo.findOne({
      where: { id: packageId, clinicId },
    });

    if (!pkg) {
      throw new NotFoundException('Package not found');
    }

    // Verify price list exists
    const priceList = await this.priceListRepo.findOne({
      where: { id: priceListId, clinicId },
    });

    if (!priceList) {
      throw new NotFoundException('Price list not found');
    }

    const packagePrice = await this.packagePriceRepository.upsertPackagePrice(
      clinicId,
      priceListId,
      packageId,
      {
        price: dto.price ?? 0,
        currency: dto.currency,
        isAvailable: dto.is_available,
      }
    );

    return packagePrice;
  }

  /**
   * Remove a package from a price list
   * ⚠️ Cannot remove packages from the DEFAULT price list
   */
  async removePackageFromPriceList(
    clinicId: string,
    priceListId: string,
    packageId: string,
  ): Promise<void> {
    // Check if price list exists and belongs to this clinic
    const priceList = await this.priceListRepo.findOne({
      where: { id: priceListId, clinicId },
    });

    if (!priceList) {
      throw new NotFoundException('Price list not found');
    }

    // Prevent deletion of packages from the default price list
    if (priceList.isDefault) {
      throw new BadRequestException(
        'Cannot remove packages from the default price list. Only prices can be updated.',
      );
    }

    // Delete the package price
    await this.packagePriceRepo.delete({
      clinicId,
      priceListId,
      packageId,
    });
  }

  /**
   * Get service size prices for a specific price list
   * Returns prices specific to this price list, or global prices if none exist
   */
  async getServiceSizePrices(
    clinicId: string,
    priceListId: string,
    serviceId: string,
  ): Promise<ServiceSizePrice[]> {
    console.log(`[getServiceSizePrices] Querying with clinicId=${clinicId}, priceListId=${priceListId}, serviceId=${serviceId}`);
    
    // Query all records for this service first
    const allPrices = await this.serviceSizePriceRepo.find({
      where: {
        clinicId,
        serviceId,
      },
      order: { petSize: 'ASC', createdAt: 'DESC' },
    });

    console.log(`[getServiceSizePrices] Found ${allPrices.length} total records for this service`);

    // Filter for price-list-specific prices first
    const listSpecificPrices = allPrices.filter(p => p.priceListId === priceListId);
    console.log(`[getServiceSizePrices] Found ${listSpecificPrices.length} PRICE-LIST-SPECIFIC prices`);

    if (listSpecificPrices.length > 0) {
      console.log(`[getServiceSizePrices] Returning price-list-specific prices`);
      return listSpecificPrices;
    }

    // Fall back to global prices (where priceListId is null)
    const globalPrices = allPrices.filter(p => p.priceListId === null);
    console.log(`[getServiceSizePrices] Returning ${globalPrices.length} GLOBAL prices (fallback)`);
    return globalPrices;
  }

  /**
   * Get a single service size price for a specific price list
   * Returns the price-list-specific price, or the global price if none exists
   */
  async getServiceSizePrice(
    clinicId: string,
    priceListId: string,
    serviceId: string,
    petSize: 'XS' | 'S' | 'M' | 'L' | 'XL',
  ): Promise<ServiceSizePrice | null> {
    console.log(`[getServiceSizePrice] Querying clinicId=${clinicId}, priceListId=${priceListId}, serviceId=${serviceId}, petSize=${petSize}`);
    
    // First try to find price-list-specific price
    let sizePrice = await this.serviceSizePriceRepo.findOne({
      where: {
        clinicId,
        serviceId,
        petSize,
        priceListId,  // Look for EXACT price list
      },
    });

    if (sizePrice) {
      console.log(`[getServiceSizePrice] Found price-list-specific price: ${sizePrice.price}`);
      return sizePrice;
    }

    // Fall back to global price (where priceListId is null)
    console.log(`[getServiceSizePrice] No price-list-specific price found, trying global...`);
    sizePrice = await this.serviceSizePriceRepo.findOne({
      where: {
        clinicId,
        serviceId,
        petSize,
        priceListId: IsNull(),  // Get GLOBAL price
      },
    });

    if (sizePrice) {
      console.log(`[getServiceSizePrice] Found global price: ${sizePrice.price}`);
    } else {
      console.log(`[getServiceSizePrice] No price found (neither list-specific nor global)`);
    }

    return sizePrice || null;
  }

  /**
   * Update or create a service size price for a specific price list
   */
  async updateServiceSizePrice(
    clinicId: string,
    priceListId: string,
    serviceId: string,
    petSize: 'XS' | 'S' | 'M' | 'L' | 'XL',
    dto: { price: number; currency?: string; is_active?: boolean },
  ): Promise<ServiceSizePrice> {
    console.log(`[updateServiceSizePrice] START - clinicId=${clinicId}, priceListId=${priceListId}, serviceId=${serviceId}, petSize=${petSize}, price=${dto.price}`);
    
    // Always try to find existing record with this specific priceListId
    let sizePrice = await this.serviceSizePriceRepo.findOne({
      where: {
        clinicId,
        serviceId,
        petSize,
        priceListId,  // IMPORTANT: Search for price-list-specific record
      },
    });

    console.log(`[updateServiceSizePrice] Found existing price-list-specific record: ${!!sizePrice}`);

    if (!sizePrice) {
      // Create new price-list-specific size price
      console.log(`[updateServiceSizePrice] Creating NEW price-list-specific record - priceListId=${priceListId}`);
      sizePrice = this.serviceSizePriceRepo.create({
        clinicId,
        serviceId,
        petSize,
        price: dto.price,
        currency: dto.currency || 'MXN',
        isActive: dto.is_active !== undefined ? dto.is_active : true,
      });
      // EXPLICITLY set priceListId AFTER create
      sizePrice.priceListId = priceListId;
      console.log(`[updateServiceSizePrice] Created entity with priceListId explicitly set to: ${sizePrice.priceListId}`);
    } else {
      // Update existing price-list-specific record
      console.log(`[updateServiceSizePrice] Updating existing price-list-specific record`);
      sizePrice.price = dto.price;
      sizePrice.currency = dto.currency || sizePrice.currency || 'MXN';
      if (dto.is_active !== undefined) {
        sizePrice.isActive = dto.is_active;
      }
      // Ensure priceListId is NOT changed
      sizePrice.priceListId = priceListId;
    }

    console.log(`[updateServiceSizePrice] About to SAVE - id=${sizePrice.id}, price=${dto.price}, priceListId=${sizePrice.priceListId}`);
    const saved = await this.serviceSizePriceRepo.save(sizePrice);
    console.log(`[updateServiceSizePrice] SAVED COMPLETE - id=${saved.id}, price=${saved.price}, priceListId=${saved.priceListId}, petSize=${saved.petSize}`);
    
    // Force flush to DB to ensure data is immediately available
    try {
      await this.serviceSizePriceRepo.manager.connection.manager.query('SELECT 1');
    } catch (e) {
      console.log('[updateServiceSizePrice] Flush query executed');
    }
    
    return saved;
  }

  /**
   * Batch update service size prices for a price list
   */
  async batchUpdateServiceSizePrices(
    clinicId: string,
    priceListId: string,
    serviceId: string,
    sizePrices: Array<{ petSize: 'XS' | 'S' | 'M' | 'L' | 'XL'; price: number; currency?: string }>,
  ): Promise<ServiceSizePrice[]> {
    const results: ServiceSizePrice[] = [];

    for (const size of sizePrices) {
      const updated = await this.updateServiceSizePrice(
        clinicId,
        priceListId,
        serviceId,
        size.petSize,
        {
          price: size.price,
          currency: size.currency || 'MXN',
        },
      );
      results.push(updated);
    }

    return results;
  }
}

