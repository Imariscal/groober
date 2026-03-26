import { Injectable } from '@nestjs/common';
import { NotificationRepository } from '../repositories/notification.repository';
import {
  NotificationListFilterDto,
  NotificationDetailDto,
  NotificationListResponseDto,
  NotificationQueueResponseDto,
  NotificationErrorsResponseDto,
} from '../dtos/notification.dto';

/**
 * Notifications Service
 * 
 * Provides monitoring and observability for WhatsApp messaging.
 * Aggregates data from message_logs and whatsapp_outbox for:
 * - Message history
 * - Current queue status
 * - Error tracking
 * - Performance metrics
 */
@Injectable()
export class NotificationService {
  constructor(private readonly notificationRepository: NotificationRepository) {}

  /**
   * Get notification history with filters
   */
  async getNotifications(
    clinicId: string,
    filters: NotificationListFilterDto,
  ): Promise<NotificationListResponseDto> {
    return this.notificationRepository.getNotificationHistory(clinicId, filters);
  }

  /**
   * Get single notification detail
   */
  async getNotificationDetail(clinicId: string, notificationId: string): Promise<NotificationDetailDto> {
    return this.notificationRepository.getNotificationDetail(clinicId, notificationId);
  }

  /**
   * Get current message queue
   */
  async getQueue(clinicId: string): Promise<NotificationQueueResponseDto> {
    return this.notificationRepository.getNotificationQueue(clinicId);
  }

  /**
   * Get failed/errored messages
   */
  async getErrors(clinicId: string): Promise<NotificationErrorsResponseDto> {
    return this.notificationRepository.getNotificationErrors(clinicId);
  }
}
