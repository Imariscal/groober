'use client';

import { MdWarning, MdCancel, MdCheckCircle } from 'react-icons/md';

interface DuplicateAppointmentWarningModalProps {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DuplicateAppointmentWarningModal({
  isOpen,
  message,
  onConfirm,
  onCancel,
}: DuplicateAppointmentWarningModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-amber-50 border-b-2 border-amber-300 px-6 py-4 flex items-center gap-3">
          <MdWarning className="text-amber-600 text-2xl flex-shrink-0" />
          <h2 className="text-lg font-bold text-amber-900">Conflicto de Cita</h2>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-gray-700 leading-relaxed">
            {message}
          </p>
          
          <div className="bg-amber-50 border-l-4 border-amber-400 px-4 py-3 rounded">
            <p className="text-sm text-amber-800">
              <strong>Nota:</strong> Asegúrate de que el groomer pueda manejar múltiples citas en la misma ubicación.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-end border-t">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 font-medium hover:bg-gray-300 transition-colors flex items-center gap-2"
          >
            <MdCancel className="text-lg" />
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-amber-600 text-white font-medium hover:bg-amber-700 transition-colors flex items-center gap-2"
          >
            <MdCheckCircle className="text-lg" />
            Confirmar Cita
          </button>
        </div>
      </div>
    </div>
  );
}
