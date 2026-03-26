import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PetPreventiveCareEvent } from '@/database/entities/pet-preventive-care-event.entity';
import { ReminderQueue } from '@/database/entities/reminder-queue.entity';
import { Service } from '@/database/entities/service.entity';
import { Pet } from '@/database/entities/pet.entity';
import { Appointment } from '@/database/entities/appointment.entity';
import { AppointmentItem } from '@/database/entities/appointment-item.entity';
import { Client } from '@/database/entities/client.entity';
import { Clinic } from '@/database/entities/clinic.entity';
import { PreventiveVisitsController } from './controllers/preventive-visits.controller';
import { ReminderController } from './controllers/reminder.controller';
import { PreventiveCareService } from './services/preventive-care.service';
import { ReminderService } from './services/reminder.service';
import { PreventiveCareEventRepository } from './repositories/preventive-care-event.repository';
import { ReminderQueueRepository } from './repositories/reminder-queue.repository';
import { ReminderGenerationJob } from './jobs/reminder-generation.job';
import { OverdueReminderJob } from './jobs/overdue-reminder.job';

/**
 * PreventiveCareModule
 * Manages preventive medical care (vaccinations, deworming, checkups)
 * and reminder generation/tracking
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Clinic,
      PetPreventiveCareEvent,
      ReminderQueue,
      Service,
      Pet,
      Appointment,
      AppointmentItem,
      Client,
    ]),
  ],
  controllers: [PreventiveVisitsController, ReminderController],
  providers: [
    PreventiveCareService,
    ReminderService,
    PreventiveCareEventRepository,
    ReminderQueueRepository,
    ReminderGenerationJob,
    OverdueReminderJob,
  ],
  exports: [PreventiveCareService, ReminderService],
})
export class PreventiveCareModule {}
