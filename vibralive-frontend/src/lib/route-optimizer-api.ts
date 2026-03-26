/**
 * API cliente para el microservicio de optimización de rutas (OR-Tools).
 * Se comunica directamente con el microservicio Python para optimización.
 */

import axios, { AxiosInstance } from 'axios';
import toast from 'react-hot-toast';

// URL del microservicio OR-Tools (puede ir directo o a través del backend)
const OPTIMIZER_URL = process.env.NEXT_PUBLIC_ROUTE_OPTIMIZER_URL || 'http://localhost:8001';

// ========== TIPOS ==========

export interface Location {
  lat: number;
  lng: number;
  address?: string;
}

export interface TimeWindow {
  start: string; // ISO datetime
  end: string;   // ISO datetime
}

export interface RouteAppointmentInput {
  id: string;
  client_id: string;
  client_name?: string;
  pet_name?: string;
  location: Location;
  time_window: TimeWindow;
  duration_minutes: number;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  preferred_stylist_id?: string;
  required_stylist_id?: string;
  required_skills?: string[];
}

export interface StylistWorkSchedule {
  start_time: string; // HH:MM format
  end_time: string;
  break_start?: string;
  break_end?: string;
}

export interface RouteStylistInput {
  id: string;
  name: string;
  start_location: Location;
  end_location?: Location;
  work_schedule: StylistWorkSchedule;
  max_appointments: number;
  skills?: string[];
  avg_speed_kmh?: number;
}

export interface OptimizationConfig {
  weight_travel_time?: number;
  weight_time_window_violations?: number;
  weight_balance_load?: number;
  max_solve_time_seconds?: number;
  first_solution_strategy?: string;
  local_search_metaheuristic?: string;
  allow_unassigned?: boolean;
}

export interface OptimizationRequest {
  clinic_id: string;
  date: string; // ISO datetime
  appointments: RouteAppointmentInput[];
  stylists: RouteStylistInput[];
  config?: OptimizationConfig;
}

export interface RouteStop {
  appointment_id: string;
  stop_order: number;
  planned_arrival: string;
  planned_departure: string;
  travel_time_minutes: number;
  travel_distance_km: number;
  waiting_time_minutes: number;
  time_window_violated: boolean;
  violation_minutes: number;
}

export interface OptimizedRoute {
  stylist_id: string;
  stylist_name: string;
  stops: RouteStop[];
  total_stops: number;
  total_travel_time_minutes: number;
  total_travel_distance_km: number;
  total_service_time_minutes: number;
  total_waiting_time_minutes: number;
  route_start_time?: string;
  route_end_time?: string;
  has_time_window_violations: boolean;
  utilization_percent: number;
}

export interface OptimizationResponse {
  success: boolean;
  message: string;
  routes: OptimizedRoute[];
  unassigned_appointments: string[];
  total_appointments_assigned: number;
  total_travel_time_minutes: number;
  total_travel_distance_km: number;
  solve_time_seconds: number;
  solver_status: string;
  algorithm_version: string;
}

export interface ValidationResponse {
  valid: boolean;
  error?: string;
  warnings?: string[];
  summary?: {
    appointments: number;
    stylists: number;
    total_capacity: number;
  };
}

// ========== CLIENTE API ==========

class RouteOptimizerApi {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: OPTIMIZER_URL,
      timeout: 120000, // 2 minutos para optimizaciones largas
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Verifica si el servicio de optimización está disponible.
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.data?.status === 'healthy';
    } catch (error) {
      console.warn('[RouteOptimizer] Service not available:', error);
      return false;
    }
  }

  /**
   * Optimiza las rutas de citas para los estilistas.
   */
  async optimize(request: OptimizationRequest): Promise<OptimizationResponse> {
    try {
      const response = await this.client.post<OptimizationResponse>('/optimize', request);
      return response.data;
    } catch (error: any) {
      console.error('[RouteOptimizer] Optimization error:', error);
      
      if (error.code === 'ECONNREFUSED') {
        toast.error('Servicio de optimización no disponible. Verifica que esté corriendo.');
        throw new Error('SERVICE_UNAVAILABLE');
      }
      
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      
      throw error;
    }
  }

  /**
   * Valida una solicitud de optimización sin ejecutar el solver.
   */
  async validate(request: OptimizationRequest): Promise<ValidationResponse> {
    try {
      const response = await this.client.post<ValidationResponse>('/optimize/validate', request);
      return response.data;
    } catch (error) {
      console.error('[RouteOptimizer] Validation error:', error);
      throw error;
    }
  }

  /**
   * Obtiene la configuración por defecto del optimizador.
   */
  async getConfigDefaults(): Promise<{
    first_solution_strategies: string[];
    local_search_metaheuristics: string[];
    defaults: OptimizationConfig;
  }> {
    const response = await this.client.get('/config/defaults');
    return response.data;
  }

  /**
   * Obtiene un ejemplo de solicitud de optimización.
   */
  async getExample(): Promise<OptimizationRequest> {
    const response = await this.client.get<OptimizationRequest>('/example');
    return response.data;
  }
}

// Exportar instancia singleton
export const routeOptimizerApi = new RouteOptimizerApi();
