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
import { User } from './user.entity';

export enum CampaignChannel {
  WHATSAPP = 'WHATSAPP',
  EMAIL = 'EMAIL',
}

/**
 * Campaign Templates - Separate from message_templates
 * 
 * Used for multi-user campaigns, not event-driven messages.
 * Supports variable templating like message_templates.
 */
@Entity('campaign_templates')
@Index(['clinicId'])
@Index(['channel'])
@Index(['isActive'])
@Index(['clinicId', 'channel'])
export class CampaignTemplate {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'clinic_id', type: 'uuid' })
  clinicId!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'varchar',
    length: 50,
    enum: CampaignChannel,
  })
  channel!: CampaignChannel;

  // Email-specific fields
  @Column({ type: 'varchar', length: 255, nullable: true })
  subject?: string;

  @Column({ type: 'text' })
  body!: string;

  @Column({ type: 'text', nullable: true, name: 'body_html' })
  bodyHtml?: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'preview_text' })
  previewText?: string;

  // WhatsApp-specific fields
  @Column({ type: 'varchar', length: 255, nullable: true, name: 'whatsapp_template_name' })
  whatsappTemplateName?: string;

  @Column({ type: 'varchar', length: 10, nullable: true, name: 'whatsapp_template_language' })
  whatsappTemplateLanguage?: string;

  // Variables in JSON: {"variables": ["clientName", "petName", "serviceName", ...]}
  @Column({ type: 'jsonb', nullable: true, name: 'variables_json' })
  variablesJson?: Record<string, string[]>;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive!: boolean;

  @Column({ name: 'created_by_user_id', type: 'uuid' })
  createdByUserId!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Clinic)
  @JoinColumn({ name: 'clinic_id' })
  clinic!: Clinic;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by_user_id' })
  createdBy!: User;
}
