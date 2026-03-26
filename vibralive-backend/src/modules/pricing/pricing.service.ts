import { Injectable, BadRequestException, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryRunner } from 'typeorm';
import {
  Appointment,
  AppointmentItem,
  PriceList,
  ServicePrice,
  Service,
  Client,
  ServicePackage,
  ServicePackagePrice,
} from '@/database/entities';
import { AppointmentItemRepository } from './repositories/appointment-item.repository';
import { PriceListHistoryRepository } from './repositories/price-list-history.repository';
import { ServicePackagePriceRepository } from './repositories/service-package-price.repository';
import { GroomingValidationService } from '@/modules/appointments/services/grooming-validation.service';

export interface CreateAppointmentPricingDto {
  clinicId: string;
  appointmentId?: string;
  clientId: string;
  serviceIds?: string[];
  packageIds?: string[];
  customPriceListId?: string;
}

export interface CalculateAppointmentPricingDto {
  clinicId: string;
  priceListId?: string;
  serviceIds?: string[];
  quantities?: number[];
  packageIds?: string[];
  packageQuantities?: number[];
}

export interface AppointmentPricingItem {
  kind: 'SERVICE' | 'PACKAGE';
  serviceId?: string;
  packageId?: string;
  serviceName?: string;
  packageName?: string;
  priceAtBooking: number;
  quantity: number;
  subtotal: number;
}

export interface AppointmentPricingResult {
  appointmentId: string;
  items: AppointmentPricingItem[];
  totalAmount: number;
  priceLockAt: Date;
  priceListId: string;
}

