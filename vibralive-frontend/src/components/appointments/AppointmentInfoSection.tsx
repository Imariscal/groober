'use client';

import { Appointment } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MdPets, MdPerson, MdPhone, MdEmail, MdCalendarToday, MdAccessTime, MdContentCut } from 'react-icons/md';
import { utcToZonedTime } from 'date-fns-tz';
import { useClinicTimezone } from '@/hooks/useClinicTimezone';

interface AppointmentInfoSectionProps {
  appointment: Appointment;
  compact?: boolean; // Si true, mostra info reducida
}

/**
 * Componente reutilizable para mostrar información completa de una cita
 * Incluye: cliente, mascota, servicios, fecha, hora
 */
export function AppointmentInfoSection({
  appointment,
  compact = false,
}: AppointmentInfoSectionProps) {
  const clinicTimezone = useClinicTimezone();
  
  if (!appointment) return null;

  const scheduledAt = utcToZonedTime(new Date(appointment.scheduled_at), clinicTimezone);
  const locationType = appointment.location_type === 'HOME' ? '🏠 Domicilio' : '🏥 Clínica';

  return (
    <div className={`bg-slate-50 rounded-lg border border-slate-200 space-y-3 ${compact ? 'p-3' : 'p-4'}`}>
      {/* Cliente */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <MdPerson className={`text-slate-600 ${compact ? 'w-4 h-4' : 'w-5 h-5'}`} />
          <p className={`font-semibold text-slate-700 ${compact ? 'text-xs' : 'text-sm'}`}>
            Cliente
          </p>
        </div>
        <div className={`${compact ? 'text-xs' : 'text-sm'} space-y-1`}>
          <p className="font-medium text-slate-900">{appointment.client?.name || 'N/A'}</p>
          {!compact && appointment.client?.phone && (
            <p className="flex items-center gap-1 text-slate-600">
              <MdPhone className="w-3 h-3" /> {appointment.client.phone}
            </p>
          )}
          {!compact && appointment.client?.email && (
            <p className="flex items-center gap-1 text-slate-600 truncate">
              <MdEmail className="w-3 h-3" /> {appointment.client.email}
            </p>
          )}
          {/* Mostrar dirección SI es HOME */}
          {!compact && appointment.location_type === 'HOME' && appointment.address && (
            <div className="mt-2 pt-2 border-t border-slate-300 space-y-1">
              <p className="font-semibold text-slate-700 text-xs uppercase">📍 Dirección</p>
              <p className="text-slate-700">
                {appointment.address.street}
                {appointment.address.number_ext && ` #${appointment.address.number_ext}`}
              </p>
              {appointment.address.neighborhood && (
                <p className="text-slate-600">{appointment.address.neighborhood}</p>
              )}
              {appointment.address.city && (
                <p className="text-slate-600">{appointment.address.city}, {appointment.address.state}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mascota */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <MdPets className={`text-slate-600 ${compact ? 'w-4 h-4' : 'w-5 h-5'}`} />
          <p className={`font-semibold text-slate-700 ${compact ? 'text-xs' : 'text-sm'}`}>
            Mascota
          </p>
        </div>
        <p className={`font-medium text-slate-900 ${compact ? 'text-xs' : 'text-sm'}`}>
          {appointment.pet?.name || 'N/A'}
        </p>
      </div>

      {/* Servicios */}
      {appointment.appointmentItems && appointment.appointmentItems.length > 0 && !compact && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <MdContentCut className="w-5 h-5 text-slate-600" />
            <p className="font-semibold text-slate-700 text-sm">
              Servicios
            </p>
          </div>
          <div className="space-y-1">
            {appointment.appointmentItems.map((item) => (
              <div key={item.id} className="text-xs text-slate-700 bg-white rounded px-2 py-1">
                {item.service?.name || item.package?.name || 'Servicio'} 
                {item.quantity > 1 && ` x${item.quantity}`}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fecha, Hora y Duración */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <MdCalendarToday className={`text-slate-600 ${compact ? 'w-4 h-4' : 'w-5 h-5'}`} />
          <p className={`font-semibold text-slate-700 ${compact ? 'text-xs' : 'text-sm'}`}>
            Fecha y Hora
          </p>
        </div>
        <div className={`space-y-0.5 ${compact ? 'text-xs' : 'text-sm'}`}>
          <p className="text-slate-900">
            {format(scheduledAt, "EEEE d 'de' MMMM, yyyy", { locale: es })}
          </p>
          <p className="flex items-center gap-1 text-slate-600">
            <MdAccessTime className="w-3 h-3" />
            {format(scheduledAt, 'HH:mm')} ({appointment.duration_minutes || 30} min)
          </p>
        </div>
      </div>

      {/* Tipo de Ubicación */}
      <div className="pt-2 border-t border-slate-200">
        <p className={`font-medium text-slate-700 ${compact ? 'text-xs' : 'text-sm'}`}>
          {locationType}
        </p>
      </div>
    </div>
  );
}
