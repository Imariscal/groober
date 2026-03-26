import { ClinicConfiguration, ClinicCalendarException, Appointment } from '@/types';
import { format, addMinutes, subMinutes, getDay, isBefore, isSameDay, parseISO, startOfDay as dateFnsStartOfDay, endOfDay as dateFnsEndOfDay } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';
import { getClinicDateKey } from './datetime-tz';

export interface BookingValidationResult {
  valid: boolean;
  reason?: string;
  businessHoursDisplay?: string;
}

export interface CapacityValidationResult {
  valid: boolean;
  reason?: string;
}

export interface ConflictValidationResult {
  hasBlocking: boolean; // True = appointment overlap (BLOCK)
  hasSameDay: boolean; // True = same day same location (WARN)
  blockingAppointment?: Appointment;
  reason?: string;
}

export interface PetConflictResult {
  petId: string;
  petName: string;
  hasConflict: boolean; // True if pet has blocking overlap (must exclude)
  conflictType?: 'BLOCKING' | 'SAME_DAY'; // BLOCKING = temporal overlap, SAME_DAY = warning only
  conflictingAppointment?: Appointment;
  reason?: string;
}

const dayMap: { [key: number]: keyof typeof emptySchedule } = {
  0: 'sun',
  1: 'mon',
  2: 'tue',
  3: 'wed',
  4: 'thu',
  5: 'fri',
  6: 'sat',
};

const emptySchedule = {
  mon: [],
  tue: [],
  wed: [],
  thu: [],
  fri: [],
  sat: [],
  sun: [],
};

export function getDayKey(date: Date, timezone: string = 'America/Monterrey'): keyof typeof emptySchedule {
  const zonedDate = utcToZonedTime(date, timezone);
  return dayMap[getDay(zonedDate)] as keyof typeof emptySchedule;
}

export function getBusinessHoursForDate(
  date: Date,
  config: ClinicConfiguration | null | undefined,
  timezone: string = 'America/Monterrey',
): Array<{ start: string; end: string }> {
  if (!config?.businessHours?.week) {
    return [];
  }

  const dayKey = getDayKey(date, timezone);
  return config.businessHours.week[dayKey] || [];
}

export function getExceptionForDate(
  date: Date,
  exceptions: ClinicCalendarException[],
  timezone: string = 'America/Monterrey',
): ClinicCalendarException | null {
  const dateStr = getClinicDateKey(date, timezone);
  return exceptions.find((ex) => ex.date === dateStr) || null;
}

export function isBookable(
  scheduledAtInput: Date | string,
  durationMinutes: number,
  config: ClinicConfiguration | null | undefined,
  exceptions: ClinicCalendarException[],
  timezone: string = 'America/Monterrey',
): BookingValidationResult {
  if (!config) {
    return { valid: false, reason: 'Configuración de clínica no disponible' };
  }

  const scheduledAt = typeof scheduledAtInput === 'string' ? new Date(scheduledAtInput) : scheduledAtInput;

  // Check if date is in the past - using CLINIC timezone
  // Get current time in clinic timezone
  const utcNow = new Date();
  const clinicNow = utcToZonedTime(utcNow, timezone);
  const bufferTime = addMinutes(clinicNow, 5);
  
  // Convert scheduledAt to clinic timezone for comparison
  const clinicScheduledAt = utcToZonedTime(scheduledAt, timezone);
  
  if (isBefore(clinicScheduledAt, bufferTime)) {
    return { valid: false, reason: 'No se puede agendar citas en fechas pasadas' };
  }

  // Check if it's a CLOSED day
  const dayException = getExceptionForDate(scheduledAt, exceptions, timezone);

  if (dayException?.type === 'CLOSED') {
    return {
      valid: false,
      reason: `Clínica cerrada: ${dayException.reason || 'Día no disponible'}`,
    };
  }

  const businessHours = getBusinessHoursForDate(scheduledAt, config, timezone);

  if (businessHours.length === 0) {
    // Day is not in business_hours at all (no hours defined)
    return { valid: false, reason: 'Clínica cerrada este día' };
  }

  const zonedDate = utcToZonedTime(scheduledAt, timezone);
  const scheduledTimeStr = format(zonedDate, 'HH:mm');
  const endTimeStr = format(addMinutes(zonedDate, durationMinutes), 'HH:mm');

  let isValid = false;
  let businessHoursDisplay = '';

  if (dayException?.type === 'SPECIAL_HOURS') {
    // Only check special hours range
    if (dayException.startTime && dayException.endTime) {
      const specialStart = dayException.startTime;
      const specialEnd = dayException.endTime;
      // Allow appointment to START up to 15 minutes before closing
      const lastAllowedStart = subMinutes(parseISO(`2000-01-01T${specialEnd}`), 15);
      const lastAllowedStartStr = format(lastAllowedStart, 'HH:mm');

      if (scheduledTimeStr >= specialStart && scheduledTimeStr <= lastAllowedStartStr) {
        isValid = true;
      }

      businessHoursDisplay = `Horario especial: ${specialStart}–${specialEnd}`;
    }
  } else {
    // Check against regular business hours
    for (const hours of businessHours) {
      const start = hours.start;
      const end = hours.end;
      // Allow appointment to START up to 15 minutes before closing
      const lastAllowedStart = subMinutes(parseISO(`2000-01-01T${end}`), 15);
      const lastAllowedStartStr = format(lastAllowedStart, 'HH:mm');

      if (scheduledTimeStr >= start && scheduledTimeStr <= lastAllowedStartStr) {
        isValid = true;
      }
    }

    businessHoursDisplay = businessHours.map((h) => `${h.start}–${h.end}`).join(', ');
  }

  if (!isValid) {
    return {
      valid: false,
      reason: `Fuera de horario. ${businessHoursDisplay}`,
      businessHoursDisplay,
    };
  }

  return { valid: true, businessHoursDisplay };
}

