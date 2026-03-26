/**
 * Utility to build CreateAppointmentPayload with proper assignment handling
 */

import {
  CreateAppointmentPayload,
  AppointmentLocationTypeType,
  AssignmentSourceType,
} from '@/types';

export interface AppointmentFormData {
  pet_id: string;
  client_id: string;
  scheduled_at: string;
  reason?: string;
  duration_minutes?: number;
  veterinarian_id?: string;
  location_type: AppointmentLocationTypeType;
  address_id?: string;
  assignment_source?: AssignmentSourceType;
  assigned_staff_user_id?: string;
}

/**
 * Builds a CreateAppointmentPayload from form data with proper validation
 * 
 * Rules:
 * - CLINIC appointments: assignment_source = 'NONE', assigned_staff_user_id = undefined
 * - HOME appointments: 
 *   - address_id is required
 *   - Can have assignment_source = 'NONE' (manual later) or 'MANUAL_RECEPTION' (with optional stylist)
 */
export function buildAppointmentPayload(
  formData: AppointmentFormData,
): CreateAppointmentPayload {
  let payload: CreateAppointmentPayload = {
    pet_id: formData.pet_id,
    client_id: formData.client_id,
    scheduled_at: formData.scheduled_at,
    reason: formData.reason,
    duration_minutes: formData.duration_minutes,
    veterinarian_id: formData.veterinarian_id,
    location_type: formData.location_type,
  };

  // Handle location-specific fields
  if (formData.location_type === 'HOME') {
    // HOME appointments require address_id
    if (!formData.address_id) {
      throw new Error('address_id is required for HOME appointments');
    }
    payload.address_id = formData.address_id;

    // Set assignment fields for HOME
    payload.assignment_source = formData.assignment_source || 'NONE';
    
    // Only include assigned_staff_user_id if it's provided
    if (formData.assigned_staff_user_id) {
      payload.assigned_staff_user_id = formData.assigned_staff_user_id;
    }
  } else {
    // CLINIC appointments: no assignment at creation
    payload.assignment_source = 'NONE';
    // Don't include assigned_staff_user_id for CLINIC
  }

  return payload;
}

/**
 * Validates appointment data before submission
 */
export function validateAppointmentData(
  formData: AppointmentFormData,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!formData.pet_id) {
    errors.push('Pet is required');
  }

  if (!formData.client_id) {
    errors.push('Client is required');
  }

  if (!formData.scheduled_at) {
    errors.push('Scheduled time is required');
  }

  if (formData.location_type === 'HOME' && !formData.address_id) {
    errors.push('Address is required for HOME appointments');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
