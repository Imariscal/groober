import { Controller, Post, Get, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dtos/create-service.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { PermissionGuard } from '../../modules/auth/guards/permission.guard';
import { CurrentClinicId } from '../../common/decorators/current-clinic-id.decorator';
import { RequirePermission } from '../../modules/auth/decorators/permission.decorator';

@UseGuards(AuthGuard, TenantGuard, PermissionGuard)
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  @RequirePermission('services:read')
  async getAll(@CurrentClinicId() clinicId: string) {
    const services = await this.servicesService.getServicesByClinic(clinicId);
    return { data: services };
  }

  @Get(':id')
  @RequirePermission('services:read')
  async getOne(
    @CurrentClinicId() clinicId: string,
    @Param('id') serviceId: string,
  ) {
    const service = await this.servicesService.getServiceById(clinicId, serviceId);
    return { data: service };
  }

  @Post()
  @RequirePermission('services:create')
  async create(
    @CurrentClinicId() clinicId: string,
    @Body() dto: CreateServiceDto,
  ) {
    const service = await this.servicesService.createService(clinicId, dto);
    return { data: service };
  }

  @Patch(':id')
  @RequirePermission('services:update')
  async update(
    @CurrentClinicId() clinicId: string,
    @Param('id') serviceId: string,
    @Body() dto: Partial<CreateServiceDto>,
  ) {
    const service = await this.servicesService.updateService(clinicId, serviceId, dto);
    return { data: service };
  }

  @Delete(':id')
  @RequirePermission('services:delete')
  async delete(
    @CurrentClinicId() clinicId: string,
    @Param('id') serviceId: string,
  ) {
    await this.servicesService.deleteService(clinicId, serviceId);
    return { message: 'Service deleted successfully' };
  }

  @Patch(':id/deactivate')
  @RequirePermission('services:deactivate')
  async deactivate(
    @CurrentClinicId() clinicId: string,
    @Param('id') serviceId: string,
  ) {
    const service = await this.servicesService.deactivateService(clinicId, serviceId);
    return { data: service };
  }

  // ==================== SERVICE SIZE PRICES ====================

  @Get(':serviceId/size-prices')
  @RequirePermission('services:read')
  async getSizePrices(
    @CurrentClinicId() clinicId: string,
    @Param('serviceId') serviceId: string,
  ) {
    const prices = await this.servicesService.getSizePricesByService(clinicId, serviceId);
    return { data: prices };
  }

  @Get(':serviceId/size-prices/:petSize')
  @RequirePermission('services:read')
  async getSizePrice(
    @CurrentClinicId() clinicId: string,
    @Param('serviceId') serviceId: string,
    @Param('petSize') petSize: string,
  ) {
    const price = await this.servicesService.getSizePrice(clinicId, serviceId, petSize);
    return { data: price };
  }

  @Post(':serviceId/size-prices')
  @RequirePermission('services:create')
  async createSizePrice(
    @CurrentClinicId() clinicId: string,
    @Param('serviceId') serviceId: string,
    @Body() dto: { petSize: string; price: number; currency?: string },
  ) {
    const price = await this.servicesService.createSizePrice(clinicId, serviceId, dto);
    return { data: price };
  }

  @Post(':serviceId/size-prices/batch')
  @RequirePermission('services:create')
  async batchCreateSizePrices(
    @CurrentClinicId() clinicId: string,
    @Param('serviceId') serviceId: string,
    @Body() dto: { prices: Array<{ petSize: string; price: number; currency?: string }> },
  ) {
    const prices = await this.servicesService.createMultipleSizePrices(
      clinicId,
      serviceId,
      dto.prices,
    );
    return { data: prices };
  }

  @Patch(':serviceId/size-prices/:petSize')
  @RequirePermission('services:update')
  async updateSizePrice(
    @CurrentClinicId() clinicId: string,
    @Param('serviceId') serviceId: string,
    @Param('petSize') petSize: string,
    @Body() dto: { price?: number; currency?: string; is_active?: boolean },
  ) {
    const price = await this.servicesService.updateSizePrice(
      clinicId,
      serviceId,
      petSize,
      dto,
    );
    return { data: price };
  }

  @Delete(':serviceId/size-prices/:petSize')
  @RequirePermission('services:delete')
  async deleteSizePrice(
    @CurrentClinicId() clinicId: string,
    @Param('serviceId') serviceId: string,
    @Param('petSize') petSize: string,
  ) {
    await this.servicesService.deleteSizePrice(clinicId, serviceId, petSize);
    return { message: 'Size price deleted successfully' };
  }

  @Post(':serviceId/size-prices/apply-all')
  @RequirePermission('services:update')
  async applyPriceToAllSizes(
    @CurrentClinicId() clinicId: string,
    @Param('serviceId') serviceId: string,
    @Body() dto: { price: number; currency?: string },
  ) {
    const prices = await this.servicesService.applyPriceToAllSizes(
      clinicId,
      serviceId,
      dto.price,
      dto.currency,
    );
    return { data: prices };
  }
}
