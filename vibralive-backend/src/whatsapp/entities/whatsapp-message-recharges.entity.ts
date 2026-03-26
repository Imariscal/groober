import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('whatsapp_message_recharges')
@Index('idx_recharge_clinic_status', ['clinic_id', 'status'])
export class WhatsAppMessageRechargesEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  clinic_id: string;

  @Column({ type: 'integer' })
  quantity: number; // Messages to recharge

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unit_price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total_amount: number;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status: string; // pending, completed, failed, cancelled

  @Column({ type: 'varchar', length: 50, nullable: true })
  payment_method?: string; // credit_card, debit_card, paypal, etc

  @Column({ type: 'varchar', length: 255, nullable: true })
  transaction_id?: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  expires_at?: Date;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;
}
