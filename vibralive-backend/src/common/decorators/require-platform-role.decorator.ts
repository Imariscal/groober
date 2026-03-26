import { SetMetadata } from '@nestjs/common';

/**
 * Decorator para requerir un rol específico de plataforma
 * Uso: @RequirePlatformRole('PLATFORM_SUPERADMIN')
 */
export const RequirePlatformRole = (role: string) =>
  SetMetadata('requires_platform_role', role);
