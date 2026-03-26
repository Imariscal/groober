/**
 * Configuración de menú con permisos para Groober
 * Estructura:
 * - Dashboard siempre FUERA de grupo en erste posición
 * - Items dentro de grupos ordenados alfabéticamente
 * - Cada item con su lista de permisos required
 */

import {
  FiHome,
  FiUsers,
  FiCalendar,
  FiBell,
  FiSettings,
  FiShield,
  FiMap,
  FiTrendingUp,
  FiMessageSquare,
  FiMail,
  FiList,
  FiBox,
  FiDollarSign,
  FiFileText,
  FiPaperclip,
  FiCheck,
  FiBarChart,
  FiAlertTriangle,
  FiActivity,
} from 'react-icons/fi';
import { MdDashboard, MdMedicalServices, MdPets, MdOutlineShoppingCart, MdLocalOffer, MdVaccines } from 'react-icons/md';
import { GiMedicalDrip } from 'react-icons/gi';

export interface MenuItemWithPermissions {
  href: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  badge?: string | number;
  requiredPermissions?: string[]; // ANY of these permissions
  requiredRole?: string;
  children?: MenuItemWithPermissions[];
}

export interface MenuSectionWithPermissions {
  title?: string; // undefined para dashboard items
  items: MenuItemWithPermissions[];
  collapsible?: boolean;
  collapsedIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>; // Icono personalizado cuando está colapsado
}

/**
 * OWNER - Dueño de clínica
 * Puede: gestionar clínica, clientes, mascotas, servicios, reportes
 */
