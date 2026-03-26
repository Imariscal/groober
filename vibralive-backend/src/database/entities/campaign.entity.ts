import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Clinic } from './clinic.entity';
import { User } from './user.entity';
import { CampaignTemplate } from './campaign-template.entity';
import { CampaignRecipient } from './campaign-recipient.entity';

export enum CampaignChannel {
  WHATSAPP = 'WHATSAPP',
  EMAIL = 'EMAIL',
}

export enum CampaignStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  PAUSED = 'PAUSED',
  CANCELLED = 'CANCELLED',
}

export enum RecurrenceType {
  ONCE = 'ONCE',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}

/**
 * Campaigns - Individual campaign execution records
 * 
 * Stores campaign configuration, filters, scheduling, and metrics.
 * Recipients are generated separately into campaign_recipients table.
 */
@Entity('campaigns')
@Index(['clinicId'])
@Index(['status'])
@Index(['scheduledAt'])
@Index(['clinicId', 'createdAt'])
@Index(['clinicId', 'status'])
export class Campaign {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'clinic_id', type: 'uuid' })
  clinicId!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'varchar',
    length: 50,
    enum: CampaignChannel,
  })
  channel!: CampaignChannel;

  @Column({ name: 'campaign_template_id', type: 'uuid' })
  campaignTemplateId!: string;

  @Column({
    type: 'varchar',
    length: 50,
    enum: CampaignStatus,
    default: CampaignStatus.DRAFT,
  })
  status!: CampaignStatus;

  // Audience filters: JSON with species, breed, sex, size, date ranges, etc.
  // E.g., {"species": ["DOG"], "sex": ["FEMALE"], "last_visit_before": "2025-01-01"}
  @Column({ type: 'jsonb', name: 'filters_json' })
  filtersJson!: Record<string, any>;

  // Scheduling
  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    name: 'scheduled_at',
  })
  scheduledAt?: Date;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    name: 'started_at',
  })
  startedAt?: Date;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    name: 'completed_at',
  })
  completedAt?: Date;

  // Recipient counts
  @Column({ type: 'integer', default: 0, name: 'estimated_recipients' })
  estimatedRecipients!: number;

  @Column({ type: 'integer', default: 0, name: 'actual_recipients' })
  actualRecipients!: number;

  // Delivery metrics
  @Column({ type: 'integer', default: 0, name: 'successful_count' })
  successfulCount!: number;

  @Column({ type: 'integer', default: 0, name: 'failed_count' })
  failedCount!: number;

  @Column({ type: 'integer', default: 0, name: 'skipped_count' })
  skippedCount!: number;

  @Column({ type: 'integer', default: 0, name: 'opened_count' })
  openedCount!: number;

  @Column({ type: 'integer', default: 0, name: 'read_count' })
  readCount!: number;

  // Audit
  @Column({ name: 'created_by_user_id', type: 'uuid' })
  createdByUserId!: string;

  @Column({
    type: 'uuid',
    nullable: true,
    name: 'paused_by_user_id',
  })
  pausedByUserId?: string;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    name: 'paused_at',
  })
  pausedAt?: Date;

  // Recurrence
  @Column({ type: 'boolean', default: false, name: 'is_recurring' })
  isRecurring!: boolean;

  @Column({
    type: 'varchar',
    length: 50,
    enum: RecurrenceType,
    default: RecurrenceType.ONCE,
    name: 'recurrence_type',
  })
  recurrenceType!: RecurrenceType;

  @Column({
    type: 'integer',
    default: 1,
    name: 'recurrence_interval',
  })
  recurrenceInterval!: number;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    name: 'recurrence_end_date',
  })
  recurrenceEndDate?: Date;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    name: 'last_sent_at',
  })
  lastSentAt?: Date;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    name: 'next_scheduled_at',
  })
  nextScheduledAt?: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Clinic)
  @JoinColumn({ name: 'clinic_id' })
  clinic!: Clinic;

  @ManyToOne(() => CampaignTemplate)
  @JoinColumn({ name: 'campaign_template_id' })
  template!: CampaignTemplate;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by_user_id' })
  createdBy!: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'paused_by_user_id' })
  pausedBy?: User;

  @OneToMany(() => CampaignRecipient, (recipient) => recipient.campaign)
  recipients?: CampaignRecipient[];
}
