import { api } from '@/lib/api';
import { ServiceSizePrice, CreateServiceSizePricePayload, UpdateServiceSizePricePayload } from '@/types';

class ServiceSizePriceApi {
  /**
   * GET /services/:serviceId/size-prices
   * Get all size prices for a service
   */
  async getSizePrices(serviceId: string): Promise<ServiceSizePrice[]> {
    try {
      const response = await api.get(`/services/${serviceId}/size-prices`);
      const prices = (response.data?.data || response.data || []) as ServiceSizePrice[];
      return prices;
    } catch (error: any) {
      console.error('[ServiceSizePriceApi] Error fetching size prices:', error);
      return [];
    }
  }

  /**
   * GET /services/:serviceId/size-prices/:petSize
   * Get price for a specific pet size
   */
  async getSizePrice(serviceId: string, petSize: string): Promise<ServiceSizePrice | null> {
    try {
      const response = await api.get(`/services/${serviceId}/size-prices/${petSize}`);
      const price = (response.data?.data || response.data || null) as ServiceSizePrice | null;
      return price;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      console.error('[ServiceSizePriceApi] Error fetching size price:', error);
      return null;
    }
  }

  /**
   * POST /services/:serviceId/size-prices
   * Create a new size price
   */
  async createSizePrice(
    serviceId: string,
    payload: CreateServiceSizePricePayload,
  ): Promise<ServiceSizePrice> {
    try {
      const response = await api.post(`/services/${serviceId}/size-prices`, payload);
      const price = (response.data?.data || response.data) as ServiceSizePrice;
      return price;
    } catch (error: any) {
      console.error('[ServiceSizePriceApi] Error creating size price:', error);
      throw error;
    }
  }

  /**
   * POST /services/:serviceId/size-prices/batch
   * Create or update multiple size prices at once
   */
  async batchCreateSizePrices(
    serviceId: string,
    prices: CreateServiceSizePricePayload[],
  ): Promise<ServiceSizePrice[]> {
    try {
      const response = await api.post(`/services/${serviceId}/size-prices/batch`, {
        prices,
      });
      const results = (response.data?.data || response.data || []) as ServiceSizePrice[];
      return results;
    } catch (error: any) {
      console.error('[ServiceSizePriceApi] Error batch creating size prices:', error);
      throw error;
    }
  }

  /**
   * PATCH /services/:serviceId/size-prices/:petSize
   * Update a size price
   */
  async updateSizePrice(
    serviceId: string,
    petSize: string,
    payload: UpdateServiceSizePricePayload,
  ): Promise<ServiceSizePrice> {
    try {
      const response = await api.patch(
        `/services/${serviceId}/size-prices/${petSize}`,
        payload,
      );
      const price = (response.data?.data || response.data) as ServiceSizePrice;
      return price;
    } catch (error: any) {
      console.error('[ServiceSizePriceApi] Error updating size price:', error);
      throw error;
    }
  }

  /**
   * DELETE /services/:serviceId/size-prices/:petSize
   * Delete a size price
   */
  async deleteSizePrice(serviceId: string, petSize: string): Promise<void> {
    try {
      await api.delete(`/services/${serviceId}/size-prices/${petSize}`);
    } catch (error: any) {
      console.error('[ServiceSizePriceApi] Error deleting size price:', error);
      throw error;
    }
  }

  /**
   * GET /price-lists/:priceListId/services/:serviceId/size-prices/:petSize
   * Get price for a specific pet size in a specific price list
   */
  async getPriceListSizePrice(
    priceListId: string,
    serviceId: string,
    petSize: string,
  ): Promise<ServiceSizePrice | null> {
    try {
      const response = await api.get(
        `/price-lists/${priceListId}/services/${serviceId}/size-prices/${petSize}`
      );
      const price = (response.data?.data || response.data || null) as ServiceSizePrice | null;
      console.log(`[ServiceSizePriceApi] getPriceListSizePrice:`, {
        priceListId,
        serviceId,
        petSize,
        price,
      });
      return price;
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log(`[ServiceSizePriceApi] No price found for ${serviceId}/${petSize} in list ${priceListId}`);
        return null;
      }
      console.error('[ServiceSizePriceApi] Error fetching list price:', error);
      return null;
    }
  }

  /**
   * POST /services/:serviceId/size-prices/apply-all
   * Apply same price to all pet sizes
   */
  async applyPriceToAllSizes(
    serviceId: string,
    price: number,
    currency: string = 'MXN',
  ): Promise<ServiceSizePrice[]> {
    try {
      const response = await api.post(`/services/${serviceId}/size-prices/apply-all`, {
        price,
        currency,
      });
      const results = (response.data?.data || response.data || []) as ServiceSizePrice[];
      return results;
    } catch (error: any) {
      console.error('[ServiceSizePriceApi] Error applying price to all sizes:', error);
      throw error;
    }
  }
}

export const serviceSizePriceApi = new ServiceSizePriceApi();
