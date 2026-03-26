'use client';

import React, { useState } from 'react';
import { MdClose, MdWarning, MdDelete } from 'react-icons/md';
import { ServicePackage } from '@/types';
import { packagesApi } from '@/api/packages-api';
import toast from 'react-hot-toast';

interface HardDeletePackageModalProps {
  isOpen: boolean;
  pkg?: ServicePackage | null;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * HardDeletePackageModal
 * Modal de confirmación para eliminar PERMANENTEMENTE un paquete
 * Solo debe mostrarse a usuarios con permisos elevados (RBAC)
 */
export function HardDeletePackageModal({
  isOpen,
  pkg,
  onClose,
  onSuccess,
}: HardDeletePackageModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handleDelete = async () => {
    if (!pkg) return;
    if (confirmText !== 'ELIMINAR') {
      toast.error('Debes escribir ELIMINAR para confirmar');
      return;
    }

    setIsLoading(true);
    try {
      await packagesApi.deletePackage(pkg.id);
      toast.success(`Paquete "${pkg.name}" eliminado permanentemente`);
      setConfirmText('');
      onSuccess?.();
      onClose();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error al eliminar el paquete';
      toast.error(message);
      console.error('Error deleting package:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setConfirmText('');
    onClose();
  };

  if (!isOpen || !pkg) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-lg">
                <MdWarning size={24} className="text-red-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Eliminar Permanentemente</h2>
            </div>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="p-1 hover:bg-gray-100 rounded transition disabled:opacity-50"
            >
              <MdClose size={24} className="text-gray-600" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-900">
                <strong>⚠️ PELIGRO:</strong> Esta acción es IRREVERSIBLE. Todos los datos del paquete serán eliminados permanentemente.
              </p>
            </div>

            <div>
              <p className="text-gray-700 mb-3">
                Estás a punto de eliminar permanentemente:
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

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-900">
              <p className="font-bold mb-2">Se eliminarán:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Todos los datos del paquete</li>
                <li>Configuración de servicios incluidos</li>
                <li>Historial completo del paquete</li>
                <li>Referencias en citas y reservas históricas</li>
              </ul>
            </div>

            {/* Confirmation Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Escribe <span className="font-bold text-red-600">ELIMINAR</span> para confirmar:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="ELIMINAR"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 p-6 border-t border-gray-200">
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition font-semibold"
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              disabled={isLoading || confirmText !== 'ELIMINAR'}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition font-semibold"
            >
              {isLoading ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

