'use client';

import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
  requiredRole?: string;
}

/**
 * Component that controls access to routes based on user permissions and roles
 * Requires usePermissions hook to be available in the context
 */
export default function ProtectedRoute({
  children,
  requiredPermissions,
  requiredRole,
}: ProtectedRouteProps) {
  const { hasAll, isRole } = usePermissions();

  // Check role requirement
  if (requiredRole && !isRole(requiredRole)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Acceso Denegado</h1>
          <p className="text-gray-600 mt-2">
            No tienes permisos para acceder a esta página
          </p>
        </div>
      </div>
    );
  }

  // Check permission requirements
  if (requiredPermissions) {
    // If ANY permission is required, check if user has at least one
    const hasAtLeastOnePermission = requiredPermissions.length === 0 ||
      requiredPermissions.some(perm => hasAll([perm]));

    if (!hasAtLeastOnePermission) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Acceso Denegado</h1>
            <p className="text-gray-600 mt-2">
              No tienes permisos para acceder a esta página
            </p>
          </div>
        </div>
      );
    }
  }

  // Render children if all checks pass
  return <>{children}</>;
}
