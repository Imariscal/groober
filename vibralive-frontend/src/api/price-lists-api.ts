import { api } from '@/lib/api';
import { 
  PriceList, 
  CreatePriceListPayload, 
  UpdatePriceListPayload,
  ServicePrice,
  UpdateServicePricePayload,
  ServicePriceHistory,
  ServicePackagePrice,
  UpdatePackagePricePayload,
} from '@/types';

class PriceListsApi {
  /**
   * GET /api/price-lists
   * Returns all ACTIVE price lists for the clinic
   * Used for client price list selector dropdown
   *
   * @param clinicId - ID of clinic (automatically inferred from auth context)
   * @returns Array of active PriceList objects
   */
  async getActivePriceLists() {
    try {
      const response = await api.get('/price-lists');
      const priceLists = (response.data?.data || response.data || []) as PriceList[];
      return priceLists || [];
    } catch (error: any) {
      console.error('[PriceListsApi] Error fetching price lists:', error);
      return [];
    }
  }

  /**
   * GET /api/price-lists/default
   * Returns the default price list for clinic
   * Used when client has no explicit price list assigned
   *
   * @returns Default PriceList object or null if none exists
   */
  async getDefaultPriceList() {
    try {
      const response = await api.get('/price-lists/default');
      const priceList = (response.data?.data || response.data || null) as PriceList | null;
      return priceList;
    } catch (error: any) {
      // If no default price list exists, return null instead of throwing
      if (error.response?.status === 404) {
        return null;
      }
      console.error('[PriceListsApi] Error fetching default price list:', error);
      return null;
    }
  }

  /**
   * GET /api/price-lists/:id
   * Returns a single price list by ID (admin view - includes all service prices)
   *
   * @param priceListId - ID of the price list
   * @returns PriceList object or null if not found
   */
  async getPriceList(priceListId: string) {
    try {
      const response = await api.get(`/price-lists/${priceListId}`);
      const priceList = (response.data?.data || response.data || null) as PriceList | null;
      return priceList;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      console.error('[PriceListsApi] Error fetching price list:', error);
      return null;
    }
  }

  /**
   * POST /api/price-lists
   * Create a new price list
   *
   * @param payload - Price list creation data
   * @returns Created PriceList object
   */
  async createPriceList(payload: CreatePriceListPayload) {
    try {
      const response = await api.post('/price-lists', payload);
      const priceList = (response.data?.data || response.data) as PriceList;
      return priceList;
    } catch (error: any) {
      console.error('[PriceListsApi] Error creating price list:', error);
      throw error;
    }
  }

  /**
   * PATCH /api/price-lists/:id
   * Update an existing price list
   *
   * @param priceListId - ID of the price list
   * @param payload - Price list update data
   * @returns Updated PriceList object
   */
  async updatePriceList(priceListId: string, payload: UpdatePriceListPayload) {
    try {
      const response = await api.patch(`/price-lists/${priceListId}`, payload);
      const priceList = (response.data?.data || response.data) as PriceList;
      return priceList;
    } catch (error: any) {
      console.error('[PriceListsApi] Error updating price list:', error);
      throw error;
    }
  }

  /**
   * DELETE /api/price-lists/:id
   * Delete a price list
   *
   * @param priceListId - ID of the price list
   */
  async deletePriceList(priceListId: string) {
    try {
      await api.delete(`/price-lists/${priceListId}`);
    } catch (error: any) {
      console.error('[PriceListsApi] Error deleting price list:', error);
      throw error;
    }
  }

  /**
   * GET /api/price-lists/:priceListId/service-prices
   * Get service prices for a price list
   *
   * @param priceListId - ID of the price list
   * @param serviceId - Optional filter by service ID
   * @returns Array of ServicePrice objects
   */
  async getServicePrices(priceListId: string, serviceId?: string) {
    try {
      const params = new URLSearchParams();
      if (serviceId) {
        params.append('serviceId', serviceId);
      }
      const query = params.toString() ? `?${params.toString()}` : '';
      const response = await api.get(`/price-lists/${priceListId}/service-prices${query}`);
      const servicePrices = (response.data?.data || response.data || []) as ServicePrice[];
      return servicePrices || [];
    } catch (error: any) {
      console.error('[PriceListsApi] Error fetching service prices:', error);
      return [];
    }
  }

