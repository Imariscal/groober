import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  ForeignKey,
  Index,
} from 'typeorm';
import { Clinic } from './clinic.entity';
import { Reminder } from './reminder.entity';
import { Client } from './client.entity';

@Entity('message_logs')
@Index(['clinicId'])
@Index(['reminderId'])
@Index(['clientId'])
@Index(['direction', 'status'])
@Index(['whatsappMessageId'])
@Index(
  ['clinicId', 'whatsappMessageId'],
  {
    where: "direction = 'inbound'",
  },
)
export class MessageLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'clinic_id', type: 'uuid' })
  clinicId!: string;

  @Column({ name: 'reminder_id', type: 'uuid', nullable: true })
  reminderId!: string;

  @Column({ name: 'client_id', type: 'uuid' })
  clientId!: string;

  @Column({ type: 'varchar', length: 20 })
  direction!: string; // outbound, inbound

  @Column({ name: 'message_type', type: 'varchar', length: 50 })
  messageType!: string; // reminder, confirmation, followup, user_message

  @Column({ name: 'phone_number', type: 'varchar', length: 20 })
  phoneNumber!: string;

  @Column({ type: 'text' })
  messageBody!: string;

  @Column({ name: 'whatsapp_message_id', type: 'varchar', length: 255, nullable: true })
  whatsappMessageId!: string; // wamid from Meta

  @Column({ type: 'varchar', length: 50, default: 'delivered' })
  status!: string; // delivered, read, failed, cancelled

  @Column({ name: 'error_code', type: 'varchar', length: 50, nullable: true })
  errorCode!: string;

  @Column({ name: 'error_message', type: 'varchar', length: 500, nullable: true })
  errorMessage!: string;

  @Column({ name: 'sent_at', type: 'timestamp with time zone', nullable: true })
  sentAt!: Date;

  @Column({ name: 'read_at', type: 'timestamp with time zone', nullable: true })
  readAt!: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  // Relations
  @ManyToOne(() => Clinic, (clinic) => clinic.messageLogs, {
    onDelete: 'CASCADE',
  })
  clinic!: Clinic;

  @ManyToOne(() => Reminder, (reminder) => reminder.messageLogs, {
    onDelete: 'SET NULL',
  })
  reminder!: Reminder;

  @ManyToOne(() => Client, (client) => client.messageLogs, {
    onDelete: 'CASCADE',
  })
  client!: Client;
}
