'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { MdAutoAwesome } from 'react-icons/md';
import { appointmentsApi } from '@/lib/appointments-api';
import { Appointment } from '@/types';
import { MedicalVisitDetailView } from '@/components/ehr/MedicalVisitDetailView';
import { GroomingAppointmentDetailView } from '@/components/appointments/GroomingAppointmentDetailView';

/**
 * Página de detalle de cita
 * 
 * Ruta: /clinic/visits/[appointmentId]
 * 
 * Responsabilidades:
 * - Cargar los detalles completos de la cita
 * - Mostrar historial médico si es cita MEDICAL
 * - Mostrar detalles de grooming si es cita GROOMING
 * - Permitir navegar de vuelta a /clinic/visits
 */
export default function AppointmentDetailPage() {
  const params = useParams();
  const appointmentId = params.appointmentId as string;

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar detalles de la cita
  useEffect(() => {
    const loadAppointment = async () => {
      if (!appointmentId) return;

      try {
        setLoading(true);
        setError(null);
        const data = await appointmentsApi.getAppointment(appointmentId);
        setAppointment(data);
      } catch (err: any) {
        console.error('Error loading appointment:', err);
        setError(err?.message || 'Error al cargar la cita');
      } finally {
        setLoading(false);
      }
    };

    loadAppointment();
  }, [appointmentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin">
            <MdAutoAwesome size={40} className="text-primary-600" />
          </div>
          <p className="text-slate-600">Cargando cita...</p>
        </div>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="text-5xl text-red-500">⚠️</div>
          <p className="text-lg font-semibold text-slate-900">Error al cargar</p>
          <p className="text-slate-600 max-w-md">{error || 'No se encontró la cita'}</p>
        </div>
      </div>
    );
  }

  const isMedical = appointment.service_type === 'MEDICAL';

  return (
    <>
      {isMedical ? (
        <MedicalVisitDetailView appointment={appointment} />
      ) : (
        <GroomingAppointmentDetailView appointment={appointment} />
      )}
    </>
  );
}
