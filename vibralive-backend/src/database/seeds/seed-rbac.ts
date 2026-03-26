import { DataSource } from 'typeorm';
import { Role } from '../entities/role.entity';
import { Permission } from '../entities/permission.entity';
import { RolePermission } from '../entities/role-permission.entity';
import { CreateDateColumn } from 'typeorm';

/**
 * RBAC Seed para VibraLive - Clínicas Veterinarias/Grooming
 * 
 * ARQUITECTURA DE ROLES:
 * =====================
 * 
 * 1. CLINIC_OWNER (Dueño)
 *    - Acceso TOTAL a todas las funcionalidades
 *    - Gestión de usuarios, roles y configuración
 *    - Reportes y análisis completos
 * 
 * 2. CLINIC_MANAGER (Gerente/Administrador)
 *    - Gestión operativa completa
 *    - Usuarios (sin gestión de roles)
 *    - Catálogos, precios, configuración operativa
 *    - No puede: eliminar permanentemente, gestionar roles
 * 
 * 3. CLINIC_STYLIST (Estilista/Groomer)
 *    - Citas: ver, actualizar estado, completar
 *    - Clientes y mascotas: ver, crear, actualizar
 *    - Servicios: solo lectura
 *    - No puede: eliminar, configurar, gestionar usuarios
 * 
 * 4. CLINIC_RECEPTIONIST (Recepcionista)
 *    - Citas: crear, ver, actualizar, cambiar estado
 *    - Clientes y mascotas: crear, ver, actualizar
 *    - Catalogo: solo lectura
 *    - No puede: completar citas, eliminar, configurar
 */

// ============================================
// DEFINICIÓN DE PERMISOS
// ============================================

interface PermissionDef {
  code: string;
  name: string;
  description: string;
  category: string;
}

