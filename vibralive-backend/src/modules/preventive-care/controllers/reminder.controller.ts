import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ReminderService } from '../services/reminder.service';
import { UpdateReminderQueueStatusDto } from '../dtos/reminder-queue.dto';
import { AuthGuard } from '@/common/guards/auth.guard';
import { TenantGuard } from '@/common/guards/tenant.guard';
import { PermissionGuard } from '@/common/guards/permission.guard';
import { RequirePermission } from '@/common/decorators/require-permission.decorator';
import { CurrentClinicId } from '@/common/decorators/current-clinic-id.decorator';

@Controller('reminders')
@UseGuards(AuthGuard, TenantGuard, PermissionGuard)
export class ReminderController {
  constructor(private readonly reminderService: ReminderService) {}

  /**
   * Get pending reminders for clinic
   */
  @Get('pending')
  @RequirePermission('reminder:read')
  async getPending(
    @CurrentClinicId() clinicId: string,
    @Query('limit') limit?: string,
  ) {
    return this.reminderService.getPendingReminders(
      clinicId,
      limit ? parseInt(limit) : undefined,
    );
  }

  /**
   * Get reminder history for an event
   */
  @Get('history/:eventId')
  @RequirePermission('reminder:read')
  async getHistory(@Param('eventId') eventId: string) {
    return this.reminderService.getReminderHistory(eventId);
  }

  /**
   * Update reminder status (mark sent, failed, etc.)
   */
  @Patch(':id/status')
  @RequirePermission('reminder:update')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateReminderQueueStatusDto,
  ) {
    return this.reminderService.updateReminderStatus(id, dto);
  }

  /**
   * Retry failed reminders
   */
  @Patch('retry')
  @RequirePermission('reminder:update')
  async retryFailed(
    @CurrentClinicId() clinicId: string,
    @Query('hoursBack') hoursBack?: string,
  ) {
    return this.reminderService.retryFailedReminders(
      clinicId,
      hoursBack ? parseInt(hoursBack) : undefined,
    );
  }

  /**
   * Cancel all reminders for an event
   */
  @Delete('event/:eventId')
  @RequirePermission('reminder:delete')
  async cancelForEvent(@Param('eventId') eventId: string) {
    return this.reminderService.cancelRemindersForEvent(eventId);
  }
}
