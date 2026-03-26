import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { PlatformRole } from '../entities/platform-role.entity';
import { PlatformUser } from '../entities/platform-user.entity';

export const PLATFORM_ROLES = [
  {
    key: 'PLATFORM_SUPERADMIN',
    name: 'Platform SuperAdmin',
    description: 'Control total de la plataforma',
    permissions: [
      'clinics:create',
      'clinics:read',
      'clinics:update',
      'clinics:delete',
      'clinics:suspend',
      'clinics:activate',
      'users:create',
      'users:read',
      'users:update',
      'users:delete',
      'users:invite',
      'users:reset_password',
      'users:impersonate',
      'users:deactivate',
      'audit_logs:read',
      'audit_logs:export',
      'plans:read',
      'plans:update',
      'permissions:read',
      'permissions:manage',
    ],
    is_immutable: true,
  },
  {
    key: 'PLATFORM_SUPPORT',
    name: 'Platform Support',
    description: 'Soporte y asistencia a clínicas',
    permissions: [
      'clinics:read',
      'clinics:activate',
      'users:read',
      'users:create',
      'users:invite',
      'users:reset_password',
      'users:deactivate',
      'audit_logs:read',
    ],
    is_immutable: true,
  },
  {
    key: 'PLATFORM_FINANCE',
    name: 'Platform Finance',
    description: 'Reportería financiera (solo lectura)',
    permissions: [
      'clinics:read',
      'plans:read',
      'audit_logs:read',
      'reports:read',
    ],
    is_immutable: true,
  },
];

export async function seedPlatformRoles(
  roleRepository: Repository<PlatformRole>,
): Promise<PlatformRole[]> {
  const existingRoles = await roleRepository.find();

  if (existingRoles.length > 0) {
    console.log('✓ Platform roles ya existen');
    return existingRoles;
  }

  const roles = await roleRepository.save(PLATFORM_ROLES);
  console.log(`✓ Creados ${roles.length} roles de plataforma`);
  return roles;
}

export async function seedPlatformSuperAdmin(
  userRepository: Repository<PlatformUser>,
  roleRepository: Repository<PlatformRole>,
): Promise<PlatformUser | null> {
  const DEFAULT_SUPER_ADMIN_EMAIL = 'admin@vibralive.test';
  const DEFAULT_SUPER_ADMIN_PASSWORD = 'Admin@123456';

  const existingAdmin = await userRepository.findOne({
    where: { email: DEFAULT_SUPER_ADMIN_EMAIL },
  });

  if (existingAdmin) {
    console.log('✓ Super admin ya existe');
    return existingAdmin;
  }

  const superAdminRole = await roleRepository.findOne({
    where: { key: 'PLATFORM_SUPERADMIN' },
  });

  if (!superAdminRole) {
    console.error('✗ No se encontró el rol PLATFORM_SUPERADMIN');
    return null;
  }

  const hashedPassword = await bcrypt.hash(DEFAULT_SUPER_ADMIN_PASSWORD, 10);

  const admin = userRepository.create({
    email: DEFAULT_SUPER_ADMIN_EMAIL,
    full_name: 'Admin VibraLive',
    password_hash: hashedPassword,
    status: 'ACTIVE',
    platform_roles: [superAdminRole],
  });

  const savedAdmin = await userRepository.save(admin);
  console.log(
    `✓ Super admin creado: ${DEFAULT_SUPER_ADMIN_EMAIL} / ${DEFAULT_SUPER_ADMIN_PASSWORD}`,
  );
  return savedAdmin;
}
