import { api } from '@/lib/api';
import { ServicePackage, CreateServicePackagePayload, UpdateServicePackagePayload } from '@/types';

class PackagesApi {
  /**
   * GET /service-packages
   * Returns all service packages for the clinic
   *
   * @returns Array of ServicePackage objects
   */
  async getPackages() {
    try {
      const response = await api.get('/service-packages');
      const packages = (response.data?.data || response.data || []) as ServicePackage[];
      return packages || [];
    } catch (error: any) {
      console.error('[PackagesApi] Error fetching packages:', error);
      return [];
    }
  }

  /**
   * GET /service-packages/:id
   * Returns a single package by ID
   *
   * @param packageId - ID of the package
   * @returns ServicePackage object or null if not found
   */
  async getPackage(packageId: string) {
    try {
      const response = await api.get(`/service-packages/${packageId}`);
      const servicePackage = (response.data?.data || response.data || null) as ServicePackage | null;
      return servicePackage;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      console.error('[PackagesApi] Error fetching package:', error);
      return null;
    }
  }

  /**
   * POST /service-packages
   * Create a new service package
   *
   * @param payload - Package creation data
   * @returns Created ServicePackage object
   */
  async createPackage(payload: CreateServicePackagePayload) {
    try {
      const response = await api.post('/service-packages', payload);
      const servicePackage = (response.data?.data || response.data) as ServicePackage;
      return servicePackage;
    } catch (error: any) {
      console.error('[PackagesApi] Error creating package:', error);
      throw error;
    }
  }

  /**
   * PATCH /service-packages/:id
   * Update an existing service package
   *
   * @param packageId - ID of the package
   * @param payload - Package update data
   * @returns Updated ServicePackage object
   */
  async updatePackage(packageId: string, payload: UpdateServicePackagePayload) {
    try {
      const response = await api.patch(`/service-packages/${packageId}`, payload);
      const servicePackage = (response.data?.data || response.data) as ServicePackage;
      return servicePackage;
    } catch (error: any) {
      console.error('[PackagesApi] Error updating package:', error);
      throw error;
    }
  }

  /**
   * DELETE /service-packages/:id
   * Delete a service package
   *
   * @param packageId - ID of the package
   */
  async deletePackage(packageId: string) {
    try {
      await api.delete(`/service-packages/${packageId}`);
    } catch (error: any) {
      console.error('[PackagesApi] Error deleting package:', error);
      throw error;
    }
  }

  /**
   * PATCH /service-packages/:id/deactivate
   * Deactivate a service package (soft delete)
   *
   * @param packageId - ID of the package
   * @returns Updated ServicePackage object
   */
  async deactivatePackage(packageId: string) {
    try {
      const response = await api.patch(`/service-packages/${packageId}/deactivate`);
      const servicePackage = (response.data?.data || response.data) as ServicePackage;
      return servicePackage;
    } catch (error: any) {
      console.error('[PackagesApi] Error deactivating package:', error);
      throw error;
    }
  }
}

export const packagesApi = new PackagesApi();
export type { ServicePackage };
