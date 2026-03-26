import { apiClient } from '@/lib/api-client';
import {
  CreatePetPreventiveCareEventDto,
  UpdatePetPreventiveCareEventDto,
  PreventiveEventResponseDto,
} from '@/types/preventive-care';

/**
 * Preventive Care API Client
 * Handles all preventive medical care event operations
 */

export async function getPreventiveEvents(
  filters?: Record<string, any>,
): Promise<{ data: PreventiveEventResponseDto[]; total: number }> {
  return apiClient.get('/visits', { params: filters });
}

export async function getUpcomingEvents(
  days?: number,
): Promise<PreventiveEventResponseDto[]> {
  return apiClient.get('/visits/upcoming', { params: { days: days || 30 } });
}

export async function getOverdueEvents(): Promise<PreventiveEventResponseDto[]> {
  return apiClient.get('/visits/overdue');
}

export async function getPreventiveEventById(
  eventId: string,
): Promise<PreventiveEventResponseDto> {
  return apiClient.get(`/visits/${eventId}`);
}

export async function getEventsByPet(
  petId: string,
): Promise<PreventiveEventResponseDto[]> {
  return apiClient.get(`/visits/pet/${petId}`);
}

export async function createPreventiveEvent(
  dto: CreatePetPreventiveCareEventDto,
): Promise<PreventiveEventResponseDto> {
  return apiClient.post('/visits', dto);
}

export async function updatePreventiveEvent(
  eventId: string,
  dto: UpdatePetPreventiveCareEventDto,
): Promise<PreventiveEventResponseDto> {
  return apiClient.put(`/visits/${eventId}`, dto);
}

export async function completePreventiveEvent(
  eventId: string,
): Promise<PreventiveEventResponseDto | null> {
  return apiClient.patch(`/visits/${eventId}/complete`, {});
}

export async function reschedulePreventiveEvent(
  eventId: string,
  nextDueAt: Date,
): Promise<PreventiveEventResponseDto> {
  return apiClient.put(`/visits/${eventId}/reschedule`, { nextDueAt });
}

export async function cancelPreventiveEvent(
  eventId: string,
): Promise<{ success: boolean; message: string }> {
  return apiClient.patch(`/visits/${eventId}/cancel`, {});
}

export async function getPetEventHistory(
  petId: string,
  filters?: Record<string, any>,
): Promise<{ data: PreventiveEventResponseDto[]; total: number }> {
  return apiClient.get(`/visits/history/${petId}`, { params: filters });
}
