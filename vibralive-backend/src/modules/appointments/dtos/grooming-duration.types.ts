/**
 * Tipos de Grooming - Cálculo automático de duraciones
 * Defines interfaces and constants for automatic grooming appointment duration calculation
 */

import { IsString, IsArray, IsNotEmpty } from 'class-validator';

export interface DurationSlot {
  minutes: number;
  label: string; // "30 min", "1 hora", etc.
  hours: number;
  mins: number;
}

export interface ServiceDurationBreakdown {
  serviceId: string;
  serviceName: string;
  duration: number; // En minutos
  petSize: string; // XS, S, M, L, XL
}

export interface DurationCalculation {
  // Detail of calculation
  servicesTotal: number; // Suma bruta de servicios
  comboReduction: number; // Minutos reducidos por combos
  calculatedDuration: number; // Después de aplicar combos
  roundedDuration: number; // Redondeado a slot estándar

  // Breakdown by service
  breakdown: ServiceDurationBreakdown[];

  // Metadata
  appliedCombos: string[]; // ["baño_corte"] si aplica
  slot: DurationSlot; // Slot final utilizado
}

export class CalculateGroomingDurationDto {
  @IsString()
  @IsNotEmpty()
  petId!: string;

  @IsArray()
  @IsNotEmpty()
  serviceIds!: string[]; // IDs de servicios seleccionados
}

// Duration slots available in the system
export const DURATION_SLOTS: DurationSlot[] = [
  { minutes: 30, label: '30 minutos', hours: 0, mins: 30 },
  { minutes: 45, label: '45 minutos', hours: 0, mins: 45 },
  { minutes: 60, label: '1 hora', hours: 1, mins: 0 },
  { minutes: 75, label: '1 hora 15 min', hours: 1, mins: 15 },
  { minutes: 90, label: '1 hora 30 min', hours: 1, mins: 30 },
  { minutes: 105, label: '1 hora 45 min', hours: 1, mins: 45 },
  { minutes: 120, label: '2 horas', hours: 2, mins: 0 },
  { minutes: 135, label: '2 horas 15 min', hours: 2, mins: 15 },
  { minutes: 150, label: '2 horas 30 min', hours: 2, mins: 30 },
  { minutes: 165, label: '2 horas 45 min', hours: 2, mins: 45 },
  { minutes: 180, label: '3 horas', hours: 3, mins: 0 },
  { minutes: 240, label: '4 horas', hours: 4, mins: 0 },
  { minutes: 300, label: '5 horas', hours: 5, mins: 0 },
  { minutes: 360, label: '6 horas', hours: 6, mins: 0 },
  { minutes: 420, label: '7 horas', hours: 7, mins: 0 },
  { minutes: 480, label: '8 horas', hours: 8, mins: 0 },
];
