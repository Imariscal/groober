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

export enum TemplateStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PAUSED = 'paused',
  DISABLED = 'disabled',
}

export enum TemplateCategory {
  AUTHENTICATION = 'AUTHENTICATION',
  MARKETING = 'MARKETING',
  UTILITY = 'UTILITY',
}

@Entity('whatsapp_templates')
@Index(['clinicId', 'status'])
@Index(['clinicId', 'name'])
@Index(['providerTemplateId'])
export class WhatsAppTemplate {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'clinic_id', type: 'uuid' })
  clinicId!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({
    type: 'enum',
    enum: TemplateCategory,
    default: TemplateCategory.UTILITY,
  })
  category!: TemplateCategory;

  @Column({ name: 'language_code', type: 'varchar', length: 10, default: 'es' })
  languageCode!: string;

  @Column({
    type: 'enum',
    enum: TemplateStatus,
    default: TemplateStatus.DRAFT,
  })
  status!: TemplateStatus;

  @Column({ name: 'header_type', type: 'varchar', length: 50, nullable: true })
  headerType?: string; // IMAGE, VIDEO, DOCUMENT, TEXT

  @Column({ name: 'body_text', type: 'text' })
  bodyText!: string;

  @Column({ name: 'footer_text', type: 'text', nullable: true })
  footerText?: string;

  @Column({ name: 'buttons_json', type: 'jsonb', nullable: true })
  buttonsJson?: Array<{
    type: string; // URL, PHONE_NUMBER, QUICK_REPLY, COPY_CODE
    text: string;
    url?: string;
    phone_number?: string;
  }>;

  @Column({ name: 'variables_json', type: 'jsonb', nullable: true })
  variablesJson?: Array<{
    name: string;
    type: string;
    example: string;
  }>;

  @Column({ name: 'provider_template_id', type: 'varchar', length: 255, nullable: true })
  providerTemplateId?: string; // Meta template ID

  @Column({ name: 'rejected_reason', type: 'text', nullable: true })
  rejectedReason?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Clinic, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clinic_id' })
  clinic!: Clinic;
}
