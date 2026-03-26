'use client';

import React from 'react';
import {
  MdMoreVert,
  MdEdit,
  MdDelete,
  MdLocalPharmacy,
  MdCheckCircle,
  MdWarning,
} from 'react-icons/md';
import { Prescription } from '@/types/ehr';
import { formatInClinicTz } from '@/lib/datetime-tz';
import { parseISO } from 'date-fns';

interface PrescriptionCardProps {
  prescription: Prescription;
  onEdit?: (prescription: Prescription) => void;
  onDelete?: (prescription: Prescription) => void;
}

/**
 * Status color configuration
 */
const statusConfig: Record<string, { bg: string; badge: string; label: string; headerGradient: string }> = {
  ACTIVE: {
    bg: 'bg-white border-blue-200',
    badge: 'bg-blue-500 text-white',
    label: 'Activo',
    headerGradient: 'from-blue-600 to-blue-700',
  },
  COMPLETED: {
    bg: 'bg-white border-green-200',
    badge: 'bg-green-500 text-white',
    label: 'Completado',
    headerGradient: 'from-green-600 to-green-700',
  },
  CANCELLED: {
    bg: 'bg-white border-red-200',
    badge: 'bg-red-500 text-white',
    label: 'Cancelado',
    headerGradient: 'from-red-600 to-red-700',
  },
};

/**
 * Format frequency label
 */
const getFrequencyLabel = (freq: string): string => {
  const labels: Record<string, string> = {
    ONCE_DAILY: '1x diaria',
    TWICE_DAILY: '2x diaria',
    THREE_TIMES_DAILY: '3x diaria',
    FOUR_TIMES_DAILY: '4x diaria',
    EVERY_12_HOURS: 'Cada 12h',
    EVERY_8_HOURS: 'Cada 8h',
    AS_NEEDED: 'Según sea necesario',
  };
  return labels[freq] || freq;
};

/**
 * Format route label
 */
const getRouteLabel = (route: string): string => {
  const labels: Record<string, string> = {
    ORAL: 'Oral',
    INJECTION: 'Inyección',
    TOPICAL: 'Tópica',
    INHALATION: 'Inhalación',
    INTRAVENOUS: 'Intravenosa',
    INTRAMUSCULAR: 'Intramuscular',
  };
  return labels[route] || route;
};

/**
 * PrescriptionCard
 * Displays prescription in card format with fixed height
 */
export function PrescriptionCard({
  prescription,
  onEdit,
  onDelete,
}: PrescriptionCardProps) {
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  const status = (prescription.status || 'ACTIVE') as keyof typeof statusConfig;
  const config = statusConfig[status] || statusConfig.ACTIVE;

  const createdDate = formatInClinicTz(parseISO(prescription.created_at.toString()), 'dd/MM/yyyy');
  const expiresDate = prescription.expires_at
    ? formatInClinicTz(parseISO(prescription.expires_at.toString()), 'dd/MM/yyyy')
    : null;

  return (
    <div
      className={`rounded-lg border overflow-hidden transition-all hover:shadow-lg h-96 flex flex-col ${config.bg}`}
    >
      {/* HEADER */}
      <div className={`bg-gradient-to-r ${config.headerGradient} px-4 py-3 relative flex-shrink-0`}>
        {/* Status Badge */}
        <span className={`absolute top-3 right-12 px-2.5 py-0.5 rounded text-xs font-semibold ${config.badge}`}>
          {config.label}
        </span>

        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            <MdLocalPharmacy size={20} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 pr-10">
            <h3 className="font-bold text-white text-base leading-tight truncate">
              {prescription.medication_name}
            </h3>
            <p className="text-white/70 text-xs mt-0.5">
              {prescription.dosage} • {getFrequencyLabel(prescription.frequency)}
            </p>
          </div>

          {/* Menu Button */}
          <div className="relative">
            <button
              onClick={() => setExpandedId(expandedId === prescription.id ? null : prescription.id)}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded transition"
            >
              <MdMoreVert className="w-5 h-5" />
            </button>

            {expandedId === prescription.id && (
              <div className="absolute right-0 top-10 w-40 bg-white border border-gray-200 rounded-lg shadow-xl z-10 overflow-hidden">
                <button
                  onClick={() => {
                    onEdit?.(prescription);
                    setExpandedId(null);
                  }}
                  className="w-full px-3 py-2 text-left text-primary-600 hover:bg-primary-50 transition font-medium text-xs flex items-center gap-2"
                >
                  <MdEdit className="w-3.5 h-3.5" />
                  Editar
                </button>
                <button
                  onClick={() => {
                    onDelete?.(prescription);
                    setExpandedId(null);
                  }}
                  className="w-full px-3 py-2 text-left text-red-600 hover:bg-red-50 transition font-medium text-xs flex items-center gap-2 border-t border-gray-100"
                >
                  <MdDelete className="w-3.5 h-3.5" />
                  Eliminar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Route */}
        <p className="text-white/90 text-xs mt-2">
          Vía: {getRouteLabel(prescription.route)}
        </p>
      </div>

      {/* BODY */}
      <div className="px-4 py-3 flex-1 flex flex-col gap-2.5 overflow-y-auto">
        {/* Duración */}
        {prescription.duration && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-100">
              <MdCheckCircle size={16} className="text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-600">Duración</p>
              <p className="text-sm font-semibold text-gray-900">{prescription.duration}</p>
            </div>
          </div>
        )}

        {/* Refills */}
        {prescription.refills_remaining !== undefined && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-amber-100">
              <MdWarning size={16} className="text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-600">Refills Disponibles</p>
              <p className="text-sm font-semibold text-gray-900">{prescription.refills_remaining}</p>
            </div>
          </div>
        )}

        {/* Dates */}
        <div className="pt-2 border-t border-gray-100 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">Creado:</span>
            <span className="text-gray-900 font-medium">{createdDate}</span>
          </div>
          {expiresDate && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Expira:</span>
              <span className="text-gray-900 font-medium">{expiresDate}</span>
            </div>
          )}
        </div>

        {/* Instructions */}
        {prescription.instructions && (
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-600 mb-1">Instrucciones</p>
            <p className="text-xs text-gray-600 line-clamp-2">{prescription.instructions}</p>
          </div>
        )}
      </div>
    </div>
  );
}
