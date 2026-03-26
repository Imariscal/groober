/**
 * Medical Records Configuration
 * Maps the MedicalVisit entity to the EntityConfig<MedicalVisit> pattern
 * This allows MedicalRecordsPage to use the generic EntityManagementPage component
 *
 * Pattern mirrors petsConfig.ts for consistency
 * Follows HOMOLOGACION_VISTAS_STANDAR.md design standards
 */

import {
  MdMedicalInformation,
  MdNotes,
  MdCheckCircle,
  MdWarning,
  MdClock,
  MdAssignment,
  MdHourglassEmpty,
  MdThermostat,
  MdFavoriteBorder,
  MdSpeed,
} from 'react-icons/md';
import { MedicalVisit, MedicalVisitStatus, ReasonForVisit } from '@/types/ehr';
import { EntityConfig, EntityCardModel, ColumnDef } from '@/components/entity-kit';
import { formatInClinicTz } from '@/lib/datetime-tz';
import { parseISO } from 'date-fns';

// ============================================================================
// HELPER FUNCTIONS - Label and status mappings
// ============================================================================

/**
 * Get status label in Spanish
 */
const getStatusLabel = (status: MedicalVisitStatus): string => {
  const labels: Record<MedicalVisitStatus, string> = {
    DRAFT: 'Borrador',
    IN_PROGRESS: 'En Progreso',
    COMPLETED: 'Completado',
    SIGNED: 'Firmado',
  };
  return labels[status] || status;
};

/**
 * Get status color for display
 * Used in cards and table cells for visual status indicators
 */
const getStatusColor = (status: MedicalVisitStatus): string => {
  const colors: Record<MedicalVisitStatus, string> = {
    DRAFT: 'gray',
    IN_PROGRESS: 'blue',
    COMPLETED: 'green',
    SIGNED: 'dark-green',
  };
  return colors[status] || 'gray';
};

/**
 * Get reason for visit label in Spanish
 */
const getReasonLabel = (reason: ReasonForVisit): string => {
  const labels: Record<ReasonForVisit, string> = {
    CHECKUP: 'Revisión General',
    VACCINATION: 'Vacunación',
    DIAGNOSIS: 'Diagnóstico',
    FOLLOW_UP: 'Seguimiento',
    OTHER: 'Otro',
  };
  return labels[reason] || reason;
};

/**
 * Get reason icon
 */
const getReasonIcon = (reason: ReasonForVisit): string => {
  const emojis: Record<ReasonForVisit, string> = {
    CHECKUP: '🏥',
    VACCINATION: '💉',
    DIAGNOSIS: '🔍',
    FOLLOW_UP: '📋',
    OTHER: '❓',
  };
  return emojis[reason] || '❓';
};

/**
 * Format temperature with check
 * Temperature under 38°C is normal, over 38°C is fever
 */
const getTemperatureStatus = (temp?: number): { value: string; color: string } => {
  if (!temp) return { value: '-', color: 'text-gray-500' };
  const isFever = temp >= 38;
  return {
    value: `${temp}°C`,
    color: isFever ? 'text-red-500 font-semibold' : 'text-green-600',
  };
};

/**
 * Format heart rate with health status
 */
const getHeartRateStatus = (hr?: number): { value: string; status: string } => {
  if (!hr) return { value: '-', status: 'normal' };
  if (hr < 60) return { value: `${hr} bpm`, status: 'low' };
  if (hr > 100) return { value: `${hr} bpm`, status: 'high' };
  return { value: `${hr} bpm`, status: 'normal' };
};

/**
 * Format date in clinic timezone
 */
const formatVisitDate = (date?: string): string => {
  if (!date) return '-';
  try {
    return formatInClinicTz(parseISO(date), 'dd/MM/yyyy HH:mm');
  } catch {
    return '-';
  }
};

/**
 * Get visit type with emoji
 */
const getVisitTypeDisplay = (visit: MedicalVisit): string => {
  const emoji = getReasonIcon(visit.visit_type);
  const label = getReasonLabel(visit.visit_type);
  return `${emoji} ${label}`;
};

