'use client';

import React, { useState } from 'react';
import { MdClose, MdWarning } from 'react-icons/md';
import { Pet, Client } from '@/types';
import { petsApi } from '@/lib/pets-api';
import { clientsApi } from '@/lib/clients-api';
import toast from 'react-hot-toast';

interface DeletePetConfirmationProps {
  isOpen: boolean;
  pet: Pet | null;
  clientId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function DeletePetConfirmation({
  isOpen,
  pet,
  clientId,
  onClose,
  onSuccess,
}: DeletePetConfirmationProps) {
  const [loading, setLoading] = useState(false);
  const [client, setClient] = useState<Client | null>(null);

  const handleDelete = async () => {
    if (!pet?.id) return;

    try {
      setLoading(true);
      await petsApi.deletePet(clientId, pet.id);
      toast.success('Mascota eliminada exitosamente');
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Error deleting pet:', error);
      toast.error(error.message || 'Error al eliminar mascota');
    } finally {
      setLoading(false);
    }
  };

  // Fetch client info when modal opens
  React.useEffect(() => {
    if (isOpen && clientId) {
      fetchClient();
    }
  }, [isOpen, clientId]);

  const fetchClient = async () => {
    try {
      const response = await clientsApi.getClientById(clientId);
      setClient(response);
    } catch (error) {
      console.error('Error fetching client:', error);
    }
  };

  if (!isOpen || !pet) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-lg">
              <MdWarning size={24} className="text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Eliminar Mascota</h2>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 hover:bg-gray-100 rounded transition disabled:opacity-50"
          >
            <MdClose size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-gray-900 font-semibold">
              ¿Estás seguro de que deseas eliminar a{' '}
              <span className="text-red-600">{pet.name}</span>?
            </p>
          </div>

          {/* Pet Details */}
          <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between">
              <span className="text-gray-600 font-medium">Especie:</span>
              <span className="font-semibold text-gray-900">{pet.species}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 font-medium">Raza:</span>
              <span className="font-semibold text-gray-900">{pet.breed || 'N/A'}</span>
            </div>
            {client && (
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Propietario:</span>
                <span className="font-semibold text-gray-900">{client.name}</span>
              </div>
            )}
          </div>

          <p className="text-sm text-gray-600">
            Esta acción no se puede deshacer. Se eliminará toda la información de esta mascota.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition font-semibold"
          >
            Cancelar
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition font-semibold"
          >
            {loading ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
}
