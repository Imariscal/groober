'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { ClinicCalendarException } from '@/types';
import { clinicConfigurationsApi } from '@/api/clinic-configurations-api';
import { getClinicDateKey } from '@/lib/datetime-tz';
import { useClinicTimezone } from './useClinicTimezone';

interface UseClinicCalendarExceptionsProps {
  start: Date;
  end: Date;
  enabled?: boolean;
}

interface UseClinicCalendarExceptionsResult {
  exceptions: ClinicCalendarException[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useClinicCalendarExceptions({
  start,
  end,
  enabled = true,
}: UseClinicCalendarExceptionsProps): UseClinicCalendarExceptionsResult {
  const [exceptions, setExceptions] = useState<ClinicCalendarException[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const clinicTimezone = useClinicTimezone();

  const fetchExceptions = useCallback(async () => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const fromDate = getClinicDateKey(start, clinicTimezone);
      const toDate = getClinicDateKey(end, clinicTimezone);

      const data = await clinicConfigurationsApi.getExceptions(fromDate, toDate);
      setExceptions(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error fetching calendar exceptions';
      setError(message);
      console.error('[useClinicCalendarExceptions]', message);
      setExceptions([]);
    } finally {
      setIsLoading(false);
    }
  }, [start, end, enabled, clinicTimezone]);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      fetchExceptions();
    }, 300);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [fetchExceptions]);

  const refetch = useCallback(async () => {
    await fetchExceptions();
  }, [fetchExceptions]);

  return { exceptions, isLoading, error, refetch };
}