const PERMISSIONS: PermissionDef[] = [
  // ====== DASHBOARD ======
  {
    code: 'DASHBOARD_VIEW',
    name: 'Ver Dashboard',
    description: 'Acceso al dashboard principal y KPIs',
    category: 'dashboard',
  },
  {
    code: 'DASHBOARD_ANALYTICS',
    name: 'Ver Analíticas Avanzadas',
    description: 'Acceso a reportes y analíticas detalladas',
    category: 'dashboard',
  },

  // ====== CLIENTES ======
  {
    code: 'CLIENT_CREATE',
    name: 'Crear Clientes',
    description: 'Permite registrar nuevos clientes en el sistema',
    category: 'clients',
  },
  {
    code: 'CLIENT_READ',
    name: 'Ver Clientes',
    description: 'Permite ver la lista y perfiles de clientes',
    category: 'clients',
  },
  {
    code: 'CLIENT_UPDATE',
    name: 'Editar Clientes',
    description: 'Permite modificar información de clientes',
    category: 'clients',
  },
  {
    code: 'CLIENT_DEACTIVATE',
    name: 'Desactivar Clientes',
    description: 'Permite desactivar clientes (soft delete)',
    category: 'clients',
  },
  {
    code: 'CLIENT_DELETE',
    name: 'Eliminar Clientes',
    description: 'Permite eliminar permanentemente clientes (hard delete)',
    category: 'clients',
  },

  // ====== MASCOTAS ======
  {
    code: 'PET_CREATE',
    name: 'Crear Mascotas',
    description: 'Permite registrar nuevas mascotas',
    category: 'pets',
  },
  {
    code: 'PET_READ',
    name: 'Ver Mascotas',
    description: 'Permite ver información de mascotas',
    category: 'pets',
  },
  {
    code: 'PET_UPDATE',
    name: 'Editar Mascotas',
    description: 'Permite modificar información de mascotas',
    category: 'pets',
  },
  {
    code: 'PET_DELETE',
    name: 'Eliminar Mascotas',
    description: 'Permite eliminar mascotas del sistema',
    category: 'pets',
  },

  // ====== CITAS/GROOMING ======
  {
    code: 'APPOINTMENT_CREATE',
    name: 'Crear Citas',
    description: 'Permite agendar nuevas citas de grooming',
    category: 'appointments',
  },
  {
    code: 'APPOINTMENT_READ',
    name: 'Ver Citas',
    description: 'Permite ver el calendario y lista de citas',
    category: 'appointments',
  },
  {
    code: 'APPOINTMENT_UPDATE',
    name: 'Editar Citas',
    description: 'Permite modificar información de citas',
    category: 'appointments',
  },
  {
    code: 'APPOINTMENT_UPDATE_STATUS',
    name: 'Cambiar Estado de Citas',
    description: 'Permite confirmar, cancelar o cambiar estado',
    category: 'appointments',
  },
  {
    code: 'APPOINTMENT_COMPLETE',
    name: 'Completar Citas',
    description: 'Permite marcar citas como completadas',
    category: 'appointments',
  },
  {
    code: 'APPOINTMENT_CANCEL',
    name: 'Cancelar Citas',
    description: 'Permite cancelar citas programadas',
    category: 'appointments',
  },
  {
    code: 'APPOINTMENT_PLAN_ROUTES',
    name: 'Planificar Rutas',
    description: 'Permite planificar rutas de grooming a domicilio',
    category: 'appointments',
  },

  // ====== SERVICIOS ======
  {
    code: 'SERVICE_CREATE',
    name: 'Crear Servicios',
    description: 'Permite crear nuevos servicios en el catálogo',
    category: 'services',
  },
  {
    code: 'SERVICE_READ',
    name: 'Ver Servicios',
    description: 'Permite ver el catálogo de servicios',
    category: 'services',
  },
  {
    code: 'SERVICE_UPDATE',
    name: 'Editar Servicios',
    description: 'Permite modificar servicios existentes',
    category: 'services',
  },
  {
    code: 'SERVICE_DELETE',
    name: 'Eliminar Servicios',
    description: 'Permite eliminar servicios del catálogo',
    category: 'services',
  },
  {
    code: 'SERVICE_DEACTIVATE',
    name: 'Desactivar Servicios',
    description: 'Permite desactivar servicios temporalmente',
    category: 'services',
  },

  // ====== PAQUETES ======
  {
    code: 'PACKAGE_CREATE',
    name: 'Crear Paquetes',
    description: 'Permite crear paquetes de servicios',
    category: 'packages',
  },
  {
    code: 'PACKAGE_READ',
    name: 'Ver Paquetes',
    description: 'Permite ver el catálogo de paquetes',
    category: 'packages',
  },
  {
    code: 'PACKAGE_UPDATE',
    name: 'Editar Paquetes',
    description: 'Permite modificar paquetes existentes',
    category: 'packages',
  },
  {
    code: 'PACKAGE_DELETE',
    name: 'Eliminar Paquetes',
    description: 'Permite eliminar paquetes del catálogo',
    category: 'packages',
  },

  // ====== PRECIOS ======
  {
    code: 'PRICE_LIST_CREATE',
    name: 'Crear Listas de Precios',
    description: 'Permite crear nuevas listas de precios',
    category: 'pricing',
  },
  {
    code: 'PRICE_LIST_READ',
    name: 'Ver Listas de Precios',
    description: 'Permite ver las listas de precios',
    category: 'pricing',
  },
  {
    code: 'PRICE_LIST_UPDATE',
    name: 'Editar Listas de Precios',
    description: 'Permite modificar listas de precios',
    category: 'pricing',
  },
  {
    code: 'PRICE_LIST_DELETE',
    name: 'Eliminar Listas de Precios',
    description: 'Permite eliminar listas de precios',
    category: 'pricing',
  },
  {
    code: 'PRICE_MANAGE',
    name: 'Gestionar Precios',
    description: 'Permite modificar precios individuales de servicios',
    category: 'pricing',
  },

  // ====== ESTILISTAS ======
  {
    code: 'STYLIST_READ',
    name: 'Ver Estilistas',
    description: 'Permite ver la lista de estilistas',
    category: 'stylists',
  },
  {
    code: 'STYLIST_UPDATE',
    name: 'Editar Estilistas',
    description: 'Permite modificar perfil de estilistas',
    category: 'stylists',
  },

  // ====== USUARIOS ======
  {
    code: 'USER_CREATE',
    name: 'Crear Usuarios',
    description: 'Permite invitar nuevos usuarios a la clínica',
    category: 'users',
  },
  {
    code: 'USER_READ',
    name: 'Ver Usuarios',
    description: 'Permite ver la lista de usuarios',
    category: 'users',
  },
  {
    code: 'USER_UPDATE',
    name: 'Editar Usuarios',
    description: 'Permite modificar información de usuarios',
    category: 'users',
  },
  {
    code: 'USER_DEACTIVATE',
    name: 'Desactivar Usuarios',
    description: 'Permite desactivar usuarios de la clínica',
    category: 'users',
  },

  // ====== ROLES ======
  {
    code: 'ROLE_READ',
    name: 'Ver Roles',
    description: 'Permite ver roles y permisos disponibles',
    category: 'roles',
  },
  {
    code: 'ROLE_CREATE',
    name: 'Crear Roles',
    description: 'Permite crear roles personalizados',
    category: 'roles',
  },
  {
    code: 'ROLE_UPDATE',
    name: 'Editar Roles',
    description: 'Permite modificar roles personalizados',
    category: 'roles',
  },
  {
    code: 'ROLE_DELETE',
    name: 'Eliminar Roles',
    description: 'Permite eliminar roles personalizados',
    category: 'roles',
  },
  {
    code: 'ROLE_ASSIGN',
    name: 'Asignar Roles',
    description: 'Permite asignar roles a usuarios',
    category: 'roles',
  },

  // ====== CONFIGURACIÓN ======
  {
    code: 'CONFIG_READ',
    name: 'Ver Configuración',
    description: 'Permite ver la configuración de la clínica',
    category: 'config',
  },
  {
    code: 'CONFIG_UPDATE',
    name: 'Editar Configuración',
    description: 'Permite modificar la configuración operativa',
    category: 'config',
  },
  {
    code: 'CALENDAR_EXCEPTION_READ',
    name: 'Ver Días Festivos',
    description: 'Permite ver excepciones del calendario',
    category: 'config',
  },
  {
    code: 'CALENDAR_EXCEPTION_MANAGE',
    name: 'Gestionar Días Festivos',
    description: 'Permite crear/editar/eliminar excepciones de calendario',
    category: 'config',
  },
  {
    code: 'CLINIC_BRANDING',
    name: 'Personalizar Marca',
    description: 'Permite modificar logo y colores de la clínica',
    category: 'config',
  },

  // ====== REPORTES ======
  {
    code: 'REPORT_VIEW',
    name: 'Ver Reportes',
    description: 'Acceso a reportes básicos',
    category: 'reports',
  },
  {
    code: 'REPORT_EXPORT',
    name: 'Exportar Reportes',
    description: 'Permite exportar reportes a Excel/PDF',
    category: 'reports',
  },
];