/**
 * Check if a date is in the past
 * @param dateInput - The date to check
 * @param timezone - The clinic timezone (default: America/Monterrey)
 * @returns true if the date is in the past (within 5 minute buffer)
 */
export function isPastDate(
  dateInput: Date | string,
  timezone: string = 'America/Monterrey',
): boolean {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  
  // Get current time in clinic timezone
  const utcNow = new Date();
  const clinicNow = utcToZonedTime(utcNow, timezone);
  const bufferTime = addMinutes(clinicNow, 5);
  
  // Convert date to clinic timezone for comparison
  const clinicDate = utcToZonedTime(date, timezone);
  
  return isBefore(clinicDate, bufferTime);
}

export function validateCapacity(
  locationType: 'CLINIC' | 'HOME',
  start: Date,
  end: Date,
  appointments: Appointment[],
  config: ClinicConfiguration | null | undefined,
  timezone: string = 'America/Monterrey',
  assignedStaffUserId?: string, // Optional: if assigned, skip general capacity check
): CapacityValidationResult {
  if (!config) {
    return { valid: true };
  }

  if (locationType === 'CLINIC') {
    // 1. Check max simultaneous appointments (maxClinicOverlappingAppointments)
    const maxSimultaneous = config.maxClinicOverlappingAppointments || 5;

    const overlappingCount = appointments.filter((apt) => {
      if (apt.location_type !== 'CLINIC') return false;

      const aptStart = new Date(apt.scheduled_at);
      const aptEnd = new Date(aptStart.getTime() + (apt.duration_minutes || 30) * 60000);

      return !(end <= aptStart || start >= aptEnd);
    }).length;

    if (overlappingCount >= maxSimultaneous) {
      return {
        valid: false,
        reason: `Máximo de citas simultáneas alcanzado (límite: ${maxSimultaneous})`,
      };
    }

    // 2. Check max daily appointments (clinicGroomingCapacity)
    const maxDaily = config.clinicGroomingCapacity || 1;
    // 🎯 FIX: Use clinic timezone to get the date key for comparison
    // This ensures we count appointments on the same "clinic day", not browser day
    const appointmentDateKey = getClinicDateKey(start, timezone);

    const dailyCount = appointments.filter((apt) => {
      if (apt.location_type !== 'CLINIC') return false;
      // Compare using clinic timezone date key
      const aptDateKey = getClinicDateKey(new Date(apt.scheduled_at), timezone);
      return aptDateKey === appointmentDateKey;
    }).length;

    if (dailyCount >= maxDaily) {
      return {
        valid: false,
        reason: `Capacidad diaria de clínica alcanzada (máximo ${maxDaily} cita(s) por día)`,
      };
    }
  } else if (locationType === 'HOME') {
    // If stylist is assigned, skip general HOME capacity check
    // Backend will validate against stylist-specific capacity via canStylistAttendAppointment()
    if (assignedStaffUserId) {
      return { valid: true };
    }

    const homeCapacity = config.homeGroomingCapacity || 1;
    const buffer = config.homeTravelBufferMinutes || 20;

    const bufferedStart = addMinutes(start, -buffer);
    const bufferedEnd = addMinutes(end, buffer);

    const overlappingCount = appointments.filter((apt) => {
      if (apt.location_type !== 'HOME') return false;

      const aptStart = new Date(apt.scheduled_at);
      const aptEnd = addMinutes(aptStart, apt.duration_minutes || 30);

      return !(bufferedEnd <= aptStart || bufferedStart >= aptEnd);
    }).length;

    if (overlappingCount >= homeCapacity) {
      return {
        valid: false,
        reason: `Capacidad de domicilio alcanzada (${homeCapacity} cita(s))`,
      };
    }
  }

  return { valid: true };
}