  /**
   * PATCH /api/price-lists/:priceListId/services/:serviceId/price
   * Update the price of a service within a price list
   *
   * @param priceListId - ID of the price list
   * @param serviceId - ID of the service
   * @param payload - Service price update data
   * @returns Updated ServicePrice object
   */
  async updateServicePrice(
    priceListId: string,
    serviceId: string,
    payload: UpdateServicePricePayload
  ) {
    try {
      const response = await api.patch(
        `/price-lists/${priceListId}/services/${serviceId}/price`,
        payload
      );
      const servicePrice = (response.data?.data || response.data) as ServicePrice;
      return servicePrice;
    } catch (error: any) {
      console.error('[PriceListsApi] Error updating service price:', error);
      throw error;
    }
  }

  /**
   * GET /api/price-lists/:priceListId/services/:serviceId/history
   * Get the price history for a service within a price list
   *
   * @param priceListId - ID of the price list
   * @param serviceId - ID of the service
   * @param limit - Maximum number of history records to return (default 20)
   * @returns Array of ServicePriceHistory objects
   */
  async getServicePriceHistory(
    priceListId: string,
    serviceId: string,
    limit: number = 20
  ) {
    try {
      const response = await api.get(
        `/price-lists/${priceListId}/services/${serviceId}/history?limit=${limit}`
      );
      const history = (response.data?.data || response.data || []) as ServicePriceHistory[];
      return history || [];
    } catch (error: any) {
      console.error('[PriceListsApi] Error fetching service price history:', error);
      return [];
    }
  }

  /**
   * DELETE /api/price-lists/:priceListId/services/:serviceId
   * Remove a service from a price list
   * ⚠️ Cannot remove services from the DEFAULT price list
   *
   * @param priceListId - ID of the price list
   * @param serviceId - ID of the service to remove
   * @returns Success message
   */
  async removeServiceFromPriceList(priceListId: string, serviceId: string) {
    try {
      const response = await api.delete(
        `/price-lists/${priceListId}/services/${serviceId}`
      );
      return response.data;
    } catch (error: any) {
      console.error('[PriceListsApi] Error removing service from price list:', error);
      throw error;
    }
  }

  /**
   * GET /api/price-lists/:priceListId/package-prices
   * Get package prices for a price list
   *
   * @param priceListId - ID of the price list
   * @param packageId - Optional filter by package ID
   * @returns Array of ServicePackagePrice objects
   */
  async getPackagePrices(priceListId: string, packageId?: string) {
    try {
      const params = new URLSearchParams();
      if (packageId) {
        params.append('packageId', packageId);
      }
      const query = params.toString() ? `?${params.toString()}` : '';
      const response = await api.get(`/price-lists/${priceListId}/package-prices${query}`);
      const packagePrices = (response.data?.data || response.data || []) as ServicePackagePrice[];
      return packagePrices || [];
    } catch (error: any) {
      console.error('[PriceListsApi] Error fetching package prices:', error);
      return [];
    }
  }

  /**
   * PATCH /api/price-lists/:priceListId/packages/:packageId/price
   * Update the price of a package within a price list
   *
   * @param priceListId - ID of the price list
   * @param packageId - ID of the package
   * @param payload - Package price update data
   * @returns Updated ServicePackagePrice object
   */
  async updatePackagePrice(
    priceListId: string,
    packageId: string,
    payload: UpdatePackagePricePayload
  ) {
    try {
      const response = await api.patch(
        `/price-lists/${priceListId}/packages/${packageId}/price`,
        payload
      );
      const packagePrice = (response.data?.data || response.data) as ServicePackagePrice;
      return packagePrice;
    } catch (error: any) {
      console.error('[PriceListsApi] Error updating package price:', error);
      throw error;
    }
  }

  /**
   * DELETE /api/price-lists/:priceListId/packages/:packageId
   * Remove a package from a price list
   * ⚠️ Cannot remove packages from the DEFAULT price list
   *
   * @param priceListId - ID of the price list
   * @param packageId - ID of the package to remove
   * @returns Success message
   */
  async removePackageFromPriceList(priceListId: string, packageId: string) {
    try {
      const response = await api.delete(
        `/price-lists/${priceListId}/packages/${packageId}`
      );
      return response.data;
    } catch (error: any) {
      console.error('[PriceListsApi] Error removing package from price list:', error);
      throw error;
    }
  }
}

export const priceListsApi = new PriceListsApi();
export type { PriceList, ServicePrice, ServicePriceHistory, ServicePackagePrice, UpdatePackagePricePayload };

