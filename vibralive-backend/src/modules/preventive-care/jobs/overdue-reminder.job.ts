import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReminderService } from '../services/reminder.service';
import { Clinic } from '@/database/entities';

/**
 * OverdueReminderJob
 * Runs daily at 9 AM to generate overdue reminders for overdue preventive care events
 */
@Injectable()
export class OverdueReminderJob {
  private readonly logger = new Logger('OverdueReminderJob');

  constructor(
    @InjectRepository(Clinic)
    private readonly clinicRepository: Repository<Clinic>,
    private readonly reminderService: ReminderService,
  ) {}

  /**
   * Run daily at 9 AM to generate overdue preventive care reminders for all clinics
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async generateOverdueReminders() {
    this.logger.debug('Starting overdue reminder generation job');

    try {
      // Get all clinics
      const clinics = await this.clinicRepository.find();
      let totalReminders = 0;

      for (const clinic of clinics) {
        try {
          const reminders = await this.reminderService.generateOverdueReminders(clinic.id);
          totalReminders += reminders.length;
          this.logger.debug(
            `Generated ${reminders.length} overdue reminders for clinic ${clinic.id}`,
          );
        } catch (clinicError) {
          this.logger.error(
            `Error generating overdue reminders for clinic ${clinic.id}:`,
            clinicError instanceof Error ? clinicError.message : String(clinicError),
          );
        }
      }

      this.logger.log(
        `Overdue reminder generation job completed. Total reminders created: ${totalReminders}`,
      );

      return {
        success: true,
        totalReminders,
        clinicsProcessed: clinics.length,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : '';
      this.logger.error(
        `Error in overdue reminder generation job: ${errorMessage}`,
        errorStack,
      );

      return {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
