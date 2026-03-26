import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { AuthGuard } from '@/common/guards';
import { TenantGuard } from '@/common/guards/tenant.guard';
import { PermissionGuard } from '@/modules/auth/guards/permission.guard';
import { CurrentClinicId } from '@/common/decorators/current-clinic-id.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { RequirePermission } from '@/modules/auth/decorators/permission.decorator';
import { AppointmentsService } from './appointments.service';
import { AppointmentCleanupService } from './services/appointment-cleanup.service';
import { GroomingService } from './services/grooming.service';
import {
  CreateAppointmentDto,
  UpdateStatusDto,
  UpdateAppointmentDto,
  UpdateAppointmentServicesDto,
  CompleteAppointmentDto,
  CalculateGroomingDurationDto,
} from './dtos';

@Controller('appointments')
@UseGuards(AuthGuard, TenantGuard, PermissionGuard)
export class AppointmentsController {
  constructor(
    private readonly appointmentsService: AppointmentsService,
    private readonly cleanupService: AppointmentCleanupService,
    private readonly groomingService: GroomingService,
  ) {}

  @Post()
  @HttpCode(201)
  @RequirePermission('appointments:create')
  async create(
    @CurrentClinicId() clinicId: string,
    @Body() dto: CreateAppointmentDto,
  ) {
    return this.appointmentsService.create(clinicId, dto);
  }

  @Get()
  @RequirePermission('appointments:read')
  async findAll(
    @CurrentClinicId() clinicId: string,
    @Query() filters: any,
  ) {
    return this.appointmentsService.findByClinic(clinicId, filters);
  }

  @Get(':id')
  @RequirePermission('appointments:read')
  async findOne(
    @CurrentClinicId() clinicId: string,
    @Param('id') appointmentId: string,
  ) {
    return this.appointmentsService.findOne(clinicId, appointmentId);
  }

  @Get('check-stylist-availability/slots')
  @RequirePermission('appointments:check_availability')
  async getAvailableStylistsForTimeslot(
    @CurrentClinicId() clinicId: string,
    @Query('start') appointmentStart: string,
    @Query('end') appointmentEnd: string,
  ) {
    if (!appointmentStart || !appointmentEnd) {
      throw new Error('start and end query parameters are required');
    }
    return this.appointmentsService.getAvailableStylistsForAppointment(
      clinicId,
      appointmentStart,
      appointmentEnd,
    );
  }

  @Put(':id')
  @RequirePermission('appointments:update')
  async update(
    @CurrentClinicId() clinicId: string,
    @Param('id') appointmentId: string,
    @Body() dto: UpdateAppointmentDto,
  ) {
    return this.appointmentsService.update(clinicId, appointmentId, dto);
  }

  @Patch(':id/status')
  @RequirePermission('appointments:update_status')
  async updateStatus(
    @CurrentClinicId() clinicId: string,
    @Param('id') appointmentId: string,
    @Body() dto: UpdateStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.appointmentsService.updateStatus(
      clinicId,
      appointmentId,
      dto,
      user.id,
    );
  }

  @Post('grooming/home/plan-routes')
  @HttpCode(200)
  @RequirePermission('appointments:create')
  async planHomeGroomingRoutes(
    @CurrentClinicId() clinicId: string,
    @Body() body: { date?: string },
  ) {
    return this.appointmentsService.planHomeGroomingRoutes(clinicId, body.date);
  }

  @Put(':id/services')
  @HttpCode(200)
  @RequirePermission('appointments:update_services')
  async updateServices(
    @CurrentClinicId() clinicId: string,
    @Param('id') appointmentId: string,
    @Body() dto: UpdateAppointmentServicesDto,
  ) {
    return this.appointmentsService.updateServices(clinicId, appointmentId, dto);
  }

  @Put(':id/complete')
  @RequirePermission('appointments:complete')
  async complete(
    @CurrentClinicId() clinicId: string,
    @Param('id') appointmentId: string,
    @Body() dto: CompleteAppointmentDto,
  ) {
    return this.appointmentsService.complete(clinicId, appointmentId, dto);
  }

  /**
   * Calcula duración automática para cita grooming
   * POST /appointments/grooming/calculate-duration
   */
  @Post('grooming/calculate-duration')
  @HttpCode(200)
  @RequirePermission('appointments:create')
  async calculateGroomingDuration(
    @Body() dto: CalculateGroomingDurationDto,
  ) {
    return this.groomingService.getGroomingDurationInfo(
      dto.petId,
      dto.serviceIds,
    );
  }

  /**
   * Admin endpoint para ejecutar manualmente el job de limpieza
   * Útil para testing y ejecución manual
   * POST /appointments/admin/run-cleanup
   */
  @Post('admin/run-cleanup')
  @HttpCode(200)
  async runCleanup() {
    const result = await this.cleanupService.markUnattendedAppointments();
    return {
      success: true,
      message: `Marked ${result.markedCount} appointments as UNATTENDED`,
      ...result,
    };
  }

  /**
   * Admin endpoint para obtener estadísticas de citas no atendidas
   * GET /appointments/admin/unattended-stats
   */
  @Get('admin/unattended-stats')
  async getUnattendedStats() {
    return this.cleanupService.getUnattendedStats();
  }
}