// ============================================
// DEFINICIÓN DE ROLES
// ============================================

interface RoleDef {
  code: string;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: string[]; // códigos de permisos
}

const ROLES: RoleDef[] = [
  {
    code: 'CLINIC_OWNER',
    name: 'Dueño de Clínica',
    description: 'Acceso completo a todas las funcionalidades de la clínica',
    isSystem: true,
    permissions: PERMISSIONS.map(p => p.code), // TODOS los permisos
  },
  {
    code: 'CLINIC_MANAGER',
    name: 'Gerente',
    description: 'Gestión operativa de la clínica con permisos administrativos',
    isSystem: true,
    permissions: [
      // Dashboard
      'DASHBOARD_VIEW',
      'DASHBOARD_ANALYTICS',
      // Clientes
      'CLIENT_CREATE',
      'CLIENT_READ',
      'CLIENT_UPDATE',
      'CLIENT_DEACTIVATE',
      // Mascotas
      'PET_CREATE',
      'PET_READ',
      'PET_UPDATE',
      'PET_DELETE',
      // Citas
      'APPOINTMENT_CREATE',
      'APPOINTMENT_READ',
      'APPOINTMENT_UPDATE',
      'APPOINTMENT_UPDATE_STATUS',
      'APPOINTMENT_COMPLETE',
      'APPOINTMENT_CANCEL',
      'APPOINTMENT_PLAN_ROUTES',
      // Servicios
      'SERVICE_CREATE',
      'SERVICE_READ',
      'SERVICE_UPDATE',
      'SERVICE_DEACTIVATE',
      // Paquetes
      'PACKAGE_CREATE',
      'PACKAGE_READ',
      'PACKAGE_UPDATE',
      // Precios
      'PRICE_LIST_CREATE',
      'PRICE_LIST_READ',
      'PRICE_LIST_UPDATE',
      'PRICE_MANAGE',
      // Estilistas
      'STYLIST_READ',
      'STYLIST_UPDATE',
      // Usuarios (sin roles)
      'USER_CREATE',
      'USER_READ',
      'USER_UPDATE',
      'USER_DEACTIVATE',
      // Roles (solo lectura)
      'ROLE_READ',
      // Configuración (sin branding)
      'CONFIG_READ',
      'CONFIG_UPDATE',
      'CALENDAR_EXCEPTION_READ',
      'CALENDAR_EXCEPTION_MANAGE',
      // Reportes
      'REPORT_VIEW',
      'REPORT_EXPORT',
    ],
  },
  {
    code: 'CLINIC_STYLIST',
    name: 'Estilista',
    description: 'Groomer o estilista con acceso a citas y clientes',
    isSystem: true,
    permissions: [
      // Dashboard
      'DASHBOARD_VIEW',
      // Clientes (crear, ver, editar)
      'CLIENT_CREATE',
      'CLIENT_READ',
      'CLIENT_UPDATE',
      // Mascotas (crear, ver, editar)
      'PET_CREATE',
      'PET_READ',
      'PET_UPDATE',
      // Citas (ver, actualizar, completar)
      'APPOINTMENT_READ',
      'APPOINTMENT_UPDATE',
      'APPOINTMENT_UPDATE_STATUS',
      'APPOINTMENT_COMPLETE',
      // Servicios (solo lectura)
      'SERVICE_READ',
      // Paquetes (solo lectura)
      'PACKAGE_READ',
      // Precios (solo lectura)
      'PRICE_LIST_READ',
      // Estilistas (solo ver)
      'STYLIST_READ',
    ],
  },
  {
    code: 'CLINIC_STAFF',
    name: 'Personal',
    description: 'Personal general de la clínica',
    isSystem: true,
    permissions: [
      // Dashboard
      'DASHBOARD_VIEW',
      // Clientes (CRUD excepto delete)
      'CLIENT_CREATE',
      'CLIENT_READ',
      'CLIENT_UPDATE',
      // Mascotas (CRUD excepto delete)
      'PET_CREATE',
      'PET_READ',
      'PET_UPDATE',
      // Citas (crear, ver, actualizar estado, cancelar - NO completar)
      'APPOINTMENT_CREATE',
      'APPOINTMENT_READ',
      'APPOINTMENT_UPDATE',
      'APPOINTMENT_UPDATE_STATUS',
      'APPOINTMENT_CANCEL',
      // Servicios (solo lectura)
      'SERVICE_READ',
      // Paquetes (solo lectura)
      'PACKAGE_READ',
      // Precios (solo lectura)
      'PRICE_LIST_READ',
      // Estilistas (solo ver - para asignar citas)
      'STYLIST_READ',
      // Calendario (solo ver)
      'CALENDAR_EXCEPTION_READ',
    ],
  },
  {
    code: 'CLINIC_RECEPTIONIST',
    name: 'Recepcionista',
    description: 'Atención al cliente y gestión de citas (front desk)',
    isSystem: true,
    permissions: [
      // Dashboard
      'DASHBOARD_VIEW',
      // Clientes (CRUD excepto delete)
      'CLIENT_CREATE',
      'CLIENT_READ',
      'CLIENT_UPDATE',
      // Mascotas (CRUD excepto delete)
      'PET_CREATE',
      'PET_READ',
      'PET_UPDATE',
      // Citas (crear, ver, actualizar estado, cancelar - NO completar)
      'APPOINTMENT_CREATE',
      'APPOINTMENT_READ',
      'APPOINTMENT_UPDATE',
      'APPOINTMENT_UPDATE_STATUS',
      'APPOINTMENT_CANCEL',
      // Servicios (solo lectura)
      'SERVICE_READ',
      // Paquetes (solo lectura)
      'PACKAGE_READ',
      // Precios (solo lectura)
      'PRICE_LIST_READ',
      // Estilistas (solo ver - para asignar citas)
      'STYLIST_READ',
      // Calendario (solo ver)
      'CALENDAR_EXCEPTION_READ',
    ],
  },
];

