'use client';

import { useState, useMemo, useEffect } from 'react';
import { MdClose, MdSchedule, MdCalendarToday, MdAccessTime, MdPets } from 'react-icons/md';
import { format, addMinutes, addDays, parseISO, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { utcToZonedTime } from 'date-fns-tz';
import { Appointment, ClinicConfiguration, ClinicCalendarException } from '@/types';
import { appointmentsApi } from '@/lib/appointments-api';
import { getBusinessHoursForDate, getExceptionForDate, isBookable } from '@/lib/grooming-validation';
import { useClinicTimezone } from '@/hooks/useClinicTimezone';
import { getClinicDateKey, clinicLocalToUtc } from '@/lib/datetime-tz'; 
import toast from 'react-hot-toast';

interface RescheduleAppointmentModalProps {
  isOpen: boolean;
  appointment: Appointment | null;
  config: ClinicConfiguration | null | undefined;
  exceptions: ClinicCalendarException[];
  appointments: Appointment[]; // All appointments to check for conflicts
  onClose: () => void;
  onSuccess: (updatedAppointment: Appointment) => void;
}

/**
 * Modal simple para reprogramar una cita a otra fecha/hora
 * 
 * Features:
 * - Muestra información actual de la cita
 * - Selector de fecha (próximos 30 días)
 * - Grid de horarios disponibles según configuración de clínica
 * - Valida conflictos con otras citas
 */
export function RescheduleAppointmentModal({
  isOpen,
  appointment,
  config,
  exceptions,
  appointments,
  onClose,
  onSuccess,
}: RescheduleAppointmentModalProps) {
  const clinicTimezone = useClinicTimezone();
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen && appointment) {
      // Pre-select the current date and time
      const currentScheduled = utcToZonedTime(new Date(appointment.scheduled_at), clinicTimezone);
      setSelectedDate(format(currentScheduled, 'yyyy-MM-dd'));
      setSelectedTime(format(currentScheduled, 'HH:mm'));
      setError(null);
    }
  }, [isOpen, appointment, clinicTimezone]);

  // Generate time slots for selected date
  const timeSlots = useMemo(() => {
    if (!selectedDate || !config) return [];
    
    const date = parseISO(selectedDate);
    const exception = getExceptionForDate(date, exceptions, clinicTimezone);
    
    // If closed by exception, no slots
    if (exception?.type === 'CLOSED') return [];
    
    // Get business hours (or exception hours if SPECIAL_HOURS)
    let hours = getBusinessHoursForDate(date, config, clinicTimezone);
    if (exception?.type === 'SPECIAL_HOURS' && exception.hours) {
      hours = exception.hours;
    }
    
    if (hours.length === 0) return [];
    
    // Generate 15-minute intervals
    const slots: { time: string; label: string; available: boolean }[] = [];
    
    hours.forEach(({ start, end }) => {
      const [startH, startM] = start.split(':').map(Number);
      const [endH, endM] = end.split(':').map(Number);
      
      let currentMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      
      while (currentMinutes < endMinutes) {
        const h = Math.floor(currentMinutes / 60);
        const m = currentMinutes % 60;
        const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        
        // Check if this slot is available (not occupied by another appointment)
        const isAvailable = checkSlotAvailable(selectedDate, timeStr);
        
        slots.push({
          time: timeStr,
          label: timeStr,
          available: isAvailable,
        });
        
        currentMinutes += 15;
      }
    });
    
    return slots;
  }, [selectedDate, config, exceptions, clinicTimezone, appointments, appointment]);

  // Check if a specific time slot is available
  function checkSlotAvailable(dateStr: string, time: string): boolean {
    if (!appointment) return false;
    
    const durationMinutes = appointment.duration_minutes || 30;
    const locationType = appointment.location_type || 'CLINIC';
    
    // Check if clinic allows overlapping
    const allowsOverlap = (config as any)?.allowAppointmentOverlap ?? false;
    if (allowsOverlap) return true;
    
    // Get appointments for this date (same location type)
    const dateAppointments = appointments.filter((apt) => {
      if (apt.id === appointment.id) return false; // Exclude current appointment
      const aptDate = getClinicDateKey(new Date(apt.scheduled_at), clinicTimezone);
      const sameLocation = (apt.location_type || 'CLINIC') === locationType;
      return aptDate === dateStr && sameLocation;
    });
    
    // Check for overlap
    const [slotH, slotM] = time.split(':').map(Number);
    const slotStart = slotH * 60 + slotM;
    const slotEnd = slotStart + durationMinutes;
    
    for (const apt of dateAppointments) {
      const aptScheduled = utcToZonedTime(new Date(apt.scheduled_at), clinicTimezone);
      const aptStart = aptScheduled.getHours() * 60 + aptScheduled.getMinutes();
      const aptEnd = aptStart + (apt.duration_minutes || 30);
      
      // Check overlap
      if (slotStart < aptEnd && slotEnd > aptStart) {
        return false;
      }
    }
    
    return true;
  }

  if (!isOpen || !appointment) return null;

  const handleReschedule = async () => {
    try {
      setError(null);
      
      if (!selectedDate || !selectedTime) {
        setError('Selecciona fecha y hora');
        return;
      }
      
      // Convert clinic local time to UTC using proper timezone handling
      const newScheduledAt = clinicLocalToUtc(selectedDate, selectedTime, clinicTimezone);
      
      // Validate with isBookable
      const validation = isBookable(
        newScheduledAt,
        appointment.duration_minutes || 30,
        config,
        exceptions,
        clinicTimezone
      );
      
      if (!validation.valid) {
        setError(validation.reason || 'Horario no disponible');
        return;
      }
      
      setIsLoading(true);
      
      // Build payload - explicitly clear staff assignment
      // Don't include assigned_staff_user_id if undefined, or send null to clear it
      const updatePayload: any = {
        scheduled_at: newScheduledAt.toISOString(),
        status: 'SCHEDULED',
        rescheduled_at: new Date().toISOString(),
      };
      
      // Explicitly set assigned_staff_user_id to null to clear any assignment
      // The backend checks: if (dto.assigned_staff_user_id !== undefined)
      // So if it's null, it will clear the assignment
      (updatePayload as any).assigned_staff_user_id = null;
      
      const updated = await appointmentsApi.updateAppointment(appointment.id, updatePayload);
      
      toast.success('Cita reprogramada exitosamente');
      onSuccess(updated);
      handleClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al reprogramar cita';
      setError(message);
      toast.error(message);
      console.error('Error rescheduling appointment:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedDate('');
    setSelectedTime('');
    setError(null);
    onClose();
  };

  // Current appointment info
  const currentScheduled = utcToZonedTime(new Date(appointment.scheduled_at), clinicTimezone);
  const petName = appointment.pet?.name || 'Mascota';
  const serviceName = appointment.service?.name || 'Servicio';

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col transform transition-all duration-300">
          {/* Header */}
          <div className="sticky top-0 z-20 bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 px-8 py-5 flex items-center justify-between border-b border-amber-500 shadow-lg rounded-t-2xl">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1.5">
                <div className="bg-white/20 p-2.5 rounded-lg">
                  <MdSchedule className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">Reprogramar Cita</h2>
              </div>
              <p className="text-amber-100 text-sm font-medium">
                Selecciona una nueva fecha y hora para la cita
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-2.5 transition duration-200 ml-4 flex-shrink-0"
              aria-label="Cerrar"
            >
              <MdClose className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Información de la Cita Actual - Grid 2 columnas */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                <span className="text-lg">📋</span>Información Actual de la Cita
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {/* Cliente - EXPANDIDO a 2 columnas */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 col-span-2">
                  <p className="text-xs font-semibold text-blue-700 uppercase mb-2">👤 Cliente</p>
                  <p className="text-sm font-bold text-gray-900 mb-2">{appointment.client?.name || 'N/A'}</p>
                  <div className="space-y-2">
                    {appointment.client?.phone && (
                      <a href={`tel:${appointment.client.phone}`} className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 bg-blue-100 px-2 py-1 rounded w-fit">
                        <span>📱</span>{appointment.client.phone}
                      </a>
                    )}
                    {appointment.client?.email && (
                      <a href={`mailto:${appointment.client.email}`} className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 bg-blue-100 px-2 py-1 rounded truncate">
                        <span>📧</span>{appointment.client.email}
                      </a>
                    )}
                  </div>
                  {/* Mostrar dirección SI es cita HOME */}
                  {appointment.location_type === 'HOME' && appointment.address && (
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <p className="text-xs font-semibold text-blue-700 uppercase mb-1">📍 Dirección</p>
                      <p className="text-xs text-gray-700">
                        {appointment.address.street}
                        {appointment.address.number_ext && ` #${appointment.address.number_ext}`}
                      </p>
                      {appointment.address.neighborhood && (
                        <p className="text-xs text-gray-600">{appointment.address.neighborhood}</p>
                      )}
                      {appointment.address.city && (
                        <p className="text-xs text-gray-600">{appointment.address.city}, {appointment.address.state}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Mascota */}
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-purple-700 uppercase mb-2">🐾 Mascota</p>
                  <p className="text-sm font-bold text-gray-900 mb-2">{appointment.pet?.name || 'N/A'}</p>
                  <div className="flex flex-wrap gap-1">
                    {appointment.pet?.species && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                        {appointment.pet.species === 'DOG' ? '🐕 Perro' : appointment.pet.species}
                      </span>
                    )}
                    {appointment.pet?.size && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                        {appointment.pet.size}
                      </span>
                    )}
                    {appointment.pet?.sex && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                        {appointment.pet.sex === 'MALE' ? '♂ Macho' : '♀ Hembra'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Hora Actual */}
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-green-700 uppercase mb-2">⏰ Horario Actual</p>
                  <p className="text-sm font-bold text-gray-900 mb-1">
                    {format(currentScheduled, "EEEE d 'de' MMMM", { locale: es })}
                  </p>
                  <p className="text-sm text-gray-600">
                    {format(currentScheduled, 'HH:mm')} - {format(addMinutes(currentScheduled, appointment.duration_minutes || 30), 'HH:mm')}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">({appointment.duration_minutes || 30} minutos)</p>
                </div>

                {/* Duración */}
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-orange-700 uppercase mb-2">⏱️ Duración</p>
                  <p className="text-sm font-bold text-gray-900">{appointment.duration_minutes || 30} minutos</p>
                  <p className="text-xs text-gray-600 mt-1">{Math.floor((appointment.duration_minutes || 30) / 60)}h {(appointment.duration_minutes || 30) % 60}m</p>
                </div>
              </div>
            </div>

            {/* Date Selector */}
            <div className="border-t pt-6">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                <span className="text-lg">📅</span>Nueva Fecha y Hora
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {/* Date Input */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">Selecciona Fecha</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setSelectedTime('');
                    }}
                    min={format(addDays(utcToZonedTime(new Date(), clinicTimezone), 0), 'yyyy-MM-dd')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900 font-medium"
                  />
                </div>

                {/* Time Info */}
                {selectedDate && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-xs font-semibold text-amber-700 uppercase mb-2">Disponibles</p>
                    <p className="text-sm font-bold text-amber-900">
                      {timeSlots.filter(s => s.available).length} horarios
                    </p>
                    <p className="text-xs text-amber-700 mt-1">Intervalos de 15 minutos</p>
                  </div>
                )}
              </div>
            </div>

            {/* Time Slots Grid */}
            {selectedDate && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-4">
                  🕐 Selecciona Horario
                </label>
                {timeSlots.length === 0 ? (
                  <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg text-center border border-gray-200">
                    ℹ️ No hay horarios disponibles para esta fecha
                  </div>
                ) : (
                  <div className="grid grid-cols-6 gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    {timeSlots.map((slot) => (
                      <button
                        key={slot.time}
                        type="button"
                        disabled={!slot.available}
                        onClick={() => setSelectedTime(slot.time)}
                        className={`
                          px-2 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap
                          ${selectedTime === slot.time
                            ? 'bg-amber-500 text-white ring-2 ring-amber-300 shadow-md'
                            : slot.available
                              ? 'bg-white border border-gray-300 hover:border-amber-400 hover:bg-amber-50 text-gray-700 cursor-pointer'
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          }
                        `}
                        title={!slot.available ? 'No disponible' : 'Seleccionar'}
                      >
                        {slot.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-medium">
                <div className="flex items-start gap-3">
                  <span className="text-lg">❌</span>
                  <div>
                    <p className="font-semibold">Error</p>
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-4 border-t-2 border-gray-200 flex justify-between gap-3 rounded-b-2xl">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="px-6 py-3 text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition font-bold text-sm"
            >
              ✕ Cancelar
            </button>
            <button
              type="button"
              onClick={handleReschedule}
              disabled={isLoading || !selectedDate || !selectedTime}
              className={`
                px-8 py-3 rounded-lg text-sm font-bold transition-all flex items-center gap-2
                ${isLoading || !selectedDate || !selectedTime
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-amber-500 text-white hover:bg-amber-600 shadow-md hover:shadow-lg'
                }
              `}
            >
              {isLoading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Reprogramando...
                </>
              ) : (
                <>
                  <MdSchedule className="w-4 h-4" />
                  Reprogramar Cita
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
