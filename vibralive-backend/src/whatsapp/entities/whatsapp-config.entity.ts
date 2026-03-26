import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, OneToMany } from 'typeorm';
import { ClinicWhatsAppConfigEntity } from './clinic-whatsapp-config.entity';

@Entity('whatsapp_config')
@Index('idx_whatsapp_config_active', ['is_active'])
@Index('idx_whatsapp_config_verified', ['is_verified'])
export class WhatsAppConfigEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 50, default: 'twilio' })
  provider: string;

  @Column({ type: 'varchar', length: 255 })
  account_sid: string;

  @Column({ type: 'text' })
  auth_token: string;

  @Column({ type: 'integer', default: 50000 })
  global_daily_limit: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  webhook_url?: string;

  @Column({ type: 'text', nullable: true })
  webhook_secret?: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'boolean', default: false })
  is_verified: boolean;

  @Column({ type: 'timestamp with time zone', nullable: true })
  last_verified_at?: Date;

  @Column({ type: 'text', nullable: true })
  last_error?: string;

  @OneToMany(() => ClinicWhatsAppConfigEntity, config => config.whatsapp_config)
  clinic_configs: ClinicWhatsAppConfigEntity[];

  @CreateDateColumn({type: 'timestamp with time zone'})
  created_at: Date;

  @UpdateDateColumn({type: 'timestamp with time zone'})
  updated_at: Date;
}
