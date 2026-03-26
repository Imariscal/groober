'use client';

import React, { useState } from 'react';
import { MdClose, MdWarningAmber, MdVaccines } from 'react-icons/md';
import { deleteVaccine } from '@/api/ehr-api';
import toast from 'react-hot-toast';

interface Vaccine {
  id: string;
  name: string;
  diseasesCovered?: string[];
}

interface DeleteVaccineConfirmationProps {
  isOpen: boolean;
  vaccine: Vaccine | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function DeleteVaccineConfirmation({
  isOpen,
  vaccine,
  onClose,
  onSuccess,
}: DeleteVaccineConfirmationProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirmDelete = async () => {
    if (!vaccine) return;

    try {
      setLoading(true);
      await deleteVaccine(vaccine.id);
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Error deleting vaccine:', error);
      toast.error(error.message || 'Error al eliminar vacuna');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !vaccine) return null;

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
                <h2 className="text-2xl font-bold text-white">Eliminar Vacuna</h2>
              </div>
              <p className="text-red-100 text-sm">
                Esta acción no se puede deshacer
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition duration-200"
            >
              <MdClose className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="flex gap-4 mb-4">
              <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-lg bg-red-100">
                <MdVaccines className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900 truncate">
                  {vaccine.name}
                </h3>
                {vaccine.diseasesCovered && vaccine.diseasesCovered.length > 0 && (
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {vaccine.diseasesCovered.join(', ')}
                  </p>
                )}
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-800">
                ¿Estás seguro de que deseas eliminar esta vacuna del catálogo? Los registros de
                vacunación existentes no serán afectados, pero no podrá ser utilizada para nuevos
                registros.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-end gap-3 rounded-b-xl">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmDelete}
              disabled={loading}
              className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
