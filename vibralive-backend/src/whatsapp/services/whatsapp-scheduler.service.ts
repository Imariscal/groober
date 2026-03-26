import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import {
  WhatsAppAppointmentTrackingEntity,
  ClinicWhatsAppConfigEntity,
} from '../entities';
import { WhatsAppMessageService } from './whatsapp-message.service';
import { WhatsAppConfigService } from './whatsapp-config.service';
import { WhatsAppBillingService } from './whatsapp-billing.service';
import { TimezoneService } from '../../shared/timezone/timezone.service';

@Injectable()
export class WhatsAppSchedulerService {
  private readonly logger = new Logger(WhatsAppSchedulerService.name);

  constructor(
    @InjectRepository(WhatsAppAppointmentTrackingEntity)
    private trackingRepo: Repository<WhatsAppAppointmentTrackingEntity>,

    @InjectRepository(ClinicWhatsAppConfigEntity)
    private clinicConfigRepo: Repository<ClinicWhatsAppConfigEntity>,

    private messageService: WhatsAppMessageService,
    private configService: WhatsAppConfigService,
    private billingService: WhatsAppBillingService,
    private timezoneService: TimezoneService,
  ) {}

  /**
   * ⏰ CRON 1: Enviar recordatorios 4 horas antes de citas
   * Ejecuta: Cada hora en XX:00
   *
   * Lógica:
   * 1. Buscar citas en 4h ± 5min
   * 2. Verificar status = pending
   * 3. Verify clinic can send
   * 4. Send via Twilio
   * 5. Update appointment_tracking.reminder_sent_at
   */
  @Cron(CronExpression.EVERY_HOUR)
  async sendRemindersCron(): Promise<void> {
    const startTime = Date.now();
    this.logger.debug('⏰ [CRON] sendRemindersCron() started...');

    try {
      // Calcular window: 4 horas en el futuro (3h 55min ± 5min)
      const now = new Date();
      const fourHoursLater = new Date(now.getTime() + 4 * 60 * 60 * 1000);
      const windowStart = new Date(fourHoursLater.getTime() - 5 * 60 * 1000); // -5 min
      const windowEnd = new Date(fourHoursLater.getTime() + 5 * 60 * 1000); // +5 min

      // Buscar appointments en la ventana
      const appointments = await this.trackingRepo.find({
        where: {
          status: 'pending',
          appointment_date: MoreThanOrEqual(windowStart),
          appointment_date: LessThanOrEqual(windowEnd),
        },
      });

      if (appointments.length === 0) {
        this.logger.debug(
          `  No appointments found in 4h window [${windowStart} - ${windowEnd}]`,
        );
        return;
      }

      this.logger.log(
        `📨 Found ${appointments.length} appointments due for reminders`,
      );

      let sent = 0;
      let failed = 0;

      for (const apt of appointments) {
        try {
          // Verificar si clínica already sent reminder
          if (apt.reminder_sent_at) {
            this.logger.debug(
              `  Reminder already sent for appointment ${apt.appointment_id}`,
            );
            continue;
          }

          // Enviar recordatorio
          const result = await this.messageService.sendAppointmentReminder(
            apt.appointment_id,
            apt.clinic_id,
            apt.phone_number,
          );

          if (result.success) {
            sent++;
          } else {
            failed++;
            this.logger.warn(
              `  Failed to send reminder for ${apt.appointment_id}: ${result.error}`,
            );
          }
        } catch (error) {
          failed++;
          this.logger.error(
            `  Error sending reminder for ${apt.appointment_id}:`,
            error,
          );
        }
      }

      const elapsed = Date.now() - startTime;
      this.logger.log(
        `✅ sendRemindersCron completed: ${sent} sent, ${failed} failed in ${elapsed}ms`,
      );
    } catch (error) {
      this.logger.error('❌ sendRemindersCron() error:', error);
    }
  }

  /**
   * 🔔 CRON 2: Verificar citas sin confirmación 2h antes
   * Ejecuta: Cada 30 minutos
   *
   * Lógica:
   * 1. Buscar rescheduled_pending appointments 2h antes
   * 2. Si no hay respuesta: enviar seguimiento
   * 3. Si hay confirmación: leave as-is
   */
  @Cron('0 */30 * * * *') // Cada 30 minutos
  async checkNoResponseCron(): Promise<void> {
    const startTime = Date.now();
    this.logger.debug('🔔 [CRON] checkNoResponseCron() started...');

    try {
      const now = new Date();
      const twoHoursBefore = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      const windowStart = new Date(twoHoursBefore.getTime() - 10 * 60 * 1000);
      const windowEnd = new Date(twoHoursBefore.getTime() + 10 * 60 * 1000);

      const noResponses = await this.trackingRepo.find({
        where: {
          status: 'pending',
          appointment_date: MoreThanOrEqual(windowStart),
          appointment_date: LessThanOrEqual(windowEnd),
        },
      });

      this.logger.debug(
        `  Found ${noResponses.length} pending appointments 2h before`,
      );

      for (const apt of noResponses) {
        // Si ya se envió recordatorio pero sin respuesta: enviar reminder
        if (apt.reminder_sent_at && !apt.last_response_at) {
          try {
            const result = await this.messageService.sendTextMessage(
              apt.clinic_id,
              apt.phone_number,
              '🔔 Recordatorio: Tu cita es en 2 horas. ¿Confirmas tu asistencia?',
              apt.appointment_id,
            );

            if (result.success) {
              this.logger.debug(
                `  Second reminder sent for ${apt.appointment_id}`,
              );
            }
          } catch (error) {
            this.logger.warn(
              `  Failed to send second reminder for ${apt.appointment_id}`,
            );
          }
        }
      }

      const elapsed = Date.now() - startTime;
      this.logger.log(`✅ checkNoResponseCron completed in ${elapsed}ms`);
    } catch (error) {
      this.logger.error('❌ checkNoResponseCron() error:', error);
    }
  }

