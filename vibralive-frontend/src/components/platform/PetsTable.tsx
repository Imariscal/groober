'use client';

import React, { useState } from 'react';
import { MdEdit, MdDelete, MdWc, MdCalendarToday, MdVaccines, MdPets } from 'react-icons/md';
import { Pet, Client } from '@/types';
import { ClientDetailModal } from '@/components/ClientDetailModal';
import { useClientsStore } from '@/store/useClientsStore';
import { parseISO } from 'date-fns';

interface PetWithClient extends Pet {
  clientName?: string;
  clientId?: string;
}

interface PetsTableProps {
  pets: PetWithClient[];
  onEdit?: (pet: PetWithClient) => void;
  onDelete?: (pet: PetWithClient) => void;
}

// Helper functions
const getSpeciesEmoji = (species: string): string => {
  const emojis: Record<string, string> = {
    DOG: '🐕',
    CAT: '🐈',
    BIRD: '🦜',
    RABBIT: '🐰',
    HAMSTER: '🐹',
    GUINEA_PIG: '🐹',
    FISH: '🐠',
    TURTLE: '🐢',
    FERRET: '🦡',
    OTHER: '🐾',
  };
  return emojis[species] || '🐾';
};

const getSpeciesLabel = (species: string): string => {
  const labels: Record<string, string> = {
    DOG: 'Perro',
    CAT: 'Gato',
    BIRD: 'Ave',
    RABBIT: 'Conejo',
    HAMSTER: 'Hámster',
    GUINEA_PIG: 'Cobaya',
    FISH: 'Pez',
    TURTLE: 'Tortuga',
    FERRET: 'Hurón',
    OTHER: 'Otro',
  };
  return labels[species] || 'Mascota';
};

const getSexLabel = (sex: string): string => {
  const labels: Record<string, string> = {
    MALE: 'Macho',
    FEMALE: 'Hembra',
    UNKNOWN: 'Desconocido',
  };
  return labels[sex] || 'Desconocido';
};

const getSexEmoji = (sex: string): string => {
  const emojis: Record<string, string> = {
    MALE: '♂️',
    FEMALE: '♀️',
    UNKNOWN: '❓',
  };
  return emojis[sex] || '❓';
};

const calculateAge = (dateOfBirth?: string): string => {
  if (!dateOfBirth) return 'N/A';

  try {
    // Parse the birth date - it comes as YYYY-MM-DD or ISO string
    const birthDate = parseISO(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < 0) return 'N/A';
    if (age === 0) {
      const months = today.getMonth() - birthDate.getMonth();
      return months < 0 ? 'Recién nacido' : months === 0 ? '< 1 mes' : `${months}m`;
    }

    return `${age}a`;
  } catch {
    return 'N/A';
  }
};

/**
 * PetsTable
 * Enhanced table with comprehensive pet information
 * UI/UX optimized for scannability and actionability
 */
