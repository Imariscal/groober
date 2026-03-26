import { useState, useEffect } from 'react';
import { reportsApi } from '@/lib/reports-api';
import { ClientsReportResponse } from '@/types/reports';

interface UseClientsReportParams {
  period?: 'today' | 'week' | 'month' | 'year' | 'custom';
  startDate?: string;
  endDate?: string;
  locationType?: 'CLINIC' | 'HOME';
  statuses?: string[];
}

export function useClientsReport({
  period = 'month',
  startDate,
  endDate,
  locationType,
  statuses,
}: UseClientsReportParams = {}) {
  const [data, setData] = useState<ClientsReportResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Validar fechas si es custom
        if (period === 'custom' && (!startDate || !endDate)) {
          setError('Selecciona fecha inicio y fin para rango custom');
          setLoading(false);
          return;
        }

        console.log('useClientsReport - fetching data:', { period, startDate, endDate, locationType, statuses });
        const response = await reportsApi.getClientsReport({ period, startDate, endDate, locationType, statuses });
        console.log('useClientsReport - received response:', response);
        setData(response);
      } catch (err) {
        console.error('useClientsReport - error:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar datos');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [period, startDate, endDate, locationType, statuses]);

  return { data, loading, error };
}
