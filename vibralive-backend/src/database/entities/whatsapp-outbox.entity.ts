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

@Entity('whatsapp_outbox')
@Index(['clinicId', 'status'])
@Index(['clinicId', 'createdAt'])
@Index(['idempotencyKey'])
@Index(['retryCount', 'status'])
export class WhatsAppOutbox {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'clinic_id' })
  clinicId!: string;

  @Column({ type: 'uuid', nullable: true, name: 'client_id' })
  clientId: string | null = null;

  @Column({ type: 'varchar', length: 20, name: 'phone_number' })
  phoneNumber!: string;

  @Column({ type: 'text', name: 'message_body' })
  messageBody!: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'queued',
  })
  status!: 'queued' | 'sent' | 'failed' | 'delivered';

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    unique: true,
    name: 'idempotency_key',
  })
  idempotencyKey: string | null = null;

  @Column({
    type: 'integer',
    default: 0,
    name: 'retry_count',
  })
  retryCount!: number;

  @Column({
    type: 'integer',
    default: 5,
    name: 'max_retries',
  })
  maxRetries!: number;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    name: 'last_retry_at',
  })
  lastRetryAt: Date | null = null;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'provider_message_id',
  })
  providerMessageId: string | null = null;

  @Column({
    type: 'text',
    nullable: true,
    name: 'provider_error',
  })
  providerError: string | null = null;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'whatsapp',
  })
  channel!: 'whatsapp' | 'sms' | 'telegram';

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    name: 'message_type',
  })
  messageType!: string;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    name: 'sent_at',
  })
  sentAt: Date | null = null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Clinic, (clinic) => clinic.whatsappMessages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'clinic_id' })
  clinic!: Clinic;

  @ManyToOne(() => Client, (client) => client.whatsappMessages, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'client_id' })
  client: Client | null = null;
}
