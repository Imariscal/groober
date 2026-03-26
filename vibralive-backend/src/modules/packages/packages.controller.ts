import { Controller, Post, Get, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { PackagesService, PackageResponse } from './packages.service';
import { CreateServicePackageDto } from './dtos/create-package.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { PermissionGuard } from '../../modules/auth/guards/permission.guard';
import { CurrentClinicId } from '../../common/decorators/current-clinic-id.decorator';
import { RequirePermission } from '../../modules/auth/decorators/permission.decorator';

@UseGuards(AuthGuard, TenantGuard, PermissionGuard)
@Controller('service-packages')
export class PackagesController {
  constructor(private readonly packagesService: PackagesService) {}

  @Get()
  @RequirePermission('packages:read')
  async getAll(@CurrentClinicId() clinicId: string): Promise<{ data: PackageResponse[] }> {
    const packages = await this.packagesService.getPackagesByClinic(clinicId);
    return { data: packages };
  }

  @Get(':id')
  @RequirePermission('packages:read')
  async getOne(
    @CurrentClinicId() clinicId: string,
    @Param('id') packageId: string,
  ): Promise<{ data: PackageResponse }> {
    const pkg = await this.packagesService.getPackageById(clinicId, packageId);
    return { data: pkg };
  }

  @Post()
  @RequirePermission('packages:create')
  async create(
    @CurrentClinicId() clinicId: string,
    @Body() dto: CreateServicePackageDto,
  ): Promise<{ data: PackageResponse }> {
    const pkg = await this.packagesService.createPackage(clinicId, dto);
    return { data: pkg };
  }

  @Patch(':id')
  @RequirePermission('packages:update')
  async update(
    @CurrentClinicId() clinicId: string,
    @Param('id') packageId: string,
    @Body() dto: Partial<CreateServicePackageDto>,
  ): Promise<{ data: PackageResponse }> {
    const pkg = await this.packagesService.updatePackage(clinicId, packageId, dto);
    return { data: pkg };
  }

  @Delete(':id')
  @RequirePermission('packages:delete')
  async delete(
    @CurrentClinicId() clinicId: string,
    @Param('id') packageId: string,
  ) {
    await this.packagesService.deletePackage(clinicId, packageId);
    return { message: 'Service package deleted successfully' };
  }

  @Patch(':id/deactivate')
  async deactivate(
    @CurrentClinicId() clinicId: string,
    @Param('id') packageId: string,
  ): Promise<{ data: PackageResponse }> {
    const pkg = await this.packagesService.deactivatePackage(clinicId, packageId);
    return { data: pkg };
  }
}
