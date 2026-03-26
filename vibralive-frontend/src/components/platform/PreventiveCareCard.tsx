'use client';

import React, { useState } from 'react';
import { MdMoreVert, MdEdit, MdDelete } from 'react-icons/md';

interface PreventiveCareEvent {
  id: string;
  petName: string;
  clientName: string;
  eventType: string;
  dueDate: string;
  status: 'UPCOMING' | 'OVERDUE';
  daysUntilDue?: number;
}

interface PreventiveCareCardProps {
  event: PreventiveCareEvent;
  onEdit: (event: PreventiveCareEvent) => void;
  onDelete: (event: PreventiveCareEvent) => void;
}

export const PreventiveCareCard: React.FC<PreventiveCareCardProps> = ({
  event,
  onEdit,
  onDelete,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const isOverdue = event.status === 'OVERDUE';
  const backgroundGradient = isOverdue
    ? 'from-critical-600 via-critical-600 to-critical-700'
    : 'from-success-600 via-success-600 to-success-700';
  const badgeColor = isOverdue ? 'bg-critical-100 text-critical-700' : 'bg-success-100 text-success-700';
  const borderColor = isOverdue ? 'border-critical-200' : 'border-success-200';
  const cardBg = isOverdue ? 'bg-critical-50' : 'bg-success-50';

  return (
    <div className={`h-96 ${cardBg} rounded-xl border-2 ${borderColor} shadow-sm overflow-hidden flex flex-col transition hover:shadow-md`}>
      {/* Header */}
      <div className={`bg-gradient-to-r ${backgroundGradient} px-4 py-3 text-white flex items-center justify-between`}>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-base truncate">{event.petName}</h3>
          <p className="text-xs text-white/80 truncate">{event.clientName}</p>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-white/20 rounded-lg transition"
          >
            <MdMoreVert className="w-5 h-5" />
          </button>
          {showMenu && (
            <div className="absolute right-0 mt-1 w-40 bg-white text-slate-900 rounded-lg shadow-lg border border-slate-200 z-10 overflow-hidden">
              <button
                onClick={() => {
                  onEdit(event);
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2 hover:bg-primary-50 text-primary-600 font-medium transition text-sm"
              >
                <MdEdit className="w-4 h-4" />
                Editar
              </button>
              <button
                onClick={() => {
                  onDelete(event);
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2 hover:bg-critical-50 text-critical-600 font-medium transition text-sm"
              >
                <MdDelete className="w-4 h-4" />
                Eliminar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Status Badge */}
      <div className="px-4 pt-3 flex items-center justify-between">
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${badgeColor}`}>
          {isOverdue ? '⚠ Vencido' : '✓ Próximo'}
        </span>
        <span className="text-xs font-semibold text-slate-600">
          {event.daysUntilDue ?? 0} días
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-3 space-y-3">
        <div>
          <p className="text-xs text-slate-600 font-medium">Tipo de Evento</p>
          <p className="text-sm font-semibold text-slate-900 truncate">{event.eventType}</p>
        </div>
        <div>
          <p className="text-xs text-slate-600 font-medium">Fecha de Vencimiento</p>
          <p className="text-sm font-semibold text-slate-900">{new Date(event.dueDate).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Footer Info */}
      <div className={`px-4 py-2 border-t-2 ${borderColor} text-xs text-slate-600 flex justify-between`}>
        <span>ID: {event.id.slice(0, 6)}</span>
      </div>
    </div>
  );
};
