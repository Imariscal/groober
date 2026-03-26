/**
 * Pets API Service
 * Capa de abstracción para CRUD de mascotas del cliente
 */

import { apiClient } from './api-client';
import { Pet, CreateClientPetPayload } from '@/types';
import { format, parseISO, isValid } from 'date-fns';

// Helper to format date to YYYY-MM-DD for input date field
function formatDateForInput(date: string | Date | null | undefined): string | undefined {
  if (!date) return undefined;
  try {
    // If it's already a YYYY-MM-DD string, return as is
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }
    // Parse the date and format without timezone conversion
    const d = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(d)) return undefined;
    // Use format() which preserves the date as-is
    return format(d, 'yyyy-MM-dd');
  } catch {
    return undefined;
  }
}

// Helper to format date to DD/MM/YYYY for display
export function formatDateToMMDDYYYY(date: string | Date | null | undefined): string | undefined {
  if (!date) return undefined;
  try {
    // Parse the date using parseISO for strings to avoid timezone issues
    const d = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(d)) return undefined;
    // Format as DD/MM/YYYY
    return format(d, 'dd/MM/yyyy');
  } catch {
    return undefined;
  }
}

// Backend returns camelCase, we need to map to snake_case for frontend
function mapPetFromBackend(data: any): Pet {
  return {
    id: data.id,
    clinic_id: data.clinic_id || data.clinicId,
    client_id: data.client_id || data.clientId,
    name: data.name,
    species: data.species,
    breed: data.breed,
    date_of_birth: formatDateForInput(data.date_of_birth || data.dateOfBirth),
    sex: data.sex || 'UNKNOWN',
    is_sterilized: data.is_sterilized ?? data.isSterilized ?? false,
    color: data.color,
    size: data.size,
    microchip_number: data.microchip_number || data.microchipNumber,
    tag_number: data.tag_number || data.tagNumber,
    external_reference: data.external_reference || data.externalReference,
    notes: data.notes,
    allergies: data.allergies,
    blood_type: data.blood_type || data.bloodType,
    is_deceased: data.is_deceased ?? data.isDeceased ?? false,
    deceased_at: data.deceased_at || data.deceasedAt,
    created_at: data.created_at || data.createdAt,
    updated_at: data.updated_at || data.updatedAt,
  };
}

// Map frontend payload to backend format (camelCase)
function mapPetToBackend(payload: CreateClientPetPayload): any {
  return {
    name: payload.name,
    species: payload.species,
    breed: payload.breed || undefined,
    dateOfBirth: payload.dateOfBirth || undefined,
    sex: payload.sex || 'UNKNOWN',
    isSterilized: payload.isSterilized ?? false,
    color: payload.color || undefined,
    size: payload.size || undefined,
    microchipNumber: payload.microchipNumber || undefined,
    tagNumber: payload.tagNumber || undefined,
    notes: payload.notes || undefined,
    allergies: payload.allergies || undefined,
  };
}

export const petsApi = {
  /**
   * Obtener todas las mascotas de un cliente
   */
  async getClientPets(clientId: string): Promise<Pet[]> {
    try {
      const data = await (apiClient as any).get(
      `/clients/${clientId}/pets`,
      );
      const pets = Array.isArray(data) ? data : (data?.pets || data?.data || []);
      return pets
        .filter((pet: any) => pet != null && typeof pet === 'object' && 'id' in pet)
        .map(mapPetFromBackend);
    } catch (error) {
      console.error('[pets-api] getClientPets error:', error);
      return [];
    }
  },

  /**
   * Crear nueva mascota
   */
  async createPet(
    clientId: string,
    payload: CreateClientPetPayload,
  ): Promise<Pet> {
    try {
      const backendPayload = mapPetToBackend(payload);
      const data = await (apiClient as any).post(
      `/clients/${clientId}/pets`,
        backendPayload,
      );
      if (data && typeof data === 'object' && 'id' in data) {
        return mapPetFromBackend(data);
      }
      throw new Error('Invalid pet response from server');
    } catch (error) {
      console.error('Error creating pet:', error);
      throw error;
    }
  },

  /**
   * Actualizar mascota
   */
  async updatePet(
    clientId: string,
    petId: string,
    payload: Partial<CreateClientPetPayload>,
  ): Promise<Pet> {
    try {
      const backendPayload = mapPetToBackend(payload as CreateClientPetPayload);
      const data = await (apiClient as any).patch(
        `/clients/${clientId}/pets/${petId}`,
        backendPayload,
      );
      return mapPetFromBackend(data);
    } catch (error) {
      console.error('Error updating pet:', error);
      throw error;
    }
  },

  /**
   * Eliminar mascota
   */
  async deletePet(clientId: string, petId: string): Promise<void> {
    try {
      await (apiClient as any).delete(
        `/clients/${clientId}/pets/${petId}`,
      );
    } catch (error) {
      console.error('Error deleting pet:', error);
      throw error;
    }
  },
};
