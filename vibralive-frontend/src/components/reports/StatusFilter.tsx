'use client';

import React from 'react';
import { MdCheckCircle } from 'react-icons/md';

export type AppointmentStatus = 'SCHEDULED' | 'CONFIRMED' | 'CANCELLED' | 'IN_PROGRESS' | 'COMPLETED';

interface StatusFilterProps {
  selectedStatuses?: AppointmentStatus[];
  onStatusChange: (statuses: AppointmentStatus[]) => void;
}

type StatusColor = 'yellow' | 'green' | 'red' | 'blue' | 'purple';

const STATUS_OPTIONS = [
  { id: 'SCHEDULED' as const, label: 'Programada', color: 'yellow' as StatusColor },
  { id: 'CONFIRMED' as const, label: 'Confirmada', color: 'green' as StatusColor },
  { id: 'CANCELLED' as const, label: 'Cancelada', color: 'red' as StatusColor },
  { id: 'IN_PROGRESS' as const, label: 'En Progreso', color: 'blue' as StatusColor },
  { id: 'COMPLETED' as const, label: 'Completada', color: 'purple' as StatusColor },
];

const colorMap: Record<StatusColor, string> = {
  yellow: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-300',
  green: 'bg-green-100 text-green-800 hover:bg-green-200 border-green-300',
  red: 'bg-red-100 text-red-800 hover:bg-red-200 border-red-300',
  blue: 'bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-300',
  purple: 'bg-purple-100 text-purple-800 hover:bg-purple-200 border-purple-300',
};

/**
 * Filtro múltiple de estados de citas
 */
export const StatusFilter: React.FC<StatusFilterProps> = ({
  selectedStatuses = STATUS_OPTIONS.map((s) => s.id), // Preseleccionar todos por defecto
  onStatusChange,
}) => {
  const toggleStatus = (status: AppointmentStatus) => {
    if (selectedStatuses.includes(status)) {
      onStatusChange(selectedStatuses.filter((s) => s !== status));
    } else {
      onStatusChange([...selectedStatuses, status]);
    }
  };

  const allSelected = selectedStatuses.length === STATUS_OPTIONS.length;
  const selectAll = () => {
    if (allSelected) {
      onStatusChange([]);
    } else {
      onStatusChange(STATUS_OPTIONS.map((s) => s.id));
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-900">Estados</h3>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={selectAll}
          className={`px-3 py-2 text-xs font-medium rounded-lg transition-all ${
            allSelected
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Todos
        </button>

        {STATUS_OPTIONS.map((status) => {
          const isSelected = selectedStatuses.includes(status.id);
          return (
            <button
              key={status.id}
              onClick={() => toggleStatus(status.id)}
              className={`px-3 py-2 text-xs font-medium rounded-lg border-2 transition-all flex items-center gap-1 ${
                isSelected
                  ? `border-slate-400 ${colorMap[status.color]} font-semibold`
                  : `border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100`
              }`}
            >
              {isSelected && <MdCheckCircle className="w-3 h-3" />}
              {status.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
