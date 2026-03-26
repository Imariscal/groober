import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Clinic } from './clinic.entity';
import { Appointment } from './appointment.entity';
import { Service } from './service.entity';
import { ServicePackage } from './service-package.entity';

@Entity('appointment_items')
@Index(['clinicId', 'appointmentId'])
@Index(['appointmentId'])
@Index(['serviceId'])
@Index(['packageId'])
export class AppointmentItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'clinic_id' })
  clinicId!: string;

  @Column({ type: 'uuid', name: 'appointment_id' })
  appointmentId!: string;

  @Column({ type: 'uuid', name: 'service_id', nullable: true })
  serviceId?: string;

  @Column({ type: 'uuid', name: 'package_id', nullable: true })
  packageId?: string;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    name: 'price_at_booking',
  })
  priceAtBooking!: number;

  @Column({
    type: 'integer',
    default: 1,
  })
  quantity!: number;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  subtotal!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  // Relations
  @ManyToOne(() => Clinic, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clinic_id' })
  clinic!: Clinic;

  @ManyToOne(() => Appointment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'appointment_id' })
  appointment!: Appointment;

  @ManyToOne(() => Service, { nullable: true })
  @JoinColumn({ name: 'service_id' })
  service?: Service;

  @ManyToOne(() => ServicePackage, { nullable: true })
  @JoinColumn({ name: 'package_id' })
  package?: ServicePackage;
}

