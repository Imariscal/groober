'use client';

import React, { useState } from 'react';
import { MdClose, MdWarningAmber, MdDangerous } from 'react-icons/md';
import { MedicationAllergy } from '@/types/ehr';
import toast from 'react-hot-toast';

interface DeleteAllergyConfirmationProps {
  isOpen: boolean;
  allergy: MedicationAllergy | null;
  onClose: () => void;
  onConfirm: (allergyId: string) => Promise<void>;
  loading?: boolean;
}

export function DeleteAllergyConfirmation({
  isOpen,
  allergy,
  onClose,
  onConfirm,
  loading: externalLoading = false,
}: DeleteAllergyConfirmationProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirmDelete = async () => {
    if (!allergy) return;

    try {
      setLoading(true);
      await onConfirm(allergy.id);
      onClose();
      toast.success('Alergia eliminada exitosamente');
    } catch (error: any) {
      console.error('Error deleting allergy:', error);
      toast.error(error.message || 'Error al eliminar alergia');
    } finally {
      setLoading(false);
    }
  };

  const isLoading = loading || externalLoading;

  if (!isOpen || !allergy) return null;

  const severityLabels: Record<string, string> = {
    MILD: '🟡 Leve',
    MODERATE: '🟠 Moderada',
    SEVERE: '🔴 Severa',
  };

  const severityLabel = severityLabels[allergy.severity] || allergy.severity;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full transform transition-all duration-300">
          {/* Header */}
          <div className="sticky top-0 z-20 bg-gradient-to-r from-red-600 via-red-600 to-red-700 px-6 py-4 flex items-center justify-between border-b border-red-600 shadow-sm rounded-t-xl">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <MdWarningAmber className="w-6 h-6 text-white" />
                <h2 className="text-2xl font-bold text-white">Eliminar Alergia</h2>
              </div>
              <p className="text-red-100 text-sm">
                Esta acción no se puede deshacer
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition duration-200 disabled:opacity-50"
            >
              <MdClose className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="flex gap-4 mb-4">
              <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-lg bg-red-100">
                <MdDangerous className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900 truncate">
                  {allergy.medicationName}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Gravedad: {severityLabel}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Reacción: {allergy.reaction}
                </p>
                {allergy.notes && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    Notas: {allergy.notes}
                  </p>
                )}
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-800">
                ¿Estás seguro de que deseas eliminar esta alergia? Esta acción no se puede deshacer.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-end gap-3 rounded-b-xl">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmDelete}
              disabled={isLoading}
              className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              {isLoading ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
