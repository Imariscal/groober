import { Controller, Post, Get, Body, Param, BadRequestException, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@/common/guards';
import { PermissionGuard } from '@/modules/auth/guards/permission.guard';
import { CurrentClinicId } from '@/common/decorators/current-clinic-id.decorator';
import { RequirePermission } from '@/modules/auth/decorators/permission.decorator';
import { PricingService } from './pricing.service';
import { GroomingBatchService } from './services/grooming-batch.service';
import {
  CalculateAppointmentPricingDto,
  CreateAppointmentWithPricingDto,
  GetAppointmentPricingDto,
  ValidatePricingDto,
} from './dtos/pricing.dto';
import { CreateBatchAppointmentWithPricingDto } from './dtos/batch-appointment.dto';

@Controller('pricing')
export class PricingController {
  constructor(
    private pricingService: PricingService,
    private groomingBatchService: GroomingBatchService,
  ) {}

  /**
   * Calcula precios para una cita sin crear la cita aún
   * Usado para preview de precios en la UI
   */
  @UseGuards(AuthGuard, PermissionGuard)
  @Post('calculate')
  @RequirePermission('appointments:create')
  async calculateAppointmentPricing(
    @CurrentClinicId() clinicId: string,
    @Body() dto: CalculateAppointmentPricingDto
  ) {
    try {
      const result = await this.pricingService.calculateAppointmentPricing({
        ...dto,
        clinicId: dto.clinicId || clinicId,
      });
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(message);
    }
  }

  /**
   * Crea una cita con precios congelados
   * Esta es la operación principal: crea cita + registra precios atómicamente
   */
  @UseGuards(AuthGuard, PermissionGuard)
  @Post('appointments/create-with-pricing')
  @RequirePermission('appointments:create')
  async createAppointmentWithPricing(
    @CurrentClinicId() clinicId: string,
    @Body() dto: CreateAppointmentWithPricingDto
  ) {
    try {
      const result = await this.pricingService.createAppointmentWithFrozenPrices({
        clinicId: dto.clinicId || clinicId,
        clientId: dto.clientId,
        petId: dto.petId,
        scheduledAt: new Date(dto.scheduledAt),
        durationMinutes: dto.durationMinutes,
        reason: dto.reason,
        notes: dto.notes,
        locationType: dto.locationType || 'CLINIC',
        serviceType: dto.serviceType,
        addressId: dto.addressId,
        assignedStaffUserId: dto.assignedStaffUserId,
        serviceIds: dto.serviceIds,
        quantities: dto.quantities,
        packageIds: dto.packageIds,
        packageQuantities: dto.packageQuantities,
        customPriceListId: dto.customPriceListId,
      });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(message);
    }
  }

  /**
   * Crea múltiples citas de grooming para múltiples mascotas en una sola transacción
   * Valida todas las mascotas usando GroomingValidationService
   * Retorna un grupo de citas con precio total combinado
   */
  @UseGuards(AuthGuard, PermissionGuard)
  @Post('appointments/create-batch-with-pricing')
  @RequirePermission('appointments:create')
  async createBatchAppointmentWithPricing(
    @CurrentClinicId() clinicId: string,
    @Body() dto: CreateBatchAppointmentWithPricingDto,
  ) {
    try {
      const result = await this.groomingBatchService.createBatchAppointmentWithPricing(
        clinicId,
        dto,
      );

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(message);
    }
  }

  /**
   * Obtiene el pricing de una cita existente
   */
  @UseGuards(AuthGuard, PermissionGuard)
  @Get('appointments/:appointmentId')
  @RequirePermission('appointments:read')
  async getAppointmentPricing(
    @Param('appointmentId') appointmentId: string
  ) {
    try {
      const result = await this.pricingService.getAppointmentPricing(appointmentId);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(message);
    }
  }

  /**
   * Valida que los precios de una cita sigan siendo correctos
   * Detecta cambios de precio desde que la cita foi creada
   */
  @UseGuards(AuthGuard, PermissionGuard)
  @Post('appointments/:appointmentId/validate')
  @RequirePermission('appointments:read')
  async validateAppointmentPricing(
    @Param('appointmentId') appointmentId: string
  ) {
    try {
      const result = await this.pricingService.validateAppointmentPricing(appointmentId);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(message);
    }
  }
}
