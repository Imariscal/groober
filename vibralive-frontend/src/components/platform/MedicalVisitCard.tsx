'use client';

import React from 'react';
import {
  MdMoreVert,
  MdEdit,
  MdDelete,
  MdMedicalInformation,
  MdThermostat,
  MdFavoriteBorder,
  MdSpeed,
  MdCheckCircle,
} from 'react-icons/md';
import { MedicalVisit, MedicalVisitStatus } from '@/types/ehr';
import { EntityAction } from '@/components/entity-kit';
import { formatInClinicTz } from '@/lib/datetime-tz';
import { parseISO } from 'date-fns';

interface MedicalVisitCardProps {
  visit: MedicalVisit;
  actions?: EntityAction[];
  onActionClick?: (action: EntityAction) => void;
  onEdit?: (visit: MedicalVisit) => void;
  onDelete?: (visit: MedicalVisit) => void;
}

/**
 * Status color configuration per HOMOLOGACION_VISTAS_STANDAR
 * DRAFT: gray, IN_PROGRESS: blue, COMPLETED: green, SIGNED: dark-green
 */
const statusConfig: Record<MedicalVisitStatus, {
  bg: string;
  badge: string;
  label: string;
  headerGradient: string;
}> = {
  DRAFT: {
    bg: 'bg-white border-gray-200',
    badge: 'bg-gray-500 text-white',
    label: 'Borrador',
    headerGradient: 'from-gray-600 to-gray-700',
  },
  IN_PROGRESS: {
    bg: 'bg-white border-blue-200',
    badge: 'bg-blue-500 text-white',
    label: 'En Progreso',
    headerGradient: 'from-blue-600 to-blue-700',
  },
  COMPLETED: {
    bg: 'bg-white border-green-200',
    badge: 'bg-green-500 text-white',
    label: 'Completado',
    headerGradient: 'from-green-600 to-green-700',
  },
  SIGNED: {
    bg: 'bg-white border-emerald-200',
    badge: 'bg-emerald-700 text-white',
    label: 'Firmado',
    headerGradient: 'from-emerald-700 to-emerald-800',
  },
};

/**
 * Visit type emoji mapping
 */
const visitTypeEmoji: Record<string, string> = {
  CHECKUP: '🏥',
  VACCINATION: '💉',
  DIAGNOSIS: '🔍',
  FOLLOW_UP: '📋',
  OTHER: '❓',
};

const visitTypeLabel: Record<string, string> = {
  CHECKUP: 'Revisión General',
  VACCINATION: 'Vacunación',
  DIAGNOSIS: 'Diagnóstico',
  FOLLOW_UP: 'Seguimiento',
  OTHER: 'Otro',
};

/**
 * Calculate days since visit
 */
