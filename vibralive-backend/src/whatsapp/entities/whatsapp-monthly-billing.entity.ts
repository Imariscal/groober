import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('whatsapp_monthly_billing')
@Index('idx_billing_clinic_month', ['clinic_id', 'billing_year', 'billing_month'])
@Index('idx_billing_pending', ['status'], {
  where: "status = 'pending'",
})
export class WhatsAppMonthlyBillingEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  clinic_id: string;

  @Column({ type: 'smallint' })
  billing_year: number;

  @Column({ type: 'smallint' })
  billing_month: number;

  // Consumo
  @Column({ type: 'integer' })
  message_limit: number;

  @Column({ type: 'integer', default: 0 })
  messages_sent: number;

  @Column({ type: 'integer', default: 0 })
  messages_overage: number;

  // Costos
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  base_price?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  overage_cost: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  total_cost?: number;

  // Invoice
  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status: string; // pending, pending_payment, paid, overdue, etc

  @Column({ type: 'varchar', length: 255, nullable: true })
  invoice_id?: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  invoice_date?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  due_date?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  paid_date?: Date;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;
}