export function formatBusinessHoursDisplay(config: ClinicConfiguration | null | undefined): string {
  if (!config?.businessHours?.week) {
    return 'Horarios no configurados';
  }

  const dayLabels: { [key: string]: string } = {
    mon: 'Lun',
    tue: 'Mar',
    wed: 'Mié',
    thu: 'Jue',
    fri: 'Vie',
    sat: 'Sáb',
    sun: 'Dom',
  };

  const parts: string[] = [];

  for (const [dayKey, dayLabel] of Object.entries(dayLabels)) {
    const key = dayKey as keyof typeof config.businessHours.week;
    const hours = config.businessHours.week[key];

    if (hours && hours.length > 0) {
      const timeRanges = hours.map((h) => `${h.start}–${h.end}`).join(', ');
      parts.push(`${dayLabel} ${timeRanges}`);
    } else {
      parts.push(`${dayLabel} Cerrado`);
    }
  }

  return parts.join(' | ');
}

/**
 * Valida conflictos de citas para CADA mascota individualmente
 * Retorna array con resultado por mascota:
 * - hasConflict: true si hay overlap temporal (BLOQUEAR)
 * - conflictType: 'BLOCKING' para overlap, 'SAME_DAY' para advertencia
 * 
 * Permite crear lote parcial: solo mascotas sin conflicto
 */
export function validateAppointmentConflicts(
  petIds: string[],
  scheduledAt: Date,
  durationMinutes: number,
  locationType: 'CLINIC' | 'HOME',
  existingAppointments: Appointment[],
  timezone: string = 'America/Monterrey',
): PetConflictResult[] {
  const results: PetConflictResult[] = [];

  console.log('🔍 validateAppointmentConflicts called:', {
    petIds,
    scheduledAt: scheduledAt.toISOString(),
    durationMinutes,
    locationType,
    existingAppointmentsCount: existingAppointments.length,
  });

  const appointmentEnd = addMinutes(scheduledAt, durationMinutes);

  for (const petId of petIds) {
    // Find pet name from appointments or fallback to petId
    const petAptForName = existingAppointments.find(
      (apt) => apt.pet?.id === petId || apt.pet_id === petId
    );
    const petName = petAptForName?.pet?.name || `Mascota (${petId})`;

    let petResult: PetConflictResult = {
      petId,
      petName,
      hasConflict: false,
      conflictType: undefined,
      conflictingAppointment: undefined,
      reason: undefined,
    };

    // Obtener todas las citas de esta mascota
    // Excluir: CANCELLED, NO_SHOW y citas RESCHEDULED (no bloquean)
    const petAppointments = existingAppointments.filter(
      (apt) => (apt.pet?.id === petId || apt.pet_id === petId) && 
               (apt.status === 'SCHEDULED' || apt.status === 'CONFIRMED') &&
               !apt.rescheduled_at, // Exclude rescheduled appointments
    );

    console.log(`📋 Checking pet ${petId}:`, {
      totalExistingForPet: petAppointments.length,
      appointments: petAppointments.map(a => ({
        id: a.id,
        petName: a.pet?.name,
        status: a.status,
        scheduledAt: new Date(a.scheduled_at).toISOString(),
        duration: a.duration_minutes,
        location: a.location_type,
      })),
    });

    for (const existingApt of petAppointments) {
      const existingStart = new Date(existingApt.scheduled_at);
      const existingEnd = addMinutes(existingStart, existingApt.duration_minutes || 30);

      // ❌ BLOQUEO: Temporal overlap
      const hasOverlap = !(appointmentEnd <= existingStart || scheduledAt >= existingEnd);

      console.log(`  ⏰ Overlap check for apt ${existingApt.id}:`, {
        newSlot: { start: scheduledAt.toISOString(), end: appointmentEnd.toISOString() },
        existingSlot: { start: existingStart.toISOString(), end: existingEnd.toISOString() },
        hasOverlap,
      });

      if (hasOverlap) {
        petResult = {
          petId,
          petName: existingApt.pet?.name || 'Mascota',
          hasConflict: true,
          conflictType: 'BLOCKING',
          conflictingAppointment: existingApt,
          reason: `${existingApt.pet?.name || 'Mascota'} ya tiene cita en ese horario (${format(existingStart, 'HH:mm')} - ${format(existingEnd, 'HH:mm')})`,
        };
        console.log('🚫 BLOCKING CONFLICT DETECTED:', petResult.reason);
        break; // Stop checking other appointments for this pet
      }

      // ⚠️ ADVERTENCIA: Mismo día, misma ubicación (solo en HOME - en clínica varias citas OK)
      // En clínica, la mascota puede tener múltiples citas el mismo día (baño, corte, etc)
      // En domicilio, solo advertir si es el mismo día en HOME
      const sameDayHomeConflict = 
        locationType === 'HOME' &&
        isSameDay(scheduledAt, existingStart) && 
        existingApt.location_type === 'HOME';

      console.log(`  📅 Same day HOME check:`, {
        isHomeLocation: locationType === 'HOME',
        isSameDay: isSameDay(scheduledAt, existingStart),
        existingIsHome: existingApt.location_type === 'HOME',
        sameDayHomeConflict,
      });

      if (sameDayHomeConflict && !petResult.hasConflict) {
        // Only set SAME_DAY warning if no blocking conflict found and both are HOME
        petResult = {
          petId,
          petName: existingApt.pet?.name || 'Mascota',
          hasConflict: false, // SAME_DAY is a warning, not a blocker
          conflictType: 'SAME_DAY',
          conflictingAppointment: existingApt,
          reason: `${existingApt.pet?.name || 'Mascota'} tiene otra cita el mismo día en domicilio (el groomer podría no estar disponible)`,
        };
        console.log('⚠️ SAME DAY HOME WARNING:', petResult.reason);
      }
    }

    results.push(petResult);
  }

  console.log('✅ Final conflict validation results:', results);
  return results;
}
/**
 * Valida si un estilista específico tiene citas que se solapan en el horario solicitado
 * Excluye CANCELLED, NO_SHOW y citas RESCHEDULED (no bloquean)
 */
