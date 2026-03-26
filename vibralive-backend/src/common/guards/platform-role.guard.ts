import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class PlatformRoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Buscar rol requerido - puede venir como 'platform_roles' (array) del decorador
    const requiredRoles = this.reflector.get<string[]>(
      'platform_roles',
      context.getHandler(),
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // Sin requerimiento de rol
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    // Si el usuario es superadmin a nivel de sistema de clínicas o plataforma, tiene acceso a todo
    if (user.role === 'superadmin') {
      return true;
    }

    // Buscar en platform_roles (relación), o roles (array)
    const userRoles = user.platform_roles || user.roles || [];
    const hasRole = requiredRoles.some((role) =>
      userRoles.some((r: any) => {
        if (typeof r === 'string') return r === role;
        return r.key === role;
      }),
    );

    if (!hasRole) {
      throw new ForbiddenException(
        `Se requiere rol de plataforma: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
