'use client';

import { useState, useEffect } from 'react';
import { MdClose, MdCheckCircle } from 'react-icons/md';
import { Appointment, ClinicUser } from '@/types';
import { appointmentsApi } from '@/lib/appointments-api';
import { clinicUsersApi } from '@/api/clinic-users-api';
import { AppointmentInfoSection } from './AppointmentInfoSection';
import toast from 'react-hot-toast';

interface CompleteAppointmentModalProps {
  isOpen: boolean;
  appointment: Appointment | null;
  onClose: () => void;
  onSuccess: (completedAppointment: Appointment) => void;
}

/**
 * Modal to complete an appointment
 * 
 * Features:
 * - For CLINIC: Requires performed_by_user_id (mandatory stylist capture)
 * - For HOME: Optional performed_by_user_id (if not already assigned)
 * - Shows appropriate UX based on location_type
 */
export function CompleteAppointmentModal({
  isOpen,
  appointment,
  onClose,
  onSuccess,
}: CompleteAppointmentModalProps) {
  const [performedByUserId, setPerformedByUserId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stylists, setStylists] = useState<ClinicUser[]>([]);
  const [loadingStylists, setLoadingStylists] = useState(false);

  // Cargar estilistas cuando se abre el modal y pre-llenar con el asignado
  useEffect(() => {
    if (isOpen && appointment) {
      loadStylists();
      // Pre-fill with assigned stylist if exists
      if (appointment.assigned_staff_user_id) {
        setPerformedByUserId(appointment.assigned_staff_user_id);
      }
    }
  }, [isOpen, appointment]);

  const loadStylists = async () => {
    try {
      setLoadingStylists(true);
      const users = await clinicUsersApi.listUsers({ status: 'ACTIVE' });
      setStylists(users);
    } catch (err) {
      console.error('Error loading stylists:', err);
      setStylists([]);
    } finally {
      setLoadingStylists(false);
    }
  };

  if (!isOpen || !appointment) return null;

  const isClinic = appointment.location_type === 'CLINIC';
  const isHome = appointment.location_type === 'HOME';
  const alreadyAssigned = !!appointment.assigned_staff_user_id;

  const handleComplete = async () => {
    try {
      setError(null);

      // CLINIC appointments require performed_by_user_id
      if (isClinic && !performedByUserId) {
        setError('El estilista/personal es requerido para citas en clínica');
        return;
      }

      setIsLoading(true);

      const completed = await appointmentsApi.completeAppointment(
        appointment.id,
        performedByUserId || undefined
      );

      toast.success('Cita completada exitosamente');
      onSuccess(completed);
      handleClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al completar cita';
      setError(message);
      toast.error(message);
      console.error('Error completing appointment:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setPerformedByUserId('');
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
                <MdCheckCircle className="w-6 h-6 text-white" />
                <h2 className="text-2xl font-bold text-white">Completar cita</h2>
              </div>
              <p className="text-primary-100 text-sm">
                Confirma la finalización de esta cita
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
            <AppointmentInfoSection appointment={appointment} />

            {/* Assignment Info */}
            {isHome && alreadyAssigned && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <p className="text-sm text-emerald-800 font-medium">
                  ✓ Estilista asignado y pre-seleccionado
                </p>
                <p className="text-xs text-emerald-700 mt-1">
                  Puedes cambiar a otro estilista si es necesario.
                </p>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Performance Assignment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isClinic
                  ? 'Estilista que realizó la cita *'
                  : alreadyAssigned 
                    ? 'Estilista responsable (pre-llenado) - Cambia si es necesario'
                    : 'Estilista que realizó la cita (opcional)'}
              </label>
              <select
                value={performedByUserId}
                onChange={(e) => setPerformedByUserId(e.target.value)}
                disabled={isLoading || loadingStylists}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors bg-white"
              >
                <option value="">
                  {loadingStylists ? 'Cargando estilistas...' : 'Selecciona un estilista'}
                </option>
                {stylists.map((stylist) => (
                  <option key={stylist.id} value={stylist.id}>
                    {stylist.name} ({stylist.email})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {isClinic
                  ? 'Campo obligatorio para citas en clínica'
                  : alreadyAssigned
                    ? 'El estilista asignado está pre-seleccionado. Puedes cambiarlo si otro realizó el servicio.'
                    : 'Campo opcional - actualiza al estilista responsable'}
              </p>
            </div>

            {/* Additional Notes */}
            {isClinic && (
              <div className="p-3 bg-primary-50 border border-primary-200 rounded-lg text-sm text-primary-800">
                <strong>Cita en clínica:</strong> Se requiere especificar quién realizó
                el servicio para registro de asignación.
              </div>
            )}

            {isHome && !alreadyAssigned && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                <strong>Cita a domicilio sin asignar:</strong> Puedes especificar el
                estilista responsable ahora.
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleComplete}
              disabled={isLoading || (isClinic && !performedByUserId)}
              className="px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 font-medium transition-colors"
            >
              {isLoading ? 'Completando...' : 'Completar cita'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
