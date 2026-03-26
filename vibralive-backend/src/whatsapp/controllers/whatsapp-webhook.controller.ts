import {
  Controller,
  Post,
  Body,
  Logger,
  BadRequestException,
  HttpCode,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { WhatsAppWebhookService } from '../services/whatsapp-webhook.service';
import { WhatsAppConfigService } from '../services/whatsapp-config.service';
import * as crypto from 'crypto';

/**
 * 🎯 Webhook Endpoint para Twilio WhatsApp
 * 
 * URL: POST /api/webhooks/twilio/messages
 * 
 * Recibe callbacks de:
 * - Mensajes entrantes del cliente
 * - Delivery status changes
 * - Error reports
 */
@Controller('webhooks/twilio/messages')
export class WhatsAppWebhookController {
  private readonly logger = new Logger(WhatsAppWebhookController.name);

  constructor(
    private webhookService: WhatsAppWebhookService,
    private configService: WhatsAppConfigService,
  ) {}

  /**
   * 🔔 POST /api/webhooks/twilio/messages
   * 
   * Body (form-encoded from Twilio):
   * {
   *   MessageSid: "SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
   *   AccountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
   *   From: "whatsapp:+5216141234567"
   *   To: "whatsapp:+1415523888"
   *   Body: "CONFIRMAR" | "CANCELAR" | etc
   *   NumMedia: "0"
   *   MessageStatus?: "sent" | "delivered" | "failed" | etc
   *   EventType?: "message_received" | "message_delivered" | etc
   * }
   * 
   * Twilio Include en Header X-Twilio-Signature para validar
   */
  @Post()
  @HttpCode(200)
  async handleWebhook(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const payload = req.body;

      this.logger.debug(`📨 Webhook received from Twilio`);
      this.logger.debug(`  From: ${payload.From}`);
      this.logger.debug(`  Body: ${payload.Body}`);

      // ✅ Paso 1: Validar firma (seguridad)
      const isValid = this.validateTwilioSignature(req);
      if (!isValid) {
        this.logger.warn('❌ Webhook validation FAILED - Invalid signature');
        res.status(400).send('Invalid signature');
        return;
      }

      // ✅ Paso 2: Detectar tipo de evento
      const eventType = this.getEventType(payload);
      this.logger.debug(`  Event Type: ${eventType}`);

      switch (eventType) {
        case 'message_received':
          await this.handleMessageReceived(payload, res);
          break;

        case 'message_delivered':
        case 'message_sent':
          await this.handleMessageStatus(payload, res);
          break;

        case 'message_failed':
          await this.handleMessageFailed(payload, res);
          break;

        default:
          this.logger.warn(`Unknown event type: ${eventType}`);
          res.status(200).send('OK'); // Aceptar igualmente
      }
    } catch (error) {
      this.logger.error('Webhook processing error:', error);
      res.status(500).send('Internal Server Error');
    }
  }

  /**
   * 📨 Procesar mensaje entrante del cliente
   */
  private async handleMessageReceived(
    payload: any,
    res: Response,
  ): Promise<void> {
    try {
      const result = await this.webhookService.processWebhookMessage(payload);

      if (result.processed) {
        this.logger.log(
          `✅ Message processed for appointment ${result.appointmentId}`,
        );
      } else {
        this.logger.warn(`⚠️ Message not processed: ${result.error}`);
      }

      // Responder a Twilio (siempre OK)
      const response = `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`;
      res.type('application/xml').send(response);
    } catch (error) {
      this.logger.error('Error handling incoming message:', error);
      res.status(500).send('Error');
    }
  }

  /**
   * 📊 Procesar cambios de status (entregado, leído)
   */
  private async handleMessageStatus(
    payload: any,
    res: Response,
  ): Promise<void> {
    try {
      const messageSid = payload.MessageSid;
      const status = payload.MessageStatus;

      this.logger.debug(
        `📊 Message Status Update: ${messageSid} → ${status}`,
      );

      // Procesar status
      await this.webhookService.processStatusUpdate(messageSid, status);

      const response = `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`;
      res.type('application/xml').send(response);
    } catch (error) {
      this.logger.error('Error handling message status:', error);
      res.status(500).send('Error');
    }
  }

  /**
   * ❌ Procesar fallos de mensaje
   */
  private async handleMessageFailed(
    payload: any,
    res: Response,
  ): Promise<void> {
    try {
      const messageSid = payload.MessageSid;
      const errorCode = payload.ErrorCode;

      this.logger.error(
        `❌ Message Failed: ${messageSid} - Error ${errorCode}`,
      );

      // TODO: Registrar en tabla de errores
      // TODO: Notificar a clínica

      const response = `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`;
      res.type('application/xml').send(response);
    } catch (error) {
      this.logger.error('Error handling message failure:', error);
      res.status(500).send('Error');
    }
  }

  /**
   * 🔐 Validar firma de Twilio
   * 
   * Twilio envía X-Twilio-Signature header con HMAC-SHA1
   * Fórmula: hash = HMAC-SHA1(auth_token, url + request_body_sorted)
   */
  private validateTwilioSignature(req: Request): boolean {
    try {
      const twilioSignature = req.headers['x-twilio-signature'];
      if (!twilioSignature) {
        return false;
      }

      // En desarrollo, podemos permitir validación opcional
      const skipValidation = process.env.WHATSAPP_SKIP_WEBHOOK_VALIDATION === 'true';
      if (skipValidation) {
        this.logger.warn('⚠️ Webhook validation SKIPPED (development mode)');
        return true;
      }

      // Obtener auth token
      // TODO: Usar WhatsAppConfigService.getGlobalConfig() para token
      const authToken = process.env.TWILIO_AUTH_TOKEN || '';

      if (!authToken) {
        this.logger.error('TWILIO_AUTH_TOKEN not configured');
        return false;
      }

      // Reconstruir URL
      const url = `${
        req.protocol
      }://${req.headers.host}${req.originalUrl || req.url}`;

      // Ordenar body params
      const params = this.sortParams(req.body);

      // Construir mensaje a firmar
      const message = url + params;

      // HMAC-SHA1
      const hash = crypto
        .createHmac('sha1', authToken)
        .update(message)
        .digest('Base64');

      // Comparar
      const isValid = hash === twilioSignature;

      if (!isValid) {
        this.logger.warn(
          `❌ Signature mismatch. Expected: ${hash}, Got: ${twilioSignature}`,
        );
      }

      return isValid;
    } catch (error) {
      this.logger.error('Error validating Twilio signature:', error);
      return false;
    }
  }

  /**
   * 🔤 Ordenar parámetros del body para validación
   */
  private sortParams(params: Record<string, any>): string {
    return Object.keys(params)
      .sort()
      .map(key => key + params[key])
      .join('');
  }

  /**
   * 🏷️ Detectar tipo de evento del payload
   */
  private getEventType(payload: any): string {
    // Si tiene Body = es mensaje entrante
    if (payload.Body) {
      return 'message_received';
    }

    // Si tiene MessageStatus
    if (payload.MessageStatus === 'delivered') {
      return 'message_delivered';
    }

    if (payload.MessageStatus === 'sent') {
      return 'message_sent';
    }

    if (payload.MessageStatus === 'failed') {
      return 'message_failed';
    }

    // Si tiene EventType
    if (payload.EventType) {
      return payload.EventType;
    }

    return 'unknown';
  }

  /**
   * 🧪 GET /api/webhooks/twilio/messages/test
   * Para demostración/testing (solo en desarrollo)
   */
  @Post('test')
  async testWebhook(
    @Body() payload: any,
    @Res() res: Response,
  ): Promise<void> {
    this.logger.log('🧪 TEST WEBHOOK RECEIVED');
    this.logger.log(JSON.stringify(payload, null, 2));

    // Simular procesamiento
    const result = await this.webhookService.simulateWebhook(
      payload.phone || '+1234567890',
      payload.message || 'CONFIRMAR',
    );

    res.json(result);
  }
}
