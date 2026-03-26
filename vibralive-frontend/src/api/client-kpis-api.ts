import { api } from '@/lib/api';
import { ClientGrowthKPIs, ClientGrowthKPIsResponse } from '@/types';

class ClientKPIsApi {
  /**
   * GET /clients/dashboard/growth-kpis
   * Returns strategic KPIs related to client growth for the current clinic
   *
   * @returns Client growth KPIs data
   */
  async getGrowthKPIs(): Promise<ClientGrowthKPIs | null> {
    try {
      const response = await api.get<ClientGrowthKPIsResponse>('/clients/dashboard/growth-kpis');
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (error: any) {
      console.error('[ClientKPIsApi] Error fetching growth KPIs:', error);
      return null;
    }
  }
}

export const clientKPIsApi = new ClientKPIsApi();
