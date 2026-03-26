/**
 * Services Configuration
 * Maps the Service entity to the EntityConfig<Service> pattern
 */

import {
  MdOutlineShoppingCart,
  MdCheckCircle,
  MdAlignHorizontalLeft,
  MdAttachMoney,
} from 'react-icons/md';
import { Service } from '@/types';
import { EntityConfig, EntityCardModel, ColumnDef } from '@/components/entity-kit';
import { parseISO, format } from 'date-fns';

/**
 * servicesConfig
 * Defines how Service entities are displayed and managed
 */
export const servicesConfig: EntityConfig<Service> = {
  // Metadata
  entityNameSingular: 'Servicio',
  entityNamePlural: 'Servicios',

  // Page header configuration
  pageHeader: {
    title: 'Gestión de Servicios',
    subtitle: 'Administra los servicios ofrecidos por tu clínica',
    breadcrumbs: [
      { label: 'Plataforma', href: '/platform/dashboard' },
      { label: 'Gestión de Servicios' },
    ],
    primaryAction: {
      label: 'Nuevo Servicio',
      onClick: () => {}, // Will be overridden by page
      icon: undefined, // Will be overridden by page
    },
  },

  // KPI calculations from data
  kpis: (data: Service[]) => [
    {
      label: 'Total de Servicios',
      value: data.length,
      icon: MdOutlineShoppingCart,
      color: 'primary',
    },
    {
      label: 'Servicios Activos',
      value: data.length,
      icon: MdCheckCircle,
      color: 'success',
    },
  ],

  // Card view adapter - transforms Service[] to EntityCardModel[]
  cardAdapter: (service: Service): EntityCardModel => {
    const initials = service.name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    return {
      id: service.id,
      title: service.name,
      subtitle: `ID: ${service.id.slice(0, 8)}...`,
      avatar: {
        text: initials,
      },
      fields: [
        {
          label: 'Categoría',
          value: service.category === 'MEDICAL' ? 'Médico' : 'Grooming',
        },
        {
          label: 'Duración',
          value: `${service.defaultDurationMinutes} min`,
        },
        ...(service.description
          ? [
              {
                icon: MdAlignHorizontalLeft,
                label: 'Descripción',
                value: service.description,
              },
            ]
          : []),
        {
          label: 'Creado',
          value: format(parseISO(service.createdAt), 'dd/MM/yyyy'),
        },
      ],
      actions: [], // Actions will be provided by the page
    };
  },

  // Table columns configuration
  tableColumns: [
    {
      key: 'name',
      label: 'Servicio',
      accessor: (service: Service) => service.name,
      width: 'min-w-[200px]',
    },
    {
      key: 'category',
      label: 'Categoría',
      accessor: (service: Service) => service.category === 'MEDICAL' ? 'Médico' : 'Grooming',
      width: 'min-w-[120px]',
    },
    {
      key: 'defaultDurationMinutes',
      label: 'Duración',
      accessor: (service: Service) => `${service.defaultDurationMinutes} min`,
      width: 'min-w-[100px]',
    },
    {
      key: 'description',
      label: 'Descripción',
      accessor: (service: Service) => service.description || '-',
      width: 'min-w-[250px]',
    },
    {
      key: 'createdAt',
      label: 'Creado',
      accessor: (service: Service) => format(parseISO(service.createdAt), 'dd/MM/yyyy'),
    },
  ] as ColumnDef<Service>[],

  // Toolbar configuration
  toolbar: {
    searchPlaceholder: 'Buscar servicio por nombre o descripción...',
    enableFilters: false,
    enableSort: true,
    enableViewToggle: true,
  },

  // Filter options
  filters: {
    sortOptions: [
      { label: 'Nombre A-Z', value: 'name-asc' },
      { label: 'Nombre Z-A', value: 'name-desc' },
      { label: 'Precio menor', value: 'price-asc' },
      { label: 'Precio mayor', value: 'price-desc' },
      { label: 'Más recientes', value: 'created-desc' },
      { label: 'Más antiguos', value: 'created-asc' },
    ],
  },

  // View mode configuration
  defaultViewMode: 'table',
  supportedViewModes: ['cards', 'table'],
};
