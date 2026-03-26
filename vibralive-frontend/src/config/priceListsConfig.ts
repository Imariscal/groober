/**
 * Price Lists Configuration
 * Maps the PriceList entity to the EntityConfig<PriceList> pattern
 */

import {
  MdLocalOffer,
  MdCheckCircle,
  MdAlignHorizontalLeft,
  MdToggleOn,
  MdToggleOff,
} from 'react-icons/md';
import { PriceList } from '@/types';
import { EntityConfig, EntityCardModel, ColumnDef } from '@/components/entity-kit';
import { parseISO, format } from 'date-fns';

/**
 * priceListsConfig
 * Defines how PriceList entities are displayed and managed
 */
export const priceListsConfig: EntityConfig<PriceList> = {
  // Metadata
  entityNameSingular: 'Lista de Precios',
  entityNamePlural: 'Listas de Precios',

  // Page header configuration
  pageHeader: {
    title: 'Gestión de Listas de Precios',
    subtitle: 'Administra las listas de precios por servicios',
    breadcrumbs: [
      { label: 'Plataforma', href: '/platform/dashboard' },
      { label: 'Gestión de Listas de Precios' },
    ],
    primaryAction: {
      label: 'Nueva Lista',
      onClick: () => {}, // Will be overridden by page
      icon: undefined, // Will be overridden by page
    },
  },

  // KPI calculations from data
  kpis: (data: PriceList[]) => [
    {
      label: 'Total de Listas',
      value: data.length,
      icon: MdLocalOffer,
      color: 'primary',
    },
    {
      label: 'Listas Activas',
      value: data.filter((p) => p.isActive).length,
      icon: MdCheckCircle,
      color: 'success',
    },
  ],

  // Card view adapter - transforms PriceList[] to EntityCardModel[]
  cardAdapter: (priceList: PriceList): EntityCardModel => {
    const initials = priceList.name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const statusConfig = {
      default: {
        label: 'Predeterminada',
        color: 'success' as const,
      },
      active: {
        label: 'Activa',
        color: 'success' as const,
      },
      inactive: {
        label: 'Inactiva',
        color: 'neutral' as const,
      },
    };

    let statusKey: keyof typeof statusConfig = 'inactive';
    if (priceList.isDefault) {
      statusKey = 'default';
    } else if (priceList.isActive) {
      statusKey = 'active';
    }

    return {
      id: priceList.id,
      title: priceList.name,
      subtitle: `ID: ${priceList.id.slice(0, 8)}...`,
      avatar: {
        text: initials,
      },
      status: statusConfig[statusKey],
      fields: [
        {
          icon: priceList.isActive ? MdToggleOn : MdToggleOff,
          label: 'Estado',
          value: priceList.isActive ? 'Activa' : 'Inactiva',
        },
        {
          icon: priceList.isDefault ? MdCheckCircle : undefined,
          label: 'Tipo',
          value: priceList.isDefault ? 'Predeterminada' : 'Personalizada',
        },
        {
          label: 'Creado',
          value: format(parseISO(priceList.createdAt), 'dd/MM/yyyy'),
        },
      ],
      actions: [], // Actions will be provided by the page
    };
  },

  // Table columns configuration
  tableColumns: [
    {
      key: 'name',
      label: 'Lista de Precios',
      accessor: (priceList: PriceList) => priceList.name,
      width: 'min-w-[200px]',
    },
    {
      key: 'type',
      label: 'Tipo',
      accessor: (priceList: PriceList) => (priceList.isDefault ? 'Predeterminada' : 'Personalizada'),
    },
    {
      key: 'status',
      label: 'Estado',
      accessor: (priceList: PriceList) => (priceList.isActive ? 'Activa' : 'Inactiva'),
    },
    {
      key: 'createdAt',
      label: 'Creado',
      accessor: (priceList: PriceList) => format(parseISO(priceList.createdAt), 'dd/MM/yyyy'),
    },
  ] as ColumnDef<PriceList>[],

  // Toolbar configuration
  toolbar: {
    searchPlaceholder: 'Buscar lista de precios por nombre...',
    enableFilters: true,
    enableSort: true,
    enableViewToggle: true,
  },

  // Filter options
  filters: {
    statusOptions: [
      { label: 'Todas', value: 'all' },
      { label: 'Activas', value: 'active' },
      { label: 'Inactivas', value: 'inactive' },
      { label: 'Predeterminadas', value: 'default' },
    ],
    sortOptions: [
      { label: 'Nombre A-Z', value: 'name-asc' },
      { label: 'Nombre Z-A', value: 'name-desc' },
      { label: 'Más recientes', value: 'created-desc' },
      { label: 'Más antiguos', value: 'created-asc' },
    ],
  },

  // View mode configuration
  defaultViewMode: 'cards',
  supportedViewModes: ['cards', 'table'],
};
