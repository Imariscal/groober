'use client';

import React, { useState } from 'react';
import { MdClose, MdBlock } from 'react-icons/md';
import { ServicePackage } from '@/types';
import { packagesApi } from '@/api/packages-api';
import toast from 'react-hot-toast';

interface DeletePackageConfirmModalProps {
  isOpen: boolean;
  pkg?: ServicePackage | null;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * DeletePackageConfirmModal
 * Modal de confirmación para desactivar paquetes (soft delete)
 * Proporciona feedback visual sobre las consecuencias de la acción
 */
export function DeletePackageConfirmModal({
  isOpen,
  pkg,
  onClose,
  onSuccess,
}: DeletePackageConfirmModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    if (!pkg) return;

    setIsLoading(true);
    try {
      await packagesApi.deactivatePackage(pkg.id);
      toast.success(`Paquete "${pkg.name}" desactivado exitosamente`);
      onSuccess?.();
      onClose();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error al desactivar el paquete';
      toast.error(message);
      console.error('Error deactivating package:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !pkg) return null;

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
          {/* Header */}
          <div className="flex justify-between items-center px-6 py-4 border-b border-orange-600 bg-gradient-to-r from-orange-600 to-orange-700">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-lg">
                <MdBlock size={24} className="text-orange-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Desactivar Paquete</h2>
                <p className="text-orange-100 text-sm mt-0.5">Los datos se conservarán</p>
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
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
              <p className="text-sm text-primary-900">
                <strong>ℹ️ Información:</strong> El paquete será desactivado pero sus datos se conservarán.
              </p>
            </div>

            <div>
              <p className="text-gray-700 mb-3">
                Estás a punto de desactivar:
              </p>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <p className="font-semibold text-gray-900">{pkg.name}</p>
                <p className="text-sm text-gray-600 mt-2">
                  Contenido: {pkg.items.length} {pkg.items.length === 1 ? 'servicio' : 'servicios'}
                </p>
                {pkg.description && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2 truncate">
                    {pkg.description}
                  </p>
                )}
              </div>
            </div>

            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 text-sm text-primary-900">
              <p className="font-bold mb-2">¿Qué sucede?</p>
              <ul className="list-disc list-inside space-y-1">
                <li>El paquete dejaría de aparecer en nuevas citas</li>
                <li>Los datos del paquete se conservarán en el historial</li>
                <li>Podrás reactivarlo en cualquier momento</li>
              </ul>
            </div>
          </div>

          {/* Buttons - Sticky Footer */}
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
              className="px-6 py-2.5 text-white bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 hover:shadow-lg rounded-lg font-medium transition disabled:opacity-50"
            >
              {isLoading ? 'Desactivando...' : 'Desactivar'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}


