import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AppointmentsRepository } from '../repositories/appointments.repository';
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';
import { startOfDay } from 'date-fns';

// 🎯 Reference timezone for cleanup job - must match cron timeZone setting
const CLEANUP_JOB_TIMEZONE = 'America/Mexico_City';

/**
 * Service responsible for cleaning up unattended appointments
 * 
 * Job nocturno que marca citas SCHEDULED/CONFIRMED de días anteriores
 * como UNATTENDED para revisión del staff.
 * 
 * Flujo:
 * 1. Job corre a las 2:00 AM todos los días
 * 2. Busca citas SCHEDULED/CONFIRMED con fecha anterior a hoy
 * 3. Las marca como UNATTENDED
 * 4. Staff revisa y decide: Completar, Cancelar, No Show, o Reagendar
 */
@Injectable()
export class AppointmentCleanupService {
  private readonly logger = new Logger(AppointmentCleanupService.name);

  constructor(
    private readonly appointmentsRepo: AppointmentsRepository,
  ) {}

  /**
   * Job nocturno - Corre a las 2:00 AM todos los días
   * Marca citas no atendidas como UNATTENDED
   */
  @Cron('0 2 * * *', {
    name: 'mark-unattended-appointments',
    timeZone: 'America/Mexico_City',
  })
  async handleUnattendedAppointments(): Promise<void> {
    this.logger.log('🔄 Starting unattended appointments cleanup job...');
    
    try {
      const result = await this.markUnattendedAppointments();
      
      this.logger.log(
        `✅ Cleanup completed: ${result.markedCount} appointments marked as UNATTENDED`
      );
      
      if (result.byClinic.length > 0) {
        this.logger.log('📊 Breakdown by clinic:');
        result.byClinic.forEach(({ clinicId, count }) => {
          this.logger.log(`   - Clinic ${clinicId}: ${count} appointments`);
        });
      }
    } catch (error) {
      this.logger.error('❌ Error in cleanup job:', error);
    }
  }

  /**
   * Método principal para marcar citas no atendidas
   * Puede ser llamado manualmente para testing o desde el cron
   */
  async markUnattendedAppointments(): Promise<{
    markedCount: number;
    byClinic: { clinicId: string; count: number }[];
  }> {
    // 🎯 FIX: Fecha de corte usando timezone de referencia (Mexico City)
    // Esto asegura que "hoy" sea consistente con el cron job
    const nowUtc = new Date();
    const nowInMexico = utcToZonedTime(nowUtc, CLEANUP_JOB_TIMEZONE);
    const startOfTodayMexico = startOfDay(nowInMexico);
    const today = zonedTimeToUtc(startOfTodayMexico, CLEANUP_JOB_TIMEZONE);
    
    this.logger.debug(`Looking for appointments before ${today.toISOString()} (start of today in ${CLEANUP_JOB_TIMEZONE})`);
    
    // Buscar citas no atendidas
    const unattendedAppointments = await this.appointmentsRepo.findUnattendedAppointments(today);
    
    if (unattendedAppointments.length === 0) {
      this.logger.debug('No unattended appointments found');
      return { markedCount: 0, byClinic: [] };
    }
    
    this.logger.debug(`Found ${unattendedAppointments.length} unattended appointments`);
    
    // Agrupar por clínica para el reporte
    const byClinic = new Map<string, number>();
    unattendedAppointments.forEach(apt => {
      const count = byClinic.get(apt.clinicId) || 0;
      byClinic.set(apt.clinicId, count + 1);
    });
    
    // Marcar como UNATTENDED
    const appointmentIds = unattendedAppointments.map(a => a.id);
    const markedCount = await this.appointmentsRepo.markAsUnattended(appointmentIds);
    
    return {
      markedCount,
      byClinic: Array.from(byClinic.entries()).map(([clinicId, count]) => ({
        clinicId,
        count,
      })),
    };
  }

  /**
   * Obtener estadísticas de citas no atendidas por clínica
   */
  async getUnattendedStats(): Promise<{ clinicId: string; count: number }[]> {
    return this.appointmentsRepo.getUnattendedCountByClinic();
  }
}
