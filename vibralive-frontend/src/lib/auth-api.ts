import { apiClient } from '@/lib/api-client';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
}

export interface UpdateProfilePayload {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export const authApi = {
  /**
   * Obtener perfil del usuario actual
   */
  getProfile: async (): Promise<UserProfile> => {
    return apiClient.get<UserProfile>('/auth/me');
  },

  /**
   * Actualizar perfil del usuario
   */
  updateProfile: async (payload: UpdateProfilePayload): Promise<UserProfile> => {
    return apiClient.put<UserProfile>('/auth/me', {
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      address: payload.address,
      city: payload.city,
      postal_code: payload.postalCode,
      country: payload.country,
    });
  },

  /**
   * Cambiar contraseña del usuario
   */
  changePassword: async (payload: ChangePasswordPayload): Promise<{ message: string }> => {
    return apiClient.put<{ message: string }>('/auth/me/password', {
      currentPassword: payload.currentPassword,
      newPassword: payload.newPassword,
    });
  },
};
