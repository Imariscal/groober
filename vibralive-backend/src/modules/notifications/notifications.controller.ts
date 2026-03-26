import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificationService } from './services/notification.service';
import { NotificationListFilterDto } from './dtos/notification.dto';
import { TenantGuard } from '@/common/guards/tenant.guard';
import { PermissionGuard } from '@/modules/auth/guards/permission.guard';
import { RequirePermission } from '@/modules/auth/decorators/permission.decorator';
import { CurrentUser, CurrentClinic } from '@/common/decorators';

@Controller('notifications')
@UseGuards(AuthGuard('jwt'), TenantGuard, PermissionGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  /**
   * GET /notifications
   * 
   * Get notification history with optional filters
   * 
   * Query parameters:
   * - dateFrom: ISO date string
   * - dateTo: ISO date string
   * - clientId: UUID
   * - phoneNumber: String
   * - status: delivered | read | failed | queued
   * - direction: inbound | outbound
   * - messageType: text | image | template | etc.
   * - errorsOnly: boolean (return only failed messages)
   * - page: number (default 1)
   * - limit: number (default 20, max 100)
   */
  @Get()
  @RequirePermission('notifications:read')
  async getNotifications(
    @CurrentClinic() clinicId: string,
    @Query() query: any,
  ) {
    const filters: NotificationListFilterDto = {
      dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
      dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
      clientId: query.clientId,
      phoneNumber: query.phoneNumber,
      status: query.status,
      direction: query.direction,
      messageType: query.messageType,
      errorsOnly: query.errorsOnly === 'true',
      page: parseInt(query.page || '1'),
      limit: Math.min(parseInt(query.limit || '20'), 100),
    };

    return this.notificationService.getNotifications(clinicId, filters);
  }

  /**
   * GET /notifications/:id
   * 
   * Get full notification details by ID
   */
  @Get(':id')
  @RequirePermission('notifications:read')
  async getNotificationDetail(
    @CurrentClinic() clinicId: string,
    @Param('id') notificationId: string,
  ) {
    return this.notificationService.getNotificationDetail(clinicId, notificationId);
  }

  /**
   * GET /notifications/queue
   * 
   * Get current message queue (pending/retrying messages)
   */
  @Get('tabs/queue')
  @RequirePermission('notifications:read')
  async getQueue(@CurrentClinic() clinicId: string) {
    return this.notificationService.getQueue(clinicId);
  }

  /**
   * GET /notifications/errors
   * 
   * Get failed messages
   */
  @Get('tabs/errors')
  @RequirePermission('notifications:read')
  async getErrors(@CurrentClinic() clinicId: string) {
    return this.notificationService.getErrors(clinicId);
  }
}
