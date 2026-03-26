import {
  format,
  parse,
  isValid,
  startOfDay,
  endOfDay,
  addDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addMinutes,
} from 'date-fns';
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';

/**
 * Format a UTC ISO string (e.g., "2024-01-15T10:30:00Z") to a clinic timezone
 * and return a formatted string (e.g., "15/01 10:30")
 */
export function formatInClinicTz(
  dateUtcIso: string | Date,
  clinicTz: string,
  formatStr: string = 'dd/MM HH:mm',
): string {
  try {
    const date = typeof dateUtcIso === 'string' ? new Date(dateUtcIso) : dateUtcIso;
    if (!isValid(date)) {
      return '';
    }
    const zonedDate = utcToZonedTime(date, clinicTz);
    return format(zonedDate, formatStr);
  } catch {
    return '';
  }
}

/**
 * Convert UTC ISO string to a zoned Date object in clinic timezone
 * (suitable for Date picker components - shows local time in clinic tz)
 */
export function toClinicZonedDate(dateUtcIso: string | Date, clinicTz: string): Date {
  try {
    const date = typeof dateUtcIso === 'string' ? new Date(dateUtcIso) : dateUtcIso;
    if (!isValid(date)) {
      return new Date();
    }
    return utcToZonedTime(date, clinicTz);
  } catch {
    return new Date();
  }
}

/**
 * Convert a local date (as perceived in clinic timezone) to UTC ISO string with Z
 * Use this before sending to API
 */
