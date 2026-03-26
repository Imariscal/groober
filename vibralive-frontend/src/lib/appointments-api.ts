/**
 * Appointments API Service
 * Capa de abstracción para CRUD de citas
 */

import axios from 'axios';
import { apiClient } from './api-client';
import {
  Appointment,
  CreateAppointmentPayload,
  UpdateAppointmentPayload,
} from '@/types';
import toast from 'react-hot-toast';

export const appointmentsApi = {
  /**
   * Crear nueva cita
   */
  async createAppointment(
    payload: CreateAppointmentPayload,
  ): Promise<Appointment> {
    try {
      // ApiClient.post returns response.data directly
      const response = await apiClient.post<any>(
        '/appointments',
        payload,
      );
      
      // Handle both wrapped {data: appointment} and direct appointment responses
      const appointment = response?.data || response;
      return appointment as Appointment;
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }
  },

  /**
   * Obtener citas con reintentos en caso de timeout
   */
  async getAppointments(filters?: any, retries = 2): Promise<{
    data: Appointment[];
    total: number;
  }> {
    try {
      const response = await apiClient.get<any>('/appointments', {
        params: filters,
      });
      return response as any;
    } catch (error: any) {
      // Retry on timeout errors
      if (retries > 0 && (error.code === 'ECONNABORTED' || error.message?.includes('timeout'))) {
        console.warn(`[getAppointments] Timeout, retrying... (${retries} retries left)`);
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * (3 - retries)));
        return this.getAppointments(filters, retries - 1);
      }
      
      console.error('Error fetching appointments:', error);
      throw error;
    }
  },

  /**
   * Obtener cita por ID
   */
  async getAppointment(appointmentId: string): Promise<Appointment> {
    try {
      const response = await apiClient.get<Appointment>(
        `/appointments/${appointmentId}`,
      );
      return response as Appointment;
    } catch (error) {
      console.error('Error fetching appointment:', error);
      throw error;
    }
  },

  /**
   * Actualizar cita
   */
  async updateAppointment(
    appointmentId: string,
    payload: UpdateAppointmentPayload,
  ): Promise<Appointment> {
    try {
      const response = await apiClient.put<Appointment>(
        `/appointments/${appointmentId}`,
        payload,
      );
      return response as Appointment;
    } catch (error) {
      console.error('Error updating appointment:', error);
      throw error;
    }
  },

  /**
   * Actualizar estado de cita
   */
  async updateAppointmentStatus(
    appointmentId: string,
    status: string,
    cancellationReason?: string,
  ): Promise<Appointment> {
    try {
      const response = await apiClient.patch<Appointment>(
        `/appointments/${appointmentId}/status`,
        {
          status,
          cancellation_reason: cancellationReason,
        },
      );
      return response as Appointment;
    } catch (error) {
      console.error('Error updating appointment status:', error);
      throw error;
    }
  },

  /**
   * Completar cita (capturar stylist asignado)
   */
  async completeAppointment(
    appointmentId: string,
    performedByUserId?: string,
  ): Promise<Appointment> {
    try {
      const response = await apiClient.put<Appointment>(
        `/appointments/${appointmentId}/complete`,
        {
          performed_by_user_id: performedByUserId,
        },
      );
      return response as Appointment;
    } catch (error) {
      console.error('Error completing appointment:', error);
      throw error;
    }
  },

  /**
   * Planificar rutas de grooming a domicilio
   */
  async planHomeGroomingRoutes(date: string): Promise<any> {
    try {
      const response = await apiClient.post<any>(
        '/appointments/grooming/home/plan-routes',
        { date },
      );
      return response as any;
    } catch (error) {
      console.error('Error planning home grooming routes:', error);
      throw error;
    }
  },

  /**
   * Actualizar servicios, dirección y stylist de una cita existente (modo EDIT)
   */
  async updateAppointmentServices(
    appointmentId: string,
    payload: {
      services?: Array<{ serviceId: string; quantity: number }>;
      address_id?: string;
      assigned_staff_user_id?: string | null; // null = unassign
    },
  ): Promise<Appointment> {
    try {
      const response = await apiClient.put<Appointment>(
        `/appointments/${appointmentId}/services`,
        payload,
      );
      return response as Appointment;
    } catch (error) {
      console.error('Error updating appointment services:', error);
      throw error;
    }
  },

  /**
   * Crear múltiples citas (Batch) para diferentes mascotas en mismo slot
   * POST /pricing/appointments/create-batch-with-pricing
   */
  async createBatchAppointmentWithPricing(payload: {
    clientId: string;
    scheduledAt: string;
    durationMinutes: number;
    locationType: 'CLINIC' | 'HOME';
    serviceType: 'GROOMING' | 'MEDICAL';
    addressId?: string;
    assignedStaffUserId?: string;
    notes?: string;
    pets: Array<{
      petId: string;
      serviceIds: string[];
      quantities: number[];
      packageIds?: string[];
      packageQuantities?: number[];
      reason?: string;
    }>;
  }): Promise<any> {
    try {
      const response = await (apiClient as any).post(
        '/pricing/appointments/create-batch-with-pricing',
        payload,
      );
      return response.data;
    } catch (error) {
      console.error('Error creating batch appointment:', error);
      throw error;
    }
  },

  /**
   * Calcula duración automática para cita grooming
   * POST /appointments/grooming/calculate-duration
   */
  async calculateGroomingDuration(
    payload: { petId: string; serviceIds: string[] }
  ): Promise<{
    calculation: any;
    display: {
      breakdownText: string;
      totalText: string;
      slotLabel: string;
    };
  }> {
    try {
      const response = await apiClient.post<any>(
        '/appointments/grooming/calculate-duration',
        payload,
      );
      
      console.log('[calculateGroomingDuration] Response received:', response);
      
      // Handle both wrapped {data: {...}} and direct response structures
      const data = response?.data || response;
      
      if (!data || !data.calculation) {
        console.error('[calculateGroomingDuration] Invalid response structure:', response);
        throw new Error('Invalid response structure from calculate-duration API');
      }
      
      return data;
    } catch (error) {
      console.error('[calculateGroomingDuration] Error:', error);
      throw error;
    }
  },
};
