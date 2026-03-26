import {
  Controller,
  Post,
  Get,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PreventiveCareService } from '../services/preventive-care.service';
import {
  CreatePetPreventiveCareEventDto,
  UpdatePetPreventiveCareEventDto,
} from '../dtos/preventive-care.dto';
import { AuthGuard } from '@/common/guards/auth.guard';
import { TenantGuard } from '@/common/guards/tenant.guard';
import { PermissionGuard } from '@/common/guards/permission.guard';
import { RequirePermission } from '@/common/decorators/require-permission.decorator';
import { CurrentClinicId } from '@/common/decorators/current-clinic-id.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@Controller('preventive-visits')
@UseGuards(AuthGuard, TenantGuard, PermissionGuard)
export class PreventiveVisitsController {
  constructor(private readonly preventiveCareService: PreventiveCareService) {}

  /**
   * Create a preventive care event (requires clinicId in DTO)
   */
  @Post()
  @RequirePermission('visits:create')
  async create(@Body() dto: CreatePetPreventiveCareEventDto) {
    return this.preventiveCareService.createPreventiveEvent(dto);
  }

  /**
   * Get active preventive events for a pet
   */
  @Get('pet/:petId/active')
  @RequirePermission('visits:read')
  async getActiveForPet(
    @CurrentClinicId() clinicId: string,
    @Param('petId') petId: string,
  ) {
    return this.preventiveCareService.getActiveEventsForPet(clinicId, petId);
  }

  /**
   * Get upcoming reminders (within X days)
   */
  @Get('upcoming')
  @RequirePermission('visits:read')
  async getUpcoming(
    @CurrentClinicId() clinicId: string,
    @Query('daysAhead') daysAhead?: string,
  ) {
    return this.preventiveCareService.getUpcomingReminders(
      clinicId,
      daysAhead ? parseInt(daysAhead) : undefined,
    );
  }

  /**
   * Get overdue reminders
   */
  @Get('overdue')
  @RequirePermission('visits:read')
  async getOverdue(@CurrentClinicId() clinicId: string) {
    return this.preventiveCareService.getOverdueReminders(clinicId);
  }

  /**
   * Get a specific event by ID
   */
  @Get(':id')
  @RequirePermission('visits:read')
  async getById(@Param('id') id: string) {
    return this.preventiveCareService.getUpcomingReminders('', 0); // TODO: Need getById method in service
  }

  /**
   * Update a preventive event
   */
  @Put(':id')
  @RequirePermission('visits:update')
  async update(@Param('id') id: string, @Body() dto: UpdatePetPreventiveCareEventDto) {
    return this.preventiveCareService.updateEvent(id, dto);
  }

  /**
   * Complete event and schedule next
   */
  @Patch(':id/complete')
  @RequirePermission('visits:complete')
  async complete(@Param('id') id: string) {
    return this.preventiveCareService.completeAndScheduleNext(id);
  }

  /**
   * Cancel a preventive event
   */
  @Delete(':id')
  @RequirePermission('visits:delete')
  async cancel(@Param('id') id: string) {
    // TODO: Implement cancel logic, likely delete or mark as CANCELLED
    throw new Error('Not implemented');
  }
}
