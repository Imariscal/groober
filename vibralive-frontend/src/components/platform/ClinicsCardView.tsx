'use client';

import React from 'react';
import {
  MdPhone,
  MdEmail,
  MdLocationOn,
  MdPerson,
  MdMoreVert,
  MdDone,
  MdPause,
} from 'react-icons/md';
import { Clinic, ClinicStatus } from '@/types';
import { activateClinic } from '@/lib/platformApi';

interface ClinicsCardViewProps {
  clinics: Clinic[];
  isLoading?: boolean;
  onEdit?: (clinic: Clinic) => void;
  onSuspend?: (clinic: Clinic) => void;
  onAssignOwner?: (clinic: Clinic) => void;
  onRefresh?: () => void;
}

const statusConfig: Record<
  ClinicStatus,
  { badge: string; icon: string; label: string; bg: string }
> = {
  ACTIVE: {
    bg: 'bg-green-50 border-green-200',
    badge: 'bg-green-100 text-green-700',
    label: 'Activa',
    icon: '🟢',
  },
  SUSPENDED: {
    bg: 'bg-red-50 border-red-200',
    badge: 'bg-red-100 text-red-700',
    label: 'Suspendida',
    icon: '🔴',
  },
  DELETED: {
    bg: 'bg-gray-50 border-gray-200',
    badge: 'bg-gray-100 text-gray-700',
    label: 'Eliminada',
    icon: '⚫',
  },
};

export function ClinicsCardView({
  clinics,
  onEdit,
  onSuspend,
  onAssignOwner,
  onRefresh,
}: ClinicsCardViewProps) {
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
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {clinics.map((clinic) => {
        const config = statusConfig[clinic.status];
        const initials = clinic.name
          .split(' ')
          .map((w) => w[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);

        return (
          <div
            key={clinic.id}
            className={`rounded-xl border-2 overflow-hidden transition-all duration-300 hover:shadow-lg ${config.bg}`}
          >
            {/* Card Header with Status */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-4 relative">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                    {initials}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white text-sm line-clamp-1">
                      {clinic.name}
                    </h3>
                    <p className="text-primary-100 text-xs">
                      ID: {clinic.id.slice(0, 8)}...
                    </p>
                  </div>
                </div>
                <div className="relative">
                  <button
                    onClick={() =>
                      setExpandedId(expandedId === clinic.id ? null : clinic.id)
                    }
                    className="p-2 text-white hover:bg-primary-700 rounded-lg transition"
                  >
                    <MdMoreVert className="w-5 h-5" />
                  </button>

                  {/* Action Menu */}
                  {expandedId === clinic.id && (
                    <div className="absolute right-0 top-10 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-10 overflow-hidden">
                      {clinic.status === 'ACTIVE' ? (
                        <>
                          <button
                            onClick={() => {
                              onAssignOwner?.(clinic);
                              setExpandedId(null);
                            }}
                            className="w-full px-4 py-3 text-left text-primary-600 hover:bg-primary-50 transition borders font-medium text-sm flex items-center gap-3"
                          >
                            <MdPerson className="w-4 h-4" />
                            Asignar Admin
                          </button>
                          <div className="border-t border-gray-100" />
                          <button
                            onClick={() => {
                              onEdit?.(clinic);
                              setExpandedId(null);
                            }}
                            className="w-full px-4 py-3 text-left text-yellow-600 hover:bg-yellow-50 transition font-medium text-sm flex items-center gap-3"
                          >
                            <span>✏️</span>
                            Editar
                          </button>
                          <div className="border-t border-gray-100" />
                          <button
                            onClick={() => {
                              onSuspend?.(clinic);
                              setExpandedId(null);
                            }}
                            className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 transition font-medium text-sm flex items-center gap-3"
                          >
                            <MdPause className="w-4 h-4" />
                            Suspender
                          </button>
                        </>
                      ) : clinic.status === 'SUSPENDED' ? (
                        <button
                          onClick={() => {
                            handleActivate(clinic.id);
                            setExpandedId(null);
                          }}
                          disabled={activatingId === clinic.id}
                          className="w-full px-4 py-3 text-left text-green-600 hover:bg-green-50 transition font-medium text-sm flex items-center gap-3 disabled:opacity-50"
                        >
                          <MdDone className="w-4 h-4" />
                          {activatingId === clinic.id ? 'Activando...' : 'Activar'}
                        </button>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex justify-between items-center mt-3">
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${config.badge}`}
                >
                  <span>{config.icon}</span>
                  {config.label}
                </span>
              </div>
            </div>

            {/* Card Body */}
            <div className="px-5 py-4 space-y-3">
              {/* Phone */}
              <div className="flex items-center gap-3 text-sm">
                <MdPhone className="w-5 h-5 text-primary-600 flex-shrink-0" />
                <span className="text-gray-700 font-medium">{clinic.phone}</span>
              </div>

              {/* Email */}
              {clinic.email && (
                <div className="flex items-center gap-3 text-sm">
                  <MdEmail className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-600 truncate text-xs">
                    {clinic.email}
                  </span>
                </div>
              )}

              {/* Location */}
              <div className="flex items-center gap-3 text-sm">
                <MdLocationOn className="w-5 h-5 text-red-600 flex-shrink-0" />
                <span className="text-gray-700 font-medium">
                  {clinic.city || 'Sin ciudad'}{' '}
                  {clinic.country && (
                    <span className="text-gray-500 text-xs">({clinic.country})</span>
                  )}
                </span>
              </div>

              {/* Responsable */}
              {clinic.responsable && (
                <div className="flex items-center gap-3 text-sm pt-2 border-t border-gray-300">
                  <MdPerson className="w-5 h-5 text-purple-600 flex-shrink-0" />
                  <span className="text-gray-700">{clinic.responsable}</span>
                </div>
              )}
            </div>

            {/* Card Footer */}
            <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Plan: {clinic.subscriptionPlan || 'N/A'}
              </span>
              {clinic.status === 'ACTIVE' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => onAssignOwner?.(clinic)}
                    className="p-2 text-primary-600 hover:bg-blue-100 rounded-lg transition"
                    title="Asignar Admin"
                  >
                    <MdPerson className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onEdit?.(clinic)}
                    className="p-2 text-yellow-600 hover:bg-yellow-100 rounded-lg transition"
                    title="Editar"
                  >
                    <span>✏️</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

