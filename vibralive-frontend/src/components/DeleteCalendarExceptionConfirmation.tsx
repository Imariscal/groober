'use client';

import React, { useState } from 'react';
import { MdClose, MdWarning } from 'react-icons/md';
import { ClinicCalendarException } from '@/types';
import { useClinicTimezone } from '@/hooks/useClinicTimezone';
import { getClinicDayRangeUtc } from '@/lib/datetime-tz';
import { format } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface DeleteCalendarExceptionConfirmationProps {
  isOpen: boolean;
  exception: ClinicCalendarException | null;
  isLoading?: boolean;
  onClose: () => void;
  onConfirm: (exceptionId: string) => Promise<void>;
}

export function DeleteCalendarExceptionConfirmation({
  isOpen,
  exception,
  isLoading = false,
  onClose,
  onConfirm,
}: DeleteCalendarExceptionConfirmationProps) {
  const [loading, setLoading] = useState(false);
  const clinicTimezone = useClinicTimezone();

  const handleDelete = async () => {
    if (!exception?.id) return;

    try {
      setLoading(true);
      await onConfirm(exception.id);
      toast.success('Día festivo eliminado');
      onClose();
    } catch (error: any) {
      console.error('Error deleting exception:', error);
      toast.error(error.message || 'Error al eliminar día festivo');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !exception) return null;

  // Formatear la fecha con el nombre del día
  const { startUtc } = getClinicDayRangeUtc(exception.date, clinicTimezone);
  const zonedDate = utcToZonedTime(startUtc, clinicTimezone);
  const formattedDate = format(zonedDate, 'EEEE, dd MMMM yyyy', { locale: es });

  const typeLabel = exception.type === 'CLOSED' ? 'Cerrado' : 'Horario especial';
  const isSpecialHours = exception.type === 'SPECIAL_HOURS';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-lg">
              <MdWarning size={24} className="text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Eliminar día festivo</h2>
          </div>
          <button
            onClick={onClose}
            disabled={loading || isLoading}
            className="p-1 hover:bg-gray-100 rounded transition disabled:opacity-50"
          >
            <MdClose size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-gray-900 font-semibold">
              ¿Estás seguro de que deseas eliminar esta excepción?
            </p>
          </div>

          {/* Exception Details */}
          <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between">
              <span className="text-gray-600 font-medium">Fecha:</span>
              <span className="font-semibold text-gray-900 capitalize">{formattedDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 font-medium">Tipo:</span>
              <span className="font-semibold">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    exception.type === 'CLOSED'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {typeLabel}
                </span>
              </span>
            </div>
            {isSpecialHours && exception.startTime && exception.endTime && (
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Horario:</span>
                <span className="font-semibold text-gray-900">
                  {exception.startTime} - {exception.endTime}
                </span>
              </div>
            )}
            {exception.reason && (
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Motivo:</span>
                <span className="font-semibold text-gray-900">{exception.reason}</span>
              </div>
            )}
          </div>

          <p className="text-sm text-gray-600">
            Esta acción no se puede deshacer. Se eliminará esta excepción de calendario.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={loading || isLoading}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition font-semibold"
          >
            Cancelar
          </button>
          <button
            onClick={handleDelete}
            disabled={loading || isLoading}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition font-semibold"
          >
            {loading || isLoading ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
}
