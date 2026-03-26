import { Repository } from 'typeorm';
import { Role } from '../entities/role.entity';
import { Permission } from '../entities/permission.entity';
import { RolePermission } from '../entities/role-permission.entity';

// System-wide permissions
export const SYSTEM_PERMISSIONS = [
  // User Management
  { code: 'USER_CREATE', description: 'Crear usuarios de clínica' },
  { code: 'USER_READ', description: 'Ver usuarios de clínica' },
  { code: 'USER_UPDATE', description: 'Editar usuarios de clínica' },
  { code: 'USER_DEACTIVATE', description: 'Desactivar usuarios de clínica' },
  
  // Client Management
  { code: 'CLIENT_CREATE', description: 'Crear clientes' },
  { code: 'CLIENT_READ', description: 'Ver clientes' },
  { code: 'CLIENT_UPDATE', description: 'Editar clientes' },
  { code: 'CLIENT_DELETE', description: 'Eliminar clientes' },
  
  // Pet Management
  { code: 'PET_CREATE', description: 'Crear mascotas' },
  { code: 'PET_READ', description: 'Ver mascotas' },
  { code: 'PET_UPDATE', description: 'Editar mascotas' },
  { code: 'PET_DELETE', description: 'Eliminar mascotas' },
  
  // Appointment Management
  { code: 'APPOINTMENT_CREATE', description: 'Crear citas' },
  { code: 'APPOINTMENT_READ', description: 'Ver citas' },
  { code: 'APPOINTMENT_UPDATE', description: 'Editar citas' },
  { code: 'APPOINTMENT_CANCEL', description: 'Cancelar citas' },

  // Clinical Visits Management
  { code: 'VISIT_CREATE', description: 'Crear visitas clínicas' },
  { code: 'VISIT_READ', description: 'Ver visitas clínicas' },
  { code: 'VISIT_UPDATE', description: 'Editar visitas clínicas' },
  { code: 'VISIT_CANCEL', description: 'Cancelar visitas clínicas' },
  { code: 'VISIT_COMPLETE', description: 'Completar visitas clínicas' },
  
  // Preventive Care Management
  { code: 'PREVENTIVE_CARE_CREATE', description: 'Crear eventos de cuidado preventivo' },
  { code: 'PREVENTIVE_CARE_READ', description: 'Ver eventos de cuidado preventivo' },
  { code: 'PREVENTIVE_CARE_UPDATE', description: 'Editar eventos de cuidado preventivo' },
  { code: 'PREVENTIVE_CARE_DELETE', description: 'Eliminar eventos de cuidado preventivo' },
  
  // POS Management
  { code: 'POS_PRODUCT_CREATE', description: 'Crear productos POS' },
  { code: 'POS_PRODUCT_READ', description: 'Ver productos POS' },
  { code: 'POS_PRODUCT_UPDATE', description: 'Editar productos POS' },
  { code: 'POS_PRODUCT_DELETE', description: 'Eliminar productos POS' },
  { code: 'POS_SALE_CREATE', description: 'Crear ventas POS' },
  { code: 'POS_SALE_READ', description: 'Ver ventas POS' },
  { code: 'POS_SALE_UPDATE', description: 'Editar ventas POS' },
  { code: 'POS_SALE_CANCEL', description: 'Cancelar ventas POS' },
  { code: 'POS_SALE_REFUND', description: 'Reembolsar ventas POS' },
  { code: 'POS_INVENTORY_READ', description: 'Ver inventario POS' },
  { code: 'POS_INVENTORY_ADJUST', description: 'Ajustar inventario POS' },
  
  // Reminder Management
  { code: 'REMINDER_READ', description: 'Ver recordatorios' },
  { code: 'REMINDER_SEND', description: 'Enviar recordatorios' },
  { code: 'REMINDER_CANCEL', description: 'Cancelar recordatorios' },
  
  // Stylist Management
  { code: 'STYLIST_READ', description: 'Ver estilistas' },
  { code: 'STYLIST_UPDATE', description: 'Editar perfil de estilista' },
  
  // Service & Pricing
  { code: 'SERVICE_CREATE', description: 'Crear servicios' },
  { code: 'SERVICE_READ', description: 'Ver servicios' },
  { code: 'SERVICE_UPDATE', description: 'Editar servicios' },
  { code: 'SERVICE_DELETE', description: 'Eliminar servicios' },
  { code: 'PRICING_MANAGE', description: 'Gestionar precios' },
  
  // Clinic Settings
  { code: 'CLINIC_SETTINGS_READ', description: 'Ver configuración de clínica' },
  { code: 'CLINIC_SETTINGS_UPDATE', description: 'Editar configuración de clínica' },
  
  // Reports
  { code: 'REPORTS_VIEW', description: 'Ver reportes' },
  
  // Campaign Management
  { code: 'CAMPAIGN_CREATE', description: 'Crear campañas' },
  { code: 'CAMPAIGN_READ', description: 'Ver campañas' },
  { code: 'CAMPAIGN_UPDATE', description: 'Editar campañas' },
  { code: 'CAMPAIGN_DELETE', description: 'Eliminar campañas' },
  { code: 'CAMPAIGN_EXECUTE', description: 'Ejecutar/Pausar/Reanudar campañas' },
  { code: 'CAMPAIGN_REPORTS', description: 'Ver reportes de campañas' },
  
  // Campaign Templates
  { code: 'CAMPAIGN_TEMPLATE_CREATE', description: 'Crear plantillas de campaña' },
  { code: 'CAMPAIGN_TEMPLATE_READ', description: 'Ver plantillas de campaña' },
  { code: 'CAMPAIGN_TEMPLATE_UPDATE', description: 'Editar plantillas de campaña' },
  { code: 'CAMPAIGN_TEMPLATE_DELETE', description: 'Eliminar plantillas de campaña' },
];

