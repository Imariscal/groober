import axios from 'axios';
import { useAuthStore } from '@/store/auth-store';
import { 
  Clinic, 
  CreateClinicPayload, 
  UpdateClinicPayload, 
  SuspendClinicPayload, 
  CreateOwnerPayload,
  LoginPayload,
  AuthResponse
} from '@/types';
import toast from 'react-hot-toast';

// Tipo para respuesta de listClinics con counts
export interface ClinicsListResponse extends Array<Clinic> {
  counts?: {
    total: number;
    active: number;
    suspended: number;
  };
}

const platformAxios = axios.create({
  baseURL: '/platform',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para añadir token a cada request
platformAxios.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores 401
platformAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

// ============================================
// AUTH ENDPOINTS
// ============================================
export async function loginPlatform(payload: LoginPayload): Promise<AuthResponse> {
  try {
    const { data } = await platformAxios.post<AuthResponse>('/auth/login', payload);
    return data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Error en login';
    toast.error(message);
    throw error;
  }
}

// ============================================
// CLINICS ENDPOINTS
// ============================================
export async function createClinic(payload: CreateClinicPayload): Promise<Clinic> {
  try {
    const { data } = await platformAxios.post<Clinic>('/clinics', payload);
    toast.success('Clínica creada exitosamente');
    return data;
  } catch (error: any) {
    if (error.response?.status === 409) {
      toast.error('Teléfono ya registrado para otra clínica');
    } else {
      toast.error(error.response?.data?.message || 'Error al crear clínica');
    }
    throw error;
  }
}

export async function listClinics(): Promise<ClinicsListResponse> {
  try {
    const { data } = await platformAxios.get('/clinics');
    // Backend returns { data: Clinic[], pagination: {...}, counts: {...} }
    const clinics = data.data || data;
    // Attach counts to the array for component access
    clinics.counts = data.counts;
    return clinics;
  } catch (error: any) {
    toast.error('Error al cargar clínicas');
    throw error;
  }
}

export async function getClinic(id: string): Promise<Clinic> {
  try {
    const { data } = await platformAxios.get<Clinic>(`/clinics/${id}`);
    return data;
  } catch (error: any) {
    toast.error('Error al cargar clínica');
    throw error;
  }
}

export async function updateClinic(
  id: string,
  payload: UpdateClinicPayload
): Promise<Clinic> {
  try {
    const { data } = await platformAxios.patch<Clinic>(`/clinics/${id}`, payload);
    toast.success('Clínica actualizada');
    return data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Error al actualizar clínica');
    throw error;
  }
}

export async function suspendClinic(
  id: string,
  payload: SuspendClinicPayload
): Promise<Clinic> {
  try {
    const { data } = await platformAxios.post<Clinic>(
      `/clinics/${id}/suspend`,
      payload
    );
    toast.success('Clínica suspendida');
    return data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Error al suspender clínica');
    throw error;
  }
}

export async function activateClinic(id: string): Promise<Clinic> {
  try {
    const { data } = await platformAxios.post<Clinic>(`/clinics/${id}/activate`);
    toast.success('Clínica activada');
    return data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Error al activar clínica');
    throw error;
  }
}

// ============================================
// OWNER/USERS ENDPOINTS
// ============================================
export interface CreateOwnerResponse {
  id: string;
  clinic_id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  invitation_token: string;
  invitation_expires_at: string;
}

export async function createClinicOwner(
  clinicId: string,
  payload: CreateOwnerPayload
): Promise<CreateOwnerResponse> {
  try {
    const { data } = await platformAxios.post<CreateOwnerResponse>(
      `/clinics/${clinicId}/owner`,
      payload
    );
    toast.success('Owner creado - Copia el token de invitación');
    return data;
  } catch (error: any) {
    if (error.response?.status === 409) {
      toast.error('Email ya está registrado');
    } else {
      toast.error(error.response?.data?.message || 'Error al crear owner');
    }
    throw error;
  }
}

// ============================================
// DASHBOARD ENDPOINTS
// ============================================
export interface DashboardData {
  timestamp: string;
  kpis: {
    total_clinics: number;
    active_clinics: number;
    suspended_clinics: number;
    statistics: {
      total_active_staff: number;
      total_active_clients: number;
      total_active_pets: number;
    };
  };
  recent_clinics: Clinic[];
}

export async function getDashboard(): Promise<DashboardData> {
  try {
    const { data } = await platformAxios.get<DashboardData>('/dashboard');
    return data;
  } catch (error: any) {
    toast.error('Error al cargar dashboard');
    throw error;
  }
}

// ============================================
// REPORTS ENDPOINTS
// ============================================
export interface ReportsMonthlyData {
  month: string;
  month_year: string;
  clinics: number;
  revenue: number;
}

export interface ReportsPlanSummary {
  plan_name: string;
  plan_code: string;
  clinics: number;
  revenue: number;
  avg_per_clinic: number;
  price: number;
  percentage: number;
}

export interface ReportsData {
  timestamp: string;
  period: string;
  metrics: {
    total_clinics: number;
    active_clinics: number;
    suspended_clinics: number;
    new_this_month: number;
    growth_rate: number;
    retention_rate: number;
    total_staff: number;
    total_clients: number;
    total_pets: number;
  };
  monthly_data: ReportsMonthlyData[];
  plan_summary: ReportsPlanSummary[];
}

export async function getReports(period?: string): Promise<ReportsData> {
  try {
    const params = period ? { period } : {};
    const { data } = await platformAxios.get<ReportsData>('/reports', { params });
    return data;
  } catch (error: any) {
    toast.error('Error al cargar reportes');
    throw error;
  }
}

// ============================================
// SUBSCRIPTION PLANS ENDPOINTS
// ============================================
export interface SubscriptionPlan {
  id: string;
  code: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  billingPeriod: 'monthly' | 'yearly';
  maxStaffUsers: number;
  maxClients: number;
  maxPets: number;
  features: string[];
  status: 'active' | 'inactive';
  sortOrder: number;
  isPopular: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlansListResponse {
  data: SubscriptionPlan[];
  total: number;
}

export interface CreatePlanPayload {
  code: string;
  name: string;
  description?: string;
  price: number;
  currency?: string;
  billingPeriod?: 'monthly' | 'yearly';
  maxStaffUsers: number;
  maxClients: number;
  maxPets: number;
  features?: string[];
  sortOrder?: number;
  isPopular?: boolean;
}

export interface UpdatePlanPayload {
  name?: string;
  description?: string;
  price?: number;
  currency?: string;
  billingPeriod?: 'monthly' | 'yearly';
  maxStaffUsers?: number;
  maxClients?: number;
  maxPets?: number;
  features?: string[];
  status?: 'active' | 'inactive';
  sortOrder?: number;
  isPopular?: boolean;
}

export async function listPlans(status?: string): Promise<PlansListResponse> {
  try {
    const params = status ? { status } : {};
    const { data } = await platformAxios.get<PlansListResponse>('/plans', { params });
    return data;
  } catch (error: any) {
    toast.error('Error al cargar planes');
    throw error;
  }
}

export async function listActivePlans(): Promise<PlansListResponse> {
  try {
    const { data } = await platformAxios.get<PlansListResponse>('/plans/active');
    return data;
  } catch (error: any) {
    toast.error('Error al cargar planes activos');
    throw error;
  }
}

export async function getPlan(id: string): Promise<SubscriptionPlan> {
  try {
    const { data } = await platformAxios.get<SubscriptionPlan>(`/plans/${id}`);
    return data;
  } catch (error: any) {
    toast.error('Error al cargar plan');
    throw error;
  }
}

export async function createPlan(payload: CreatePlanPayload): Promise<SubscriptionPlan> {
  try {
    const { data } = await platformAxios.post<SubscriptionPlan>('/plans', payload);
    toast.success('Plan creado exitosamente');
    return data;
  } catch (error: any) {
    if (error.response?.status === 409) {
      toast.error('Ya existe un plan con ese código');
    } else {
      toast.error(error.response?.data?.message || 'Error al crear plan');
    }
    throw error;
  }
}

export async function updatePlan(id: string, payload: UpdatePlanPayload): Promise<SubscriptionPlan> {
  try {
    const { data } = await platformAxios.patch<SubscriptionPlan>(`/plans/${id}`, payload);
    toast.success('Plan actualizado');
    return data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Error al actualizar plan');
    throw error;
  }
}

export async function togglePlanStatus(id: string): Promise<SubscriptionPlan> {
  try {
    const { data } = await platformAxios.post<SubscriptionPlan>(`/plans/${id}/toggle-status`);
    toast.success('Estado del plan actualizado');
    return data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Error al cambiar estado del plan');
    throw error;
  }
}

export async function deletePlan(id: string): Promise<void> {
  try {
    await platformAxios.delete(`/plans/${id}`);
    toast.success('Plan eliminado');
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Error al eliminar plan');
    throw error;
  }
}

// ============================================
// PLATFORM USERS ENDPOINTS
// ============================================
export interface PlatformUser {
  id: string;
  email: string;
  full_name: string;
  role?: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
  created_at: string;
  updated_at: string;
}

export interface CreatePlatformUserPayload {
  email: string;
  full_name: string;
  password: string;
}

export interface UpdatePlatformUserPayload {
  email?: string;
  full_name?: string;
  password?: string;
  status?: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
}

export interface PlatformUsersListResponse {
  users: PlatformUser[];
  total: number;
  counts: {
    total: number;
    active: number;
    suspended: number;
    deactivated: number;
  };
}

export async function listPlatformUsers(options?: {
  status?: string;
  search?: string;
}): Promise<{ data: PlatformUser[]; total: number }> {
  try {
    const params = options || {};
    const response = await platformAxios.get<PlatformUsersListResponse>('/users', { params });
    // Transformar la respuesta del backend al formato esperado por el frontend
    return {
      data: response.data.users,
      total: response.data.total,
    };
  } catch (error: any) {
    toast.error('Error al cargar usuarios');
    throw error;
  }
}

export async function createPlatformUser(
  payload: CreatePlatformUserPayload
): Promise<PlatformUser> {
  try {
    const { data } = await platformAxios.post<PlatformUser>('/users', payload);
    toast.success('Usuario creado exitosamente');
    return data;
  } catch (error: any) {
    if (error.response?.status === 409) {
      toast.error('El correo electrónico ya está registrado');
    } else {
      toast.error(error.response?.data?.message || 'Error al crear usuario');
    }
    throw error;
  }
}

export async function getPlatformUser(id: string): Promise<PlatformUser> {
  try {
    const { data } = await platformAxios.get<PlatformUser>(`/users/${id}`);
    return data;
  } catch (error: any) {
    toast.error('Error al cargar usuario');
    throw error;
  }
}

export async function updatePlatformUser(
  id: string,
  payload: UpdatePlatformUserPayload
): Promise<PlatformUser> {
  try {
    const { data } = await platformAxios.patch<PlatformUser>(`/users/${id}`, payload);
    toast.success('Usuario actualizado');
    return data;
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Error al actualizar usuario');
    throw error;
  }
}

export async function deletePlatformUser(id: string): Promise<void> {
  try {
    await platformAxios.delete(`/users/${id}`);
    toast.success('Usuario eliminado');
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Error al eliminar usuario');
    throw error;
  }
}
