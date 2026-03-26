import { apiClient } from './api-client';
import {
  RevenueReportResponse,
  AppointmentsReportResponse,
  ClientsReportResponse,
  ServicesReportResponse,
  PerformanceReportResponse,
  GeographyReportResponse,
  OverviewReportResponse,
} from '@/types/reports';

const BASE_URL = '/reports';

interface ReportParams {
  period?: 'today' | 'week' | 'month' | 'year' | 'custom';
  startDate?: string;
  endDate?: string;
  locationType?: 'CLINIC' | 'HOME'; // undefined = all
  statuses?: string[]; // array of status strings, undefined = all
  paid?: boolean; // true = pagadas, false = por pagar
  excludeStatuses?: string[]; // Excluir estos estados (ej: CANCELLED)
}

/**
 * Helper para agregar parámetros comunes a los reports
 */
function buildQueryParams(params?: ReportParams): string {
  const queryParams = new URLSearchParams();
  if (params?.period) queryParams.append('period', params.period);
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);
  if (params?.locationType) queryParams.append('locationType', params.locationType);
  if (params?.statuses && params.statuses.length > 0) {
    params.statuses.forEach((status) => queryParams.append('statuses', status));
  }
  if (params?.paid !== undefined) {
    queryParams.append('paid', String(params.paid));
  }
  if (params?.excludeStatuses && params.excludeStatuses.length > 0) {
    params.excludeStatuses.forEach((status) => queryParams.append('excludeStatuses', status));
  }
  return queryParams.toString();
}

export const reportsApi = {

  /**
   * Get revenue report
   */
  async getRevenueReport(params?: ReportParams): Promise<RevenueReportResponse> {
    const queryString = buildQueryParams(params);
    const response = await apiClient.get(`${BASE_URL}/revenue?${queryString}`);
    return response;
  },

  /**
   * Get appointments report
   */
  async getAppointmentsReport(params?: ReportParams): Promise<AppointmentsReportResponse> {
    const queryString = buildQueryParams(params);
    const response = await apiClient.get(`${BASE_URL}/appointments?${queryString}`);
    return response;
  },

  /**
   * Get clients report
   */
  async getClientsReport(params?: ReportParams): Promise<ClientsReportResponse> {
    const queryString = buildQueryParams(params);
    const response = await apiClient.get(`${BASE_URL}/clients?${queryString}`);
    return response;
  },

  /**
   * Get services report
   */
  async getServicesReport(params?: ReportParams): Promise<ServicesReportResponse> {
    const queryString = buildQueryParams(params);
    const response = await apiClient.get(`${BASE_URL}/services?${queryString}`);
    return response;
  },

  /**
   * Get performance report
   */
  async getPerformanceReport(params?: ReportParams): Promise<PerformanceReportResponse> {
    const queryString = buildQueryParams(params);
    const response = await apiClient.get(`${BASE_URL}/performance?${queryString}`);
    return response;
  },

  /**
   * Get geography report
   */
  async getGeographyReport(params?: ReportParams): Promise<GeographyReportResponse> {
    const queryString = buildQueryParams(params);
    const response = await apiClient.get(`${BASE_URL}/geography?${queryString}`);
    return response;
  },

  /**
   * Get overview report (consolidated dashboard)
   */
  async getOverviewReport(params?: ReportParams): Promise<OverviewReportResponse> {
    const queryString = buildQueryParams(params);
    const url = `${BASE_URL}/overview?${queryString}`;
    console.log('reportsApi.getOverviewReport - calling:', url);
    try {
      const response = await apiClient.get(url);
      console.log('reportsApi.getOverviewReport - response:', response);
      return response;
    } catch (err) {
      console.error('reportsApi.getOverviewReport - error:', err);
      throw err;
    }
  },
};
