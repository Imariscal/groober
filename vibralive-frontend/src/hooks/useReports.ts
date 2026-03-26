'use client';

import { useEffect, useState } from 'react';
import { reportsApi } from '@/lib/reports-api';
import {
  RevenueReportResponse,
  AppointmentsReportResponse,
  ClientsReportResponse,
  ServicesReportResponse,
  PerformanceReportResponse,
  GeographyReportResponse,
  OverviewReportResponse,
} from '@/types/reports';

interface UseReportOptions {
  period?: 'today' | 'week' | 'month' | 'year' | 'custom';
  startDate?: string;
  endDate?: string;
  enabled?: boolean;
}

/**
 * Hook para obtener el reporte de ingresos
 */
export function useRevenueReport(options?: UseReportOptions) {
  const [data, setData] = useState<RevenueReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (options?.enabled === false) return;

    const fetchReport = async () => {
      try {
        setLoading(true);
        const result = await reportsApi.getRevenueReport(options);
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading report');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [options?.period, options?.startDate, options?.endDate, options?.enabled]);

  return { data, loading, error };
}

/**
 * Hook para obtener el reporte de citas
 */
export function useAppointmentsReport(options?: UseReportOptions) {
  const [data, setData] = useState<AppointmentsReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (options?.enabled === false) return;

    const fetchReport = async () => {
      try {
        setLoading(true);
        const result = await reportsApi.getAppointmentsReport(options);
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading report');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [options?.period, options?.startDate, options?.endDate, options?.enabled]);

  return { data, loading, error };
}

/**
 * Hook para obtener el reporte de clientes
 */
export function useClientsReport(options?: UseReportOptions) {
  const [data, setData] = useState<ClientsReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (options?.enabled === false) return;

    const fetchReport = async () => {
      try {
        setLoading(true);
        const result = await reportsApi.getClientsReport(options);
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading report');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [options?.period, options?.startDate, options?.endDate, options?.enabled]);

  return { data, loading, error };
}

/**
 * Hook para obtener el reporte de servicios
 */
export function useServicesReport(options?: UseReportOptions) {
  const [data, setData] = useState<ServicesReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (options?.enabled === false) return;

    const fetchReport = async () => {
      try {
        setLoading(true);
        const result = await reportsApi.getServicesReport(options);
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading report');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [options?.period, options?.startDate, options?.endDate, options?.enabled]);

  return { data, loading, error };
}

/**
 * Hook para obtener el reporte de performance
 */
export function usePerformanceReport(options?: UseReportOptions) {
  const [data, setData] = useState<PerformanceReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (options?.enabled === false) return;

    const fetchReport = async () => {
      try {
        setLoading(true);
        const result = await reportsApi.getPerformanceReport(options);
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading report');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [options?.period, options?.startDate, options?.endDate, options?.enabled]);

  return { data, loading, error };
}

/**
 * Hook para obtener el reporte de geografía
 */
export function useGeographyReport(options?: UseReportOptions) {
  const [data, setData] = useState<GeographyReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (options?.enabled === false) return;

    const fetchReport = async () => {
      try {
        setLoading(true);
        const result = await reportsApi.getGeographyReport(options);
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading report');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [options?.period, options?.startDate, options?.endDate, options?.enabled]);

  return { data, loading, error };
}

/**
 * Hook para obtener el reporte general (overview)
 */
export function useOverviewReport(options?: UseReportOptions) {
  const [data, setData] = useState<OverviewReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('useOverviewReport - useEffect triggered with options:', options);
    if (options?.enabled === false) {
      console.log('useOverviewReport - disabled');
      return;
    }

    const fetchReport = async () => {
      try {
        setLoading(true);
        console.log('useOverviewReport - fetching report...');
        const result = await reportsApi.getOverviewReport(options);
        console.log('useOverviewReport - fetch successful:', result);
        setData(result);
        setError(null);
      } catch (err) {
        console.error('useOverviewReport - fetch failed:', err);
        setError(err instanceof Error ? err.message : 'Error loading report');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [options?.period, options?.startDate, options?.endDate, options?.enabled]);

  return { data, loading, error };
}
