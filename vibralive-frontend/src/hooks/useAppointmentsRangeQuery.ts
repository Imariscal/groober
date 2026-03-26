/**
 * Hook para obtener citas en un rango de fechas
 * Usado por el calendario de GroomingAppointments
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { formatInTimeZone } from 'date-fns-tz';
import { Appointment } from '@/types';
import { appointmentsApi } from '@/lib/appointments-api';

interface UseAppointmentsRangeQueryProps {
  start: Date;
  end: Date;
  enabled?: boolean;
  clinicTimezone: string;
  serviceType?: 'MEDICAL' | 'GROOMING'; // Filter by service type
}

interface UseAppointmentsRangeQueryResult {
  appointments: Appointment[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useAppointmentsRangeQuery({
  start,
  end,
  enabled = true,
  clinicTimezone,
  serviceType,
}: UseAppointmentsRangeQueryProps): UseAppointmentsRangeQueryResult {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchAppointments = useCallback(async (signal?: AbortSignal) => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      // 🎯 Use formatInTimeZone to correctly format dates considering clinic timezone
      // start/end are in clinic timezone context, format them properly
      const fromDate = formatInTimeZone(start, clinicTimezone, 'yyyy-MM-dd');
      const toDate = formatInTimeZone(end, clinicTimezone, 'yyyy-MM-dd');

      // Cancel previous request if there's one in progress
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      const response = await appointmentsApi.getAppointments({
        from: fromDate,
        to: toDate,
        ...(serviceType && { serviceType }), // Add serviceType filter if provided
      });

      if (!signal?.aborted) {
        // Handle both array and object responses
        const appointmentsData = Array.isArray(response) ? response : (response.data || []);
        setAppointments(appointmentsData);
        setError(null);
      }
    } catch (err) {
      // Ignore abort errors
      if ((err as any)?.name === 'AbortError') {
        return;
      }
      
      const message = err instanceof Error ? err.message : 'Error fetching appointments';
      setError(message);
      console.error('[useAppointmentsRangeQuery] timeout of 30000ms exceeded or error:', message);
    } finally {
      setIsLoading(false);
    }
  }, [start, end, enabled, clinicTimezone, serviceType]);

  useEffect(() => {
    // Debounce the fetch to avoid unnecessary requests when dates change rapidly
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      fetchAppointments();
    }, 300); // Wait 300ms before making the request

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      // Cancel in-flight requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchAppointments]);

  const refetch = useCallback(async () => {
    // Cancel debounce and fetch immediately
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    return new Promise<void>((resolve) => {
      setIsLoading(true);
      setError(null);

      // 🎯 Use formatInTimeZone to correctly format dates considering clinic timezone
      const fromDate = formatInTimeZone(start, clinicTimezone, 'yyyy-MM-dd');
      const toDate = formatInTimeZone(end, clinicTimezone, 'yyyy-MM-dd');

      // Cancel previous request if there's one in progress
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      appointmentsApi.getAppointments({
        from: fromDate,
        to: toDate,
        ...(serviceType && { serviceType }), // Add serviceType filter if provided
      })
        .then((response) => {
          // Handle both array and object responses
          const appointmentsData = Array.isArray(response) ? response : (response.data || []);
          setAppointments(appointmentsData);
          setError(null);
          resolve();
        })
        .catch((err) => {
          if ((err as any)?.name !== 'AbortError') {
            const message = err instanceof Error ? err.message : 'Error fetching appointments';
            setError(message);
            console.error('[useAppointmentsRangeQuery] refetch error:', message);
          }
          resolve(); // Resolve even on error
        })
        .finally(() => {
          setIsLoading(false);
        });
    });
  }, [start, end, clinicTimezone, serviceType]);

  return {
    appointments,
    isLoading,
    error,
    refetch,
  };
}
