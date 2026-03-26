import { Permission } from '../entities/permission.entity';
import { Role } from '../entities/role.entity';
import { RolePermission } from '../entities/role-permission.entity';
import { AppDataSource } from '../data-source';
import { ROLES_PERMISSIONS } from '../../modules/auth/constants/roles-permissions.const';

/**
 * SEED: System Permissions
 * Inserta todos los permisos del sistema desde la configuración centralizada de roles-permissions.const
 */

// Extraer todos los permisos únicos de la configuración centralizada
const allPermissions = Array.from(
  new Map(
    Object.values(ROLES_PERMISSIONS)
      .flatMap(role => role.permissions)
      .map(perm => [
        perm.key,
        {
          code: perm.key.toUpperCase().replace(/:/g, '_'),
          name: perm.key,
          description: perm.description,
          category: perm.key.split(':')[0],
        },
      ])
  ).values()
);

async function runSeed() {
  try {
    console.log('\n🔐 Conectando a base de datos...');
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    console.log('✅ Conexión establecida\n');

    const permissionRepository = AppDataSource.getRepository(Permission);
    const roleRepository = AppDataSource.getRepository(Role);
    const rolePermissionRepository = AppDataSource.getRepository(RolePermission);

    // PASO 1: VERIFICAR PERMISOS EXISTENTES
    console.log('🔍 Verificando permisos existentes...\n');
    const existingPermissions = await permissionRepository.find();
    const existingCodes = new Set(existingPermissions.map(p => p.code));

    // PASO 2: INSERTAR PERMISOS FALTANTES
    console.log(`📝 Insertando permisos del sistema...\n`);
    const permissionsToCreate = allPermissions.filter(p => !existingCodes.has(p.code));
    const createdPermissions: Permission[] = [];

    for (const permData of permissionsToCreate) {
      const permission = permissionRepository.create({
        code: permData.code,
        name: permData.name,
        description: permData.description,
        category: permData.category,
      });
      const savedPermission = await permissionRepository.save(permission);
      createdPermissions.push(savedPermission);
      console.log(`  ✅ ${permData.name}`);
    }

    // Combinar con existentes para asignación de roles
    const allDbPermissions = [...existingPermissions, ...createdPermissions];
    console.log(`\n✨ Total: ${allDbPermissions.length} permisos en sistema\n`);

    // PASO 3: OBTENER ROLES DEL SISTEMA
    console.log('🔍 Buscando roles del sistema...');
    const superAdminRole = await roleRepository.findOne({ where: { code: 'SUPER_ADMIN' } });
    const clinicOwnerRole = await roleRepository.findOne({ where: { code: 'CLINIC_OWNER' } });
    const clinicStaffRole = await roleRepository.findOne({ where: { code: 'CLINIC_STAFF' } });
    const clinicStylistRole = await roleRepository.findOne({ where: { code: 'CLINIC_STYLIST' } });
    const clinicVetRole = await roleRepository.findOne({ where: { code: 'CLINIC_VETERINARIAN' } });

    // PASO 4: ASIGNAR PERMISOS A ROLES
    console.log('\n🔗 Asignando permisos a roles...\n');

    async function assignPermissionsToRole(
      role: Role | null | undefined,
      permissionNames: string[]
    ) {
      if (!role) {
        return 0;
      }

      console.log(`  👤 ${role.name} (${role.code})`);

      // Eliminar permisos anteriores para este rol
      await rolePermissionRepository
        .createQueryBuilder()
        .delete()
        .where('roleId = :roleId', { roleId: role.id })
        .execute();

      let count = 0;
      for (const permName of permissionNames) {
        const permission = allDbPermissions.find(p => p.name === permName);
        if (permission) {
          await rolePermissionRepository.save({
            roleId: role.id,
            permissionId: permission.id,
          });
          count++;
        }
      }
      console.log(`     ✅ ${count} permisos asignados\n`);
      return count;
    }

    // Asignar desde la configuración centralizada
    // SUPER_ADMIN: Todos los permisos de plataforma
    if (superAdminRole) {
      const superAdminPerms = ROLES_PERMISSIONS.SUPER_ADMIN.permissions.map(p => p.key);
      await assignPermissionsToRole(superAdminRole, superAdminPerms);
    } else {
      console.warn('⚠️ Rol SUPER_ADMIN no encontrado');
    }

    // CLINIC_OWNER: Todos los permisos del sistema
    if (clinicOwnerRole) {
      // Extraer todos los permisos de todas las configuraciones de roles clínica
      const allRolePermissions = Array.from(
        new Map(
          Object.values(ROLES_PERMISSIONS)
            .filter(role => role !== ROLES_PERMISSIONS.SUPER_ADMIN) // Excluir SUPER_ADMIN
            .flatMap(role => role.permissions)
            .map(p => [p.key, p])
        ).values()
      ).map(p => p.key);
      
      await assignPermissionsToRole(clinicOwnerRole, allRolePermissions);
    } else {
      console.warn('⚠️ Rol CLINIC_OWNER no encontrado');
    }

    // CLINIC_STAFF: Permisos limitados
    if (clinicStaffRole) {
      const staffPerms = ROLES_PERMISSIONS.CLINIC_STAFF.permissions.map(p => p.key);
      await assignPermissionsToRole(clinicStaffRole, staffPerms);
    } else {
      console.warn('⚠️ Rol CLINIC_STAFF no encontrado');
    }

    // CLINIC_STYLIST: Permisos de estilo
    if (clinicStylistRole) {
      const stylistPerms = ROLES_PERMISSIONS.CLINIC_STYLIST.permissions.map(p => p.key);
      await assignPermissionsToRole(clinicStylistRole, stylistPerms);
    } else {
      console.warn('⚠️ Rol CLINIC_STYLIST no encontrado');
    }

    // CLINIC_VETERINARIAN: Permisos médicos
    if (clinicVetRole) {
      const vetPerms = ROLES_PERMISSIONS.CLINIC_VETERINARIAN.permissions.map(p => p.key);
      await assignPermissionsToRole(clinicVetRole, vetPerms);
    } else {
      console.warn('⚠️ Rol CLINIC_VETERINARIAN no encontrado');
    }

    console.log('🎉 ¡SEED completado!\n');
    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
    process.exit(1);
  }
}

runSeed();
