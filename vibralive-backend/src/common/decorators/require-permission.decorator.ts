import { SetMetadata } from '@nestjs/common';

export const RequirePlatformRole = (...roles: string[]) =>
  SetMetadata('platform_roles', roles);

export const RequirePermission = (...permissions: string[]) =>
  SetMetadata('permissions', permissions);

export const RequireAnyPermission = (...permissions: string[]) =>
  SetMetadata('any_permissions', permissions);
