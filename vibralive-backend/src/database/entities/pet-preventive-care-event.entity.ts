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
import { Service } from './service.entity';

@Entity('pet_preventive_care_events')
@Index(['clinicId', 'petId'])
@Index(['clinicId', 'status', 'nextDueAt'])
@Index(['appointmentId'])
export class PetPreventiveCareEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'clinic_id' })
  clinicId!: string;

  @Column({ type: 'uuid', name: 'client_id' })
  clientId!: string;

  @Column({ type: 'uuid', name: 'pet_id' })
  petId!: string;

  @Column({ type: 'uuid', name: 'appointment_id', nullable: true })
  appointmentId?: string;

  @Column({ type: 'uuid', name: 'appointment_item_id', nullable: true })
  appointmentItemId?: string;

  @Column({ type: 'uuid', name: 'service_id' })
  serviceId!: string;

  @Column({ type: 'varchar', length: 30, name: 'event_type' })
  eventType!: 'VACCINE' | 'DEWORMING_INTERNAL' | 'DEWORMING_EXTERNAL' | 'GROOMING_MAINTENANCE' | 'OTHER';

  @Column({ type: 'timestamp with time zone', name: 'applied_at' })
  appliedAt!: Date;

  @Column({ type: 'timestamp with time zone', name: 'next_due_at', nullable: true })
  nextDueAt?: Date;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'cycle_type' })
  cycleType?: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';

  @Column({ type: 'int', nullable: true, name: 'cycle_value' })
  cycleValue?: number;

  @Column({ type: 'int', default: 7, name: 'reminder_days_before' })
  reminderDaysBefore!: number;

  @Column({ type: 'varchar', length: 20, default: 'ACTIVE' })
  status!: 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'uuid', name: 'created_by_user_id', nullable: true })
  createdByUserId?: string;

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

  @ManyToOne(() => Appointment, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'appointment_id' })
  appointment?: Appointment;

  @ManyToOne(() => Service, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'service_id' })
  service!: Service;
}
