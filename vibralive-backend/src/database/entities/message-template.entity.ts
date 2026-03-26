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

/**
 * Canales de comunicación disponibles
 */
export enum MessageChannel {
  EMAIL = 'email',
  WHATSAPP = 'whatsapp',
  SMS = 'sms',
  PUSH = 'push', // Notificaciones push (futuro)
}

/**
 * Tipos de eventos/triggers para las plantillas
 * 
 * FLUJO DE CITA A DOMICILIO:
 * 1. APPOINTMENT_SCHEDULED - Cita agendada
 * 2. APPOINTMENT_REMINDER - Recordatorio (24h antes)
 * 3. APPOINTMENT_SAME_DAY - Recordatorio día de la cita
 * 4. STYLIST_ON_WAY - Estilista en camino
 * 5. SERVICE_IN_PROGRESS - Servicio iniciado
 * 6. SERVICE_COMPLETED - Mascota lista
 * 7. APPOINTMENT_FOLLOW_UP - Seguimiento post-servicio
 * 
 * OTROS:
 * - APPOINTMENT_CANCELLED - Cita cancelada
 * - APPOINTMENT_RESCHEDULED - Cita reagendada
 * - PAYMENT_RECEIVED - Pago recibido
 * - WELCOME - Bienvenida nuevo cliente
 */
export enum MessageTrigger {
  // Ciclo de vida de cita
  APPOINTMENT_SCHEDULED = 'appointment_scheduled',
  APPOINTMENT_CONFIRMED = 'appointment_confirmed',
  APPOINTMENT_REMINDER = 'appointment_reminder',
  APPOINTMENT_SAME_DAY = 'appointment_same_day',
  APPOINTMENT_CANCELLED = 'appointment_cancelled',
  APPOINTMENT_RESCHEDULED = 'appointment_rescheduled',
  
  // Durante el servicio (domicilio)
  STYLIST_ON_WAY = 'stylist_on_way',
  STYLIST_ARRIVED = 'stylist_arrived',
  
  // Durante el servicio (clínica)
  PET_CHECKED_IN = 'pet_checked_in',
  SERVICE_IN_PROGRESS = 'service_in_progress',
  SERVICE_COMPLETED = 'service_completed',
  PET_READY_PICKUP = 'pet_ready_pickup',
  
  // Post-servicio
  APPOINTMENT_FOLLOW_UP = 'appointment_follow_up',
  REVIEW_REQUEST = 'review_request',
  
  // Pagos
  PAYMENT_RECEIVED = 'payment_received',
  PAYMENT_REMINDER = 'payment_reminder',
  INVOICE_SENT = 'invoice_sent',
  
  // Cliente
  WELCOME = 'welcome',
  BIRTHDAY = 'birthday',
  PET_BIRTHDAY = 'pet_birthday',
  LOYALTY_REWARD = 'loyalty_reward',
  
  // Recordatorios de salud
  VACCINATION_REMINDER = 'vaccination_reminder',
  GROOMING_DUE = 'grooming_due',
}

/**
 * Cuándo enviar el mensaje relativo al evento
 */
export enum MessageTiming {
  IMMEDIATE = 'immediate',           // Inmediato al trigger
  HOURS_BEFORE = 'hours_before',     // X horas antes
  DAYS_BEFORE = 'days_before',       // X días antes
  HOURS_AFTER = 'hours_after',       // X horas después
  DAYS_AFTER = 'days_after',         // X días después
  SCHEDULED = 'scheduled',           // Hora específica
}

/**
 * Variables disponibles para interpolación en plantillas
 * 
 * USO: {{variable_name}}
 * 
 * CLIENTE:
 * - {{client_name}} - Nombre completo
 * - {{client_first_name}} - Primer nombre
 * - {{client_phone}} - Teléfono
 * - {{client_email}} - Email
 * 
 * MASCOTA:
 * - {{pet_name}} - Nombre de la mascota
 * - {{pet_breed}} - Raza
 * - {{pet_species}} - Especie (perro, gato)
 * 
 * CITA:
 * - {{appointment_date}} - Fecha (formato largo)
 * - {{appointment_date_short}} - Fecha (formato corto)
 * - {{appointment_time}} - Hora
 * - {{appointment_type}} - Tipo (domicilio/clínica)
 * - {{appointment_address}} - Dirección (domicilio)
 * 
 * SERVICIO:
 * - {{service_name}} - Nombre del servicio
 * - {{service_duration}} - Duración estimada
 * - {{service_price}} - Precio
 * 
 * ESTILISTA:
 * - {{stylist_name}} - Nombre del estilista
 * - {{stylist_phone}} - Teléfono del estilista
 * 
 * CLÍNICA:
 * - {{clinic_name}} - Nombre de la clínica
 * - {{clinic_phone}} - Teléfono
 * - {{clinic_address}} - Dirección
 * - {{clinic_email}} - Email
 * 
 * PAGO:
 * - {{total_amount}} - Monto total
 * - {{payment_link}} - Link de pago
 * 
 * OTROS:
 * - {{current_date}} - Fecha actual
 * - {{current_time}} - Hora actual
 */

@Entity('message_templates')
@Index(['clinicId', 'trigger', 'channel'])
export class MessageTemplate {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'clinic_id' })
  clinicId!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string; // Nombre descriptivo (ej: "Confirmación de cita WhatsApp")

  @Column({
    type: 'enum',
    enum: MessageTrigger,
  })
  trigger!: MessageTrigger;

  @Column({
    type: 'enum',
    enum: MessageChannel,
  })
  channel!: MessageChannel;

  // Contenido
  @Column({ type: 'varchar', length: 255, nullable: true })
  subject?: string; // Solo para email

  @Column({ type: 'text' })
  body!: string; // Contenido del mensaje con variables {{}}

  @Column({ type: 'text', name: 'body_html', nullable: true })
  bodyHtml?: string; // Versión HTML para email

  // Timing
  @Column({
    type: 'enum',
    enum: MessageTiming,
    default: MessageTiming.IMMEDIATE,
  })
  timing!: MessageTiming;

  @Column({ type: 'integer', name: 'timing_value', nullable: true })
  timingValue?: number; // Número de horas/días según timing

  @Column({ type: 'time', name: 'scheduled_time', nullable: true })
  scheduledTime?: string; // Para timing SCHEDULED (ej: "09:00")

  // WhatsApp específico
  @Column({ type: 'varchar', length: 255, name: 'whatsapp_template_name', nullable: true })
  whatsappTemplateName?: string; // Nombre de template aprobado en Meta

  @Column({ type: 'varchar', length: 10, name: 'whatsapp_template_language', nullable: true })
  whatsappTemplateLanguage?: string; // es, es_MX, en, etc.

  // Estado
  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ type: 'boolean', name: 'is_system', default: false })
  isSystem!: boolean; // Templates del sistema (no editables)

  // Estadísticas
  @Column({ type: 'integer', name: 'times_sent', default: 0 })
  timesSent!: number;

  @Column({ type: 'timestamp with time zone', name: 'last_sent_at', nullable: true })
  lastSentAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Clinic, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clinic_id' })
  clinic!: Clinic;
}