/**
 * Calculate days since visit
 */
const getDaysSinceVisit = (date?: string): string => {
  if (!date) return '-';
  try {
    const visitDate = parseISO(date);
    const today = new Date();
    const diffMs = today.getTime() - visitDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `${diffDays}d atrás`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w atrás`;
    return `${Math.floor(diffDays / 30)}m atrás`;
  } catch {
    return '-';
  }
};

/**
 * medicalRecordsConfig
 * Defines how MedicalVisit entities are displayed and managed
 * Integrates with EntityManagementPage for unified CRUD and display
 */
export const medicalRecordsConfig: EntityConfig<MedicalVisit> = {
  // ========================================================================
  // METADATA
  // ========================================================================
  entityNameSingular: 'Registro Médico',
  entityNamePlural: 'Registros Médicos',

  // ========================================================================
  // PAGE HEADER
  // ========================================================================
  pageHeader: {
    title: 'Expediente Médico Electrónico',
    subtitle: 'Administra los registros médicos de tus mascotas',
    breadcrumbs: [
      { label: 'Clínica', href: '/clinic' },
      { label: 'Registros Médicos' },
    ],
    primaryAction: {
      label: 'Nueva Visita',
      onClick: () => {}, // Will be overridden by page
      icon: undefined,
    },
  },

  // ========================================================================
  // KPI CALCULATIONS
  // Uses data array to compute dynamic metrics
  // ========================================================================
  kpis: (data: MedicalVisit[]) => {
    // Count by status
    const draftCount = data.filter((v) => v.status === 'DRAFT').length;
    const inProgressCount = data.filter((v) => v.status === 'IN_PROGRESS').length;
    const completedCount = data.filter((v) => v.status === 'COMPLETED').length;
    const signedCount = data.filter((v) => v.status === 'SIGNED').length;

    // Most common visit type
    const typeCounts = data.reduce(
      (acc, v) => {
        acc[v.visit_type] = (acc[v.visit_type] || 0) + 1;
        return acc;
      },
      {} as Record<ReasonForVisit, number>
    );
    const mostCommonType = Object.entries(typeCounts).sort(([, a], [, b]) => b - a)[0];

    // Average temperature (for recent visits)
    const recentWithTemp = data
      .filter((v) => v.vital_signs?.body_temperature)
      .slice(0, 10);
    const avgTemp =
      recentWithTemp.length > 0
        ? (
            recentWithTemp.reduce((sum, v) => sum + (v.vital_signs?.body_temperature || 0), 0) /
            recentWithTemp.length
          ).toFixed(1)
        : '-';

    return [
      {
        label: 'Total de Registros',
        value: data.length,
        icon: MdMedicalInformation,
        color: 'primary',
      },
      {
        label: 'Firmed',
        value: signedCount,
        icon: MdCheckCircle,
        color: 'success',
      },
      {
        label: 'Pendientes',
        value: draftCount + inProgressCount,
        icon: MdHourglassEmpty,
        color: 'warning',
      },
      {
        label: 'Tipo Más Común',
        value: mostCommonType ? getReasonLabel(mostCommonType[0] as ReasonForVisit) : '-',
        icon: MdNotes,
        color: 'info',
      },
    ];
  },

  // ========================================================================
  // CARD ADAPTER
  // Transforms MedicalVisit to EntityCardModel for card view
  // Follows HOMOLOGACION_VISTAS_STANDAR.md styling (fixed h-96 height)
  // ========================================================================
  cardAdapter: (visit: MedicalVisit): EntityCardModel => {
    const statusLabel = getStatusLabel(visit.status);
    const reasonLabel = getReasonLabel(visit.visit_type);
    const tempStatus = getTemperatureStatus(visit.vital_signs?.body_temperature);
    const hrStatus = getHeartRateStatus(visit.vital_signs?.heart_rate);

    return {
      id: visit.id,
      title: `${reasonLabel}`,
      subtitle: `${formatVisitDate(visit.visit_date)} • ${getDaysSinceVisit(visit.visit_date)}`,
      avatar: {
        text: visit.visit_type.slice(0, 2).toUpperCase(),
      },
      status: {
        label: statusLabel,
        color: getStatusColor(visit.status),
      },
      fields: [
        // Chief complaint / reason
        {
          icon: MdNotes,
          label: 'Motivo',
          value: visit.chief_complaint || reasonLabel,
        },
        // Temperature (with visual status)
        ...(visit.vital_signs?.body_temperature
          ? [
              {
                icon: MdThermostat,
                label: 'Temperatura',
                value: tempStatus.value,
              },
            ]
          : []),
        // Heart rate
        ...(visit.vital_signs?.heart_rate
          ? [
              {
                icon: MdFavoriteBorder,
                label: 'Frecuencia Cardíaca',
                value: hrStatus.value,
              },
            ]
          : []),
        // Respiratory rate
        ...(visit.vital_signs?.respiratory_rate
          ? [
              {
                icon: MdSpeed,
                label: 'Frecuencia Respiratoria',
                value: `${visit.vital_signs.respiratory_rate} rpm`,
              },
            ]
          : []),
      ],
      actions: [],
    };
  },

  // ========================================================================
  // TABLE COLUMNS
  // Displays MedicalVisit data in table format
  // Columns prioritized by relevance and space
  // ========================================================================
  tableColumns: [
    {
      key: 'visit_type',
      label: 'Tipo de Visita',
      accessor: (visit: MedicalVisit) => getVisitTypeDisplay(visit),
      width: 'min-w-[140px]',
    },
    {
      key: 'chief_complaint',
      label: 'Motivo',
      accessor: (visit: MedicalVisit) => visit.chief_complaint || '-',
      width: 'min-w-[150px]',
    },
    {
      key: 'visit_date',
      label: 'Fecha Visita',
      accessor: (visit: MedicalVisit) => formatVisitDate(visit.visit_date),
      width: 'min-w-[140px]',
    },
    {
      key: 'status',
      label: 'Estado',
      accessor: (visit: MedicalVisit) => getStatusLabel(visit.status),
      width: 'min-w-[110px]',
    },
    {
      key: 'temperature',
      label: 'Temperatura',
      accessor: (visit: MedicalVisit) => {
        const temp = visit.vital_signs?.body_temperature;
        if (!temp) return '-';
        const tempStatus = getTemperatureStatus(temp);
        return tempStatus.value;
      },
      width: 'min-w-[100px]',
    },
    {
      key: 'heart_rate',
      label: 'FC',
      accessor: (visit: MedicalVisit) => {
        const hr = visit.vital_signs?.heart_rate;
        return hr ? `${hr} bpm` : '-';
      },
      width: 'min-w-[80px]',
    },
  ] as ColumnDef<MedicalVisit>[],

  // ========================================================================
  // TOOLBAR CONFIGURATION
  // Controls search, filters, sort, and view toggle options
  // ========================================================================
  toolbar: {
    searchPlaceholder: 'Buscar por motivo, queja, ID de visita...',
    enableFilters: true,
    enableSort: true,
    enableViewToggle: true,
  },

  // ========================================================================
  // FILTER AND SORT OPTIONS
  // Enables filtering and sorting from the toolbar
  // ========================================================================
  filters: {
    sortOptions: [
      { label: 'Más Recientes', value: 'date-desc' },
      { label: 'Más Antiguos', value: 'date-asc' },
      { label: 'Estado: Firmado', value: 'status-signed' },
      { label: 'Estado: Completado', value: 'status-completed' },
      { label: 'Estado: En Progreso', value: 'status-inprogress' },
      { label: 'Estado: Borrador', value: 'status-draft' },
      { label: 'Temperatura Alta', value: 'temp-high' },
    ],
  },

  // ========================================================================
  // VIEW MODE CONFIGURATION
  // Supports both card and table views for flexibility
  // ========================================================================
  defaultViewMode: 'table',
  supportedViewModes: ['cards', 'table'],
};