// System roles with their permission assignments
export const SYSTEM_ROLES = [
  {
    code: 'CLINIC_OWNER',
    name: 'Propietario',
    description: 'Control total de la clínica',
    isSystem: true,
    permissions: [
      'USER_CREATE', 'USER_READ', 'USER_UPDATE', 'USER_DEACTIVATE',
      'CLIENT_CREATE', 'CLIENT_READ', 'CLIENT_UPDATE', 'CLIENT_DELETE',
      'PET_CREATE', 'PET_READ', 'PET_UPDATE', 'PET_DELETE',
      'APPOINTMENT_CREATE', 'APPOINTMENT_READ', 'APPOINTMENT_UPDATE', 'APPOINTMENT_CANCEL',
      'VISIT_CREATE', 'VISIT_READ', 'VISIT_UPDATE', 'VISIT_CANCEL', 'VISIT_COMPLETE',
      'PREVENTIVE_CARE_CREATE', 'PREVENTIVE_CARE_READ', 'PREVENTIVE_CARE_UPDATE', 'PREVENTIVE_CARE_DELETE',
      'STYLIST_READ', 'STYLIST_UPDATE',
      'SERVICE_CREATE', 'SERVICE_READ', 'SERVICE_UPDATE', 'SERVICE_DELETE',
      'PRICING_MANAGE',
      'CLINIC_SETTINGS_READ', 'CLINIC_SETTINGS_UPDATE',
      'REPORTS_VIEW',
      'CAMPAIGN_CREATE', 'CAMPAIGN_READ', 'CAMPAIGN_UPDATE', 'CAMPAIGN_DELETE', 'CAMPAIGN_EXECUTE', 'CAMPAIGN_REPORTS',
      'CAMPAIGN_TEMPLATE_CREATE', 'CAMPAIGN_TEMPLATE_READ', 'CAMPAIGN_TEMPLATE_UPDATE', 'CAMPAIGN_TEMPLATE_DELETE',
      'POS_PRODUCT_CREATE', 'POS_PRODUCT_READ', 'POS_PRODUCT_UPDATE', 'POS_PRODUCT_DELETE',
      'POS_SALE_CREATE', 'POS_SALE_READ', 'POS_SALE_UPDATE', 'POS_SALE_CANCEL', 'POS_SALE_REFUND',
      'POS_INVENTORY_READ', 'POS_INVENTORY_ADJUST',
      'REMINDER_READ', 'REMINDER_SEND', 'REMINDER_CANCEL',
    ],
  },
  {
    code: 'CLINIC_STAFF',
    name: 'Personal',
    description: 'Personal general de la clínica',
    isSystem: true,
    permissions: [
      'CLIENT_CREATE', 'CLIENT_READ', 'CLIENT_UPDATE',
      'PET_CREATE', 'PET_READ', 'PET_UPDATE',
      'APPOINTMENT_CREATE', 'APPOINTMENT_READ', 'APPOINTMENT_UPDATE',
      'VISIT_CREATE', 'VISIT_READ', 'VISIT_UPDATE', 'VISIT_COMPLETE',
      'PREVENTIVE_CARE_READ', 'PREVENTIVE_CARE_UPDATE',
      'SERVICE_READ',
      'CAMPAIGN_READ', 'CAMPAIGN_REPORTS',
      'POS_PRODUCT_READ',
      'POS_SALE_CREATE', 'POS_SALE_READ', 'POS_SALE_UPDATE', 'POS_SALE_REFUND',
      'POS_INVENTORY_READ', 'POS_INVENTORY_ADJUST',
      'REMINDER_READ',
    ],
  },
  {
    code: 'CLINIC_STYLIST',
    name: 'Estilista',
    description: 'Estilista/Groomer de la clínica',
    isSystem: true,
    permissions: [
      'CLIENT_READ',
      'PET_READ',
      'APPOINTMENT_READ', 'APPOINTMENT_UPDATE',
      'VISIT_READ',
      'STYLIST_READ', 'STYLIST_UPDATE',
      'SERVICE_READ',
      'POS_PRODUCT_READ',
    ],
  },
];

