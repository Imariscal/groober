'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';

export function useAuth() {
  const authStore = useAuthStore();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        authStore.loadFromStorage();
      } catch (error) {
        console.error('Failed to load auth:', error);
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    const { apiClient } = await import('@/lib/api-client');
    try {
      authStore.setLoading(true);
      authStore.setError(null);

      const response = await apiClient.login({ email, password });

      // Guardar SIEMPRE en localStorage (para poder cargar en siguiente sesión)
      localStorage.setItem('user', JSON.stringify(response.user));
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('rememberMe', rememberMe.toString());

      // También guardar en sessionStorage para esta sesión
      sessionStorage.setItem('user', JSON.stringify(response.user));
      sessionStorage.setItem('access_token', response.access_token);

      // Actualizar authStore ANTES de redirigir
      authStore.setUser(response.user);
      authStore.setToken(response.access_token);
      authStore.setLoading(false);

      // Redirigir según rol
      const redirectUrl = getRedirectByRole(response.user.role);
      // Usar setTimeout para asegurar que el estado se actualice primero
      setTimeout(() => {
        router.push(redirectUrl);
      }, 100);

      return response;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed';
      authStore.setError(message);
      authStore.setLoading(false);
      throw error;
    }
  };

  const register = async (
    clinicName: string,
    clinicPhone: string,
    city: string,
    ownerName: string,
    ownerEmail: string,
    password: string,
  ) => {
    const { apiClient } = await import('@/lib/api-client');
    try {
      authStore.setLoading(true);
      authStore.setError(null);

      const response = await apiClient.register({
        clinic_name: clinicName,
        clinic_phone: clinicPhone,
        city,
        owner_name: ownerName,
        owner_email: ownerEmail,
        password,
      });

      // Guardar en localStorage
      localStorage.setItem('user', JSON.stringify(response.user));
      localStorage.setItem('access_token', response.access_token);

      authStore.setUser(response.user);
      authStore.setToken(response.access_token);

      router.push('/clinic/dashboard');

      return response;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed';
      authStore.setError(message);
      throw error;
    } finally {
      authStore.setLoading(false);
    }
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      localStorage.removeItem('access_token');
      localStorage.removeItem('rememberMe');
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('access_token');
      sessionStorage.removeItem('rememberMe');
    }
    authStore.logout();
    router.push('/auth/login');
  };

  const acceptInvitation = async (invitationToken: string, password: string) => {
    const { apiClient } = await import('@/lib/api-client');
    try {
      authStore.setLoading(true);
      authStore.setError(null);

      const response = await apiClient.acceptInvitation({
        invitation_token: invitationToken,
        password,
      });

      // Guardar en localStorage y sessionStorage
      localStorage.setItem('user', JSON.stringify(response.user));
      localStorage.setItem('access_token', response.access_token);
      sessionStorage.setItem('user', JSON.stringify(response.user));
      sessionStorage.setItem('access_token', response.access_token);

      // Actualizar store
      authStore.setUser(response.user);
      authStore.setToken(response.access_token);
      authStore.setLoading(false);

      // Redirigir según rol
      const redirectUrl = getRedirectByRole(response.user.role);
      setTimeout(() => {
        router.push(redirectUrl);
      }, 100);

      return response;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al aceptar la invitación';
      authStore.setError(message);
      authStore.setLoading(false);
      throw error;
    }
  };

  const refreshUser = async () => {
    const { apiClient } = await import('@/lib/api-client');
    try {
      const response = await apiClient.get('/auth/me');
      const userData = response.user || response;
      authStore.setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return userData;
    } catch (error) {
      logout();
      throw error;
    }
  };

  const updateUser = (userData: Partial<any>) => {
    if (!authStore.user) return;
    const updatedUser = {
      ...authStore.user,
      ...userData,
    };
    authStore.setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return {
    // State
    user: authStore.user,
    token: authStore.token,
    isAuthenticated: authStore.isAuthenticated,
    isLoading: authStore.isLoading || isLoading,
    error: authStore.error,
    isInitialized,

    // Actions
    login,
    register,
    logout,
    acceptInvitation,
    refreshUser,
    updateUser,

    // Permission checks
    hasPermission: authStore.hasPermission,
    hasPermissions: authStore.hasPermissions,
    hasAllPermissions: authStore.hasAllPermissions,
    hasFeature: authStore.hasFeature,
    hasRole: authStore.hasRole,
    canAccess: authStore.canAccess,
  };
}

/**
 * Redirigir según el rol del usuario
 */
function getRedirectByRole(role: string): string {
  switch (role) {
    case 'SUPER_ADMIN':
      return '/platform/dashboard';
    case 'CLINIC_OWNER':
      return '/clinic/dashboard';
    case 'CLINIC_STAFF':
    case 'CLINIC_STYLIST':
    case 'CLINIC_VETERINARIAN':
      return '/staff/dashboard';
    default:
      return '/dashboard';
  }
}
