import { useState, useEffect } from 'react';
import { reportsApi } from '@/lib/reports-api';
import { RevenueReportResponse } from '@/types/reports';

interface UseRevenueReportParams {
  period?: 'today' | 'week' | 'month' | 'year' | 'custom';
  startDate?: string;
  endDate?: string;
  locationType?: 'CLINIC' | 'HOME';
  statuses?: string[];
}

export function useRevenueReport({
  period = 'month',
  startDate,
  endDate,
  locationType,
  statuses,
}: UseRevenueReportParams = {}) {
  const [data, setData] = useState<RevenueReportResponse | null>(null);
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

        console.log('useRevenueReport - fetching data:', { period, startDate, endDate, locationType, statuses });
        const response = await reportsApi.getRevenueReport({ period, startDate, endDate, locationType, statuses });
        console.log('useRevenueReport - received response:', response);
        setData(response);
      } catch (err) {
        console.error('useRevenueReport - error:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar datos');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [period, startDate, endDate, locationType, statuses]);

  return { data, loading, error };
}
