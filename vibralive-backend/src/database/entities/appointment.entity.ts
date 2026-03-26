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
import { Pet } from './pet.entity';
import { Client } from './client.entity';
import { ClientAddress } from './client-address.entity';
import { User } from './user.entity';
import { PriceList } from './price-list.entity';
import { AppointmentGroup } from './appointment-group.entity';
import { AppointmentItem } from './appointment-item.entity';
import { Sale } from './sale.entity';

@Entity('appointments')
@Index(['clinicId', 'status'])
@Index(['clinicId', 'scheduledAt'])
@Index(['clinicId', 'createdAt'])
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'clinic_id' })
  clinicId!: string;

  @Column({ type: 'uuid', name: 'pet_id' })
  petId!: string;

  @Column({ type: 'uuid', name: 'client_id' })
  clientId!: string;

  @Column({ type: 'timestamp with time zone', name: 'scheduled_at' })
  scheduledAt!: Date;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'SCHEDULED',
  })
  status!: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' | 'UNATTENDED';

  @Column({ type: 'text', nullable: true })
  reason!: string;

  @Column({
    type: 'integer',
    nullable: true,
    name: 'duration_minutes',
  })
  durationMinutes!: number;

  @Column({
    type: 'uuid',
    nullable: true,
    name: 'veterinarian_id',
  })
  veterinarianId!: string;

  @Column({ type: 'text', nullable: true })
  notes!: string;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    name: 'cancelled_at',
  })
  cancelledAt: Date | null = null;

  @Column({
    type: 'uuid',
    nullable: true,
    name: 'cancelled_by',
  })
  cancelledBy: string | null = null;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    name: 'cancellation_reason',
  })
  cancellationReason: string | null = null;

  @Column({
    type: 'enum',
    enum: ['CLINIC', 'HOME'],
    default: 'CLINIC',
    name: 'location_type',
  })
  locationType!: 'CLINIC' | 'HOME';

  @Column({
    type: 'enum',
    enum: ['MEDICAL', 'GROOMING'],
    default: 'MEDICAL',
    name: 'service_type',
  })
  serviceType!: 'MEDICAL' | 'GROOMING';

  @Column({ type: 'uuid', nullable: true, name: 'address_id' })
  addressId!: string;

  @Column({
    type: 'uuid',
    nullable: true,
    name: 'assigned_staff_user_id',
  })
  assignedStaffUserId?: string;

  @Column({
    type: 'enum',
    enum: ['NONE', 'AUTO_ROUTE', 'MANUAL_RECEPTION', 'COMPLETED_IN_CLINIC'],
    default: 'NONE',
    name: 'assignment_source',
  })
  assignmentSource!: 'NONE' | 'AUTO_ROUTE' | 'MANUAL_RECEPTION' | 'COMPLETED_IN_CLINIC';

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    name: 'assigned_at',
  })
  assignedAt: Date | null = null;

  @Column({
    type: 'boolean',
    default: false,
    name: 'requires_route_planning',
  })
  requiresRoutePlanning!: boolean;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    nullable: true,
    name: 'total_amount',
  })
  totalAmount: number | null = null;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    name: 'price_lock_at',
  })
  priceLockAt: Date | null = null;

  @Column({
    type: 'uuid',
    nullable: true,
    name: 'price_list_id',
  })
  priceListId: string | null = null;

  @Column({
    type: 'uuid',
    nullable: true,
    name: 'group_id',
  })
  groupId?: string;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    name: 'rescheduled_at',
  })
  rescheduledAt: Date | null = null;

  @Column({
    type: 'boolean',
    default: false,
  })
  paid!: boolean;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    name: 'payment_date',
  })
  paymentDate: Date | null = null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Clinic, (clinic) => clinic.appointments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'clinic_id' })
  clinic!: Clinic;

  @ManyToOne(() => Pet, (pet) => pet.appointments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'pet_id' })
  pet!: Pet;

  @ManyToOne(() => Client, (client) => client.appointments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'client_id' })
  client!: Client;

  @ManyToOne(() => ClientAddress, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'address_id' })
  address!: ClientAddress | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assigned_staff_user_id' })
  assignedStaffUser!: User | null;

  @ManyToOne(() => PriceList, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'price_list_id' })
  priceList!: PriceList | null;

  @ManyToOne(() => AppointmentGroup, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'group_id' })
  appointmentGroup?: AppointmentGroup;

  @OneToMany(() => AppointmentItem, (item) => item.appointment, {
    eager: false,
    cascade: false,
  })
  appointmentItems?: AppointmentItem[];

  @OneToMany(() => Sale, (sale) => sale.appointment, {
    eager: false,
    cascade: false,
  })
  sales?: Sale[];
}
