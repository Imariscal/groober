import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Clinic } from './clinic.entity';
import { Client } from './client.entity';
import { CampaignRecipient } from './campaign-recipient.entity';

export enum EmailStatus {
  PENDING = 'PENDING',
  QUEUED = 'QUEUED',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  BOUNCED = 'BOUNCED',
}

/**
 * Email Outbox - Tracks outbound emails
 * 
 * Similar structure to whatsapp_outbox for consistency.
 * Processes emails in background worker/cron job.
 */
@Entity('email_outbox')
@Index(['clinicId', 'status'])
@Index(['toEmail'])
@Index(['campaignRecipientId'])
@Index(['createdAt'])
@Index(['clinicId', 'createdAt'])
export class EmailOutbox {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'clinic_id', type: 'uuid' })
  clinicId!: string;

  @Column({ name: 'client_id', type: 'uuid', nullable: true })
  clientId?: string;

  @Column({
    type: 'uuid',
    nullable: true,
    name: 'campaign_recipient_id',
  })
  campaignRecipientId?: string;

  @Column({ type: 'varchar', length: 255, name: 'to_email' })
  toEmail!: string;

  @Column({ type: 'varchar', length: 255 })
  subject!: string;

  @Column({ type: 'text' })
  body!: string;

  @Column({ type: 'text', nullable: true, name: 'body_html' })
  bodyHtml?: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: EmailStatus.PENDING,
    enum: EmailStatus,
  })
  status!: EmailStatus;

  @Column({ type: 'integer', default: 0, name: 'retry_count' })
  retryCount!: number;

  @Column({ type: 'integer', default: 3, name: 'max_retries' })
  maxRetries!: number;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    name: 'last_retry_at',
  })
  lastRetryAt?: Date;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'provider_message_id',
  })
  providerMessageId?: string;

  @Column({
    type: 'jsonb',
    nullable: true,
    name: 'provider_response',
  })
  providerResponse?: Record<string, any>;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    name: 'scheduled_at',
  })
  scheduledAt?: Date;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    name: 'sent_at',
  })
  sentAt?: Date;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'error_code' })
  errorCode?: string;

  @Column({ type: 'text', nullable: true, name: 'error_message' })
  errorMessage?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Clinic, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'clinic_id' })
  clinic!: Clinic;

  @ManyToOne(() => Client, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'client_id' })
  client?: Client;

  @ManyToOne(() => CampaignRecipient, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'campaign_recipient_id' })
  campaignRecipient?: CampaignRecipient;
}
