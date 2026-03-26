import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { startOfDay, endOfDay, parse } from 'date-fns';
import { utcToZonedTime, format } from 'date-fns-tz';
import {
  Stylist,
  StylistAvailability,
  StylistUnavailablePeriod,
  StylistCapacity,
  Appointment,
} from '@/database/entities';
import { TimezoneService } from '@/shared/timezone/timezone.service';

export interface AvailabilityCheckResult {
  available: boolean;
  reason?: string;
  details?: Record<string, any>;
}

export interface StylistAvailableSlot {
  stylistId: string;
  stylistName: string;
  available: boolean;
  conflicts?: string[];
}

/**
 * Servicio centralizado para validar disponibilidad de estilistas
 * Verifica:
 * - Horarios de trabajo
 * - Períodos no disponibles (vacaciones, enfermedad, etc.)
 * - Conflictos de horarios con otras citas
 * - Capacidad máxima por día
 */
@Injectable()
export class StylistAvailabilityService {
  private readonly logger = new Logger(StylistAvailabilityService.name);

  constructor(
    @InjectRepository(Stylist)
    private stylistRepository: Repository<Stylist>,
    @InjectRepository(StylistAvailability)
    private availabilityRepository: Repository<StylistAvailability>,
    @InjectRepository(StylistUnavailablePeriod)
    private unavailablePeriodRepository: Repository<StylistUnavailablePeriod>,
    @InjectRepository(StylistCapacity)
    private capacityRepository: Repository<StylistCapacity>,
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
    private timezoneService: TimezoneService,
  ) {}

  /**
   * Verifica si un estilista puede atender una cita en el horario especificado
   */
  async canStylistAttendAppointment(
    stylistId: string,
    appointmentStart: Date,
    appointmentEnd: Date,
    excludeAppointmentId?: string,
    appointmentType?: string, // GROOMING or MEDICAL to filter conflicts
  ): Promise<AvailabilityCheckResult> {
    try {
      // 1. Verificar si el estilista existe y está marcado como "bookable"
      const stylist = await this.stylistRepository.findOne({
        where: { id: stylistId },
        relations: ['user'],
      });

      if (!stylist) {
        return {
          available: false,
          reason: 'STYLIST_NOT_FOUND',
          details: { stylistId },
        };
      }

      if (!stylist.isBookable) {
        return {
          available: false,
          reason: 'STYLIST_NOT_BOOKABLE',
          details: { stylistId },
        };
      }

      if (stylist.user.status !== 'ACTIVE') {
        return {
          available: false,
          reason: 'STYLIST_USER_INACTIVE',
          details: { userId: stylist.userId },
        };
      }

      // 2. Verificar si está en un período de no disponibilidad
      const isUnavailable = await this.checkUnavailablePeriods(
        stylistId,
        appointmentStart,
        appointmentEnd,
      );
      if (isUnavailable) {
        return {
          available: false,
          reason: 'STYLIST_UNAVAILABLE_PERIOD',
          details: { stylistId },
        };
      }

      // 3. Verificar horarios de trabajo
      const isWithinWorkHours = await this.checkWorkingHours(
        stylistId,
        appointmentStart,
        appointmentEnd,
      );
      if (!isWithinWorkHours) {
        return {
          available: false,
          reason: 'OUTSIDE_WORK_HOURS',
          details: {
            appointmentStart: appointmentStart.toISOString(),
            appointmentEnd: appointmentEnd.toISOString(),
          },
        };
      }

      // 4. Verificar conflictos con otras citas
      const hasConflict = await this.checkScheduleConflicts(
        stylistId,
        appointmentStart,
        appointmentEnd,
        excludeAppointmentId,
        appointmentType,
      );
      if (hasConflict) {
        return {
          available: false,
          reason: 'SCHEDULE_CONFLICT',
          details: { stylistId },
        };
      }

      // 5. Verificar capacidad del día
      const exceedsCapacity = await this.checkDailyCapacity(
        stylistId,
        appointmentStart,
        excludeAppointmentId,
        appointmentType,
      );
      if (exceedsCapacity) {
        return {
          available: false,
          reason: 'CAPACITY_EXCEEDED',
          details: { stylistId },
        };
      }

      return { available: true };
    } catch (error) {
      this.logger.error(
        `Error checking availability for stylist ${stylistId}`,
        error,
      );
      return {
        available: false,
        reason: 'AVAILABILITY_CHECK_ERROR',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
      };
    }
  }

