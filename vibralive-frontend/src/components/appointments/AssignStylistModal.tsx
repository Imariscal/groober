'use client';

import { useState, useEffect, useMemo } from 'react';
import { MdClose, MdPerson, MdCheckCircle } from 'react-icons/md';
import { Appointment } from '@/types';
import { appointmentsApi } from '@/lib/appointments-api';
import { stylistsApi, StylistAvailability, StylistUnavailablePeriod, StylistCapacity } from '@/api/stylists-api';
import { veterinariansApi } from '@/api/veterinarians-api';
import { useAuth } from '@/hooks/useAuth';
import { useClinicTimezone } from '@/hooks/useClinicTimezone';
import { utcToZonedTime } from 'date-fns-tz';
import { format } from 'date-fns';
import { StylistDetailCard } from './StylistDetailCard';
import { validateStaffCapacity } from '@/lib/staff-capacity-validation';
import toast from 'react-hot-toast';

// Extended stylist interface with availability info for filtering
interface StylistWithAvailability {
  id: string;
  userId: string;
  displayName: string;
  type: 'CLINIC' | 'HOME';
  availabilities: StylistAvailability[];
  unavailablePeriods: StylistUnavailablePeriod[];
  capacities?: StylistCapacity[];
}

interface AssignStylistModalProps {
  isOpen: boolean;
  appointment: Appointment | null;
  appointments?: Appointment[]; // All appointments for conflict checking
  onClose: () => void;
  onSuccess: (updatedAppointment: Appointment) => void;
}

/**
 * Modal para asignar un estilista a una cita
 * 
 * Features:
 * - Campo de entrada para ID o nombre del estilista
 * - Pre-carga estilista ya asignado
 * - Muestra nombre y color del estilista
 * - Validación básica
 * - Actualiza la cita con el estilista asignado
 * - Solo disponible para citas SCHEDULED/CONFIRMED
 */