export const CLINIC_OWNER_MENU: MenuSectionWithPermissions[] = [
  // DASHBOARD - Siempre fuera de grupo, primera posición
  {
    items: [
      {
        href: '/clinic/dashboard',
        label: 'Panel General',
        icon: FiHome,
        requiredPermissions: ['dashboard:clinic'],
      },
    ],
  },

  // GESTIÓN DE DATOS - Alfabético
  {
    title: 'Datos',
    items: [
      {
        href: '/clinic/clients',
        label: 'Clientes',
        icon: FiUsers,
        requiredPermissions: ['clients:read'],
      },
      {
        href: '/clinic/pets',
        label: 'Mascotas',
        icon: MdPets,
        requiredPermissions: ['pets:read'],
      },
    ],
  },

  // PELUQUERÍA - Alfabético
  {
    title: 'Grooming',
    items: [
      {
        href: '/clinic/grooming',
        label: 'Citas',
        icon: FiCalendar,
        requiredPermissions: ['appointments:read'],
      },
      {
        href: '/clinic/grooming/pending-sales',
        label: 'Por Cobrar',
        icon: FiDollarSign,
        requiredPermissions: ['pos:sales:create'],
      },
      {
        href: '/clinic/route-planning',
        label: 'Ruteo',
        icon: FiMap,
        requiredPermissions: ['routes:optimize'],
      },
      {
        href: '/clinic/services/grooming',
        label: 'Servicios',
        icon: MdOutlineShoppingCart,
        requiredPermissions: ['services:read'],
      },
      {
        href: '/clinic/communications/whatsapp',
        label: 'Mensajes Citas',
        icon: FiMessageSquare,
        requiredPermissions: ['communications:whatsapp'],
      },
    ],
  },
 
  {
    title: 'Clínica',
    items: [
     
      {
        href: '/clinic/visits',
        label: 'Citas',
        icon: MdMedicalServices,
        requiredPermissions: ['visits:read'],
      },
    
       {
        href: '/clinic/medical-history',
        label: 'Historial Médico',
        icon: FiFileText,
        requiredPermissions: ['ehr:medical_history:read'],
      },
       {
        href: '/clinic/preventive-care',
        label: 'Prevención',
        icon: GiMedicalDrip,
        requiredPermissions: ['visits:read'],
      },
      // {
      //   href: '/clinic/medical-records/prescriptions',
      //   label: 'Prescripciones',
      //   icon: FiActivity,
      //   requiredPermissions: ['ehr:prescriptions:read'],
      // },
      {
        href: '/clinic/reminders',
        label: 'Recordatorios',
        icon: FiBell,
        requiredPermissions: ['notifications:send'],
      },
        {
        href: '/clinic/services/medical',
        label: 'Servicios',
        icon: MdOutlineShoppingCart,
        requiredPermissions: ['services:read'],
      },
      {
        href: '/clinic/medical-records/vaccinations',
        label: 'Vacunas',
        icon: MdVaccines,
        requiredPermissions: ['ehr:vaccinations:read'],
      },
    ],
  },

  {
    title: 'Ventas',
    items: [
      {
        href: '/clinic/inventory',
        label: 'Almacén',
        icon: FiBox,
        requiredPermissions: ['pos:inventory:read'],
      },
      // {
      //   href: '/clinic/pos',
      //   label: 'Punto de Venta',
      //   icon: FiBarChart,
      //   requiredPermissions: ['pos:sales:create'],
      // },
      {
        href: '/clinic/sales',
        label: 'Ventas',
        icon: FiDollarSign,
        requiredPermissions: ['pos:sales:read'],
      },
    ],
  },

  // MERCADOTECNIA - Alfabético
  {
    title: 'Mercadotecnia',
    collapsedIcon: FiSettings,
    items: [
      {
        href: '/clinic/communications/campaigns',
        label: 'Campañas',
        icon: FiMail,
        requiredPermissions: ['campaigns:read'],
      },
      {
        href: '/clinic/communications/notifications',
        label: 'Notificaciones',
        icon: FiMessageSquare,
        requiredPermissions: ['notifications:read'],
      },
    ],
  },

  {
    title: 'Reportes',
    collapsedIcon: FiTrendingUp,
    items: [
      {
        href: '/clinic/clinic-reports',
        label: 'Clínicas',
        icon: FiTrendingUp,
        requiredPermissions: ['reports:view'],
      },
      {
        href: '/clinic/reports',
        label: 'Grooming',
        icon: FiTrendingUp,
        requiredPermissions: ['reports:view'],
      },
      {
        href: '/clinic/sales-reports',
        label: 'Ventas',
        icon: FiTrendingUp,
        requiredPermissions: ['reports:view'],
      },
    ],
  },

 
  // SISTEMA - Alfabético
  {
    title: 'Sistema',
    items: [
      {
        href: '/clinic/configurations',
        label: 'Mi Clínica',
        icon: MdMedicalServices,
        requiredPermissions: ['clinic:settings'],
      },
      {
        href: '/clinic/packages',
        label: 'Paquetes',
        icon: MdOutlineShoppingCart,
        requiredPermissions: ['packages:read'],
      },
      {
        href: '/clinic/price-lists',
        label: 'Precios',
        icon: MdLocalOffer,
        requiredPermissions: ['pricing:price_lists:read'],
      },
      {
        href: '/clinic/security',
        label: 'Seguridad',
        icon: FiShield,
        requiredPermissions: ['clinic:manage'],
      },
      {
        href: '/clinic/medical-records/vaccinations',
        label: 'Vacunas',
        icon: MdVaccines,
        requiredPermissions: ['vaccines:read'],
      },
    ],
  },
];

/**
 * STAFF - Personal de la clínica
 * Puede: ver dashboard, clientes, mascotas, notificaciones
 */
export const STAFF_MENU: MenuSectionWithPermissions[] = [
  // DASHBOARD
  {
    items: [
      {
        href: '/staff/dashboard',
        label: 'Panel General',
        icon: FiHome,
        requiredPermissions: ['dashboard:clinic'],
      },
    ],
  },

  // MI TRABAJO
  {
    title: 'Mi Trabajo',
    items: [
      {
        href: '/clinic/clients',
        label: 'Clientes',
        icon: FiUsers,
        requiredPermissions: ['clients:read'],
      },
      {
        href: '/clinic/pets',
        label: 'Mascotas',
        icon: MdPets,
        requiredPermissions: ['pets:read'],
      },
      {
        href: '/clinic/appointments',
        label: 'Citas',
        icon: FiCalendar,
        requiredPermissions: ['appointments:read'],
      },
      {
        href: '/clinic/preventive-care',
        label: 'Prevención',
        icon: GiMedicalDrip,
        requiredPermissions: ['visits:read'],
      },
    ],
  },

  // EXPEDIENTE MÉDICO - EHR
  {
    title: 'Expediente Médico',
    collapsedIcon: MdMedicalServices,
    items: [
      {
        href: '/clinic/medical-history',
        label: 'Historial Médico',
        icon: FiFileText,
        requiredPermissions: ['ehr:medical_history:read'],
      },
      // {
      //   href: '/clinic/medical-records/prescriptions',
      //   label: 'Prescripciones',
      //   icon: FiActivity,
      //   requiredPermissions: ['ehr:prescriptions:read'],
      // },
      {
        href: '/clinic/medical-records/vaccinations',
        label: 'Vacunas',
        icon: MdVaccines,
        requiredPermissions: ['ehr:vaccinations:read'],
      },
    ],
  },

  // OPERACIONES
  {
    title: 'Operaciones',
    items: [
      {
        href: '/clinic/sales',
        label: 'Ventas (POS)',
        icon: FiDollarSign,
        requiredPermissions: ['pos:sales:read'],
      },
    ],
  },

  // COMUNICACIONES
  {
    title: 'Comunicaciones',
    items: [
      {
        href: '/clinic/communications/notifications',
        label: 'Notificaciones',
        icon: FiMessageSquare,
        requiredPermissions: ['notifications:read'],
      },
    ],
  },
];

