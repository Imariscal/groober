/**
 * Addresses API Service
 * Capa de abstracción para CRUD de direcciones del cliente
 */

import axios from 'axios';
import { apiClient } from './api-client';
import {
  ClientAddress,
  CreateClientAddressPayload,
  UpdateClientAddressPayload,
} from '@/types';
import toast from 'react-hot-toast';

export const addressesApi = {
  /**
   * Obtener todas las direcciones de un cliente
   */
  async getClientAddresses(clientId: string): Promise<ClientAddress[]> {
    console.log('[addresses-api] getClientAddresses CALLED with clientId:', clientId);
    try {
      const url = `/clients/${clientId}/addresses`;
      console.log('[addresses-api] Fetching URL:', url);
      const data = await (apiClient as any).get(url);
      console.log('[addresses-api] Raw response:', data);
      const result = Array.isArray(data) ? data.filter((addr) => addr != null && typeof addr === 'object' && 'id' in addr) : [];
      console.log('[addresses-api] Filtered result count:', result.length);
      return result;
    } catch (error) {
      console.error('[addresses-api] getClientAddresses error:', error);
      return [];
    }
  },

  /**
   * Crear nueva dirección
   */
  async createAddress(
    clientId: string,
    payload: CreateClientAddressPayload,
  ): Promise<ClientAddress> {
    try {
      const data = await (apiClient as any).post(
        `/clients/${clientId}/addresses`,
        payload,
      );
      if (data && typeof data === 'object' && 'id' in data) {
        return data as ClientAddress;
      }
      throw new Error('Invalid address response from server');
    } catch (error) {
      console.error('Error creating address:', error);
      throw error;
    }
  },

  /**
   * Actualizar dirección
   */
  async updateAddress(
    clientId: string,
    addressId: string,
    payload: UpdateClientAddressPayload,
  ): Promise<ClientAddress> {
    try {
      const data = await (apiClient as any).put(
        `/clients/${clientId}/addresses/${addressId}`,
        payload,
      );
      return data as ClientAddress;
    } catch (error) {
      console.error('Error updating address:', error);
      throw error;
    }
  },

  /**
   * Eliminar dirección
   */
  async deleteAddress(clientId: string, addressId: string): Promise<void> {
    try {
      await (apiClient as any).delete(
        `/clients/${clientId}/addresses/${addressId}`,
      );
    } catch (error) {
      console.error('Error deleting address:', error);
      throw error;
    }
  },

  /**
   * Marcar dirección como default
   */
  async setDefaultAddress(
    clientId: string,
    addressId: string,
  ): Promise<ClientAddress> {
    try {
      const data = await (apiClient as any).post(
        `/clients/${clientId}/addresses/${addressId}/set-default`,
      );
      return data as ClientAddress;
    } catch (error) {
      console.error('Error setting default address:', error);
      throw error;
    }
  },
};
