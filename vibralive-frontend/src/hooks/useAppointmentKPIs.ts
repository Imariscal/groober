'use client';

import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/lib/reports-api';

export interface AppointmentKPIs {
  pagados: {
    total: number;
    cantidad: number;
    monto: number;
  };
  porPagar: {
    total: number;
    cantidad: number;
    monto: number;
  };
  cancelados: {
    total: number;
    cantidad: number;
    monto: number;
    porcentaje: number;
  };
}

/**
 * Hook para obtener KPIs de citas por estado de pago
 * - Pagadas: paid = true
 * - Por Pagar: paid = false AND status != 'CANCELLED'
 * - Canceladas: status = 'CANCELLED'
 */
export function useAppointmentKPIs({ 
  period = 'month',
}: { 
  period?: 'today' | 'week' | 'month' | 'year' | 'custom';
} = {}) {
  return useQuery({
    queryKey: ['appointment-kpis', period],
    queryFn: async () => {
      try {
        // Obtener citas pagadas (paid = true)
        const paidRes = await reportsApi.getAppointmentsReport({
          period,
          paid: true,
        });

        // Obtener citas por pagar (paid = false, no canceladas)
        const pendingRes = await reportsApi.getAppointmentsReport({
          period,
          paid: false,
          excludeStatuses: ['CANCELLED'],
        });

        // Obtener citas canceladas
        const cancelledRes = await reportsApi.getAppointmentsReport({
          period,
          statuses: ['CANCELLED'],
        });

        // Calcular totales desde appointments
        const paidAppointments = paidRes?.appointments || [];
        const pendingAppointments = pendingRes?.appointments || [];
        const cancelledAppointments = cancelledRes?.appointments || [];

        const paidCount = paidAppointments.length;
        const paidAmount = paidAppointments.reduce((sum, apt: any) => sum + (apt.totalAmount || 0), 0);

        const pendingCount = pendingAppointments.length;
        const pendingAmount = pendingAppointments.reduce((sum, apt: any) => sum + (apt.totalAmount || 0), 0);

        const cancelledCount = cancelledAppointments.length;
        const cancelledAmount = cancelledAppointments.reduce((sum, apt: any) => sum + (apt.totalAmount || 0), 0);

        const totalAppointments = paidCount + pendingCount + cancelledCount;
        const cancelledPercentage = totalAppointments > 0 
          ? Math.round((cancelledCount / totalAppointments) * 100)
          : 0;

        return {
          pagados: {
            total: paidCount,
            cantidad: paidCount,
            monto: paidAmount,
          },
          porPagar: {
            total: pendingCount,
            cantidad: pendingCount,
            monto: pendingAmount,
          },
          cancelados: {
            total: cancelledCount,
            cantidad: cancelledCount,
            monto: cancelledAmount,
            porcentaje: cancelledPercentage,
          },
        } as AppointmentKPIs;
      } catch (error) {
        console.error('Error fetching appointment KPIs:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook para obtener citas canceladas con detalles
 */
export function useCancelledAppointments({
  startDate,
  endDate,
  locationType,
}: {
  startDate?: string;
  endDate?: string;
  locationType?: 'CLINIC' | 'HOME';
} = {}) {
  return useQuery({
    queryKey: ['cancelled-appointments', startDate, endDate, locationType],
    queryFn: async () => {
      try {
        const res = await reportsApi.getAppointmentsReport({
          period: 'month',
          statuses: ['CANCELLED'],
          startDate,
          endDate,
          locationType,
        });

        // Enriquecer con información de cancelación
        return (res?.appointments || []).map((apt: any) => ({
          id: apt.id,
          clientId: apt.clientId,
          clientName: apt.clientName || 'Sin nombre',
          petName: apt.petName || 'Sin mascota',
          serviceType: apt.service,
          serviceName: apt.serviceName || apt.service || 'Servicio',
          date: apt.scheduledAt || new Date().toISOString(),
          cancelledAt: apt.cancelledAt,
          cancellationReason: apt.cancellationReason || 'Sin especificar',
          amount: apt.totalAmount || 0,
        }));
      } catch (error) {
        console.error('Error fetching cancelled appointments:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
  });
}
