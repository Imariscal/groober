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
} from '@nestjs/common';
import { AuthGuard } from '@/common/guards';
import { TenantGuard } from '@/common/guards/tenant.guard';
import { PermissionGuard } from '@/modules/auth/guards/permission.guard';
import { RequirePermission } from '@/modules/auth/decorators/permission.decorator';
import { StylistsService } from './stylists.service';
import { StylistAvailabilityService } from './services/stylist-availability.service';
import {
  UpdateStylistDto,
  StylistListResponseDto,
  CreateStylistAvailabilityDto,
  UpdateStylistAvailabilityDto,
  StylistAvailabilityResponseDto,
  CreateStylistUnavailablePeriodDto,
  UpdateStylistUnavailablePeriodDto,
  StylistUnavailablePeriodResponseDto,
  CreateStylistCapacityDto,
  UpdateStylistCapacityDto,
  StylistCapacityResponseDto,
  CheckAvailabilityDto,
  AvailabilityCheckResponseDto,
  GetAvailableStylitsDto,
  StylistAvailableSlotDto,
} from './stylists.dto';

@Controller('clinics/:clinicId/stylists')
@UseGuards(AuthGuard, TenantGuard, PermissionGuard)
export class StylistsController {
  constructor(
    private readonly stylistsService: StylistsService,
    private readonly availabilityService: StylistAvailabilityService,
  ) {}

  @Get()
  @RequirePermission('stylists:read')
  async listStylists(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Query('bookableOnly') bookableOnly?: string,
  ): Promise<StylistListResponseDto[]> {
    if (bookableOnly === 'true') {
      return this.stylistsService.listBookableStylists(clinicId);
    }
    return this.stylistsService.listClinicStylists(clinicId);
  }

  @Get(':stylistId')
  @RequirePermission('stylists:read')
  async getStylist(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('stylistId', ParseUUIDPipe) stylistId: string,
  ): Promise<StylistListResponseDto> {
    return this.stylistsService.getStylistById(clinicId, stylistId);
  }

  @Put(':stylistId')
  @RequirePermission('stylists:update')
  async updateStylist(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('stylistId', ParseUUIDPipe) stylistId: string,
    @Body() dto: UpdateStylistDto,
  ): Promise<StylistListResponseDto> {
    return this.stylistsService.updateStylist(clinicId, stylistId, dto);
  }

  // ============= AVAILABILITY ENDPOINTS =============

  /**
   * Crear horario de trabajo para un estilista
   */
  @Post(':stylistId/availabilities')
  @RequirePermission('stylists:update')
  async createAvailability(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('stylistId', ParseUUIDPipe) stylistId: string,
    @Body() dto: CreateStylistAvailabilityDto,
  ): Promise<StylistAvailabilityResponseDto> {
    return this.stylistsService.createAvailability(clinicId, stylistId, dto);
  }

  /**
   * Listar horarios de un estilista
   */
  @Get(':stylistId/availabilities')
  @RequirePermission('stylists:read')
  async listAvailabilities(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('stylistId', ParseUUIDPipe) stylistId: string,
  ): Promise<StylistAvailabilityResponseDto[]> {
    return this.stylistsService.listAvailabilities(clinicId, stylistId);
  }

  /**
   * Actualizar horario
   */
  @Put(':stylistId/availabilities/:availabilityId')
  @RequirePermission('stylists:update')
  async updateAvailability(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('stylistId', ParseUUIDPipe) stylistId: string,
    @Param('availabilityId', ParseUUIDPipe) availabilityId: string,
    @Body() dto: UpdateStylistAvailabilityDto,
  ): Promise<StylistAvailabilityResponseDto> {
    return this.stylistsService.updateAvailability(
      clinicId,
      stylistId,
      availabilityId,
      dto,
    );
  }

  /**
   * Eliminar horario
   */
  @Delete(':stylistId/availabilities/:availabilityId')
  @RequirePermission('stylists:update')
  async deleteAvailability(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('stylistId', ParseUUIDPipe) stylistId: string,
    @Param('availabilityId', ParseUUIDPipe) availabilityId: string,
  ): Promise<void> {
    return this.stylistsService.deleteAvailability(clinicId, stylistId, availabilityId);
  }

  // ============= UNAVAILABLE PERIOD ENDPOINTS =============

  /**
   * Crear período de no disponibilidad
   */
  @Post(':stylistId/unavailable-periods')
  @RequirePermission('stylists:update')
  async createUnavailablePeriod(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('stylistId', ParseUUIDPipe) stylistId: string,
    @Body() dto: CreateStylistUnavailablePeriodDto,
  ): Promise<StylistUnavailablePeriodResponseDto> {
    return this.stylistsService.createUnavailablePeriod(clinicId, stylistId, dto);
  }

  /**
   * Listar períodos de no disponibilidad
   */
  @Get(':stylistId/unavailable-periods')
  @RequirePermission('stylists:read')
  async listUnavailablePeriods(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('stylistId', ParseUUIDPipe) stylistId: string,
  ): Promise<StylistUnavailablePeriodResponseDto[]> {
    return this.stylistsService.listUnavailablePeriods(clinicId, stylistId);
  }

