/**
 * Grooming Duration Utilities
 * Funciones para calcular y redondear duraciones automáticamente
 */

import { 
  DURATION_SLOTS, 
  DurationSlot 
} from '../dtos/grooming-duration.types';

/**
 * Encuentra el slot de duración más cercano
 * @param minutes Minutos a redondear
 * @returns Slot más cercano
 */
export function findNearestSlot(minutes: number): DurationSlot {
  // Límites
  if (minutes < 30) {
    return DURATION_SLOTS[0]; // 30 min mínimo
  }
  if (minutes > 480) {
    return DURATION_SLOTS[DURATION_SLOTS.length - 1]; // 480 máx
  }

  // Buscar slot más cercano
  let closestSlot = DURATION_SLOTS[0];
  let minDifference = Math.abs(minutes - closestSlot.minutes);

  for (const slot of DURATION_SLOTS) {
    const difference = Math.abs(minutes - slot.minutes);

    // Si la diferencia es igual, preferir ARRIBA (slot más grande)
    if (difference < minDifference) {
      closestSlot = slot;
      minDifference = difference;
    } else if (
      difference === minDifference &&
      slot.minutes > closestSlot.minutes
    ) {
      closestSlot = slot;
    }
  }

  return closestSlot;
}

/**
 * Convierte minutos a formato legible (ejemplo: "1h 30min")
 */
export function formatMinutesToHuman(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins} min`;
  }
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}min`;
}

/**
 * Aplica reglas de combos (reducciones de tiempo)
 * Regla: Baño + Corte = -10 minutos
 */
export function applyComboReductions(serviceNames: string[]): {
  reduction: number;
  appliedCombos: string[];
} {
  let totalReduction = 0;
  const appliedCombos: string[] = [];

  // Regla 1: Baño + Corte = -10 min
  const hasBarno = serviceNames.some(name => 
    name.toLowerCase().includes('baño')
  );
  const hasCorte = serviceNames.some(name => 
    name.toLowerCase().includes('corte')
  );

  if (hasBarno && hasCorte) {
    totalReduction += 10;
    appliedCombos.push('baño_corte');
  }

  return { reduction: totalReduction, appliedCombos };
}
