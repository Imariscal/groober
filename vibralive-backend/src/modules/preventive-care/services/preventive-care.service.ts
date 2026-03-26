import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { addDays, addWeeks, addMonths, addYears } from 'date-fns';
import {
  PetPreventiveCareEvent,
  Service,
  Pet,
  Appointment,
  AppointmentItem,
} from '@/database/entities';
import {
  CreatePetPreventiveCareEventDto,
  UpdatePetPreventiveCareEventDto,
} from '../dtos/preventive-care.dto';

@Injectable()
export class PreventiveCareService {
  constructor(
    @InjectRepository(PetPreventiveCareEvent)
    private eventRepository: Repository<PetPreventiveCareEvent>,
    @InjectRepository(Service)
    private serviceRepository: Repository<Service>,
    @InjectRepository(Pet)
    private petRepository: Repository<Pet>,
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
    @InjectRepository(AppointmentItem)
    private appointmentItemRepository: Repository<AppointmentItem>,
  ) {}

  /**
   * Create a preventive care event
   * Automatically calculates next_due_at based on service reminder cycle
   */
  async createPreventiveEvent(dto: CreatePetPreventiveCareEventDto): Promise<PetPreventiveCareEvent> {
    // Validate pet exists
    const pet = await this.petRepository.findOne({
      where: { id: dto.petId, clinicId: dto.clinicId },
    });

    if (!pet) {
      throw new NotFoundException('Pet not found');
    }

    // Validate service exists and supports reminder cycles
    const service = await this.serviceRepository.findOne({
      where: { id: dto.serviceId, clinicId: dto.clinicId },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    if (!service.appliesToReminder) {
      throw new BadRequestException('Service does not support reminder cycles');
    }

    // Calculate next due date
    const appliedAt = new Date(dto.appliedAt);
    let nextDueAt = dto.nextDueAt ? new Date(dto.nextDueAt) : undefined;

    if (!nextDueAt && service.reminderCycleType && service.reminderCycleValue) {
      nextDueAt = this.calculateNextDueDate(
        appliedAt,
        service.reminderCycleType,
        service.reminderCycleValue,
      );
    }

    // Create event
    const event = this.eventRepository.create({
      clinicId: dto.clinicId,
      clientId: dto.clientId,
      petId: dto.petId,
      appointmentId: dto.appointmentId,
      appointmentItemId: dto.appointmentItemId,
      serviceId: dto.serviceId,
      eventType: dto.eventType,
      appliedAt,
      nextDueAt,
      cycleType: dto.cycleType || service.reminderCycleType,
      cycleValue: dto.cycleValue || service.reminderCycleValue,
      reminderDaysBefore: dto.reminderDaysBefore ?? service.reminderDaysBefore,
      status: 'ACTIVE',
      notes: dto.notes,
      createdByUserId: dto.createdByUserId,
    });

    return this.eventRepository.save(event);
  }

  /**
   * Create preventive event from completed appointment
   * Called when an appointment is marked as COMPLETED
   */
  async createFromCompletedAppointment(appointmentId: string): Promise<PetPreventiveCareEvent[]> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id: appointmentId },
      relations: ['appointmentItems', 'pet', 'client'],
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    const events: PetPreventiveCareEvent[] = [];

    // Check each appointment item for services that support reminders
    for (const item of appointment.appointmentItems || []) {
      const service = await this.serviceRepository.findOne({
        where: { id: item.serviceId },
      });

      if (service && service.appliesToReminder && service.reminderCycleType && service.reminderCycleValue && item.serviceId) {
        const event = await this.createPreventiveEvent({
          clinicId: appointment.clinicId,
          clientId: appointment.clientId,
          petId: appointment.petId,
          appointmentId: appointmentId,
          appointmentItemId: item.id,
          serviceId: item.serviceId,
          eventType: this.mapServiceToEventType(service.category, service.name),
          appliedAt: appointment.scheduledAt.toISOString(),
          createdByUserId: undefined,
        });

        events.push(event);
      }
    }

    return events;
  }

  /**
   * Update preventive event (mainly status and next due date)
   */
  async updateEvent(id: string, dto: UpdatePetPreventiveCareEventDto): Promise<PetPreventiveCareEvent> {
    const event = await this.eventRepository.findOne({ where: { id } });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (dto.cycleType && dto.cycleValue) {
      event.cycleType = dto.cycleType;
      event.cycleValue = dto.cycleValue;

      // Recalculate next due date
      if (event.appliedAt) {
        event.nextDueAt = this.calculateNextDueDate(
          event.appliedAt,
          dto.cycleType,
          dto.cycleValue,
        );
      }
    }

    if (dto.nextDueAt) {
      event.nextDueAt = new Date(dto.nextDueAt);
    }

    if (dto.status) {
      event.status = dto.status;
    }

    if (dto.notes !== undefined) {
      event.notes = dto.notes;
    }

    return this.eventRepository.save(event);
  }

