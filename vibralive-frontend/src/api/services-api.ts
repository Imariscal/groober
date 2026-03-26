import { api } from '@/lib/api';
import { Service, CreateServicePayload, UpdateServicePayload } from '@/types';

class ServicesApi {
  /**
   * GET /services
   * Returns all services for the clinic
   *
   * @returns Array of Service objects
   */
  async getServices() {
    try {
      const response = await api.get('/services');
      const services = (response.data?.data || response.data || []) as Service[];
      return services || [];
    } catch (error: any) {
      console.error('[ServicesApi] Error fetching services:', error);
      return [];
    }
  }

  /**
   * GET /services/:id
   * Returns a single service by ID
   *
   * @param serviceId - ID of the service
   * @returns Service object or null if not found
   */
  async getService(serviceId: string) {
    try {
      const response = await api.get(`/services/${serviceId}`);
      const service = (response.data?.data || response.data || null) as Service | null;
      return service;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      console.error('[ServicesApi] Error fetching service:', error);
      return null;
    }
  }

  /**
   * POST /services
   * Create a new service
   *
   * @param payload - Service creation data
   * @returns Created Service object
   */
  async createService(payload: CreateServicePayload) {
    try {
      const response = await api.post('/services', payload);
      const service = (response.data?.data || response.data) as Service;
      return service;
    } catch (error: any) {
      console.error('[ServicesApi] Error creating service:', error);
      throw error;
    }
  }

  /**
   * PATCH /services/:id
   * Update an existing service
   *
   * @param serviceId - ID of the service
   * @param payload - Service update data
   * @returns Updated Service object
   */
  async updateService(serviceId: string, payload: UpdateServicePayload) {
    try {
      const response = await api.patch(`/services/${serviceId}`, payload);
      const service = (response.data?.data || response.data) as Service;
      return service;
    } catch (error: any) {
      console.error('[ServicesApi] Error updating service:', error);
      throw error;
    }
  }

  /**
   * DELETE /services/:id
   * Delete a service
   *
   * @param serviceId - ID of the service
   */
  async deleteService(serviceId: string) {
    try {
      await api.delete(`/services/${serviceId}`);
    } catch (error: any) {
      console.error('[ServicesApi] Error deleting service:', error);
      throw error;
    }
  }

  /**
   * PATCH /services/:id/deactivate
   * Deactivate a service (soft delete)
   *
   * @param serviceId - ID of the service
   * @returns Updated Service object
   */
  async deactivateService(serviceId: string) {
    try {
      const response = await api.patch(`/services/${serviceId}/deactivate`);
      const service = (response.data?.data || response.data) as Service;
      return service;
    } catch (error: any) {
      console.error('[ServicesApi] Error deactivating service:', error);
      throw error;
    }
  }
}

export const servicesApi = new ServicesApi();
export type { Service };
