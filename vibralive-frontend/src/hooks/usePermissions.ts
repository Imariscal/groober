'use client';

import { useAuth } from '@/hooks/useAuth';
import { hasRequiredPermissions } from '@/components/dashboard/menu-config';

/**
 * Hook para verificar permisos del usuario
 * 
 * Ejemplos:
 * const { canCreate } = usePermissions();
 * const { hasAny, hasAll } = usePermissions();
 * 
 * if (hasAny(['clients:create'])) {
 *   // Mostrar botón crear
 * }
 */
export function usePermissions() {
  const { user } = useAuth();

  const userPermissions = user?.permissions || [];

  return {
    /**
     * Verificar si tiene AL MENOS UNO de los permisos
     */
    hasAny: (permissions: string[]): boolean => {
      return hasRequiredPermissions(userPermissions, permissions);
    },

    /**
     * Verificar si tiene TODOS los permisos
     */
    hasAll: (permissions: string[]): boolean => {
      return permissions.every(perm => userPermissions.includes(perm));
    },

    /**
     * Verificar si tiene un permiso específico
     */
    has: (permission: string): boolean => {
      return userPermissions.includes(permission);
    },

    /**
     * Verificar si tiene un rol específico
     */
    isRole: (role: string): boolean => {
      return user?.role === role;
    },

    /**
     * Verificar si es propietario de clínica
     */
    isOwner: (): boolean => {
      return user?.role === 'CLINIC_OWNER';
    },

    /**
     * Verificar si es superadmin
     */
    isSuperAdmin: (): boolean => {
      return user?.role === 'SUPER_ADMIN';
    },

    /**
     * Verificar si es staff o stylist
     */
    isStaff: (): boolean => {
      return user?.role === 'CLINIC_STAFF' || user?.role === 'CLINIC_STYLIST';
    },

    /**
     * Obtener todos los permisos del usuario
     */
    all: (): string[] => {
      return userPermissions;
    },

    /**
     * Verificar si tiene acceso a una característica
     */
    hasFeature: (feature: string): boolean => {
      return user?.available_features?.includes(feature) || false;
    },

    /**
     * Verificar si puede acceder a un menu item
     */
    canAccess: (requiredPermissions?: string[], requiredRole?: string): boolean => {
      if (requiredRole && !this.isRole(requiredRole)) {
        return false;
      }
      if (requiredPermissions && requiredPermissions.length > 0) {
        return this.hasAny(requiredPermissions);
      }
      return true;
    },
  };
}

/**
 * Hook para acciones comunes
 */
export function useActions() {
  const { hasAny, has } = usePermissions();

  return {
    canCreateClient: () => has('clients:create'),
    canUpdateClient: () => has('clients:update'),
    canDeleteClient: () => has('clients:delete'),
    canCreatePet: () => has('pets:create'),
    canUpdatePet: () => has('pets:update'),
    canDeletePet: () => has('pets:delete'),
    canCreateAppointment: () => has('appointments:create'),
    canUpdateAppointment: () => has('appointments:update'),
    canCompleteAppointment: () => has('appointments:complete'),
    canCreateService: () => has('services:create'),
    canUpdateService: () => has('services:update'),
    canDeleteService: () => has('services:delete'),
    canViewReports: () => has('reports:view'),
    canManageUsers: () => has('users:create'),
    canManageClinic: () => has('clinic:manage'),
    canManagePricing: () => hasAny(['pricing:price_lists:read', 'pricing:service_prices:read']),
    canManageCampaigns: () => has('campaigns:read'),
  };
}
