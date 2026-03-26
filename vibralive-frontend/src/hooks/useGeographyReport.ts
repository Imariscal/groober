import { useState, useEffect } from 'react';
import { reportsApi } from '@/lib/reports-api';
import { GeographyReportResponse } from '@/types/reports';

export function useGeographyReport(period: 'today' | 'week' | 'month' | 'year' = 'month') {
  const [data, setData] = useState<GeographyReportResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('useGeographyReport - fetching data for period:', period);
        const response = await reportsApi.getGeographyReport({ period });
        console.log('useGeographyReport - received response:', response);
        setData(response);
      } catch (err) {
        console.error('useGeographyReport - error:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar datos');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [period]);

  return { data, loading, error };
}
