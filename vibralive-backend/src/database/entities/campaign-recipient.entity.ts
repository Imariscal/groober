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
import { Pet } from './pet.entity';
import { Campaign } from './campaign.entity';
import { MessageLog } from './message-log.entity';

export enum CampaignChannel {
  WHATSAPP = 'WHATSAPP',
  EMAIL = 'EMAIL',
}

export enum RecipientStatus {
  PENDING = 'PENDING',
  QUEUED = 'QUEUED',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  OPENED = 'OPENED',
  FAILED = 'FAILED',
  SKIPPED = 'SKIPPED',
}

/**
 * Campaign Recipients - Individual message sends within a campaign
 * 
 * Tracks each recipient's delivery status, contact info (captured at send time),
 * and links to message_logs for audit trail.
 */
@Entity('campaign_recipients')
@Index(['campaignId'])
@Index(['clinicId'])
@Index(['status'])
@Index(['campaignId', 'status'])
@Index(['recipientEmail'])
@Index(['recipientPhone'])
@Index(['clinicId', 'status'])
export class CampaignRecipient {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'campaign_id', type: 'uuid' })
  campaignId!: string;

  @Column({ name: 'clinic_id', type: 'uuid' })
  clinicId!: string;

  @Column({ name: 'client_id', type: 'uuid', nullable: true })
  clientId?: string;

  @Column({ name: 'pet_id', type: 'uuid', nullable: true })
  petId?: string;

  @Column({
    type: 'varchar',
    length: 50,
    enum: CampaignChannel,
  })
  channel!: CampaignChannel;

  // Contact info captured at send time for audit trail
  @Column({ type: 'varchar', length: 255, nullable: true, name: 'recipient_name' })
  recipientName?: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'recipient_email' })
  recipientEmail?: string;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'recipient_phone' })
  recipientPhone?: string;

  @Column({
    type: 'varchar',
    length: 50,
    enum: RecipientStatus,
    default: RecipientStatus.PENDING,
  })
  status!: RecipientStatus;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'skip_reason' })
  skipReason?: string;

  // Link to delivery tracking
  @Column({
    type: 'uuid',
    nullable: true,
    name: 'message_log_id',
  })
  messageLogId?: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'provider_message_id',
  })
  providerMessageId?: string; // wamid from Meta or email provider ID

  // Delivery timestamps
  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    name: 'sent_at',
  })
  sentAt?: Date;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    name: 'delivered_at',
  })
  deliveredAt?: Date;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    name: 'read_at',
  })
  readAt?: Date;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    name: 'opened_at',
  })
  openedAt?: Date;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    name: 'failed_at',
  })
  failedAt?: Date;

  // Error tracking
  @Column({ type: 'varchar', length: 100, nullable: true, name: 'error_code' })
  errorCode?: string;

  @Column({ type: 'text', nullable: true, name: 'error_message' })
  errorMessage?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Campaign, (campaign) => campaign.recipients, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'campaign_id' })
  campaign!: Campaign;

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

  @ManyToOne(() => Pet, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'pet_id' })
  pet?: Pet;

  @ManyToOne(() => MessageLog, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'message_log_id' })
  messageLog?: MessageLog;
}
