import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClinicConfiguration } from '@/database/entities';
import {
  parse,
  format,
  startOfDay,
  endOfDay,
  isValid,
} from 'date-fns';
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';

@Injectable()
export class TimezoneService {
  private timezoneCache: Map<string, string> = new Map();

  constructor(
    @InjectRepository(ClinicConfiguration)
    private clinicConfigRepo: Repository<ClinicConfiguration>,
  ) {}

  /**
   * Get clinic timezone (with simple in-memory cache per request)
   */
  async getClinicTimezone(clinicId: string): Promise<string> {
    if (this.timezoneCache.has(clinicId)) {
      return this.timezoneCache.get(clinicId)!;
    }

    const config = await this.clinicConfigRepo.findOne({
      where: { clinicId },
    });

    const tz = config?.timezone || 'America/Monterrey';
    this.timezoneCache.set(clinicId, tz);
    return tz;
  }

  /**
   * Clear cache (call this after timezone update)
   */
  clearCache(clinicId?: string): void {
    if (clinicId) {
      this.timezoneCache.delete(clinicId);
    } else {
      this.timezoneCache.clear();
    }
  }

  /**
   * Parse input (ISO string or local date string) as clinic timezone,
   * convert to UTC Date
   */
  parseInClinicTzToUtc(clinicTz: string, inputStr: string): Date {
    // If input has Z or ±HH:mm, interpret as absolute time
    if (inputStr.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(inputStr)) {
      return new Date(inputStr);
    }

    // Otherwise, treat as local time in clinic timezone and convert to UTC
    try {
      const localDate = parse(inputStr, 'yyyy-MM-dd HH:mm:ss', new Date());
      if (!isValid(localDate)) {
        throw new Error('Invalid date');
      }
      return zonedTimeToUtc(localDate, clinicTz);
    } catch {
      // Fallback: try ISO format without timezone
      const asDate = new Date(inputStr);
      if (!isValid(asDate)) {
        throw new Error(`Invalid date input: ${inputStr}`);
      }
      // If interpreted as UTC, convert from UTC to clinic TZ time, then back as if it was local
      return zonedTimeToUtc(asDate, clinicTz);
    }
  }

  /**
   * Convert UTC date to clinic timezone date string (YYYY-MM-DD)
   */
  toClinicDateKey(clinicTz: string, utcDate: Date): string {
    const zonedDate = utcToZonedTime(utcDate, clinicTz);
    return format(zonedDate, 'yyyy-MM-dd');
  }

  /**
   * Convert UTC date to clinic timezone, return HH:mm:ss
   */
  toClinicTimeKey(clinicTz: string, utcDate: Date): string {
    const zonedDate = utcToZonedTime(utcDate, clinicTz);
    return format(zonedDate, 'HH:mm:ss');
  }

  /**
   * Get the full day range (start and end of day in UTC)
   * for a given date string in clinic timezone
   */
  getClinicDayRangeUtc(
    clinicTz: string,
    dateKeyYYYYMMDD: string,
  ): { startUtc: Date; endUtc: Date } {
    // Parse dayKey as local clinic date
    const localDate = parse(dateKeyYYYYMMDD, 'yyyy-MM-dd', new Date());

    // Get start and end of day in clinic timezone
    const startLocal = startOfDay(localDate);
    const endLocal = endOfDay(localDate);

    // Convert clinic timezone boundaries to UTC
    const startUtc = zonedTimeToUtc(startLocal, clinicTz);
    const endUtc = zonedTimeToUtc(endLocal, clinicTz);

    return { startUtc, endUtc };
  }

  /**
   * Convert from/to range (clinic local dates or datetimes) to UTC ISO range
   */
  getClinicRangeUtc(
    clinicTz: string,
    fromStr: string,
    toStr: string,
  ): { fromUtc: Date; toUtc: Date } {
    const fromUtc = this.parseInClinicTzToUtc(clinicTz, fromStr);
    const toUtc = this.parseInClinicTzToUtc(clinicTz, toStr);
    return { fromUtc, toUtc };
  }

  /**
   * Format UTC date as ISO string with Z (for API responses)
   */
  toUtcIsoString(date: Date): string {
    return date.toISOString();
  }

  /**
   * Check if two UTC dates are the same day in clinic timezone
   */
  isSameDayInClinicTz(clinicTz: string, date1: Date, date2: Date): boolean {
    const key1 = this.toClinicDateKey(clinicTz, date1);
    const key2 = this.toClinicDateKey(clinicTz, date2);
    return key1 === key2;
  }
}
