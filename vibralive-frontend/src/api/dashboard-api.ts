/**
 * Dashboard API Service
 * Centraliza la obtención de todos los datos para el dashboard
 * Basado en el análisis BA de reportes (BA_ESPECIFICACION_REPORTES_v1.0.md)
 */

import { reportsApi } from '@/lib/reports-api';
import { appointmentsApi } from '@/lib/appointments-api';
import { clientsApi } from '@/lib/clients-api';
import {
  RevenueReportResponse,
  AppointmentsReportResponse,
  ClientsReportResponse,
  ServicesReportResponse,
} from '@/types/reports';
import { Appointment } from '@/types';

export interface DashboardKPIs {
  revenue: {
    totalMTD: number;
    avgPerAppointment: number;
    arpu: number;
    trend: number;
  };
  appointments: {
    confirmedThisWeek: number;
    confirmationRate: number;
    cancelledMTD: number;
    trend: number;
  };
  clients: {
    totalActive: number;
    newThisMonth: number;
    retention: number;
    trend: number;
  };
  occupancy: number;
}

export interface DashboardData {
  kpis: DashboardKPIs;
  revenueChart?: any;
  appointmentsChart?: any;
  topServices?: any[];
  todayAppointments?: Appointment[];
  tomorrowAppointments?: Appointment[];
}

class DashboardApi {
  /**
   * Parsear respuesta de Revenue Report
   * Mapea estructura backend a interface interna
   */
  private parseRevenueReport(data: any): { kpis: any; charts: any; raw: any } {
    return {
      kpis: data?.kpis || {},
      charts: data?.charts || {},
      raw: data,
    };
  }

  /**
   * Parsear respuesta de Appointments Report
   */
  private parseAppointmentsReport(data: any): { kpis: any; charts: any; raw: any } {
    return {
      kpis: data?.kpis || {},
      charts: data?.charts || {},
      raw: data,
    };
  }

  /**
   * Parsear respuesta de Clients Report
   */
  private parseClientsReport(data: any): { kpis: any; raw: any } {
    return {
      kpis: data?.kpis || {},
      raw: data,
    };
  }

  /**
   * Parsear respuesta de Services Report
   */
  private parseServicesReport(data: any): { details: any[]; charts: any; raw: any } {
    return {
      details: data?.services || data?.charts?.byService || data?.charts?.topByDemand || [],
      charts: data?.charts || {},
      raw: data,
    };
  }