  /**
   * Obtiene lista de estilistas disponibles para un timeslot específico
   */
  async getAvailableStylists(
    clinicId: string,
    appointmentStart: Date,
    appointmentEnd: Date,
  ): Promise<StylistAvailableSlot[]> {
    try {
      // Obtener todos los estilistas "bookable" de la clínica
      const stylists = await this.stylistRepository.find({
        where: { clinicId, isBookable: true },
        relations: ['user'],
      });

      const results: StylistAvailableSlot[] = [];

      for (const stylist of stylists) {
        const check = await this.canStylistAttendAppointment(
          stylist.id,
          appointmentStart,
          appointmentEnd,
        );

        results.push({
          stylistId: stylist.id,
          stylistName: stylist.displayName || stylist.user?.name || 'Unknown',
          available: check.available,
          conflicts: check.available ? undefined : [check.reason || 'UNKNOWN'],
        });
      }

      return results.filter((s) => s.available);
    } catch (error) {
      this.logger.error(
        `Error getting available stylists for clinic ${clinicId}`,
        error,
      );
      return [];
    }
  }

  /**
   * Obtiene estilistas activos (que no están de vacaciones/unavailable)
   */
  async getActiveStylists(clinicId: string): Promise<Stylist[]> {
    try {
      // Get clinic timezone and calculate "today" in that timezone
      const clinicTz = await this.timezoneService.getClinicTimezone(clinicId);
      const now = new Date();
      const zonedNow = utcToZonedTime(now, clinicTz);
      const todayDateKey = format(zonedNow, 'yyyy-MM-dd');
      const today = parse(todayDateKey, 'yyyy-MM-dd', new Date());

      // Obtener estilistas bookable
      const stylists = await this.stylistRepository.find({
        where: { clinicId, isBookable: true },
        relations: ['user'],
      });

      // Filtrar los que NO estén en período unavailable hoy
      const activeStylists: Stylist[] = [];

      for (const stylist of stylists) {
        if (stylist.user.status !== 'ACTIVE') continue;

        const isUnavailableToday = await this.isUnavailableOnDate(
          stylist.id,
          today,
        );

        if (!isUnavailableToday) {
          activeStylists.push(stylist);
        }
      }

      return activeStylists;
    } catch (error) {
      this.logger.error(
        `Error getting active stylists for clinic ${clinicId}`,
        error,
      );
      return [];
    }
  }

