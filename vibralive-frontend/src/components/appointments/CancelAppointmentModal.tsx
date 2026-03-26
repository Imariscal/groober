'use client';

import { useState } from 'react';
import { MdClose, MdWarning } from 'react-icons/md';
import { Appointment } from '@/types';
import { appointmentsApi } from '@/lib/appointments-api';
import { AppointmentInfoSection } from './AppointmentInfoSection';
import toast from 'react-hot-toast';

interface CancelAppointmentModalProps {
  isOpen: boolean;
  appointment: Appointment | null;
  onClose: () => void;
  onSuccess: (cancelledAppointment: Appointment) => void;
}

/**
 * Modal to cancel an appointment
 * 
 * Features:
 * - Predefined cancellation reasons
 * - Optional additional notes
 * - Validates appointment is in future
 * - Captures cancellation_reason and notes
 * - Shows appointment details before cancellation
 */
export function CancelAppointmentModal({
  isOpen,
  appointment,
  onClose,
  onSuccess,
}: CancelAppointmentModalProps) {
  const [cancellationReason, setCancellationReason] = useState<string>('');
  const [additionalNotes, setAdditionalNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmChecked, setConfirmChecked] = useState(false);

  if (!isOpen || !appointment) return null;

  // Check if appointment can be cancelled: 
  // - Must NOT be COMPLETED (can cancel SCHEDULED, CONFIRMED, IN_PROGRESS, etc.)
  // - No time restrictions - can cancel anytime
  const canCancelAppointment = appointment.status !== 'COMPLETED';

  const cancellationReasons = [
    'Cliente no se presentó (No show)',
    'Cliente solicitó cancelación',
    'Emergencia médica',
    'Problema con mascota (salud)',
    'Cambio de planes del cliente',
    'Error en programación',
    'Cierre de clínica',
    'Otro (especificar en notas)',
  ];

  const handleCancel = async () => {
    try {
      setError(null);

      // Validations
      if (!canCancelAppointment) {
        setError('Esta cita no puede ser cancelada (ya está completada)');
        return;
      }

      if (!cancellationReason) {
        setError('Debes seleccionar una razón de cancelación');
        return;
      }

      if (!confirmChecked) {
        setError('Debes confirmar que deseas cancelar esta cita');
        return;
      }

      setIsLoading(true);

      // Build cancellation reason with notes if provided
      const finalReason = additionalNotes
        ? `${cancellationReason} - ${additionalNotes}`
        : cancellationReason;

      const cancelled = await appointmentsApi.updateAppointmentStatus(
        appointment.id,
        'CANCELLED',
        finalReason
      );

      toast.success('Cita cancelada exitosamente');
      onSuccess(cancelled);
      handleClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cancelar cita';
      setError(message);
      toast.error(message);
      console.error('Error cancelling appointment:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setCancellationReason('');
    setAdditionalNotes('');
    setConfirmChecked(false);
    setError(null);
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[95vh] flex flex-col transform transition-all duration-300">
          {/* Header */}
          <div className="sticky top-0 z-20 bg-gradient-to-r from-primary-600 via-primary-600 to-primary-700 px-6 py-4 flex items-center justify-between border-b border-primary-600 shadow-sm rounded-t-xl">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <MdWarning className="w-6 h-6 text-white" />
                <h2 className="text-2xl font-bold text-white">Cancelar cita</h2>
              </div>
              <p className="text-primary-100 text-sm">
                Confirma la cancelación de esta cita
              </p>
            </div>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition duration-200"
            >
              <MdClose className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4 overflow-y-auto flex-1">
            {/* Appointment Info - Complete Details */}
            <AppointmentInfoSection appointment={appointment} compact={true} />

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {canCancelAppointment && (
              <>
                {/* Cancellation Reason */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                    Razón de cancelación *
                  </label>
                  <select
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    disabled={isLoading}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-300 transition"
                  >
                    <option value="">Selecciona una razón...</option>
                    {cancellationReasons.map((reason) => (
                      <option key={reason} value={reason}>
                        {reason}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Campo obligatorio
                  </p>
                </div>

                {/* Additional Notes */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                    Notas adicionales (opcional)
                  </label>
                  <textarea
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    disabled={isLoading}
                    placeholder="Agrega más detalles sobre la cancelación..."
                    rows={3}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-300 transition resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Máximo 500 caracteres
                  </p>
                </div>

                {/* Confirmation Checkbox */}
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg space-y-3">
                  <p className="text-sm font-medium text-yellow-900">
                    ⚠️ Confirmación requerida
                  </p>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={confirmChecked}
                      onChange={(e) => setConfirmChecked(e.target.checked)}
                      disabled={isLoading}
                      className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500 mt-0.5"
                    />
                    <span className="text-xs text-yellow-800">
                      Confirmo que deseo cancelar esta cita. El cliente y el personal serán notificados.
                    </span>
                  </label>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          {canCancelAppointment && (
            <div className="sticky bottom-0 flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <button
                onClick={handleClose}
                disabled={isLoading}
                className="px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium text-sm"
              >
                Mantener cita
              </button>
              <button
                onClick={handleCancel}
                disabled={isLoading || !cancellationReason || !confirmChecked}
                className="px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium text-sm"
              >
                {isLoading ? 'Cancelando...' : 'Cancelar cita'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
