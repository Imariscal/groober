'use client';

import React from 'react';
import {
  MdEdit,
  MdDone,
  MdMoreVert,
  MdPerson,
  MdPause,
} from 'react-icons/md';
import { Clinic, ClinicStatus } from '@/types';
import { activateClinic } from '@/lib/platformApi';

interface ClinicTableProps {
  clinics: Clinic[];
  onEdit?: (clinic: Clinic) => void;
  onSuspend?: (clinic: Clinic) => void;
  onAssignOwner?: (clinic: Clinic) => void;
  onRefresh?: () => void;
}

const statusColors: Record<ClinicStatus, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  SUSPENDED: 'bg-red-100 text-red-800',
  DELETED: 'bg-gray-100 text-gray-800',
};

const statusLabels: Record<ClinicStatus, string> = {
  ACTIVE: 'Activa',
  SUSPENDED: 'Suspendida',
  DELETED: 'Eliminada',
};

/**
 * ClinicTable
 * Entity-specific table component for displaying clinic data
 * Restores the original visual design with status badges, plan badges, and action buttons
 * 
 * This component intentionally diverges from the generic EntityTable to preserve
 * the existing UI/UX that users expect from the Clinics page.
 */
export function ClinicTable({
  clinics,
  onEdit,
  onSuspend,
  onAssignOwner,
  onRefresh,
}: ClinicTableProps) {
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [activatingId, setActivatingId] = React.useState<string | null>(null);

  const handleActivate = async (clinicId: string) => {
    setActivatingId(clinicId);
    try {
      await activateClinic(clinicId);
      onRefresh?.();
    } catch (error) {
      console.error('Error activating clinic:', error);
    } finally {
      setActivatingId(null);
    }
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left font-semibold text-gray-700">
              Clínica
            </th>
            <th className="px-6 py-3 text-left font-semibold text-gray-700">
              Teléfono
            </th>
            <th className="px-6 py-3 text-left font-semibold text-gray-700">
              Correo
            </th>
            <th className="px-6 py-3 text-left font-semibold text-gray-700">
              Ciudad
            </th>
            <th className="px-6 py-3 text-left font-semibold text-gray-700">
              Plan
            </th>
            <th className="px-6 py-3 text-left font-semibold text-gray-700">
              Estado
            </th>
            <th className="px-6 py-3 text-center font-semibold text-gray-700">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {clinics.map((clinic) => (
            <tr key={clinic.id} className="hover:bg-gray-50 transition">
              <td className="px-6 py-4">
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-900">
                    {clinic.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    ID: {clinic.id.slice(0, 8)}
                  </span>
                  {clinic.responsable && (
                    <span className="text-xs text-gray-600 mt-1">
                      📋 {clinic.responsable}
                    </span>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 text-gray-700 font-medium">
                {clinic.phone}
              </td>
              <td className="px-6 py-4 text-gray-600 text-sm truncate">
                {clinic.email || '-'}
              </td>
              <td className="px-6 py-4 text-gray-700">
                {clinic.city || '-'} {clinic.country && `(${clinic.country})`}
              </td>
              <td className="px-6 py-4">
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold capitalize">
                  {clinic.subscriptionPlan}
                </span>
              </td>
              <td className="px-6 py-4">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                    statusColors[clinic.status]
                  }`}
                >
                  {statusLabels[clinic.status]}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center justify-center gap-2 relative">
                  {/* Quick Action Buttons */}
                  {clinic.status === 'ACTIVE' && (
                    <>
                      <button
                        onClick={() => onAssignOwner?.(clinic)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Asignar Admin"
                      >
                        <MdPerson className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEdit?.(clinic)}
                        className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition"
                        title="Editar"
                      >
                        <MdEdit className="w-4 h-4" />
                      </button>
                    </>
                  )}

                  {/* More Actions Menu */}
                  <div className="relative">
                    <button
                      onClick={() =>
                        setExpandedId(expandedId === clinic.id ? null : clinic.id)
                      }
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                    >
                      <MdMoreVert className="w-4 h-4" />
                    </button>

                    {expandedId === clinic.id && (
                      <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-10">
                        {clinic.status === 'ACTIVE' ? (
                          <button
                            onClick={() => {
                              onSuspend?.(clinic);
                              setExpandedId(null);
                            }}
                            className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 transition flex items-center gap-2 text-sm font-medium"
                          >
                            <MdPause className="w-4 h-4" />
                            Suspender
                          </button>
                        ) : clinic.status === 'SUSPENDED' ? (
                          <button
                            onClick={() => {
                              handleActivate(clinic.id);
                              setExpandedId(null);
                            }}
                            disabled={activatingId === clinic.id}
                            className="w-full px-4 py-2 text-left text-green-600 hover:bg-green-50 transition flex items-center gap-2 text-sm font-medium disabled:opacity-50"
                          >
                            <MdDone className="w-4 h-4" />
                            {activatingId === clinic.id
                              ? 'Activando...'
                              : 'Activar'}
                          </button>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
