/**
 * Clients API Service
 * Capa de abstracción para todas las operaciones CRUD con clientes
 * Maneja: crear, listar, obtener, actualizar, eliminar clientes y tags
 */

import { apiClient } from './api-client';
import { Client, CreateClientPayload, UpdateClientPayload } from '@/types';
import { clientTagsApi } from '@/api/client-tags-api';

export interface ListClientsResponse {
  data: Client[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Formatea un teléfono para mostrar en el UI
 * Ej: 5551234567 -> (555) 123-4567
 * Ej: +525551234567 -> +52 (555) 123-4567
 */
function formatPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  
  // Limpiar primero
  const cleaned = phone.replace(/[^\d+]/g, '');
  if (!cleaned) return null;
  
  let result = '';
  
  if (cleaned.startsWith('+')) {
    result = '+';
    const digits = cleaned.slice(1);
    
    // Formato: +XX (XXX) XXX-XXXX
    if (digits.length <= 2) {
      result += digits;
    } else if (digits.length <= 5) {
      result += digits.slice(0, 2) + ' (' + digits.slice(2);
    } else if (digits.length <= 8) {
      result += digits.slice(0, 2) + ' (' + digits.slice(2, 5) + ') ' + digits.slice(5);
    } else {
      result += digits.slice(0, 2) + ' (' + digits.slice(2, 5) + ') ' + digits.slice(5, 8) + '-' + digits.slice(8, 12);
    }
  } else {
    // Sin código de país: (XXX) XXX-XXXX
    if (cleaned.length <= 3) {
      result = cleaned;
    } else if (cleaned.length <= 6) {
      result = '(' + cleaned.slice(0, 3) + ') ' + cleaned.slice(3);
    } else {
      result = '(' + cleaned.slice(0, 3) + ') ' + cleaned.slice(3, 6) + '-' + cleaned.slice(6, 10);
    }
  }
  
  return result;
}

/**
 * Mapea la respuesta del backend (camelCase) al formato del frontend (snake_case)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapBackendToClient(data: any): Client {
  return {
    id: data.id,
    clinic_id: data.clinicId || data.clinic_id,
    name: data.name,
    phone: formatPhone(data.phone) || data.phone,
    email: data.email ?? null,
    address: data.address ?? null,
    notes: data.notes ?? null,
    price_list_id: data.priceListId ?? data.price_list_id ?? null,
    whatsapp_number: formatPhone(data.whatsappNumber ?? data.whatsapp_number),
    phone_secondary: formatPhone(data.phoneSecondary ?? data.phone_secondary),
    preferred_contact_method: data.preferredContactMethod ?? data.preferred_contact_method ?? null,
    preferred_contact_time_start: data.preferredContactTimeStart ?? data.preferred_contact_time_start ?? null,
    preferred_contact_time_end: data.preferredContactTimeEnd ?? data.preferred_contact_time_end ?? null,
    housing_type: data.housingType ?? data.housing_type ?? null,
    access_notes: data.accessNotes ?? data.access_notes ?? null,
    service_notes: data.serviceNotes ?? data.service_notes ?? null,
    do_not_contact: data.doNotContact ?? data.do_not_contact ?? null,
    do_not_contact_reason: data.doNotContactReason ?? data.do_not_contact_reason ?? null,
    status: data.status ?? null,
    tags: data.tags ?? [],
    created_at: data.createdAt || data.created_at,
    updated_at: data.updatedAt || data.updated_at,
    pets: data.pets,
    addresses: data.addresses,
  };
}

/**
 * Limpia un número de teléfono quitando espacios, paréntesis y guiones
 * Mantiene solo dígitos y el símbolo + al inicio
 */
function cleanPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');
  return cleaned || null;
}

