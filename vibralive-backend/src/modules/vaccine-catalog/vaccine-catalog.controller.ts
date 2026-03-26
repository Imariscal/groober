import { Controller, Get, Post, Patch, Delete, Body, Param, HttpCode, UseGuards } from '@nestjs/common';
import { VaccineCatalogService } from './vaccine-catalog.service';
import { CreateVaccineDto } from './dtos/create-vaccine.dto';
import { AuthGuard } from '@/common/guards/auth.guard';
import { TenantGuard } from '@/common/guards/tenant.guard';
import { PermissionGuard } from '@/modules/auth/guards/permission.guard';
import { CurrentClinicId } from '@/common/decorators/current-clinic-id.decorator';
import { RequirePermission } from '@/modules/auth/decorators/permission.decorator';

@UseGuards(AuthGuard, TenantGuard, PermissionGuard)
@Controller('vaccine-catalog')
export class VaccineCatalogController {
  constructor(private readonly vaccineCatalogService: VaccineCatalogService) {}

  /**
   * GET /vaccine-catalog
   * Obtener todas las vacunas activas de la clínica
   */
  @Get()
  @RequirePermission('vaccines:read')
  async getVaccines(@CurrentClinicId() clinicId: string) {
    const vaccines = await this.vaccineCatalogService.getVaccines(clinicId);
    return { data: vaccines };
  }

  /**
   * GET /vaccine-catalog/all
   * Obtener todas las vacunas (incluyendo inactivas)
   */
  @Get('all')
  @RequirePermission('vaccines:read')
  async getAllVaccines(@CurrentClinicId() clinicId: string) {
    const vaccines = await this.vaccineCatalogService.getAllVaccines(clinicId);
    return { data: vaccines };
  }

  /**
   * GET /vaccine-catalog/:id
   * Obtener una vacuna específica
   */
  @Get(':id')
  @RequirePermission('vaccines:read')
  async getVaccineById(
    @CurrentClinicId() clinicId: string,
    @Param('id') vaccineId: string,
  ) {
    const vaccine = await this.vaccineCatalogService.getVaccineById(clinicId, vaccineId);
    return { data: vaccine };
  }

  /**
   * POST /vaccine-catalog
   * Crear nueva vacuna en el catálogo
   */
  @Post()
  @HttpCode(201)
  @RequirePermission('vaccines:create')
  async createVaccine(
    @CurrentClinicId() clinicId: string,
    @Body() dto: CreateVaccineDto,
  ) {
    const vaccine = await this.vaccineCatalogService.createVaccine(clinicId, dto);
    return { data: vaccine };
  }

  /**
   * PATCH /vaccine-catalog/:id
   * Actualizar vacuna
   */
  @Patch(':id')
  @RequirePermission('vaccines:update')
  async updateVaccine(
    @CurrentClinicId() clinicId: string,
    @Param('id') vaccineId: string,
    @Body() dto: Partial<CreateVaccineDto>,
  ) {
    const vaccine = await this.vaccineCatalogService.updateVaccine(clinicId, vaccineId, dto);
    return { data: vaccine };
  }

  /**
   * PATCH /vaccine-catalog/:id/activate
   * Activar vacuna
   */
  @Patch(':id/activate')
  @RequirePermission('vaccines:update')
  async activateVaccine(
    @CurrentClinicId() clinicId: string,
    @Param('id') vaccineId: string,
  ) {
    const vaccine = await this.vaccineCatalogService.activateVaccine(clinicId, vaccineId);
    return { data: vaccine };
  }

  /**
   * PATCH /vaccine-catalog/:id/deactivate
   * Desactivar vacuna
   */
  @Patch(':id/deactivate')
  @RequirePermission('vaccines:update')
  async deactivateVaccine(
    @CurrentClinicId() clinicId: string,
    @Param('id') vaccineId: string,
  ) {
    const vaccine = await this.vaccineCatalogService.deactivateVaccine(clinicId, vaccineId);
    return { data: vaccine };
  }

  /**
   * DELETE /vaccine-catalog/:id
   * Eliminar vacuna
   */
  @Delete(':id')
  @RequirePermission('vaccines:delete')
  async deleteVaccine(
    @CurrentClinicId() clinicId: string,
    @Param('id') vaccineId: string,
  ) {
    await this.vaccineCatalogService.deleteVaccine(clinicId, vaccineId);
    return { message: 'Vacuna eliminada correctamente' };
  }
}
