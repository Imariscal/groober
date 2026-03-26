'use client';

import React, { useState } from 'react';
import { MdClose, MdWarning, MdDelete } from 'react-icons/md';
import { MedicalVisit } from '@/types/ehr';
import { useEhrStore } from '@/store/ehr-store';
import { formatInClinicTz } from '@/lib/datetime-tz';
import { parseISO } from 'date-fns';
import toast from 'react-hot-toast';

interface DeleteMedicalVisitConfirmationProps {
  isOpen: boolean;
  visit?: MedicalVisit | null;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * DeleteMedicalVisitConfirmation
 * Modal de confirmación para eliminar registros médicos
 * Proporciona feedback visual sobre las consecuencias de la acción
 * 
 * Patrón: Basado en DeleteClientConfirmModal para consistencia
 * Sigue HOMOLOGACION_VISTAS_STANDAR.md:
 * - Modal header con gradiente warning (red/orange)
 * - Información clara sobre las consecuencias
 * - Detalles del registro a eliminar
 * - Buttons: Cancel (white), Delete (red/orange gradient)
 */
export function DeleteMedicalVisitConfirmation({
  isOpen,
  visit,
  onClose,
  onSuccess,
}: DeleteMedicalVisitConfirmationProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { deleteMedicalVisit } = useEhrStore();

  const handleDelete = async () => {
    if (!visit) return;

    setIsLoading(true);
    try {
      await deleteMedicalVisit(visit.id);
      toast.success(`Registro médico eliminado exitosamente`);
      onSuccess?.();
      onClose();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error al eliminar el registro médico';
      toast.error(message);
      console.error('Error deleting medical visit:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !visit) return null;

  // Format date for display
  const visitDate = formatInClinicTz(parseISO(visit.visit_date), 'dd/MM/yyyy HH:mm');

  // Get visit type label
  const visitTypeLabels: Record<string, string> = {
    CHECKUP: '🏥 Revisión General',
    VACCINATION: '💉 Vacunación',
    DIAGNOSIS: '🔍 Diagnóstico',
    FOLLOW_UP: '📋 Seguimiento',
    OTHER: '❓ Otro',
  };
  const visitTypeDisplay = visitTypeLabels[visit.visit_type] || visit.visit_type;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full flex flex-col max-h-[90vh]">
          {/* Header - Red/Orange gradient per HOMOLOGACION_VISTAS_STANDAR */}
          <div className="flex justify-between items-center px-6 py-4 border-b border-red-600 bg-gradient-to-r from-red-600 to-orange-600">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-lg">
                <MdDelete size={24} className="text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Eliminar Registro Médico</h2>
                <p className="text-red-100 text-sm mt-0.5">Esta acción no se puede deshacer</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="p-1 text-white hover:bg-white hover:bg-opacity-20 rounded transition disabled:opacity-50"
            >
              <MdClose size={24} />
            </button>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Warning message */}
            <div className="bg-red-50 border border-red-300 rounded-lg p-4 flex gap-3 items-start">
              <MdWarning size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-800 font-semibold">⚠️ Advertencia</p>
                <p className="text-sm text-red-700 mt-1">
                  El registro médico será eliminado permanentemente. Esta acción no puede ser revertida.
                </p>
              </div>
            </div>

            {/* Confirmation text */}
            <div>
              <p className="text-gray-700 mb-3 font-medium">
                ¿Estás seguro de que deseas eliminar este registro médico?
              </p>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
                {/* Visit Type */}
                <div className="flex items-start gap-3">
                  <span className="text-lg">{visitTypeDisplay.split(' ')[0]}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">
                      {visitTypeDisplay.replace(/^[^ ]+ /, '')}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">Tipo de Visita</p>
                  </div>
                </div>

                {/* Chief Complaint */}
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-600 font-medium mb-1">Motivo</p>
                  <p className="text-sm text-gray-900">{visit.chief_complaint}</p>
                </div>

                {/* Visit Date */}
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-600 font-medium mb-1">Fecha</p>
                  <p className="text-sm text-gray-900">{visitDate}</p>
                </div>

                {/* Status */}
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-600 font-medium mb-1">Estado</p>
                  <div className="inline-block px-2 py-1 rounded text-xs font-semibold bg-gray-200 text-gray-800">
                    {visit.status}
                  </div>
                </div>
              </div>
            </div>

            {/* Consequences */}
            <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 text-sm text-amber-900">
              <p className="font-semibold mb-2">📋 Consecuencias de eliminar:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>El registro se eliminará permanentemente</li>
                <li>Se perderán todos los datos de la visita</li>
                <li>Las prescripciones y diagnósticos asociados también serán eliminados</li>
                <li>No podrá recuperarse esta información</li>
              </ul>
            </div>
          </div>

          {/* Buttons - Sticky Footer per HOMOLOGACION_VISTAS_STANDAR */}
          <div className="sticky bottom-0 flex gap-3 justify-end px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-6 py-2.5 text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              disabled={isLoading}
              className="px-6 py-2.5 text-white bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 hover:shadow-lg rounded-lg font-medium transition disabled:opacity-50"
            >
              {isLoading ? 'Eliminando...' : 'Eliminar Registro'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
