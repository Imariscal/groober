import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import Twilio from 'twilio';
import {
  WhatsAppAppointmentTrackingEntity,
  WhatsAppMessageUsageEntity,
} from '../entities';
import { WhatsAppConfigService } from './whatsapp-config.service';
import { TimezoneService } from '../../shared/timezone/timezone.service';

@Injectable()
export class WhatsAppMessageService {
  private readonly logger = new Logger(WhatsAppMessageService.name);
  private twilioClient: Twilio.Twilio;

  constructor(
    @InjectRepository(WhatsAppAppointmentTrackingEntity)
    private trackingRepo: Repository<WhatsAppAppointmentTrackingEntity>,

    @InjectRepository(WhatsAppMessageUsageEntity)
    private messageUsageRepo: Repository<WhatsAppMessageUsageEntity>,

    private configService: ConfigService,
    private whatsappConfigService: WhatsAppConfigService,
    private timezoneService: TimezoneService,
  ) {
    this.initializeTwilio();
  }

  /**
   * 🔐 Inicializar cliente Twilio
   */
  private initializeTwilio(): void {
    try {
      const config = this.configService.get('whatsapp');
      if (!config) {
        this.logger.warn('WhatsApp config not ready, will initialize on first use');
        return;
      }

      this.twilioClient = Twilio(config.account_sid, config.auth_token);
      this.logger.log('✅ Twilio client initialized');
    } catch (error) {
      this.logger.error('Failed to initialize Twilio:', error);
    }
  }

  /**
   * 📱 Enviar recordatorio de cita (TEMPLATE MESSAGE)
   * 
   * @param appointmentId - ID de la cita
   * @param clinicId - ID de la clínica
   * @param clientPhone - Teléfono del cliente (formato Twilio: +5216141234567)
   * @returns { success: boolean, messageId?: string, error?: string }
   */
  async sendAppointmentReminder(
    appointmentId: string,
    clinicId: string,
    clientPhone: string,
  ): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      // ✅ Paso 1: Validar límites de clínica
      const canSend = await this.whatsappConfigService.canSendMessage(clinicId);
      if (!canSend.can_send) {
        this.logger.warn(
          `[WhatsApp] Cannot send to clinic ${clinicId}: ${canSend.reason}`,
        );
        return { success: false, error: canSend.reason };
      }

      // ✅ Paso 2: Obtener configuración de clínica
      const clinicConfig = await this.whatsappConfigService.getClinicConfig(clinicId);

      // ✅ Paso 3: Obtener ubicación del tracking
      const tracking = await this.trackingRepo.findOne({
        where: { appointment_id: appointmentId },
      });

      if (!tracking) {
        throw new BadRequestException(
          `No tracking found for appointment ${appointmentId}`,
        );
      }

      // ✅ Paso 4: Obtener configuración global Twilio
      const globalConfig = await this.whatsappConfigService.getGlobalConfig();

      // ✅ Paso 5: Calcular horarios en UTC (almacenados en BD)
      const appointmentUtc = new Date(tracking.appointment_date);
      const now = new Date();

      // 📍 Solo para LOGGING: convertir a TZ clínica para debug
      const timezoneString = await this.timezoneService.getClinicTimezone(clinicId);
      const appointmentInClinicTz = this.timezoneService.formatInClinicTz(
        appointmentUtc,
        timezoneString,
      );

      this.logger.debug(
        `[WhatsApp] Sending reminder for appointment ${appointmentId} ` +
        `at ${appointmentInClinicTz} (clinic TZ: ${timezoneString})`,
      );

      // ✅ Paso 6: Enviar a Twilio
      const message = await this.twilioClient.messages.create({
        from: `whatsapp:${globalConfig.account_sid}`, // Twilio WhatsApp number
        to: `whatsapp:${clientPhone}`,
        
        // Template message (requiere aprobación Meta)
        // contentSid: 'HX1234567890abcdef1234567890abcdef', // Template SID cuando está aprobado
        
        // Fallback a texto mientras se aprueba template
        body: `Recordatorio: Tu cita está programada para ${appointmentInClinicTz}. ` +
              `Confirma escribiendo CONFIRMAR o cancela escribiendo CANCELAR.`,
      });

      // ✅ Paso 7: Registrar en whatsapp_message_usage
      const usage = this.messageUsageRepo.create({
        clinic_id: clinicId,
        appointment_id: appointmentId,
        provider_message_id: message.sid, // Twilio message SID
        direction: 'outbound',
        message_type: 'reminder',
        is_billable: true,
        was_overage: canSend.messages_remaining <= 0,
      });

      await this.messageUsageRepo.save(usage);

