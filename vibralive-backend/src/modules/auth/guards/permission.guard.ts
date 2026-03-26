import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { hasPermission, UserRole } from '../constants/roles-permissions.const';

/**
 * Guard que valida que el usuario tenga los permisos requeridos
 * Se usa en conjunto con el decorador @RequirePermission
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.get<string[]>(
      'required_permissions',
      context.getHandler(),
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    // Verificar si el usuario tiene alguno de los permisos requeridos
    const hasRequiredPermission = requiredPermissions.some((permission) =>
      hasPermission(user.role as UserRole, permission),
    );

    if (!hasRequiredPermission) {
      throw new ForbiddenException(
        `Acceso denegado. Se requieren permisos: ${requiredPermissions.join(', ')}`,
      );
    }

    return true;
  }
}
