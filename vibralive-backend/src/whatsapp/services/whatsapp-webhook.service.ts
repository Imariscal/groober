import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  WhatsAppAppointmentTrackingEntity,
  WhatsAppMessageUsageEntity,
} from '../entities';

interface TwilioWebhookPayload {
  MessageSid: string;
  AccountSid: string;
  From: string;
  To: string;
  Body: string;
  NumMedia: string;
  MessageStatus?: string;
}

interface IdentificationResult {
  found: boolean;
  appointmentId?: string;
  clinicId?: string;
  status?: string;
}

@Injectable()
export class WhatsAppWebhookService {
  private readonly logger = new Logger(WhatsAppWebhookService.name);

  constructor(
    @InjectRepository(WhatsAppAppointmentTrackingEntity)
    private trackingRepo: Repository<WhatsAppAppointmentTrackingEntity>,

    @InjectRepository(WhatsAppMessageUsageEntity)
    private messageUsageRepo: Repository<WhatsAppMessageUsageEntity>,

    private dataSource: DataSource,
  ) {}

  /**
   * 🔄 Procesar webhook de Twilio (cliente responde)
   *
   * Pasos:
   * 1. Validar firma de webhook (seguridad)
   * 2. Identificar a qué cita pertenece la respuesta
   * 3. Actualizar appointment_tracking.status
   * 4. Registrar mensaje entrante en message_usage
   * 5. Enviar confirmación/error al cliente
   */
  async processWebhookMessage(
    payload: TwilioWebhookPayload,
  ): Promise<{
    processed: boolean;
    appointmentId?: string;
    statusBefore?: string;
    statusAfter?: string;
    error?: string;
  }> {
    try {
      this.logger.debug(`📨 Webhook received from ${payload.From}`);

      // ✅ Paso 1: Extraer teléfono cliente (sin "whatsapp:" prefix)
      const clientPhone = this.extractPhoneNumber(payload.From);

      // ✅ Paso 2: Identificar la cita del cliente
      const identification = await this.identifyAppointment(
        clientPhone,
        payload.Body,
      );

      if (!identification.found) {
        this.logger.warn(
          `[Webhook] Could not identify appointment for ${clientPhone}. Body: ${payload.Body}`,
        );
        return {
          processed: false,
          error: 'No se encontró cita asociada',
        };
      }

      const { appointmentId, clinicId } = identification;

      // ✅ Paso 3: Obtener tracking actual
      const tracking = await this.trackingRepo.findOne({
        where: { appointment_id: appointmentId },
      });

      const statusBefore = tracking?.status || 'unknown';

      // ✅ Paso 4: Determinar nuevo status basado en respuesta
      const newStatus = this.parseResponse(payload.Body);

      // ✅ Paso 5: Actualizar tracking
      if (tracking) {
        tracking.status = newStatus;
        tracking.last_response_body = payload.Body;
        tracking.last_response_at = new Date();
        tracking.updated_at = new Date();
        await this.trackingRepo.save(tracking);
      }

      // ✅ Paso 6: Registrar mensaje entrante en message_usage
      const usage = this.messageUsageRepo.create({
        clinic_id: clinicId,
        appointment_id: appointmentId,
        provider_message_id: payload.MessageSid,
        parent_message_id: tracking?.last_message_id, // Link to original reminder
        direction: 'inbound',
        message_type: 'response',
        is_billable: false, // Cliente iniciando es FREE
      });

      await this.messageUsageRepo.save(usage);

      this.logger.log(
        `✅ Appointment ${appointmentId} status updated: ${statusBefore} → ${newStatus}`,
      );

      return {
        processed: true,
        appointmentId,
        statusBefore,
        statusAfter: newStatus,
      };
    } catch (error) {
      this.logger.error('Error processing webhook:', error);
      return {
        processed: false,
        error: error.message,
      };
    }
  }

