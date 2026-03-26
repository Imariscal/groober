/**
 * Clients Zustand Store
 * Gestiona estado global de clientes, incluyendo preferencias y tags
 */

import { create } from 'zustand';
import { Client, CreateClientPayload, UpdateClientPayload } from '@/types';
import { clientsApi } from '@/lib/clients-api';
import toast from 'react-hot-toast';

interface ClientsState {
  // State
  clients: Client[];
  selectedClient: Client | null;
  clientTags: Map<string, string[]>; // clientId -> tags[]
  loading: boolean;
  tagsLoading: boolean;
  error: string | null;
  page: number;
  total: number;
  limit: number;

  // Actions for clients
  setSelectedClient: (client: Client | null) => void;
  fetchClients: (page?: number, limit?: number) => Promise<void>;
  fetchClientById: (clientId: string) => Promise<Client | null>;
  createClient: (payload: CreateClientPayload) => Promise<Client>;
  updateClient: (clientId: string, payload: UpdateClientPayload) => Promise<Client>;
  updateClientPreferences: (
    clientId: string,
    preferences: Partial<Client>,
  ) => Promise<void>;
  deleteClient: (clientId: string) => Promise<void>;
  deactivateClient: (clientId: string) => Promise<void>;

  // Actions for tags
  fetchClientTags: (clientId: string) => Promise<string[]>;
  addClientTag: (clientId: string, tag: string) => Promise<void>;
  removeClientTag: (clientId: string, tag: string) => Promise<void>;
  getClientTags: (clientId: string) => string[];

  // Utility actions
  clearClients: () => void;
  setPage: (page: number) => void;
}

export const useClientsStore = create<ClientsState>((set, get) => ({
  // Initial state
  clients: [],
  selectedClient: null,
  clientTags: new Map(),
  loading: false,
  tagsLoading: false,
  error: null,
  page: 1,
  total: 0,
  limit: 20,

  // Client actions
  setSelectedClient: (client: Client | null) => {
    set({ selectedClient: client });
    if (client?.id) {
      get().fetchClientTags(client.id);
    }
  },

  fetchClients: async (page: number = 1, limit: number = 20) => {
    set({ loading: true, error: null });
    try {
      const response = await clientsApi.listClients(page, limit);
      set({
        clients: response.data,
        page: response.page,
        total: response.total,
        limit: response.limit,
        loading: false,
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error fetching clients';
      set({ error: errorMsg, loading: false });
      toast.error(errorMsg);
    }
  },

  fetchClientById: async (clientId: string): Promise<Client | null> => {
    set({ loading: true, error: null });
    try {
      const client = await clientsApi.getClient(clientId);
      set((state) => ({
        clients: state.clients.map((c) => (c.id === clientId ? client : c)),
        loading: false,
      }));
      return client;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error fetching client';
      set({ error: errorMsg, loading: false });
      toast.error(errorMsg);
      return null;
    }
  },

  createClient: async (payload: CreateClientPayload): Promise<Client> => {
    set({ loading: true, error: null });
    try {
      const client = await clientsApi.createClient(payload);
      set((state) => ({
        clients: [client, ...state.clients],
        loading: false,
      }));
      toast.success('Cliente creado exitosamente');
      return client;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error creating client';
      set({ error: errorMsg, loading: false });
      toast.error(errorMsg);
      throw error;
    }
  },

  updateClient: async (
    clientId: string,
    payload: UpdateClientPayload,
  ): Promise<Client> => {
    set({ loading: true, error: null });
    try {
      const updatedClient = await clientsApi.updateClient(clientId, payload);
      set((state) => ({
        clients: state.clients.map((c) =>
          c.id === clientId ? { ...c, ...updatedClient } : c,
        ),
        selectedClient:
          state.selectedClient?.id === clientId
            ? { ...state.selectedClient, ...updatedClient }
            : state.selectedClient,
        loading: false,
      }));
      toast.success('Cliente actualizado');
      return updatedClient;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error updating client';
      set({ error: errorMsg, loading: false });
      toast.error(errorMsg);
      throw error;
    }
  },

  updateClientPreferences: async (
    clientId: string,
    preferences: Partial<Client>,
  ) => {
    await get().updateClient(clientId, preferences as UpdateClientPayload);
  },

  deleteClient: async (clientId: string) => {
    set({ loading: true, error: null });
    try {
      await clientsApi.deleteClient(clientId);
      set((state) => ({
        clients: state.clients.filter((c) => c.id !== clientId),
        selectedClient:
          state.selectedClient?.id === clientId ? null : state.selectedClient,
        loading: false,
      }));
      toast.success('Cliente eliminado');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error deleting client';
      set({ error: errorMsg, loading: false });
      toast.error(errorMsg);
      throw error;
    }
  },

  deactivateClient: async (clientId: string) => {
    try {
      const deactivated = await clientsApi.deactivateClient(clientId);
      set((state) => ({
        clients: state.clients.map((c) =>
          c.id === clientId ? { ...c, status: 'INACTIVE' as const } : c,
        ),
        selectedClient:
          state.selectedClient?.id === clientId
            ? { ...state.selectedClient, status: 'INACTIVE' as const }
            : state.selectedClient,
      }));
      toast.success('Cliente desactivado');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error deactivating client';
      set({ error: errorMsg });
      toast.error(errorMsg);
      throw error;
    }
  },

  // Tag actions
  fetchClientTags: async (clientId: string): Promise<string[]> => {
    set({ tagsLoading: true, error: null });
    try {
      const tags = await clientsApi.tags.getClientTags(clientId);
      set((state) => {
        const newMap = new Map(state.clientTags);
        newMap.set(clientId, tags);
        return { clientTags: newMap, tagsLoading: false };
      });
      return tags;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error fetching tags';
      set({ error: errorMsg, tagsLoading: false });
      console.error('[fetchClientTags] Error:', errorMsg);
      return [];
    }
  },

  addClientTag: async (clientId: string, tag: string) => {
    set({ tagsLoading: true, error: null });
    try {
      await clientsApi.tags.addTag(clientId, tag);
      const updatedTags = await get().fetchClientTags(clientId);
      set((state) => ({
        selectedClient: state.selectedClient
          ? { ...state.selectedClient, tags: updatedTags }
          : state.selectedClient,
        tagsLoading: false,
      }));
      toast.success(`Etiqueta "${tag}" agregada`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error adding tag';
      set({ error: errorMsg, tagsLoading: false });
      toast.error(errorMsg);
      throw error;
    }
  },

  removeClientTag: async (clientId: string, tag: string) => {
    set({ tagsLoading: true, error: null });
    try {
      await clientsApi.tags.removeTag(clientId, tag);
      const updatedTags = await get().fetchClientTags(clientId);
      set((state) => ({
        selectedClient: state.selectedClient
          ? { ...state.selectedClient, tags: updatedTags }
          : state.selectedClient,
        tagsLoading: false,
      }));
      toast.success(`Etiqueta "${tag}" removida`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error removing tag';
      set({ error: errorMsg, tagsLoading: false });
      toast.error(errorMsg);
      throw error;
    }
  },

  getClientTags: (clientId: string): string[] => {
    return get().clientTags.get(clientId) || [];
  },

  // Utility actions
  clearClients: () => {
    set({
      clients: [],
      selectedClient: null,
      clientTags: new Map(),
      page: 1,
      total: 0,
    });
  },

  setPage: (page: number) => {
    set({ page });
    get().fetchClients(page, get().limit);
  },
}));
