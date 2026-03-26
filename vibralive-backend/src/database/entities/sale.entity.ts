import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Clinic } from './clinic.entity';
import { Client } from './client.entity';
import { Appointment } from './appointment.entity';

@Entity('sales')
@Index(['clinicId', 'status'])
@Index(['clientId'])
@Index(['appointmentId'])
export class Sale {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'clinic_id' })
  clinicId!: string;

  @Column({ type: 'uuid', name: 'client_id', nullable: true })
  clientId?: string;

  @Column({ type: 'uuid', name: 'appointment_id', nullable: true })
  appointmentId?: string;

  @Column({ type: 'varchar', length: 20, default: 'POS', name: 'sale_type' })
  saleType!: 'POS' | 'APPOINTMENT_ADDON';

  @Column({ type: 'varchar', length: 20, default: 'DRAFT' })
  status!: 'DRAFT' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0, transformer: { to: (v) => v, from: (v) => parseFloat(v) } })
  subtotal!: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, name: 'discount_amount', default: 0, transformer: { to: (v) => v, from: (v) => parseFloat(v) } })
  discountAmount!: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, name: 'tax_amount', default: 0, transformer: { to: (v) => v, from: (v) => parseFloat(v) } })
  taxAmount!: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, name: 'total_amount', default: 0, transformer: { to: (v) => v, from: (v) => parseFloat(v) } })
  totalAmount!: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'timestamp with time zone', name: 'sold_at', nullable: true })
  soldAt?: Date;

  @Column({ type: 'timestamp with time zone', name: 'cancelled_at', nullable: true })
  cancelledAt?: Date;

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

  @ManyToOne(() => Client, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'client_id' })
  client?: Client;

  @ManyToOne(() => Appointment, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'appointment_id' })
  appointment?: Appointment;

  @OneToMany('SaleItem', 'sale', { cascade: true })
  items!: any[];

  @OneToMany('SalePayment', 'sale', { cascade: true })
  payments!: any[];
}
