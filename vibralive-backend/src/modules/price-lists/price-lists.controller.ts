import { Controller, Get, Post, Patch, Delete, UseGuards, Query, Param, Body } from '@nestjs/common';
import { AuthGuard } from '@/common/guards/auth.guard';
import { TenantGuard } from '@/common/guards/tenant.guard';
import { PermissionGuard } from '@/modules/auth/guards/permission.guard';
import { CurrentClinicId } from '@/common/decorators/current-clinic-id.decorator';
import { RequirePermission } from '@/modules/auth/decorators/permission.decorator';
import { PriceListsService } from './price-lists.service';

@Controller('price-lists')
@UseGuards(AuthGuard, TenantGuard, PermissionGuard)
export class PriceListsController {
  constructor(private readonly priceListsService: PriceListsService) {}

  /**
   * GET /price-lists
   * Returns all ACTIVE price lists for the clinic
   */
  @Get()
  @RequirePermission('pricing:price_lists:read')
  async getActivePriceLists(@CurrentClinicId() clinicId: string) {
    const priceLists = await this.priceListsService.getActivePriceLists(clinicId);
    return {
      success: true,
      data: priceLists,
    };
  }

  /**
   * GET /price-lists/default
   * Returns the default price list for clinicId
   */
  @Get('default')
  @RequirePermission('pricing:price_lists:read')
  async getDefaultPriceList(@CurrentClinicId() clinicId: string) {
    const priceList = await this.priceListsService.getDefaultPriceList(clinicId);
    return {
      success: true,
      data: priceList,
    };
  }

  /**
   * POST /price-lists
   * Create a new price list
   */
  @Post()
  @RequirePermission('pricing:price_lists:create')
  async createPriceList(
    @CurrentClinicId() clinicId: string,
    @Body() dto: any,
  ) {
    const priceList = await this.priceListsService.createPriceList(clinicId, dto);
    return { success: true, data: priceList };
  }

  /**
   * GET /price-lists/:priceListId/service-prices
   * Get all service prices for a price list
   * ⚠️ Must come BEFORE @Get(':priceListId') to avoid route shadowing
   */
  @Get(':priceListId/service-prices')
  @RequirePermission('pricing:service_prices:read')
  async getServicePrices(
    @CurrentClinicId() clinicId: string,
    @Param('priceListId') priceListId: string,
    @Query('serviceId') serviceId?: string,
  ) {
    const prices = await this.priceListsService.getServicePrices(clinicId, priceListId, serviceId);
    return { success: true, data: prices };
  }

  /**
   * GET /price-lists/:priceListId/services/:serviceId/history
   * Get price change history for a service
   * ⚠️ Must come BEFORE @Get(':priceListId') to avoid route shadowing
   */
  @Get(':priceListId/services/:serviceId/history')
  @RequirePermission('pricing:service_prices:read')
  async getPriceHistory(
    @CurrentClinicId() clinicId: string,
    @Param('priceListId') priceListId: string,
    @Param('serviceId') serviceId: string,
    @Query('limit') limit = 20,
  ) {
    const history = await this.priceListsService.getPriceHistory(
      clinicId,
      priceListId,
      serviceId,
      limit,
    );
    return { success: true, data: history };
  }

  /**
   * PATCH /price-lists/:priceListId/services/:serviceId/price
   * Update service price in a price list
   * ⚠️ Must come BEFORE @Patch(':priceListId') to avoid route shadowing
   */
  @Patch(':priceListId/services/:serviceId/price')
  async updateServicePrice(
    @CurrentClinicId() clinicId: string,
    @Param('priceListId') priceListId: string,
    @Param('serviceId') serviceId: string,
    @Body() dto: any,
  ) {
    const price = await this.priceListsService.updateServicePrice(
      clinicId,
      priceListId,
      serviceId,
      dto,
    );
    return { success: true, data: price };
  }

  /**
   * GET /price-lists/:priceListId/services/:serviceId/size-prices
   * Get all size prices for a service in a price list
   * ⚠️ Must come BEFORE generic patterns to avoid route shadowing
   */
  @Get(':priceListId/services/:serviceId/size-prices')
  @RequirePermission('pricing:service_prices:read')
  async getServiceSizePrices(
    @CurrentClinicId() clinicId: string,
    @Param('priceListId') priceListId: string,
    @Param('serviceId') serviceId: string,
  ) {
    console.log(`[Controller] GET /price-lists/${priceListId}/services/${serviceId}/size-prices - clinicId=${clinicId}`);
    const prices = await this.priceListsService.getServiceSizePrices(clinicId, priceListId, serviceId);
    console.log(`[Controller] Returning ${prices.length} prices`);
    const response = { success: true, data: prices };
    console.log(`[Controller] Response structure:`, JSON.stringify(response).substring(0, 200));
    return response;
  }