const getDaysSinceVisit = (date: MedicalVisit['visit_date']): string => {
  try {
    const visitDate = parseISO(date.toString());
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
 * Format temperature with fever indicator
 */
const formatTemperature = (temp?: number): { value: string; isFever: boolean } => {
  if (!temp) return { value: '-', isFever: false };
  const isFever = temp >= 38;
  return { value: `${temp}°C`, isFever };
};

/**
 * MedicalVisitCard
 * Displays medical visit in card format with fixed height (h-96)
 * Shows vital signs, status, and action menu
 * Follows HOMOLOGACION_VISTAS_STANDAR.md patterns
 */
export function MedicalVisitCard({
  visit,
  actions = [],
  onActionClick,
  onEdit,
  onDelete,
}: MedicalVisitCardProps) {
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  const status = (visit.status || 'DRAFT') as MedicalVisitStatus;
  const config = statusConfig[status] || statusConfig.DRAFT;

  const visitDate = formatInClinicTz(parseISO(visit.visit_date.toString()), 'dd/MM/yyyy HH:mm');
  const daysAgo = getDaysSinceVisit(visit.visit_date);
  const tempStatus = formatTemperature(visit.vital_signs?.body_temperature);

  const visitTypeEmoji_val = visitTypeEmoji[visit.visit_type] || '❓';
  const visitTypeLabel_val = visitTypeLabel[visit.visit_type] || visit.visit_type;

  const handleActionClick = (action: EntityAction) => {
    if (onActionClick) {
      onActionClick(action);
      return;
    }
    switch (action.id) {
      case 'edit':
        onEdit?.(visit);
        break;
      case 'delete':
        onDelete?.(visit);
        break;
    }
  };

  return (
    <div
      className={`rounded-lg border overflow-hidden transition-all hover:shadow-lg h-96 flex flex-col ${config.bg}`}
    >
      {/* HEADER - Gradient per status */}
      <div className={`bg-gradient-to-r ${config.headerGradient} px-4 py-3 relative flex-shrink-0`}>
        {/* Status Badge */}
        <span className={`absolute top-3 right-12 px-2.5 py-0.5 rounded text-xs font-semibold ${config.badge}`}>
          {config.label}
        </span>

        <div className="flex items-start gap-3">
          {/* Avatar with Visit Type Icon */}
          <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            {visitTypeEmoji_val}
          </div>

          {/* Visit Info */}
          <div className="flex-1 min-w-0 pr-10">
            <h3 className="font-bold text-white text-base leading-tight">
              {visitTypeLabel_val}
            </h3>
            <p className="text-white/70 text-xs mt-0.5">
              {visitDate} • {daysAgo}
            </p>
          </div>

          {/* Menu Button */}
          <div className="relative">
            <button
              onClick={() => setExpandedId(expandedId === visit.id ? null : visit.id)}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded transition"
            >
              <MdMoreVert className="w-5 h-5" />
            </button>

            {expandedId === visit.id && (
              <div className="absolute right-0 top-10 w-40 bg-white border border-gray-200 rounded-lg shadow-xl z-10 overflow-hidden">
                {actions.length > 0 ? (
                  actions.map((action) => (
                    <button
                      key={action.id}
                      onClick={() => {
                        handleActionClick(action);
                        setExpandedId(null);
                      }}
                      className={`w-full px-3 py-2 text-left font-medium text-xs flex items-center gap-2 transition ${
                        action.id === 'delete' ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {action.icon && <action.icon className="w-3.5 h-3.5" />}
                      {action.label}
                    </button>
                  ))
                ) : (
                  <>
                    <button
                      onClick={() => {
                        onEdit?.(visit);
                        setExpandedId(null);
                      }}
                      disabled={status !== 'DRAFT'}
                      className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2 transition font-medium ${
                        status === 'DRAFT'
                          ? 'text-primary-600 hover:bg-primary-50'
                          : 'text-gray-400 cursor-not-allowed'
                      }`}
                      title={status !== 'DRAFT' ? 'Solo se pueden editar registros en Borrador' : ''}
                    >
                      <MdEdit className="w-3.5 h-3.5" />
                      Editar
                    </button>
                    <button
                      onClick={() => {
                        onDelete?.(visit);
                        setExpandedId(null);
                      }}
                      className="w-full px-3 py-2 text-left text-red-600 hover:bg-red-50 transition font-medium text-xs flex items-center gap-2 border-t border-gray-100"
                    >
                      <MdDelete className="w-3.5 h-3.5" />
                      Eliminar
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Chief Complaint Preview */}
        <p className="text-white/90 text-xs mt-2 line-clamp-1">
          {visit.chief_complaint || 'Sin motivo registrado'}
        </p>
      </div>

      {/* BODY */}
      <div className="px-4 py-3 flex-1 flex flex-col gap-2.5 overflow-y-auto">
        {/* Vital Signs Grid */}
        {visit.vital_signs && (
          <>
            {/* Temperature */}
            {visit.vital_signs.body_temperature && (
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    tempStatus.isFever ? 'bg-red-100' : 'bg-orange-100'
                  }`}
                >
                  <MdThermostat
                    size={16}
                    className={tempStatus.isFever ? 'text-red-600' : 'text-orange-600'}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-600">Temperatura</p>
                  <p className={`text-sm font-semibold ${tempStatus.isFever ? 'text-red-600' : 'text-gray-900'}`}>
                    {tempStatus.value}
                  </p>
                </div>
              </div>
            )}

            {/* Heart Rate */}
            {visit.vital_signs.heart_rate && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-red-100">
                  <MdFavoriteBorder size={16} className="text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-600">Frecuencia Cardíaca</p>
                  <p className="text-sm font-semibold text-gray-900">{visit.vital_signs.heart_rate} bpm</p>
                </div>
              </div>
            )}

            {/* Respiratory Rate */}
            {visit.vital_signs.respiratory_rate && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-100">
                  <MdSpeed size={16} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-600">Frecuencia Respiratoria</p>
                  <p className="text-sm font-semibold text-gray-900">{visit.vital_signs.respiratory_rate} rpm</p>
                </div>
              </div>
            )}
          </>
        )}

        {/* Observations Preview */}
        {visit.general_observations && (
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-600 mb-1">Observaciones</p>
            <p className="text-xs text-gray-600 line-clamp-2">{visit.general_observations}</p>
          </div>
        )}
      </div>

      {/* FOOTER - Status indicator if signed */}
      {status === 'SIGNED' && (
        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 flex items-center gap-2 text-xs text-green-700 flex-shrink-0">
          <MdCheckCircle size={14} />
          <span className="font-medium">Registro Firmado</span>
        </div>
      )}
    </div>
  );
}