export function toUtcIsoFromClinicLocal(localDate: Date, clinicTz: string): string {
  try {
    if (!isValid(localDate)) {
      throw new Error('Invalid date');
    }
    const utcDate = zonedTimeToUtc(localDate, clinicTz);
    return utcDate.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

/**
 * Get the clinic timezone day string (YYYY-MM-DD) for a UTC date
 */
export function getClinicDateKey(dateUtcIso: string | Date, clinicTz: string): string {
  try {
    const date = typeof dateUtcIso === 'string' ? new Date(dateUtcIso) : dateUtcIso;
    if (!isValid(date)) {
      return '';
    }
    const zonedDate = utcToZonedTime(date, clinicTz);
    return format(zonedDate, 'yyyy-MM-dd');
  } catch {
    return '';
  }
}

/**
 * Get start and end of a day (in UTC) for a date key in clinic timezone
 * dateKey format: YYYY-MM-DD
 */
export function getClinicDayRangeUtc(dateKey: string, clinicTz: string): {
  startUtc: Date;
  endUtc: Date;
} {
  try {
    const localDate = parse(dateKey, 'yyyy-MM-dd', new Date());
    const startLocal = startOfDay(localDate);
    const endLocal = endOfDay(localDate);

    const startUtc = zonedTimeToUtc(startLocal, clinicTz);
    const endUtc = zonedTimeToUtc(endLocal, clinicTz);

    return { startUtc, endUtc };
  } catch {
    const now = new Date();
    const startUtc = zonedTimeToUtc(startOfDay(now), clinicTz);
    const endUtc = zonedTimeToUtc(endOfDay(now), clinicTz);
    return { startUtc, endUtc };
  }
}

/**
 * Check if two UTC dates are the same day in clinic timezone
 */
export function isSameDayInClinicTz(utcDate1: Date, utcDate2: Date, clinicTz: string): boolean {
  try {
    const key1 = getClinicDateKey(utcDate1, clinicTz);
    const key2 = getClinicDateKey(utcDate2, clinicTz);
    return key1 === key2 && key1 !== '';
  } catch {
    return false;
  }
}

/**
 * Get calendar range for various views, returning from/to in UTC ISO
 */
export function getClinicRangeForCalendarView(
  view: 'day' | 'week' | 'month',
  currentDate: Date,
  clinicTz: string,
): { fromUtc: string; toUtc: string } {
  try {
    const zonedDate = utcToZonedTime(currentDate, clinicTz);
    let startLocal: Date, endLocal: Date;

    if (view === 'day') {
      startLocal = startOfDay(zonedDate);
      endLocal = endOfDay(zonedDate);
    } else if (view === 'week') {
      startLocal = startOfWeek(zonedDate, { weekStartsOn: 1 }); // Monday start (LATAM format)
      endLocal = endOfWeek(zonedDate, { weekStartsOn: 1 });
    } else {
      // month
      startLocal = startOfMonth(zonedDate);
      endLocal = endOfMonth(zonedDate);
    }

    const fromUtc = zonedTimeToUtc(startLocal, clinicTz).toISOString();
    const toUtc = zonedTimeToUtc(endLocal, clinicTz).toISOString();

    return { fromUtc, toUtc };
  } catch {
    const now = new Date();
    return {
      fromUtc: now.toISOString(),
      toUtc: now.toISOString(),
    };
  }
}

/**
 * Get "today" key in clinic timezone
 */
export function getTodayKeyInClinicTz(clinicTz: string): string {
  const now = new Date();
  return getClinicDateKey(now, clinicTz);
}

/**
 * DISPLAY FORMATTERS - Siempre mostrar fechas en timezone local
 * Estos se usan en: modales, reportes, listados, tablas, etc.
 */
export const displayFormatters = {
  /**
   * Formato para modales y formularios: "06/03/2026 08:00"
   */
  formatForModal(dateUtc: Date | string, clinicTz: string): string {
    try {
      const utc = typeof dateUtc === 'string' ? new Date(dateUtc) : dateUtc;
      if (!isValid(utc)) return '-';

      const zoned = utcToZonedTime(utc, clinicTz);
      return format(zoned, 'dd/MM/yyyy HH:mm');
    } catch {
      return '-';
    }
  },

  /**
   * Formato para reportes: "06 Mar 2026, 08:00"
   */
  formatForReport(dateUtc: Date | string, clinicTz: string, locale?: any): string {
    try {
      const utc = typeof dateUtc === 'string' ? new Date(dateUtc) : dateUtc;
      if (!isValid(utc)) return '-';

      const zoned = utcToZonedTime(utc, clinicTz);
      return format(zoned, 'dd MMM yyyy, HH:mm', { locale });
    } catch {
      return '-';
    }
  },

  /**
   * Solo la hora: "08:00"
   */
  formatTimeOnly(dateUtc: Date | string, clinicTz: string): string {
    try {
      const utc = typeof dateUtc === 'string' ? new Date(dateUtc) : dateUtc;
      if (!isValid(utc)) return '-';

      const zoned = utcToZonedTime(utc, clinicTz);
      return format(zoned, 'HH:mm');
    } catch {
      return '-';
    }
  },

  /**
   * Solo la fecha: "06/03/2026"
   */
  formatDateOnly(dateUtc: Date | string, clinicTz: string): string {
    try {
      const utc = typeof dateUtc === 'string' ? new Date(dateUtc) : dateUtc;
      if (!isValid(utc)) return '-';

      const zoned = utcToZonedTime(utc, clinicTz);
      return format(zoned, 'dd/MM/yyyy');
    } catch {
      return '-';
    }
  },

  /**
   * Para listados compactos: "06/03 08:00"
   */
  formatCompact(dateUtc: Date | string, clinicTz: string): string {
    try {
      const utc = typeof dateUtc === 'string' ? new Date(dateUtc) : dateUtc;
      if (!isValid(utc)) return '-';

      const zoned = utcToZonedTime(utc, clinicTz);
      return format(zoned, 'dd/MM HH:mm');
    } catch {
      return '-';
    }
  },

  /**
   * Formato largo: "viernes, 06 de marzo de 2026 a las 08:00"
   */
  formatLong(dateUtc: Date | string, clinicTz: string): string {
    try {
      const utc = typeof dateUtc === 'string' ? new Date(dateUtc) : dateUtc;
      if (!isValid(utc)) return '-';

      const zoned = utcToZonedTime(utc, clinicTz);
      return format(zoned, "EEEE, dd 'de' MMMM 'de' yyyy 'a las' HH:mm");
    } catch {
      return '-';
    }
  },

  /**
   * Para tooltips: "06/03/2026 08:00 (Montevideo time)"
   */
  formatWithTimezone(dateUtc: Date | string, clinicTz: string): string {
    try {
      const utc = typeof dateUtc === 'string' ? new Date(dateUtc) : dateUtc;
      if (!isValid(utc)) return '-';

      const zoned = utcToZonedTime(utc, clinicTz);
      return `${format(zoned, 'dd/MM/yyyy HH:mm')} (${clinicTz})`;
    } catch {
      return '-';
    }
  },
};
/**
 * Convert clinic local date + time (YYYY-MM-DD HH:mm) to UTC Date
 * This is the CRITICAL function that converts user input to UTC for saving
 * 
 * CORRECT LOGIC:
 * 1. User says "11:00 Tijuana" (PDT, UTC-7)
 * 2. Create reference: what if "11:00" were UTC? → 11:00 UTC
 * 3. Convert reference to Tijuana: 11:00 UTC → 04:00 Tijuana (7h behind)
 * 4. Calculate offset: user said 11:00, system would show 04:00 → offset is 7h
 * 5. Apply: actual UTC = 11:00 + 7h = 18:00 UTC ✓
 */
export function clinicLocalToUtc(dateStr: string, timeStr: string, clinicTz: string): Date {
  try {
    // Parse input strings
    const [yearStr, monthStr, dayStr] = dateStr.split('-');
    const [hourStr, minuteStr] = timeStr.split(':');
    
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1; // JS months are 0-indexed
    const day = parseInt(dayStr, 10);
    const hours = parseInt(hourStr, 10);
    const minutes = parseInt(minuteStr, 10);
    
    // Step 1: Create a UTC reference with the values the user provided
    const referenceUtcDate = new Date(Date.UTC(year, month, day, hours, minutes, 0, 0));
    
    // Step 2: Convert that reference to clinic timezone using Intl API
    // This gives us what time would be displayed in the clinic timezone
    const formatter = new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: clinicTz,
    });
    
    const parts = formatter.formatToParts(referenceUtcDate);
    const partMap: { [key: string]: string } = {};
    parts.forEach(part => {
      if (part.type !== 'literal') {
        partMap[part.type] = part.value;
      }
    });
    
    const zonedHours = parseInt(partMap['hour'] || '0', 10);
    const zonedMinutes = parseInt(partMap['minute'] || '0', 10);
    
    // Step 3: Calculate offset
    // User said "11:00" but in Tijuana it would display as "04:00"
    // So offset = 11 - 4 = 7 hours
    const offsetMinutes = (hours * 60 + minutes) - (zonedHours * 60 + zonedMinutes);
    
    // Step 4: Apply offset to get actual UTC time
    // Actual UTC = reference + offset
    const actualUtcDate = new Date(referenceUtcDate.getTime() + offsetMinutes * 60000);
    
    console.log('[clinicLocalToUtc] Conversion details:', {
      input: `${dateStr} ${timeStr}`,
      clinicTz,
      referenceUtcDate: referenceUtcDate.toISOString(),
      displayedInClinicTz: `${partMap['year']}-${partMap['month']}-${partMap['day']} ${partMap['hour']}:${partMap['minute']}`,
      offsetMinutes: `${offsetMinutes}m (${offsetMinutes / 60}h)`,
      actualUtcDate: actualUtcDate.toISOString(),
      verification: {
        referenceShowsAs: `If ${hours}:${minutes.toString().padStart(2, '0')} were UTC, it shows as ${zonedHours}:${zonedMinutes.toString().padStart(2, '0')} in ${clinicTz}`,
        offsetApplied: `${hours}:${minutes.toString().padStart(2, '0')} + ${offsetMinutes / 60}h = UTC ${format(actualUtcDate, 'HH:mm')}`,
      },
    });
    
    return actualUtcDate;
  } catch (error) {
    console.error('[clinicLocalToUtc] Error converting local time to UTC:', {
      dateStr,
      timeStr,
      clinicTz,
      error: error instanceof Error ? error.message : String(error),
    });
    return new Date();
  }
}