  /**
   * Verifica si el estilista está en un período de no disponibilidad
   */
  private async checkUnavailablePeriods(
    stylistId: string,
    appointmentStart: Date,
    appointmentEnd: Date,
  ): Promise<boolean> {
    const startDate = new Date(
      appointmentStart.getFullYear(),
      appointmentStart.getMonth(),
      appointmentStart.getDate(),
    );
    const endDate = new Date(
      appointmentEnd.getFullYear(),
      appointmentEnd.getMonth(),
      appointmentEnd.getDate(),
    );

    const conflicts =
      await this.unavailablePeriodRepository.find({
        where: {
          stylistId,
          startDate: LessThanOrEqual(endDate),
          endDate: MoreThanOrEqual(startDate),
        },
      });

    if (conflicts.length === 0) {
      return false;
    }

    // Si alguno es "all_day", retorna true
    if (conflicts.some((c) => c.isAllDay)) {
      return true;
    }

    // Si no es all_day, verificar que el horario no esté dentro del período
    for (const conflict of conflicts) {
      if (this.timeRangesOverlap(appointmentStart, appointmentEnd, conflict)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Verifica si el horario cae dentro de las horas de trabajo del estilista
   */
  private async checkWorkingHours(
    stylistId: string,
    appointmentStart: Date,
    appointmentEnd: Date,
  ): Promise<boolean> {
    const dayOfWeek = this.getDayOfWeek(appointmentStart);

    const availability = await this.availabilityRepository.findOne({
      where: { stylistId, dayOfWeek },
    });

    // Si no hay registro de disponibilidad para ese día, no se puede agendar
    if (!availability) {
      return false;
    }

    if (!availability.isActive) {
      return false;
    }

    const appointmentStartTime = this.timeToString(appointmentStart);
    const appointmentEndTime = this.timeToString(appointmentEnd);

    // Verificar que la cita esté completamente dentro de las horas de trabajo
    const isWithinHours =
      appointmentStartTime >= availability.startTime &&
      appointmentEndTime <= availability.endTime;

    return isWithinHours;
  }

  /**
   * Verifica si existe conflicto de horario con otras citas del MISMO tipo
   */
  private async checkScheduleConflicts(
    stylistId: string,
    appointmentStart: Date,
    appointmentEnd: Date,
    excludeAppointmentId?: string,
    appointmentType?: string,
  ): Promise<boolean> {
    const query = this.appointmentRepository
      .createQueryBuilder('app')
      .where('app.assigned_staff_user_id = :stylistUserId', {
        stylistUserId: stylistId, // Necesitamos el user_id del stylist
      })
      .andWhere(
        '(app.scheduled_at, app.scheduled_at + INTERVAL \'1 minute\' * app.duration_minutes) OVERLAPS (:start, :end)',
        {
          start: appointmentStart,
          end: appointmentEnd,
        },
      )
      .andWhere('app.status NOT IN (:...statuses)', {
        statuses: ['CANCELLED'],
      });

    // Filter by appointment type if provided (GROOMING or MEDICAL)
    if (appointmentType) {
      query.andWhere('app.service_type = :appointmentType', {
        appointmentType: appointmentType,
      });
    }

    if (excludeAppointmentId) {
      query.andWhere('app.id != :appointmentId', {
        appointmentId: excludeAppointmentId,
      });
    }

    const conflicts = await query.getMany();
    return conflicts.length > 0;
  }

  /**
   * Verifica si la capacidad máxima del día ha sido alcanzada
   * Filtra por tipo de cita (GROOMING o MEDICAL) si se proporciona
   */
  private async checkDailyCapacity(
    stylistId: string,
    appointmentDate: Date,
    excludeAppointmentId?: string,
    appointmentType?: string,
  ): Promise<boolean> {
    // 🎯 FIX: Use UTC day range instead of DATE() function
    // This prevents timezone conversion issues with toISOString().split()
    const dayStart = startOfDay(appointmentDate);
    const dayEnd = endOfDay(appointmentDate);

    // Obtener capacidad específica para ese día
    const capacity = await this.capacityRepository.findOne({
      where: { stylistId, date: dayStart },
    });

    // If no capacity record exists or maxAppointments is NULL/0, capacity is UNLIMITED
    // Return false (no capacity exceeded)
    if (!capacity || !capacity.maxAppointments || capacity.maxAppointments === 0) {
      return false;
    }

    const maxAppointments = capacity.maxAppointments;

    // 🎯 FIX: Use time range query instead of DATE() which depends on DB timezone
    // Contar citas existentes en ese día usando rango de tiempo
    const query = this.appointmentRepository
      .createQueryBuilder('app')
      .where('app.assigned_staff_user_id = :stylistUserId', {
        stylistUserId: stylistId,
      })
      .andWhere('app.scheduled_at >= :dayStart', { dayStart })
      .andWhere('app.scheduled_at < :dayEnd', { dayEnd })
      .andWhere('app.status NOT IN (:...statuses)', {
        statuses: ['CANCELLED'],
      });

    // Filter by appointment type if provided (GROOMING or MEDICAL)
    if (appointmentType) {
      query.andWhere('app.service_type = :appointmentType', {
        appointmentType: appointmentType,
      });
    }

    if (excludeAppointmentId) {
      query.andWhere('app.id != :appointmentId', {
        appointmentId: excludeAppointmentId,
      });
    }

    const appointmentCount = await query.getCount();
    return appointmentCount >= maxAppointments;
  }

  /**
   * Verifica si el estilista está unavailable en una fecha específica
   */
  private async isUnavailableOnDate(
    stylistId: string,
    date: Date,
  ): Promise<boolean> {
    const period = await this.unavailablePeriodRepository.findOne({
      where: {
        stylistId,
        startDate: LessThanOrEqual(date),
        endDate: MoreThanOrEqual(date),
      },
    });

    return !!period;
  }

  // ============= Helper Methods =============

  /**
   * Convierte una fecha a día de la semana (ISO 8601: 0=Lunes, 6=Domingo)
   */
  private getDayOfWeek(date: Date): number {
    const day = date.getDay();
    // Convertir JavaScript's 0=Sunday a ISO 0=Monday
    return day === 0 ? 6 : day - 1;
  }

  /**
   * Convierte una fecha a string de tiempo (HH:mm)
   */
  private timeToString(date: Date): string {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  /**
   * Verifica si dos rangos de tiempo se superponen
   */
  private timeRangesOverlap(
    start1: Date,
    end1: Date,
    period: StylistUnavailablePeriod,
  ): boolean {
    if (period.isAllDay) {
      return true;
    }

    const start1Time = this.timeToString(start1);
    const end1Time = this.timeToString(end1);

    if (!period.startTime || !period.endTime) {
      return false;
    }

    return (
      start1Time < (period.endTime || '24:00') &&
      end1Time > (period.startTime || '00:00')
    );
  }
}
