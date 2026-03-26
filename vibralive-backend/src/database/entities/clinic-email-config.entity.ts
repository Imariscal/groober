import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Clinic } from './clinic.entity';

/**
 * Tipos de proveedores de email soportados
 */
export enum EmailProvider {
  SMTP = 'smtp',           // SMTP genérico
  SENDGRID = 'sendgrid',   // SendGrid API
  MAILGUN = 'mailgun',     // Mailgun API
  SES = 'ses',             // Amazon SES
  RESEND = 'resend',       // Resend API
  POSTMARK = 'postmark',   // Postmark API
  PLATFORM = 'platform',   // Usar configuración de la plataforma
}

/**
 * Configuración de correo electrónico de la clínica
 * Permite a cada clínica usar su propio servidor de correo o API
 */
@Entity('clinic_email_config')
export class ClinicEmailConfig {
  @PrimaryColumn({ type: 'uuid', name: 'clinic_id' })
  clinicId!: string;

  @Column({
    type: 'enum',
    enum: EmailProvider,
    default: EmailProvider.PLATFORM,
  })
  provider!: EmailProvider;

  // SMTP Configuration
  @Column({ type: 'varchar', length: 255, name: 'smtp_host', nullable: true })
  smtpHost?: string;

  @Column({ type: 'integer', name: 'smtp_port', nullable: true })
  smtpPort?: number;

  @Column({ type: 'varchar', length: 255, name: 'smtp_user', nullable: true })
  smtpUser?: string;

  @Column({ type: 'text', name: 'smtp_password', nullable: true })
  smtpPassword?: string; // Encriptado en producción

  @Column({ type: 'boolean', name: 'smtp_secure', default: true })
  smtpSecure!: boolean; // TLS

  // API-based providers (SendGrid, Mailgun, etc.)
  @Column({ type: 'text', name: 'api_key', nullable: true })
  apiKey?: string; // Encriptado en producción
  
  @Column({ type: 'varchar', length: 255, name: 'api_domain', nullable: true })
  apiDomain?: string; // Para Mailgun usa dominio verificado

  // Sender configuration
  @Column({ type: 'varchar', length: 255, name: 'from_email', nullable: true })
  fromEmail?: string; // noreply@clinica.com

  @Column({ type: 'varchar', length: 255, name: 'from_name', nullable: true })
  fromName?: string; // "Clínica Pet Spa"

  @Column({ type: 'varchar', length: 255, name: 'reply_to_email', nullable: true })
  replyToEmail?: string; // contacto@clinica.com

  // Estado
  @Column({ type: 'boolean', name: 'is_active', default: false })
  isActive!: boolean;

  @Column({ type: 'boolean', name: 'is_verified', default: false })
  isVerified!: boolean; // Se verificó que la config funciona

  @Column({ type: 'timestamp with time zone', name: 'last_verified_at', nullable: true })
  lastVerifiedAt?: Date;

  @Column({ type: 'text', name: 'last_error', nullable: true })
  lastError?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Clinic, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clinic_id' })
  clinic!: Clinic;
}
