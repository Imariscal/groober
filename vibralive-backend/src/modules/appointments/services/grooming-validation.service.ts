import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  Appointment,
  ClinicConfiguration,
  ClinicCalendarException,
} from '@/database/entities';
import { addMinutes, subMinutes, format, parseISO, getDay, startOfDay, endOfDay, isBefore, isAfter } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';
import { TimezoneService } from '@/shared/timezone/timezone.service';

export interface GroomingValidationContext {
  clinicId: string;
  locationType: 'CLINIC' | 'HOME';
  scheduledAt: Date;
  durationMinutes: number;
  petId: string;
  clientId: string;
  addressId?: string;
  appointmentId?: string; // for updates
  assignedStaffUserId?: string; // Stylist assigned to this appointment
}

export interface CapacityCheckResult {
  valid: boolean;
  message?: string;
  overlappingCount?: number;
  capacity?: number;
}

@Injectable()
export class GroomingValidationService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
    @InjectRepository(ClinicConfiguration)
    private clinicConfigRepository: Repository<ClinicConfiguration>,
    @InjectRepository(ClinicCalendarException)
    private calendarExceptionRepository: Repository<ClinicCalendarException>,
    private dataSource: DataSource,
    private timezoneService: TimezoneService,
  ) {}

  /**
   * Validate if a grooming appointment can be scheduled
   */
  async validateGroomingAppointment(
    context: GroomingValidationContext,
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // 1. Check if time is in future (with 5-minute buffer for processing)
    const bufferMs = 5 * 60 * 1000; // 5-minute buffer
    if (isBefore(context.scheduledAt, addMinutes(new Date(), 5))) {
      errors.push('La cita debe ser al menos 5 minutos en el futuro');
    }

    // 2. Get clinic configuration
    const config = await this.clinicConfigRepository.findOne({
      where: { clinicId: context.clinicId },
    });

    if (!config) {
      errors.push('Configuración de clínica no encontrada');
      return { valid: false, errors };
    }

    // 3. Validate business hours and exceptions
    const timeValidation = await this.validateBusinessHours(
      context.scheduledAt,
      context.durationMinutes,
      config,
      context.clinicId,
    );
    if (!timeValidation.valid) {
      errors.push(timeValidation.message!);
    }

    // 4. Validate same pet same day (for both HOME and CLINIC if flag enabled)
    if (config.preventSamePetSameDay) {
      const sameDayViolation = await this.checkSamePetSameDay(
        context.clinicId,
        context.petId,
        context.scheduledAt,
        config.timezone,
        context.locationType,
        context.appointmentId, // exclude self if update
      );
      if (!sameDayViolation.valid) {
        errors.push(sameDayViolation.message!);
      }
    }

    // 5. Validate location-specific rules
    if (context.locationType === 'HOME') {
      if (!context.addressId) {
        errors.push('Se requiere una dirección (addressId) para citas en domicilio');
      }

      const homeCapacity = await this.checkHomeCapacity(
        context.clinicId,
        context.scheduledAt,
        context.durationMinutes,
        config.homeTravelBufferMinutes,
        context.appointmentId,
      );
      if (!homeCapacity.valid) {
        errors.push(homeCapacity.message!);
      }
    } else {
      // CLINIC validations
      // 1. Check max simultaneous appointments
      const clinicCapacity = await this.checkClinicCapacity(
        context.clinicId,
        context.scheduledAt,
        context.durationMinutes,
        context.appointmentId,
      );
      if (!clinicCapacity.valid) {
        errors.push(clinicCapacity.message!);
      }

      // 2. Check max total appointments per day
      const dailyCapacity = await this.checkClinicDailyCapacity(
        context.clinicId,
        context.scheduledAt,
        context.appointmentId,
      );
      if (!dailyCapacity.valid) {
        errors.push(dailyCapacity.message!);
      }
    }

    // 6. Validate stylist availability if assigned
    if (context.assignedStaffUserId) {
      const stylistAvailability = await this.checkStylistAvailability(
        context.assignedStaffUserId,
        context.scheduledAt,
        context.durationMinutes,
        context.appointmentId,
      );
      if (!stylistAvailability.valid) {
        errors.push(stylistAvailability.message!);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate that scheduled time falls within business hours or special hours
   */
  private async validateBusinessHours(
    scheduledAt: Date,
    durationMinutes: number,
    config: ClinicConfiguration,
    clinicId: string,
  ): Promise<{ valid: boolean; message?: string }> {
    const clinicTimezone = config.timezone;
    const dateStr = this.timezoneService.toClinicDateKey(clinicTimezone, scheduledAt);

    // Check for calendar exception
    const exception = await this.calendarExceptionRepository.findOne({
      where: { clinicId, date: dateStr },
    });

    if (exception?.type === 'CLOSED') {
      return { valid: false, message: `Clínica cerrada en ${dateStr}` };
    }

    const zonedDate = utcToZonedTime(scheduledAt, clinicTimezone);
    const scheduledTime = format(zonedDate, 'HH:mm');

    // If special hours, validate against those
    if (exception?.type === 'SPECIAL_HOURS' && exception.startTime && exception.endTime) {
      // Allow appointment to START up to 15 minutes before closing
      const lastAllowedStart = subMinutes(parseISO(`2000-01-01T${exception.endTime}`), 15);
      const lastAllowedStartStr = format(lastAllowedStart, 'HH:mm');

      if (scheduledTime >= exception.startTime && scheduledTime <= lastAllowedStartStr) {
        return { valid: true };
      }
      return {
        valid: false,
        message: `La cita no cabe dentro de los horarios especiales ${exception.startTime}–${exception.endTime} (última cita permitida a las ${lastAllowedStartStr})`,
      };
    }

    // Validate against regular business hours
    if (!config.businessHours?.week) {
      return { valid: false, message: 'Horarios de negocio no configurados' };
    }

    const dayIndex = getDay(zonedDate); // 0 = Sunday, 6 = Saturday
    const dayMap = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
    const dayKey = dayMap[dayIndex];
    const dayHours = config.businessHours.week[dayKey];

    if (!dayHours || dayHours.length === 0) {
      return { valid: false, message: `Clínica cerrada en ${dayKey}` };
    }

    // Check if time falls within any business hour range
    let fitsAnyRange = false;
    for (const hours of dayHours) {
      // Allow appointment to START up to 15 minutes before closing
      const lastAllowedStart = subMinutes(parseISO(`2000-01-01T${hours.end}`), 15);
      const lastAllowedStartStr = format(lastAllowedStart, 'HH:mm');

      if (scheduledTime >= hours.start && scheduledTime <= lastAllowedStartStr) {
        fitsAnyRange = true;
        break;
      }
    }

    if (!fitsAnyRange) {
      const ranges = dayHours.map((h) => {
        const lastAllowed = subMinutes(parseISO(`2000-01-01T${h.end}`), 15);
        const lastAllowedStr = format(lastAllowed, 'HH:mm');
        return `${h.start}–${lastAllowedStr}`;
      }).join(', ');
      return {
        valid: false,
        message: `La cita no cabe dentro de los horarios de negocio: ${ranges}`,
      };
    }

    return { valid: true };
  }

  /**
   * Check if pet already has HOME appointment same day (HOME only - CLINIC allows multiple same day)
   * Used to warn groomer of potential scheduling conflicts at same location
   */
  private async checkSamePetSameDay(
    clinicId: string,
    petId: string,
    scheduledAt: Date,
    timezone: string,
    locationType: 'HOME' | 'CLINIC',
    excludeAppointmentId?: string,
  ): Promise<{ valid: boolean; message?: string }> {
    const query = this.appointmentRepository
      .createQueryBuilder('apt')
      .where('apt.clinicId = :clinicId', { clinicId })
      .andWhere('apt.petId = :petId', { petId })
      // NO filtrar por locationType - la mascota no puede tener NINGUNA cita el mismo día
      .andWhere('apt.status IN (:...statuses)', {
        statuses: ['SCHEDULED', 'CONFIRMED'],
      });

    if (excludeAppointmentId) {
      query.andWhere('apt.id != :excludeId', { excludeId: excludeAppointmentId });
    }

    const appointments = await query.getMany();

    // Filter by same day in clinic timezone
    for (const apt of appointments) {
      if (this.timezoneService.isSameDayInClinicTz(timezone, scheduledAt, apt.scheduledAt)) {
        const locationLabel = locationType === 'HOME' ? 'home' : 'clinic';
        const existingLocation = apt.locationType === 'HOME' ? 'domicilio' : 'clínica';
        return {
          valid: false,
          message: `Pet already has an appointment (${existingLocation}) scheduled for this day`,
        };
      }
    }

    return { valid: true };
  }

  /**
   * Check HOME location capacity with buffer
   */
  private async checkHomeCapacity(
    clinicId: string,
    scheduledAt: Date,
    durationMinutes: number,
    bufferMinutes: number,
    excludeAppointmentId?: string,
  ): Promise<CapacityCheckResult> {
    const config = await this.clinicConfigRepository.findOne({
      where: { clinicId },
    });

    if (!config) {
      return { valid: false, message: 'Configuración de clínica no encontrada' };
    }

    const capacity = config.homeGroomingCapacity || 1;
    const effectiveStart = addMinutes(scheduledAt, -bufferMinutes);
    const effectiveEnd = addMinutes(scheduledAt, durationMinutes + bufferMinutes);

    const query = this.appointmentRepository
      .createQueryBuilder('apt')
      .where('apt.clinicId = :clinicId', { clinicId })
      .andWhere('apt.locationType = :locationType', { locationType: 'HOME' })
      .andWhere('apt.status IN (:...statuses)', {
        statuses: ['SCHEDULED', 'CONFIRMED'],
      })
      .andWhere('apt.scheduledAt < :effectiveEnd', { effectiveEnd })
      .andWhere('apt.scheduledAt + (apt.durationMinutes * INTERVAL \'1 minute\') > :effectiveStart', {
        effectiveStart,
      });

    if (excludeAppointmentId) {
      query.andWhere('apt.id != :excludeId', { excludeId: excludeAppointmentId });
    }

    const overlappingCount = await query.getCount();

    if (overlappingCount >= capacity) {
      return {
        valid: false,
        message: `Capacidad de domicilio alcanzada (${capacity} cita(s))`,
        overlappingCount,
        capacity,
      };
    }

    return { valid: true };
  }

  /**
   * Check CLINIC location capacity
   */
  private async checkClinicCapacity(
    clinicId: string,
    scheduledAt: Date,
    durationMinutes: number,
    excludeAppointmentId?: string,
  ): Promise<CapacityCheckResult> {
    const config = await this.clinicConfigRepository.findOne({
      where: { clinicId },
    });

    if (!config) {
      return { valid: false, message: 'Configuración de clínica no encontrada' };
    }

    const maxOverlappingAppointments = config.maxClinicOverlappingAppointments || 5;
    const endTime = addMinutes(scheduledAt, durationMinutes);

    const query = this.appointmentRepository
      .createQueryBuilder('apt')
      .where('apt.clinicId = :clinicId', { clinicId })
      .andWhere('apt.locationType = :locationType', { locationType: 'CLINIC' })
      .andWhere('apt.status IN (:...statuses)', {
        statuses: ['SCHEDULED', 'CONFIRMED'],
      })
      .andWhere('apt.scheduledAt < :endTime', { endTime })
      .andWhere('apt.scheduledAt + (apt.durationMinutes * INTERVAL \'1 minute\') > :scheduledAt', {
        scheduledAt,
      });

    if (excludeAppointmentId) {
      query.andWhere('apt.id != :excludeId', { excludeId: excludeAppointmentId });
    }

    const overlappingCount = await query.getCount();

    if (overlappingCount >= maxOverlappingAppointments) {
      return {
        valid: false,
        message: `Capacidad de clínica alcanzada (máximo ${maxOverlappingAppointments} cita(s) simultáneas)`,
        overlappingCount,
        capacity: maxOverlappingAppointments,
      };
    }

    return { valid: true };
  }

  /**
   * Check CLINIC daily capacity - max total appointments per day (regardless of time overlap)
   */
  private async checkClinicDailyCapacity(
    clinicId: string,
    scheduledAt: Date,
    excludeAppointmentId?: string,
  ): Promise<CapacityCheckResult> {
    const config = await this.clinicConfigRepository.findOne({
      where: { clinicId },
    });

    if (!config) {
      return { valid: false, message: 'Configuración de clínica no encontrada' };
    }

    const maxDailyCapacity = config.clinicGroomingCapacity || 1;
    
    // Get start and end of day as timestamps
    const dayStart = startOfDay(scheduledAt);
    const dayEnd = endOfDay(scheduledAt);

    const query = this.appointmentRepository
      .createQueryBuilder('apt')
      .where('apt.clinicId = :clinicId', { clinicId })
      .andWhere('apt.locationType = :locationType', { locationType: 'CLINIC' })
      .andWhere('apt.status IN (:...statuses)', {
        statuses: ['SCHEDULED', 'CONFIRMED'],
      })
      .andWhere('apt.scheduledAt >= :dayStart', { dayStart })
      .andWhere('apt.scheduledAt <= :dayEnd', { dayEnd });

    if (excludeAppointmentId) {
      query.andWhere('apt.id != :excludeId', { excludeId: excludeAppointmentId });
    }

    const totalCount = await query.getCount();

    if (totalCount >= maxDailyCapacity) {
      return {
        valid: false,
        message: `Capacidad diaria de clínica alcanzada (máximo ${maxDailyCapacity} cita(s) por día)`,
        overlappingCount: totalCount,
        capacity: maxDailyCapacity,
      };
    }

    return { valid: true };
  }

  /**
   * Check if a stylist has overlapping appointments at the requested time
   */
  private async checkStylistAvailability(
    assignedStaffUserId: string,
    scheduledAt: Date,
    durationMinutes: number,
    excludeAppointmentId?: string,
  ): Promise<CapacityCheckResult> {
    const appointmentEnd = addMinutes(scheduledAt, durationMinutes);

    const query = this.appointmentRepository
      .createQueryBuilder('apt')
      .where('apt.assignedStaffUserId = :staffUserId', {
        staffUserId: assignedStaffUserId,
      })
      .andWhere('apt.status IN (:...statuses)', {
        statuses: ['SCHEDULED', 'CONFIRMED'],
      })
      .andWhere('apt.scheduledAt < :appointmentEnd', { appointmentEnd })
      .andWhere(
        'apt.scheduledAt + (apt.durationMinutes * INTERVAL \'1 minute\') > :appointmentStart',
        { appointmentStart: scheduledAt },
      );

    if (excludeAppointmentId) {
      query.andWhere('apt.id != :excludeId', { excludeId: excludeAppointmentId });
    }

    const overlappingCount = await query.getCount();

    if (overlappingCount > 0) {
      return {
        valid: false,
        message: `El estilista seleccionado ya tiene una cita programada en ese horario`,
        overlappingCount,
      };
    }

    return { valid: true };
  }

  /**
   * Check if a pet has a temporal overlap (BLOCKING ERROR)
   * Returns true if there IS an overlap (appointment blocked)
   */
  async checkTimeOverlapForPet(
    clinicId: string,
    petId: string,
    scheduledAt: Date,
    durationMinutes: number,
  ): Promise<boolean> {
    const appointmentEnd = addMinutes(scheduledAt, durationMinutes);

    const overlappingAppointments = await this.appointmentRepository
      .createQueryBuilder('apt')
      .where('apt.clinicId = :clinicId', { clinicId })
      .andWhere('apt.petId = :petId', { petId })
      .andWhere('apt.status IN (:...statuses)', {
        statuses: ['SCHEDULED', 'CONFIRMED'],
      })
      .getMany();

    // Check for actual temporal overlaps
    for (const apt of overlappingAppointments) {
      const aptStart = new Date(apt.scheduledAt);
      const aptEnd = addMinutes(aptStart, apt.durationMinutes || 30);

      // If there's any overlap between time ranges
      const hasOverlap = !(appointmentEnd <= aptStart || scheduledAt >= aptEnd);

      if (hasOverlap) {
        return true; // BLOCKING: Overlap found
      }
    }

    return false; // OK: No overlaps
  }
}
