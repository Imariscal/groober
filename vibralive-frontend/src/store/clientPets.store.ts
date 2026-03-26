/**
 * Client Pets Zustand Store
 * Gestiona estado de mascotas del cliente actual
 */

import { create } from 'zustand';
import { Pet, CreateClientPetPayload } from '@/types';
import { petsApi } from '@/lib/pets-api';
import toast from 'react-hot-toast';

interface ClientPetsState {
  // State
  pets: Pet[];
  loading: boolean;
  selectedClientId: string | null;
  error: string | null;

  // Actions
  setSelectedClient: (clientId: string) => void;
  fetchPets: (clientId: string) => Promise<void>;
  addPet: (clientId: string, pet: CreateClientPetPayload) => Promise<Pet>;
  updatePet: (
    clientId: string,
    petId: string,
    updates: Partial<CreateClientPetPayload>,
  ) => Promise<Pet>;
  deletePet: (clientId: string, petId: string) => Promise<void>;
  getPetById: (id: string) => Pet | null;
  clearPets: () => void;
}

export const useClientPetsStore = create<ClientPetsState>((set, get) => ({
  // Initial state
  pets: [],
  loading: false,
  selectedClientId: null,
  error: null,

  // Actions
  setSelectedClient: (clientId: string) => {
    const state = get();
    if (state.selectedClientId !== clientId) {
      set({ selectedClientId: clientId, pets: [] });
      get().fetchPets(clientId);
    }
  },

  fetchPets: async (clientId: string) => {
    set({ loading: true, error: null });
    try {
      const data = await petsApi.getClientPets(clientId);
      console.log(
        '[fetchPets] Success:',
        Array.isArray(data) ? `${data.length} pets` : 'Not an array',
      );
      set({ pets: Array.isArray(data) ? data : [], loading: false });
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'Error fetching pets';
      console.error('[fetchPets] Error: ', errorMsg, error);
      set({ error: errorMsg, loading: false });
      toast.error(errorMsg);
    }
  },

  addPet: async (clientId: string, pet: CreateClientPetPayload) => {
    set({ loading: true });
    try {
      const newPet = await petsApi.createPet(clientId, pet);

      // Validar que newPet sea un objeto válido con id
      if (!newPet || typeof newPet !== 'object' || !('id' in newPet)) {
        throw new Error('Invalid pet returned from server');
      }

      set((state) => ({
        pets: Array.isArray(state.pets) ? [...state.pets, newPet] : [newPet],
        loading: false,
      }));
      toast.success('Mascota agregada');
      return newPet;
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'Error creating pet';
      set({ error: errorMsg, loading: false });
      toast.error(errorMsg);
      throw error;
    }
  },

  updatePet: async (
    clientId: string,
    petId: string,
    updates: Partial<CreateClientPetPayload>,
  ) => {
    set({ loading: true });
    try {
      const updated = await petsApi.updatePet(clientId, petId, updates);
      set((state) => ({
        pets: Array.isArray(state.pets)
          ? state.pets.map((p) => (p.id === petId ? updated : p))
          : [updated],
        loading: false,
      }));
      toast.success('Mascota actualizada');
      return updated;
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'Error updating pet';
      set({ error: errorMsg, loading: false });
      toast.error(errorMsg);
      throw error;
    }
  },

  deletePet: async (clientId: string, petId: string) => {
    set({ loading: true });
    try {
      await petsApi.deletePet(clientId, petId);
      set((state) => ({
        pets: Array.isArray(state.pets)
          ? state.pets.filter((p) => p.id !== petId)
          : [],
        loading: false,
      }));
      toast.success('Mascota eliminada');
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'Error deleting pet';
      set({ error: errorMsg, loading: false });
      toast.error(errorMsg);
      throw error;
    }
  },

  getPetById: (id: string) => {
    const state = get();
    return state.pets.find((p) => p.id === id) || null;
  },

  clearPets: () => {
    set({ pets: [], selectedClientId: null, error: null });
  },
}));