  /**
   * 🔄 CRON 3: Resetear contadores mensuales (1ro del mes 00:00 UTC)
   * Ejecuta: Todos los días a las 00:00 UTC (pero solo reseteamos en 1ro)
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async resetMonthlyMessagesCron(): Promise<void> {
    const now = new Date();
    const dayOfMonth = now.getUTCDate();

    // 🔍 Solo ejecutar en primer día del mes
    if (dayOfMonth !== 1) {
      return;
    }

    this.logger.log('🔄 [CRON] resetMonthlyMessagesCron() started (1st of month)...');

    try {
      const clinics = await this.clinicConfigRepo.find({
        where: { is_active: true },
      });

      let resetCount = 0;

      for (const clinic of clinics) {
        try {
          await this.configService.resetMonthlyUsage(clinic.clinic_id);
          resetCount++;
        } catch (error) {
          this.logger.warn(
            `  Failed to reset clinic ${clinic.clinic_id}:`,
            error,
          );
        }
      }

      this.logger.log(`✅ resetMonthlyMessagesCron completed: ${resetCount} clinics reset`);
    } catch (error) {
      this.logger.error('❌ resetMonthlyMessagesCron() error:', error);
    }
  }

  /**
   * 📊 CRON 4: Generar facturas mensuales (1ro del mes 01:00 UTC)
   * Ejecuta: Todos los días a la 01:00 UTC (pero solo en 1ro)
   * 
   * IMPORTANTE: Ejecutar DESPUÉS de resetMonthlyMessagesCron (1 hora después)
   */
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async generateMonthlyBillingCron(): Promise<void> {
    const now = new Date();
    const dayOfMonth = now.getUTCDate();

    // 🔍 Solo ejecutar en primer día del mes
    if (dayOfMonth !== 1) {
      return;
    }

    this.logger.log(
      '📊 [CRON] generateMonthlyBillingCron() started (1st of month 01:00)...',
    );

    try {
      // Calcular previousMonth
      const date = new Date();
      date.setMonth(date.getMonth() - 1);

      const year = date.getUTCFullYear();
      const month = date.getUTCMonth() + 1;

      // Generar facturas
      const result = await this.billingService.calculateMonthlyUsage(year, month);

      this.logger.log(
        `✅ generateMonthlyBillingCron completed: ` +
        `${result.clinicsProcessed} clinics, $${result.totalCost} total revenue`,
      );
    } catch (error) {
      this.logger.error('❌ generateMonthlyBillingCron() error:', error);
    }
  }

  /**
   * 🧹 CRON BONUS: Limpiar citas expiradas (> 24h sin respuesta)
   * Ejecuta: Cada 6 horas
   */
  @Cron('0 */6 * * * *') // Cada 6 horas
  async cleanupExpiredAppointmentsCron(): Promise<void> {
    this.logger.debug('🧹 [CRON] cleanupExpiredAppointmentsCron() started...');

    try {
      const thirtyHoursAgo = new Date(Date.now() - 30 * 60 * 60 * 1000);

      const expired = await this.trackingRepo.find({
        where: {
          status: 'pending',
          appointment_date: LessThanOrEqual(thirtyHoursAgo),
        },
      });

      if (expired.length === 0) {
        return;
      }

      // Marcar como expired
      for (const apt of expired) {
        apt.status = 'expired';
        apt.updated_at = new Date();
        await this.trackingRepo.save(apt);
      }

      this.logger.log(`✅ cleanupExpiredAppointmentsCron: ${expired.length} appointments marked as expired`);
    } catch (error) {
      this.logger.error('❌ cleanupExpiredAppointmentsCron() error:', error);
    }
  }

  /**
   * 📋 GET: Próximas 10 citas a enviar reminders
   * (Para debugging/admin view)
   */
  async getUpcomingReminders(limit: number = 10) {
    const now = new Date();
    const maxTime = new Date(now.getTime() + 5 * 60 * 60 * 1000); // 5 horas

    return this.trackingRepo.find({
      where: {
        status: 'pending',
        appointment_date: MoreThanOrEqual(now),
        appointment_date: LessThanOrEqual(maxTime),
      },
      order: { appointment_date: 'ASC' },
      take: limit,
    });
  }
}
