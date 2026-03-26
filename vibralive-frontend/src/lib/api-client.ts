import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import { AuthResponse, LoginPayload, RegisterPayload, AcceptInvitationPayload, ApiError } from '@/types';
import toast from 'react-hot-toast';

// Use relative paths to leverage Next.js rewrites for /api/* paths
// This avoids CORS issues in development
const API_URL = '/api';

class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      timeout: 30000,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Load token from localStorage on initialization
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('access_token');
    }

    // Request interceptor - Agrega token a cada request
    this.client.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });

    // Response interceptor - Maneja errores globalmente
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiError>) => {
        // 401: Token inválido o expirado
        if (error.response?.status === 401) {
          this.logout();
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login';
          }
          toast.error('Sesión expirada. Por favor inicia sesión de nuevo.');
          return Promise.reject(error);
        }

        // 403: Sin permisos
        if (error.response?.status === 403) {
          toast.error('No tienes permisos para realizar esta acción.');
          return Promise.reject(error);
        }

        // 404: No encontrado
        if (error.response?.status === 404) {
          toast.error('El recurso no fue encontrado.');
          return Promise.reject(error);
        }

        // 500+: Error del servidor
        if (error.response?.status && error.response.status >= 500) {
          const message =
            error.response?.data?.message || 'Error del servidor. Intenta de nuevo.';
          toast.error(message);
          return Promise.reject(error);
        }

        // Errores de validación (400)
        if (error.response?.status === 400) {
          const message =
            error.response?.data?.message || 'Datos inválidos. Revisa los campos.';
          toast.error(message);
          return Promise.reject(error);
        }

        // Errores de conflicto (409)
        if (error.response?.status === 409) {
          const message =
            error.response?.data?.message || 'El recurso ya existe.';
          toast.error(message);
          return Promise.reject(error);
        }

        // Error de red
        if (!error.response) {
          toast.error('Error de conexión. Verifica tu internet.');
          return Promise.reject(error);
        }

        return Promise.reject(error);
      }
    );
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', token);
    }
  }

  logout() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
    }
  }

  // Auth endpoints
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/auth/login', payload);
    this.setToken(response.data.access_token);
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  }

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/auth/register', payload);
    this.setToken(response.data.access_token);
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  }

  async acceptInvitation(payload: AcceptInvitationPayload): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/auth/accept-invitation', payload);
    this.setToken(response.data.access_token);
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  }

  // Health check
  async healthCheck() {
    return this.client.get('/health');
  }

  // Generic request method - Returns full AxiosResponse for flexibility
  async request<T = any>(config: AxiosRequestConfig) {
    const response = await this.client.request<T>(config);
    return response;
  }

  // Convenience methods - Return response.data directly for ease of use
  async get<T = any>(url: string, config?: AxiosRequestConfig) {
    const response = await this.request<T>({ ...config, method: 'GET', url });
    return response.data;
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    const response = await this.request<T>({ ...config, method: 'POST', url, data });
    return response.data;
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    const response = await this.request<T>({ ...config, method: 'PATCH', url, data });
    return response.data;
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    const response = await this.request<T>({ ...config, method: 'PUT', url, data });
    return response.data;
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig) {
    const response = await this.request<T>({ ...config, method: 'DELETE', url });
    return response.data;
  }
}

export const apiClient = new ApiClient();
