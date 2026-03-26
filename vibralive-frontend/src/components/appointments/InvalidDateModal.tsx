'use client';

import { MdClose, MdWarning, MdCalendarToday } from 'react-icons/md';
import { format } from 'date-fns';

interface InvalidDateModalProps {
  isOpen: boolean;
  selectedDate: Date | null;
  reason: string;
  onClose: () => void;
}

export function InvalidDateModal({
  isOpen,
  selectedDate,
  reason,
  onClose,
}: InvalidDateModalProps) {
  if (!isOpen || !selectedDate) return null;

  const dateStr = format(selectedDate, 'EEEE, d MMMM yyyy');

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <MdWarning size={24} />
            </div>
            <h2 className="text-xl font-bold">No se puede agendar</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-all"
          >
            <MdClose size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Date Info */}
          <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-4">
            <MdCalendarToday className="text-gray-600 flex-shrink-0" size={24} />
            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wide font-semibold">Fecha seleccionada</p>
              <p className="text-lg font-bold text-gray-900">{dateStr}</p>
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <p className="text-sm text-gray-600 font-semibold uppercase tracking-wide">Motivo</p>
            <div className="bg-red-50 border-l-4 border-red-500 rounded p-4">
              <p className="text-red-700 font-medium">{reason}</p>
            </div>
          </div>

          {/* Message */}
          <p className="text-sm text-gray-600 text-center">
            Por favor, selecciona una fecha diferente dentro del horario de la clínica.
          </p>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
