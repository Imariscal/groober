'use client';

import { useEffect, useState } from 'react';
import { MdCheckCircle, MdErrorOutline, MdWarning } from 'react-icons/md';
import { stylistsApi, StylistAvailability, StylistUnavailablePeriod, StylistCapacity } from '@/api/stylists-api';
import { veterinariansApi } from '@/api/veterinarians-api';
import { format, subMinutes, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface StylistDetailCardProps {
  stylistId: string;
  clinicId: string;
  stylistName: string;
  stylistType: 'CLINIC' | 'HOME';
  appointmentDate?: Date;
  appointmentStartTime?: string;
  appointmentEndTime?: string;
  onConfigurationStatusChange?: (isConfigured: boolean) => void;
  isVeterinarian?: boolean;
}

const DAYS_OF_WEEK = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const UNAVAILABLE_REASONS: Record<string, { emoji: string; label: string; badge: string }> = {
  VACATION: { emoji: '🏖️', label: 'Vacaciones', badge: 'bg-blue-100 text-blue-700' },
  SICK_LEAVE: { emoji: '🤒', label: 'Médica', badge: 'bg-red-100 text-red-700' },
  REST_DAY: { emoji: '😴', label: 'Descanso', badge: 'bg-yellow-100 text-yellow-700' },
  PERSONAL: { emoji: '👤', label: 'Personal', badge: 'bg-purple-100 text-purple-700' },
  OTHER: { emoji: '⏸️', label: 'No Disponible', badge: 'bg-gray-100 text-gray-700' },
};

export function StylistDetailCard({
  stylistId,
  clinicId,
  stylistName,
  stylistType,
  appointmentDate,
  appointmentStartTime,
  appointmentEndTime,
  onConfigurationStatusChange,
  isVeterinarian,
}: StylistDetailCardProps) {
  const [availabilities, setAvailabilities] = useState<StylistAvailability[]>([]);
  const [unavailablePeriods, setUnavailablePeriods] = useState<StylistUnavailablePeriod[]>([]);
  const [capacities, setCapacities] = useState<StylistCapacity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Check if stylist has required configuration (at least working hours)
  const isFullyConfigured = availabilities.filter(a => a.is_active).length > 0;

  useEffect(() => {
    loadStylistDetails();
  }, [stylistId, clinicId]);

  const loadStylistDetails = async () => {
    try {
      setIsLoading(true);
      
      let availData, unavailData, capacityData;
      
      if (isVeterinarian) {
        // Load veterinarian data
        [availData, unavailData, capacityData] = await Promise.all([
          veterinariansApi.listAvailabilities(clinicId, stylistId),
          veterinariansApi.listUnavailablePeriods(clinicId, stylistId),
          veterinariansApi.listCapacities(clinicId, stylistId).catch(() => []), // Veterinarians may not have capacities
        ]);
      } else {
        // Load stylist data
        [availData, unavailData, capacityData] = await Promise.all([
          stylistsApi.listAvailabilities(clinicId, stylistId),
          stylistsApi.listUnavailablePeriods(clinicId, stylistId),
          stylistsApi.listCapacities(clinicId, stylistId),
        ]);
      }

      const loadedAvailabilities = availData || [];
      setAvailabilities(loadedAvailabilities);
      setUnavailablePeriods(unavailData || []);
      setCapacities(capacityData || []);
      
      // Notify parent immediately after loading data
      const hasActiveAvailabilities = loadedAvailabilities.filter((a: StylistAvailability) => a.is_active).length > 0;
      onConfigurationStatusChange?.(hasActiveAvailabilities);
    } catch (error) {
      console.error('Error loading staff details:', error);
      toast.error(isVeterinarian ? 'Error al cargar detalles del veterinario' : 'Error al cargar detalles del estilista');
      // Notify parent that configuration check failed
      onConfigurationStatusChange?.(false);
    } finally {
      setIsLoading(false);
    }
  };

  const getAvailabilityForDay = (dayOfWeek: number) => {
    return availabilities.find((a) => a.day_of_week === dayOfWeek && a.is_active);
  };

  const getUnavailableForDate = (date: Date) => {
    return unavailablePeriods.filter((p) => {
      // Use parseISO to correctly parse YYYY-MM-DD dates without timezone shifts
      const startDate = parseISO(p.start_date);
      const endDate = parseISO(p.end_date);
      return date >= startDate && date <= endDate;
    });
  };

  const getCapacityForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return capacities.find((c) => c.date === dateStr);
  };

  const checkAvailabilityForAppointment = () => {
    if (!appointmentDate || !appointmentStartTime || !appointmentEndTime) {
      return null;
    }

    const dayOfWeek = appointmentDate.getDay();
    const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const unavailableToday = getUnavailableForDate(appointmentDate);
    if (unavailableToday.length > 0) {
      return {
        available: false,
        reason: `No disponible: ${unavailableToday.map((u) => UNAVAILABLE_REASONS[u.reason]?.label || u.reason).join(', ')}`,
        priority: 'critical',
      };
    }

    const dayAvailability = getAvailabilityForDay(adjustedDay);
    if (!dayAvailability) {
      return {
        available: false,
        reason: 'Sin horario configurado',
        priority: 'warning',
      };
    }

    const appointStart = appointmentStartTime;

    // Allow appointment to START up to 15 minutes before closing
    const lastAllowedStart = subMinutes(parseISO(`2000-01-01T${dayAvailability.end_time}`), 15);
    const lastAllowedStartStr = format(lastAllowedStart, 'HH:mm');

    if (appointStart < dayAvailability.start_time || appointStart > lastAllowedStartStr) {
      return {
        available: false,
        reason: `Fuera de horario (${dayAvailability.start_time} - ${lastAllowedStartStr})`,
        priority: 'warning',
      };
    }

    return {
      available: true,
      reason: 'Disponible para esta cita',
      priority: 'success',
    };
  };

  const appointmentCheckResult = checkAvailabilityForAppointment();

  if (isLoading) {
    return (
      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 animate-pulse">
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  // If stylist is not fully configured, show error state
  if (!isFullyConfigured) {
    return (
      <div className="border border-red-200 rounded-lg overflow-hidden bg-red-50">
        <div className="bg-red-100 border-b border-red-200 p-3">
          <div className="flex items-center gap-2">
            <MdErrorOutline className="w-5 h-5 text-red-600" />
            <h4 className="font-semibold text-red-800">
              {isVeterinarian ? 'Veterinario no configurado' : 'Estilista no configurado'}
            </h4>
          </div>
        </div>
        <div className="p-4 text-sm text-red-700 space-y-2">
          <p className="font-medium">
            {isVeterinarian 
              ? 'Este veterinario no puede ser asignado porque le falta:'
              : 'Este estilista no puede ser asignado porque le falta:'}
          </p>
          <ul className="list-disc list-inside space-y-1 ml-0">
            {availabilities.filter(a => a.is_active).length === 0 && (
              <li>Horarios de trabajo configurados (requerido)</li>
            )}
          </ul>
          <p className="text-xs text-red-600 mt-3">
            {isVeterinarian 
              ? 'Por favor, configura los horarios de trabajo del veterinario antes de intentar asignarlo a una cita.'
              : 'Por favor, configura la información del estilista antes de intentar asignarlo a una cita.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
      {/* Header with Status */}
      <div className="bg-gradient-to-r from-purple-50 to-purple-100 border-b border-purple-200 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-bold">
              {stylistName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h4 className="font-semibold text-sm text-gray-900">{stylistName}</h4>
              <p className="text-xs text-gray-600">{stylistType === 'CLINIC' ? '🏥 Clínica' : '🏠 Domicilio'}</p>
            </div>
          </div>

          {appointmentCheckResult && (
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                appointmentCheckResult.priority === 'success'
                  ? 'bg-green-100 text-green-700'
                  : appointmentCheckResult.priority === 'critical'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-amber-100 text-amber-700'
              }`}
            >
              {appointmentCheckResult.priority === 'success' && <MdCheckCircle className="w-3 h-3" />}
              {appointmentCheckResult.priority === 'critical' && <MdErrorOutline className="w-3 h-3" />}
              {appointmentCheckResult.priority === 'warning' && <MdWarning className="w-3 h-3" />}
              {appointmentCheckResult.reason}
            </div>
          )}
        </div>
      </div>

      {/* Content Grid - 3 columns */}
      <div className="grid grid-cols-3 gap-4 p-3 text-xs">
        {/* Column 1: Horarios de Trabajo */}
        <div className="space-y-1">
          <h5 className="font-semibold text-gray-700 flex items-center gap-1 mb-2">
            📅 Horarios
          </h5>
          {availabilities.filter(a => a.is_active).length > 0 ? (
            <div className="space-y-1">
              {availabilities
                .filter((a) => a.is_active)
                .sort((a, b) => a.day_of_week - b.day_of_week)
                .map((avail) => (
                  <div key={avail.id} className="flex items-center justify-between p-1 bg-gray-50 rounded">
                    <span className="font-medium text-gray-700 truncate">{DAYS_OF_WEEK[avail.day_of_week]}</span>
                    <span className="text-gray-600 whitespace-nowrap text-xs">
                      {avail.start_time}-{avail.end_time}
                    </span>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">Sin horarios</p>
          )}
        </div>

        {/* Column 2: Períodos No Disponibles */}
        <div className="space-y-1">
          <h5 className="font-semibold text-gray-700 flex items-center gap-1 mb-2">
            ⛔ No Disponible {unavailablePeriods.length > 0 && <span className="inline-flex items-center justify-center w-5 h-5 bg-red-100 text-red-700 rounded-full text-xs font-bold">{unavailablePeriods.length}</span>}
          </h5>
          {unavailablePeriods.length > 0 ? (
            <div className="space-y-1">
              {unavailablePeriods
                .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
                .slice(0, 5) // Show top 5
                .map((period) => {
                  const reasonInfo = UNAVAILABLE_REASONS[period.reason];
                  return (
                    <div key={period.id} className={`p-1 rounded text-xs ${reasonInfo.badge}`}>
                      <div className="flex items-center gap-1">
                        <span>{reasonInfo.emoji} {reasonInfo.label}</span>
                        <span className="text-xs">
                          {format(new Date(period.start_date), 'd/M')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              {unavailablePeriods.length > 5 && (
                <p className="text-gray-500 text-xs italic">+{unavailablePeriods.length - 5} más</p>
              )}
            </div>
          ) : (
            <p className="text-gray-500 italic">Sin restricciones</p>
          )}
        </div>

        {/* Column 3: Capacidad Diaria */}
        <div className="space-y-1">
          <h5 className="font-semibold text-gray-700 flex items-center gap-1 mb-2">
            📊 Capacidad
          </h5>
          {capacities.some(c => c.max_appointments > 0) ? (
            <div className="space-y-1">
              {capacities
                .filter(c => c.max_appointments > 0)
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 5) // Show top 5
                .map((capacity) => (
                  <div
                    key={capacity.id}
                    className="flex items-center justify-between p-1 bg-blue-50 rounded"
                  >
                    <span className="text-gray-700">{format(new Date(capacity.date), 'd MMM', { locale: es })}</span>
                    <span className="text-blue-700 font-semibold">{capacity.max_appointments}️</span>
                  </div>
                ))}
              {capacities.filter(c => c.max_appointments > 0).length > 5 && (
                <p className="text-gray-500 text-xs italic">+{capacities.filter(c => c.max_appointments > 0).length - 5} más</p>
              )}
            </div>
          ) : (
            <p className="text-gray-500 italic">Sin límite</p>
          )}
        </div>
      </div>
    </div>
  );
}
