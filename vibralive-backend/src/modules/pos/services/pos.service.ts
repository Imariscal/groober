import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, DeepPartial } from 'typeorm';
import {
  SaleProduct,
  Sale,
  SaleItem,
  SalePayment,
  InventoryMovement,
  Client,
  Appointment,
  AppointmentItem,
  Service,
} from '@/database/entities';
import {
  CreateSaleProductDto,
  UpdateSaleProductDto,
  CreateSaleDto,
  CompleteSaleDto,
  CreateSalePaymentDto,
  CreateInventoryMovementDto,
} from '../dtos/pos.dto';

@Injectable()
export class POSService {
  constructor(
    @InjectRepository(SaleProduct)
    private productRepository: Repository<SaleProduct>,
    @InjectRepository(Sale)
    private saleRepository: Repository<Sale>,
    @InjectRepository(SaleItem)
    private saleItemRepository: Repository<SaleItem>,
    @InjectRepository(SalePayment)
    private paymentRepository: Repository<SalePayment>,
    @InjectRepository(InventoryMovement)
    private inventoryRepository: Repository<InventoryMovement>,
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
    @InjectRepository(AppointmentItem)
    private appointmentItemRepository: Repository<AppointmentItem>,
    @InjectRepository(Service)
    private serviceRepository: Repository<Service>,
    private dataSource: DataSource,
  ) {}

  // ============ PRODUCTS ============

  async createProduct(dto: CreateSaleProductDto): Promise<SaleProduct> {
    // Check SKU uniqueness per clinic
    const existing = await this.productRepository.findOne({
      where: { clinicId: dto.clinicId, sku: dto.sku },
    });

    if (existing) {
      throw new BadRequestException('SKU already exists for this clinic');
    }

    const product = this.productRepository.create({
      ...dto,
      stockQuantity: dto.stockQuantity || 0,
      stockUnit: dto.stockUnit || 'UNIT',
    });

    return this.productRepository.save(product);
  }

  async updateProduct(id: string, dto: UpdateSaleProductDto): Promise<SaleProduct> {
    const product = await this.productRepository.findOne({ where: { id } });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    Object.assign(product, dto);
    return this.productRepository.save(product);
  }

