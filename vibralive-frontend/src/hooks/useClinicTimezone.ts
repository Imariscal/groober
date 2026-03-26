'use client';

import { useMemo } from 'react';
import { useClinicConfiguration } from './useClinicConfiguration';

const CLINIC_CONFIG_STORAGE_KEY = 'clinic_configuration';

export function useClinicTimezone(): string {
  const { config } = useClinicConfiguration();

  return useMemo(() => {
    // Priority 1: Use config from state (loaded from localStorage on mount)
    if (config?.timezone) {
      return config.timezone;
    }

    // Priority 2: Read directly from localStorage as fallback
    // This handles case where config is still loading but localStorage has cached value
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(CLINIC_CONFIG_STORAGE_KEY);
        const parsed = stored ? JSON.parse(stored) : null;
        if (parsed?.timezone) {
          return parsed.timezone;
        }
      } catch (e) {
        console.error('[useClinicTimezone] Failed to read from localStorage:', e);
      }
    }

    // Fallback to default
    return 'America/Monterrey';
  }, [config?.timezone]);
}

