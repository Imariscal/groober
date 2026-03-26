/**
 * Tipos para el sistema de menú dinámico
 */

export type MenuItemType = 
  | 'dashboard'
  | 'clinics'
  | 'users'
  | 'clients'
  | 'pets'
  | 'reminders'
  | 'audit'
  | 'settings'
  | 'clinic-settings'
  | 'reports'
  | 'communications';

export type FeatureType =
  | 'clinics-management'
  | 'users-management'
  | 'clients-management'
  | 'pets-management'
  | 'reminders'
  | 'audit-logs'
  | 'platform-settings'
  | 'dashboard-admin'
  | 'dashboard-clinic'
  | 'dashboard-staff'
  | 'clients-view'
  | 'reports'
  | 'communications';

export interface MenuItem {
  id: MenuItemType;
  label: string;
  icon: string; // iconos de react-icons
  href: string;
  children?: MenuItem[];
  badge?: {
    label: string;
    color: 'red' | 'blue' | 'green' | 'yellow';
  };
  requiredPermissions?: string[]; // permisos necesarios para ver este item
}

export interface MenuConfig {
  items: MenuItem[];
  collapsible: boolean;
  orientation: 'vertical' | 'horizontal';
}

/**
 * Configuración de menús por rol
 */
export const MENU_CONFIG: Record<string, MenuItem[]> = {
  superadmin: [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'MdDashboard',
      href: '/dashboard',
    },
    {
      id: 'clinics',
      label: 'Clínicas',
      icon: 'MdMedicalInformation',
      href: '/admin/clinics',
      children: [
        { id: 'clinics', label: 'Listar', icon: 'MdList', href: '/admin/clinics' },
        { id: 'clinics', label: 'Crear', icon: 'MdAdd', href: '/admin/clinics/new' },
      ],
    },
    {
      id: 'users',
      label: 'Usuarios',
      icon: 'MdPeople',
      href: '/admin/users',
      children: [
        { id: 'users', label: 'Listar', icon: 'MdList', href: '/admin/users' },
        { id: 'users', label: 'Crear', icon: 'MdAdd', href: '/admin/users/new' },
      ],
    },
    {
      id: 'audit',
      label: 'Auditoría',
      icon: 'MdHistory',
      href: '/admin/audit',
    },
    {
      id: 'settings',
      label: 'Configuración',
      icon: 'MdSettings',
      href: '/admin/settings',
    },
  ],
  owner: [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'MdDashboard',
      href: '/clinic/dashboard',
    },
    {
      id: 'clients',
      label: 'Clientes',
      icon: 'MdPeople',
      href: '/clinic/clients',
    },
    {
      id: 'pets',
      label: 'Mascotas',
      icon: 'MdPets',
      href: '/clinic/pets',
    },
    {
      id: 'reports',
      label: 'Reportes',
      icon: 'MdBarChart',
      href: '/clinic/reports',
    },
    {
      id: 'users',
      label: 'Seguridad',
      icon: 'MdSecurity',
      href: '/clinic/security',
    },
    {
      id: 'clinic-settings',
      label: 'Mi Clínica',
      icon: 'MdSettings',
      href: '/clinic/configurations',
    },
  ],
  staff: [
    {
      id: 'dashboard',
      label: 'Mi Espacio',
      icon: 'MdDashboard',
      href: '/staff/dashboard',
    },
    {
      id: 'clients',
      label: 'Clientes',
      icon: 'MdPeople',
      href: '/staff/clients',
    },
    {
      id: 'pets',
      label: 'Mascotas',
      icon: 'MdPets',
      href: '/staff/pets',
    },
    {
      id: 'reminders',
      label: 'Recordatorios',
      icon: 'MdNotifications',
      href: '/staff/reminders',
    },
  ],
};

/**
 * Obtener menú dinámicamente
 */
export function getMenuForRole(role: string, userPermissions: string[] = []): MenuItem[] {
  const baseMenu = MENU_CONFIG[role] || MENU_CONFIG.staff;
  
  // Filtrar items según permisos del usuario
  if (userPermissions.length === 0) {
    // Si no hay permisos, retornar todos (para backwards compatibility)
    return baseMenu;
  }
  
  return baseMenu
    .map(item => ({
      ...item,
      children: item.children?.filter(child => {
        if (!child.requiredPermissions || child.requiredPermissions.length === 0) {
          return true;
        }
        return child.requiredPermissions.some(perm => userPermissions.includes(perm));
      })
    }))
    .filter(item => {
      // Si no tiene permisos requeridos, siempre mostrar
      if (!item.requiredPermissions || item.requiredPermissions.length === 0) {
        return true;
      }
      // Si tiene permisos requeridos, verificar si el usuario tiene al menos uno
      return item.requiredPermissions.some(perm => userPermissions.includes(perm));
    });
}
