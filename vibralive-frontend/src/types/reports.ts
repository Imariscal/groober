// Revenue Report Types
export interface RevenueKPICard {
  label: string;
  value: string;
  change?: string;
  period: string;
}

export interface RevenueChartData {
  date: string;
  revenue: number;
}

export interface ServiceRevenue {
  name: string;
  revenue: number;
  percentage: number;
  appointmentCount: number;
  avgPrice: number;
}

export interface RevenueReportResponse {
  kpis: {
    totalRevenue: RevenueKPICard;
    avgPerAppointment: RevenueKPICard;
    dailyAverage: RevenueKPICard;
    ticketPerClient: RevenueKPICard;
  };
  charts: {
    cumulativeRevenue: RevenueChartData[];
    byService: ServiceRevenue[];
  };
  metadata: {
    period: string;
    currency: string;
    lastUpdated: Date;
  };
}

// Appointments Report Types
export interface AppointmentKPICard {
  label: string;
  value: string;
  trending?: string;
}

export interface AppointmentByDay {
  date: string;
  dayName: string;
  scheduled: number;
  confirmed: number;
  cancelled: number;
}

export interface AppointmentByStylist {
  name: string;
  appointmentCount: number;
  confirmedCount: number;
  cancelledCount: number;
}

export interface AppointmentDetail {
  id: string;
  time: string;
  clientId: string;
  clientName: string;
  petId: string;
  petName: string;
  service: string;
  serviceName: string;
  stylistName: string;
  status: string;
  totalAmount: number | null;
  scheduledAt: Date;
  cancelledAt: Date | null;
  cancellationReason: string | null;
}

export interface AppointmentsReportResponse {
  kpis: {
    confirmedThisWeek: AppointmentKPICard;
    confirmationRate: AppointmentKPICard;
    cancelledThisMonth: AppointmentKPICard;
    mostActiveClient: AppointmentKPICard;
  };
  charts: {
    byDay: AppointmentByDay[];
    byStylist: AppointmentByStylist[];
  };
  appointments: AppointmentDetail[];
  metadata: {
    period: string;
    lastUpdated: Date;
  };
}

// Clients Report Types
export interface ClientKPICard {
  label: string;
  value: string;
  trending?: string;
}

export interface ClientGrowthData {
  month: string;
  newClients: number;
  cumulativeClients: number;
}

export interface TopClientByRevenue {
  name: string;
  totalAppointments: number;
  totalSpent: number;
}

export interface ClientAnalysisRow {
  name: string;
  email: string;
  phone: string;
  totalAppointments: number;
  lastAppointment: string;
  planName: string;
  status: string;
}

export interface ClientsReportResponse {
  kpis: {
    totalActiveClients: ClientKPICard;
    newClientsThisMonth: ClientKPICard;
    repeatRate: ClientKPICard;
    clientsByPlan: Array<{
      plan: string;
      count: number;
      color: string;
    }>;
  };
  charts: {
    growthTrend: ClientGrowthData[];
    topByRevenue: TopClientByRevenue[];
  };
  clients: ClientAnalysisRow[];
  metadata: {
    period: string;
    lastUpdated: Date;
  };
}

// Services Report Types
export interface ServiceRow {
  name: string;
  type: string;
  demandCount: number;
  totalRevenue: number;
  avgPrice: number;
  estimatedMargin: string;
  status: string;
}

export interface ServiceDemand {
  name: string;
  demandCount: number;
}

export interface ServicesReportResponse {
  kpis: {
    activeServices: AppointmentKPICard;
    mostDemanded: AppointmentKPICard;
    mostProfitable: AppointmentKPICard;
    availabilityRate: AppointmentKPICard;
  };
  charts: {
    scatterDemandVsRevenue: Array<{
      name: string;
      demandCount: number;
      totalRevenue: number;
      type: string;
    }>;
    topByDemand: ServiceDemand[];
  };
  services: ServiceRow[];
  metadata: {
    period: string;
    lastUpdated: Date;
  };
}

// Performance Report Types
export interface StylistScorecard {
  name: string;
  totalAppointments: number;
  confirmedCount: number;
  cancelledCount: number;
  rating: string;
  weeklyRevenue: string;
}

export interface StylistUtilization {
  name: string;
  utilizationPercentage: number;
}

export interface PerformanceReportResponse {
  kpis: {
    activeStylistsCount: AppointmentKPICard;
    avgAppointmentsPerWeek: AppointmentKPICard;
    occupancyRate: AppointmentKPICard;
    revenuePerStylist: AppointmentKPICard;
  };
  charts: {
    utilization: StylistUtilization[];
    revenueComparison: Array<{
      name: string;
      current: number;
      target: number;
    }>;
  };
  stylists: StylistScorecard[];
  metadata: {
    period: string;
    lastUpdated: Date;
  };
}

// Geography Report Types
export interface ZoneHeatData {
  row: number;
  col: number;
  name: string;
  appointments: number;
  clients: number;
  color: string;
}

export interface ZoneAnalysisRow {
  zone: string;
  clientCount: number;
  appointmentCount: number;
  totalRevenue: number;
  appointmentsPerClient: number;
}

export interface GeographyReportResponse {
  kpis: {
    zonesCovered: AppointmentKPICard;
    hottest: AppointmentKPICard;
    clientsPerZone: AppointmentKPICard;
    citiesDensity: AppointmentKPICard;
  };
  charts: {
    heatmap: ZoneHeatData[];
  };
  zones: ZoneAnalysisRow[];
  metadata: {
    period: string;
    city: string;
    lastUpdated: Date;
    homeAppointmentsOmitted?: number;
    homeAppointmentsMessage?: string;
    mapCenterLat?: number | null;
    mapCenterLng?: number | null;
  };
}

// Overview Report Types
export interface OverviewReportResponse {
  healthMetrics: {
    revenueThisMonth: RevenueKPICard;
    appointmentsThisWeek: AppointmentKPICard;
    activeClients: ClientKPICard;
    occupancyRate: AppointmentKPICard;
  };
  charts: {
    revenueLastWeek: RevenueChartData[];
    appointmentsByStylist: AppointmentByStylist[];
    clientGrowth: ClientGrowthData[];
  };
  alerts: Array<{
    type: 'warning' | 'success' | 'info';
    message: string;
  }>;
  metadata: {
    period: string;
    lastUpdated: Date;
  };
}