export function AssignStylistModal({
  isOpen,
  appointment,
  appointments = [],
  onClose,
  onSuccess,
}: AssignStylistModalProps) {
  const { user } = useAuth();
  const clinicId = user?.clinic_id || '';
  const clinicTimezone = useClinicTimezone();
  
  const [stylistId, setStylistId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // All stylists with their availability data (before filtering by date/time)
  const [allStylists, setAllStylists] = useState<StylistWithAvailability[]>([]);
  const [loadingStylists, setLoadingStylists] = useState(false);
  const [selectedStylistName, setSelectedStylistName] = useState<string | null>(null);
  const [stylistIsConfigured, setStylistIsConfigured] = useState<boolean>(false);

  // Format appointment info for display
  // 🎯 FIX: Convert UTC to clinic timezone
  const appointmentDate = appointment?.scheduled_at 
    ? utcToZonedTime(new Date(appointment.scheduled_at), clinicTimezone)
    : null;
  const appointmentTime = appointmentDate?.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) || '';
  const appointmentDateStr = appointmentDate?.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }) || '';
  const duration = appointment?.duration_minutes ? `${appointment.duration_minutes} min` : '30 min';
  const durationMinutes = appointment?.duration_minutes || 30;

  // 🎯 Filter stylists by availability for the appointment date/time
  const stylists = useMemo(() => {
    if (!appointment || !appointmentDate || allStylists.length === 0) {
      return allStylists.map(s => ({ id: s.id, userId: s.userId, displayName: s.displayName, type: s.type }));
    }

    // GROOMING and MEDICAL: Filter both stylists and veterinarians by availability
    // Parse the appointment date and time
    const dateStr = format(appointmentDate, 'yyyy-MM-dd');
    const appointmentStartMinutes = appointmentDate.getHours() * 60 + appointmentDate.getMinutes();
    const appointmentEndMinutes = appointmentStartMinutes + durationMinutes;

    // Get day of week (0=Monday, 6=Sunday for our system, but JS Date uses 0=Sunday)
    const jsDayOfWeek = appointmentDate.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
    // Convert to our system: 0=Monday, ..., 6=Sunday
    const dayOfWeek = jsDayOfWeek === 0 ? 6 : jsDayOfWeek - 1;

    console.log('🔍 [ASSIGN MODAL] Checking availability:', {
      dateStr,
      time: appointmentTime,
      durationMinutes,
      dayOfWeek,
      appointmentStartMinutes,
      appointmentEndMinutes,
    });

    const availableStylists = allStylists.filter(stylist => {
      // 1. Check if stylist works on this day of week
      const dayAvailability = stylist.availabilities.find(
        a => a.day_of_week === dayOfWeek && a.is_active
      );
      
      if (!dayAvailability) {
        console.log(`❌ ${stylist.displayName}: No trabaja el día ${dayOfWeek}`);
        return false;
      }

      // 2. Check if appointment time is within stylist's working hours
      const [startH, startM] = dayAvailability.start_time.split(':').map(Number);
      const [endH, endM] = dayAvailability.end_time.split(':').map(Number);
      const workStartMinutes = startH * 60 + startM;
      const workEndMinutes = endH * 60 + endM;

      if (appointmentStartMinutes < workStartMinutes || appointmentEndMinutes > workEndMinutes) {
        console.log(`❌ ${stylist.displayName}: Fuera de horario laboral (${dayAvailability.start_time}-${dayAvailability.end_time})`);
        return false;
      }

      // 3. Check if stylist has unavailable period on this date
      const isUnavailable = stylist.unavailablePeriods.some(period => {
        const startDate = period.start_date;
        const endDate = period.end_date;
        
        // Check if appointment date is within unavailable period
        if (dateStr >= startDate && dateStr <= endDate) {
          // If it's all day, stylist is unavailable
          if (period.is_all_day) {
            console.log(`❌ ${stylist.displayName}: En periodo no disponible (${period.reason})`);
            return true;
          }
          
          // If it's partial day, check time overlap
          if (period.start_time && period.end_time) {
            const [unavailStartH, unavailStartM] = period.start_time.split(':').map(Number);
            const [unavailEndH, unavailEndM] = period.end_time.split(':').map(Number);
            const unavailStartMinutes = unavailStartH * 60 + unavailStartM;
            const unavailEndMinutes = unavailEndH * 60 + unavailEndM;
            
            // Check if appointment overlaps with unavailable period
            const hasOverlap = appointmentStartMinutes < unavailEndMinutes && appointmentEndMinutes > unavailStartMinutes;
            if (hasOverlap) {
              console.log(`❌ ${stylist.displayName}: Overlap con periodo no disponible (${period.start_time}-${period.end_time})`);
              return true;
            }
          }
        }
        return false;
      });

      if (isUnavailable) {
        return false;
      }

      // 4. Check if stylist has appointment conflict (excluding current appointment)
      const stylistAppointments = appointments.filter(
        apt => apt.assigned_staff_user_id === stylist.userId && 
               apt.status !== 'CANCELLED' &&
               apt.status !== 'NO_SHOW' &&
               apt.id !== appointment.id // Exclude the appointment being assigned
      );

      const hasConflict = stylistAppointments.some(apt => {
        // Parse appointment time in clinic timezone
        let aptStartMinutes: number;
        let aptEndMinutes: number;
        let aptDateStr: string;

        if (clinicTimezone) {
          const aptDate = utcToZonedTime(new Date(apt.scheduled_at), clinicTimezone);
          aptDateStr = format(aptDate, 'yyyy-MM-dd');
          aptStartMinutes = aptDate.getHours() * 60 + aptDate.getMinutes();
          aptEndMinutes = aptStartMinutes + (apt.duration_minutes || 30);
        } else {
          const aptDate = new Date(apt.scheduled_at);
          aptDateStr = format(aptDate, 'yyyy-MM-dd');
          aptStartMinutes = aptDate.getHours() * 60 + aptDate.getMinutes();
          aptEndMinutes = aptStartMinutes + (apt.duration_minutes || 30);
        }

        // Only check appointments on the same date
        if (aptDateStr !== dateStr) {
          return false;
        }

        // Check for time overlap
        const hasOverlap = appointmentStartMinutes < aptEndMinutes && appointmentEndMinutes > aptStartMinutes;
        
        if (hasOverlap) {
          const aptStartTime = `${String(Math.floor(aptStartMinutes / 60)).padStart(2, '0')}:${String(aptStartMinutes % 60).padStart(2, '0')}`;
          const aptEndTime = `${String(Math.floor(aptEndMinutes / 60)).padStart(2, '0')}:${String(aptEndMinutes % 60).padStart(2, '0')}`;
          console.log(`❌ ${stylist.displayName}: Conflicto con cita existente (${aptStartTime}-${aptEndTime})`);
        }
        
        return hasOverlap;
      });

      if (hasConflict) {
        return false;
      }

      // 5. Check if stylist has capacity configured for this date
      const capacityCheck = validateStaffCapacity(
        stylist,
        appointments,
        dateStr,
        'GROOMING' // Stylists handle GROOMING appointments
      );

      if (!capacityCheck.valid) {
        console.log(`❌ ${stylist.displayName}: ${capacityCheck.reason}`);
        return false;
      }

      console.log(`✅ ${stylist.displayName}: Disponible`);
      return true;
    });

    console.log('🎯 [ASSIGN MODAL] Available stylists:', availableStylists.map(s => s.displayName));

    return availableStylists.map(s => ({ id: s.id, userId: s.userId, displayName: s.displayName, type: s.type }));
  }, [allStylists, appointment, appointmentDate, durationMinutes, appointments, clinicTimezone, appointmentTime]);

  // Cargar estilistas cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      loadStylists();
      // Pre-cargar estilista asignado
      if (appointment?.assigned_staff_user_id) {
        setStylistId(appointment.assigned_staff_user_id);
      }
    }
  }, [isOpen, appointment?.assigned_staff_user_id]);

  // Actualizar nombre cuando cambia stylistId
  useEffect(() => {
    if (stylistId && stylists.length > 0) {
      const selected = stylists.find(s => s.userId === stylistId);
      if (selected) {
        setSelectedStylistName(selected.displayName);
      }
    } else {
      setSelectedStylistName(null);
    }
  }, [stylistId, stylists]);

  const loadStylists = async () => {
    try {
      setLoadingStylists(true);
      setError(null);
      
      if (!appointment) {
        setAllStylists([]);
        return;
      }
      
      // Cargar veterinarios para citas MEDICAL, estilistas para GROOMING
      if (appointment.service_type === 'MEDICAL') {
        console.log('📥 [ASSIGN MODAL] Cargando veterinarios para cita MEDICAL');
        const vetsList = await veterinariansApi.listVeterinarians(clinicId);
        console.log('✅ Veterinarios cargados:', vetsList);
        
        // Cargar availability data for each veterinarian
        const vetsWithAvailability = await Promise.all(
          vetsList.map(async (v: any) => {
            try {
              const [availabilities, unavailablePeriods, capacities] = await Promise.all([
                veterinariansApi.listAvailabilities(clinicId, v.id),
                veterinariansApi.listUnavailablePeriods(clinicId, v.id),
                veterinariansApi.listCapacities(clinicId, v.id).catch(() => []), // Capacities optional
              ]);
              return {
                id: v.id,
                userId: v.userId,
                displayName: v.displayName || v.user?.name || 'Veterinario',
                type: 'CLINIC' as const, // Veterinarios siempre en CLINIC
                availabilities: availabilities || [],
                unavailablePeriods: unavailablePeriods || [],
                capacities: capacities || [],
              };
            } catch (err) {
              console.error(`Error loading availability for veterinarian ${v.id}:`, err);
              return {
                id: v.id,
                userId: v.userId,
                displayName: v.displayName || v.user?.name || 'Veterinario',
                type: 'CLINIC' as const,
                availabilities: [],
                unavailablePeriods: [],
                capacities: [],
              };
            }
          })
        );
        
        console.log('🎯 Veterinarios con disponibilidad:', vetsWithAvailability);
        setAllStylists(vetsWithAvailability);
        return;
      }
      
      // Cargar estilistas para citas GROOMING
      const locationType = appointment.location_type;
      console.log('📥 [ASSIGN MODAL] Cargando estilistas para tipo:', locationType);
      
      const stylistsList = await stylistsApi.listStylists(clinicId);
      console.log('✅ Todos los estilistas:', stylistsList);
      
      // Filtrar por tipo de cita
      const filteredByType = stylistsList.filter((s: any) => {
        const matches = s.type === locationType;
        console.log(`  - ${s.displayName || s.user?.name}: type=${s.type}, locationType=${locationType}, matches=${matches}`);
        return matches;
      });

      // Load availability data for each stylist
      const stylistsWithAvailability: StylistWithAvailability[] = await Promise.all(
        filteredByType.map(async (s: any) => {
          try {
            const [availabilities, unavailablePeriods, capacities] = await Promise.all([
              stylistsApi.listAvailabilities(clinicId, s.id),
              stylistsApi.listUnavailablePeriods(clinicId, s.id),
              stylistsApi.listCapacities(clinicId, s.id).catch(() => []), // Capacities optional
            ]);
            return {
              id: s.id,
              userId: s.userId,
              displayName: s.displayName || s.user?.name || 'Unknown',
              type: s.type,
              availabilities: availabilities || [],
              unavailablePeriods: unavailablePeriods || [],
              capacities: capacities || [],
            };
          } catch (err) {
            console.error(`Error loading availability for stylist ${s.id}:`, err);
            return {
              id: s.id,
              userId: s.userId,
              displayName: s.displayName || s.user?.name || 'Unknown',
              type: s.type,
              availabilities: [],
              unavailablePeriods: [],
              capacities: [],
            };
          }
        })
      );
      
      console.log('🎯 Estilistas con disponibilidad:', stylistsWithAvailability);
      setAllStylists(stylistsWithAvailability);
    } catch (err) {
      console.error('Error loading stylists:', err);
      toast.error('Error al cargar estilistas');
      setAllStylists([]);
    } finally {
      setLoadingStylists(false);
    }
  };

  if (!isOpen || !appointment) return null;

  const handleAssign = async () => {
    try {
      setError(null);

      if (!stylistId.trim()) {
        setError('Debes indicar el estilista');
        return;
      }

      setIsLoading(true);

      // stylistId now contains userId directly from dropdown
      await appointmentsApi.updateAppointment(appointment.id, {
        assigned_staff_user_id: stylistId,
      });

      toast.success('Estilista asignado exitosamente');
      onSuccess({
        ...appointment,
        assigned_staff_user_id: stylistId,
      });
      handleClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : `Error al asignar ${appointment?.service_type === 'MEDICAL' ? 'veterinario' : 'estilista'}`;
      setError(message);
      toast.error(message);
      console.error('Error assigning stylist:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStylistId('');
    setSelectedStylistName(null);
    setError(null);
    onClose();
  };

  const alreadyAssigned = !!appointment.assigned_staff_user_id;
  const assignedStylist = stylists.find(s => s.userId === appointment.assigned_staff_user_id);
  // Also check in allStylists for the current assignment (even if not available now)
  const currentAssignedStylist = alreadyAssigned 
    ? (assignedStylist || allStylists.find(s => s.userId === appointment.assigned_staff_user_id))
    : null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] flex flex-col transform transition-all duration-300">
          {/* Header */}
          <div className="sticky top-0 z-20 bg-gradient-to-r from-primary-600 to-primary-700 px-8 py-5 flex items-center justify-between border-b border-primary-600 shadow-lg rounded-t-2xl">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1.5">
                <div className="bg-white/20 p-2.5 rounded-lg">
                  <MdPerson className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">
                  {appointment?.service_type === 'MEDICAL' ? 'Asignar Veterinario' : 'Asignar Estilista'}
                </h2>
              </div>
              <p className="text-primary-100 text-sm font-medium">
                Selecciona quién realizará esta cita
              </p>
            </div>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-2.5 transition duration-200 ml-4 flex-shrink-0"
            >
              <MdClose className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-8 space-y-6 overflow-y-auto flex-1">
            {/* Appointment Info Card */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-5 border border-blue-200">
              <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wide mb-4">📋 Detalles de la cita</h3>
              <div className="grid grid-cols-2 gap-4">
                {/* Cliente - expandido con contacto */}
                <div className="col-span-2">
                  <p className="text-xs text-blue-700 mb-2 font-semibold">👤 Cliente</p>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-blue-900">{appointment?.client?.name || 'N/A'}</p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {appointment?.client?.phone && (
                        <span className="bg-blue-200 text-blue-900 px-2 py-0.5 rounded">📱 {appointment.client.phone}</span>
                      )}
                      {appointment?.client?.email && (
                        <span className="bg-blue-200 text-blue-900 px-2 py-0.5 rounded truncate">📧 {appointment.client.email}</span>
                      )}
                    </div>
                    {appointment?.location_type === 'HOME' && appointment?.address && (
                      <div className="text-xs text-blue-800 bg-blue-100 px-2 py-1 rounded mt-2">
                        📍 {appointment.address.street}{appointment.address.number_ext && ` #${appointment.address.number_ext}`}
                      </div>
                    )}
                  </div>
                </div>

                {/* Mascota */}
                <div>
                  <p className="text-xs text-blue-700 mb-1">Mascota</p>
                  <p className="text-sm font-bold text-blue-900">{appointment?.pet?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-blue-700 mb-1">Duración</p>
                  <p className="text-sm font-bold text-blue-900">{duration}</p>
                </div>

                {/* Fecha y Hora - Full width */}
                <div className="col-span-2">
                  <p className="text-xs text-blue-700 mb-1">Fecha y Hora</p>
                  <p className="text-sm font-bold text-blue-900">{appointmentTime}</p>
                  <p className="text-xs text-blue-700">{appointmentDateStr}</p>
                </div>
              </div>
            </div>

            {/* Current Assignment Info */}
            {alreadyAssigned && currentAssignedStylist && (
              <div className="p-4 bg-green-50/80 border border-green-300 rounded-xl flex items-start gap-3">
                <div className="text-2xl mt-1">✓</div>
                <div>
                  <p className="text-sm font-bold text-green-900">
                    Estilista actual: <span className="text-green-800">{currentAssignedStylist.displayName}</span>
                  </p>
                  <p className="text-xs text-green-700 mt-1">Puedes cambiar el estilista si es necesario</p>
                </div>
              </div>
            )}

            {/* Stylist Selection with Cards */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-gray-100 p-2 rounded-lg">
                  <MdPerson className="text-gray-700" size={18} />
                </div>
                <label className="text-sm font-semibold text-gray-700">
                  Seleccionar estilista *
                </label>
              </div>
              
              {loadingStylists ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                  <div className="animate-spin mb-3">
                    <MdPerson size={32} />
                  </div>
                  <p>Cargando estilistas...</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3 pb-2">
                    {/* Cards de estilistas disponibles */}
                    {stylists.map((stylist) => {
                      const isSelected = stylistId === stylist.userId;
                      const typeEmoji = stylist.type === 'CLINIC' ? '🏥' : '🏠';
                      const typeLabel = stylist.type === 'CLINIC' ? 'Clínica' : 'Domicilio';

                      return (
                        <button
                          key={stylist.id}
                          type="button"
                          onClick={() => {
                            setStylistId(stylist.userId);
                            setStylistIsConfigured(false);
                          }}
                          disabled={isLoading}
                          className={`rounded-lg border transition-all text-left ${
                            isSelected
                              ? 'bg-primary-50 border-primary-500 shadow-md'
                              : 'bg-gray-50 border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300'
                          } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          <div className="p-4">
                            <div className="flex items-start justify-between gap-2 mb-3">
                              <div className="flex items-center gap-2 flex-1">
                                <span className="text-2xl flex-shrink-0">✂️</span>
                                <p className="text-base font-semibold text-gray-900 truncate">{stylist.displayName}</p>
                              </div>
                              {isSelected && (
                                <MdCheckCircle className="text-primary-600 flex-shrink-0" size={20} />
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-600">
                              <span>{typeEmoji}</span>
                              <span>{typeLabel}</span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Show message when no stylists available */}
                  {allStylists.length === 0 && (
                    <p className="text-sm text-gray-500 mt-2">
                      No hay estilistas registrados para tipo {appointment.location_type === 'CLINIC' ? '🏥 Clínica' : '🏠 Domicilio'}
                    </p>
                  )}
                  {allStylists.length > 0 && stylists.length === 0 && (
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
                      <p className="flex items-center gap-2 font-semibold">
                        <span>⚠️</span>
                        No hay estilistas disponibles para este horario
                      </p>
                      <p className="text-xs mt-1">
                        Hay {allStylists.length} estilista(s) de tipo {appointment.location_type === 'CLINIC' ? 'Clínica' : 'Domicilio'}, 
                        pero ninguno está disponible para {appointmentDateStr} a las {appointmentTime}. 
                        Pueden estar ocupados, de vacaciones, o fuera de su horario laboral.
                      </p>
                    </div>
                  )}
                </>
              )}
              
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <span>💡</span>
                {appointment.location_type === 'CLINIC' 
                  ? 'Solo se muestran estilistas de clínica disponibles para este horario'
                  : 'Solo se muestran estilistas de ruta/domicilio disponibles para este horario'
                }
              </p>
            </div>

            {/* Selected Stylist/Veterinarian Preview with Details */}
            {stylistId && (
              (() => {
                const selected = stylists.find(s => s.userId === stylistId);
                if (!selected) return null;
                
                const isVeterinarian = appointment.service_type === 'MEDICAL';
                
                return (
                  <div className="space-y-3 border-t-2 border-gray-200 pt-5">
                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-4">
                      {isVeterinarian ? '🩺 Información del Veterinario' : '📊 Información del Estilista'}
                    </h3>
                    <StylistDetailCard
                      stylistId={selected.id}
                      clinicId={clinicId}
                      stylistName={selected.displayName}
                      stylistType={selected.type}
                      appointmentDate={appointmentDate || undefined}
                      appointmentStartTime={appointmentTime}
                      appointmentEndTime={
                        appointmentDate && appointment?.duration_minutes
                          ? new Date(appointmentDate.getTime() + appointment.duration_minutes * 60000).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                          : undefined
                      }
                      onConfigurationStatusChange={setStylistIsConfigured}
                      isVeterinarian={isVeterinarian}
                    />
                    {!stylistIsConfigured && (
                      <div className="p-4 bg-red-50 border-2 border-red-300 rounded-lg">
                        <div className="flex items-start gap-3">
                          <div className="text-2xl mt-0.5">❌</div>
                          <div>
                            <p className="text-sm font-bold text-red-900 mb-1">No se puede asignar</p>
                            <p className="text-xs text-red-800">
                              {isVeterinarian 
                                ? 'Este veterinario no ha sido completamente configurado. Debe tener horarios de trabajo asignados antes de poder ser seleccionado para citas.'
                                : 'Este estilista no ha sido completamente configurado. Debe tener horarios de trabajo asignados antes de poder ser seleccionado para citas.'
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()
            )}

            {error && (
              <div className="p-4 bg-red-50 border border-red-300 rounded-lg">
                <p className="text-sm text-red-700 font-medium">❌ Error: {error}</p>
              </div>
            )}

            {/* Info Box - Only when no stylists registered at all */}
            {allStylists.length === 0 && !loadingStylists && (
              <div className="p-5 bg-amber-50 border-2 border-amber-300 rounded-lg">
                <p className="text-sm font-bold text-amber-900 flex items-center gap-2 mb-3">
                  <span>⚠️</span>
                  No hay estilistas registrados
                </p>
                <p className="text-xs text-amber-800 mb-3 leading-relaxed">
                  Para poder asignar {appointment?.service_type === 'MEDICAL' ? 'veterinarios' : 'estilistas'} a las citas, primero necesitas:
                </p>
                <ol className="text-xs text-amber-800 space-y-2 ml-4 list-decimal">
                  <li>Ir a la sección <strong>Usuarios</strong></li>
                  <li>Activar el rol <strong>"Estilista"</strong> en el perfil del usuario</li>
                  <li>Configurar sus <strong>horarios de trabajo</strong></li>
                  <li>Guardar los cambios</li>
                </ol>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 flex justify-between gap-3 p-6 border-t-2 border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 rounded-b-2xl">
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="px-6 py-3 text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition font-bold text-sm"
            >
              ✕ Cancelar
            </button>
            <button
              onClick={handleAssign}
              disabled={isLoading || !stylistId.trim() || !stylistIsConfigured}
              title={
                !stylistId.trim() 
                  ? 'Selecciona un estilista' 
                  : !stylistIsConfigured 
                    ? 'El estilista debe estar completamente configurado'
                    : ''
              }
              className={`px-6 py-3 rounded-lg font-bold text-sm transition-all duration-200 flex items-center gap-2 ${
                isLoading || !stylistId.trim() || !stylistIsConfigured
                  ? 'bg-gray-400 text-white cursor-not-allowed opacity-50'
                  : 'bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800 hover:shadow-lg hover:scale-105 active:scale-95'
              }`}
            >
              {isLoading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Asignando...
                </>
              ) : (
                <>
                  <span>✓</span>
                  {appointment?.service_type === 'MEDICAL' ? 'Asignar Veterinario' : 'Asignar Estilista'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
