'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermissions?: string[];
  requiredRole?: string;
  requiredFeature?: string;
  fallback?: ReactNode;
}

/**
 * Componente que protege rutas completamente
 * Redirige a login si no está autenticado
 * Redirige a /unauthorized si no tiene permisos
 *
 * @example
 * <ProtectedRoute requiredRole="superadmin">
 *   <AdminDashboard />
 * </ProtectedRoute>
 */
export function ProtectedRoute({
  children,
  requiredPermissions,
  requiredRole,
  requiredFeature,
  fallback,
}: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const { isLoading, isInitialized } = useAuth();

  useEffect(() => {
    // Esperar a que cargue desde localStorage
    if (!isInitialized) return;

    // No autenticado
    if (!isAuthenticated || !user) {
      router.push('/auth/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    // Validar rol
    if (requiredRole && user.role !== requiredRole) {
      router.push('/unauthorized');
      return;
    }

    // Validar permisos
    if (requiredPermissions && requiredPermissions.length > 0) {
      const hasPermission = requiredPermissions.some((perm) =>
        user.permissions?.includes(perm)
      );
      if (!hasPermission) {
        router.push('/unauthorized');
        return;
      }
    }

    // Validar feature
    if (requiredFeature && !user.available_features?.includes(requiredFeature)) {
      router.push('/unauthorized');
      return;
    }
  }, [isAuthenticated, user, isInitialized, router, requiredRole, requiredPermissions, requiredFeature]);

  // Mostrando fallback mientras carga o si no está autenticado
  if (!isInitialized || !isAuthenticated || !user) {
    return fallback || <LoadingPage />;
  }

  return <>{children}</>;
}

function LoadingPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
        </div>
        <p className="text-gray-600 font-medium">Cargando...</p>
      </div>
    </div>
  );
}

/**
 * HOC para proteger componentes
 */
export function withProtectedRoute<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    requiredRole?: string;
    requiredPermissions?: string[];
    requiredFeature?: string;
  }
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute
        requiredRole={options?.requiredRole}
        requiredPermissions={options?.requiredPermissions}
        requiredFeature={options?.requiredFeature}
      >
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}