@Injectable()
export class PricingService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
    @InjectRepository(PriceList)
    private priceListRepository: Repository<PriceList>,
    @InjectRepository(ServicePrice)
    private servicePriceRepository: Repository<ServicePrice>,
    @InjectRepository(Service)
    private serviceRepository: Repository<Service>,
    @InjectRepository(ServicePackage)
    private servicePackageRepository: Repository<ServicePackage>,
    private appointmentItemRepository: AppointmentItemRepository,
    private priceListHistoryRepository: PriceListHistoryRepository,
    private servicePackagePriceRepository: ServicePackagePriceRepository,
    private groomingValidationService: GroomingValidationService
  ) {}

  /**
   * Obtiene la price list a usar para un cliente
   * Orden de precedencia:
   * 1. Si la cita tiene price_list_id asignado → usa ese
   * 2. Si el cliente tiene price_list_id → usa ese
   * 3. Si la clínica tiene price list por defecto → usa ese
   * 4. ERROR: No hay price list configurada
   */
  async resolvePriceListForAppointment(
    clinicId: string,
    clientId: string,
    appointmentPriceListId?: string
  ): Promise<PriceList> {
    // 1. Si la cita especifica una price list
    if (appointmentPriceListId) {
      const priceList = await this.priceListRepository.findOneBy({
        id: appointmentPriceListId,
        clinicId,
      });
      if (!priceList || !priceList.isActive) {
        throw new BadRequestException(
          'Price list associated with appointment is not active'
        );
      }
      return priceList;
    }

    // 2. Si el cliente tiene una price list asignada
    const client = await this.clientRepository.findOneBy({ id: clientId, clinicId });
    if (!client) {
      throw new NotFoundException('Client not found');
    }

    if (client.priceListId) {
      const priceList = await this.priceListRepository.findOneBy({
        id: client.priceListId,
        clinicId,
      });
      if (priceList && priceList.isActive) {
        return priceList;
      }
    }

    // 3. Usar la price list por defecto de la clínica
    const defaultPriceList = await this.priceListRepository.findOneBy({
      clinicId,
      isDefault: true,
      isActive: true,
    });

    if (!defaultPriceList) {
      throw new BadRequestException(
        'No active price list configured for clinic'
      );
    }

    return defaultPriceList;
  }

  /**
   * Gets the price of a service in a price list (frozen)
   */
  async getPriceAtBooking(
    clinicId: string,
    priceListId: string,
    serviceId: string
  ): Promise<number> {
    const servicePrice = await this.servicePriceRepository.findOneBy({
      clinicId,
      priceListId,
      serviceId,
    });

    if (!servicePrice) {
      throw new NotFoundException(
        `Service price not found for service ${serviceId} in price list ${priceListId}`
      );
    }

    return Number(servicePrice.price);
  }

  /**
   * Gets the price of a service with fallback to base service price
   * If service is not in the price list, uses the base service price instead
   */
  async getPriceWithFallback(
    clinicId: string,
    priceListId: string,
    serviceId: string
  ): Promise<number> {
    // Try to get price from price list first
    const servicePrice = await this.servicePriceRepository.findOneBy({
      clinicId,
      priceListId,
      serviceId,
    });

    if (servicePrice) {
      const price = Number(servicePrice.price);
      console.log(`💰 Service ${serviceId} price from price list ${priceListId}: $${price}`);
      return price;
    }

    // Fallback: get base service price
    const service = await this.serviceRepository.findOneBy({
      id: serviceId,
      clinicId,
    });

    if (!service) {
      throw new NotFoundException(`Service ${serviceId} not found`);
    }

    // 🚨 CRITICAL: Check if base price exists
    if (service.price === null || service.price === undefined) {
      console.error(
        `🚨 PRICE ERROR: Service "${service.name}" (${serviceId}) has NO price configured:`,
        `- Not in price list ${priceListId}`,
        `- No base price set on service`
      );
      // Return 0 but log the error - this shouldn't happen in production
      return 0;
    }

    const basePrice = Number(service.price);
    console.log(
      `⚠️ Service "${service.name}" (${serviceId}) not in price list ${priceListId}, using base price: $${basePrice}`
    );

    return basePrice;
  }

  /**
   * Gets the price of a package in a price list (frozen)
   */
  async getPackagePriceAtBooking(
    clinicId: string,
    priceListId: string,
    packageId: string
  ): Promise<number> {
    const packagePrice = await this.servicePackagePriceRepository.getPackagePrice(
      clinicId,
      priceListId,
      packageId
    );

    if (!packagePrice) {
      throw new BadRequestException(
        `PACKAGE_NOT_PRICED_IN_LIST: Package ${packageId} not found in price list ${priceListId}`
      );
    }

    if (!packagePrice.isAvailable) {
      throw new BadRequestException(
        `Package ${packageId} is not available in price list ${priceListId}`
      );
    }

    return Number(packagePrice.price);
  }

  /**
   * Calculates prices for an appointment without persisting yet
   * (useful for price preview in UI)
   */
  async calculateAppointmentPricing(
    dto: CalculateAppointmentPricingDto
  ): Promise<Omit<AppointmentPricingResult, 'appointmentId'>> {
    const { clinicId, serviceIds, packageIds, quantities = [], packageQuantities = [] } = dto;

    if (!serviceIds || serviceIds.length === 0) {
      if (!packageIds || packageIds.length === 0) {
        throw new BadRequestException('At least one service or package is required');
      }
    }

    // Validate quantities match array lengths
    if (serviceIds && serviceIds.length > 0) {
      if (quantities.length > 0 && quantities.length !== serviceIds.length) {
        throw new BadRequestException('quantities array must match serviceIds length');
      }
    }

    if (packageIds && packageIds.length > 0) {
      if (packageQuantities.length > 0 && packageQuantities.length !== packageIds.length) {
        throw new BadRequestException('packageQuantities array must match packageIds length');
      }
    }

    // Get or resolve price list
    let priceListId = dto.priceListId;
    if (!priceListId) {
      throw new BadRequestException('Price list ID is required for calculation');
    }

    const priceList = await this.priceListRepository.findOneBy({
      id: priceListId,
      clinicId,
      isActive: true,
    });

    if (!priceList) {
      throw new NotFoundException('Price list not found or inactive');
    }

    // Get services for validation
    const services = serviceIds && serviceIds.length > 0
      ? await this.serviceRepository.find({
          where: serviceIds.map(id => ({ id, clinicId })),
        })
      : [];

    if (serviceIds && serviceIds.length > 0 && services.length !== serviceIds.length) {
      throw new NotFoundException('One or more services not found');
    }

    // Get packages for validation
    const packages = packageIds && packageIds.length > 0
      ? await this.servicePackageRepository.find({
          where: packageIds.map(id => ({ id, clinicId, isActive: true })),
        })
      : [];

    if (packageIds && packageIds.length > 0 && packages.length !== packageIds.length) {
      throw new NotFoundException('One or more packages not found or inactive');
    }

    // Calculate prices
    const items: AppointmentPricingItem[] = [];
    let totalAmount = 0;

    // Process services
    if (serviceIds && serviceIds.length > 0) {
      const finalQuantities = quantities.length >= serviceIds.length
        ? quantities.slice(0, serviceIds.length)
        : [...quantities, ...Array(serviceIds.length - quantities.length).fill(1)];

      for (let i = 0; i < serviceIds.length; i++) {
        const serviceId = serviceIds[i];
        const quantity = finalQuantities[i];
        const service = services.find(s => s.id === serviceId);

        const priceAtBooking = await this.getPriceWithFallback(
          clinicId,
          priceListId,
          serviceId
        );

        const subtotal = priceAtBooking * quantity;
        totalAmount += subtotal;

        items.push({
          kind: 'SERVICE',
          serviceId,
          serviceName: service!.name,
          priceAtBooking,
          quantity,
          subtotal,
        });
      }
    }

    // Process packages
    if (packageIds && packageIds.length > 0) {
      const finalPackageQuantities = packageQuantities.length >= packageIds.length
        ? packageQuantities.slice(0, packageIds.length)
        : [...packageQuantities, ...Array(packageIds.length - packageQuantities.length).fill(1)];

      for (let i = 0; i < packageIds.length; i++) {
        const packageId = packageIds[i];
        const quantity = finalPackageQuantities[i];
        const pkg = packages.find(p => p.id === packageId);

        const priceAtBooking = await this.getPackagePriceAtBooking(
          clinicId,
          priceListId,
          packageId
        );

        const subtotal = priceAtBooking * quantity;
        totalAmount += subtotal;

        items.push({
          kind: 'PACKAGE',
          packageId,
          packageName: pkg!.name,
          priceAtBooking,
          quantity,
          subtotal,
        });
      }
    }

    // 🎯 Log pricing summary for debugging
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💵 PRICING CALCULATION SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Price List: ${priceListId}`);
    console.log('Items:');
    items.forEach((item, i) => {
      const name = item.kind === 'SERVICE' ? item.serviceName : item.packageName;
      console.log(`  ${i + 1}. ${name}: $${item.priceAtBooking} x ${item.quantity} = $${item.subtotal}`);
      if (item.priceAtBooking === 0) {
        console.log(`     🚨 WARNING: Price is $0!`);
      }
    });
    console.log(`TOTAL: $${totalAmount}`);
    if (totalAmount === 0 && items.length > 0) {
      console.log('🚨 WARNING: Total is $0 with items! Check price list configuration.');
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return {
      items,
      totalAmount,
      priceLockAt: new Date(),
      priceListId,
    };
  }

  /**
   * Crea una cita con precios congelados (transactional)
   * Esto es el corazón de la funcionalidad de pricing
   */
  async createAppointmentWithFrozenPrices(
    appointmentData: {
      clinicId: string;
      clientId: string;
      petId: string;
      scheduledAt: Date;
      durationMinutes?: number;
      reason?: string;
      notes?: string;
      locationType?: 'CLINIC' | 'HOME';
      serviceType: 'MEDICAL' | 'GROOMING';
      addressId?: string;
      assignedStaffUserId?: string;
      serviceIds?: string[];
      quantities?: number[];
      packageIds?: string[];
      packageQuantities?: number[];
      customPriceListId?: string;
    },
    queryRunner?: QueryRunner
  ): Promise<AppointmentPricingResult> {
    const {
      clinicId,
      clientId,
      petId,
      scheduledAt,
      durationMinutes = 30,
      serviceIds,
      packageIds,
      quantities = [],
      packageQuantities = [],
      customPriceListId,
      locationType = 'CLINIC',
      addressId,
      assignedStaffUserId,
    } = appointmentData;

    // 🔍 NUEVA VALIDACIÓN: Usar GroomingValidationService para todas las reglas de negocio
    const validationResult = await this.groomingValidationService.validateGroomingAppointment({
      clinicId,
      locationType,
      scheduledAt,
      durationMinutes,
      petId,
      clientId,
      addressId,
      appointmentId: undefined, // New appointment
      assignedStaffUserId, // Include stylist assignment
    });

    if (!validationResult.valid) {
      throw new BadRequestException(validationResult.errors.join('; '));
    }

    // 1. Resolve price list to use
    const priceList = await this.resolvePriceListForAppointment(
      clinicId,
      clientId,
      customPriceListId
    );

    // 2. Calculate pricing
    const pricing = await this.calculateAppointmentPricing({
      clinicId,
      serviceIds,
      quantities,
      packageIds,
      packageQuantities,
      priceListId: priceList.id,
    });

    // 3. Create appointment and pricing lines (transactional)
    const shouldUseTransaction = !queryRunner;
    const runner = queryRunner || await this.appointmentRepository.manager.connection.createQueryRunner();

    try {
      if (!queryRunner) {
        await runner.connect();
        await runner.startTransaction();
      }

      // Create appointment
      const appointment = this.appointmentRepository.create({
        clinicId,
        clientId,
        petId: appointmentData.petId,
        scheduledAt: appointmentData.scheduledAt,
        durationMinutes: appointmentData.durationMinutes,
        reason: appointmentData.reason,
        notes: appointmentData.notes,
        locationType,
        serviceType: appointmentData.serviceType,
        addressId,
        assignedStaffUserId,
        priceListId: priceList.id,
        totalAmount: pricing.totalAmount,
        priceLockAt: new Date(),
        status: 'SCHEDULED',
      });

      const savedAppointment = await runner.manager.save(Appointment, appointment);

      // Create pricing lines (appointment_items)
      for (const item of pricing.items) {
        const appointmentItem = this.appointmentItemRepository.create({
          clinicId,
          appointmentId: savedAppointment.id,
          serviceId: item.kind === 'SERVICE' ? item.serviceId : undefined,
          packageId: item.kind === 'PACKAGE' ? item.packageId : undefined,
          priceAtBooking: item.priceAtBooking,
          quantity: item.quantity,
          subtotal: item.subtotal,
        });

        await runner.manager.save(AppointmentItem, appointmentItem);
      }

      if (shouldUseTransaction) {
        await runner.commitTransaction();
      }

      return {
        appointmentId: savedAppointment.id,
        ...pricing,
      };
    } catch (error) {
      if (shouldUseTransaction) {
        await runner.rollbackTransaction();
      }
      throw error;
    } finally {
      if (shouldUseTransaction) {
        await runner.release();
      }
    }
  }

  /**
   * Gets current pricing for an appointment
   */
  async getAppointmentPricing(appointmentId: string): Promise<AppointmentPricingResult> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id: appointmentId },
      relations: ['priceList'],
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    const items = await this.appointmentItemRepository.getAppointmentItems(appointmentId);

    if (!items || items.length === 0) {
      throw new BadRequestException(
        'Appointment has no pricing items (corrupted data)'
      );
    }

    return {
      appointmentId,
      items: items.map(item => {
        const pricingItem: AppointmentPricingItem = {
          kind: item.serviceId ? 'SERVICE' : 'PACKAGE',
          priceAtBooking: Number(item.priceAtBooking),
          quantity: item.quantity,
          subtotal: Number(item.subtotal),
        };

        if (item.serviceId) {
          pricingItem.serviceId = item.serviceId;
          pricingItem.serviceName = item.service?.name || 'Unknown Service';
        } else if (item.packageId) {
          pricingItem.packageId = item.packageId;
          pricingItem.packageName = item.package?.name || 'Unknown Package';
        }

        return pricingItem;
      }),
      totalAmount: appointment.totalAmount || 0,
      priceLockAt: appointment.priceLockAt || new Date(),
      priceListId: appointment.priceListId || 'unknown',
    };
  }

  /**
   * Validates that appointment prices are still valid
   * (detects price changes since appointment was created)
   */
  async validateAppointmentPricing(appointmentId: string): Promise<{
    isValid: boolean;
    changedItems: Array<{
      kind: 'SERVICE' | 'PACKAGE';
      itemId: string;
      originalPrice: number;
      currentPrice: number;
    }>;
  }> {
    const appointment = await this.appointmentRepository.findOneBy({ id: appointmentId });
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    const items = await this.appointmentItemRepository.getAppointmentItems(appointmentId);
    const changedItems: any[] = [];

    for (const item of items) {
      let currentPrice: number;
      let kind: 'SERVICE' | 'PACKAGE';
      let itemId: string;

      if (item.serviceId) {
        kind = 'SERVICE';
        itemId = item.serviceId;
        currentPrice = await this.getPriceAtBooking(
          appointment.clinicId,
          appointment.priceListId!,
          item.serviceId
        );
      } else if (item.packageId) {
        kind = 'PACKAGE';
        itemId = item.packageId;
        currentPrice = await this.getPackagePriceAtBooking(
          appointment.clinicId,
          appointment.priceListId!,
          item.packageId
        );
      } else {
        continue;
      }

      if (Number(item.priceAtBooking) !== currentPrice) {
        changedItems.push({
          kind,
          itemId,
          originalPrice: Number(item.priceAtBooking),
          currentPrice,
        });
      }
    }

    return {
      isValid: changedItems.length === 0,
      changedItems,
    };
  }

  /**
   * Auditoría: Registra un cambio de precio en el historial
   */  /**
   * Actualizar servicios de una cita existente (modo EDIT)
   * Elimina servicios viejos y agrega los nuevos con precios congelados actuales
   */
  async updateAppointmentServices(
    clinicId: string,
    appointmentId: string,
    clientId: string,
    services: Array<{ serviceId: string; quantity: number }>,
  ): Promise<void> {
    // 1. Obtener la cita para saber qué priceList usar
    const appointment = await this.appointmentRepository.findOne({
      where: { id: appointmentId, clinicId },
    });

    if (!appointment) {
      throw new NotFoundException('Cita no encontrada');
    }

    // 2. Obtener el cliente y su priceList
    const client = await this.clientRepository.findOne({
      where: { id: clientId, clinicId },
      relations: ['priceList'],
    });

    if (!client) {
      throw new NotFoundException('Cliente no encontrado');
    }

    const priceList = client.priceList;
    if (!priceList) {
      throw new BadRequestException('Cliente no tiene lista de precios asignada');
    }

    // 3. Eliminar servicios viejos
    await this.appointmentItemRepository.delete({
      appointmentId,
    });

    // 4. Agregar nuevos servicios con precios congelados
    for (const service of services) {
      // Obtener precio actual del servicio en la priceList
      const servicePrice = await this.servicePriceRepository.findOne({
        where: {
          priceListId: priceList.id,
          serviceId: service.serviceId,
        },
      });

      if (!servicePrice) {
        throw new BadRequestException(
          `Servicio ${service.serviceId} no tiene precio en la lista de este cliente`,
        );
      }

      // Crear AppointmentItem con precio congelado
      await this.appointmentItemRepository.createAppointmentItem(
        clinicId,
        appointmentId,
        service.serviceId,
        undefined, // packageId
        servicePrice.price,
        service.quantity,
      );
    }
  }
  async auditPriceChange(
    clinicId: string,
    priceListId: string,
    serviceId: string,
    newPrice: number,
    oldPrice?: number,
    changedByUserId?: string,
    reason?: string
  ): Promise<void> {
    await this.priceListHistoryRepository.recordPriceChange(
      clinicId,
      priceListId,
      serviceId,
      newPrice,
      oldPrice,
      changedByUserId,
      reason
    );
  }
}
