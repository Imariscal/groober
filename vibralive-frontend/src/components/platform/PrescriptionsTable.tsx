'use client';

import React from 'react';
import { MdMoreVert, MdEdit, MdDelete } from 'react-icons/md';
import { Prescription } from '@/types/ehr';
import { formatInClinicTz } from '@/lib/datetime-tz';
import { parseISO } from 'date-fns';

interface PrescriptionsTableProps {
  prescriptions: Prescription[];
  isLoading?: boolean;
  onEdit?: (prescription: Prescription) => void;
  onDelete?: (prescription: Prescription) => void;
}

/**
 * Status color configuration
 */
const statusConfig: Record<string, string> = {
  ACTIVE: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
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

const statusLabel: Record<string, string> = {
  ACTIVE: 'Activo',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
};

/**
 * PrescriptionsTable
 * Displays prescriptions in table format
 */
export function PrescriptionsTable({
  prescriptions,
  isLoading = false,
  onEdit,
  onDelete,
}: PrescriptionsTableProps) {
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Medicamento</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Dosis</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Frecuencia</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Vía</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Estado</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Duración</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3].map((i) => (
              <tr key={i} className="border-b border-gray-100 last:border-b-0">
                <td className="px-4 py-3">
                  <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
                </td>
                <td className="px-4 py-3">
                  <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
                </td>
                <td className="px-4 py-3">
                  <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
                </td>
                <td className="px-4 py-3">
                  <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
                </td>
                <td className="px-4 py-3">
                  <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
                </td>
                <td className="px-4 py-3">
                  <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
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

  if (!prescriptions || prescriptions.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 border-dashed p-8 text-center">
        <p className="text-gray-600 mb-1">No hay prescripciones</p>
        <p className="text-xs text-gray-500">Crea una nueva prescripción para comenzar</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      <table className="w-full">
        {/* Table Header */}
        <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 min-w-[150px]">
              Medicamento
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 min-w-[100px]">
              Dosis
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 min-w-[120px]">
              Frecuencia
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 min-w-[100px]">
              Vía
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 min-w-[110px]">
              Estado
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 min-w-[80px]">
              Duración
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 min-w-[60px]">
              Acciones
            </th>
          </tr>
        </thead>

        {/* Table Body */}
        <tbody>
          {prescriptions.map((prescription, rowIndex) => {
            const status = (prescription.status || 'ACTIVE') as keyof typeof statusConfig;

            return (
              <tr
                key={prescription.id}
                className={`border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition relative ${
                  rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                }`}
              >
                {/* Medication Name */}
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {prescription.medicationName}
                </td>

                {/* Dosage */}
                <td className="px-4 py-3 text-sm text-gray-700">
                  {prescription.dosage}
                </td>

                {/* Frequency */}
                <td className="px-4 py-3 text-sm text-gray-700">
                  {getFrequencyLabel(prescription.frequency)}
                </td>

                {/* Route */}
                <td className="px-4 py-3 text-sm text-gray-700">
                  {getRouteLabel(prescription.route)}
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                  <span className={`inline-block px-2.5 py-1 rounded text-xs font-semibold ${statusConfig[status]}`}>
                    {statusLabel[status]}
                  </span>
                </td>

                {/* Duration */}
                <td className="px-4 py-3 text-sm text-gray-900">
                  {prescription.duration || '-'}
                </td>

                {/* Actions Menu */}
                <td className="px-4 py-3 text-center relative">
                  <div className="relative inline-block">
                    <button
                      onClick={() => setExpandedId(expandedId === prescription.id ? null : prescription.id)}
                      className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition"
                      title="Acciones"
                    >
                      <MdMoreVert className="w-4 h-4" />
                    </button>

                    {expandedId === prescription.id && (
                      <div
                        className="absolute right-0 top-10 w-40 bg-white border border-gray-200 rounded-lg shadow-xl z-20 overflow-hidden"
                        onMouseLeave={() => setExpandedId(null)}
                      >
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
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