/**
 * SUPER ADMIN - Administrador de plataforma
 * Puede: gestionar clínicas, usuarios, planes, auditoría
 */
export const SUPERADMIN_MENU: MenuSectionWithPermissions[] = [
  // DASHBOARD
  {
    items: [
      {
        href: '/platform/dashboard',
        label: 'Panel General',
        icon: MdDashboard,
        requiredPermissions: ['dashboard:clinic'],
      },
    ],
  },

  // GESTIÓN - Alfabético
  {
    title: 'Gestión',
    items: [
      {
        href: '/platform/audit',
        label: 'Auditoría',
        icon: FiShield,
        requiredPermissions: ['reports:view'],
      },
      {
        href: '/platform/clinics',
        label: 'Clínicas',
        icon: MdMedicalServices,
        requiredPermissions: ['clinic:manage'],
      },
      {
        href: '/platform/reminders',
        label: 'Recordatorios',
        icon: FiBell,
        requiredPermissions: ['notifications:read'],
      },
      {
        href: '/platform/reports',
        label: 'Reportes',
        icon: FiTrendingUp,
        requiredPermissions: ['reports:view'],
      },
      {
        href: '/platform/users',
        label: 'Usuarios',
        icon: FiUsers,
        requiredPermissions: ['users:read'],
      },
    ],
  },

  // CONFIGURACIÓN - Alfabético
  {
    title: 'Configuración',
    collapsedIcon: FiSettings,
    items: [
      {
        href: '/platform/settings',
        label: 'Sistema',
        icon: FiSettings,
        requiredPermissions: ['clinic:manage'],
      },
      {
        href: '/platform/subscriptions',
        label: 'Suscripciones',
        icon: MdLocalOffer,
        requiredPermissions: ['clinic:manage'],
      },
    ],
  },
];

/**
 * Obtener menú según el rol del usuario
 */
export function getMenuForRole(role?: string): MenuSectionWithPermissions[] {
  switch (role) {
    case 'CLINIC_OWNER':
      return CLINIC_OWNER_MENU;
    case 'SUPER_ADMIN':
      return SUPERADMIN_MENU;
    case 'CLINIC_STAFF':
    case 'CLINIC_STYLIST':
      return STAFF_MENU;
    default:
      return STAFF_MENU;
  }
}

/**
 * Validar si el usuario tiene permisos para un item
 */
export function hasRequiredPermissions(
  userPermissions: string[],
  requiredPermissions?: string[]
): boolean {
  // Si no hay permisos requeridos, mostrar el item
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true;
  }

  // Verificar si el usuario tiene AL MENOS UNO de los permisos requeridos
  return requiredPermissions.some(perm => userPermissions.includes(perm));
}

/**
 * Filtrar items del menú según los permisos del usuario
 */
export function filterMenuByPermissions(
  menu: MenuSectionWithPermissions[],
  userPermissions: string[]
): MenuSectionWithPermissions[] {
  return menu
    .map(section => ({
      ...section,
      items: section.items.filter(item => 
        hasRequiredPermissions(userPermissions, item.requiredPermissions)
      ),
    }))
    .filter(section => section.items.length > 0); // Remover secciones vacías
}
