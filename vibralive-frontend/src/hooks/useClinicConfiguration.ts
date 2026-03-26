'use client';

import { useState, useCallback, useEffect } from 'react';
import { ClinicConfiguration } from '@/types';
import { clinicConfigurationsApi } from '@/api/clinic-configurations-api';

interface UseClinicConfigurationResult {
  config: ClinicConfiguration | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const CLINIC_CONFIG_STORAGE_KEY = 'clinic_configuration';

export function useClinicConfiguration(): UseClinicConfigurationResult {
  // ✅ Initialize with null (SSR-safe, no localStorage in initialState)
  const [config, setConfig] = useState<ClinicConfiguration | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasHydrated, setHasHydrated] = useState(false);

  const fetchConfig = useCallback(async () => {
    setError(null);

    try {
      const data = await clinicConfigurationsApi.getConfiguration();
      setConfig(data);
      // Save to localStorage for instant access on next load
      if (typeof window !== 'undefined') {
        localStorage.setItem(CLINIC_CONFIG_STORAGE_KEY, JSON.stringify(data));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error fetching configuration';
      setError(message);
      console.error('[useClinicConfiguration]', message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ✅ Hydrate from localStorage AFTER client mount
  useEffect(() => {
    // Load from localStorage and set state first
    try {
      const stored = localStorage.getItem(CLINIC_CONFIG_STORAGE_KEY);
      if (stored) {
        const cached = JSON.parse(stored);
        setConfig(cached);
      }
    } catch (e) {
      console.error('[useClinicConfiguration] Failed to parse localStorage:', e);
    }
    setHasHydrated(true);
  }, []);

  // ✅ Fetch fresh config AFTER hydration
  useEffect(() => {
    if (hasHydrated) {
      fetchConfig();
    }
  }, [hasHydrated, fetchConfig]);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    await fetchConfig();
  }, [fetchConfig]);

  return { config, isLoading, error, refetch };
}