  /**
   * Actualizar período de no disponibilidad
   */
  @Put(':stylistId/unavailable-periods/:periodId')
  @RequirePermission('stylists:update')
  async updateUnavailablePeriod(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('stylistId', ParseUUIDPipe) stylistId: string,
    @Param('periodId', ParseUUIDPipe) periodId: string,
    @Body() dto: UpdateStylistUnavailablePeriodDto,
  ): Promise<StylistUnavailablePeriodResponseDto> {
    return this.stylistsService.updateUnavailablePeriod(
      clinicId,
      stylistId,
      periodId,
      dto,
    );
  }

  /**
   * Eliminar período de no disponibilidad
   */
  @Delete(':stylistId/unavailable-periods/:periodId')
  @RequirePermission('stylists:update')
  async deleteUnavailablePeriod(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('stylistId', ParseUUIDPipe) stylistId: string,
    @Param('periodId', ParseUUIDPipe) periodId: string,
  ): Promise<void> {
    return this.stylistsService.deleteUnavailablePeriod(clinicId, stylistId, periodId);
  }

  // ============= CAPACITY ENDPOINTS =============

  /**
   * Crear capacidad específica para un día
   */
  @Post(':stylistId/capacities')
  @RequirePermission('stylists:update')
  async createCapacity(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('stylistId', ParseUUIDPipe) stylistId: string,
    @Body() dto: CreateStylistCapacityDto,
  ): Promise<StylistCapacityResponseDto> {
    return this.stylistsService.createCapacity(clinicId, stylistId, dto);
  }

  /**
   * Listar capacidades de un estilista
   */
  @Get(':stylistId/capacities')
  @RequirePermission('stylists:read')
  async listCapacities(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('stylistId', ParseUUIDPipe) stylistId: string,
  ): Promise<StylistCapacityResponseDto[]> {
    return this.stylistsService.listCapacities(clinicId, stylistId);
  }

  /**
   * Actualizar capacidad
   */
  @Put(':stylistId/capacities/:capacityId')
  @RequirePermission('stylists:update')
  async updateCapacity(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('stylistId', ParseUUIDPipe) stylistId: string,
    @Param('capacityId', ParseUUIDPipe) capacityId: string,
    @Body() dto: UpdateStylistCapacityDto,
  ): Promise<StylistCapacityResponseDto> {
    return this.stylistsService.updateCapacity(clinicId, stylistId, capacityId, dto);
  }

  /**
   * Eliminar capacidad
   */
  @Delete(':stylistId/capacities/:capacityId')
  @RequirePermission('stylists:update')
  async deleteCapacity(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('stylistId', ParseUUIDPipe) stylistId: string,
    @Param('capacityId', ParseUUIDPipe) capacityId: string,
  ): Promise<void> {
    return this.stylistsService.deleteCapacity(clinicId, stylistId, capacityId);
  }

  // ============= AVAILABILITY CHECK ENDPOINTS =============

  /**
   * Verificar si un estilista está disponible para un horario específico
   */
  @Post(':stylistId/check-availability')
  @RequirePermission('appointments:check_availability')
  async checkAvailability(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('stylistId', ParseUUIDPipe) stylistId: string,
    @Body() dto: CheckAvailabilityDto,
  ): Promise<AvailabilityCheckResponseDto> {
    const start = new Date(dto.appointment_start);
    const end = new Date(dto.appointment_end);
    return this.availabilityService.canStylistAttendAppointment(
      stylistId,
      start,
      end,
      dto.exclude_appointment_id,
      dto.appointment_type,
    );
  }

  /**
   * Obtener estilistas disponibles para un timeslot
   */
  @Post('check-availability-multi')
  @RequirePermission('appointments:check_availability')
  async getAvailableStylists(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Body() dto: GetAvailableStylitsDto,
  ): Promise<StylistAvailableSlotDto[]> {
    const start = new Date(dto.appointment_start);
    const end = new Date(dto.appointment_end);
    const slots = await this.availabilityService.getAvailableStylists(clinicId, start, end);
    return slots.map(slot => ({
      stylist_id: slot.stylistId,
      stylist_name: slot.stylistName,
      available: slot.available,
      conflicts: slot.conflicts,
    }));
  }

  /**
   * Obtener estilistas activos (no de vacaciones)
   */
  @Get('active-list/all')
  @RequirePermission('stylists:read')
  async getActiveStylists(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
  ): Promise<StylistListResponseDto[]> {
    const active = await this.availabilityService.getActiveStylists(clinicId);
    return active.map((stylist) => ({
      id: stylist.id,
      userId: stylist.userId,
      displayName: stylist.displayName,
      type: stylist.type,
      isBookable: stylist.isBookable,
      calendarColor: stylist.calendarColor,
      user: {
        id: stylist.user.id,
        name: stylist.user.name,
        email: stylist.user.email,
        status: stylist.user.status,
      },
      createdAt: stylist.createdAt,
      updatedAt: stylist.updatedAt,
    }));
  }
}
