'use client';

import React from 'react';
import { MdMoreVert, MdEdit, MdDelete, MdCheckCircle } from 'react-icons/md';
import { MedicalVisit, MedicalVisitStatus } from '@/types/ehr';
import { EntityAction } from '@/components/entity-kit';
import { formatInClinicTz } from '@/lib/datetime-tz';
import { parseISO } from 'date-fns';

interface MedicalVisitsTableProps {
  visits: MedicalVisit[];
  isLoading?: boolean;
  actions?: EntityAction[];
  onActionClick?: (action: EntityAction, visit: MedicalVisit) => void;
  onEdit?: (visit: MedicalVisit) => void;
  onDelete?: (visit: MedicalVisit) => void;
}

/**
 * Status color configuration per HOMOLOGACION_VISTAS_STANDAR
 */
const statusConfig: Record<MedicalVisitStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  SIGNED: 'bg-emerald-100 text-emerald-800',
};

/**
 * Visit type emoji and label mapping
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

const statusLabel: Record<MedicalVisitStatus, string> = {
  DRAFT: 'Borrador',
  IN_PROGRESS: 'En Progreso',
  COMPLETED: 'Completado',
  SIGNED: 'Firmado',
};

/**
 * Format temperature with fever indicator
 */
const formatTemperature = (temp?: number): string => {
  if (!temp) return '-';
  if (temp >= 38) {
    return `🔴 ${temp}°C`;
  }
  return `${temp}°C`;
};

/**
 * MedicalVisitsTable
 * Displays medical visits in table format
 * Shows: Type, Reason, Date, Status, Temperature, Heart Rate, Actions
 * Follows HOMOLOGACION_VISTAS_STANDAR.md patterns
 */
export function MedicalVisitsTable({
  visits,
  isLoading = false,
  actions = [],
  onActionClick,
  onEdit,
  onDelete,
}: MedicalVisitsTableProps) {
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  const handleActionClick = (action: EntityAction, visit: MedicalVisit) => {
    if (onActionClick) {
      onActionClick(action, visit);
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

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Tipo de Visita</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Motivo</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Fecha</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Estado</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Temperatura</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">FC</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3].map((i) => (
              <tr key={i} className="border-b border-gray-100 last:border-b-0">
                <td className="px-4 py-3">
                  <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
                </td>
                <td className="px-4 py-3">
                  <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
                </td>
                <td className="px-4 py-3">
                  <div className="h-4 bg-gray-200 rounded w-28 animate-pulse" />
                </td>
                <td className="px-4 py-3">
                  <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
                </td>
                <td className="px-4 py-3">
                  <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
                </td>
                <td className="px-4 py-3">
                  <div className="h-4 bg-gray-200 rounded w-12 animate-pulse" />
                </td>
                <td className="px-4 py-3">
                  <div className="h-4 bg-gray-200 rounded w-10 mx-auto animate-pulse" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (!visits || visits.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 border-dashed p-8 text-center">
        <p className="text-gray-600 mb-1">No hay registros médicos</p>
        <p className="text-xs text-gray-500">Crea una nueva visita para comenzar</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      <table className="w-full">
        {/* Table Header */}
        <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 min-w-[140px]">
              Tipo de Visita
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 min-w-[150px]">
              Motivo
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 min-w-[140px]">
              Fecha Visita
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 min-w-[110px]">
              Estado
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 min-w-[100px]">
              Temperatura
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 min-w-[80px]">
              FC (bpm)
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 min-w-[60px]">
              Acciones
            </th>
          </tr>
        </thead>

        {/* Table Body */}
        <tbody>
          {visits.map((visit, rowIndex) => {
            const visitDate = formatInClinicTz(parseISO(visit.visit_date.toString()), 'dd/MM/yyyy HH:mm');
            const visitTypeEmoji_val = visitTypeEmoji[visit.visit_type] || '❓';
            const visitTypeLabel_val = visitTypeLabel[visit.visit_type] || visit.visit_type;
            const tempValue = visit.vital_signs?.body_temperature;
            const hrValue = visit.vital_signs?.heart_rate;
            const status = (visit.status || 'DRAFT') as MedicalVisitStatus;

            return (
              <tr
                key={visit.id}
                className={`border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition relative ${
                  rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                }`}
              >
                {/* Type */}
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  <span>{visitTypeEmoji_val} {visitTypeLabel_val}</span>
                </td>

                {/* Reason/Complaint */}
                <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">
                  {visit.chief_complaint || '-'}
                </td>

                {/* Date */}
                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                  {visitDate}
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                  <span
                    className={`inline-block px-2.5 py-1 rounded text-xs font-semibold ${statusConfig[status]}`}
                  >
                    {statusLabel[status]}
                  </span>
                </td>

                {/* Temperature with fever indicator */}
                <td className="px-4 py-3 text-sm font-medium">
                  {tempValue ? (
                    <span className={tempValue >= 38 ? 'text-red-600 font-semibold' : 'text-gray-900'}>
                      {formatTemperature(tempValue)}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>

                {/* Heart Rate */}
                <td className="px-4 py-3 text-sm text-gray-900">
                  {hrValue ? `${hrValue}` : <span className="text-gray-400">-</span>}
                </td>

                {/* Actions Menu */}
                <td className="px-4 py-3 text-center relative">
                  <div className="relative inline-block">
                    <button
                      onClick={() => setExpandedId(expandedId === visit.id ? null : visit.id)}
                      className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition"
                      title="Acciones"
                    >
                      <MdMoreVert className="w-4 h-4" />
                    </button>

                    {expandedId === visit.id && (
                      <div
                        className="absolute right-0 top-10 w-40 bg-white border border-gray-200 rounded-lg shadow-xl z-20 overflow-hidden"
                        onMouseLeave={() => setExpandedId(null)}
                      >
                        {actions.length > 0 ? (
                          actions.map((action) => (
                            <button
                              key={action.id}
                              onClick={() => {
                                handleActionClick(action, visit);
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
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
