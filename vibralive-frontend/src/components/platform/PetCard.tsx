'use client';

import React, { useState } from 'react';
import {
  MdEdit,
  MdDelete,
  MdMoreVert,
  MdWc,
  MdCategory,
  MdCalendarToday,
  MdPalette,
  MdVaccines,
  MdNotes,
  MdWarningAmber,
  MdCheckCircle,
} from 'react-icons/md';
import { Pet, Client } from '@/types';
import { EntityAction } from '@/components/entity-kit';
import { ClientDetailModal } from '@/components/ClientDetailModal';
import { useClientsStore } from '@/store/useClientsStore';
import { parseISO } from 'date-fns';

interface PetCardProps {
  pet: Pet & { clientName?: string; clientId?: string };
  actions?: EntityAction[];
  size?: 'S' | 'M' | 'L'; // S: 250px, M: 320px, L: 380px
  onActionClick?: (action: EntityAction) => void;
  onEdit?: (pet: Pet) => void;
  onDelete?: (pet: Pet) => void;
}

// Pet species emoji mapping
const petSpeciesEmoji: Record<string, string> = {
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

const sexEmoji: Record<string, string> = {
  MALE: '♂️',
  FEMALE: '♀️',
  UNKNOWN: '❓',
};

const sexLabels: Record<string, string> = {
  MALE: 'Macho',
  FEMALE: 'Hembra',
  UNKNOWN: 'Desconocido',
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

const NotAvailable = () => (
  <span className="text-[10px] text-gray-400 italic">No disponible</span>
);

/**
 * PetCard - Fixed height, consistent layout matching ClientCard
 */
export function PetCard({
  pet,
  actions = [],
  size = 'M',
  onActionClick,
  onEdit,
  onDelete,
}: PetCardProps) {
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [showClientModal, setShowClientModal] = React.useState(false);
  const [selectedClient, setSelectedClient] = React.useState<Client | null>(null);
  const [loadingClient, setLoadingClient] = React.useState(false);
  const { fetchClientById } = useClientsStore();

  const sizeMap = {
    S: 'h-64',    // 256px
    M: 'h-80',    // 320px
    L: 'h-96',    // 384px
  };

  const handleActionClick = (action: EntityAction) => {
    if (onActionClick) {
      onActionClick(action);
      return;
    }
    switch (action.id) {
      case 'edit':
        onEdit?.(pet);
        break;
      case 'delete':
        onDelete?.(pet);
        break;
    }
  };

  const handleClientClick = async () => {
    if (!pet.clientId) return;
    setLoadingClient(true);
    try {
      const client = await fetchClientById(pet.clientId);
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

  const initials = pet.name.slice(0, 2).toUpperCase();
  const isDeceased = pet.is_deceased;
  const statusLabel = isDeceased ? 'Fallecida' : 'Activa';
  const statusBadge = isDeceased ? 'bg-gray-500 text-white' : 'bg-green-500 text-white';
  const headerBg = isDeceased
    ? 'bg-gradient-to-r from-gray-600 to-gray-700'
    : 'bg-gradient-to-r from-primary-600 to-primary-700';
  const cardBg = isDeceased ? 'bg-gray-50 border-gray-200' : 'bg-white border-primary-200 hover:border-primary-200';

  return (
    <div className={`rounded-lg border overflow-hidden transition-all hover:shadow-md ${sizeMap[size]} flex flex-col ${cardBg}`}>
      {/* HEADER */}
      <div className={`${headerBg} px-4 py-3 relative flex-shrink-0`}>
        {/* Status Badge */}
        <span className={`absolute top-3 right-12 px-2.5 py-0.5 rounded text-xs font-semibold ${statusBadge}`}>
          {statusLabel}
        </span>

        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            {initials}
          </div>

          {/* Name + ID */}
          <div className="flex-1 min-w-0 pr-10">
            <h3 className="font-bold text-white text-base leading-tight truncate">{pet.name}</h3>
            <p className="text-white/60 text-xs font-mono mt-0.5">{pet.id.slice(0, 8)}</p>
          </div>

          {/* Menu Button */}
          <div className="relative">
            <button
              onClick={() => setExpandedId(expandedId === pet.id ? null : pet.id)}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded transition"
              title="Opciones"
            >
              <MdMoreVert className="w-5 h-5" />
            </button>

            {expandedId === pet.id && (
              <div className="absolute right-0 top-10 w-40 bg-white border border-gray-200 rounded-lg shadow-xl z-10 overflow-hidden">
                {actions.length > 0 ? (
                  actions.map((action) => (
                    <button
                      key={action.id}
                      onClick={() => {
                        handleActionClick(action);
                        setExpandedId(null);
                      }}
                      className={`w-full px-3 py-2 text-left font-medium text-xs flex items-center gap-2 transition ${
                        action.id === 'delete' ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {action.icon && <action.icon className="w-3.5 h-3.5" />}
                      {action.label}
                    </button>
                  ))
                ) : (
                  <>
                    <button
                      onClick={() => {
                        onEdit?.(pet);
                        setExpandedId(null);
                      }}
                      className="w-full px-3 py-2 text-left text-primary-600 hover:bg-primary-50 transition font-medium text-xs flex items-center gap-2"
                    >
                      <MdEdit className="w-3.5 h-3.5" />
                      Editar
                    </button>
                    <button
                      onClick={() => {
                        onDelete?.(pet);
                        setExpandedId(null);
                      }}
                      className="w-full px-3 py-2 text-left text-red-600 hover:bg-red-50 transition font-medium text-xs flex items-center gap-2 border-t border-gray-100"
                    >
                      <MdDelete className="w-3.5 h-3.5" />
                      Eliminar
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Species + Owner Row */}
        <div className="flex items-center gap-2 mt-2 text-white/95 text-xs">
          <span className="text-base">{petSpeciesEmoji[pet.species] || '🐾'}</span>
          <span className="font-medium">{getSpeciesLabel(pet.species)}</span>
          {pet.clientName && (
            <>
              <span className="text-white/40">•</span>
              <button
                onClick={handleClientClick}
                disabled={loadingClient}
                className="italic opacity-90 hover:opacity-100 transition disabled:opacity-50 disabled:cursor-not-allowed truncate"
              >
                {pet.clientName}
              </button>
            </>
          )}
        </div>
      </div>

      {/* BODY */}
      <div className="px-4 py-3 flex-1 flex flex-col gap-3 overflow-y-auto">
        {/* INFORMACIÓN BÁSICA & SALUD - 2 Column Grid */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          {/* Información */}
          <div>
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-2">Información</p>
            <div className="space-y-2">
              {/* Sexo */}
              <div className="flex items-center gap-2">
                <MdWc className="w-4 h-4 text-pink-400 flex-shrink-0" />
                <span className="text-gray-700 text-sm">
                  {sexEmoji[pet.sex]} {sexLabels[pet.sex]}
                </span>
              </div>

              {/* Raza */}
              {pet.breed && (
                <div className="flex items-center gap-2 min-w-0">
                  <MdCategory className="w-4 h-4 text-orange-400 flex-shrink-0" />
                  <span className="text-gray-700 text-sm truncate" title={pet.breed}>{pet.breed}</span>
                </div>
              )}

              {/* Edad */}
              <div className="flex items-center gap-2">
                <MdCalendarToday className="w-4 h-4 text-primary-400 flex-shrink-0" />
                <span className="text-gray-700 text-sm">
                  {pet.date_of_birth ? calculateAge(pet.date_of_birth) : 'N/A'}
                </span>
              </div>

              {/* Color */}
              {pet.color && (
                <div className="flex items-center gap-2 min-w-0">
                  <MdPalette className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span className="text-gray-700 text-sm truncate">{pet.color}</span>
                </div>
              )}
            </div>
          </div>

          {/* Salud */}
          <div>
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-2">Salud</p>
            <div className="space-y-2">
              {/* Esterilización */}
              <div className="flex items-center gap-2">
                <MdVaccines className={`w-4 h-4 flex-shrink-0 ${pet.is_sterilized ? 'text-green-500' : 'text-gray-300'}`} />
                <span className="text-gray-700 text-sm">
                  {pet.is_sterilized ? '✅ Sí' : '❌ No'}
                </span>
              </div>

              {/* Alergias */}
              {pet.allergies && (
                <div className="flex items-start gap-2 min-w-0">
                  <MdWarningAmber className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 text-sm line-clamp-2 leading-snug" title={pet.allergies}>
                    {pet.allergies.length > 30 ? pet.allergies.substring(0, 30) + '...' : pet.allergies}
                  </span>
                </div>
              )}

              {/* Microchip */}
              {pet.microchip_number && (
                <div className="flex items-center gap-2 min-w-0">
                  <MdCheckCircle className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <span className="text-gray-700 text-xs font-mono truncate" title={pet.microchip_number}>
                    {pet.microchip_number}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* NOTAS */}
        {pet.notes && (
          <div>
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-2">Notas</p>
            <div className="flex items-start gap-2 bg-yellow-50 px-2.5 py-2 rounded border border-yellow-100">
              <MdNotes className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-gray-700 text-sm line-clamp-2 leading-snug">{pet.notes}</p>
            </div>
          </div>
        )}
      </div>

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


