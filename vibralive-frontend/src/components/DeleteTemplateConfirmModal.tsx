'use client';

import React, { useState } from 'react';
import { MdClose, MdWarning, MdDelete } from 'react-icons/md';
import { campaignTemplatesApi, type CampaignTemplate } from '@/lib/campaigns-api';
import toast from 'react-hot-toast';

interface DeleteTemplateConfirmModalProps {
  isOpen: boolean;
  template?: CampaignTemplate | null;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * DeleteTemplateConfirmModal
 * Modal de confirmación para eliminar PERMANENTEMENTE una plantilla
 * Requiere confirmación de texto para evitar eliminaciones accidentales
 */
export function DeleteTemplateConfirmModal({
  isOpen,
  template,
  onClose,
  onSuccess,
}: DeleteTemplateConfirmModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handleDelete = async () => {
    if (!template) return;
    if (confirmText !== 'ELIMINAR') {
      toast.error('Debes escribir ELIMINAR para confirmar');
      return;
    }

    setIsLoading(true);
    try {
      await campaignTemplatesApi.deleteTemplate(template.id);
      toast.success(`Plantilla "${template.name}" eliminada permanentemente`);
      setConfirmText('');
      onSuccess?.();
      onClose();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error al eliminar la plantilla';
      toast.error(message);
      console.error('Error deleting template:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setConfirmText('');
    onClose();
  };

  if (!isOpen || !template) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex justify-between items-center px-6 py-4 border-b border-red-600 bg-gradient-to-r from-red-600 to-red-700">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-lg">
                <MdWarning size={24} className="text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Eliminar Permanentemente</h2>
                <p className="text-red-100 text-sm mt-0.5">Esta acción es IRREVERSIBLE</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="p-1 text-white hover:bg-white hover:bg-opacity-20 rounded transition disabled:opacity-50"
            >
              <MdClose size={24} />
            </button>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-900">
                <strong>⚠️ PELIGRO:</strong> Esta acción es IRREVERSIBLE. La plantilla será eliminada permanentemente.
              </p>
            </div>

            <div>
              <p className="text-gray-700 mb-3">
                Estás a punto de eliminar permanentemente:
              </p>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <p className="font-semibold text-gray-900">{template.name}</p>
                <p className="text-sm text-gray-600 mt-1">Canal: {template.channel === 'WHATSAPP' ? '📱 WhatsApp' : '📧 Email'}</p>
                {template.description && (
                  <p className="text-sm text-gray-600 mt-1">{template.description.substring(0, 50)}...</p>
                )}
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-900">
              <p className="font-bold mb-2">Se eliminará:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Contenido de la plantilla</li>
                <li>Configuración de variables</li>
                <li>Historial de uso</li>
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

          {/* Actions - Sticky Footer */}
          <div className="sticky bottom-0 flex gap-3 justify-end px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="px-6 py-2.5 text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              disabled={isLoading || confirmText !== 'ELIMINAR'}
              className="px-6 py-2.5 text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 hover:shadow-lg rounded-lg font-medium transition disabled:opacity-50 flex items-center gap-2"
            >
              <MdDelete className="w-5 h-5" />
              {isLoading ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