// ============================================
// FUNCIÓN PRINCIPAL DEL SEED
// ============================================

export async function seedRbac(dataSource: DataSource): Promise<void> {
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    console.log('🔐 Iniciando seed de RBAC...\n');

    // 1. Insertar permisos
    console.log('📝 Insertando permisos...');
    const permissionRepo = queryRunner.manager.getRepository(Permission);
    const permissionMap = new Map<string, string>(); // code -> id

    for (const permDef of PERMISSIONS) {
      // Verificar si ya existe
      let permission = await permissionRepo.findOne({ where: { code: permDef.code } });
      
      if (!permission) {
        permission = permissionRepo.create({
          code: permDef.code,
          name: permDef.name,
          description: permDef.description,
          category: permDef.category,
        });
        permission = await queryRunner.manager.save(Permission, permission);
        console.log(`   ✅ Creado: ${permDef.code}`);
      } else {
        // Actualizar name, description, category si cambiaron
        permission.name = permDef.name;
        permission.description = permDef.description;
        permission.category = permDef.category;
        await queryRunner.manager.save(Permission, permission);
        console.log(`   ♻️  Actualizado: ${permDef.code}`);
      }
      
      permissionMap.set(permDef.code, permission.id);
    }

    console.log(`\n   Total permisos: ${PERMISSIONS.length}\n`);

    // 2. Insertar roles del sistema
    console.log('👤 Insertando roles del sistema...');
    const roleRepo = queryRunner.manager.getRepository(Role);
    const rolePermissionRepo = queryRunner.manager.getRepository(RolePermission);

    for (const roleDef of ROLES) {
      // Verificar si ya existe (roles del sistema tienen clinicId = null)
      let role = await roleRepo.findOne({ 
        where: { code: roleDef.code, clinicId: null as unknown as string }
      });

      if (!role) {
        role = roleRepo.create({
          code: roleDef.code,
          name: roleDef.name,
          description: roleDef.description,
          isSystem: roleDef.isSystem,
          clinicId: null as unknown as string,
        });
        role = await queryRunner.manager.save(Role, role);
        console.log(`   ✅ Creado rol: ${roleDef.name}`);
      } else {
        // Actualizar descripción si cambió
        role.name = roleDef.name;
        role.description = roleDef.description;
        await queryRunner.manager.save(Role, role);
        console.log(`   ♻️  Actualizado rol: ${roleDef.name}`);
      }

      // 3. Asignar permisos al rol
      // Primero eliminar permisos existentes para re-sincronizar
      await queryRunner.manager.delete(RolePermission, { roleId: role.id });

      for (const permCode of roleDef.permissions) {
        const permissionId = permissionMap.get(permCode);
        if (permissionId) {
          const rp = rolePermissionRepo.create({
            roleId: role.id,
            permissionId: permissionId,
          });
          await queryRunner.manager.save(RolePermission, rp);
        } else {
          console.warn(`   ⚠️  Permiso no encontrado: ${permCode}`);
        }
      }

      console.log(`      → Asignados ${roleDef.permissions.length} permisos\n`);
    }

    await queryRunner.commitTransaction();

    console.log('═══════════════════════════════════════════');
    console.log('✅ Seed de RBAC completado exitosamente!');
    console.log('═══════════════════════════════════════════\n');

    // Mostrar resumen
    console.log('📊 RESUMEN:');
    console.log(`   • Permisos totales: ${PERMISSIONS.length}`);
    console.log(`   • Roles del sistema: ${ROLES.length}`);
    console.log('\n📋 ROLES CREADOS:');
    for (const role of ROLES) {
      console.log(`   • ${role.name} (${role.code}): ${role.permissions.length} permisos`);
    }
    console.log('\n');

  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('❌ Error en seed de RBAC:', error);
    throw error;
  } finally {
    await queryRunner.release();
  }
}

// ============================================
// EJECUTAR COMO SCRIPT INDEPENDIENTE
// ============================================

async function main() {
  // Solo ejecutar si se llama directamente
  const { AppDataSource } = await import('../data-source');
  
  try {
    await AppDataSource.initialize();
    console.log('📦 Conexión a base de datos establecida\n');
    
    await seedRbac(AppDataSource);
    
    await AppDataSource.destroy();
    console.log('📦 Conexión cerrada\n');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Ejecutar si es el módulo principal
if (require.main === module) {
  main();
}
