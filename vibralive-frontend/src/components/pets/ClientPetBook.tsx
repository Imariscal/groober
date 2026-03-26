'use client';

import { useState, useEffect } from 'react';
import { MdAdd, MdEdit, MdDelete, MdPets, MdExpandMore, MdWarning } from 'react-icons/md';
import { Pet, CreateClientPetPayload, PetSpecies } from '@/types';
import { useClientPetsStore } from '@/store/clientPets.store';
import { PetForm } from './PetForm';
import toast from 'react-hot-toast';

// Draft pet type for CREATE mode (no id yet)
export interface DraftPet extends CreateClientPetPayload {
  _draftId: string; // Temporary ID for local tracking
}

interface ClientPetBookProps {
  // API Mode: clientId present = use API for CRUD
  clientId?: string;
  onPetSelected?: (pet: Pet) => void;
  // Draft Mode: for CREATE (before client exists)
  draftPets?: DraftPet[];
  onDraftChange?: (pets: DraftPet[]) => void;
  // Callback to notify parent of pet count changes
  onPetCountChange?: (count: number) => void;
}

// Species emoji mapping
const SPECIES_EMOJI: Record<PetSpecies, string> = {
  DOG: '🐕',
  CAT: '🐱',
  BIRD: '🐦',
  RABBIT: '🐰',
  HAMSTER: '🐹',
  GUINEA_PIG: '🐹',
  FISH: '🐟',
  TURTLE: '🐢',
  FERRET: '🦡',
  OTHER: '🐾',
};

// Species label mapping
const SPECIES_LABEL: Record<PetSpecies, string> = {
  DOG: 'Perro',
  CAT: 'Gato',
  BIRD: 'Ave',
  RABBIT: 'Conejo',
  HAMSTER: 'Hámster',
  GUINEA_PIG: 'Cobayo',
  FISH: 'Pez',
  TURTLE: 'Tortuga',
  FERRET: 'Hurón',
  OTHER: 'Otro',
};

