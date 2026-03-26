import { Appointment } from '@/types';

/**
 * Generic staff member interface - works with both Stylists and Veterinarians
 */
export interface StaffMember {
  id: string;
  userId: string;
  displayName: string;
  capacities?: Array<{ date: string; max_appointments: number }>;
}

/**
 * Capacity validation result
 */
export interface CapacityCheckResult {
  valid: boolean;
  reason?: string;
  currentCount?: number;
  maxCapacity?: number;
}

/**
 * Validates if a staff member (stylist or veterinarian) can attend an appointment
 * based on their daily capacity configuration.
 * 
 * Rules:
 * - If no capacities configured (null/undefined/empty) → Always valid
 * - If capacity configured for that date → Count current appointments and check limit
 * - Only counts appointments with matching serviceType and not CANCELLED/NO_SHOW
 */
export function validateStaffCapacity(
  staff: StaffMember,
  appointments: Appointment[],
  dateStr: string, // YYYY-MM-DD in clinic timezone
  serviceType: 'GROOMING' | 'MEDICAL',
): CapacityCheckResult {
  // No capacities configured → always valid
  if (!staff.capacities || staff.capacities.length === 0) {
    return { valid: true };
  }

  // Find capacity for this specific date
  const dayCapacity = staff.capacities.find((c) => c.date === dateStr);

  // No capacity configured for this date → always valid
  if (!dayCapacity || !dayCapacity.max_appointments || dayCapacity.max_appointments === 0) {
    return { valid: true };
  }

  // Count how many appointments this staff already has on this day for the same service type
  const appointmentsOnDay = appointments.filter((apt) => {
    // Must be assigned to this staff
    if (apt.assigned_staff_user_id !== staff.userId) return false;

    // Must be same service type
    if (apt.service_type !== serviceType) return false;

    // Exclude cancelled or no-show appointments
    if (apt.status === 'CANCELLED' || apt.status === 'NO_SHOW') return false;

    return true;
  }).length;

  // Validate capacity
  if (appointmentsOnDay >= dayCapacity.max_appointments) {
    return {
      valid: false,
      reason: `Capacidad alcanzada (${appointmentsOnDay}/${dayCapacity.max_appointments} citas ${serviceType === 'GROOMING' ? 'de grooming' : 'médicas'})`,
      currentCount: appointmentsOnDay,
      maxCapacity: dayCapacity.max_appointments,
    };
  }

  return {
    valid: true,
    currentCount: appointmentsOnDay,
    maxCapacity: dayCapacity.max_appointments,
  };
}
