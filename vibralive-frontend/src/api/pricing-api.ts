import { api } from '@/lib/api';
import { AppointmentItem } from '@/types';

export interface PricingItem {
  serviceId: string;
  serviceName: string;
  priceAtBooking: number;
  quantity: number;
  subtotal: number;
}

export interface AppointmentPricing {
  appointmentId: string;
  items: PricingItem[];
  totalAmount: number;
  priceLockAt: Date;
  priceListId: string;
}

export interface CalculatePricingRequest {
  clinicId?: string;
  priceListId?: string;
  serviceIds: string[];
  quantities?: number[];
}

export interface CreateAppointmentWithPricingRequest {
  clinicId?: string;
  clientId: string;
  petId: string;
  scheduledAt: string;
  durationMinutes?: number;
  reason?: string;
  notes?: string;
  locationType?: 'CLINIC' | 'HOME';
  serviceType: 'GROOMING' | 'MEDICAL';
  addressId?: string;
  assignedStaffUserId?: string;
  serviceIds: string[];
  quantities?: number[];
  packageIds?: string[];
  packageQuantities?: number[];
  customPriceListId?: string;
}

export interface ValidationResult {
  isValid: boolean;
  changedServices: Array<{
    serviceId: string;
    originalPrice: number;
    currentPrice: number;
  }>;
}

class PricingApi {
  /**
   * Calcula precios para una cita sin crear la cita aún
   * Útil para preview de precios en la UI antes de confirmar
   */
  async calculatePricing(request: CalculatePricingRequest) {
    try {
      // api.post() returns response.data directly (the backend result)
      // Backend returns: { success: true, data: [...items...] }
      const response = await api.post<any>('/pricing/calculate', request);
      console.log('🔍 API response:', response);
      
      // Extract data from backend response structure
      // response = { success: true, data: [...] }
      const data = response?.data || response;
      
      // If data is an array, wrap it
      if (Array.isArray(data)) {
        console.log('✅ Response is array, wrapping in items');
        return { items: data, totalAmount: 0, priceLockAt: new Date(), priceListId: request.priceListId };
      }
      
      // If data has items property, return it
      if (data?.items) {
        console.log('✅ Response has items property');
        return data as Omit<AppointmentPricing, 'appointmentId'>;
      }
      
      // Return raw data
      console.log('✅ Returning raw data');
      return data as Omit<AppointmentPricing, 'appointmentId'>;
    } catch (error: any) {
      console.error('❌ API Error:', error);
      throw new Error(error.response?.data?.message || 'Failed to calculate pricing');
    }
  }

  /**
   * Crea una cita con precios congelados (OPERACIÓN PRINCIPAL)
   * Esto crea la cita + registra los precios de forma atómica
   */
  async createAppointmentWithPricing(request: CreateAppointmentWithPricingRequest) {
    try {
      // api.post() returns response.data directly
      // Backend returns: { success: true, data: {...appointment...} }
      const response = await api.post<any>('/pricing/appointments/create-with-pricing', request);
      console.log('🔍 createAppointmentWithPricing response:', response);
      
      // Extract appointment from response
      const data = response?.data || response;
      console.log('✅ Returning appointment:', data);
      return data as AppointmentPricing;
    } catch (error: any) {
      console.error('❌ createAppointmentWithPricing error:', error);
      throw new Error(error.response?.data?.message || 'Failed to create appointment with pricing');
    }
  }

  /**
   * Obtiene todas las listas de precios disponibles
   */
  async getPriceLists() {
    try {
      // api.get() returns response.data directly
      const response = await api.get<any>('/price-lists');
      // Backend returns: { success: true, data: [...] }
      const data = response?.data || response;
      return Array.isArray(data) ? data : [];
    } catch (error: any) {
      console.error('Error fetching price lists:', error);
      return [];
    }
  }

  /**
   * Obtiene el pricing de una cita existente
   * Incluye los precios congelados en el momento de la cita
   */
  async getAppointmentPricing(appointmentId: string) {
    try {
      // api.get() returns response.data directly
      const response = await api.get<any>(`/pricing/appointments/${appointmentId}`);
      // Backend returns: { success: true, data: {...pricing...} }
      const data = response?.data || response;
      return data as AppointmentPricing;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch appointment pricing');
    }
  }

  /**
   * Valida si los precios de una cita siguen siendo válidos
   * Detecta cambios de precio desde que la cita fue creada
   * 
   * @returns { isValid: boolean, changedServices: [...] }
   * Si isValid=false, los servicios listados en changedServices han cambiado de precio
   */
  async validateAppointmentPricing(appointmentId: string) {
    try {
      // api.post() returns response.data directly
      const response = await api.post<any>(`/pricing/appointments/${appointmentId}/validate`, {});
      // Backend returns: { success: true, data: {...validation...} }
      const data = response?.data || response;
      return data as ValidationResult;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to validate appointment pricing');
    }
  }

  /**
   * Helper: Formatea números a moneda local
   */
  formatPrice(price: number, currency: string = 'COP'): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency,
    }).format(price);
  }

  /**
   * Helper: Calcula el subtotal de un servicio
   */
  calculateSubtotal(price: number, quantity: number): number {
    return price * quantity;
  }
}

export const pricingApi = new PricingApi();