export function ClientPetBook({
  clientId,
  onPetSelected,
  draftPets,
  onDraftChange,
  onPetCountChange,
}: ClientPetBookProps) {
  // Determine mode
  const isDraftMode = !clientId && draftPets !== undefined && onDraftChange !== undefined;

  // Store (only used in API mode)
  const store = useClientPetsStore();
  const { pets: storePets, loading: storeLoading, error: storeError, selectedClientId, setSelectedClient } = store;

  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isFormExpanded, setIsFormExpanded] = useState(false);
  const [formKey, setFormKey] = useState(0); // Key to force form reset

  // Load pets from API only in API mode
  useEffect(() => {
    if (!isDraftMode && clientId && clientId !== selectedClientId) {
      setSelectedClient(clientId);
    }
  }, [clientId, selectedClientId, setSelectedClient, isDraftMode]);

  // Notify parent of pet count changes
  useEffect(() => {
    if (onPetCountChange) {
      const count = isDraftMode 
        ? (draftPets?.length ?? 0)
        : (storePets?.length ?? 0);
      onPetCountChange(count);
    }
  }, [isDraftMode, draftPets?.length, storePets?.length, onPetCountChange]);

  // Generate unique draft ID
  const generateDraftId = () => `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Handlers for DRAFT mode
  const handleAddDraft = (data: CreateClientPetPayload) => {
    if (!onDraftChange || !draftPets) return;
    const newPet: DraftPet = {
      ...data,
      _draftId: generateDraftId(),
    };
    onDraftChange([...draftPets, newPet]);
    toast.success('Mascota agregada');
    setEditingId(null);
    setIsFormExpanded(false);
    setFormKey((k) => k + 1); // Reset form
  };

  const handleUpdateDraft = (data: CreateClientPetPayload) => {
    if (!onDraftChange || !draftPets || !editingId) return;
    const updated = draftPets.map((pet) =>
      pet._draftId === editingId ? { ...pet, ...data } : pet
    );
    onDraftChange(updated);
    toast.success('Mascota actualizada');
    setEditingId(null);
    setIsFormExpanded(false);
    setFormKey((k) => k + 1); // Reset form
  };

  const handleDeleteDraft = (draftId: string) => {
    if (!onDraftChange || !draftPets) return;
    const updated = draftPets.filter((p) => p._draftId !== draftId);
    onDraftChange(updated);
    toast.success('Mascota eliminada');
    setDeleteConfirmId(null);
  };

  // Handlers for API mode
  const handleAddPet = async (data: CreateClientPetPayload) => {
    if (isDraftMode) {
      handleAddDraft(data);
      return;
    }
    await store.addPet(clientId!, data);
    setEditingId(null);
    setIsFormExpanded(false);
    setFormKey((k) => k + 1);
  };

  const handleUpdatePet = async (data: CreateClientPetPayload) => {
    if (isDraftMode) {
      handleUpdateDraft(data);
      return;
    }
    if (editingId) {
      await store.updatePet(clientId!, editingId, data);
      setEditingId(null);
      setIsFormExpanded(false);
      setFormKey((k) => k + 1);
    }
  };

  const handleDeletePet = async (petId: string) => {
    if (isDraftMode) {
      handleDeleteDraft(petId);
      return;
    }
    await store.deletePet(clientId!, petId);
    setDeleteConfirmId(null);
  };

  // Unified pet list for both modes
  const pets = isDraftMode ? draftPets || [] : storePets;
  const loading = isDraftMode ? false : storeLoading;
  const error = isDraftMode ? null : storeError;

  // Normalize to common shape for rendering
  const petsList = isDraftMode
    ? (draftPets || []).map((d) => ({
        id: d._draftId,
        name: d.name,
        species: d.species,
        breed: d.breed,
        dateOfBirth: d.dateOfBirth,
        sex: d.sex,
        isSterilized: d.isSterilized,
        color: d.color,
        size: d.size,
        microchipNumber: d.microchipNumber,
        tagNumber: d.tagNumber,
        notes: d.notes,
        allergies: d.allergies,
      }))
    : Array.isArray(storePets)
      ? storePets.filter((p): p is Pet => p != null && typeof p === 'object' && 'id' in p).map((p) => ({
          id: p.id,
          name: p.name,
          species: p.species,
          breed: p.breed,
          dateOfBirth: p.date_of_birth,
          sex: p.sex,
          isSterilized: p.is_sterilized,
          color: p.color,
          size: p.size,
          microchipNumber: p.microchip_number,
          tagNumber: p.tag_number,
          notes: p.notes,
          allergies: p.allergies,
        }))
      : [];

  const editingPet = isDraftMode
    ? draftPets?.find((p) => p._draftId === editingId)
    : petsList.find((p) => p.id === editingId);

  const formatPetInfo = (pet: { species?: PetSpecies; breed?: string; color?: string }): string => {
    const parts = [
      pet.species && SPECIES_LABEL[pet.species],
      pet.breed,
      pet.color,
    ].filter(Boolean);
    return parts.join(' · ');
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="border-b-2 border-gray-200 pb-4">
        <h3 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
          <MdPets className="w-6 h-6 text-purple-600" />
          Mascotas del Cliente
        </h3>
        <p className="text-sm text-gray-600">Registra las mascotas del cliente para agendar servicios</p>
      </div>

      {/* Layout: Desktop (2 cols) + Mobile (stacked) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Pets List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-900">Tus Mascotas</h4>
            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">
              {petsList.length}
            </span>
          </div>

          {/* Error State */}
          {error && (
            <div className="p-4 bg-red-50 border-2 border-red-300 rounded-lg text-red-700 text-sm font-medium flex items-center gap-2">
              <MdWarning className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}
          
          {loading && !petsList.length ? (
            <div className="text-center py-12 text-gray-500 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-dashed border-gray-300 p-6">
              <div className="animate-spin inline-block w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full mb-3" />
              <p className="font-semibold">Cargando mascotas...</p>
            </div>
          ) : petsList.length === 0 ? (
            <div className="text-center py-12 px-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border-2 border-dashed border-purple-300 space-y-3">
              <MdPets className="w-12 h-12 text-purple-300 mx-auto" />
              <div>
                <p className="text-gray-700 font-semibold">No hay mascotas registradas</p>
                <p className="text-gray-500 text-sm mt-1">Agrega una nueva mascota usando el formulario →</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {petsList.map((pet) => (
                <div 
                  key={pet.id} 
                  className="p-5 border-2 border-gray-200 rounded-lg hover:border-purple-400 hover:shadow-lg transition-all duration-200 bg-white hover:bg-purple-50 cursor-pointer group" 
                  onClick={() => {
                    // Only call onPetSelected in API mode with real Pet
                    if (!isDraftMode && onPetSelected) {
                      const realPet = storePets.find((p) => p.id === pet.id);
                      if (realPet) onPetSelected(realPet);
                    }
                  }}
                >
                  {/* Pet Card */}
                  <div className="space-y-3">
                    {/* Header with name and species emoji */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-2xl">
                        {pet.species ? SPECIES_EMOJI[pet.species] : '🐾'}
                      </span>
                      <h5 className="font-bold text-gray-900 text-base group-hover:text-purple-700 transition">
                        {pet.name}
                      </h5>
                      {pet.isSterilized && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                          Esterilizado
                        </span>
                      )}
                    </div>

                    {/* Pet info text */}
                    <p className="text-sm text-gray-700 font-medium line-clamp-2 leading-relaxed">
                      {formatPetInfo(pet)}
                    </p>

                    {/* Allergies badge if present */}
                    {pet.allergies && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 text-xs font-medium rounded-full">
                        ⚠️ Alergias: {pet.allergies}
                      </span>
                    )}

                    {/* Actions - Bottom */}
                    <div className="flex gap-2 mt-4 pt-3 border-t border-gray-200 flex-wrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingId(pet.id);
                          setIsFormExpanded(true);
                        }}
                        className="flex-1 min-w-24 text-xs px-3 py-2 flex items-center justify-center gap-1 border-2 border-purple-300 text-purple-700 rounded-md hover:bg-purple-50 hover:border-purple-400 transition font-medium"
                      >
                        <MdEdit className="w-3.5 h-3.5" />
                        Editar
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmId(pet.id);
                        }}
                        className="flex-1 min-w-24 text-xs px-3 py-2 flex items-center justify-center gap-1 border-2 border-red-300 text-red-700 rounded-md hover:bg-red-50 hover:border-red-400 transition font-medium"
                      >
                        <MdDelete className="w-3.5 h-3.5" />
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Pet Form (Desktop visible, Mobile accordion) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Desktop - Always visible */}
          <div className="hidden lg:block">
            <div className="space-y-4">
              <div className="p-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl">
                <div className="bg-white rounded-lg p-6">
                  <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-lg">
                    <MdAdd className="w-6 h-6 text-purple-600" />
                    {editingId ? 'Editar Mascota' : 'Agregar Nueva Mascota'}
                  </h4>
                  <PetForm
                    key={formKey}
                    pet={editingPet}
                    onSubmit={editingId ? handleUpdatePet : handleAddPet}
                    onCancel={() => {
                      setEditingId(null);
                      setFormKey((k) => k + 1); // Reset form on cancel
                    }}
                    loading={loading}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Mobile - Accordion */}
          <div className="lg:hidden">
            <button
              onClick={() => setIsFormExpanded(!isFormExpanded)}
              className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 font-bold shadow-lg hover:shadow-xl"
            >
              <span className="flex items-center gap-2">
                <MdAdd className="w-5 h-5" />
                {editingId ? 'Editar' : 'Agregar Nueva'} Mascota
              </span>
              <MdExpandMore
                className={`w-6 h-6 transition-transform duration-300 ${isFormExpanded ? 'rotate-180' : ''}`}
              />
            </button>

            {isFormExpanded && (
              <div className="mt-4 p-6 bg-white rounded-xl border-2 border-purple-200 shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  {editingId ? 'Editar Mascota' : 'Nueva Mascota'}
                </h4>
                <PetForm
                  key={formKey}
                  pet={editingPet}
                  onSubmit={editingId ? handleUpdatePet : handleAddPet}
                  onCancel={() => {
                    setEditingId(null);
                    setIsFormExpanded(false);
                    setFormKey((k) => k + 1); // Reset form on cancel
                  }}
                  loading={loading}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 animate-in zoom-in duration-300">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-red-100 rounded-full">
                <MdWarning className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Confirmar eliminación</h3>
            </div>
            <p className="text-gray-600 leading-relaxed">¿Está seguro que desea eliminar esta mascota? Esta acción no se puede deshacer.</p>
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeletePet(deleteConfirmId)}
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <MdDelete className="w-4 h-4" />
                {loading ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
