'use client';

import { useState } from 'react';
import { MdWarning, MdClose } from 'react-icons/md';
import { suspendClinic } from '@/lib/platformApi';

interface SuspendClinicModalProps {
  isOpen: boolean;
  clinicName?: string;
  onClose: () => void;
  onSuccess?: () => void;
  clinicId: string | null;
}

export function SuspendClinicModal({
  isOpen,
  clinicName = 'Clínica',
  onClose,
  onSuccess,
  clinicId,
}: SuspendClinicModalProps) {
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicId) return;

    setIsLoading(true);
    try {
      await suspendClinic(clinicId, { reason });
      setReason('');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error suspending clinic:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
          <div className="flex items-center gap-2">
            <MdWarning className="w-6 h-6 text-white" />
            <h2 className="text-lg font-bold text-white">Suspender Clínica</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition"
            disabled={isLoading}
          >
            <MdClose className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
            Se suspenderá el acceso para <strong>{clinicName}</strong>. Los usuarios no podrán acceder hasta que se reactive.
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Motivo de Suspensión *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej: Falta de pago, violación de términos, etc."
              required
              minLength={10}
              maxLength={500}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              {reason.length}/500
            </p>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || reason.trim().length < 10}
              className="px-4 py-2 bg-amber-600 text-white hover:bg-amber-700 rounded-lg transition disabled:opacity-50"
            >
              {isLoading ? 'Suspendiendo...' : 'Suspender'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

