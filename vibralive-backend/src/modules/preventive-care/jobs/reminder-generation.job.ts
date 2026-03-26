import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReminderService } from '../services/reminder.service';
import { Clinic } from '@/database/entities';

/**
 * ReminderGenerationJob
 * Runs every hour to generate upcoming reminders for preventive care events
 */
@Injectable()
export class ReminderGenerationJob {
  private readonly logger = new Logger('ReminderGenerationJob');

  constructor(
    @InjectRepository(Clinic)
    private readonly clinicRepository: Repository<Clinic>,
    private readonly reminderService: ReminderService,
  ) {}

  /**
   * Run hourly to generate upcoming preventive care reminders for all clinics
   */
  @Cron(CronExpression.EVERY_HOUR)
  async generateUpcomingReminders() {
    this.logger.debug('Starting reminder generation job');

    try {
      // Get all clinics
      const clinics = await this.clinicRepository.find();
      let totalReminders = 0;

      for (const clinic of clinics) {
        try {
          const reminders = await this.reminderService.generateUpcomingReminders(clinic.id);
          totalReminders += reminders.length;
          this.logger.debug(
            `Generated ${reminders.length} reminders for clinic ${clinic.id}`,
          );
        } catch (clinicError) {
          this.logger.error(
            `Error generating reminders for clinic ${clinic.id}:`,
            clinicError instanceof Error ? clinicError.message : String(clinicError),
          );
        }
      }

      this.logger.log(
        `Reminder generation job completed. Total reminders created: ${totalReminders}`,
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
        `Error in reminder generation job: ${errorMessage}`,
        errorStack,
      );

      return {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Alternative implementation for explicit control
   * Can call this from an admin endpoint if needed
   */
  async generateRemindersManually() {
    return this.generateUpcomingReminders();
  }
}