/**
 * Round a UTC date to nearest 15-minute interval and convert to clinic local time
 * Returns { date: 'YYYY-MM-DD', time: 'HH:mm' } for use in form inputs
 * 
 * This prevents timezone conversion errors by:
 * 1. Rounding the UTC milliseconds directly
 * 2. Converting the rounded UTC to clinic timezone
 * 3. Extracting date/time in clinic timezone
 * 
 * @param dateUtc - UTC date to round
 * @param clinicTz - Clinic timezone (e.g., "America/Tijuana")
 * @returns Object with date (YYYY-MM-DD) and time (HH:mm) in clinic local time
 */
export function roundUtcToClinicLocal(
  dateUtc: Date,
  clinicTz: string,
): { date: string; time: string } {
  try {
    if (!isValid(dateUtc)) {
      throw new Error('Invalid date');
    }

    // Step 1: Round minutes in UTC
    const minutes = dateUtc.getMinutes();
    const rounded = Math.round(minutes / 15) * 15;
    const minutesAdjust = rounded - minutes;
    
    // Step 2: Apply rounding to UTC time
    const roundedUtc = addMinutes(dateUtc, minutesAdjust);
    
    // Step 3: Convert rounded UTC to clinic timezone
    const clinicDate = utcToZonedTime(roundedUtc, clinicTz);
    
    // Step 4: Extract date and time components in clinic timezone
    const dateStr = format(clinicDate, 'yyyy-MM-dd');
    const timeStr = format(clinicDate, 'HH:mm');
    
    console.log('[roundUtcToClinicLocal]', {
      input: dateUtc.toISOString(),
      rounded: roundedUtc.toISOString(),
      clinic: `${dateStr} ${timeStr}`,
    });
    
    return { date: dateStr, time: timeStr };
  } catch (error) {
    console.error('[roundUtcToClinicLocal] Error:', {
      inputDate: dateUtc.toISOString(),
      clinicTz,
      error: error instanceof Error ? error.message : String(error),
    });
    
    // Fallback: use current date/time
    const now = new Date();
    const clinicDate = utcToZonedTime(now, clinicTz);
    return {
      date: format(clinicDate, 'yyyy-MM-dd'),
      time: format(clinicDate, 'HH:mm'),
    };
  }
}