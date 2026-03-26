import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessageLog, WhatsAppOutbox } from '@/database/entities';
import {
  NotificationListFilterDto,
  NotificationItemDto,
  NotificationDetailDto,
  NotificationListResponseDto,
  NotificationQueueItemDto,
  NotificationQueueResponseDto,
  NotificationErrorDto,
  NotificationErrorsResponseDto,
} from '../dtos/notification.dto';

@Injectable()
export class NotificationRepository {
  constructor(
    @InjectRepository(MessageLog)
    private readonly messageLogRepository: Repository<MessageLog>,
    @InjectRepository(WhatsAppOutbox)
    private readonly outboxRepository: Repository<WhatsAppOutbox>,
  ) {}

  /**
   * Get paginated notification history combining message_logs and whatsapp_outbox
   */
  async getNotificationHistory(
    clinicId: string,
    filters: NotificationListFilterDto,
  ): Promise<NotificationListResponseDto> {
    const { dateFrom, dateTo, clientId, phoneNumber, status, direction, messageType, errorsOnly, page, limit } =
      filters;

    const skip = (page - 1) * limit;

    let query = this.messageLogRepository
      .createQueryBuilder('msg')
      .leftJoinAndSelect('msg.client', 'client')
      .where('msg.clinicId = :clinicId', { clinicId });

    if (dateFrom) {
      query = query.andWhere('msg.createdAt >= :dateFrom', { dateFrom });
    }

    if (dateTo) {
      query = query.andWhere('msg.createdAt <= :dateTo', { dateTo });
    }

    if (clientId) {
      query = query.andWhere('msg.clientId = :clientId', { clientId });
    }

    if (phoneNumber) {
      query = query.andWhere('msg.phoneNumber = :phoneNumber', { phoneNumber });
    }

    if (status) {
      query = query.andWhere('msg.status = :status', { status });
    }

    if (direction) {
      query = query.andWhere('msg.direction = :direction', { direction });
    }

    if (messageType) {
      query = query.andWhere('msg.messageType = :messageType', { messageType });
    }

    if (errorsOnly) {
      query = query.andWhere('msg.status = :failedStatus', { failedStatus: 'failed' });
    }

    const [items, total] = await query.orderBy('msg.createdAt', 'DESC').skip(skip).take(limit).getManyAndCount();

    const data: NotificationItemDto[] = items.map((msg) => ({
      id: msg.id,
      dateTime: msg.createdAt,
      channel: 'WhatsApp',
      direction: msg.direction as any,
      clientName: msg.client?.name || 'Unknown',
      phoneNumber: msg.phoneNumber,
      messageType: msg.messageType,
      messagePreview: msg.messageBody.substring(0, 100),
      status: msg.status,
      origin: msg.reminderId ? 'Reminder' : 'Manual/API',
      retryCount: 0,
      hasError: msg.status === 'failed',
      conversationId: (msg as any).conversationId,
    }));

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Get notification detail by ID
   */
  async getNotificationDetail(clinicId: string, notificationId: string): Promise<NotificationDetailDto> {
    const msg = await this.messageLogRepository
      .createQueryBuilder('msg')
      .leftJoinAndSelect('msg.client', 'client')
      .leftJoinAndSelect('msg.reminder', 'reminder')
      .where('msg.id = :id', { id: notificationId })
      .andWhere('msg.clinicId = :clinicId', { clinicId })
      .getOne();

    if (!msg) {
      throw new Error('Notification not found');
    }

    return {
      id: msg.id,
      conversationId: (msg as any).conversationId,
      clientId: msg.clientId,
      clientName: msg.client?.name || 'Unknown',
      phoneNumber: msg.phoneNumber,
      fullMessageBody: msg.messageBody,
      messageType: msg.messageType,
      direction: msg.direction as any,
      payloadJson: (msg as any).payloadJson,
      whatsappMessageId: msg.whatsappMessageId,
      retryCount: 0,
      errorCode: msg.errorCode,
      errorMessage: msg.errorMessage,
      sentAt: msg.sentAt,
      deliveredAt: msg.readAt,
      readAt: msg.readAt,
      failedAt: undefined,
      createdAt: msg.createdAt,
      relatedReminderId: msg.reminderId,
    };
  }

  /**
   * Get pending queue items from whatsapp_outbox
   */
  async getNotificationQueue(clinicId: string): Promise<NotificationQueueResponseDto> {
    const items = await this.outboxRepository
      .createQueryBuilder('outbox')
      .leftJoinAndSelect('outbox.client', 'client')
      .where('outbox.clinicId = :clinicId', { clinicId })
      .andWhere('outbox.status IN (:...statuses)', { statuses: ['queued', 'retrying'] })
      .orderBy('outbox.createdAt', 'DESC')
      .getMany();

    const data: NotificationQueueItemDto[] = items.map((item) => ({
      id: item.id,
      dateTime: item.createdAt,
      clientName: item.client?.name || 'Unknown',
      phoneNumber: item.phoneNumber,
      messagePreview: item.messageBody.substring(0, 100),
      status: item.status,
      retryCount: item.retryCount,
      maxRetries: item.maxRetries,
      lastRetryAt: item.lastRetryAt,
      scheduledAt: (item as any).scheduledAt,
    }));

    return {
      data,
      total: items.length,
    };
  }

  /**
   * Get failed/errored items
   */
  async getNotificationErrors(clinicId: string): Promise<NotificationErrorsResponseDto> {
    const items = await this.messageLogRepository
      .createQueryBuilder('msg')
      .leftJoinAndSelect('msg.client', 'client')
      .where('msg.clinicId = :clinicId', { clinicId })
      .andWhere('msg.status = :failed', { failed: 'failed' })
      .orderBy('msg.createdAt', 'DESC')
      .limit(100)
      .getMany();

    const data: NotificationErrorDto[] = items.map((msg) => ({
      id: msg.id,
      dateTime: msg.createdAt,
      clientName: msg.client?.name || 'Unknown',
      phoneNumber: msg.phoneNumber,
      messagePreview: msg.messageBody.substring(0, 100),
      errorCode: msg.errorCode,
      errorMessage: msg.errorMessage,
      status: msg.status,
      retryCount: 0,
    }));

    return {
      data,
      total: items.length,
    };
  }
}
