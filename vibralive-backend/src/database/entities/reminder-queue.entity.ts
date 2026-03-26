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
import { Appointment } from './appointment.entity';
import { PetPreventiveCareEvent } from './pet-preventive-care-event.entity';

@Entity('reminder_queue')
@Index(['clinicId', 'status'])
@Index(['status', 'scheduledFor'])
@Index(['petId'])
export class ReminderQueue {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'clinic_id' })
  clinicId!: string;

  @Column({ type: 'uuid', name: 'client_id' })
  clientId!: string;

  @Column({ type: 'uuid', name: 'pet_id' })
  petId!: string;

  @Column({ type: 'uuid', name: 'preventive_event_id', nullable: true })
  preventiveEventId?: string;

  @Column({ type: 'uuid', name: 'appointment_id', nullable: true })
  appointmentId?: string;

  @Column({ type: 'varchar', length: 20 })
  channel!: 'WHATSAPP' | 'EMAIL';

  @Column({ type: 'varchar', length: 30, name: 'reminder_type' })
  reminderType!: 'UPCOMING_PREVENTIVE_EVENT' | 'OVERDUE_PREVENTIVE_EVENT' | 'APPOINTMENT_REMINDER';

  @Column({ type: 'timestamp with time zone', name: 'scheduled_for' })
  scheduledFor!: Date;

  @Column({ type: 'timestamp with time zone', name: 'sent_at', nullable: true })
  sentAt?: Date;

  @Column({ type: 'varchar', length: 20, default: 'PENDING' })
  status!: 'PENDING' | 'SENT' | 'FAILED' | 'CANCELLED';

  @Column({ type: 'uuid', name: 'template_id', nullable: true })
  templateId?: string;

  @Column({ type: 'jsonb', nullable: true, name: 'payload_json' })
  payloadJson?: Record<string, any>;

  @Column({ type: 'text', nullable: true, name: 'error_message' })
  errorMessage?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Clinic, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clinic_id' })
  clinic!: Clinic;

  @ManyToOne(() => Client, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'client_id' })
  client!: Client;

  @ManyToOne(() => Pet, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pet_id' })
  pet!: Pet;

  @ManyToOne(() => PetPreventiveCareEvent, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'preventive_event_id' })
  preventiveEvent?: PetPreventiveCareEvent;

  @ManyToOne(() => Appointment, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'appointment_id' })
  appointment?: Appointment;
}
