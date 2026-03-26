import axios, { AxiosError, AxiosResponse } from 'axios';
import { useSaleStore } from '../stores/saleStore';

// ✓ Crear instancia de axios con baseURL
// Use relative paths to leverage Next.js rewrites for /api/* paths
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * INTERCEPTOR DE RESPUESTAS
 * 
 * Maneja automáticamente:
 * - Errores 400: Validación del backend (Golden Rule violations)
 * - Errores 403: Permisos insuficientes
 * - Errores 404: Recurso no encontrado
 * - Errores 500: Errores del servidor
 */
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<any>) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;

    console.error(`[API ERROR ${status}]`, message);

    // ✓ GOLDEN RULE VIOLATIONS
    if (status === 400) {
      const backendMessage = error.response?.data?.message || 'Solicitud inválida';

      // Detectar tipo específico de error
      if (
        backendMessage.includes('Cannot edit sale') ||
        backendMessage.includes('Cannot cancel sale') ||
        backendMessage.includes('Only draft sales')
      ) {
        console.warn('[GOLDEN RULE VIOLATION]', backendMessage);
      }

      // El componente que hizo la llamada es responsable de manejar esto
      return Promise.reject(error);
    }

    // ✓ PERMISOS INSUFICIENTES
    if (status === 403) {
      console.error('[PERMISSION DENIED]', message);
      return Promise.reject(error);
    }

    // ✓ RECURSO NO ENCONTRADO
    if (status === 404) {
      console.error('[NOT FOUND]', message);
      return Promise.reject(error);
    }

    // ✓ ERROR DEL SERVIDOR
    if (status === 500) {
      console.error('[SERVER ERROR]', message);
      return Promise.reject(error);
    }

    return Promise.reject(error);
  },
);

/**
 * INTERCEPTOR DE SOLICITUDES
 * 
 * Agrega token de autenticación si existe
 */
api.interceptors.request.use((config) => {
  // Intentar obtener token desde localStorage
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const posApi = {
  // GET
  get: <T = any>(url: string) => api.get<T>(url),

  // POST
  post: <T = any>(url: string, data?: any) => api.post<T>(url, data),

  // PUT
  put: <T = any>(url: string, data?: any) => api.put<T>(url, data),

  // PATCH
  patch: <T = any>(url: string, data?: any) => api.patch<T>(url, data),

  // DELETE
  delete: <T = any>(url: string) => api.delete<T>(url),
};

/**
 * FUNCIONES DE UTILIDAD PARA OPERACIONES COMUNES
 */

export const pos = {
  /**
   * Obtener venta por ID
   */
  getSale: async (saleId: string) => {
    const response = await posApi.get(`/pos/sales/${saleId}`);
    return response.data.data;
  },

  /**
   * Obtener todas las ventas de la clínica
   */
  getSales: async (status?: string, limit?: number, offset?: number) => {
    const response = await posApi.get('/pos/sales', {
      params: { status, limit, offset },
    });
    return response.data;
  },

  /**
   * Crear venta DRAFT
   */
  createSale: async (data: any) => {
    const response = await posApi.post('/pos/sales', data);
    return response.data.data;
  },

  /**
   * Editar venta DRAFT
   * 
   * ✓ El backend rechazará si status !== DRAFT
   */
  updateSale: async (saleId: string, data: any) => {
    const response = await posApi.put(`/pos/sales/${saleId}`, data);
    return response.data.data;
  },

  /**
   * Completar venta
   * 
   * Transición: DRAFT → COMPLETED
   * - Valida stock de todos los items
   * - Decrementa inventario atómicamente
   * - Crea audit trail
   */
  completeSale: async (saleId: string, data?: any) => {
    const response = await posApi.patch(`/pos/sales/${saleId}/complete`, data || {});
    return response.data.data;
  },

  /**
   * Cancelar venta
   * 
   * Transición: DRAFT → CANCELLED
   * ✓ Solo permite cancelar DRAFT
   * El backend rechazará si status !== DRAFT
   */
  cancelSale: async (saleId: string) => {
    const response = await posApi.patch(`/pos/sales/${saleId}/cancel`);
    return response.data.data;
  },

  /**
   * Reembolsar venta
   * 
   * Transición: COMPLETED → REFUNDED
   * - Restaura stock de todos los items
   * - Crea audit trail de devolución
   * ✓ Solo permite reembolsar COMPLETED
   */
  refundSale: async (saleId: string) => {
    const response = await posApi.patch(`/pos/sales/${saleId}/refund`);
    return response.data.data;
  },

  /**
   * Obtener productos de la clínica
   */
  getProducts: async (category?: string, isActive?: boolean) => {
    const response = await posApi.get('/pos/products', {
      params: { category, isActive },
    });
    return response.data.data;
  },

  /**
   * Obtener inventario bajo
   */
  getLowStockProducts: async () => {
    const response = await posApi.get('/pos/products/alerts/low-stock');
    return response.data.data;
  },
};

export default api;