  /**
   * Extraer valor numérico de formato de divisa
   */
  private parseMoneyValue(value: string | number): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      // Extraer número de "$1,234.56" o "$ 1,234.56"
      const match = value.match(/[\d,.]+/);
      if (match) {
        return parseFloat(match[0].replace(/,/g, ''));
      }
    }
    return 0;
  }

  /**
   * Parsear número de un string que tenga formato "X citas" o "X%" o "X"
   */
  private parseNumberFromString(value: string | number): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const match = value.match(/([\d,.]+)/);
      if (match) {
        return parseFloat(match[1].replace(/,/g, '.'));
      }
    }
    return 0;
  }

  /**
   * Obtener todos los KPIs del dashboard
   * Combina datos de múltiples reportes en un único objeto
   */
  async getKPIs(): Promise<DashboardKPIs | null> {
    try {
      const [revenueResp, appointmentsResp, clientsResp, servicesResp] = await Promise.all([
        reportsApi.getRevenueReport({ period: 'month' }).catch((e) => {
          console.error('[DashboardApi] Revenue report error:', e);
          return null;
        }),
        reportsApi.getAppointmentsReport({ period: 'week' }).catch((e) => {
          console.error('[DashboardApi] Appointments report error:', e);
          return null;
        }),
        reportsApi.getClientsReport({ period: 'month' }).catch((e) => {
          console.error('[DashboardApi] Clients report error:', e);
          return null;
        }),
        reportsApi.getServicesReport({ period: 'month' }).catch((e) => {
          console.error('[DashboardApi] Services report error:', e);
          return null;
        }),
      ]);

      console.log('[DashboardApi] API Responses:', {
        revenue: revenueResp,
        appointments: appointmentsResp,
        clients: clientsResp,
        services: servicesResp,
      });

      const revenue = revenueResp ? this.parseRevenueReport(revenueResp) : null;
      const appointments = appointmentsResp ? this.parseAppointmentsReport(appointmentsResp) : null;
      const clients = clientsResp ? this.parseClientsReport(clientsResp) : null;

      // Extraer valores numéricos de KPIs
      const totalRevenue = revenue?.kpis?.totalRevenue?.value
        ? this.parseMoneyValue(revenue.kpis.totalRevenue.value)
        : 0;

      const avgPerAppointment = revenue?.kpis?.avgPerAppointment?.value
        ? this.parseMoneyValue(revenue.kpis.avgPerAppointment.value)
        : 0;

      const dailyAverage = revenue?.kpis?.dailyAverage?.value
        ? this.parseMoneyValue(revenue.kpis.dailyAverage.value)
        : 0;

      // Appointments: extraer de appointments.kpis.XXX.value
      const confirmedThisWeek = appointments?.kpis?.confirmedThisWeek?.value
        ? this.parseNumberFromString(appointments.kpis.confirmedThisWeek.value)
        : 0;

      const confirmationRate = appointments?.kpis?.confirmationRate?.value
        ? this.parseNumberFromString(appointments.kpis.confirmationRate.value)
        : 0;

      // Clients: extraer de clients.kpis.XXX.value
      const totalActiveClients = clients?.kpis?.totalActiveClients?.value
        ? this.parseNumberFromString(clients.kpis.totalActiveClients.value)
        : 0;

      const newThisMonth = clients?.kpis?.newClientsThisMonth?.value
        ? this.parseNumberFromString(clients.kpis.newClientsThisMonth.value)
        : 0;

      const retentionRate = clients?.kpis?.repeatRate?.value
        ? this.parseNumberFromString(clients.kpis.repeatRate.value)
        : 0;

      const kpis: DashboardKPIs = {
        revenue: {
          totalMTD: totalRevenue,
          avgPerAppointment,
          arpu: dailyAverage,
          trend: 5, // Default positive trend
        },
        appointments: {
          confirmedThisWeek: typeof confirmedThisWeek === 'string' ? parseInt(confirmedThisWeek) : confirmedThisWeek,
          confirmationRate: typeof confirmationRate === 'string' ? parseFloat(confirmationRate) : confirmationRate,
          cancelledMTD: 0, // TODO: extract from report
          trend: 3,
        },
        clients: {
          totalActive: typeof totalActiveClients === 'string' ? parseInt(totalActiveClients) : totalActiveClients,
          newThisMonth: typeof newThisMonth === 'string' ? parseInt(newThisMonth) : newThisMonth,
          retention: typeof retentionRate === 'string' ? parseFloat(retentionRate) : retentionRate,
          trend: 2,
        },
        occupancy: 0, // TODO: calculate if needed
      };

      console.log('[DashboardApi] Generated KPIs:', kpis);
      return kpis;
    } catch (error) {
      console.error('[DashboardApi] Error fetching KPIs:', error);
      return null;
    }
  }

  /**
   * Obtener datos de gráfico de ingresos
   */
  async getRevenueChartData(): Promise<any[] | null> {
    try {
      const response = await reportsApi.getRevenueReport({ period: 'month' });
      const parsed = this.parseRevenueReport(response);

      // El chart de ingresos acumulados viene en charts.cumulativeRevenue
      const chartData = parsed.charts?.cumulativeRevenue;

      console.log('[DashboardApi] Revenue chart data (raw):', chartData);
      
      if (chartData && Array.isArray(chartData)) {
        // Transformar al formato esperado por Recharts
        const transformed = chartData.map((item: any) => ({
          name: item.date || item.day || 'Día',
          value: item.revenue || 0,
        }));
        console.log('[DashboardApi] Revenue chart data (transformed):', transformed);
        return transformed;
      }

      // Fallback: construir desde datos diarios si existen
      return null;
    } catch (error) {
      console.error('[DashboardApi] Error fetching revenue chart:', error);
      return null;
    }
  }

  /**
   * Obtener datos de gráfico de citas
   */
  async getAppointmentsChartData(): Promise<any[] | null> {
    try {
      const response = await reportsApi.getAppointmentsReport({ period: 'week' });
      const parsed = this.parseAppointmentsReport(response);

      // Buscar data de gráfico en múltiples ubicaciones
      const chartData = parsed.charts?.byDay || parsed.charts?.daily || parsed.raw?.charts?.appointments;

      console.log('[DashboardApi] Appointments chart data (raw):', chartData);
      
      if (chartData && Array.isArray(chartData)) {
        // Transformar al formato esperado por Recharts
        const transformed = chartData.map((item: any) => ({
          name: item.date || item.day || item.dayName || 'Día',
          value: item.scheduled || item.count || 0,
        }));
        console.log('[DashboardApi] Appointments chart data (transformed):', transformed);
        return transformed;
      }

      return null;
    } catch (error) {
      console.error('[DashboardApi] Error fetching appointments chart:', error);
      return null;
    }
  }

  /**
   * Obtener top 5 servicios por ingresos
   */
  async getTopServices(): Promise<any[] | null> {
    try {
      const response = await reportsApi.getRevenueReport({ period: 'month' });
      const parsed = this.parseRevenueReport(response);

      // Los datos de servicios top por ingresos están en revenue.charts.byService
      const topServices = parsed.charts?.byService;

      if (topServices && Array.isArray(topServices)) {
        return topServices.slice(0, 5);
      }

      return null;
    } catch (error) {
      console.error('[DashboardApi] Error fetching top services:', error);
      return null;
    }
  }

  /**
   * Obtener citas de hoy y mañana
   */
  async getUpcomingAppointments(): Promise<{
    today: Appointment[];
    tomorrow: Appointment[];
  }> {
    try {
      const response = await reportsApi.getAppointmentsReport({ period: 'week' }).catch((e) => {
        console.warn('[DashboardApi] Appointments report error:', e);
        return null;
      });

      if (!response) {
        return { today: [], tomorrow: [] };
      }

      const appointments = response?.appointments || [];

      // Las citas del reporte ya vienen separadas por día en el formato correcto
      // Mapear a tipo Appointment si es necesario
      const todayAppointments = appointments.map((apt: any) => ({
        id: apt.id || `apt-${apt.time}`,
        date: new Date().toISOString().split('T')[0],
        time: apt.time || '',
        client_name: apt.clientName || '',
        pet_name: apt.petName || '',
        service: apt.service || 'N/A',
        stylist_name: apt.stylistName || 'Sin asignar',
        status: apt.status || 'SCHEDULED',
        ...apt,
      })) as any[];

      // Para mañana, buscar en la siguiente sección si existe
      // O hacer una segunda llamada específica si es necesario
      const tomorrowAppointments: Appointment[] = [];

      return {
        today: todayAppointments,
        tomorrow: tomorrowAppointments,
      };
    } catch (error) {
      console.error('[DashboardApi] Error fetching upcoming appointments:', error);
      return { today: [], tomorrow: [] };
    }
  }

  /**
   * Obtener todos los datos necesarios para el dashboard completo
   */
  async getFullDashboardData(): Promise<DashboardData | null> {
    try {
      const [kpis, revenueChart, appointmentsChart, topServices, upcomingAppts] =
        await Promise.all([
          this.getKPIs(),
          this.getRevenueChartData(),
          this.getAppointmentsChartData(),
          this.getTopServices(),
          this.getUpcomingAppointments(),
        ]);

      // Si no hay KPIs, retornar null (todos los datos dependen de esto)
      if (!kpis) {
        console.warn('[DashboardApi] No KPIs data available');
        return null;
      }

      const result: DashboardData = {
        kpis,
        revenueChart: revenueChart || [],
        appointmentsChart: appointmentsChart || [],
        topServices: topServices || [],
        todayAppointments: upcomingAppts.today || [],
        tomorrowAppointments: upcomingAppts.tomorrow || [],
      };

      console.log('[DashboardApi] Full dashboard data result:', {
        kpis,
        revenueChartLength: revenueChart?.length || 0,
        appointmentsChartLength: appointmentsChart?.length || 0,
        topServicesLength: topServices?.length || 0,
      });

      return result;
    } catch (error) {
      console.error('[DashboardApi] Error fetching full dashboard data:', error);
      return null;
    }
  }
}

export const dashboardApi = new DashboardApi();