export function checkStylistOverlap(
  assignedStaffUserId: string | undefined,
  scheduledAt: Date,
  durationMinutes: number,
  appointments: Appointment[],
): CapacityValidationResult {
  if (!assignedStaffUserId) {
    return { valid: true };
  }

  const appointmentEnd = addMinutes(scheduledAt, durationMinutes);

  // Find all appointments assigned to this stylist
  // Excluir CANCELLED, NO_SHOW y citas RESCHEDULED (no bloquean hora)
  const stylistAppointments = appointments.filter(
    (apt) =>
      apt.assigned_staff_user_id === assignedStaffUserId &&
      (apt.status === 'SCHEDULED' || apt.status === 'CONFIRMED') &&
      !apt.rescheduled_at // Exclude rescheduled appointments
  );

  // Check for temporal overlap
  for (const existingApt of stylistAppointments) {
    const existingStart = new Date(existingApt.scheduled_at);
    const existingEnd = addMinutes(existingStart, existingApt.duration_minutes || 30);

    // Check if time slots overlap
    const hasOverlap = !(appointmentEnd <= existingStart || scheduledAt >= existingEnd);

    if (hasOverlap) {
      return {
        valid: false,
        reason: `El estilista seleccionado ya tiene una cita programada en ese horario (${format(existingStart, 'HH:mm')} - ${format(existingEnd, 'HH:mm')})`,
      };
    }
  }

  return { valid: true };
}

/**
 * Verifica si hay citas existentes en el horario seleccionado
 * cuando allowAppointmentOverlap es false
 */
export function hasConflictingAppointment(
  scheduledAt: Date,
  durationMinutes: number,
  appointments: Appointment[],
  config: ClinicConfiguration | null | undefined,
  locationType: 'CLINIC' | 'HOME' | 'ALL' = 'CLINIC',
): { hasConflict: boolean; conflictingAppointment?: Appointment } {
  // If allowAppointmentOverlap is true, no conflict regardless
  if (config?.allowAppointmentOverlap) {
    return { hasConflict: false };
  }

  const appointmentEnd = addMinutes(scheduledAt, durationMinutes);

  // Find any existing appointments that overlap
  const relevantAppointments = appointments.filter((apt) => {
    // If 'ALL' tab, check both CLINIC and HOME
    if (locationType === 'ALL') {
      return apt.status === 'SCHEDULED' || apt.status === 'CONFIRMED';
    }
    // Otherwise, filter by specific location type
    return (
      apt.location_type === locationType &&
      (apt.status === 'SCHEDULED' || apt.status === 'CONFIRMED')
    );
  });

  for (const existingApt of relevantAppointments) {
    const existingStart = new Date(existingApt.scheduled_at);
    const existingEnd = addMinutes(existingStart, existingApt.duration_minutes || 30);

    // Check temporal overlap: start < end && end > start
    const hasOverlap = !(appointmentEnd <= existingStart || scheduledAt >= existingEnd);

    if (hasOverlap) {
      return {
        hasConflict: true,
        conflictingAppointment: existingApt,
      };
    }
  }

  return { hasConflict: false };
}