/**
 * Mapea el payload del frontend (snake_case) al formato del backend (camelCase)
 * Convierte strings vacíos a undefined para evitar errores de validación
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapClientToBackend(payload: CreateClientPayload | UpdateClientPayload): any {
  // Helper para convertir strings vacíos a null (no undefined - para que axios los incluya en JSON)
  const emptyToNull = (val: string | null | undefined) => val || null;
  
  // Helper para limpiar tiempo a formato HH:MM (quitar segundos si existen)
  const cleanTime = (val: string | null | undefined) => {
    if (!val) return null;  // Usar null en lugar de undefined
    // Extract only HH:MM, removing seconds if present
    const match = val.match(/^(\d{2}:\d{2})/);
    return match ? match[1] : null;
  };
  
  // Map addresses if present (backend expects snake_case for address fields, isDefault for default flag)
  const addresses = (payload as CreateClientPayload).addresses?.map(addr => ({
    label: addr.label,
    street: addr.street,
    number_ext: addr.number_ext,
    number_int: addr.number_int,
    neighborhood: addr.neighborhood,
    city: addr.city,
    state: addr.state,
    zip_code: addr.zip_code,
    references: addr.references,
    isDefault: addr.is_default,
  }));
  
  // Map pets if present (backend expects camelCase)
  const pets = (payload as CreateClientPayload).pets?.map(pet => ({
    name: pet.name,
    species: pet.species,
    breed: pet.breed || null,
    dateOfBirth: pet.dateOfBirth || null,
    sex: pet.sex || null,
    isSterilized: pet.isSterilized ?? false,
    color: pet.color || null,
    size: pet.size || null,
    microchipNumber: pet.microchipNumber || null,
    tagNumber: pet.tagNumber || null,
    notes: pet.notes || null,
    allergies: pet.allergies || null,
  }));
  
  return {
    name: payload.name,
    phone: cleanPhone(payload.phone),
    email: emptyToNull(payload.email),
    address: emptyToNull(payload.address),
    notes: emptyToNull(payload.notes),
    priceListId: payload.price_list_id,  // Keep as-is (can be null, undefined, or UUID string)
    whatsappNumber: cleanPhone(payload.whatsapp_number),
    phoneSecondary: cleanPhone(payload.phone_secondary),
    preferredContactMethod: emptyToNull(payload.preferred_contact_method),
    preferredContactTimeStart: cleanTime(payload.preferred_contact_time_start),
    preferredContactTimeEnd: cleanTime(payload.preferred_contact_time_end),
    housingType: emptyToNull(payload.housing_type),
    accessNotes: emptyToNull(payload.access_notes),
    serviceNotes: emptyToNull(payload.service_notes),
    doNotContact: payload.do_not_contact,
    doNotContactReason: emptyToNull(payload.do_not_contact_reason),
    status: emptyToNull(payload.status),
    addresses: addresses,
    pets: pets,
  };
}

/**
 * ClientsApiService
 * Proporciona métodos tipados para todas las operaciones con clientes
 */
export const clientsApi = {
  /**
   * Crear un nuevo cliente
   */
  async createClient(payload: CreateClientPayload): Promise<Client> {
    try {
      const backendPayload = mapClientToBackend(payload);
      const data = await apiClient.post('/clients', backendPayload);
      return mapBackendToClient(data);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtener lista de clientes con paginación
   */
  async listClients(page: number = 1, limit: number = 20): Promise<ListClientsResponse> {
    try {
      const data = await apiClient.get('/clients', {
        params: { page, limit },
      });

      // El backend puede devolver data directamente o en un wrapper
      if (Array.isArray(data)) {
        return {
          data: data.map(mapBackendToClient),
          total: data.length,
          page,
          limit,
        };
      }

      const rawData = data.data || data;
      return {
        data: Array.isArray(rawData) ? rawData.map(mapBackendToClient) : [],
        total: data.total || rawData?.length || 0,
        page: data.page || page,
        limit: data.limit || limit,
      };
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtener un cliente específico por ID
   */
  async getClient(clientId: string): Promise<Client> {
    try {
      const data = await apiClient.get(`/clients/${clientId}`);
      return mapBackendToClient(data);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Actualizar un cliente
   */
  async updateClient(
    clientId: string,
    payload: UpdateClientPayload,
  ): Promise<Client> {
    try {
      const backendPayload = mapClientToBackend(payload);
      console.log('📤 UPDATE CLIENT PAYLOAD:', {
        original: { price_list_id: payload.price_list_id },
        mapped: { priceListId: backendPayload.priceListId },
        fullPayload: backendPayload,
      });
      const data = await apiClient.patch(
        `/clients/${clientId}`,
        backendPayload,
      );
      return mapBackendToClient(data);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Eliminar un cliente (hard delete - requiere permisos elevados)
   */
  async deleteClient(clientId: string): Promise<void> {
    try {
      await apiClient.delete(`/clients/${clientId}`);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Desactivar un cliente (soft delete)
   */
  async deactivateClient(clientId: string): Promise<Client> {
    try {
      const data = await apiClient.patch(`/clients/${clientId}/deactivate`);
      return mapBackendToClient(data);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Tag management
   */
  tags: {
    /**
     * Get all tags for a client
     */
    async getClientTags(clientId: string): Promise<string[]> {
      return clientTagsApi.getTags(clientId);
    },

    /**
     * Add a tag to a client
     */
    async addTag(clientId: string, tag: string): Promise<{ tag: string; createdAt: string } | null> {
      return clientTagsApi.addTag(clientId, tag);
    },

    /**
     * Remove a tag from a client
     */
    async removeTag(clientId: string, tag: string): Promise<void> {
      return clientTagsApi.removeTag(clientId, tag);
    },

    /**
     * Search tags with autocomplete
     */
    searchTags(allTags: string[], query: string, limit: number = 10): string[] {
      return clientTagsApi.searchTags(allTags, query, limit);
    },
  },
};
