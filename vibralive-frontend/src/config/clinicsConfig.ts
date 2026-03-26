/**
 * Clinics Configuration
 * Maps the Clinic entity to the EntityConfig<Clinic> pattern
 * This allows ClinicsPage to use the generic EntityManagementPage component
 */

import { MdLocalHospital, MdPerson, MdPhone, MdEmail, MdLocationOn, MdEdit, MdPause, MdCheckCircle } from 'react-icons/md';
import { Clinic } from '@/types';
import { EntityConfig, EntityCardModel, ColumnDef } from '@/components/entity-kit';

/**
 * clinicsConfig
 * Defines how Clinic entities are displayed and managed
 */
export const clinicsConfig: EntityConfig<Clinic> = {
  // Metadata
  entityNameSingular: 'Clínica',
  entityNamePlural: 'Clínicas',

  // Page header configuration
  pageHeader: {
    title: 'Gestión de Clínicas',
    subtitle: 'Administra todas tus clínicas en un solo lugar',
    breadcrumbs: [
      { label: 'Plataforma', href: '/platform/dashboard' },
      { label: 'Gestión de Clínicas' },
    ],
    primaryAction: {
      label: 'Nueva Clínica',
      onClick: () => {}, // Will be overridden by page
      icon: undefined, // Will be overridden by page
    },
  },

  // KPI calculations from data
  kpis: (data: Clinic[]) => [
    {
      label: 'Total de Clínicas',
      value: data.length,
      icon: MdLocalHospital,
      color: 'primary',
    },
    {
      label: 'Clínicas Activas',
      value: data.filter((c) => c.status === 'ACTIVE').length,
      icon: MdCheckCircle,
      color: 'success',
    },
    {
      label: 'Clínicas Suspendidas',
      value: data.filter((c) => c.status === 'SUSPENDED').length,
      icon: MdPause,
      color: 'critical',
    },
  ],

  // Card view adapter - transforms Clinic[] to EntityCardModel[]
  cardAdapter: (clinic: Clinic): EntityCardModel => {
    const initials = clinic.name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const statusConfig = {
      ACTIVE: {
        label: 'Activa',
        color: 'success' as const,
      },
      SUSPENDED: {
        label: 'Suspendida',
        color: 'danger' as const,
      },
      DELETED: {
        label: 'Eliminada',
        color: 'neutral' as const,
      },
    };

    return {
      id: clinic.id,
      title: clinic.name,
      subtitle: `ID: ${clinic.id.slice(0, 8)}...`,
      avatar: {
        text: initials,
      },
      status: statusConfig[clinic.status],
      fields: [
        ...(clinic.phone
          ? [
              {
                icon: MdPhone,
                label: 'Teléfono',
                value: clinic.phone,
              },
            ]
          : []),
        ...(clinic.email
          ? [
              {
                icon: MdEmail,
                label: 'Email',
                value: clinic.email,
              },
            ]
          : []),
        ...(clinic.city
          ? [
              {
                icon: MdLocationOn,
                label: 'Ciudad',
                value: clinic.city,
              },
            ]
          : []),
        ...(clinic.subscriptionPlan
          ? [
              {
                label: 'Plan',
                value: clinic.subscriptionPlan,
              },
            ]
          : []),
        ...(clinic.responsable
          ? [
              {
                icon: MdPerson,
                label: 'Responsable',
                value: clinic.responsable,
              },
            ]
          : []),
      ],
      actions: [], // Actions will be provided by the page
    };
  },

  // Table columns configuration
  tableColumns: [
    {
      key: 'name',
      label: 'Clínica',
      accessor: (clinic: Clinic) => {
        const subtext = clinic.responsable ? ` (${clinic.responsable})` : '';
        return `${clinic.name} [ID: ${clinic.id.slice(0, 8)}...]${subtext}`;
      },
      width: 'min-w-[220px]',
    },
    {
      key: 'phone',
      label: 'Teléfono',
      accessor: (clinic) => clinic.phone || '-',
    },
    {
      key: 'email',
      label: 'Correo',
      accessor: (clinic) => clinic.email || '-',
    },
    {
      key: 'city',
      label: 'Ciudad',
      accessor: (clinic) => clinic.city || '-',
    },
    {
      key: 'plan',
      label: 'Plan',
      accessor: (clinic) => clinic.subscriptionPlan || '-',
    },
    {
      key: 'status',
      label: 'Estado',
      accessor: (clinic) => {
        const statusMap: Record<string, string> = {
          ACTIVE: 'Activa',
          SUSPENDED: 'Suspendida',
          DELETED: 'Eliminada',
        };
        return statusMap[clinic.status] || clinic.status;
      },
    },
  ] as ColumnDef<Clinic>[],

  // Toolbar configuration
  toolbar: {
    searchPlaceholder: 'Buscar clínica, teléfono, ciudad...',
    enableFilters: true,
    enableSort: true,
    enableViewToggle: true,
  },

  // Filter options
  filters: {
    statusOptions: [
      { label: 'Todas', value: 'all' },
      { label: 'Activas', value: 'ACTIVE' },
      { label: 'Suspendidas', value: 'SUSPENDED' },
    ],
    sortOptions: [
      { label: 'Nombre A-Z', value: 'name-asc' },
      { label: 'Nombre Z-A', value: 'name-desc' },
      { label: 'Más recientes', value: 'created-desc' },
      { label: 'Más antiguos', value: 'created-asc' },
      { label: 'Estado', value: 'status' },
    ],
  },

  // View mode configuration
  defaultViewMode: 'cards',
  supportedViewModes: ['cards', 'table'],
};

/**
 * Helper function to create clinic-specific KPI values
 * Used in ClinicsPage to pass real counts from API
 */
export function getClinicsKpiItems(counts: {
  total: number;
  active: number;
  suspended: number;
}) {
  return [
    {
      label: 'Total de Clínicas',
      value: counts.total,
      icon: MdLocalHospital,
      color: 'primary' as const,
    },
    {
      label: 'Clínicas Activas',
      value: counts.active,
      icon: MdCheckCircle,
      color: 'success' as const,
    },
    {
      label: 'Clínicas Suspendidas',
      value: counts.suspended,
      icon: MdPause,
      color: 'critical' as const,
    },
  ];
}
