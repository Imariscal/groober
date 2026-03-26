'use client';

import React from 'react';
import { MdWarning, MdCheckCircle, MdClose } from 'react-icons/md';

interface Pet {
  petId: string;
  petName: string;
  reason?: string;
}

interface PartialBatchConflictModalProps {
  isOpen: boolean;
  validPets: Pet[];
  excludedPets: Pet[];
  locationType: 'CLINIC' | 'HOME';
  onConfirm: () => void;
  onCancel: () => void;
}

export const PartialBatchConflictModal: React.FC<PartialBatchConflictModalProps> = ({
  isOpen,
  validPets,
  excludedPets,
  locationType,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <MdWarning className="w-6 h-6 text-amber-600" />
          <h2 className="text-lg font-semibold text-gray-800">
            Citas parciales en lote
          </h2>
        </div>

        <div className="space-y-4">
          {validPets.length > 0 && (
            <div>
              <h3 className="font-medium text-green-700 mb-2">✓ Se crearán citas para:</h3>
              <ul className="space-y-1">
                {validPets.map((pet) => (
                  <li key={pet.petId} className="text-green-600 flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    {pet.petName}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {excludedPets.length > 0 && (
            <div>
              <h3 className="font-medium text-amber-700 mb-2">⚠ Se excluirán estas mascotas:</h3>
              <ul className="space-y-2">
                {excludedPets.map((pet) => (
                  <li key={pet.petId} className="text-amber-700 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-amber-500">✗</span>
                      <span className="font-medium">{pet.petName}</span>
                    </div>
                    {pet.reason && (
                      <p className="text-sm text-amber-600 ml-6">{pet.reason}</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded p-3">
            <p className="text-sm text-amber-800">
              Se crearán citas solo para {validPets.length} mascota{validPets.length === 1 ? '' : 's'} 
              {excludedPets.length > 0 && ` (se excluyeron ${excludedPets.length})`}.
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
};