export function PetsTable({
  pets,
  onEdit,
  onDelete,
}: PetsTableProps) {
  const [showClientModal, setShowClientModal] = React.useState(false);
  const [selectedClient, setSelectedClient] = React.useState<Client | null>(null);
  const [loadingClient, setLoadingClient] = React.useState(false);
  const { fetchClientById } = useClientsStore();

  const handleClientClick = async (clientId?: string) => {
    if (!clientId) return;
    setLoadingClient(true);
    try {
      const client = await fetchClientById(clientId);
      if (client) {
        setSelectedClient(client);
        setShowClientModal(true);
      }
    } catch (error) {
      console.error('Error loading client:', error);
    } finally {
      setLoadingClient(false);
    }
  };
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-gray-50/80 border-b border-gray-200">
          <tr>
            <th className="px-4 py-2.5 text-left font-medium text-gray-600 text-xs uppercase tracking-wide">
              Mascota
            </th>
            <th className="px-4 py-2.5 text-left font-medium text-gray-600 text-xs uppercase tracking-wide">
              Dueño
            </th>
            <th className="px-4 py-2.5 text-left font-medium text-gray-600 text-xs uppercase tracking-wide">
              Información
            </th>
            <th className="px-4 py-2.5 text-left font-medium text-gray-600 text-xs uppercase tracking-wide">
              Detalle
            </th>
            <th className="px-4 py-2.5 text-left font-medium text-gray-600 text-xs uppercase tracking-wide">
              Color
            </th>
            <th className="px-4 py-2.5 text-center font-medium text-gray-600 text-xs uppercase tracking-wide w-20">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {pets.map((pet) => (
            <tr
              key={pet.id}
              className={`transition group ${
                pet.is_deceased
                  ? 'bg-gray-50 hover:bg-gray-100 border-l-4 border-l-gray-400'
                  : 'hover:bg-blue-50/30 border-l-4 border-l-transparent'
              }`}
            >
              {/* MASCOTA - Name, Species, ID, Status */}
              <td className="px-4 py-2.5">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getSpeciesEmoji(pet.species)}</span>
                    <span className="font-semibold text-gray-900">{pet.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400 font-mono">
                      {pet.id.slice(0, 8)}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                      pet.is_deceased
                        ? 'bg-gray-200 text-gray-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {pet.is_deceased ? 'Fallecida' : 'Activa'}
                    </span>
                  </div>
                </div>
              </td>

              {/* DUEÑO - Client Name */}
              <td className="px-4 py-2.5">
                <button
                  onClick={() => handleClientClick(pet.clientId)}
                  disabled={loadingClient || !pet.clientId}
                  className="flex flex-col gap-1 hover:opacity-70 transition disabled:opacity-50 disabled:cursor-not-allowed text-left"
                >
                  <span className="text-sm text-blue-600 hover:text-blue-700 font-medium underline decoration-dotted">
                    {pet.clientName || '-'}
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono">
                    {pet.clientId?.slice(0, 8) || '-'}
                  </span>
                </button>
              </td>

              {/* INFORMACIÓN - Species, Breed, Sex */}
              <td className="px-4 py-2.5">
                <div className="flex flex-col gap-1.5">
                  {/* Species */}
                  <div className="inline-flex items-center gap-1.5 w-fit">
                    <MdPets className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span className="text-xs text-gray-700 font-medium">
                      {getSpeciesLabel(pet.species)}
                    </span>
                  </div>

                  {/* Breed */}
                  {pet.breed && (
                    <span className="text-xs text-gray-600">
                      {pet.breed}
                    </span>
                  )}

                  {/* Sex */}
                  <div className="inline-flex items-center gap-1.5 w-fit">
                    <MdWc className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span className="text-xs text-gray-700">
                      {getSexEmoji(pet.sex)} {getSexLabel(pet.sex)}
                    </span>
                  </div>
                </div>
              </td>

              {/* DETALLE - Age + Sterilization */}
              <td className="px-4 py-2.5">
                <div className="flex flex-col gap-1.5">
                  {/* Age */}
                  <div className="inline-flex items-center gap-1.5 w-fit">
                    <MdCalendarToday className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span className="text-xs text-gray-700 font-medium">
                      {calculateAge(pet.date_of_birth)}
                    </span>
                  </div>

                  {/* Sterilization */}
                  <div className="inline-flex items-center gap-1.5 w-fit">
                    <MdVaccines className="w-3.5 h-3.5 flex-shrink-0" style={{
                      color: pet.is_sterilized ? '#10b981' : '#9ca3af'
                    }} />
                    <span className={`text-xs font-medium ${
                      pet.is_sterilized
                        ? 'text-green-700'
                        : 'text-gray-600'
                    }`}>
                      {pet.is_sterilized ? '✓ Sí' : '-'}
                    </span>
                  </div>
                </div>
              </td>

              {/* COLOR */}
              <td className="px-4 py-2.5">
                {pet.color ? (
                  <div className="flex items-center gap-2">
                    {/* Color preview dot */}
                    <div
                      className="w-4 h-4 rounded-full border border-gray-300"
                      style={{
                        backgroundColor: pet.color.toLowerCase() === 'negro' ? '#1f2937' :
                                       pet.color.toLowerCase() === 'blanco' ? '#f3f4f6' :
                                       pet.color.toLowerCase() === 'marrón' ? '#92400e' :
                                       pet.color.toLowerCase() === 'gris' ? '#9ca3af' :
                                       pet.color.toLowerCase().includes('ajedrez') ? '#d1d5db' :
                                       '#e5e7eb'
                      }}
                    />
                    <span className="text-xs text-gray-700">{pet.color}</span>
                  </div>
                ) : (
                  <span className="text-xs text-gray-400">-</span>
                )}
              </td>

              {/* ACCIONES */}
              <td className="px-4 py-2.5">
                <div className="flex items-center justify-center gap-1">
                  <button
                    onClick={() => onEdit?.(pet)}
                    className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition opacity-60 group-hover:opacity-100"
                    title="Editar"
                  >
                    <MdEdit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete?.(pet)}
                    className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition opacity-60 group-hover:opacity-100"
                    title="Eliminar"
                  >
                    <MdDelete className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Client Detail Modal */}
      <ClientDetailModal
        isOpen={showClientModal}
        client={selectedClient}
        onClose={() => {
          setShowClientModal(false);
          setSelectedClient(null);
        }}
      />
    </div>
  );
}
