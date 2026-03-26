import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@/common/guards';
import { TenantGuard } from '@/common/guards/tenant.guard';
import { PermissionGuard } from '@/modules/auth/guards/permission.guard';
import { RequirePermission } from '@/modules/auth/decorators/permission.decorator';
import { VeterinariansService } from './veterinarians.service';
import {
  CreateVeterinarianDto,
  UpdateVeterinarianDto,
  VeterinarianListResponseDto,
  CreateVeterinarianAvailabilityDto,
  UpdateVeterinarianAvailabilityDto,
  VeterinarianAvailabilityResponseDto,
  CreateVeterinarianUnavailablePeriodDto,
  UpdateVeterinarianUnavailablePeriodDto,
  VeterinarianUnavailablePeriodResponseDto,
  CreateVeterinarianCapacityDto,
  UpdateVeterinarianCapacityDto,
  VeterinarianCapacityResponseDto,
} from './veterinarians.dto';

@Controller('clinics/:clinicId/veterinarians')
@UseGuards(AuthGuard, TenantGuard, PermissionGuard)
export class VeterinariansController {
  constructor(private readonly veterinariansService: VeterinariansService) {}

  /**
   * Crear un veterinario
   */
  @Post()
  @RequirePermission('veterinarians:create')
  async createVeterinarian(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Body() dto: CreateVeterinarianDto,
  ): Promise<VeterinarianListResponseDto> {
    return this.veterinariansService.createVeterinarian(clinicId, dto);
  }

  /**
   * Listar veterinarios de la clínica
   */
  @Get()
  @RequirePermission('veterinarians:read')
  async listVeterinarians(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Query('bookableOnly') bookableOnly?: string,
  ): Promise<VeterinarianListResponseDto[]> {
    if (bookableOnly === 'true') {
      return this.veterinariansService.listBookableVeterinarians(clinicId);
    }
    return this.veterinariansService.listClinicVeterinarians(clinicId);
  }

  /**
   * Obtener veterinario por ID
   */
  @Get(':veterinarianId')
  @RequirePermission('veterinarians:read')
  async getVeterinarian(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('veterinarianId', ParseUUIDPipe) veterinarianId: string,
  ): Promise<VeterinarianListResponseDto> {
    return this.veterinariansService.getVeterinarianById(clinicId, veterinarianId);
  }

  /**
   * Actualizar veterinario
   */
  @Put(':veterinarianId')
  @RequirePermission('veterinarians:update')
  async updateVeterinarian(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('veterinarianId', ParseUUIDPipe) veterinarianId: string,
    @Body() dto: UpdateVeterinarianDto,
  ): Promise<VeterinarianListResponseDto> {
    return this.veterinariansService.updateVeterinarian(clinicId, veterinarianId, dto);
  }

  /**
   * Eliminar veterinario
   */
  @Delete(':veterinarianId')
  @RequirePermission('veterinarians:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteVeterinarian(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('veterinarianId', ParseUUIDPipe) veterinarianId: string,
  ): Promise<void> {
    return this.veterinariansService.deleteVeterinarian(clinicId, veterinarianId);
  }

  // ============= AVAILABILITY ENDPOINTS =============

  /**
   * Crear horario de trabajo para un veterinario
   */
  @Post(':veterinarianId/availabilities')
  @RequirePermission('veterinarians:update')
  async createAvailability(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('veterinarianId', ParseUUIDPipe) veterinarianId: string,
    @Body() dto: CreateVeterinarianAvailabilityDto,
  ): Promise<VeterinarianAvailabilityResponseDto> {
    return this.veterinariansService.createAvailability(clinicId, veterinarianId, dto);
  }

  /**
   * Listar horarios de un veterinario
   */
  @Get(':veterinarianId/availabilities')
  @RequirePermission('veterinarians:read')
  async listAvailabilities(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('veterinarianId', ParseUUIDPipe) veterinarianId: string,
  ): Promise<VeterinarianAvailabilityResponseDto[]> {
    return this.veterinariansService.listAvailabilities(clinicId, veterinarianId);
  }

  /**
   * Actualizar horario
   */
  @Put(':veterinarianId/availabilities/:availabilityId')
  @RequirePermission('veterinarians:update')
  async updateAvailability(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('veterinarianId', ParseUUIDPipe) veterinarianId: string,
    @Param('availabilityId', ParseUUIDPipe) availabilityId: string,
    @Body() dto: UpdateVeterinarianAvailabilityDto,
  ): Promise<VeterinarianAvailabilityResponseDto> {
    return this.veterinariansService.updateAvailability(
      clinicId,
      veterinarianId,
      availabilityId,
      dto,
    );
  }

