import { api } from '@/lib/api';

export interface StylistAvailability {
  id: string;
  stylist_id: string;
  day_of_week: number; // 0=Monday, 6=Sunday
  start_time: string; // HH:mm
  end_time: string; // HH:mm
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateStylistAvailabilityDto {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active?: boolean;
}

export interface UpdateStylistAvailabilityDto {
  start_time?: string;
  end_time?: string;
  is_active?: boolean;
}

export interface StylistUnavailablePeriod {
  id: string;
  stylist_id: string;
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

export interface CreateStylistUnavailablePeriodDto {
  reason: 'VACATION' | 'SICK_LEAVE' | 'REST_DAY' | 'PERSONAL' | 'OTHER';
  start_date: string;
  end_date: string;
  is_all_day?: boolean;
  start_time?: string;
  end_time?: string;
  notes?: string;
}

export interface UpdateStylistUnavailablePeriodDto {
  reason?: 'VACATION' | 'SICK_LEAVE' | 'REST_DAY' | 'PERSONAL' | 'OTHER';
  start_date?: string;
  end_date?: string;
  is_all_day?: boolean;
  start_time?: string;
  end_time?: string;
  notes?: string;
}

export interface StylistCapacity {
  id: string;
  stylist_id: string;
  date: string; // YYYY-MM-DD
  max_appointments: number;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateStylistCapacityDto {
  date: string;
  max_appointments: number;
  notes?: string;
}

export interface UpdateStylistCapacityDto {
  max_appointments?: number;
  notes?: string;
}

export interface UpdateStylistDto {
  type?: 'CLINIC' | 'HOME';
}

class StylistsApi {
  /**
   * GET /api/clinics/:clinicId/stylists
   */
  async listStylists(clinicId: string) {
    try {
      const response = await api.get(`/clinics/${clinicId}/stylists`);
      // Response is already the array, not wrapped in .data
      return Array.isArray(response) ? response : (Array.isArray(response.data) ? response.data : (response.data?.data || []));
    } catch (error: any) {
      console.error('[StylistsApi] Error listing stylists:', error);
      throw error;
    }
  }

  /**
   * PUT /api/clinics/:clinicId/stylists/:stylistId
   */
  async updateStylist(
    clinicId: string,
    stylistId: string,
    payload: UpdateStylistDto,
  ) {
    try {
      const response = await api.put(
        `/clinics/${clinicId}/stylists/${stylistId}`,
        payload,
      );
      return response.data?.data || response.data;
    } catch (error: any) {
      console.error('[StylistsApi] Error updating stylist:', error);
      throw error;
    }
  }

  // ============= AVAILABILITY ENDPOINTS =============

  /**
   * POST /api/clinics/:clinicId/stylists/:stylistId/availabilities
   */
  async createAvailability(
    clinicId: string,
    stylistId: string,
    payload: CreateStylistAvailabilityDto,
  ) {
    try {
      const response = await api.post(
        `/clinics/${clinicId}/stylists/${stylistId}/availabilities`,
        payload,
      );
      return response.data?.data || response.data;
    } catch (error: any) {
      console.error('[StylistsApi] Error creating availability:', error);
      throw error;
    }
  }

  /**
   * GET /api/clinics/:clinicId/stylists/:stylistId/availabilities
   */
  async listAvailabilities(clinicId: string, stylistId: string) {
    try {
      const response = await api.get(
        `/clinics/${clinicId}/stylists/${stylistId}/availabilities`,
      );
      return Array.isArray(response) ? response : (Array.isArray(response.data) ? response.data : (response.data?.data || []));
    } catch (error: any) {
      console.error('[StylistsApi] Error listing availabilities:', error);
      throw error;
    }
  }

  /**
   * PUT /api/clinics/:clinicId/stylists/:stylistId/availabilities/:availabilityId
   */
  async updateAvailability(
    clinicId: string,
    stylistId: string,
    availabilityId: string,
    payload: UpdateStylistAvailabilityDto,
  ) {
    try {
      const response = await api.put(
        `/clinics/${clinicId}/stylists/${stylistId}/availabilities/${availabilityId}`,
        payload,
      );
      return response.data?.data || response.data;
    } catch (error: any) {
      console.error('[StylistsApi] Error updating availability:', error);
      throw error;
    }
  }

  /**
   * DELETE /api/clinics/:clinicId/stylists/:stylistId/availabilities/:availabilityId
   */
  async deleteAvailability(
    clinicId: string,
    stylistId: string,
    availabilityId: string,
  ) {
    try {
      await api.delete(
        `/clinics/${clinicId}/stylists/${stylistId}/availabilities/${availabilityId}`,
      );
    } catch (error: any) {
      console.error('[StylistsApi] Error deleting availability:', error);
      throw error;
    }
  }

