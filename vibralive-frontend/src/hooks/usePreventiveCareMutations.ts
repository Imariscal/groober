import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getPreventiveEvents,
  getUpcomingEvents,
  getOverdueEvents,
  getPreventiveEventById,
  getEventsByPet,
  createPreventiveEvent,
  updatePreventiveEvent,
  completePreventiveEvent,
  reschedulePreventiveEvent,
  cancelPreventiveEvent,
  getPetEventHistory,
} from '@/lib/preventive-care-api';
import {
  CreatePetPreventiveCareEventDto,
  UpdatePetPreventiveCareEventDto,
  PreventiveEventResponseDto,
} from '@/types/preventive-care';

const PREVENTIVE_CARE_QUERY_KEY = 'preventive-care';

/**
 * Query hook for fetching preventive events with filters
 */
export function usePreventiveEventsQuery(filters?: Record<string, any>) {
  return useQuery({
    queryKey: [PREVENTIVE_CARE_QUERY_KEY, 'events', filters],
    queryFn: () => getPreventiveEvents(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Query hook for fetching upcoming preventive events
 */
export function useUpcomingEventsQuery(days: number = 30) {
  return useQuery({
    queryKey: [PREVENTIVE_CARE_QUERY_KEY, 'upcoming', days],
    queryFn: () => getUpcomingEvents(days),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Query hook for fetching overdue preventive events
 */
export function useOverdueEventsQuery() {
  return useQuery({
    queryKey: [PREVENTIVE_CARE_QUERY_KEY, 'overdue'],
    queryFn: getOverdueEvents,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Query hook for fetching single preventive event
 */
export function usePreventiveEventQuery(eventId: string) {
  return useQuery({
    queryKey: [PREVENTIVE_CARE_QUERY_KEY, 'event', eventId],
    queryFn: () => getPreventiveEventById(eventId),
    enabled: !!eventId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Query hook for fetching pet's preventive events
 */
export function usePetPreventiveHistoryQuery(petId: string, filters?: Record<string, any>) {
  return useQuery({
    queryKey: [PREVENTIVE_CARE_QUERY_KEY, 'pet', petId, filters],
    queryFn: () => getPetEventHistory(petId, filters),
    enabled: !!petId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Mutation hook for creating preventive events
 */
export function useCreatePreventiveEventMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreatePetPreventiveCareEventDto) => createPreventiveEvent(dto),
    onSuccess: () => {
      // Invalidate all preventive care queries
      queryClient.invalidateQueries({ queryKey: [PREVENTIVE_CARE_QUERY_KEY] });
    },
  });
}

/**
 * Mutation hook for updating preventive events
 */
export function useUpdatePreventiveEventMutation(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: UpdatePetPreventiveCareEventDto) =>
      updatePreventiveEvent(eventId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PREVENTIVE_CARE_QUERY_KEY] });
    },
  });
}

/**
 * Mutation hook for completing preventive events
 */
export function useCompletePreventiveEventMutation(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => completePreventiveEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PREVENTIVE_CARE_QUERY_KEY] });
    },
  });
}

/**
 * Mutation hook for rescheduling preventive events
 */
export function useReschedulePreventiveEventMutation(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (nextDueAt: Date) => reschedulePreventiveEvent(eventId, nextDueAt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PREVENTIVE_CARE_QUERY_KEY] });
    },
  });
}

/**
 * Mutation hook for canceling preventive events
 */
export function useCancelPreventiveEventMutation(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => cancelPreventiveEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PREVENTIVE_CARE_QUERY_KEY] });
    },
  });
}