  /**
   * Eliminar horario
   */
  @Delete(':veterinarianId/availabilities/:availabilityId')
  @RequirePermission('veterinarians:update')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAvailability(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('veterinarianId', ParseUUIDPipe) veterinarianId: string,
    @Param('availabilityId', ParseUUIDPipe) availabilityId: string,
  ): Promise<void> {
    return this.veterinariansService.deleteAvailability(
      clinicId,
      veterinarianId,
      availabilityId,
    );
  }

  // ============= UNAVAILABLE PERIOD ENDPOINTS =============

  /**
   * Crear período de no disponibilidad
   */
  @Post(':veterinarianId/unavailable-periods')
  @RequirePermission('veterinarians:update')
  async createUnavailablePeriod(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('veterinarianId', ParseUUIDPipe) veterinarianId: string,
    @Body() dto: CreateVeterinarianUnavailablePeriodDto,
  ): Promise<VeterinarianUnavailablePeriodResponseDto> {
    return this.veterinariansService.createUnavailablePeriod(
      clinicId,
      veterinarianId,
      dto,
    );
  }

  /**
   * Listar períodos de no disponibilidad
   */
  @Get(':veterinarianId/unavailable-periods')
  @RequirePermission('veterinarians:read')
  async listUnavailablePeriods(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('veterinarianId', ParseUUIDPipe) veterinarianId: string,
  ): Promise<VeterinarianUnavailablePeriodResponseDto[]> {
    return this.veterinariansService.listUnavailablePeriods(clinicId, veterinarianId);
  }

  /**
   * Actualizar período de no disponibilidad
   */
  @Put(':veterinarianId/unavailable-periods/:periodId')
  @RequirePermission('veterinarians:update')
  async updateUnavailablePeriod(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('veterinarianId', ParseUUIDPipe) veterinarianId: string,
    @Param('periodId', ParseUUIDPipe) periodId: string,
    @Body() dto: UpdateVeterinarianUnavailablePeriodDto,
  ): Promise<VeterinarianUnavailablePeriodResponseDto> {
    return this.veterinariansService.updateUnavailablePeriod(
      clinicId,
      veterinarianId,
      periodId,
      dto,
    );
  }

  /**
   * Eliminar período de no disponibilidad
   */
  @Delete(':veterinarianId/unavailable-periods/:periodId')
  @RequirePermission('veterinarians:update')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUnavailablePeriod(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('veterinarianId', ParseUUIDPipe) veterinarianId: string,
    @Param('periodId', ParseUUIDPipe) periodId: string,
  ): Promise<void> {
    return this.veterinariansService.deleteUnavailablePeriod(
      clinicId,
      veterinarianId,
      periodId,
    );
  }

  // ============= CAPACITY ENDPOINTS =============

  /**
   * Crear capacidad para un día específico
   */
  @Post(':veterinarianId/capacities')
  @RequirePermission('veterinarians:update')
  async createCapacity(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('veterinarianId', ParseUUIDPipe) veterinarianId: string,
    @Body() dto: CreateVeterinarianCapacityDto,
  ): Promise<VeterinarianCapacityResponseDto> {
    return this.veterinariansService.createCapacity(clinicId, veterinarianId, dto);
  }

  /**
   * Listar capacidades
   */
  @Get(':veterinarianId/capacities')
  @RequirePermission('veterinarians:read')
  async listCapacities(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('veterinarianId', ParseUUIDPipe) veterinarianId: string,
  ): Promise<VeterinarianCapacityResponseDto[]> {
    return this.veterinariansService.listCapacities(clinicId, veterinarianId);
  }

  /**
   * Actualizar capacidad
   */
  @Put(':veterinarianId/capacities/:capacityId')
  @RequirePermission('veterinarians:update')
  async updateCapacity(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('veterinarianId', ParseUUIDPipe) veterinarianId: string,
    @Param('capacityId', ParseUUIDPipe) capacityId: string,
    @Body() dto: UpdateVeterinarianCapacityDto,
  ): Promise<VeterinarianCapacityResponseDto> {
    return this.veterinariansService.updateCapacity(
      clinicId,
      veterinarianId,
      capacityId,
      dto,
    );
  }

  /**
   * Eliminar capacidad
   */
  @Delete(':veterinarianId/capacities/:capacityId')
  @RequirePermission('veterinarians:update')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCapacity(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('veterinarianId', ParseUUIDPipe) veterinarianId: string,
    @Param('capacityId', ParseUUIDPipe) capacityId: string,
  ): Promise<void> {
    return this.veterinariansService.deleteCapacity(
      clinicId,
      veterinarianId,
      capacityId,
    );
  }
}
