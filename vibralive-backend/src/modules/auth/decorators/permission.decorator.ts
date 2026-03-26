import { SetMetadata } from '@nestjs/common';

/**
 * Decorador para especificar los permisos requeridos para acceder a un endpoint
 * @param permissions - Array de permisos requeridos (se valida con OR logic)
 *
 * @example
 * @RequirePermission('clinics:create', 'clinics:update')
 * async createClinic() { ... }
 */
export const RequirePermission = (...permissions: string[]) =>
  SetMetadata('required_permissions', permissions);

/**
 * Decorador para especificar los roles requeridos
 * @param roles - Array de roles permitidos
 *
 * @example
 * @RequireRole('superadmin', 'owner')
 * async manageUsers() { ... }
 */
export const RequireRole = (...roles: string[]) =>
  SetMetadata('required_roles', roles);
