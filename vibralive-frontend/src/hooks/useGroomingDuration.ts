/**
 * Hook: useGroomingDuration
 * Maneja el cálculo automático de duración para citas grooming
 */

import { useState, useCallback } from 'react';
import { appointmentsApi } from '@/lib/appointments-api';

interface DurationInfo {
  calculation: {
    servicesTotal: number;
    comboReduction: number;
    calculatedDuration: number;
    roundedDuration: number;
    breakdown: Array<{
      serviceId: string;
      serviceName: string;
      duration: number;
      petSize: string;
    }>;
    appliedCombos: string[];
    slot: {
      minutes: number;
      label: string;
      hours: number;
      mins: number;
    };
  };
  display: {
    breakdownText: string;
    totalText: string;
    slotLabel: string;
  };
}

export function useGroomingDuration() {
  const [durationInfo, setDurationInfo] = useState<DurationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateDuration = useCallback(
    async (petId: string, serviceIds: string[]) => {
      // Validar entrada
      if (!petId || serviceIds.length === 0) {
        console.warn('[useGroomingDuration] Faltan petId o serviceIds');
        setDurationInfo(null);
        return null;
      }

      console.log('[useGroomingDuration] Enviando POST a /appointments/grooming/calculate-duration:', {
        petId,
        serviceIds,
      });

      setIsLoading(true);
      setError(null);

      try {
        const response = await appointmentsApi.calculateGroomingDuration({
          petId,
          serviceIds,
        });

        console.log('[useGroomingDuration] Respuesta recibida:', response);
        
        if (!response || !response.calculation) {
          console.error('[useGroomingDuration] Respuesta inválida (sin calculation):', response);
          setError('Respuesta inválida del servidor');
          return null;
        }
        
        setDurationInfo(response);
        return response;
      } catch (err: any) {
        const errorMsg = err?.response?.data?.message || err?.message || 'Error calculando duración';
        const errorStatus = err?.response?.status;
        console.error('[useGroomingDuration] Error en el request:', {
          status: errorStatus,
          message: errorMsg,
          details: err?.response?.data,
          error: err,
        });
        setError(errorMsg);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setDurationInfo(null);
    setError(null);
  }, []);

  return {
    durationInfo,
    isLoading,
    error,
    calculateDuration,
    reset,
  };
}
