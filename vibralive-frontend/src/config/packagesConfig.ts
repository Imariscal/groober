/**
 * Packages Configuration
 * Maps the ServicePackage entity to the EntityConfig<ServicePackage> pattern
 */

import {
  MdOutlineShoppingCart,
  MdCheckCircle,
  MdAlignHorizontalLeft,
} from 'react-icons/md';
import { ServicePackage } from '@/types';
import { EntityConfig, EntityCardModel, ColumnDef } from '@/components/entity-kit';
import { parseISO, format } from 'date-fns';

/**
 * packagesConfig
 * Defines how ServicePackage entities are displayed and managed
 */
export const packagesConfig: EntityConfig<ServicePackage> = {
  // Metadata
  entityNameSingular: 'Paquete',
  entityNamePlural: 'Paquetes',

  // Page header configuration
  pageHeader: {
    title: 'Gestión de Paquetes',
    subtitle: 'Administra los paquetes de servicios de tu clínica',
    breadcrumbs: [
      { label: 'Plataforma', href: '/platform/dashboard' },
      { label: 'Gestión de Paquetes' },
    ],
    primaryAction: {
      label: 'Nuevo Paquete',
      onClick: () => {}, // Will be overridden by page
      icon: undefined, // Will be overridden by page
    },
  },

  // KPI calculations from data
  kpis: (data: ServicePackage[]) => [
    {
      label: 'Total de Paquetes',
      value: data.length,
      icon: MdOutlineShoppingCart,
      color: 'primary',
    },
    {
      label: 'Paquetes Activos',
      value: data.filter(p => p.isActive).length,
      icon: MdCheckCircle,
      color: 'success',
    },
  ],

  // Card view adapter - transforms ServicePackage[] to EntityCardModel[]
  cardAdapter: (pkg: ServicePackage): EntityCardModel => {
    const initials = pkg.name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    return {
      id: pkg.id,
      title: pkg.name,
      subtitle: `ID: ${pkg.id.slice(0, 8)}...`,
      avatar: {
        text: initials,
      },
      fields: [
        {
          label: 'Servicios Incluidos',
          value: `${pkg.items.length} ${pkg.items.length === 1 ? 'servicio' : 'servicios'}`,
        },
        ...(pkg.description
          ? [
              {
                icon: MdAlignHorizontalLeft,
                label: 'Descripción',
                value: pkg.description,
              },
            ]
          : []),
        {
          label: 'Creado',
          value: format(parseISO(pkg.createdAt), 'dd/MM/yyyy'),
        },
      ],
      actions: [], // Actions will be provided by the page
    };
  },

  // Table columns configuration
  tableColumns: [
    {
      key: 'name',
      label: 'Paquete',
      accessor: (pkg: ServicePackage) => pkg.name,
      width: 'min-w-[200px]',
    },
    {
      key: 'items',
      label: 'Contenido',
      accessor: (pkg: ServicePackage) => `${pkg.items.length} ${pkg.items.length === 1 ? 'servicio' : 'servicios'}`,
      width: 'min-w-[120px]',
    },
    {
      key: 'description',
      label: 'Detalles',
      accessor: (pkg: ServicePackage) => pkg.description || '-',
      width: 'min-w-[250px]',
    },
    {
      key: 'createdAt',
      label: 'Creado',
      accessor: (pkg: ServicePackage) => format(parseISO(pkg.createdAt), 'dd/MM/yyyy'),
    },
  ] as ColumnDef<ServicePackage>[],

  // Toolbar configuration
  toolbar: {
    searchPlaceholder: 'Buscar paquete por nombre o descripción...',
    enableFilters: false,
    enableSort: true,
    enableViewToggle: true,
  },

  // Filter options
  filters: {
    sortOptions: [
      { label: 'Nombre A-Z', value: 'name-asc' },
      { label: 'Nombre Z-A', value: 'name-desc' },
      { label: 'Más recientes', value: 'created-desc' },
      { label: 'Más antiguos', value: 'created-asc' },
    ],
  },

  // View mode configuration
  defaultViewMode: 'table',
  supportedViewModes: ['cards', 'table'],
};
