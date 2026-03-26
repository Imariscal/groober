'use server';

import { Injectable, BadRequestException } from '@nestjs/common';
import { zonedTimeToUtc, utcToZonedTime, format as formatTz } from 'date-fns-tz';
import { TimezoneService } from './timezone.service';

/**
 * Servicio centralizado para sincronizar todas las fechas a UTC
 * Garantiza que TODO lo que se guarda en la BD está en UTC
 * 
 * Responsabilidades:
 * 1. Validar que las fechas lleguen en UTC
 * 2. Si llegan en hora local, convertir a UTC
 * 3. Normalizar DTOs antes de guardar
 * 4. Proporcionar errores claros cuando algo está mal
 */
@Injectable()
export class TimezoneSynchronizationService {
  constructor(private readonly timezoneService: TimezoneService) {}

  /**
   * Valida que una fecha esté en formato UTC ISO 8601 con zona horaria explícita
   * Ejemplos válidos:
   *   - "2026-03-06T15:00:00Z"
   *   - "2026-03-06T15:00:00.000Z"
   *   - "2026-03-06T15:00:00+00:00"
   */
  private isValidUtcFormat(value: string | Date): boolean {
    if (value instanceof Date) {
      return true; // Los Date objects de JS ya son UTC internamente
    }
    if (typeof value !== 'string') {
      return false;
    }
    // Debe terminar con Z o tener offset de timezone
    return /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/.test(value);
  }

  /**
   * Convierte una fecha de CUALQUIER formato a UTC garantizado
   * Si ya está en UTC, passa directo
   * Si está en hora local, convierte
   */
  async ensureUtc(clinicId: string, dateInput: any): Promise<Date | null> {
    if (!dateInput) {
      return null;
    }

    // Si ya es un Date object, devolver directo (internamente es UTC)
    if (dateInput instanceof Date) {
      return dateInput;
    }

    // Si es string ISO con timezone explícito, parsear directo
    if (typeof dateInput === 'string') {
      if (this.isValidUtcFormat(dateInput)) {
        return new Date(dateInput); // Válido, parsear como UTC
      }

      // String sin timezone - probablemente sea hora local, necesita conversión
      console.warn(`⚠️ [TimezoneSynchronizationService] Fecha sin UTC recibida:`, dateInput);
      // Aquí podrías intentar convertir, pero es mejor fallar fast
      throw new BadRequestException(
        `La fecha debe estar en formato UTC ISO 8601: ${dateInput}. ` +
        `Ejemplos válidos: "2026-03-06T15:00:00Z" o "2026-03-06T15:00:00.000Z"`
      );
    }

    throw new BadRequestException(`Tipo de fecha inválido: ${typeof dateInput}`);
  }

  /**
   * Normaliza un DTO: convierte todas las fechas a UTC
   * Usado en interceptores para procesar requests antes de guardar
   */
  async normalizeDto(clinicId: string, dto: any): Promise<any> {
    if (!dto) {
      return dto;
    }

    const normalized = { ...dto };

    // Lista de campos de fecha conocidos en la aplicación
    const dateFields = [
      'scheduledAt',
      'scheduled_at',
      'startDate',
      'start_date',
      'endDate',
      'end_date',
      'sentAt',
      'sent_at',
      'readAt',
      'read_at',
      'confirmedAt',
      'confirmed_at',
      'completedAt',
      'completed_at',
      'cancelledAt',
      'cancelled_at',
      'lastLoginAt',
      'last_login',
      'deactivatedAt',
      'deactivated_at',
      'suspendedAt',
      'suspended_at',
      'lastVerifiedAt',
      'last_verified_at',
    ];

    // Procesar cada campo de fecha
    for (const field of dateFields) {
      if (field in normalized && normalized[field]) {
        try {
          normalized[field] = await this.ensureUtc(clinicId, normalized[field]);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(`Error normalizando ${field}:`, errorMessage);
          throw error; // Fallar fast si hay error
        }
      }
    }

    return normalized;
  }

  /**
   * Log de auditoría para rastrear qué fechas se guardan
   * Útil para debuggear problemas de timezone
   */
  logDateTimeSave(entityName: string, field: string, utcDate: Date): void {
    if (!utcDate) return;

    console.log(`📅 [TIMEZONE] Guardando ${entityName}.${field}:`, {
      utcIso: utcDate.toISOString(),
      timestamp: utcDate.getTime(),
      valid: this.isValidUtcFormat(utcDate.toISOString()),
    });
  }

  /**
   * Convierte una fecha UTC para mostrarla en timezone local
   * Usado en servicios de lectura/lectura
   */
  convertUtcToLocalForDisplay(utcDate: Date, clinicTimezone: string): {
    utcDate: Date;
    localDate: Date;
    localString: string;
  } | null {
    if (!utcDate || !clinicTimezone) {
      return null;
    }

    const localDate = utcToZonedTime(utcDate, clinicTimezone);

    return {
      utcDate,
      localDate,
      localString: formatTz(localDate, 'yyyy-MM-dd HH:mm', { timeZone: clinicTimezone }),
    };
  }

  /**
   * Valida que todos los appointmentsde una BD estén en UTC
   * Útil después de migraciones
   */
  async validateDatabaseTimestamps(
    queryRunner: any,
    tableName: string,
    dateColumns: string[]
  ): Promise<{
    totalRows: number;
    validUtcRows: number;
    invalidRows: Array<{ id: string; column: string; value: string }>;
  }> {
    const query = `SELECT id, ${dateColumns.join(', ')} FROM ${tableName}`;
    const rows = await queryRunner.query(query);

    const invalid = [];
    let validCount = 0;

    for (const row of rows) {
      for (const col of dateColumns) {
        if (row[col]) {
          const dateStr = new Date(row[col]).toISOString();
          if (this.isValidUtcFormat(dateStr)) {
            validCount++;
          } else {
            invalid.push({
              id: row.id,
              column: col,
              value: dateStr,
            });
          }
        }
      }
    }

    return {
      totalRows: rows.length,
      validUtcRows: validCount,
      invalidRows: invalid,
    };
  }
}
