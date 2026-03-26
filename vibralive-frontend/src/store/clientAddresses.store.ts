/**
 * Client Addresses Zustand Store
 * Gestiona estado de direcciones del cliente actual
 */

import { create } from 'zustand';
import {
  ClientAddress,
  CreateClientAddressPayload,
  UpdateClientAddressPayload,
} from '@/types';
import { addressesApi } from '@/lib/addresses-api';
import toast from 'react-hot-toast';

interface ClientAddressesState {
  // State
  addresses: ClientAddress[];
  loading: boolean;
  selectedClientId: string | null;
  error: string | null;

  // Actions
  setSelectedClient: (clientId: string) => void;
  fetchAddresses: (clientId: string) => Promise<void>;
  addAddress: (
    clientId: string,
    address: CreateClientAddressPayload,
  ) => Promise<ClientAddress>;
  updateAddress: (
    clientId: string,
    addressId: string,
    updates: UpdateClientAddressPayload,
  ) => Promise<ClientAddress>;
  deleteAddress: (clientId: string, addressId: string) => Promise<void>;
  setDefaultAddress: (clientId: string, addressId: string) => Promise<void>;
  getDefaultAddress: () => ClientAddress | null;
  getAddressById: (id: string) => ClientAddress | null;
  clearAddresses: () => void;
}

export const useClientAddressesStore = create<ClientAddressesState>(
  (set, get) => ({
    // Initial state
    addresses: [],
    loading: false,
    selectedClientId: null,
    error: null,

    // Actions
    setSelectedClient: (clientId: string) => {
      const state = get();
      if (state.selectedClientId !== clientId) {
        set({ selectedClientId: clientId, addresses: [] });
        get().fetchAddresses(clientId);
      }
    },

    fetchAddresses: async (clientId: string) => {
      set({ loading: true, error: null, selectedClientId: clientId });
      try {
        const data = await addressesApi.getClientAddresses(clientId);
        console.log('[fetchAddresses] Success:', Array.isArray(data) ? `${data.length} addresses` : 'Not an array');
        set({ addresses: Array.isArray(data) ? data : [], loading: false });
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : 'Error fetching addresses';
        console.error('[fetchAddresses] Error: ', errorMsg, error);
        set({ error: errorMsg, loading: false });
        toast.error(errorMsg);
      }
    },

    addAddress: async (
      clientId: string,
      address: CreateClientAddressPayload,
    ) => {
      set({ loading: true });
      try {
        const newAddress = await addressesApi.createAddress(clientId, address);
        
        // Validar que newAddress sea un objeto válido con id
        if (!newAddress || typeof newAddress !== 'object' || !('id' in newAddress)) {
          throw new Error('Invalid address returned from server');
        }
        
        set((state) => ({
          addresses: Array.isArray(state.addresses) 
            ? [...state.addresses, newAddress] 
            : [newAddress],
          loading: false,
        }));
        toast.success('Dirección agregada');
        return newAddress;
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : 'Error creating address';
        set({ error: errorMsg, loading: false });
        toast.error(errorMsg);
        throw error;
      }
    },

    updateAddress: async (
      clientId: string,
      addressId: string,
      updates: UpdateClientAddressPayload,
    ) => {
      set({ loading: true });
      try {
        const updated = await addressesApi.updateAddress(
          clientId,
          addressId,
          updates,
        );
        set((state) => ({
          addresses: Array.isArray(state.addresses)
            ? state.addresses.map((a) => (a.id === addressId ? updated : a))
            : [updated],
          loading: false,
        }));
        toast.success('Dirección actualizada');
        return updated;
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : 'Error updating address';
        set({ error: errorMsg, loading: false });
        toast.error(errorMsg);
        throw error;
      }
    },

    deleteAddress: async (clientId: string, addressId: string) => {
      set({ loading: true });
      try {
        await addressesApi.deleteAddress(clientId, addressId);
        set((state) => ({
          addresses: Array.isArray(state.addresses) ? state.addresses.filter((a) => a.id !== addressId) : [],
          loading: false,
        }));
        toast.success('Dirección eliminada');
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : 'Error deleting address';
        set({ error: errorMsg, loading: false });
        toast.error(errorMsg);
        throw error;
      }
    },

    setDefaultAddress: async (clientId: string, addressId: string) => {
      set({ loading: true });
      try {
        await addressesApi.setDefaultAddress(clientId, addressId);
        set((state) => ({
          addresses: Array.isArray(state.addresses)
            ? state.addresses.map((a) => ({
                ...a,
                is_default: a.id === addressId,
              }))
            : [],
          loading: false,
        }));
        toast.success('Dirección default actualizada');
      } catch (error) {
        const errorMsg =
          error instanceof Error
            ? error.message
            : 'Error setting default address';
        set({ error: errorMsg, loading: false });
        toast.error(errorMsg);
        throw error;
      }
    },

    getDefaultAddress: () => {
      const state = get();
      return Array.isArray(state.addresses) ? state.addresses.find((a) => a.is_default) || null : null;
    },

    getAddressById: (id: string) => {
      const state = get();
      return Array.isArray(state.addresses) ? state.addresses.find((a) => a.id === id) || null : null;
    },

    clearAddresses: () => {
      set({ addresses: [], selectedClientId: null });
    },
  }),
);
