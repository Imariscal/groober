import {
  Controller,
  Post,
  Get,
  Put,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { POSService } from '../services/pos.service';
import { AuthGuard } from '@/common/guards/auth.guard';
import { TenantGuard } from '@/common/guards/tenant.guard';
import { PermissionGuard } from '@/common/guards/permission.guard';
import { RequirePermission } from '@/common/decorators/require-permission.decorator';
import { CurrentClinicId } from '@/common/decorators/current-clinic-id.decorator';

@Controller('pos')
@UseGuards(AuthGuard, TenantGuard, PermissionGuard)
export class POSController {
  constructor(private readonly posService: POSService) {}

  // ============================================
  // PRODUCT ENDPOINTS
  // ============================================

  /**
   * Create a product
   */
  @Post('products')
  @RequirePermission('pos:products:create')
  async createProduct(
    @CurrentClinicId() clinicId: string,
    @Body() dto: any,
  ) {
    const product = await this.posService.createProduct({
      ...dto,
      clinicId,
    });
    return { data: product };
  }

  /**
   * Get product by ID
   */
  @Get('products/:id')
  @RequirePermission('pos:products:read')
  async getProduct(
    @CurrentClinicId() clinicId: string,
    @Param('id') id: string,
  ) {
    const product = await this.posService.getProduct(id);
    // Validate clinic ownership
    if (product.clinicId !== clinicId) {
      throw new ForbiddenException('Product does not belong to your clinic');
    }
    return { data: product };
  }

  /**
   * Get all products for clinic
   */
  @Get('products')
  @RequirePermission('pos:products:read')
  async getProducts(
    @CurrentClinicId() clinicId: string,
    @Query('category') category?: string,
    @Query('isActive') isActive?: string,
  ) {
    // Por defecto, traer TODOS los productos (activos e inactivos)
    // Pasar ?isActive=true o ?isActive=false para filtrar específicamente
    let filterByActive: boolean | undefined = undefined;
    if (isActive === 'true') {
      filterByActive = true;
    } else if (isActive === 'false') {
      filterByActive = false;
    }
    
    const products = await this.posService.getProductsByClinic(
      clinicId,
      category,
      filterByActive,
    );
    return { data: products };
  }

  /**
   * Update a product
   */
  @Put('products/:id')
  @RequirePermission('pos:products:update')
  async updateProduct(
    @CurrentClinicId() clinicId: string,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    const existing = await this.posService.getProduct(id);
    // Validate clinic ownership
    if (existing.clinicId !== clinicId) {
      throw new ForbiddenException('Product does not belong to your clinic');
    }
    const updated = await this.posService.updateProduct(id, dto);
    return { data: updated };
  }

  /**
   * Get low stock products
   */
  @Get('products/alerts/low-stock')
  @RequirePermission('pos:products:read')
  async getLowStockProducts(@CurrentClinicId() clinicId: string) {
    const products = await this.posService.checkLowStock(clinicId);
    return { data: products };
  }

  // ============================================
  // SALES ENDPOINTS
  // ============================================

  /**
   * Create a draft sale
   */
  @Post('sales')
  @RequirePermission('pos:sales:create')
  async createSale(
    @CurrentClinicId() clinicId: string,
    @Body() dto: any,
  ) {
    const sale = await this.posService.createDraftSale({
      ...dto,
      clinicId,
    });
    return { data: sale };
  }

  /**
   * Get all sales for clinic
   */
  @Get('sales')
  @RequirePermission('pos:sales:read')
  async getSales(
    @CurrentClinicId() clinicId: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const sales = await this.posService.getSalesByClinic(
      clinicId,
      status,
      limit ? parseInt(limit) : undefined,
      offset ? parseInt(offset) : undefined,
    );
    return sales;
  }

  /**
   * Get sale by ID
   */
  @Get('sales/:id')
  @RequirePermission('pos:sales:read')
  async getSaleById(
    @CurrentClinicId() clinicId: string,
    @Param('id') id: string,
  ) {
    const sale = await this.posService.getSale(id);
    // Validate clinic ownership
    if (sale.clinicId !== clinicId) {
      throw new ForbiddenException('Sale does not belong to your clinic');
    }
    return { data: sale };
  }

  /**
   * Update a draft sale
   * 
   * NOTE: Only DRAFT sales can be edited.
   * Once a sale is COMPLETED, it cannot be modified.
   * 
   * SECURITY: This endpoint has multiple layers of validation:
   * 1. Controller-level: Checks clinic ownership and status
   * 2. Service-level: Re-validates status and all item data
   * 3. Database-level: Status is immutable after completion
   */
  @Put('sales/:id')
  @RequirePermission('pos:sales:update')
  async updateSale(
    @CurrentClinicId() clinicId: string,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    // ✓ LAYER 1: Controller-level validation
    if (!id || typeof id !== 'string') {
      throw new BadRequestException('Invalid sale ID format');
    }

    if (!dto || typeof dto !== 'object') {
      throw new BadRequestException('Invalid request payload');
    }

    if (!Array.isArray(dto.items) || dto.items.length === 0) {
      throw new BadRequestException('Sale must have at least one item');
    }

    const sale = await this.posService.getSale(id);
    
    // Validate clinic ownership - prevent cross-clinic manipulation
    if (sale.clinicId !== clinicId) {
      throw new ForbiddenException('Sale does not belong to your clinic');
    }

    // ✓ CRITICAL: Enforce Golden Rule at controller level
    // This prevents any non-DRAFT sale from reaching the service
    if (sale.status !== 'DRAFT') {
      throw new BadRequestException(
        `Cannot edit sale with status "${sale.status}". ` +
        `Only DRAFT sales can be edited. ` +
        `COMPLETED, REFUNDED, and CANCELLED sales cannot be modified.`,
      );
    }

    // ✓ LAYER 2: Pass to service for additional validation and updates
    const updated = await this.posService.updateDraftSale(id, {
      ...dto,
      clinicId,
    });

    return { data: updated };
  }

  /**
   * Complete a sale
   */
  @Patch('sales/:id/complete')
  @RequirePermission('pos:sales:complete')
  async completeSale(
    @CurrentClinicId() clinicId: string,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    const sale = await this.posService.getSale(id);
    // Validate clinic ownership
    if (sale.clinicId !== clinicId) {
      throw new ForbiddenException('Sale does not belong to your clinic');
    }
    const completed = await this.posService.completeSale(id, dto);
    return { data: completed };
  }

  /**
   * Cancel a sale
   * 
   * NOTE: Only DRAFT sales can be cancelled.
   * COMPLETED sales must use the /refund endpoint instead.
   * 
   * SECURITY: Multi-layer validation prevents unauthorized modifications:
   * 1. Authentication guard - user must be logged in
   * 2. Tenant guard - user must belong to the clinic
   * 3. Permission guard - user must have pos:sales:cancel permission
   * 4. Clinic ownership check - sale must belong to current clinic
   * 5. Status check - sale must be DRAFT
   * 6. Service-level re-validation - double-check status
   */
  @Patch('sales/:id/cancel')
  @RequirePermission('pos:sales:cancel')
  async cancelSale(
    @CurrentClinicId() clinicId: string,
    @Param('id') id: string,
  ) {
    // ✓ LAYER 1: Controller validation
    if (!id || typeof id !== 'string' || id.length === 0) {
      throw new BadRequestException('Invalid sale ID format');
    }

    const sale = await this.posService.getSale(id);
    
    // Validate clinic ownership - prevent cross-clinic access
    if (sale.clinicId !== clinicId) {
      throw new ForbiddenException('Sale does not belong to your clinic');
    }

    // ✓ CRITICAL: Enforce Golden Rule
    // Only DRAFT sales can be cancelled
    if (sale.status !== 'DRAFT') {
      throw new BadRequestException(
        `Cannot cancel sale with status "${sale.status}". ` +
        `Only DRAFT sales can be cancelled. ` +
        `For COMPLETED sales, use the /refund endpoint instead.`,
      );
    }

    // ✓ LAYER 2: Pass to service for final validation and execution
    // Service will re-check status (defense in depth)
    const cancelled = await this.posService.cancelSale(id);

    return { data: cancelled };
  }

  /**
   * Refund a sale
   */
  @Patch('sales/:id/refund')
  @RequirePermission('pos:sales:refund')
  async refundSale(
    @CurrentClinicId() clinicId: string,
    @Param('id') id: string,
  ) {
    const sale = await this.posService.getSale(id);
    // Validate clinic ownership
    if (sale.clinicId !== clinicId) {
      throw new ForbiddenException('Sale does not belong to your clinic');
    }
    const refunded = await this.posService.refundSale(id);
    return { data: refunded };
  }

  /**
   * Create a sale from a completed appointment
   * Converts grooming appointment services into sale items
   */
  @Post('sales/from-appointment/:appointmentId')
  @RequirePermission('pos:sales:create')
  async createSaleFromAppointment(
    @CurrentClinicId() clinicId: string,
    @Param('appointmentId') appointmentId: string,
  ) {
    const sale = await this.posService.createSaleFromAppointment(clinicId, appointmentId);
    return { data: sale };
  }

  /**
   * Add payment to sale
   */
  @Post('sales/:id/payments')
  @RequirePermission('pos:sales:update')
  async addPayment(
    @CurrentClinicId() clinicId: string,
    @Param('id') saleId: string,
    @Body() dto: any,
  ) {
    const sale = await this.posService.getSale(saleId);
    // Validate clinic ownership
    if (sale.clinicId !== clinicId) {
      throw new ForbiddenException('Sale does not belong to your clinic');
    }
    const payment = await this.posService.addPayment(saleId, dto);
    return { data: payment };
  }

  /**
   * Get payments for sale
   */
  @Get('sales/:id/payments')
  @RequirePermission('pos:sales:read')
  async getPayments(
    @CurrentClinicId() clinicId: string,
    @Param('id') saleId: string,
  ) {
    const sale = await this.posService.getSale(saleId);
    // Validate clinic ownership
    if (sale.clinicId !== clinicId) {
      throw new ForbiddenException('Sale does not belong to your clinic');
    }
    const payments = await this.posService.getPaymentsForSale(saleId);
    return { data: payments };
  }

  // ============================================
  // INVENTORY ENDPOINTS
  // ============================================

  /**
   * Create inventory movement (add/remove)
   */
  @Post('inventory/movements')
  @RequirePermission('pos:inventory:update')
  async createMovement(@Body() dto: any) {
    const movement = await this.posService.createInventoryMovement(dto);
    return { data: movement };
  }

  /**
   * Get inventory history for a product
   */
  @Get('inventory/product/:productId')
  @RequirePermission('pos:inventory:read')
  async getProductInventory(
    @Param('productId') productId: string,
    @Query('limit') limit?: string,
  ) {
    const history = await this.posService.getInventoryHistory(
      productId,
      limit ? parseInt(limit) : undefined,
    );
    return { data: history };
  }

  /**
   * Get all inventory movements for clinic
   */
  @Get('inventory/movements')
  @RequirePermission('pos:inventory:read')
  async getMovements(
    @CurrentClinicId() clinicId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const movements = await this.posService.getInventoryMovementsByClinic(
      clinicId,
      limit ? parseInt(limit) : undefined,
      offset ? parseInt(offset) : undefined,
    );
    return movements;
  }
}