export async function seedPermissions(
  permissionRepository: Repository<Permission>,
): Promise<Permission[]> {
  const existingPermissions = await permissionRepository.find();
  
  if (existingPermissions.length > 0) {
    console.log('✓ Permissions already exist');
    return existingPermissions;
  }

  const permissions = await permissionRepository.save(
    SYSTEM_PERMISSIONS.map((p) => ({
      code: p.code,
      description: p.description,
    })),
  );
  
  console.log(`✓ Created ${permissions.length} permissions`);
  return permissions;
}

export async function seedSystemRoles(
  roleRepository: Repository<Role>,
  permissionRepository: Repository<Permission>,
  rolePermissionRepository: Repository<RolePermission>,
): Promise<Role[]> {
  // Check if system roles already exist
  const existingRoles = await roleRepository.find({
    where: { isSystem: true, clinicId: null as unknown as string },
  });

  if (existingRoles.length > 0) {
    console.log('✓ System roles already exist');
    return existingRoles;
  }

  // Get all permissions indexed by code
  const permissions = await permissionRepository.find();
  const permissionsByCode = new Map(permissions.map((p) => [p.code, p]));

  const createdRoles: Role[] = [];

  for (const roleConfig of SYSTEM_ROLES) {
    // Create role
    const role = await roleRepository.save({
      clinicId: null,
      code: roleConfig.code,
      name: roleConfig.name,
      description: roleConfig.description,
      isSystem: roleConfig.isSystem,
    });

    createdRoles.push(role);

    // Create role-permission associations
    const rolePermissions = roleConfig.permissions
      .map((permCode) => {
        const permission = permissionsByCode.get(permCode);
        if (!permission) {
          console.warn(`⚠ Permission ${permCode} not found`);
          return null;
        }
        return {
          roleId: role.id,
          permissionId: permission.id,
        };
      })
      .filter((rp): rp is { roleId: string; permissionId: string } => rp !== null);

    if (rolePermissions.length > 0) {
      await rolePermissionRepository.save(rolePermissions);
    }

    console.log(`✓ Created role "${roleConfig.name}" with ${rolePermissions.length} permissions`);
  }

  return createdRoles;
}

export async function seedRbac(
  roleRepository: Repository<Role>,
  permissionRepository: Repository<Permission>,
  rolePermissionRepository: Repository<RolePermission>,
): Promise<void> {
  console.log('\n📦 Seeding RBAC tables...');
  
  await seedPermissions(permissionRepository);
  await seedSystemRoles(roleRepository, permissionRepository, rolePermissionRepository);
  
  console.log('✓ RBAC seeding complete\n');
}
