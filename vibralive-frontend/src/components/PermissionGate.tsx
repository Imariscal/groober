'use client';

import { ReactNode } from 'react';
import { useAuthStore } from '@/store/auth-store';

interface PermissionGateProps {
  children: ReactNode;
  require?: {
    permissions?: string[];
    allPermissions?: string[];
    feature?: string;
    role?: string;
  };
  fallback?: ReactNode;
  fallbackComponent?: React.ComponentType;
}

/**
 * Componente que renderiza contenido solo si el usuario tiene los permisos requeridos
 *
 * @example
 * // Requiere UNO de los permisos
 * <PermissionGate require={{ permissions: ['clinics:create', 'clinic:manage'] }}>
 *   <CreateClinicButton />
 * </PermissionGate>
 *
 * @example
 * // Requiere TODOS los permisos
 * <PermissionGate require={{ allPermissions: ['users:create', 'users:delete'] }}>
 *   <AdminPanel />
 * </PermissionGate>
 *
 * @example
 * // Requiere feature específico
 * <PermissionGate require={{ feature: 'clinics-management' }}>
 *   <ClinicsManager />
 * </PermissionGate>
 *
 * @example
 * // Requiere rol específico
 * <PermissionGate require={{ role: 'superadmin' }}>
 *   <AdminDashboard />
 * </PermissionGate>
 */
export function PermissionGate({
  children,
  require,
  fallback = null,
  fallbackComponent: FallbackComponent,
}: PermissionGateProps) {
  const {
    hasPermissions,
    hasAllPermissions,
    hasFeature,
    hasRole,
    isAuthenticated,
  } = useAuthStore();

  // Si no hay requerimientos, renderiza siempre
  if (!require) {
    return <>{children}</>;
  }

  // Validar autenticación
  if (!isAuthenticated) {
    return FallbackComponent ? <FallbackComponent /> : fallback;
  }

  // Validar permisos (OR logic)
  if (require.permissions) {
    if (!hasPermissions(require.permissions)) {
      return FallbackComponent ? <FallbackComponent /> : fallback;
    }
  }

  // Validar todos los permisos (AND logic)
  if (require.allPermissions) {
    if (!hasAllPermissions(require.allPermissions)) {
      return FallbackComponent ? <FallbackComponent /> : fallback;
    }
  }

  // Validar feature
  if (require.feature) {
    if (!hasFeature(require.feature)) {
      return FallbackComponent ? <FallbackComponent /> : fallback;
    }
  }

  // Validar role
  if (require.role) {
    if (!hasRole(require.role)) {
      return FallbackComponent ? <FallbackComponent /> : fallback;
    }
  }

  return <>{children}</>;
}

/**
 * Hook para validar permisos en lógica (no en render)
 */
export function usePermissions() {
  return useAuthStore((state) => ({
    hasPermission: state.hasPermission,
    hasPermissions: state.hasPermissions,
    hasAllPermissions: state.hasAllPermissions,
    hasFeature: state.hasFeature,
    hasRole: state.hasRole,
    canAccess: state.canAccess,
  }));
}