  // ============= UNAVAILABLE PERIOD ENDPOINTS =============

  /**
   * POST /api/clinics/:clinicId/stylists/:stylistId/unavailable-periods
   */
  async createUnavailablePeriod(
    clinicId: string,
    stylistId: string,
    payload: CreateStylistUnavailablePeriodDto,
  ) {
    try {
      const response = await api.post(
        `/clinics/${clinicId}/stylists/${stylistId}/unavailable-periods`,
        payload,
      );
      return response.data?.data || response.data;
    } catch (error: any) {
      console.error('[StylistsApi] Error creating unavailable period:', error);
      throw error;
    }
  }

  /**
   * GET /api/clinics/:clinicId/stylists/:stylistId/unavailable-periods
   */
  async listUnavailablePeriods(clinicId: string, stylistId: string) {
    try {
      const response = await api.get(
        `/clinics/${clinicId}/stylists/${stylistId}/unavailable-periods`,
      );
      return Array.isArray(response) ? response : (Array.isArray(response.data) ? response.data : (response.data?.data || []));
    } catch (error: any) {
      console.error('[StylistsApi] Error listing unavailable periods:', error);
      throw error;
    }
  }

  /**
   * PUT /api/clinics/:clinicId/stylists/:stylistId/unavailable-periods/:periodId
   */
  async updateUnavailablePeriod(
    clinicId: string,
    stylistId: string,
    periodId: string,
    payload: UpdateStylistUnavailablePeriodDto,
  ) {
    try {
      const response = await api.put(
        `/clinics/${clinicId}/stylists/${stylistId}/unavailable-periods/${periodId}`,
        payload,
      );
      return response.data?.data || response.data;
    } catch (error: any) {
      console.error('[StylistsApi] Error updating unavailable period:', error);
      throw error;
    }
  }

  /**
   * DELETE /api/clinics/:clinicId/stylists/:stylistId/unavailable-periods/:periodId
   */
  async deleteUnavailablePeriod(
    clinicId: string,
    stylistId: string,
    periodId: string,
  ) {
    try {
      await api.delete(
        `/clinics/${clinicId}/stylists/${stylistId}/unavailable-periods/${periodId}`,
      );
    } catch (error: any) {
      console.error('[StylistsApi] Error deleting unavailable period:', error);
      throw error;
    }
  }

  // ============= CAPACITY ENDPOINTS =============

  /**
   * POST /api/clinics/:clinicId/stylists/:stylistId/capacities
   */
  async createCapacity(
    clinicId: string,
    stylistId: string,
    payload: CreateStylistCapacityDto,
  ) {
    try {
      const response = await api.post(
        `/clinics/${clinicId}/stylists/${stylistId}/capacities`,
        payload,
      );
      return response.data?.data || response.data;
    } catch (error: any) {
      console.error('[StylistsApi] Error creating capacity:', error);
      throw error;
    }
  }

  /**
   * GET /api/clinics/:clinicId/stylists/:stylistId/capacities
   */
  async listCapacities(clinicId: string, stylistId: string) {
    try {
      const response = await api.get(
        `/clinics/${clinicId}/stylists/${stylistId}/capacities`,
      );
      return Array.isArray(response) ? response : (Array.isArray(response.data) ? response.data : (response.data?.data || []));
    } catch (error: any) {
      console.error('[StylistsApi] Error listing capacities:', error);
      throw error;
    }
  }

  /**
   * PUT /api/clinics/:clinicId/stylists/:stylistId/capacities/:capacityId
   */
  async updateCapacity(
    clinicId: string,
    stylistId: string,
    capacityId: string,
    payload: UpdateStylistCapacityDto,
  ) {
    try {
      const response = await api.put(
        `/clinics/${clinicId}/stylists/${stylistId}/capacities/${capacityId}`,
        payload,
      );
      return response.data?.data || response.data;
    } catch (error: any) {
      console.error('[StylistsApi] Error updating capacity:', error);
      throw error;
    }
  }

  /**
   * DELETE /api/clinics/:clinicId/stylists/:stylistId/capacities/:capacityId
   */
  async deleteCapacity(
    clinicId: string,
    stylistId: string,
    capacityId: string,
  ) {
    try {
      await api.delete(
        `/clinics/${clinicId}/stylists/${stylistId}/capacities/${capacityId}`,
      );
    } catch (error: any) {
      console.error('[StylistsApi] Error deleting capacity:', error);
      throw error;
    }
  }
}

export const stylistsApi = new StylistsApi();