  async getProduct(id: string): Promise<SaleProduct> {
    const product = await this.productRepository.findOne({ where: { id } });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async getProductsByClinic(
    clinicId: string,
    category?: string,
    isActive?: boolean,
  ): Promise<SaleProduct[]> {
    const query = this.productRepository.createQueryBuilder('p')
      .where('p.clinic_id = :clinicId', { clinicId });

    // Solo filtrar por isActive si se especifica explícitamente
    if (typeof isActive === 'boolean') {
      query.andWhere('p.is_active = :isActive', { isActive });
    }

    if (category) {
      query.andWhere('p.category = :category', { category });
    }

    return query.orderBy('p.name', 'ASC').getMany();
  }

  async checkLowStock(clinicId: string): Promise<SaleProduct[]> {
    return this.productRepository
      .createQueryBuilder('p')
      .where('p.clinic_id = :clinicId', { clinicId })
      .andWhere('p.is_active = true')
      .andWhere('p.min_stock_alert IS NOT NULL')
      .andWhere('p.stock_quantity <= p.min_stock_alert')
      .orderBy('p.name', 'ASC')
      .getMany();
  }

  // ============ SALES ============

  async createDraftSale(dto: CreateSaleDto): Promise<Sale> {
    // Validate client if provided
    if (dto.clientId) {
      const client = await this.clientRepository.findOne({
        where: { id: dto.clientId, clinicId: dto.clinicId },
      });

      if (!client) {
        throw new NotFoundException('Client not found');
      }
    }

    // Create sale
    const sale = this.saleRepository.create({
      clinicId: dto.clinicId,
      clientId: dto.clientId,
      appointmentId: dto.appointmentId,
      saleType: dto.saleType || 'POS',
      status: 'DRAFT',
      createdByUserId: dto.createdByUserId,
    });

    const savedSale = await this.saleRepository.save(sale);

    // Add items - WITHOUT stock validation (this is a DRAFT cart)
    // Stock validation happens only when COMPLETING the sale
    let subtotal = 0;
    for (const itemData of dto.items) {
      const itemSubtotal = itemData.quantity * itemData.unitPrice;
      subtotal += itemSubtotal;

      // Handle product items
      if (itemData.productId) {
        const product = await this.productRepository.findOne({
          where: { id: itemData.productId, clinicId: dto.clinicId },
        });

        if (!product) {
          throw new NotFoundException(`Product ${itemData.productId} not found`);
        }

        // ✓ Soft validation: show warning if quantity exceeds visible stock
        // but don't block creation - this is just informational for the UI
        if (product.stockQuantity < itemData.quantity) {
          // Log warning but don't block - strong validation happens at COMPLETE
          console.warn(
            `Warning: Draft sale item ${itemData.productId} quantity ${itemData.quantity} exceeds current stock ${product.stockQuantity}. ` +
            `Strong validation will occur when completing the sale.`,
          );
        }

        const item = this.saleItemRepository.create({
          clinicId: dto.clinicId,
          saleId: savedSale.id,
          productId: itemData.productId,
          quantity: itemData.quantity,
          unitPrice: itemData.unitPrice,
          subtotal: itemSubtotal,
        });

        await this.saleItemRepository.save(item);
      }
      // Handle service items (from appointments)
      else if (itemData.serviceId) {
        const service = await this.serviceRepository.findOne({
          where: { id: itemData.serviceId },
        });

        if (!service) {
          throw new NotFoundException(`Service ${itemData.serviceId} not found`);
        }

        const item = this.saleItemRepository.create({
          clinicId: dto.clinicId,
          saleId: savedSale.id,
          serviceId: itemData.serviceId,
          quantity: itemData.quantity,
          unitPrice: itemData.unitPrice,
          subtotal: itemSubtotal,
        });

        await this.saleItemRepository.save(item);
      }
    }

    // Update sale totals
    savedSale.subtotal = subtotal;
    savedSale.discountAmount = dto.discountAmount || 0;
    savedSale.taxAmount = dto.taxAmount || 0;
    savedSale.totalAmount = subtotal - (dto.discountAmount || 0) + (dto.taxAmount || 0);
    savedSale.notes = dto.notes;

    return this.saleRepository.save(savedSale);
  }

  /**
   * CREATE SALE FROM COMPLETED APPOINTMENT
   * Converts a grooming appointment with services into a DRAFT sale
   * allowing the user to add additional retail items before charging
   */
  async createSaleFromAppointment(
    clinicId: string,
    appointmentId: string,
  ): Promise<Sale> {
    // 1. Fetch appointment with all its items and relations
    const appointment = await this.appointmentRepository.findOne({
      where: { id: appointmentId, clinicId },
      relations: ['client', 'appointmentItems'],
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    // 2. Validate appointment is completed grooming
    if (appointment.status !== 'COMPLETED') {
      throw new BadRequestException('Only completed appointments can be converted to sales');
    }

    // For now, we only support grooming appointments (can extend later)
    if (appointment.serviceType !== 'GROOMING') {
      throw new BadRequestException('Only grooming appointments can be converted to sales');
    }

    // 3. Check if sale already exists for this appointment
    const existingSale = await this.saleRepository.findOne({
      where: { appointmentId },
    });

    if (existingSale) {
      throw new BadRequestException('A sale already exists for this appointment');
    }

    // 4. Create DRAFT sale
    const sale = this.saleRepository.create({
      clinicId,
      appointmentId,
      clientId: appointment.clientId,
      saleType: 'APPOINTMENT_ADDON',
      status: 'DRAFT',
    });

    const savedSale = await this.saleRepository.save(sale);

    // 5. Convert appointmentItems to saleItems
    if (appointment.appointmentItems && appointment.appointmentItems.length > 0) {
      let subtotal = 0;

      for (const appItem of appointment.appointmentItems) {
        // Get service details for pricing
        const service = await this.serviceRepository.findOne({
          where: { id: appItem.serviceId },
        });

        if (!service) {
          console.warn(`Service ${appItem.serviceId} not found, skipping item`);
          continue;
        }

        // Create sale item with service reference
        const saleItem = this.saleItemRepository.create({
          clinicId,
          saleId: savedSale.id,
          serviceId: appItem.serviceId,
          appointmentItemId: appItem.id,
          quantity: 1, // Services are usually qty 1
          unitPrice: appItem.priceAtBooking,
          subtotal: appItem.priceAtBooking,
        });

        await this.saleItemRepository.save(saleItem);
        subtotal += appItem.priceAtBooking;
      }

      // Update sale totals from appointment items
      savedSale.subtotal = subtotal;
      savedSale.totalAmount = subtotal;
    }

    return this.saleRepository.save(savedSale);
  }

  /**
   * COMPLETE SALE - atomically decrements inventory with strong validation
   * 
   * This is the ONLY time inventory is affected. The operation:
   * 1. Starts a database transaction
   * 2. Validates each product and quantity
   * 3. Uses atomic UPDATE to safely decrement stock
   * 4. Creates audit trail via inventory_movements
   * 5. Marks sale as COMPLETED
   * 6. Commits all changes or rolls back entirely
   * 
   * This approach is safe against concurrent terminal sessions because:
   * - The UPDATE statement is atomic at the DB level
   * - If stock is insufficient, the UPDATE affects 0 rows
   * - The entire operation is transactional (all-or-nothing)
   */
  async completeSale(saleId: string, dto: CompleteSaleDto): Promise<Sale> {
    const sale = await this.saleRepository.findOne({
      where: { id: saleId },
      relations: ['items'],
    });

    if (!sale) {
      throw new NotFoundException('Sale not found');
    }

    // ✓ Validation based on sale type:
    // APPOINTMENT_ADDON (grooming visits): Can be completed directly from any non-terminal state
    // POS (point of sale): Must be in DRAFT status to be completed
    if (sale.saleType === 'POS' && sale.status !== 'DRAFT') {
      throw new BadRequestException(
        'POS sales must be in DRAFT status to be completed. Current status: ' + sale.status
      );
    }

    // APPOINTMENT_ADDON can be completed if not already COMPLETED or CANCELLED
    if (sale.saleType === 'APPOINTMENT_ADDON' && (sale.status === 'COMPLETED' || sale.status === 'CANCELLED')) {
      throw new BadRequestException(
        `Cannot complete sale with status "${sale.status}". Sale has already been processed.`
      );
    }

    // Use items from DTO if provided, otherwise use existing items from sale
    const itemsToProcess = (dto.items && dto.items.length > 0) ? dto.items : sale.items;

    if (!itemsToProcess || itemsToProcess.length === 0) {
      throw new BadRequestException('Sale must have at least one item');
    }

    // Start transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let subtotal = 0;

      // Process each item with STRONG validation and atomic stock update
      for (const itemData of itemsToProcess) {
        const quantity = itemData.quantity;
        const unitPrice = itemData.unitPrice;

        // Validate quantity
        if (quantity <= 0) {
          throw new BadRequestException('Sale quantity must be greater than 0');
        }

        const itemSubtotal = quantity * unitPrice;
        subtotal += itemSubtotal;

        // Handle product items (need stock deduction)
        if (itemData.productId) {
          // 1. Load product using query runner to ensure consistency within transaction
          const product = await queryRunner.manager.findOne(SaleProduct, {
            where: { id: itemData.productId, clinicId: sale.clinicId },
          });

          if (!product) {
            throw new NotFoundException(
              `Product with id ${itemData.productId} not found`,
            );
          }

          if (!product.isActive) {
            throw new BadRequestException(
              `Product ${product.name} is inactive and cannot be sold`,
            );
          }

          // 2. ATOMIC and SAFE stock deduction using QueryBuilder
          // The WHERE condition ensures stock >= quantity BEFORE updating
          // If no rows are affected, it means stock was insufficient
          const updateResult = await queryRunner.manager
            .createQueryBuilder()
            .update(SaleProduct)
            .set({
              stockQuantity: () => 'stock_quantity - :qty',
            })
            .where('id = :productId', { productId: itemData.productId })
            .andWhere('stock_quantity >= :qty', { qty: quantity })
            .execute();

          // Check if the update was successful (1 row affected = success, 0 = insufficient stock)
          if (updateResult.affected === 0) {
            // Get current stock for better error message
            const currentProduct = await queryRunner.manager.findOne(SaleProduct, {
              where: { id: itemData.productId },
            });
            throw new BadRequestException(
              `Insufficient stock for product ${product.name}. ` +
              `Available: ${currentProduct?.stockQuantity || 0}. ` +
              `Requested: ${quantity}`,
            );
          }

          // 3. Create inventory movement (OUT) for audit trail
          const movement = queryRunner.manager.create(InventoryMovement, {
            clinicId: sale.clinicId,
            productId: itemData.productId,
            movementType: 'OUT',
            quantity: quantity,
            reason: 'SALE',
            referenceId: sale.id,
            createdByUserId: sale.createdByUserId,
          });

          await queryRunner.manager.save(movement);
        }
        // Handle service items (no stock management needed)
        else if (itemData.serviceId) {
          const service = await queryRunner.manager.findOne(Service, {
            where: { id: itemData.serviceId },
          });

          if (!service) {
            throw new NotFoundException(
              `Service with id ${itemData.serviceId} not found`,
            );
          }
        }
      }

      // 5. If items were modified (from DTO), update items in transaction
      if (dto.items && dto.items.length > 0) {
        // Delete old items
        await queryRunner.manager.delete(SaleItem, { saleId: sale.id });

        // Re-insert items from DTO
        for (const itemData of dto.items) {
          const itemPayload = {
            clinicId: sale.clinicId,
            saleId: sale.id,
            productId: itemData.productId || null,
            serviceId: itemData.serviceId || null,
            quantity: itemData.quantity,
            unitPrice: itemData.unitPrice,
            subtotal: itemData.quantity * itemData.unitPrice,
          };
          const item = queryRunner.manager.create(SaleItem, itemPayload as unknown as DeepPartial<SaleItem>);
          await queryRunner.manager.save(item);
        }
      }

      // 6. Update sale status and totals
      sale.status = 'COMPLETED';
      sale.subtotal = subtotal;
      sale.discountAmount = dto.discountAmount || 0;
      sale.taxAmount = dto.taxAmount || 0;
      sale.totalAmount =
        subtotal - (dto.discountAmount || 0) + (dto.taxAmount || 0);
      sale.notes = dto.notes;
      sale.soldAt = new Date();

      await queryRunner.manager.save(sale);

      // 6.5 Mark appointment as paid if this is an APPOINTMENT_ADDON sale
      if (sale.saleType === 'APPOINTMENT_ADDON' && sale.appointmentId) {
        const appointment = await queryRunner.manager.findOne(Appointment, {
          where: { id: sale.appointmentId },
        });

        if (appointment) {
          appointment.paid = true;
          appointment.paymentDate = new Date();
          await queryRunner.manager.save(appointment);
        }
      }

      // 7. Commit transaction (all-or-nothing)
      await queryRunner.commitTransaction();

      return sale;
    } catch (error) {
      // Rollback on any error
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Always release the query runner
      await queryRunner.release();
    }
  }

  async cancelSale(saleId: string): Promise<Sale> {
    // ✓ DEFENSE IN DEPTH: Validate input
    if (!saleId || typeof saleId !== 'string') {
      throw new BadRequestException('Invalid sale ID');
    }

    const sale = await this.saleRepository.findOne({
      where: { id: saleId },
      relations: ['items'],
    });

    if (!sale) {
      console.warn(`[SECURITY] Attempted to cancel non-existent sale: ${saleId}`);
      throw new NotFoundException('Sale not found');
    }

    // ✓ CRITICAL: Double-check status (defense against tampering)
    if (sale.status !== 'DRAFT') {
      console.warn(
        `[SECURITY ALERT] Attempted to cancel non-DRAFT sale ${saleId}. ` +
        `Current status: ${sale.status}. This may indicate unauthorized access attempt.`,
      );
      throw new BadRequestException(
        `Cannot cancel sale with status "${sale.status}". ` +
        `Only DRAFT sales can be cancelled. ` +
        `For COMPLETED sales, use the /refund endpoint instead.`,
      );
    }

    // ✓ Verify sale has items (integrity check)
    if (!sale.items || sale.items.length === 0) {
      console.warn(`[AUDIT] Cancelling empty sale ${saleId}`);
    }

    // Perform the cancellation
    sale.status = 'CANCELLED';
    sale.cancelledAt = new Date();
    
    const cancelled = await this.saleRepository.save(sale);
    
    console.log(
      `[AUDIT] Sale ${saleId} successfully cancelled. ` +
      `Items: ${sale.items?.length || 0}, Amount: ${sale.totalAmount}`,
    );

    return cancelled;
  }

  async refundSale(saleId: string): Promise<Sale> {
    const sale = await this.saleRepository.findOne({
      where: { id: saleId },
      relations: ['items'],
    });

    if (!sale) {
      throw new NotFoundException('Sale not found');
    }

    if (sale.status !== 'COMPLETED') {
      throw new BadRequestException('Only completed sales can be refunded');
    }

    // Start transaction for atomic refund
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Restore inventory for each item
      for (const item of sale.items) {
        const product = await queryRunner.manager.findOne(SaleProduct, {
          where: { id: item.productId, clinicId: sale.clinicId },
        });

        if (product) {
          // Atomically restore stock using QueryBuilder
          await queryRunner.manager
            .createQueryBuilder()
            .update(SaleProduct)
            .set({
              stockQuantity: () => 'stock_quantity + :qty',
            })
            .where('id = :productId')
            .setParameters({
              productId: product.id,
              qty: item.quantity,
            })
            .execute();

          // Create inventory IN movement for audit trail
          const movement = queryRunner.manager.create(InventoryMovement, {
            clinicId: sale.clinicId,
            productId: item.productId,
            movementType: 'IN',
            quantity: item.quantity,
            reason: 'RETURN',
            referenceId: saleId,
            createdByUserId: sale.createdByUserId,
          });

          await queryRunner.manager.save(movement);
        }
      }

      // Update sale status
      sale.status = 'REFUNDED';
      await queryRunner.manager.save(sale);

      // Commit transaction
      await queryRunner.commitTransaction();

      return sale;
    } catch (error) {
      // Rollback on any error
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Always release the query runner
      await queryRunner.release();
    }
  }

  async updateDraftSale(saleId: string, dto: any): Promise<Sale> {
    // ✓ DEFENSE IN DEPTH: Validate input parameters
    if (!saleId || typeof saleId !== 'string') {
      throw new BadRequestException('Invalid sale ID');
    }

    if (!dto || typeof dto !== 'object') {
      throw new BadRequestException('Invalid request payload');
    }

    const sale = await this.saleRepository.findOne({
      where: { id: saleId },
      relations: ['items'],
    });

    if (!sale) {
      throw new NotFoundException('Sale not found');
    }

    // ✓ CRITICAL: Double-check status (defense against malformed requests)
    if (sale.status !== 'DRAFT') {
      console.warn(
        `[SECURITY] Attempted to edit non-DRAFT sale ${saleId} with status ${sale.status}. ` +
        `This may indicate a curl/direct API manipulation attempt.`,
      );
      throw new BadRequestException(
        `Cannot edit sale with status "${sale.status}". ` +
        `Only DRAFT sales can be edited.`,
      );
    }

    // ✓ Validate items array
    if (!Array.isArray(dto.items) || dto.items.length === 0) {
      throw new BadRequestException('Sale must have at least one item');
    }

    // ✓ Validate each item format and data
    for (const itemData of dto.items) {
      // Item must have EITHER productId OR serviceId (not both required, but at least one)
      const hasProductId = !!itemData.productId;
      const hasServiceId = !!itemData.serviceId;
      
      if (!hasProductId && !hasServiceId) {
        throw new BadRequestException(
          'Invalid item format. Each item must have either productId or serviceId',
        );
      }

      if (!itemData.quantity || typeof itemData.unitPrice !== 'number') {
        throw new BadRequestException(
          'Invalid item format. Each item must have: quantity, unitPrice',
        );
      }

      if (itemData.quantity <= 0) {
        throw new BadRequestException('Item quantity must be greater than 0');
      }

      if (itemData.unitPrice < 0) {
        throw new BadRequestException('Item unit price cannot be negative');
      }
    }

    // ✓ Validate discount and tax
    const discount = dto.discountAmount || 0;
    const tax = dto.taxAmount || 0;
    if (discount < 0 || tax < 0) {
      throw new BadRequestException('Discount and tax amounts cannot be negative');
    }

    // Start transaction for consistency
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Delete existing items using query runner
      await queryRunner.manager
        .createQueryBuilder()
        .delete()
        .from(SaleItem)
        .where('saleId = :saleId', { saleId: sale.id })
        .execute();

      // Recalculate totals
      let subtotal = 0;
      const newItems = [];
      
      for (const itemData of dto.items) {
        const itemSubtotal = itemData.quantity * itemData.unitPrice;
        subtotal += itemSubtotal;

        // Handle product items
        if (itemData.productId) {
          const product = await queryRunner.manager.findOne(SaleProduct, {
            where: { id: itemData.productId, clinicId: sale.clinicId },
          });

          if (!product) {
            throw new NotFoundException(`Product ${itemData.productId} not found`);
          }

          if (!product.isActive) {
            throw new BadRequestException(
              `Product ${product.name} is inactive and cannot be added to a sale`,
            );
          }

          // ✓ Soft warning if quantity exceeds visible stock
          if (product.stockQuantity < itemData.quantity) {
            console.warn(
              `[STOCK WARNING] Sale ${saleId}: Item ${itemData.productId} quantity ${itemData.quantity} ` +
              `exceeds current stock ${product.stockQuantity}. Will validate at completion.`,
            );
          }

          const item = queryRunner.manager.create(SaleItem, {
            id: undefined, // 👈 Force TypeORM to generate new UUID (no UPDATE)
            clinicId: sale.clinicId,
            saleId: sale.id,
            productId: itemData.productId,
            quantity: itemData.quantity,
            unitPrice: itemData.unitPrice,
            subtotal: itemSubtotal,
          });

          newItems.push(item);
        } 
        // Handle service items (from appointments)
        else if (itemData.serviceId) {
          const service = await queryRunner.manager.findOne(Service, {
            where: { id: itemData.serviceId },
          });

          if (!service) {
            throw new NotFoundException(`Service ${itemData.serviceId} not found`);
          }

          const item = queryRunner.manager.create(SaleItem, {
            id: undefined, // 👈 Force TypeORM to generate new UUID (no UPDATE)
            clinicId: sale.clinicId,
            saleId: sale.id,
            serviceId: itemData.serviceId,
            quantity: itemData.quantity,
            unitPrice: itemData.unitPrice,
            subtotal: itemSubtotal,
          });

          newItems.push(item);
        }
      }

      // Save all items using insert() instead of save() to avoid UPDATE attempts
      if (newItems.length > 0) {
        const itemsForInsert = newItems.map(item => ({
          clinicId: item.clinicId,
          saleId: item.saleId,
          productId: item.productId,
          serviceId: item.serviceId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
        }));
        await queryRunner.manager.insert(SaleItem, itemsForInsert);
      }

      // ✓ Validate calculated totals
      const totalAmount = subtotal - discount + tax;
      if (totalAmount < 0) {
        throw new BadRequestException(
          'Sale total cannot be negative. Check discount amount.',
        );
      }

      // Update sale totals using query builder to avoid TypeORM relationship sync
      // (which would try to UPDATE sale_items with sale_id = null)
      await queryRunner.manager.update(
        Sale,
        { id: saleId },
        {
          subtotal: subtotal,
          discountAmount: discount,
          taxAmount: tax,
          totalAmount: totalAmount,
          notes: dto.notes || null,
          clientId: dto.clientId || null,
        }
      );

      await queryRunner.commitTransaction();

      console.log(`[AUDIT] Sale ${saleId} updated successfully. Items: ${newItems.length}, Subtotal: ${subtotal}`);
      
      // Reload with relations
      return this.getSale(sale.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[ERROR] Failed to update sale ${saleId}:`, errorMessage);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getSale(id: string): Promise<Sale> {
    const sale = await this.saleRepository.findOne({
      where: { id },
      relations: ['items', 'items.product', 'items.service', 'payments', 'client'],
    });

    if (!sale) {
      throw new NotFoundException('Sale not found');
    }

    return sale;
  }

  async getSalesByClinic(
    clinicId: string,
    status?: string,
    limit: number = 100,
    offset: number = 0,
  ): Promise<{ data: Sale[]; total: number }> {
    const query = this.saleRepository
      .createQueryBuilder('s')
      .where('s.clinic_id = :clinicId', { clinicId })
      .leftJoinAndSelect('s.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('items.service', 'service')
      .leftJoinAndSelect('s.client', 'client');

    if (status) {
      query.andWhere('s.status = :status', { status });
    }

    const total = await query.getCount();
    const data = await query
      .orderBy('s.created_at', 'DESC')
      .limit(limit)
      .offset(offset)
      .getMany();

    return { data, total };
  }

  // ============ PAYMENTS ============

  async addPayment(saleId: string, dto: CreateSalePaymentDto): Promise<SalePayment> {
    const sale = await this.saleRepository.findOne({ where: { id: saleId } });

    if (!sale) {
      throw new NotFoundException('Sale not found');
    }

    const payment = this.paymentRepository.create({
      clinicId: sale.clinicId,
      saleId,
      paymentMethod: dto.paymentMethod,
      amount: dto.amount,
      reference: dto.reference,
      paidAt: new Date(dto.paidAt),
    });

    return this.paymentRepository.save(payment);
  }

  async getPaymentsForSale(saleId: string): Promise<SalePayment[]> {
    return this.paymentRepository.find({
      where: { saleId },
      order: { createdAt: 'ASC' },
    });
  }

  // ============ INVENTORY ============

  async createInventoryMovement(dto: CreateInventoryMovementDto): Promise<InventoryMovement> {
    const product = await this.productRepository.findOne({
      where: { id: dto.productId, clinicId: dto.clinicId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const movement = this.inventoryRepository.create({
      clinicId: dto.clinicId,
      productId: dto.productId,
      movementType: dto.movementType,
      quantity: dto.quantity,
      reason: dto.reason,
      referenceId: dto.referenceId,
      notes: dto.notes,
      createdByUserId: dto.createdByUserId,
    });

    return this.inventoryRepository.save(movement);
  }

  async getInventoryHistory(
    productId: string,
    limit: number = 100,
  ): Promise<InventoryMovement[]> {
    return this.inventoryRepository.find({
      where: { productId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getInventoryMovementsByClinic(
    clinicId: string,
    limit: number = 100,
    offset: number = 0,
  ): Promise<{ data: InventoryMovement[]; total: number }> {
    const query = this.inventoryRepository.createQueryBuilder('im')
      .where('im.clinic_id = :clinicId', { clinicId });

    const total = await query.getCount();
    const data = await query
      .orderBy('im.created_at', 'DESC')
      .limit(limit)
      .offset(offset)
      .getMany();

    return { data, total };
  }
}