  /**
   * GET /price-lists/:priceListId/services/:serviceId/size-prices/:petSize
   * Get a specific size price for a service in a price list
   * Returns list-specific price if exists, otherwise global price
   * ⚠️ Must come BEFORE generic patterns to avoid route shadowing
   */
  @Get(':priceListId/services/:serviceId/size-prices/:petSize')
  @RequirePermission('pricing:service_prices:read')
  async getServiceSizePrice(
    @CurrentClinicId() clinicId: string,
    @Param('priceListId') priceListId: string,
    @Param('serviceId') serviceId: string,
    @Param('petSize') petSize: 'XS' | 'S' | 'M' | 'L' | 'XL',
  ) {
    console.log(`[Controller] GET /price-lists/${priceListId}/services/${serviceId}/size-prices/${petSize} - clinicId=${clinicId}`);
    const price = await this.priceListsService.getServiceSizePrice(
      clinicId,
      priceListId,
      serviceId,
      petSize,
    );
    if (!price) {
      return { success: false, data: null, message: 'Price not found' };
    }
    console.log(`[Controller] Returning price: ${price.price}`);
    return { success: true, data: price };
  }

  /**
   * PATCH /price-lists/:priceListId/services/:serviceId/size-prices/:petSize
   * Update a specific size price for a service in a price list
   * ⚠️ Must come BEFORE generic patterns to avoid route shadowing
   */
  @Patch(':priceListId/services/:serviceId/size-prices/:petSize')
  async updateServiceSizePrice(
    @CurrentClinicId() clinicId: string,
    @Param('priceListId') priceListId: string,
    @Param('serviceId') serviceId: string,
    @Param('petSize') petSize: 'XS' | 'S' | 'M' | 'L' | 'XL',
    @Body() dto: any,
  ) {
    const price = await this.priceListsService.updateServiceSizePrice(
      clinicId,
      priceListId,
      serviceId,
      petSize,
      dto,
    );
    return { success: true, data: price };
  }

  /**
   * DELETE /price-lists/:priceListId/services/:serviceId
   * Remove a service from a price list
   * ⚠️ Cannot remove services from the DEFAULT price list
   * ⚠️ Must come BEFORE @Delete(':priceListId') to avoid route shadowing
   */
  @Delete(':priceListId/services/:serviceId')
  async removeServiceFromPriceList(
    @CurrentClinicId() clinicId: string,
    @Param('priceListId') priceListId: string,
    @Param('serviceId') serviceId: string,
  ) {
    await this.priceListsService.removeServiceFromPriceList(
      clinicId,
      priceListId,
      serviceId,
    );
    return { success: true, message: 'Service removed from price list' };
  }

  /**
   * GET /price-lists/:priceListId/package-prices
   * Get all package prices for a price list
   * ⚠️ Must come BEFORE @Get(':priceListId') to avoid route shadowing
   */
  @Get(':priceListId/package-prices')
  async getPackagePrices(
    @CurrentClinicId() clinicId: string,
    @Param('priceListId') priceListId: string,
    @Query('packageId') packageId?: string,
  ) {
    const prices = await this.priceListsService.getPackagePrices(clinicId, priceListId, packageId);
    return { success: true, data: prices };
  }

  /**
   * PATCH /price-lists/:priceListId/packages/:packageId/price
   * Update package price in a price list
   * ⚠️ Must come BEFORE @Patch(':priceListId') to avoid route shadowing
   */
  @Patch(':priceListId/packages/:packageId/price')
  async updatePackagePrice(
    @CurrentClinicId() clinicId: string,
    @Param('priceListId') priceListId: string,
    @Param('packageId') packageId: string,
    @Body() dto: any,
  ) {
    const price = await this.priceListsService.updatePackagePrice(
      clinicId,
      priceListId,
      packageId,
      dto,
    );
    return { success: true, data: price };
  }

  /**
   * DELETE /price-lists/:priceListId/packages/:packageId
   * Remove a package from a price list
   * ⚠️ Cannot remove packages from the DEFAULT price list
   * ⚠️ Must come BEFORE @Delete(':priceListId') to avoid route shadowing
   */
  @Delete(':priceListId/packages/:packageId')
  async removePackageFromPriceList(
    @CurrentClinicId() clinicId: string,
    @Param('priceListId') priceListId: string,
    @Param('packageId') packageId: string,
  ) {
    await this.priceListsService.removePackageFromPriceList(
      clinicId,
      priceListId,
      packageId,
    );
    return { success: true, message: 'Package removed from price list' };
  }

  /**
   * GET /price-lists/:priceListId
   * Returns a single price list with all service prices
   * ⚠️ Generic pattern - must come AFTER specific patterns
   */
  @Get(':priceListId')
  async getPriceList(
    @CurrentClinicId() clinicId: string,
    @Param('priceListId') priceListId: string,
  ) {
    const priceList = await this.priceListsService.getPriceListById(clinicId, priceListId);
    return { success: true, data: priceList };
  }

  /**
   * PATCH /price-lists/:priceListId
   * Update a price list
   * ⚠️ Generic pattern - must come AFTER specific patterns
   */
  @Patch(':priceListId')
  async updatePriceList(
    @CurrentClinicId() clinicId: string,
    @Param('priceListId') priceListId: string,
    @Body() dto: any,
  ) {
    const priceList = await this.priceListsService.updatePriceList(clinicId, priceListId, dto);
    return { success: true, data: priceList };
  }

  /**
   * DELETE /price-lists/:priceListId
   * Delete a price list
   * ⚠️ Generic pattern - must come AFTER specific patterns
   */
  @Delete(':priceListId')
  async deletePriceList(
    @CurrentClinicId() clinicId: string,
    @Param('priceListId') priceListId: string,
  ) {
    await this.priceListsService.deletePriceList(clinicId, priceListId);
    return { success: true, message: 'Price list deleted successfully' };
  }
}
