import { Controller, Get, Put, Post, Patch, Delete, Body, Param, Query, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ClinicConfigurationsService } from './clinic-configurations.service';
import { UpdateClinicConfigurationDto } from './dtos/update-clinic-configuration.dto';
import { CreateClinicCalendarExceptionDto, UpdateClinicCalendarExceptionDto } from './dtos/clinic-calendar-exception.dto';
import { AuthGuard } from '@/common/guards/auth.guard';
import { TenantGuard } from '@/common/guards/tenant.guard';
import { PermissionGuard } from '@/modules/auth/guards/permission.guard';
import { RequirePermission } from '@/modules/auth/decorators/permission.decorator';
import { CurrentClinicId } from '@/common/decorators/current-clinic-id.decorator';

@UseGuards(AuthGuard, TenantGuard, PermissionGuard)
@UsePipes(new ValidationPipe({ 
  transform: true, 
  whitelist: true, 
  forbidNonWhitelisted: false,
  skipMissingProperties: false,
  errorHttpStatusCode: 400,
}))
@Controller('clinic')
export class ClinicConfigurationsController {
  constructor(private readonly service: ClinicConfigurationsService) {}

  /**
   * GET /clinic/configuration
   */
  @Get('configuration')
  @RequirePermission('clinic:settings')
  async getConfiguration(@CurrentClinicId() clinicId: string) {
    const config = await this.service.getConfiguration(clinicId);
    return { data: config };
  }

  /**
   * PUT /clinic/configuration
   */
  @Put('configuration')
  @RequirePermission('clinic:settings')
  async updateConfiguration(@CurrentClinicId() clinicId: string, @Body() dto: UpdateClinicConfigurationDto) {
    const config = await this.service.updateConfiguration(clinicId, dto);
    return { data: config };
  }

  /**
   * GET /clinic/calendar-exceptions
   */
  @Get('calendar-exceptions')
  @RequirePermission('clinic:settings')
  async getExceptions(
    @CurrentClinicId() clinicId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    const exceptions = await this.service.getExceptions(clinicId, from, to);
    return { data: exceptions };
  }

  /**
   * POST /clinic/calendar-exceptions
   */
  @Post('calendar-exceptions')
  @RequirePermission('clinic:settings')
  async createException(
    @CurrentClinicId() clinicId: string,
    @Body() dto: CreateClinicCalendarExceptionDto,
  ) {
    const exception = await this.service.createException(clinicId, dto);
    return { data: exception };
  }

  /**
   * PATCH /clinic/calendar-exceptions/:id
   */
  @Patch('calendar-exceptions/:id')
  @RequirePermission('clinic:settings')
  async updateException(
    @CurrentClinicId() clinicId: string,
    @Param('id') exceptionId: string,
    @Body() dto: UpdateClinicCalendarExceptionDto,
  ) {
    const exception = await this.service.updateException(clinicId, exceptionId, dto);
    return { data: exception };
  }

  /**
   * DELETE /clinic/calendar-exceptions/:id
   */
  @Delete('calendar-exceptions/:id')
  @RequirePermission('clinic:settings')
  async deleteException(
    @CurrentClinicId() clinicId: string,
    @Param('id') exceptionId: string,
  ) {
    await this.service.deleteException(clinicId, exceptionId);
    return { success: true };
  }
}