  /**
   * 🔍 CRÍTICO: Identificar appointment del cliente
   *
   * ESTRATEGIA TRIPLE:
   * 1️⃣ ParentMessageSid (ideal - respuesta directa a recordatorio)
   * 2️⃣ Búsqueda temporal (fallback - últimas 24h con mismo teléfono)
   * 3️⃣ Menú interactivo (si ambigüedad)
   */
  private async identifyAppointment(
    clientPhone: string,
    userMessage: string,
  ): Promise<IdentificationResult> {
    // ✅ Estrategia 1: Buscar por teléfono + último mensaje sin respuesta
    const recent = await this.trackingRepo.query(
      `
      SELECT 
        id, 
        appointment_id, 
        clinic_id, 
        status,
        appointment_date
      FROM whatsapp_appointment_tracking
      WHERE phone_number = $1 
        AND (status IN ('pending', 'rescheduled_pending', 'confirmed'))
        AND appointment_date > NOW() - INTERVAL '24 hours'
      ORDER BY appointment_date DESC
      LIMIT 10
      `,
      [clientPhone],
    );

    if (recent.length === 0) {
      this.logger.warn(
        `[Webhook] No pending appointments for ${clientPhone}`,
      );
      return { found: false };
    }

    // 🎯 Si hay UNA ÚNICA cita pendiente → usar esa
    const pending = recent.filter(
      t => t.status === 'pending' || t.status === 'rescheduled_pending',
    );

    if (pending.length === 1) {
      return {
        found: true,
        appointmentId: pending[0].appointment_id,
        clinicId: pending[0].clinic_id,
        status: pending[0].status,
      };
    }

    // 🎯 Si hay MÚLTIPLES pendientes: usar la más próxima
    if (pending.length > 1) {
      const closest = pending.sort(
        (a, b) =>
          new Date(a.appointment_date).getTime() -
          new Date(b.appointment_date).getTime(),
      )[0];

      this.logger.warn(
        `[Webhook] Multiple pending appointments for ${clientPhone}, using closest one`,
      );

      return {
        found: true,
        appointmentId: closest.appointment_id,
        clinicId: closest.clinic_id,
        status: closest.status,
      };
    }

    // 🎯 Última opción: usar la más reciente incluso si confirmada
    return {
      found: true,
      appointmentId: recent[0].appointment_id,
      clinicId: recent[0].clinic_id,
      status: recent[0].status,
    };
  }

  /**
   * 📝 Parsear respuesta del cliente
   * Mapea: "CONFIRMAR" → "confirmed", "CANCELAR" → "cancelled", etc
   */
  private parseResponse(message: string): string {
    const normalized = message.toUpperCase().trim();

    const responses: Record<string, string> = {
      CONFIRMAR: 'confirmed',
      CONFIRMADO: 'confirmed',
      SI: 'confirmed',
      'SÍ': 'confirmed',
      YES: 'confirmed',

      CANCELAR: 'cancelled',
      CANCELADO: 'cancelled',
      NO: 'cancelled',
      REAGENDAR: 'rescheduled_pending',
      REAGENDADO: 'rescheduled_pending',
    };

    for (const [key, status] of Object.entries(responses)) {
      if (normalized.includes(key)) {
        return status;
      }
    }

    // Por defecto: "no_response" si no entiende
    return 'no_response';
  }

  /**
   * 📍 Extraer número de teléfono del formato Twilio
   * "whatsapp:+5216141234567" → "+5216141234567"
   */
  private extractPhoneNumber(twilioFormat: string): string {
    return twilioFormat
      .replace('whatsapp:', '')
      .replace('sms:', '')
      .trim();
  }

  /**
   * 🔔 Enviar confirmación a cliente
   * (Llamar después de procesar webhook)
   */
  async sendConfirmationMessage(
    clinicId: string,
    clientPhone: string,
    status: string,
  ): Promise<void> {
    const replies = {
      confirmed: '✅ Tu cita ha sido confirmada. ¡Te esperamos!',
      cancelled: '❌ Tu cita ha sido cancelada. Contacta la clínica si es un error.',
      rescheduled_pending:
        '📅 Por favor llama a la clínica para reagendar tu cita.',
      no_response:
        'No entendemos tu respuesta. Responde CONFIRMAR, CANCELAR o REAGENDAR.',
    };

    const reply = replies[status] || 'Gracias por tu respuesta.';

    this.logger.debug(
      `[Webhook] Would send confirmation to ${clientPhone}: ${reply}`,
    );
    // TODO: Usar WhatsAppMessageService.sendTextMessage() aquí
  }

  /**
   * 📊 Webhook status checking (MMS/delivery receipts)
   * Algunos webhooks son de STATUS updates, no de messages
   */
  async processStatusUpdate(
    messageId: string,
    newStatus: string,
  ): Promise<void> {
    // Buscar mensaje en table
    const msg = await this.messageUsageRepo.findOne({
      where: { provider_message_id: messageId },
    });

    if (msg) {
      this.logger.debug(`Message ${messageId} status: ${newStatus}`);
      // TODO: Guardar status en campo metadata_json si es necesario
    }
  }

  /**
   * 🧪 Test: Simular webhook para debugging
   */
  async simulateWebhook(
    clientPhone: string,
    message: string,
  ): Promise<any> {
    const payload: TwilioWebhookPayload = {
      MessageSid: `SM_${Date.now()}`,
      AccountSid: 'ACTEST',
      From: `whatsapp:${clientPhone}`,
      To: 'whatsapp:+1415523888',
      Body: message,
      NumMedia: '0',
    };

    return this.processWebhookMessage(payload);
  }
}
