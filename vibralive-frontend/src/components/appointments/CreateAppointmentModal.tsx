'use client';

import { useState } from 'react';
import { MdClose } from 'react-icons/md';
import { Appointment, Pet, Client } from '@/types';
import { appointmentsApi } from '@/lib/appointments-api';
import { useClinicTimezone } from '@/hooks/useClinicTimezone';
import { AppointmentFormWithLocation } from '@/components/addresses/AppointmentFormWithLocation';
import {
  buildAppointmentPayload,
  validateAppointmentData,
  AppointmentFormData,
} from '@/lib/appointment-payload-builder';
import toast from 'react-hot-toast';

interface CreateAppointmentModalProps {
  isOpen: boolean;
  clientId: string;
  petId: string;
  onClose: () => void;
  onSuccess: (appointment: Appointment) => void;
}

/**
 * Modal to create a new appointment (CLINIC or HOME with assignments)
 * 
 * Features:
 * - CLINIC vs HOME location selection
 * - Address selection for HOME appointments
 * - Assignment configuration:
 *   - NONE: Manual assignment later
 *   - MANUAL_RECEPTION: Assign stylist now
 */
export function CreateAppointmentModal({
  isOpen,
  clientId,
  petId,
  onClose,
  onSuccess,
}: CreateAppointmentModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clinicTimezone = useClinicTimezone();

  const [formData, setFormData] = useState<AppointmentFormData>({
    pet_id: petId,
    client_id: clientId,
    scheduled_at: new Date().toISOString(),
    location_type: 'CLINIC',
  });

  const handleSubmit = async (payload: any) => {
    try {
      setError(null);
      setIsLoading(true);

      // Validate complete form data
      const validation = validateAppointmentData(formData);
      if (!validation.valid) {
       toast.error(validation.errors.join(', '));
        return;
      }

      // Build proper payload with assignment handling
      const finalPayload = buildAppointmentPayload(formData);
      
      // Add additional fields from the form if present
      if (formData.reason) finalPayload.reason = formData.reason;
      if (formData.duration_minutes) finalPayload.duration_minutes = formData.duration_minutes;
      if (formData.veterinarian_id) finalPayload.veterinarian_id = formData.veterinarian_id;

      // Create appointment
      const appointment = await appointmentsApi.createAppointment(finalPayload);
      
      toast.success('Cita creada exitosamente');
      onSuccess(appointment);
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear cita';
      setError(message);
      toast.error(message);
      console.error('Error creating appointment:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-6 border-b bg-white">
          <h2 className="text-xl font-bold text-gray-900">Crear nueva cita</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isLoading}
          >
            <MdClose size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          <AppointmentFormWithLocation
            clientId={clientId}
            onSubmit={handleSubmit}
            onCancel={onClose}
            loading={isLoading}
          />

          {/* Additional Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha y hora *
              </label>
              <input
                type="datetime-local"
                value={formData.scheduled_at.slice(0, 16)}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    scheduled_at: new Date(e.target.value).toISOString(),
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motivo de la cita
              </label>
              <textarea
                value={formData.reason || ''}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value })
                }
                placeholder="Ej: Baño y corte, revisión veterinaria..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duración estimada (minutos)
              </label>
              <input
                type="number"
                min="15"
                step="15"
                value={formData.duration_minutes || 30}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    duration_minutes: parseInt(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex justify-end gap-3 p-6 border-t bg-white">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={() => handleSubmit(formData)}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Creando...' : 'Crear cita'}
          </button>
        </div>
      </div>
    </div>
  );
}
