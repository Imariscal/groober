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
import { Sale } from './sale.entity';

@Entity('sale_payments')
@Index(['saleId'])
export class SalePayment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'clinic_id' })
  clinicId!: string;

  @Column({ type: 'uuid', name: 'sale_id' })
  saleId!: string;

  @Column({ type: 'varchar', length: 20, name: 'payment_method' })
  paymentMethod!: 'CASH' | 'CARD' | 'TRANSFER' | 'MIXED' | 'OTHER';

  @Column({ type: 'numeric', precision: 12, scale: 2, transformer: { to: (v) => v, from: (v) => parseFloat(v) } })
  amount!: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  reference?: string;

  @Column({ type: 'timestamp with time zone', name: 'paid_at' })
  paidAt!: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  // Relations
  @ManyToOne(() => Clinic, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clinic_id' })
  clinic!: Clinic;

  @ManyToOne(() => Sale, (sale) => sale.payments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sale_id' })
  sale!: Sale;
}
