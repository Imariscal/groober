import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { WhatsAppConfigEntity } from './whatsapp-config.entity';

@Entity('clinic_whatsapp_config')
@Index('idx_clinic_whatsapp_config_id', ['whatsapp_config_id'])
@Index('idx_clinic_whatsapp_monthly', ['monthly_reset_date'])
export class ClinicWhatsAppConfigEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  clinic_id: string;

  // FK a whatsapp_config global
  @Column({ type: 'uuid', nullable: true })
  whatsapp_config_id?: string;

  @ManyToOne(() => WhatsAppConfigEntity, config => config.clinic_configs, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'whatsapp_config_id' })
  whatsapp_config?: WhatsAppConfigEntity;

  // Display & Sender
  @Column({ type: 'varchar', length: 20, nullable: true })
  display_phone?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  sender_name?: string;

  // Límites mensuales
  @Column({ type: 'integer', default: 200 })
  monthly_message_limit: number;

  @Column({ type: 'integer', default: 0 })
  monthly_messages_used: number;

  @Column({ type: 'date', nullable: true })
  monthly_reset_date?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  last_message_sent_at?: Date;

  // Alertas
  @Column({ type: 'integer', default: 80 })
  alert_threshold_percentage: number;

  @Column({ type: 'boolean', default: false })
  is_alert_sent: boolean;

  // Overage
  @Column({ type: 'boolean', default: false })
  allows_overage: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.05 })
  overage_cost_per_message: number;

  @Column({ type: 'integer', default: 0 })
  total_overage_messages: number;

  // Suscripción
  @Column({ type: 'varchar', length: 50, default: 'basic' })
  subscription_tier: string;

  // Feature flags
  @Column({ type: 'boolean', default: true })
  send_appointment_confirmation: boolean;

  @Column({ type: 'boolean', default: true })
  send_appointment_reminder: boolean;

  @Column({ type: 'integer', default: 4 })
  reminder_hours_before: number;

  @Column({ type: 'boolean', default: false })
  send_stylist_on_way: boolean;

  @Column({ type: 'boolean', default: false })
  send_service_completed: boolean;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;
}
