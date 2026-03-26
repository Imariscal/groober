import { api } from '@/lib/api';

export interface VeterinarianAvailability {
  id: string;
  veterinarian_id: string;
  day_of_week: number; // 0=Monday, 6=Sunday
  start_time: string; // HH:mm
  end_time: string; // HH:mm
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateVeterinarianAvailabilityDto {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active?: boolean;
}

export interface UpdateVeterinarianAvailabilityDto {
  start_time?: string;
  end_time?: string;
  is_active?: boolean;
}

export interface VeterinarianUnavailablePeriod {
  id: string;
  veterinarian_id: string;
  reason: 'VACATION' | 'SICK_LEAVE' | 'REST_DAY' | 'PERSONAL' | 'OTHER';
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  is_all_day: boolean;
  start_time?: string | null;
  end_time?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateVeterinarianUnavailablePeriodDto {
  reason: 'VACATION' | 'SICK_LEAVE' | 'REST_DAY' | 'PERSONAL' | 'OTHER';
  start_date: string;
  end_date: string;
  is_all_day?: boolean;
  start_time?: string;
  end_time?: string;
  notes?: string;
}

export interface UpdateVeterinarianUnavailablePeriodDto {
  reason?: 'VACATION' | 'SICK_LEAVE' | 'REST_DAY' | 'PERSONAL' | 'OTHER';
  start_date?: string;
  end_date?: string;
  is_all_day?: boolean;
  start_time?: string;
  end_time?: string;
  notes?: string;
}

export interface VeterinarianCapacity {
  id: string;
  veterinarian_id: string;
  date: string; // YYYY-MM-DD
  max_appointments: number;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateVeterinarianCapacityDto {
  date: string;
  max_appointments: number;
  notes?: string;
}

export interface UpdateVeterinarianCapacityDto {
  max_appointments?: number;
  notes?: string;
}

export interface UpdateVeterinarianDto {
  displayName?: string;
  specialty?: string;
  licenseNumber?: string;
  calendarColor?: string;
  isBookable?: boolean;
}

class VeterinariansApi {
  /**
   * GET /api/clinics/:clinicId/veterinarians
   */
  async listVeterinarians(clinicId: string) {
    try {
      const response = await api.get(`/clinics/${clinicId}/veterinarians`);
      // Response is already the array, not wrapped in .data
      return Array.isArray(response) ? response : (Array.isArray(response.data) ? response.data : (response.data?.data || []));
    } catch (error: any) {
      console.error('[VeterinariansApi] Error listing veterinarians:', error);
      throw error;
    }
  }

  /**
   * PUT /api/clinics/:clinicId/veterinarians/:veterinarianId
   */
  async updateVeterinarian(
    clinicId: string,
    veterinarianId: string,
    payload: UpdateVeterinarianDto,
  ) {
    try {
      const response = await api.put(
        `/clinics/${clinicId}/veterinarians/${veterinarianId}`,
        payload,
      );
      return response.data?.data || response.data;
    } catch (error: any) {
      console.error('[VeterinariansApi] Error updating veterinarian:', error);
      throw error;
    }
  }

  // ============= AVAILABILITY ENDPOINTS =============

  /**
   * POST /api/clinics/:clinicId/veterinarians/:veterinarianId/availabilities
   */
  async createAvailability(
    clinicId: string,
    veterinarianId: string,
    payload: CreateVeterinarianAvailabilityDto,
  ) {
    try {
      const response = await api.post(
        `/clinics/${clinicId}/veterinarians/${veterinarianId}/availabilities`,
        payload,
      );
      return response.data?.data || response.data;
    } catch (error: any) {
      console.error('[VeterinariansApi] Error creating availability:', error);
      throw error;
    }
  }

  /**
   * GET /api/clinics/:clinicId/veterinarians/:veterinarianId/availabilities
   */
  async listAvailabilities(clinicId: string, veterinarianId: string) {
    try {
      const response = await api.get(
        `/clinics/${clinicId}/veterinarians/${veterinarianId}/availabilities`,
      );
      return Array.isArray(response) ? response : (Array.isArray(response.data) ? response.data : (response.data?.data || []));
    } catch (error: any) {
      console.error('[VeterinariansApi] Error listing availabilities:', error);
      throw error;
    }
  }

  /**
   * PUT /api/clinics/:clinicId/veterinarians/:veterinarianId/availabilities/:availabilityId
   */
  async updateAvailability(
    clinicId: string,
    veterinarianId: string,
    availabilityId: string,
    payload: UpdateVeterinarianAvailabilityDto,
  ) {
    try {
      const response = await api.put(
        `/clinics/${clinicId}/veterinarians/${veterinarianId}/availabilities/${availabilityId}`,
        payload,
      );
      return response.data?.data || response.data;
    } catch (error: any) {
      console.error('[VeterinariansApi] Error updating availability:', error);
      throw error;
    }
  }

