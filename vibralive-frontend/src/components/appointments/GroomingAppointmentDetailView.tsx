'use client';

import { useState, useEffect } from 'react';
import { Appointment } from '@/types';
import { format, addMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import { utcToZonedTime } from 'date-fns-tz';
import { useClinicTimezone } from '@/hooks/useClinicTimezone';
import { pricingApi, AppointmentPricing } from '@/api/pricing-api';
import { clinicUsersApi } from '@/api/clinic-users-api';
import { MdPhone, MdEmail, MdLocationOn, MdPerson, MdPets, MdAccessTime, MdCreditCard, MdEdit } from 'react-icons/md';
import { toast } from 'react-hot-toast';

interface GroomingAppointmentDetailViewProps {
  appointment: Appointment;
}

/**
 * Componente para mostrar detalles de una cita de grooming
 * 
 * Features:
 * - Información de cliente (nombre, teléfono, email)
 * - Información de mascota (nombre, especie, raza, tamaño, sexo, color)
 * - Servicios y precios
 * - Fecha, hora inicio, hora fin, duración
 * - Estado y notas
 * - Estilista asignado
 * - Botones de acciones (editar, cancelar, completar, etc)
 */
export function GroomingAppointmentDetailView({
  appointment,
}: GroomingAppointmentDetailViewProps) {
  const clinicTimezone = useClinicTimezone();
  const [pricingData, setPricingData] = useState<AppointmentPricing | null>(null);
  const [loadingPricing, setLoadingPricing] = useState(false);
  const [stylistName, setStylistName] = useState<string | null>(null);

  // Cargar servicios y precios
  useEffect(() => {
    const loadPricing = async () => {
      if (!appointment.id) return;

      setLoadingPricing(true);
      try {
        const data = await pricingApi.getAppointmentPricing(appointment.id);
        setPricingData(data);
      } catch (error) {
        console.error('Error loading pricing:', error);
        toast.error('Error al cargar los precios');
      } finally {
        setLoadingPricing(false);
      }
    };

    loadPricing();
  }, [appointment.id]);

  // Cargar nombre del estilista
  useEffect(() => {
    const loadStylistName = async () => {
      if (!appointment.assigned_staff_user_id) return;

      try {
        const user = await clinicUsersApi.getUser(appointment.assigned_staff_user_id);
        setStylistName(user?.name || null);
      } catch (error) {
        console.error('Error loading stylist:', error);
      }
    };

    loadStylistName();
  }, [appointment.assigned_staff_user_id]);

  const scheduledAt = utcToZonedTime(new Date(appointment.scheduled_at), clinicTimezone);
  const endTime = addMinutes(scheduledAt, appointment.duration_minutes || 30);
  const isHome = appointment.location_type === 'HOME';

  // Status badge styling
  const getStatusBadge = (status: string) => {
    const styles: { [key: string]: { bg: string; text: string; label: string } } = {
      SCHEDULED: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Programada' },
      CONFIRMED: { bg: 'bg-green-100', text: 'text-green-700', label: 'Confirmada' },
      IN_PROGRESS: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'En progreso' },
      COMPLETED: { bg: 'bg-green-100', text: 'text-green-700', label: 'Completada' },
      CANCELLED: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelada' },
      NO_SHOW: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'No asistió' },
    };
    const style = styles[status] || styles.SCHEDULED;
    return style;
  };

  const statusStyle = getStatusBadge(appointment.status);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Main Info Card */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column - Pet & Client Info */}
          <div className="space-y-4">
            {/* Pet Info */}
            <div className="flex items-start gap-4">
              <div className="text-4xl">{getPetEmoji(appointment.pet?.species)}</div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-slate-900">{appointment.pet?.name}</h3>
                <p className="text-slate-600">
                  {appointment.pet?.breed || '-'} • {getSpeciesName(appointment.pet?.species)}
                </p>
                {appointment.pet?.color && (
                  <p className="text-sm text-slate-500">Color: {appointment.pet.color}</p>
                )}
              </div>
            </div>

            {/* Client Info */}
            {appointment.client && (
              <div className="border-t border-slate-200 pt-4 mt-4">
                <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <MdPerson size={16} />
                  Cliente
                </h4>
                <div className="space-y-2">
                  <p className="font-medium text-slate-900">{appointment.client.name}</p>
                  {appointment.client.phone && (
                    <p className="text-sm text-slate-600 flex items-center gap-2">
                      <MdPhone size={14} />
                      {appointment.client.phone}
                    </p>
                  )}
                  {appointment.client.email && (
                    <p className="text-sm text-slate-600 flex items-center gap-2">
                      <MdEmail size={14} />
                      {appointment.client.email}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Appointment Details */}
          <div className="space-y-4">
            {/* Status Badge */}
            <div className={`${statusStyle.bg} ${statusStyle.text} px-4 py-2 rounded-lg font-semibold text-sm w-fit`}>
              {statusStyle.label}
            </div>

            {/* Date & Time */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <MdAccessTime size={16} />
                Fecha y Hora
              </h4>
              <div className="space-y-1 ml-6">
                <p className="font-medium text-slate-900">
                  {format(scheduledAt, 'EEEE, d MMMM yyyy', { locale: es })}
                </p>
                <p className="text-slate-600">
                  {format(scheduledAt, 'HH:mm', { locale: es })} - {format(endTime, 'HH:mm', { locale: es })}
                </p>
                {appointment.duration_minutes && (
                  <p className="text-sm text-slate-500">
                    Duración: {appointment.duration_minutes} minutos
                  </p>
                )}
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <MdLocationOn size={16} />
                Ubicación
              </h4>
              <p className="text-slate-900 font-medium ml-6">
                {isHome ? '🏠 A domicilio' : '🏢 En clínica'}
              </p>
              {isHome && appointment.client?.address && (
                <p className="text-sm text-slate-600 ml-6">{appointment.client.address}</p>
              )}
            </div>

            {/* Stylist */}
            {stylistName && (
              <div className="space-y-2 border-t border-slate-200 pt-4 mt-4">
                <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <MdPerson size={16} />
                  Estilista
                </h4>
                <p className="text-slate-900 font-medium ml-6">{stylistName}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Services & Pricing */}
      {!loadingPricing && pricingData && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <MdCreditCard size={20} />
            Servicios y Precios
          </h3>

          {pricingData.items && pricingData.items.length > 0 ? (
            <div className="space-y-2">
              {pricingData.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="font-medium text-slate-900">{item.serviceName}</p>
                    <p className="text-sm text-slate-500">Q: {item.quantity}</p>
                  </div>
                  <p className="font-semibold text-slate-900">
                    ${item.subtotal.toFixed(2)}
                  </p>
                </div>
              ))}
              <div className="pt-3 mt-3 flex justify-between items-center border-t-2 border-slate-200">
                <p className="font-bold text-slate-900">Total</p>
                <p className="text-xl font-bold text-primary-600">
                  ${(pricingData.totalAmount || 0).toFixed(2)}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-slate-500 text-center py-6">Sin servicios asignados</p>
          )}
        </div>
      )}

      {/* Notes */}
      {appointment.notes && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-3">📝 Notas</h3>
          <p className="text-slate-700 whitespace-pre-wrap">{appointment.notes}</p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// HELPERS
// ============================================================================

function getPetEmoji(species?: string): string {
  if (!species) return '🐾';
  const map: { [key: string]: string } = {
    DOG: '🐕',
    CAT: '🐱',
    BIRD: '🐦',
    RABBIT: '🐰',
    HAMSTER: '🐹',
    GUINEA_PIG: '🐹',
    FISH: '🐠',
    TURTLE: '🐢',
    FERRET: '🦝',
    OTHER: '🐾',
  };
  return map[species] || '🐾';
}

function getSpeciesName(species?: string): string {
  if (!species) return 'Mascota';
  const names: { [key: string]: string } = {
    DOG: 'Perro',
    CAT: 'Gato',
    BIRD: 'Ave',
    RABBIT: 'Conejo',
    HAMSTER: 'Hámster',
    GUINEA_PIG: 'Cobaya',
    FISH: 'Pez',
    TURTLE: 'Tortuga',
    FERRET: 'Hurón',
    OTHER: 'Otro',
  };
  return names[species] || 'Mascota';
}