'use client';

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface PermissionGateRouteProps {
  children?: ReactNode;
  permissions?: string[];
  allPermissions?: string[];
  feature?: string;
  role?: string;
  fallback?: ReactNode;
  redirectTo?: string;
}

/**
 * Componente que protege rutas: redirige si el usuario no tiene los permisos requeridos
 *
 * @example
 * // En un layout o página:
 * <PermissionGateRoute permissions={['clients:read']}>
 *   <ClientsList />
 * </PermissionGateRoute>
 *
 * Si no tiene permiso, redirige a /dashboard por defecto
 * O a redirectTo si se especifica
 */
export function PermissionGateRoute({
  children,
  permissions,
  allPermissions,
  feature,
  role,
  fallback = null,
  redirectTo = '/dashboard',
}: PermissionGateRouteProps) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    // No se pudo autenticar, redirigir a login
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Validar permisos
    let hasAccess = true;

    if (permissions && permissions.length > 0) {
      // Requiere AL MENOS UN permiso
      hasAccess = permissions.some(p => user?.permissions?.includes(p));
    }

    if (allPermissions && allPermissions.length > 0) {
      // Requiere TODOS los permisos
      hasAccess = allPermissions.every(p => user?.permissions?.includes(p));
    }

    if (role) {
      // Requiere rol específico
      hasAccess = user?.role === role;
    }

    // Si no tiene acceso, redirigir
    if (!hasAccess) {
      router.push(redirectTo);
      return;
    }
  }, [isAuthenticated, user, permissions, allPermissions, role, redirectTo, router]);

  // Si llegamos aquí, tiene permisos
  return <>{children || fallback}</>;
}

export default PermissionGateRoute;