      // ✅ Paso 8: Actualizar tracking
      tracking.last_message_id = message.sid;
      tracking.reminder_sent_at = new Date();
      await this.trackingRepo.save(tracking);

      // ✅ Paso 9: Incrementar contador de la clínica
      await this.whatsappConfigService.incrementMessageUsage(clinicId, 1);

      this.logger.log(
        `✅ Reminder sent to ${clientPhone} for appointment ${appointmentId}`,
      );

      return {
        success: true,
        messageId: message.sid,
      };
    } catch (error) {
      this.logger.error(
        `Failed to send reminder for appointment ${appointmentId}:`,
        error,
      );

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 💬 Enviar mensaje de texto libre
   * (Útil para: confirmación, actualización de status, etc)
   */
  async sendTextMessage(
    clinicId: string,
    clientPhone: string,
    text: string,
    appointmentId?: string,
  ): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      const canSend = await this.whatsappConfigService.canSendMessage(clinicId);
      if (!canSend.can_send) {
        return { success: false, error: canSend.reason };
      }

      const globalConfig = await this.whatsappConfigService.getGlobalConfig();

      const message = await this.twilioClient.messages.create({
        from: `whatsapp:+1415523888`,  // Twilio WhatsApp number
        to: `whatsapp:${clientPhone}`,
        body: text,
      });

      // Registrar
      const usage = this.messageUsageRepo.create({
        clinic_id: clinicId,
        appointment_id: appointmentId,
        provider_message_id: message.sid,
        direction: 'outbound',
        message_type: 'text',
        is_billable: true,
        was_overage: canSend.messages_remaining <= 0,
      });

      await this.messageUsageRepo.save(usage);
      await this.whatsappConfigService.incrementMessageUsage(clinicId, 1);

      return { success: true, messageId: message.sid };
    } catch (error) {
      this.logger.error(`Failed to send text message to ${clientPhone}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * ✅ Enviar mensaje interactivo (con botones)
   * Estados: Confirmar, Cancelar, Reagendar
   */
  async sendInteractiveMessage(
    clinicId: string,
    clientPhone: string,
    appointmentId: string,
    options: { headerText?: string; bodyText: string; buttons: string[] },
  ): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      const canSend = await this.whatsappConfigService.canSendMessage(clinicId);
      if (!canSend.can_send) {
        return { success: false, error: canSend.reason };
      }

      const globalConfig = await this.whatsappConfigService.getGlobalConfig();

      // Construir payload interactivo para Twilio
      const interactiveMessage = {
        type: 'button',
        header: {
          type: 'text',
          text: options.headerText || 'Confirmación de Cita',
        },
        body: {
          text: options.bodyText,
        },
        footer: {
          text: '¿Qué deseas hacer?',
        },
        action: {
          buttons: options.buttons.map((btn, idx) => ({
            type: 'reply',
            id: `btn_${idx}`,
            title: btn,
          })),
        },
      };

      const message = await this.twilioClient.messages.create({
        from: `whatsapp:+1415523888`,
        to: `whatsapp:${clientPhone}`,
        contentType: 'application/json',
        content: JSON.stringify(interactiveMessage),
      });

      const usage = this.messageUsageRepo.create({
        clinic_id: clinicId,
        appointment_id: appointmentId,
        provider_message_id: message.sid,
        direction: 'outbound',
        message_type: 'interactive',
        is_billable: true,
        was_overage: canSend.messages_remaining <= 0,
      });

      await this.messageUsageRepo.save(usage);
      await this.whatsappConfigService.incrementMessageUsage(clinicId, 1);

      return { success: true, messageId: message.sid };
    } catch (error) {
      this.logger.error(`Failed to send interactive message:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 🔍 Obtener status de mensaje (¿fue entregado, leído?)
   */
  async getMessageStatus(messageSid: string): Promise<string> {
    try {
      const message = await this.twilioClient.messages(messageSid).fetch();
      return message.status; // queued, failed, sent, delivered, read
    } catch (error) {
      this.logger.error(`Failed to fetch message status for ${messageSid}:`, error);
      return 'unknown';
    }
  }

  /**
   * 📊 Estadísticas de hoy
   */
  async getTodayStatistics(clinicId: string): Promise<{
    sent: number;
    failed: number;
    overage: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const messages = await this.messageUsageRepo.find({
      where: [
        {
          clinic_id: clinicId,
          direction: 'outbound',
          sent_at: { from: today, to: tomorrow },
        },
      ],
    });

    return {
      sent: messages.length,
      failed: 0, // TODO: Rastrear fallos
      overage: messages.filter(m => m.was_overage).length,
    };
  }
}
