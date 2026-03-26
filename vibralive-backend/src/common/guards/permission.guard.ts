import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.get<string[]>(
      'permissions',
      context.getHandler(),
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true; // Sin requerimiento de permisos
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('No autenticado');
    }

    // Si el usuario es superadmin del sistema de clínicas, tiene acceso a todo
    if (user.role === 'superadmin') {
      return true;
    }

    // Extraer todos los permisos del usuario desde sus roles o directamente del JWT
    const userPermissions = new Set<string>();

    // Opción 1: Permisos directos en el JWT (para superadmin de plataforma)
    if (user.permissions && Array.isArray(user.permissions)) {
      user.permissions.forEach((permission: string) => {
        userPermissions.add(permission);
      });
    }

    // Opción 2: Permisos desde platform_roles (relaciones de BD)
    if (user.platform_roles && Array.isArray(user.platform_roles)) {
      user.platform_roles.forEach((role: any) => {
        if (role.permissions && Array.isArray(role.permissions)) {
          role.permissions.forEach((permission: string) => {
            userPermissions.add(permission);
          });
        }
      });
    }

    // Verificar si el usuario tiene al menos uno de los permisos requeridos
    const hasPermission = requiredPermissions.some((permission) =>
      userPermissions.has(permission),
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `Acceso denegado. Permisos requeridos: ${requiredPermissions.join(', ')}. Permisos disponibles: ${Array.from(userPermissions).join(', ') || 'ninguno'}`,
      );
    }

    return true;
  }
}
