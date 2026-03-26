import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('whatsapp_message_usage')
@Index('idx_message_usage_clinic_month', ['clinic_id', 'sent_at'])
@Index('idx_message_usage_billable', ['clinic_id', 'is_billable'])
@Index('idx_message_usage_parent', ['parent_message_id'])
@Index('idx_provider_message_dedup', ['provider_message_id'], {
  where: 'provider_message_id IS NOT NULL',
  unique: true,
})
export class WhatsAppMessageUsageEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  clinic_id: string;

  @Column({ type: 'uuid', nullable: true })
  appointment_id?: string;

  // Mensaje
  @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
  provider_message_id?: string; // wamid from Twilio

  @Column({ type: 'varchar', length: 255, nullable: true })
  parent_message_id?: string; // Para reply-to tracking (self-referential)

  @Column({ type: 'varchar', length: 20 })
  direction: string; // 'outbound' | 'inbound'

  @Column({ type: 'varchar', length: 50, nullable: true })
  message_type?: string; // 'template' | 'text' | 'interactive' | etc

  // Billing
  @Column({ type: 'boolean', default: true })
  is_billable: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.01 })
  message_cost: number;

  @Column({ type: 'boolean', default: false })
  was_overage: boolean;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  sent_at: Date;
}
