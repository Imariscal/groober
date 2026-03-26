/**
 * DTOs for Notifications API
 */

export class NotificationListFilterDto {
  dateFrom?: Date;
  dateTo?: Date;
  clientId?: string;
  phoneNumber?: string;
  status?: string;
  direction?: 'inbound' | 'outbound';
  messageType?: string;
  errorsOnly?: boolean;
  page: number = 1;
  limit: number = 20;
}

export class NotificationItemDto {
  id!: string;
  dateTime!: Date;
  channel!: string;
  direction!: 'inbound' | 'outbound';
  clientName!: string;
  phoneNumber!: string;
  messageType!: string;
  messagePreview!: string;
  status!: string;
  origin!: string;
  retryCount!: number;
  hasError!: boolean;
  conversationId?: string;
}

export class NotificationDetailDto {
  id!: string;
  conversationId?: string;
  clientId!: string;
  clientName!: string;
  phoneNumber!: string;
  fullMessageBody!: string;
  messageType!: string;
  direction!: 'inbound' | 'outbound';
  payloadJson?: Record<string, any>;
  whatsappMessageId?: string;
  providerResponse?: Record<string, any>;
  retryCount!: number;
  errorCode?: string;
  errorMessage?: string;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  failedAt?: Date;
  createdAt!: Date;
  relatedReminderId?: string;
  relatedAppointmentId?: string;
}

export class NotificationListResponseDto {
  data!: NotificationItemDto[];
  total!: number;
  page!: number;
  limit!: number;
  totalPages!: number;
}

export class NotificationQueueItemDto {
  id!: string;
  dateTime!: Date;
  clientName!: string;
  phoneNumber!: string;
  messagePreview!: string;
  status!: string;
  retryCount!: number;
  maxRetries!: number;
  lastRetryAt?: Date | null;
  scheduledAt?: Date;
}

export class NotificationQueueResponseDto {
  data!: NotificationQueueItemDto[];
  total!: number;
}

export class NotificationErrorDto {
  id!: string;
  dateTime!: Date;
  clientName!: string;
  phoneNumber!: string;
  messagePreview!: string;
  errorCode?: string;
  errorMessage?: string;
  status!: string;
  retryCount!: number;
}

export class NotificationErrorsResponseDto {
  data!: NotificationErrorDto[];
  total!: number;
}
