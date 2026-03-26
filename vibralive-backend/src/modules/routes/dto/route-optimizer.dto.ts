/**
 * DTOs para el servicio de optimización de rutas.
 * Estos tipos coinciden con los modelos Python del microservicio.
 */

// ========== TIPOS BASE ==========

export interface Location {
  lat: number;
  lng: number;
  address?: string;
}

export interface TimeWindow {
  start: string; // ISO datetime
  end: string;   // ISO datetime
}

export enum AppointmentPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

// ========== CITAS ==========

export interface RouteAppointment {
  id: string;
  client_id: string;
  client_name?: string;
  pet_name?: string;
  location: Location;
  time_window: TimeWindow;
  duration_minutes: number;
  priority?: AppointmentPriority;
  preferred_stylist_id?: string;
  required_stylist_id?: string;
  required_skills?: string[];
}

// ========== ESTILISTAS ==========

export interface StylistWorkSchedule {
  start_time: string; // HH:MM format
  end_time: string;
  break_start?: string;
  break_end?: string;
}

export interface RouteStylist {
  id: string;
  name: string;
  start_location: Location;
  end_location?: Location;
  work_schedule: StylistWorkSchedule;
  max_appointments: number;
  skills?: string[];
  avg_speed_kmh?: number;
}

// ========== CONFIGURACIÓN ==========

export interface OptimizationConfig {
  weight_travel_time?: number;
  weight_time_window_violations?: number;
  weight_balance_load?: number;
  max_solve_time_seconds?: number;
  first_solution_strategy?: string;
  local_search_metaheuristic?: string;
  allow_unassigned?: boolean;
}

// ========== REQUEST/RESPONSE ==========

export interface OptimizationRequest {
  clinic_id: string;
  date: string; // ISO datetime
  appointments: RouteAppointment[];
  stylists: RouteStylist[];
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
