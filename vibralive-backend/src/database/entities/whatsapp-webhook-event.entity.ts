import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum WebhookEventType {
  MESSAGE_CREATED = 'message',
  MESSAGE_STATUS_UPDATED = 'message_status',
  MESSAGE_TEMPLATE_FEEDBACK = 'message_template_feedback',
  PHONE_NUMBER_QUALITY = 'phone_number_quality',
}

export enum ProcessingStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  PROCESSED = 'processed',
  FAILED = 'failed',
}

@Entity('whatsapp_webhook_events')
@Index(['clinicId', 'eventType'])
@Index(['clinicId', 'processingStatus'])
@Index(['processedAt'])
@Index(['providerEventId'])
export class WhatsAppWebhookEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'clinic_id', type: 'uuid' })
  clinicId!: string;

  @Column({ type: 'varchar', length: 50, default: 'meta' })
  provider!: string;

  @Column({
    type: 'enum',
    enum: WebhookEventType,
  })
  eventType!: WebhookEventType;

  @Column({ name: 'provider_event_id', type: 'varchar', length: 255, nullable: true })
  providerEventId?: string;

  @Column({ name: 'payload_json', type: 'jsonb' })
  payloadJson!: Record<string, any>;

  @Column({ name: 'received_at', type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  receivedAt!: Date;

  @Column({ name: 'processed_at', type: 'timestamp with time zone', nullable: true })
  processedAt?: Date;

  @Column({
    name: 'processing_status',
    type: 'enum',
    enum: ProcessingStatus,
    default: ProcessingStatus.PENDING,
  })
  processingStatus!: ProcessingStatus;

  @Column({ name: 'retry_count', type: 'integer', default: 0 })
  retryCount!: number;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
