import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { ReminderQueue, PetPreventiveCareEvent, Client, Pet } from '@/database/entities';
import {
  CreateReminderQueueDto,
  UpdateReminderQueueStatusDto,
} from '../dtos/reminder-queue.dto';

@Injectable()
export class ReminderService {
  constructor(
    @InjectRepository(ReminderQueue)
    private reminderRepository: Repository<ReminderQueue>,
    @InjectRepository(PetPreventiveCareEvent)
    private eventRepository: Repository<PetPreventiveCareEvent>,
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
    @InjectRepository(Pet)
    private petRepository: Repository<Pet>,
  ) {}

  /**
   * Create a reminder queue entry
   */
  async createReminder(dto: CreateReminderQueueDto): Promise<ReminderQueue> {
    // Validate client and pet exist
    const client = await this.clientRepository.findOne({
      where: { id: dto.clientId, clinicId: dto.clinicId },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    const pet = await this.petRepository.findOne({
      where: { id: dto.petId, clinicId: dto.clinicId },
    });

    if (!pet) {
      throw new NotFoundException('Pet not found');
    }

    // Create reminder
    const reminder = this.reminderRepository.create({
      clinicId: dto.clinicId,
      clientId: dto.clientId,
      petId: dto.petId,
      preventiveEventId: dto.preventiveEventId,
      appointmentId: dto.appointmentId,
      channel: dto.channel,
      reminderType: dto.reminderType,
      scheduledFor: new Date(dto.scheduledFor),
      templateId: dto.templateId,
      payloadJson: dto.payloadJson,
      status: 'PENDING',
    });

    return this.reminderRepository.save(reminder);
  }

  /**
   * Auto-generate reminders for upcoming preventive events
   * Called by scheduled job/cron
   */
  async generateUpcomingReminders(
    clinicId: string,
    channels: ('WHATSAPP' | 'EMAIL')[] = ['WHATSAPP', 'EMAIL'],
  ): Promise<ReminderQueue[]> {
    const now = new Date();
    const events = await this.eventRepository.find({
      where: {
        clinicId,
        status: 'ACTIVE',
      },
      relations: ['client', 'pet', 'service'],
    });

    const createdReminders: ReminderQueue[] = [];

    for (const event of events) {
      if (!event.nextDueAt) continue;

      // Check if reminder should be sent
      const reminderDate = new Date(event.nextDueAt);
      reminderDate.setDate(reminderDate.getDate() - event.reminderDaysBefore);

      // Only create if reminder date has passed but not sent yet
      if (reminderDate <= now && reminderDate > new Date(now.getTime() - 24 * 60 * 60 * 1000)) {
        // Check if reminder already exists
        const existingReminder = await this.reminderRepository.findOne({
          where: {
            preventiveEventId: event.id,
            reminderType: 'UPCOMING_PREVENTIVE_EVENT',
            status: 'PENDING',
          },
        });

        if (!existingReminder) {
          // Create reminder for each channel
          for (const channel of channels) {
            const reminder = await this.createReminder({
              clinicId,
              clientId: event.clientId,
              petId: event.petId,
              preventiveEventId: event.id,
              channel: channel as 'WHATSAPP' | 'EMAIL',
              reminderType: 'UPCOMING_PREVENTIVE_EVENT',
              scheduledFor: reminderDate.toISOString(),
              payloadJson: {
                eventId: event.id,
                petName: event.pet?.name,
                serviceName: event.service?.name,
                nextDueAt: event.nextDueAt,
                eventType: event.eventType,
              },
            });

            createdReminders.push(reminder);
          }
        }
      }
    }

    return createdReminders;
  }

  /**
   * Generate reminders for overdue events
   */
  async generateOverdueReminders(
    clinicId: string,
    channels: ('WHATSAPP' | 'EMAIL')[] = ['WHATSAPP', 'EMAIL'],
  ): Promise<ReminderQueue[]> {
    const now = new Date();
    const events = await this.eventRepository.find({
      where: {
        clinicId,
        status: 'ACTIVE',
      },
      relations: ['client', 'pet', 'service'],
    });

    const createdReminders: ReminderQueue[] = [];

    for (const event of events) {
      if (!event.nextDueAt || event.nextDueAt > now) continue;

      // Check if overdue reminder already exists
      const existingReminder = await this.reminderRepository.findOne({
        where: {
          preventiveEventId: event.id,
          reminderType: 'OVERDUE_PREVENTIVE_EVENT',
          status: 'PENDING',
        },
      });

      if (!existingReminder) {
        // Create overdue reminder for each channel
        for (const channel of channels) {
          const reminder = await this.createReminder({
            clinicId,
            clientId: event.clientId,
            petId: event.petId,
            preventiveEventId: event.id,
            channel: channel as 'WHATSAPP' | 'EMAIL',
            reminderType: 'OVERDUE_PREVENTIVE_EVENT',
            scheduledFor: now.toISOString(),
            payloadJson: {
              eventId: event.id,
              petName: event.pet?.name,
              serviceName: event.service?.name,
              daysOverdue: Math.floor((now.getTime() - event.nextDueAt.getTime()) / (1000 * 60 * 60 * 24)),
              eventType: event.eventType,
            },
          });

          createdReminders.push(reminder);
        }
      }
    }

    return createdReminders;
  }

  /**
   * Get pending reminders to be sent
   */
  async getPendingReminders(
    clinicId: string,
    limit: number = 100,
  ): Promise<ReminderQueue[]> {
    return this.reminderRepository.find({
      where: {
        clinicId,
        status: 'PENDING',
        scheduledFor: LessThanOrEqual(new Date()),
      },
      relations: ['client', 'pet', 'preventiveEvent'],
      order: { scheduledFor: 'ASC' },
      take: limit,
    });
  }

  /**
   * Update reminder status (when sent)
   */
  async updateReminderStatus(id: string, dto: UpdateReminderQueueStatusDto): Promise<ReminderQueue> {
    const reminder = await this.reminderRepository.findOne({ where: { id } });

    if (!reminder) {
      throw new NotFoundException('Reminder not found');
    }

    reminder.status = dto.status;

    if (dto.sentAt) {
      reminder.sentAt = new Date(dto.sentAt);
    }

    if (dto.errorMessage) {
      reminder.errorMessage = dto.errorMessage;
    }

    return this.reminderRepository.save(reminder);
  }

  /**
   * Cancel all pending reminders for an event
   */
  async cancelRemindersForEvent(eventId: string): Promise<number> {
    const result = await this.reminderRepository.update(
      {
        preventiveEventId: eventId,
        status: 'PENDING',
      },
      {
        status: 'CANCELLED',
      }
    );

    return result.affected || 0;
  }

  /**
   * Get reminder history for an event
   */
  async getReminderHistory(eventId: string): Promise<ReminderQueue[]> {
    return this.reminderRepository.find({
      where: { preventiveEventId: eventId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Retry failed reminders
   */
  async retryFailedReminders(clinicId: string, hoursBack: number = 24): Promise<ReminderQueue[]> {
    const hoursAgoDate = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

    const failedReminders = await this.reminderRepository.find({
      where: {
        clinicId,
        status: 'FAILED',
        updatedAt: LessThanOrEqual(hoursAgoDate),
      },
      take: 50,
    });

    // Reset them to PENDING for retry
    for (const reminder of failedReminders) {
      reminder.status = 'PENDING';
      reminder.errorMessage = undefined;
    }

    return this.reminderRepository.save(failedReminders);
  }
}
