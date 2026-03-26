import { apiRequest } from '@/lib/api-client';

export interface ClinicConfig {
  notificationsEmail: boolean;
  notificationsSMS: boolean;
  privacy: 'public' | 'private';
  language: 'es' | 'en';
  timezone: string;
}

export const clinicConfigApi = {
  /**
   * Obtener configuraciones de la clínica
   */
  getConfiguration: async (): Promise<ClinicConfig> => {
    return apiRequest('/clinic/configurations', {
      method: 'GET',
    });
  },

  /**
   * Actualizar configuraciones de la clínica
   */
  updateConfiguration: async (config: Partial<ClinicConfig>) => {
    return apiRequest('/clinic/configurations', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  },
};
