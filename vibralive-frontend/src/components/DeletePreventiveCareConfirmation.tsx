'use client';

import React from 'react';
import { MdClose, MdWarning } from 'react-icons/md';

interface PreventiveCareEvent {
  id: string;
  petName: string;
  clientName: string;
  eventType: string;
  dueDate: string;
  status: 'UPCOMING' | 'OVERDUE';
  daysUntilDue?: number;
}

interface DeletePreventiveCareConfirmationProps {
  isOpen: boolean;
  event: PreventiveCareEvent | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const DeletePreventiveCareConfirmation: React.FC<DeletePreventiveCareConfirmationProps> = ({
  isOpen,
  event,
  onClose,
  onSuccess,
}) => {
  if (!isOpen || !event) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="bg-critical-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-critical-200 rounded-lg">
              <MdWarning className="w-6 h-6 text-critical-600" />
            </div>
            <h2 className="text-lg font-bold text-critical-900">Eliminar Evento</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-critical-200 rounded-lg transition">
            <MdClose className="w-5 h-5 text-critical-700" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-slate-700">
            ¿Estás seguro de que deseas eliminar este evento preventivo?{' '}
            <span className="font-semibold text-critical-600">{event.petName}</span> de{' '}
            <span className="font-semibold text-critical-600">{event.clientName}</span>
          </p>

          {/* Event Details */}
          <div className="bg-slate-50 rounded-lg p-4 space-y-2 border border-slate-200">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Tipo:</span>
              <span className="text-sm font-semibold text-slate-900">{event.eventType}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Fecha:</span>
              <span className="text-sm font-semibold text-slate-900">{new Date(event.dueDate).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Estado:</span>
              <span className={`text-sm font-semibold ${event.status === 'OVERDUE' ? 'text-critical-600' : 'text-warning-600'}`}>
                {event.status === 'OVERDUE' ? 'Vencido' : 'Próximo'}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-500">Esta acción no se puede deshacer.</p>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-slate-200">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition"
          >
            Cancelar
          </button>
          <button
            onClick={onSuccess}
            className="flex-1 px-4 py-2 bg-critical-600 hover:bg-critical-700 text-white rounded-lg font-medium transition"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
};
