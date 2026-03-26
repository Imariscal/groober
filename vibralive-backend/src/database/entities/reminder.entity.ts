import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ForeignKey,
  OneToMany,
  Index,
} from 'typeorm';
import { Clinic } from './clinic.entity';
import { Pet } from './pet.entity';
import { Client } from './client.entity';
import { MessageLog } from './message-log.entity';

@Entity('reminders')
@Index(['clinicId', 'status'])
@Index(['clinicId', 'scheduledDate', 'status'], {
  where: "status IN ('pending', 'sent')",
})
@Index(['petId'])
@Index(['clientId'])
export class Reminder {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'clinic_id', type: 'uuid' })
  clinicId!: string;

  @Column({ name: 'pet_id', type: 'uuid' })
  petId!: string;

  @Column({ name: 'client_id', type: 'uuid' })
  clientId!: string;

  @Column({ name: 'reminder_type', type: 'varchar', length: 50 })
  reminderType!: string; // vaccine, deworming

  @Column({ name: 'reminder_stage', type: 'varchar', length: 50 })
  reminderStage!: string; // day7, day1, followup24h

  @Column({ name: 'scheduled_date', type: 'date' })
  scheduledDate!: Date;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status!: string; // pending, sent, confirmed, cancelled, failed

  @Column({ name: 'message_id', type: 'varchar', length: 255, nullable: true })
  messageId!: string; // wamid from Meta

  @Column({ name: 'confirmed_at', type: 'timestamp with time zone', nullable: true })
  confirmedAt!: Date;

  @Column({ name: 'failed_reason', type: 'varchar', length: 500, nullable: true })
  failedReason!: string;

  @Column({ name: 'attempt_count', type: 'integer', default: 0 })
  attemptCount!: number;

  @Column({ name: 'last_attempt_at', type: 'timestamp with time zone', nullable: true })
  lastAttemptAt!: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Clinic, (clinic) => clinic.reminders, {
    onDelete: 'CASCADE',
  })
  clinic!: Clinic;

  @ManyToOne(() => Pet, (pet) => pet.reminders, {
    onDelete: 'CASCADE',
  })
  pet!: Pet;

  @ManyToOne(() => Client, (client) => client.reminders, {
    onDelete: 'CASCADE',
  })
  client!: Client;

  @OneToMany(() => MessageLog, (messageLog) => messageLog.reminder)
  messageLogs!: MessageLog[];
}