  /**
   * DELETE /api/clinics/:clinicId/veterinarians/:veterinarianId/availabilities/:availabilityId
   */
  async deleteAvailability(
    clinicId: string,
    veterinarianId: string,
    availabilityId: string,
  ) {
    try {
      await api.delete(
        `/clinics/${clinicId}/veterinarians/${veterinarianId}/availabilities/${availabilityId}`,
      );
    } catch (error: any) {
      console.error('[VeterinariansApi] Error deleting availability:', error);
      throw error;
    }
  }

  // ============= UNAVAILABLE PERIOD ENDPOINTS =============

  /**
   * POST /api/clinics/:clinicId/veterinarians/:veterinarianId/unavailable-periods
   */
  async createUnavailablePeriod(
    clinicId: string,
    veterinarianId: string,
    payload: CreateVeterinarianUnavailablePeriodDto,
  ) {
    try {
      const response = await api.post(
        `/clinics/${clinicId}/veterinarians/${veterinarianId}/unavailable-periods`,
        payload,
      );
      return response.data?.data || response.data;
    } catch (error: any) {
      console.error('[VeterinariansApi] Error creating unavailable period:', error);
      throw error;
    }
  }

  /**
   * GET /api/clinics/:clinicId/veterinarians/:veterinarianId/unavailable-periods
   */
  async listUnavailablePeriods(clinicId: string, veterinarianId: string) {
    try {
      const response = await api.get(
        `/clinics/${clinicId}/veterinarians/${veterinarianId}/unavailable-periods`,
      );
      return Array.isArray(response) ? response : (Array.isArray(response.data) ? response.data : (response.data?.data || []));
    } catch (error: any) {
      console.error('[VeterinariansApi] Error listing unavailable periods:', error);
      throw error;
    }
  }

  /**
   * PUT /api/clinics/:clinicId/veterinarians/:veterinarianId/unavailable-periods/:periodId
   */
  async updateUnavailablePeriod(
    clinicId: string,
    veterinarianId: string,
    periodId: string,
    payload: UpdateVeterinarianUnavailablePeriodDto,
  ) {
    try {
      const response = await api.put(
        `/clinics/${clinicId}/veterinarians/${veterinarianId}/unavailable-periods/${periodId}`,
        payload,
      );
      return response.data?.data || response.data;
    } catch (error: any) {
      console.error('[VeterinariansApi] Error updating unavailable period:', error);
      throw error;
    }
  }

  /**
   * DELETE /api/clinics/:clinicId/veterinarians/:veterinarianId/unavailable-periods/:periodId
   */
  async deleteUnavailablePeriod(
    clinicId: string,
    veterinarianId: string,
    periodId: string,
  ) {
    try {
      await api.delete(
        `/clinics/${clinicId}/veterinarians/${veterinarianId}/unavailable-periods/${periodId}`,
      );
    } catch (error: any) {
      console.error('[VeterinariansApi] Error deleting unavailable period:', error);
      throw error;
    }
  }

  // ============= CAPACITY ENDPOINTS =============

  /**
   * POST /api/clinics/:clinicId/veterinarians/:veterinarianId/capacities
   */
  async createCapacity(
    clinicId: string,
    veterinarianId: string,
    payload: CreateVeterinarianCapacityDto,
  ) {
    try {
      const response = await api.post(
        `/clinics/${clinicId}/veterinarians/${veterinarianId}/capacities`,
        payload,
      );
      return response.data?.data || response.data;
    } catch (error: any) {
      console.error('[VeterinariansApi] Error creating capacity:', error);
      throw error;
    }
  }

  /**
   * GET /api/clinics/:clinicId/veterinarians/:veterinarianId/capacities
   */
  async listCapacities(clinicId: string, veterinarianId: string) {
    try {
      const response = await api.get(
        `/clinics/${clinicId}/veterinarians/${veterinarianId}/capacities`,
      );
      return Array.isArray(response) ? response : (Array.isArray(response.data) ? response.data : (response.data?.data || []));
    } catch (error: any) {
      console.error('[VeterinariansApi] Error listing capacities:', error);
      throw error;
    }
  }

  /**
   * PUT /api/clinics/:clinicId/veterinarians/:veterinarianId/capacities/:capacityId
   */
  async updateCapacity(
    clinicId: string,
    veterinarianId: string,
    capacityId: string,
    payload: UpdateVeterinarianCapacityDto,
  ) {
    try {
      const response = await api.put(
        `/clinics/${clinicId}/veterinarians/${veterinarianId}/capacities/${capacityId}`,
        payload,
      );
      return response.data?.data || response.data;
    } catch (error: any) {
      console.error('[VeterinariansApi] Error updating capacity:', error);
      throw error;
    }
  }

  /**
   * DELETE /api/clinics/:clinicId/veterinarians/:veterinarianId/capacities/:capacityId
   */
  async deleteCapacity(
    clinicId: string,
    veterinarianId: string,
    capacityId: string,
  ) {
    try {
      await api.delete(
        `/clinics/${clinicId}/veterinarians/${veterinarianId}/capacities/${capacityId}`,
      );
    } catch (error: any) {
      console.error('[VeterinariansApi] Error deleting capacity:', error);
      throw error;
    }
  }
}

export const veterinariansApi = new VeterinariansApi();