  /**
   * Get active preventive events for a pet
   */
  async getActiveEventsForPet(clinicId: string, petId: string): Promise<PetPreventiveCareEvent[]> {
    return this.eventRepository.find({
      where: {
        clinicId,
        petId,
        status: 'ACTIVE',
      },
      relations: ['service', 'pet', 'client'],
      order: { nextDueAt: 'ASC' },
    });
  }

  /**
   * Get upcoming reminders (next due within X days)
   */
  async getUpcomingReminders(
    clinicId: string,
    daysAhead: number = 30,
  ): Promise<PetPreventiveCareEvent[]> {
    const now = new Date();
    const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

    return this.eventRepository
      .createQueryBuilder('event')
      .where('event.clinicId = :clinicId', { clinicId })
      .andWhere('event.status = :status', { status: 'ACTIVE' })
      .andWhere('event.nextDueAt IS NOT NULL')
      .andWhere('event.nextDueAt <= :futureDate', { futureDate })
      .leftJoinAndSelect('event.service', 'service')
      .leftJoinAndSelect('event.pet', 'pet')
      .leftJoinAndSelect('event.client', 'client')
      .orderBy('event.nextDueAt', 'ASC')
      .getMany();
  }

  /**
   * Get overdue reminders (past their due date)
   */
  async getOverdueReminders(clinicId: string): Promise<PetPreventiveCareEvent[]> {
    const now = new Date();

    return this.eventRepository
      .createQueryBuilder('event')
      .where('event.clinicId = :clinicId', { clinicId })
      .andWhere('event.status = :status', { status: 'ACTIVE' })
      .andWhere('event.nextDueAt IS NOT NULL')
      .andWhere('event.nextDueAt <= :now', { now })
      .leftJoinAndSelect('event.service', 'service')
      .leftJoinAndSelect('event.pet', 'pet')
      .leftJoinAndSelect('event.client', 'client')
      .orderBy('event.nextDueAt', 'ASC')
      .getMany();
  }

  /**
   * Mark event as completed and create next cycle
   */
  async completeAndScheduleNext(eventId: string): Promise<PetPreventiveCareEvent | null> {
    const event = await this.eventRepository.findOne({ where: { id: eventId } });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Mark as completed
    event.status = 'COMPLETED';
    await this.eventRepository.save(event);

    // Create next event if cycle is still valid
    if (event.cycleType && event.cycleValue && event.nextDueAt) {
      const nextAppliedAt = event.nextDueAt;
      const nextDueAt = this.calculateNextDueDate(
        nextAppliedAt,
        event.cycleType,
        event.cycleValue,
      );

      const nextEvent = this.eventRepository.create({
        clinicId: event.clinicId,
        clientId: event.clientId,
        petId: event.petId,
        serviceId: event.serviceId,
        eventType: event.eventType,
        appliedAt: nextAppliedAt,
        nextDueAt,
        cycleType: event.cycleType,
        cycleValue: event.cycleValue,
        reminderDaysBefore: event.reminderDaysBefore,
        status: 'ACTIVE',
        notes: `Auto-generated next cycle from ${eventId}`,
      });

      return this.eventRepository.save(nextEvent);
    }

    return null;
  }

  /**
   * Calculate next due date based on cycle
   */
  private calculateNextDueDate(
    appliedAt: Date,
    cycleType: string,
    cycleValue: number,
  ): Date {
    switch (cycleType) {
      case 'DAY':
        return addDays(appliedAt, cycleValue);
      case 'WEEK':
        return addWeeks(appliedAt, cycleValue);
      case 'MONTH':
        return addMonths(appliedAt, cycleValue);
      case 'YEAR':
        return addYears(appliedAt, cycleValue);
      default:
        throw new BadRequestException(`Invalid cycle type: ${cycleType}`);
    }
  }

  /**
   * Map service category to event type
   */
  private mapServiceToEventType(
    category: string,
    serviceName: string,
  ): 'VACCINE' | 'DEWORMING_INTERNAL' | 'DEWORMING_EXTERNAL' | 'GROOMING_MAINTENANCE' | 'OTHER' {
    const name = serviceName.toLowerCase();

    if (name.includes('vaccine') || name.includes('vacuna')) return 'VACCINE';
    if (name.includes('internal') || name.includes('interna')) return 'DEWORMING_INTERNAL';
    if (name.includes('external') || name.includes('externa')) return 'DEWORMING_EXTERNAL';
    if (category === 'GROOMING') return 'GROOMING_MAINTENANCE';

    return 'OTHER';
  }
}
