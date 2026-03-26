'use client';

import React, { useState } from 'react';
import {
  MdEdit,
  MdDelete,
  MdMoreVert,
  MdVaccines,
  MdInfo,
  MdCalendarToday,
  MdCheckCircle,
  MdBlock,
  MdChecklistRtl,
} from 'react-icons/md';
import { EntityAction } from '@/components/entity-kit';

interface Vaccine {
  id: string;
  name: string;
  description?: string;
  diseasesCovered?: string[];
  isSingleDose?: boolean;
  boosterDays?: number;
  isActive: boolean;
  createdAt?: string;
}

interface VaccineCardProps {
  vaccine: Vaccine;
  actions?: EntityAction[];
  size?: 'S' | 'M' | 'L';
  onActionClick?: (action: EntityAction) => void;
  onEdit?: (vaccine: Vaccine) => void;
  onDelete?: (vaccine: Vaccine) => void;
  onActivate?: (vaccine: Vaccine) => void;
  onDeactivate?: (vaccine: Vaccine) => void;
}

const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  try {
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(dateString));
  } catch {
    return 'N/A';
  }
};

/**
 * VaccineCard - Fixed height card following PetCard pattern
 */
export function VaccineCard({
  vaccine,
  actions = [],
  size = 'M',
  onActionClick,
  onEdit,
  onDelete,
  onActivate,
  onDeactivate,
}: VaccineCardProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sizeMap = {
    S: 'h-64',    // 256px
    M: 'h-80',    // 320px
    L: 'h-96',    // 384px
  };

  const handleActionClick = (action: EntityAction) => {
    if (onActionClick) {
      onActionClick(action);
      return;
    }
    switch (action.id) {
      case 'edit':
        onEdit?.(vaccine);
        break;
      case 'delete':
        onDelete?.(vaccine);
        break;
      case 'activate':
        onActivate?.(vaccine);
        break;
      case 'deactivate':
        onDeactivate?.(vaccine);
        break;
    }
  };

  const initials = vaccine.name.slice(0, 2).toUpperCase();
  const statusLabel = vaccine.isActive ? 'Activa' : 'Inactiva';
  const statusBadge = vaccine.isActive 
    ? 'bg-green-500 text-white' 
    : 'bg-slate-500 text-white';
  const headerBg = vaccine.isActive
    ? 'bg-gradient-to-r from-primary-600 to-primary-700'
    : 'bg-gradient-to-r from-slate-600 to-slate-700';
  const cardBg = vaccine.isActive 
    ? 'bg-white border-primary-200 hover:border-primary-200' 
    : 'bg-slate-50 border-slate-200';

  return (
    <div
      className={`rounded-lg border overflow-hidden transition-all hover:shadow-md ${sizeMap[size]} flex flex-col ${cardBg}`}
    >
      {/* HEADER */}
      <div className={`${headerBg} px-4 py-3 relative flex-shrink-0`}>
        {/* Status Badge */}
        <span
          className={`absolute top-3 right-12 px-2.5 py-0.5 rounded text-xs font-semibold ${statusBadge}`}
        >
          {statusLabel}
        </span>

        <div className="flex items-start gap-3">
          {/* Avatar with Icon */}
          <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            <MdVaccines className="w-6 h-6" />
          </div>

          {/* Name + ID */}
          <div className="flex-1 min-w-0 pr-10">
            <h3 className="font-bold text-white text-base leading-tight truncate">
              {vaccine.name}
            </h3>
            <p className="text-white/60 text-xs font-mono mt-0.5">
              {vaccine.id.slice(0, 8)}
            </p>
          </div>

          {/* Menu Button */}
          <div className="relative">
            <button
              onClick={() => setExpandedId(expandedId === vaccine.id ? null : vaccine.id)}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded transition"
              title="Opciones"
            >
              <MdMoreVert className="w-5 h-5" />
            </button>

            {expandedId === vaccine.id && (
              <div className="absolute right-0 top-10 w-40 bg-white border border-slate-200 rounded-lg shadow-xl z-10 overflow-hidden">
                {actions.length > 0 ? (
                  actions.map((action) => (
                    <button
                      key={action.id}
                      onClick={() => {
                        handleActionClick(action);
                        setExpandedId(null);
                      }}
                      className={`w-full px-3 py-2 text-left font-medium text-xs flex items-center gap-2 transition ${
                        action.id === 'delete'
                          ? 'text-red-600 hover:bg-red-50'
                          : 'text-slate-700 hover:bg-slate-50'
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
                        onEdit?.(vaccine);
                        setExpandedId(null);
                      }}
                      className="w-full px-3 py-2 text-left text-primary-600 hover:bg-primary-50 transition font-medium text-xs flex items-center gap-2"
                    >
                      <MdEdit className="w-3.5 h-3.5" />
                      Editar
                    </button>
                    {vaccine.isActive ? (
                      <button
                        onClick={() => {
                          onDeactivate?.(vaccine);
                          setExpandedId(null);
                        }}
                        className="w-full px-3 py-2 text-left text-amber-600 hover:bg-amber-50 transition font-medium text-xs flex items-center gap-2 border-t border-slate-100"
                      >
                        <MdBlock className="w-3.5 h-3.5" />
                        Desactivar
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          onActivate?.(vaccine);
                          setExpandedId(null);
                        }}
                        className="w-full px-3 py-2 text-left text-green-600 hover:bg-green-50 transition font-medium text-xs flex items-center gap-2 border-t border-slate-100"
                      >
                        <MdChecklistRtl className="w-3.5 h-3.5" />
                        Activar
                      </button>
                    )}
                    <button
                      onClick={() => {
                        onDelete?.(vaccine);
                        setExpandedId(null);
                      }}
                      className="w-full px-3 py-2 text-left text-red-600 hover:bg-red-50 transition font-medium text-xs flex items-center gap-2 border-t border-slate-100"
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

        {/* Info Row */}
        {vaccine.diseasesCovered && vaccine.diseasesCovered.length > 0 && (
          <div className="flex items-center gap-2 mt-2 text-white/95 text-xs">
            <MdInfo className="w-4 h-4" />
            <span className="font-medium truncate">
              {vaccine.diseasesCovered.join(', ')}
            </span>
          </div>
        )}
      </div>

      {/* BODY */}
      <div className="flex-1 px-4 py-3 overflow-y-auto">
        <div className="space-y-3">
          {/* Description */}
          {vaccine.description && (
            <div>
              <p className="text-xs uppercase font-semibold text-slate-500 mb-1">
                Descripción
              </p>
              <p className="text-sm text-slate-700 line-clamp-2">
                {vaccine.description}
              </p>
            </div>
          )}

          {/* Vaccine Type and Booster Days */}
          {vaccine.isSingleDose ? (
            <div>
              <p className="text-xs uppercase font-semibold text-slate-500 mb-1">
                Tipo de Vacuna
              </p>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                  <MdCheckCircle className="w-3.5 h-3.5" />
                  Dosis Única
                </span>
              </div>
            </div>
          ) : vaccine.boosterDays ? (
            <div>
              <p className="text-xs uppercase font-semibold text-slate-500 mb-1">
                Refuerzo
              </p>
              <div className="flex items-center gap-2">
                <MdCalendarToday className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700">
                  Cada {vaccine.boosterDays} días
                </span>
              </div>
            </div>
          ) : null}

          {/* Created Date */}
          {vaccine.createdAt && (
            <div className="text-xs text-slate-500">
              Creado: {formatDate(vaccine.createdAt)}
            </div>
          )}
        </div>
      </div>

      {/* FOOTER - Status Info */}
      <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex-shrink-0">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <MdCheckCircle className={vaccine.isActive ? 'text-green-600' : 'text-slate-400'} />
          <span>{vaccine.isActive ? 'Disponible para usar' : 'No disponible'}</span>
        </div>
      </div>
    </div>
  );
}
