import { useState, useEffect } from 'react';
import { reportsApi } from '@/lib/reports-api';
import { ServicesReportResponse } from '@/types/reports';

interface UseServicesReportParams {
  period?: 'today' | 'week' | 'month' | 'year' | 'custom';
  startDate?: string;
  endDate?: string;
  locationType?: 'CLINIC' | 'HOME';
  paid?: boolean;
  statuses?: string[];
}

export function useServicesReport({
  period = 'month',
  startDate,
  endDate,
  locationType,
  paid,
  statuses,
}: UseServicesReportParams = {}) {
  const [data, setData] = useState<ServicesReportResponse | null>(null);
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

        console.log('useServicesReport - fetching data:', { period, startDate, endDate, locationType, paid, statuses });
        const response = await reportsApi.getServicesReport({ period, startDate, endDate, locationType, paid, statuses });
        console.log('useServicesReport - received response:', response);
        setData(response);
      } catch (err) {
        console.error('useServicesReport - error:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar datos');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [period, startDate, endDate, locationType, paid, statuses]);

  return { data, loading, error };
}
