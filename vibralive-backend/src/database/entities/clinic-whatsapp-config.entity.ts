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
 * Proveedores de WhatsApp Business API soportados
 * 
 * COMPARATIVA:
 * - META: API oficial, requiere verificación de negocio, gratis por mensajes iniciados por usuario
 * - TWILIO: Fácil integración, pago por mensaje, sandbox para desarrollo
 * - 360DIALOG: Partner oficial Meta, precios competitivos
 * - MESSAGEBIRD: Multi-canal, buena documentación
 * - VONAGE: Antes Nexmo, robusto para enterprise
 */
export enum WhatsAppProvider {
  META = 'meta',               // Meta Business API (oficial)
  TWILIO = 'twilio',           // Twilio WhatsApp
  DIALOG360 = '360dialog',     // 360dialog
  MESSAGEBIRD = 'messagebird', // MessageBird
  VONAGE = 'vonage',           // Vonage (Nexmo)
  WATI = 'wati',               // WATI.io
}

/**
 * Configuración de WhatsApp Business para la clínica
 * Permite enviar notificaciones automáticas a clientes
 */
@Entity('clinic_whatsapp_config')
export class ClinicWhatsAppConfig {
  @PrimaryColumn({ type: 'uuid', name: 'clinic_id' })
  clinicId!: string;

  @Column({
    type: 'enum',
    enum: WhatsAppProvider,
    default: WhatsAppProvider.META,
  })
  provider!: WhatsAppProvider;

  // ===== META Business API =====
  @Column({ type: 'text', name: 'access_token', nullable: true })
  accessToken?: string; // Token de acceso permanente

  @Column({ type: 'varchar', length: 100, name: 'phone_number_id', nullable: true })
  phoneNumberId?: string; // ID del número de teléfono en Meta

  @Column({ type: 'varchar', length: 100, name: 'business_account_id', nullable: true })
  businessAccountId?: string; // WhatsApp Business Account ID

  @Column({ type: 'varchar', length: 100, name: 'app_id', nullable: true })
  appId?: string; // Facebook App ID

  // ===== TWILIO =====
  @Column({ type: 'varchar', length: 100, name: 'account_sid', nullable: true })
  accountSid?: string; // Twilio Account SID

  @Column({ type: 'text', name: 'auth_token', nullable: true })
  authToken?: string; // Twilio Auth Token

  @Column({ type: 'varchar', length: 20, name: 'twilio_phone_number', nullable: true })
  twilioPhoneNumber?: string; // +14155238886

  // ===== Campos comunes =====
  @Column({ type: 'text', name: 'api_key', nullable: true })
  apiKey?: string; // API Key genérica (360dialog, MessageBird, etc.)

  @Column({ type: 'varchar', length: 20, name: 'sender_phone', nullable: true })
  senderPhone?: string; // Número que aparece como remitente

  @Column({ type: 'varchar', length: 255, name: 'webhook_url', nullable: true })
  webhookUrl?: string; // URL para recibir respuestas

  @Column({ type: 'text', name: 'webhook_secret', nullable: true })
  webhookSecret?: string; // Para verificar webhooks

  // ===== Estado y límites =====
  @Column({ type: 'boolean', name: 'is_active', default: false })
  isActive!: boolean;

  @Column({ type: 'boolean', name: 'is_verified', default: false })
  isVerified!: boolean; // Conexión verificada

  @Column({ type: 'timestamp with time zone', name: 'last_verified_at', nullable: true })
  lastVerifiedAt?: Date;

  @Column({ type: 'text', name: 'last_error', nullable: true })
  lastError?: string;

  // Límites de envío (para prevenir spam)
  @Column({ type: 'integer', name: 'daily_limit', default: 1000 })
  dailyLimit!: number;

  @Column({ type: 'integer', name: 'messages_sent_today', default: 0 })
  messagesSentToday!: number;

  @Column({ type: 'date', name: 'last_reset_date', nullable: true })
  lastResetDate?: Date;

  // ===== Preferencias de envío =====
  @Column({ type: 'boolean', name: 'send_appointment_confirmation', default: true })
  sendAppointmentConfirmation!: boolean;

  @Column({ type: 'boolean', name: 'send_appointment_reminder', default: true })
  sendAppointmentReminder!: boolean;

  @Column({ type: 'integer', name: 'reminder_hours_before', default: 24 })
  reminderHoursBefore!: number; // Enviar recordatorio X horas antes

  @Column({ type: 'boolean', name: 'send_stylist_on_way', default: true })
  sendStylistOnWay!: boolean;

  @Column({ type: 'boolean', name: 'send_service_completed', default: true })
  sendServiceCompleted!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Clinic, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clinic_id' })
  clinic!: Clinic;
}
