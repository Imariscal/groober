'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { MdClose, MdCalendarToday, MdAccessTime, MdLocationOn, MdPerson, MdPets, MdCheckCircle } from 'react-icons/md';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { Pet, Service, ClientAddress, ServicePackage, ClinicConfiguration, ClinicCalendarException, Appointment, Client } from '@/types';
import { pricingApi } from '@/api/pricing-api';
import { serviceSizePriceApi } from '@/api/service-size-price-api';
import { petsApi } from '@/lib/pets-api';
import { servicesApi } from '@/api/services-api';
import { appointmentsApi } from '@/lib/appointments-api';
import { addressesApi } from '@/lib/addresses-api';
import { packagesApi } from '@/api/packages-api';
import { clientsApi } from '@/lib/clients-api';
import { stylistsApi, StylistAvailability, StylistUnavailablePeriod, StylistCapacity } from '@/api/stylists-api';
import { veterinariansApi } from '@/api/veterinarians-api';
import { FormSelect, FormInput } from '@/components/FormFields';
import { ServicePicker } from './ServicePicker';
import { ClientAutocomplete } from './ClientAutocomplete';
import { ClientFormModal } from '@/components/ClientFormModal';
import { DuplicateAppointmentWarningModal } from './DuplicateAppointmentWarningModal';
import { PartialBatchConflictModal } from './PartialBatchConflictModal';
import { DurationBreakdownCard } from './DurationBreakdownCard';
import { addMinutes, format, parse, parseISO, getDay } from 'date-fns';
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';
import toast from 'react-hot-toast';
import { isBookable, validateCapacity, getBusinessHoursForDate, validateAppointmentConflicts, checkStylistOverlap } from '@/lib/grooming-validation';
import { validateStaffCapacity } from '@/lib/staff-capacity-validation';
import { useClinicTimezone } from '@/hooks/useClinicTimezone';
import { useAuth } from '@/hooks/useAuth';
import { useGroomingDuration } from '@/hooks/useGroomingDuration';
import { getClinicDateKey, clinicLocalToUtc, roundUtcToClinicLocal, displayFormatters } from '@/lib/datetime-tz';

interface UnifiedGroomingModalProps {
  isOpen: boolean;
  scheduledAt: Date | null;
  onClose: () => void;
  onSuccess: () => Promise<void>;
  config?: ClinicConfiguration | null;
  exceptions?: ClinicCalendarException[];
  appointments?: Appointment[];
  sourceType?: 'calendar' | 'new-button'; // 'calendar' = click en calendario, 'new-button' = botón "Nueva cita"
  editingAppointment?: Appointment; // Si está definido, modal en modo EDIT
  defaultLocationType?: 'CLINIC' | 'HOME'; // Tipo de ubicación predeterminado para nuevas citas (undefined = preguntar)
  serviceType?: 'MEDICAL' | 'GROOMING'; // Tipo de servicio a crear (MEDICAL o GROOMING)
}

interface PetServiceData {
  petId: string;
  services: { [key: string]: number }; // serviceId -> quantity
  packages: { [key: string]: number }; // packageId -> quantity
}

interface PriceDetail {
  itemName: string;
  itemType: 'service' | 'package';
  price: number;
  quantity: number;
  subtotal: number;
}

// Extended stylist interface with availability info for filtering
interface StylistWithAvailability {
  id: string;
  userId: string;
  displayName: string;
  type: 'CLINIC' | 'HOME';
  availabilities: StylistAvailability[];
  unavailablePeriods: StylistUnavailablePeriod[];
  capacities: any[]; // Array of {date: YYYY-MM-DD, max_appointments: number}
}

export function UnifiedGroomingModal({
  isOpen,
  scheduledAt,
  onClose,
  onSuccess,
  config = null,
  exceptions = [],
  appointments = [],
  sourceType = 'calendar', // Default: viene del calendario
  editingAppointment, // Undefined = CREATE mode, Defined = EDIT mode
  defaultLocationType, // Tipo de ubicación preseleccionado (undefined = preguntar)
  serviceType = 'GROOMING', // Tipo de servicio a crear: MEDICAL o GROOMING
}: UnifiedGroomingModalProps) {
  const clinicTimezone = useClinicTimezone();
  const { user } = useAuth();
  const clinicId = user?.clinic_id || '';

  // 🎯 Hook para calcular duración automática
  const { durationInfo, isLoading: isDurationLoading, calculateDuration, reset: resetDuration } = useGroomingDuration();

  // 🎯 DEBUG: Print timezone being used in modal
  useEffect(() => {
    if (isOpen) {
      console.log('🌍 [UNIFIED GROOMING MODAL] Clinic Timezone:', {
        timezone: clinicTimezone,
        isOpen,
        sourceType,
        scheduledAtInput: scheduledAt?.toISOString(),
        timestamp: new Date().toISOString(),
        userLocalTime: new Date().toLocaleString('es-MX'),
        clinicLocalTime: clinicTimezone ? new Date().toLocaleString('es-MX', { timeZone: clinicTimezone }) : 'NO TIMEZONE',
      });
    }
  }, [isOpen, clinicTimezone, sourceType, scheduledAt]);

  // 🎯 MODO: Create o Edit
  const isEditMode = !!editingAppointment;

  // Helper: Round time to nearest 15-minute interval
  // ✅ CENTRALIZED: Uses roundUtcToClinicLocal from datetime-tz service
  const roundTo15Minutes = useCallback((date: Date): { date: string; time: string } => {
    if (!clinicTimezone) {
      // Fallback if no timezone
      const minutes = date.getMinutes();
      const rounded = Math.round(minutes / 15) * 15;
      const minutesAdjust = rounded - minutes;
      const rounded15 = addMinutes(date, minutesAdjust);
      return { 
        date: format(rounded15, 'yyyy-MM-dd'), 
        time: format(rounded15, 'HH:mm') 
      };
    }
    // Use centralized service function
    return roundUtcToClinicLocal(date, clinicTimezone);
  }, [clinicTimezone]);


  // Static data
  const [services, setServices] = useState<Service[]>([]);
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [addresses, setAddresses] = useState<ClientAddress[]>([]);
  const [priceLists, setPriceLists] = useState<Array<{ id: string; name: string }>>([]);
  // All stylists with their availability data (before filtering by date/time)
  const [allStylists, setAllStylists] = useState<StylistWithAvailability[]>([]);
  // All veterinarians (for MEDICAL mode)
  const [allVeterinarians, setAllVeterinarians] = useState<any[]>([]);

  // Store appointments from extended search range (for auto-fill feature)
  const [extendedRangeAppointments, setExtendedRangeAppointments] = useState<Appointment[]>([]);

  // Client and pricing
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [servicePrices, setServicePrices] = useState<{ [key: string]: number }>({});
  const [packagePrices, setPackagePrices] = useState<{ [key: string]: number }>({});

  // Form state
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedPetIds, setSelectedPetIds] = useState<string[]>([]);
  // 🎯 En CREATE mode, comienza con defaultLocationType (o null si undefined); en EDIT mode, espera a que useEffect lo establezca
  const [locationType, setLocationType] = useState<'CLINIC' | 'HOME' | null>(editingAppointment ? null : (defaultLocationType || null));
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [selectedStaffUserId, setSelectedStaffUserId] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('09:00');
  const [durationMinutes, setDurationMinutes] = useState(30);
  // 🎯 Estados para duración automática grooming
  const [isPersonalizingDuration, setIsPersonalizingDuration] = useState(false);
  const [finalDuration, setFinalDuration] = useState(30);
  const [notes, setNotes] = useState<string>('');

  // Services/Packages per pet (batch mode)
  const [petServiceData, setPetServiceData] = useState<PetServiceData[]>([]);
  const [customizePerPet, setCustomizePerPet] = useState(false);
  const [commonServices, setCommonServices] = useState<{ [key: string]: number }>({});
  const [commonPackages, setCommonPackages] = useState<{ [key: string]: number }>({});

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [editDataLoaded, setEditDataLoaded] = useState(false); // 🎯 Trackear si ya se cargaron los datos de edición
  const [overlapError, setOverlapError] = useState<string | null>(null);
  const [bookingValidationError, setBookingValidationError] = useState<string | null>(null);
  const [conflictWarning, setConflictWarning] = useState<{ hasWarning: boolean; message?: string }>({ hasWarning: false });
  const [showConflictConfirmation, setShowConflictConfirmation] = useState(false);
  const [showPartialBatchModal, setShowPartialBatchModal] = useState(false);
  const [showClientFormModal, setShowClientFormModal] = useState(false);
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [petConflicts, setPetConflicts] = useState<Array<{ petId: string; petName: string; hasConflict: boolean; conflictType?: 'BLOCKING' | 'SAME_DAY'; reason?: string }>>([]);
  const [validPetIds, setValidPetIds] = useState<string[]>([]);
  const [isAutoInitializing, setIsAutoInitializing] = useState(true); // Track if we're in auto-init phase

  // Determine mode based on selected pets
  const mode: 'SINGLE' | 'BATCH' = useMemo(() => {
    return selectedPetIds.length === 1 ? 'SINGLE' : 'BATCH';
  }, [selectedPetIds.length]);

  // Calculate minimum date (today) for date picker - based on CLINIC timezone, not browser timezone
  const minDate = useMemo(() => {
    if (!clinicTimezone) {
      // Fallback: use clinic timezone format even without explicit timezone
      // This is safer than toISOString() which would use UTC
      const today = new Date();
      return format(today, 'yyyy-MM-dd');
    }
    const utcNow = new Date();
    const clinicNow = utcToZonedTime(utcNow, clinicTimezone);
    // CRITICAL: Use format() instead of toISOString() to preserve timezone
    // toISOString() always converts back to UTC!
    return format(clinicNow, 'yyyy-MM-dd');
  }, [clinicTimezone]);

  // 🎯 NUEVA FUNCIÓN: Buscar el próximo slot disponible
  const findNextAvailableSlot = useCallback(async (searchLocationType?: 'CLINIC' | 'HOME'): Promise<{ date: string; time: string } | null> => {
    const locationToSearch = searchLocationType || locationType;
    if (!locationToSearch) {
      console.error('❌ [DEBUG] findNextAvailableSlot: falta seleccionar tipo de ubicación');
      return null;
    }
    
    if (!config || !clinicTimezone) {
      console.error('❌ [DEBUG] findNextAvailableSlot: falta config o timezone');
      return null;
    }

    console.log('🔍 [DEBUG] Empezando búsqueda de próximo slot...');
    console.log('📍 [DEBUG] Buscando para:', locationToSearch);

    // 🎯 FIX: Parse minDate correctly in clinic timezone
    // "2026-03-06" should mean March 6 at noon local time, not midnight UTC
    const [year, month, day] = minDate.split('-').map(Number);
    let currentDate = new Date(year, month - 1, day, 12, 0, 0); // Use noon to avoid DST issues
    console.log('📅 [DEBUG] minDate:', minDate, '→ currentDate:', currentDate.toISOString());
    
    const maxDaysToSearch = 30; // Buscar hasta 30 días adelante
    const searchFromDate = new Date(currentDate);
    const searchToDate = new Date(currentDate);
    searchToDate.setDate(searchToDate.getDate() + maxDaysToSearch);

    // Obtener citas para los próximos 30 días DIRECTAMENTE del API
    console.log('📥 [DEBUG] Bajando citas del API para el rango de búsqueda...');
    let appointmentsForSearch = [];
    try {
      // 🎯 FIX: Use format() instead of toISOString().split('T')[0] to preserve local date
      const response = await appointmentsApi.getAppointments({
        from: format(searchFromDate, 'yyyy-MM-dd'),
        to: format(searchToDate, 'yyyy-MM-dd'),
      });
      appointmentsForSearch = Array.isArray(response) ? response : (response.data || []);
      console.log(`✅ [DEBUG] ${appointmentsForSearch.length} citas obtenidas del API`);
      // Guardar las citas en el estado para que occupiedTimeSlots las use
      setExtendedRangeAppointments(appointmentsForSearch);
    } catch (error) {
      console.error('❌ [DEBUG] Error bajando citas del API:', error);
      // Fall back to prop appointments if API fails
      appointmentsForSearch = appointments || [];
    }

    for (let dayOffset = 0; dayOffset < maxDaysToSearch; dayOffset++) {
      const searchDate = new Date(currentDate);
      searchDate.setDate(searchDate.getDate() + dayOffset);
      // 🎯 FIX: Use format() to get local date string, not UTC
      const dateStr = format(searchDate, 'yyyy-MM-dd');

      // Verificar si la clínica está abierta ese día
      const businessHoursList = getBusinessHoursForDate(searchDate, config, clinicTimezone);
      if (!businessHoursList || businessHoursList.length === 0) {
        console.log(`⏱️ ${dateStr}: Clínica cerrada`);
        continue;
      }

      // Usar el primer intervalo de horario de negocio
      const businessHours = businessHoursList[0];
      const [startHour, startMin] = businessHours.start.split(':').map(Number);
      const [endHour, endMin] = businessHours.end.split(':').map(Number);
      const businessStartMinutes = startHour * 60 + startMin;
      const businessEndMinutes = endHour * 60 + endMin;

      // Obtener horarios ocupados para este día (filtrar por locationType)
      console.log(`📍 [DEBUG] Buscando citas para ${dateStr}, location: ${locationToSearch}`);
      console.log(`📊 [DEBUG] Total appointments en búsqueda:`, appointmentsForSearch.length);

      const conflictingAppointments = appointmentsForSearch.filter((apt) => {
        const aptDate = getClinicDateKey(new Date(apt.scheduled_at), clinicTimezone);
        // Si location_type es undefined, asumir CLINIC por defecto
        const aptLocationType = apt.location_type || 'CLINIC';
        const matches = aptDate === dateStr && aptLocationType === locationToSearch;
        if (aptDate === dateStr) {
          console.log(`🔍 [DEBUG] Cita en ${aptDate}: location=${aptLocationType}, matches=${matches}`);
        }
        return matches;
      });

      console.log(`✅ [DEBUG] ${conflictingAppointments.length} citas conflictivas encontradas para ${dateStr}:`);
      conflictingAppointments.forEach(apt => {
        console.log(`  - ${apt.scheduled_at}, ${apt.duration_minutes}min, type=${apt.location_type || 'CLINIC'}`);
      });

      const occupied = new Set<string>();
      conflictingAppointments.forEach((apt) => {
        const aptStart = utcToZonedTime(new Date(apt.scheduled_at), clinicTimezone);
        const aptDuration = apt.duration_minutes || 30;
        const aptEnd = addMinutes(aptStart, aptDuration);

        console.log(`⏱️ [DEBUG] Marcando ocupada: ${apt.scheduled_at}`, {
          aptStart: aptStart.toISOString(),
          aptEnd: aptEnd.toISOString(),
          startTime: `${String(aptStart.getHours()).padStart(2, '0')}:${String(aptStart.getMinutes()).padStart(2, '0')}`,
          endTime: `${String(aptEnd.getHours()).padStart(2, '0')}:${String(aptEnd.getMinutes()).padStart(2, '0')}`
        });

        let current = new Date(aptStart);
        while (current < aptEnd) {
          const hours = String(current.getHours()).padStart(2, '0');
          const mins = String(current.getMinutes()).padStart(2, '0');
          const timeStr = `${hours}:${mins}`;
          occupied.add(timeStr);
          current = addMinutes(current, 15);
        }

        if (aptEnd.getMinutes() % 15 !== 0 || aptEnd.getMinutes() === 0) {
          const hours = String(aptEnd.getHours()).padStart(2, '0');
          const mins = String(aptEnd.getMinutes()).padStart(2, '0');
          const timeStr = `${hours}:${mins}`;
          occupied.add(timeStr);
        }
      });

      console.log(`🚫 [DEBUG] Horarios ocupados:`, Array.from(occupied).sort());

      // Iterar por cada intervalo de 15 minutos del día
      for (let i = 0; i < 96; i++) {
        const hours = Math.floor(i * 15 / 60);
        const mins = (i * 15) % 60;
        const timeStr = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;

        // Verificar que esté dentro del horario de negocio
        const [timeHour, timeMin] = timeStr.split(':').map(Number);
        const timeMinutesFromStart = timeHour * 60 + timeMin;

        if (timeMinutesFromStart < businessStartMinutes || timeMinutesFromStart >= businessEndMinutes) {
          continue;
        }

        // Si es hoy, verificar que no esté en el pasado
        if (dateStr === minDate) {
          // 🎯 FIX: Create date correctly in clinic timezone
          // Get current time in clinic timezone for comparison
          const nowUtc = new Date();
          const clinicNow = utcToZonedTime(nowUtc, clinicTimezone);
          const currentMinutesInClinic = clinicNow.getHours() * 60 + clinicNow.getMinutes();
          const slotMinutes = timeHour * 60 + timeMin;
          
          console.log(`⏰ [DEBUG] Comparando horario para hoy (${dateStr} ${timeStr}):`, {
            clinicNow: `${clinicNow.getHours()}:${clinicNow.getMinutes()}`,
            currentMinutesInClinic,
            slotMinutes,
            esEnPasado: slotMinutes <= currentMinutesInClinic
          });
          
          // Add 5 minute buffer
          if (slotMinutes <= currentMinutesInClinic + 5) {
            console.log(`⏸️ [DEBUG] ${dateStr} ${timeStr} está en el pasado, saltando...`);
            continue;
          }
        }

        // Verificar que no esté ocupado
        if (occupied.has(timeStr)) {
          console.log(`⏸️ [DEBUG] ${timeStr} está ocupado, saltando...`);
          continue;
        }

        // ✅ Slot encontrado
        console.log(`✅ Slot disponible encontrado: ${dateStr} ${timeStr}`);
        return { date: dateStr, time: timeStr };
      }
    }

    console.log('⚠️ No se encontró slot disponible en los próximos 30 días');
    return null;
  }, [minDate, config, clinicTimezone, appointments.length]);

  // 🎯 Initialize location type based on service type and mode
  // For MEDICAL: Always set to CLINIC (no choice needed)
  // For GROOMING: Use defaultLocationType if provided, otherwise ask user
  useEffect(() => {
    if (isOpen && !isEditMode) {
      // MEDICAL appointments always at CLINIC
      if (serviceType === 'MEDICAL') {
        setLocationType('CLINIC');
        console.log('✅ MEDICAL MODE: Ubicación automáticamente establecida a CLINIC');
      } else if (defaultLocationType) {
        // GROOMING: Tiene un tipo preseleccionado (viene de tab específico)
        setLocationType(defaultLocationType);
        console.log('🔄 GROOMING MODE: Preseleccionando locationType:', defaultLocationType);
      } else {
        // GROOMING: No tiene tipo preseleccionado → preguntar
        setLocationType(null);
        console.log('🔄 GROOMING MODE: Preguntando tipo de cita al usuario');
      }
    }
  }, [isOpen, isEditMode, defaultLocationType, serviceType]);

  // Load stylists filtered by location type (with availability data) OR veterinarians for MEDICAL
  useEffect(() => {
    const loadStaffData = async () => {
      if (!isOpen) {
        setAllStylists([]);
        setAllVeterinarians([]);
        return;
      }

      // MEDICAL mode - load veterinarians with their availability data
      if (serviceType === 'MEDICAL') {
        try {
          console.log('📥 Cargando veterinarios...');
          const vetsList = await veterinariansApi.listVeterinarians(clinicId);
          console.log('✅ Veterinarios cargados:', vetsList);
          
          // Load availability data for each veterinarian
          const vetsWithAvailability = await Promise.all(
            vetsList.map(async (v: any) => {
              try {
                const [availabilities, unavailablePeriods, capacities] = await Promise.all([
                  veterinariansApi.listAvailabilities(clinicId, v.id),
                  veterinariansApi.listUnavailablePeriods(clinicId, v.id),
                  veterinariansApi.listCapacities(clinicId, v.id).catch(() => []),
                ]);
                return {
                  id: v.id,
                  userId: v.userId,
                  displayName: v.displayName || v.user?.name || 'Veterinario',
                  type: 'CLINIC' as const,
                  availabilities: availabilities || [],
                  unavailablePeriods: unavailablePeriods || [],
                  capacities: capacities || [],
                };
              } catch (err) {
                console.error(`Error loading availability for vet ${v.id}:`, err);
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
          setAllVeterinarians(vetsWithAvailability);
        } catch (error) {
          console.error('Error loading veterinarians:', error);
          toast.error('Error al cargar veterinarios');
          setAllStylists([]);
          setAllVeterinarians([]);
        }
        return;
      }

      // GROOMING mode - load stylists
      if (!locationType) {
        setAllStylists([]);
        return;
      }
      
      try {
        console.log('📥 Cargando estilistas para tipo:', locationType);
        const stylistsList = await stylistsApi.listStylists(clinicId);
        console.log('✅ Todos los estilistas:', stylistsList);
        
        // Filter by location type: CLINIC or HOME
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
                stylistsApi.listCapacities(clinicId, s.id).catch(() => []),
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
        setAllVeterinarians([]); // Clear veterinarians
      } catch (error) {
        console.error('Error loading stylists:', error);
        toast.error('Error al cargar estilistas');
        setAllStylists([]);
      }
    };
    
    loadStaffData();
  }, [isOpen, locationType, clinicId, serviceType]);

  // 🎯 Filter stylists by availability for the selected date/time
  const stylists = useMemo(() => {
    if (!date || !time || allStylists.length === 0) {
      return allStylists.map(s => ({ id: s.id, userId: s.userId, displayName: s.displayName, type: s.type }));
    }

    // Parse the appointment date and time
    const [year, month, day] = date.split('-').map(Number);
    const [hours, mins] = time.split(':').map(Number);
    const appointmentStartMinutes = hours * 60 + mins;
    const appointmentEndMinutes = appointmentStartMinutes + durationMinutes;

    // Get day of week (0=Monday, 6=Sunday for our system, but JS Date uses 0=Sunday)
    const jsDate = new Date(year, month - 1, day);
    const jsDayOfWeek = jsDate.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
    // Convert to our system: 0=Monday, ..., 6=Sunday
    const dayOfWeek = jsDayOfWeek === 0 ? 6 : jsDayOfWeek - 1;

    console.log('🔍 [STYLIST FILTER] Checking availability:', {
      date,
      time,
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
      const dateStr = date; // YYYY-MM-DD format
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

      // 4. Check if stylist has appointment conflict
      // For MEDICAL appointments with allowMedicalAppointmentOverlap=false, skip conflict check
      const isMedicalType = serviceType === 'MEDICAL';
      const allowsMedicalSimultaneous = (config as any)?.allowMedicalAppointmentOverlap !== true;
      
      if (!(isMedicalType && allowsMedicalSimultaneous)) {
        // Only check conflicts if NOT (medical with simultaneous allowed)
        const stylistAppointments = appointments.filter(
          apt => apt.assigned_staff_user_id === stylist.userId && 
                 apt.status !== 'CANCELLED' &&
                 apt.status !== 'NO_SHOW' &&
                 !apt.rescheduled_at // Exclude rescheduled appointments
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
          if (aptDateStr !== date) {
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
      }

      // 5. Check capacity configuration for this stylist on this date
      const serviceTypeForValidation = serviceType === 'MEDICAL' ? 'MEDICAL' : 'GROOMING';
      const capacityCheck = validateStaffCapacity(
        stylist,
        appointments,
        date,
        serviceTypeForValidation
      );

      if (!capacityCheck.valid) {
        console.log(`❌ ${stylist.displayName}: ${capacityCheck.reason}`);
        return false;
      }

      console.log(`✅ ${stylist.displayName}: Disponible`);
      return true;
    });

    console.log('🎯 [STYLIST FILTER] Available stylists:', availableStylists.map(s => s.displayName));

    return availableStylists.map(s => ({ id: s.id, userId: s.userId, displayName: s.displayName, type: s.type }));
  }, [allStylists, date, time, durationMinutes, appointments.length, clinicTimezone]);

  // Auto-deselect stylist if they become unavailable due to date/time change
  // 🎯 Skip in EDIT mode - don't auto-deselect or show toast during editing
  useEffect(() => {
    if (!isEditMode && selectedStaffUserId && stylists.length > 0) {
      const isStillAvailable = stylists.some(s => s.userId === selectedStaffUserId);
      if (!isStillAvailable) {
        console.log('⚠️ [STYLIST] Auto-deselecting unavailable stylist:', selectedStaffUserId);
        setSelectedStaffUserId('');
        // ℹ️ NO mostrar toast en EDIT mode - la validación contra la misma cita es un falso positivo
        // Solo mostrar en CREATE mode donde tiene sentido
      }
    }
  }, [stylists, selectedStaffUserId, isEditMode]);

  // Initialize date on mount or when scheduledAt changes
  // Skip in EDIT mode - loadEditData handles that
  useEffect(() => {
    if (!isOpen || isEditMode) return;

    let initialDate: string;
    let initialTime: string;

    // Determine initial date/time
    if (scheduledAt) {
      const { date: newDate, time: newTime } = roundTo15Minutes(scheduledAt);
      initialDate = newDate;
      initialTime = newTime;
    } else if (!date) {
      // Use today as fallback (based on clinic timezone)
      if (clinicTimezone) {
        const utcNow = new Date();
        const clinicToday = utcToZonedTime(utcNow, clinicTimezone);
        initialDate = format(clinicToday, 'yyyy-MM-dd');
      } else {
        const today = new Date();
        initialDate = format(today, 'yyyy-MM-dd');
      }
      initialTime = '09:00';
    } else {
      // Date already set, don't overwrite
      return;
    }

    // CRITICAL: Validate and correct invalid dates DURING initialization
    // This prevents "fechas pasadas" errors from ever appearing
    if (initialDate === minDate && config && clinicTimezone) {
      const [hours, mins] = initialTime.split(':').map(Number);
      const utcNow = new Date();
      const clinicNow = utcToZonedTime(utcNow, clinicTimezone);
      const currentMinutes = clinicNow.getHours() * 60 + clinicNow.getMinutes();
      const selectedMinutes = hours * 60 + mins;

      // If selected time is at or before current time, auto-shift to next working day
      if (selectedMinutes <= currentMinutes) {
        const isClosedDay = (dateStr: string): boolean => {
          return exceptions.some(exc => exc.date === dateStr);
        };

        // 🎯 FIX: Manipulate date in clinic timezone, not UTC
        let nextDate: Date;
        if (clinicTimezone) {
          // Parse initialDate as clinic local time
          const [year, month, day] = initialDate.split('-').map(Number);
          const localDate = new Date(year, month - 1, day, 12, 0, 0);
          nextDate = utcToZonedTime(localDate, clinicTimezone);
        } else {
          nextDate = new Date(initialDate);
        }
        
        nextDate.setDate(nextDate.getDate() + 1);
        
        // 🎯 FIX: Use format() instead of toISOString().split() to preserve local date
        while (isClosedDay(format(nextDate, 'yyyy-MM-dd'))) {
          nextDate.setDate(nextDate.getDate() + 1);
        }

        const clinicNextDate = clinicTimezone 
          ? utcToZonedTime(nextDate, clinicTimezone)
          : nextDate;
        initialDate = format(clinicNextDate, 'yyyy-MM-dd');
        initialTime = '09:00';

        // Toast removed - the findNextAvailableSlot handles this better
      }
    }

    setDate(initialDate);
    setTime(initialTime);
    setIsAutoInitializing(false); // Auto-init complete, user can now interact
  }, [isOpen, isEditMode, scheduledAt, roundTo15Minutes, minDate, config, exceptions, clinicTimezone]);

  // 🎯 NUEVO: Auto-llenar próximo slot disponible cuando viene del botón "Nueva cita"
  // Skip in EDIT mode
  useEffect(() => {
    console.log('📌 [DEBUG] useEffect autoFill:', { isOpen, sourceType, locationType, hasConfig: !!config, hasAppointments: !!appointments, hasTimezone: !!clinicTimezone });
    
    if (!isOpen || isEditMode || sourceType !== 'new-button') {
      console.log('❌ [DEBUG] Saliendo: isOpen=', isOpen, 'sourceType=', sourceType);
      return;
    }
    
    // Si aún no eligió CLINIC o HOME, no buscar todavía
    if (!locationType) {
      console.log('⏳ [DEBUG] Esperando que el usuario seleccione CLINIC o HOME');
      return;
    }
    
    if (!config || !appointments || !clinicTimezone) {
      console.log('❌ [DEBUG] Saliendo: datos incompletos');
      return;
    }

    console.log('🚀 [DEBUG] Inicializando (sourceType=' + sourceType + ', locationType=' + locationType + ')...');

    // 🎯 SOLO buscar siguiente slot si viene de "Nueva Cita"
    if (sourceType !== 'new-button') {
      console.log('📌 [DEBUG] Viene del calendario - respetando fecha/hora seleccionada');
      setIsAutoInitializing(false);
      return;
    }

    const autoFillNextSlot = async () => {
      try {
        const nextSlot = await findNextAvailableSlot(locationType);
        console.log('🔍 [DEBUG] findNextAvailableSlot retornó:', nextSlot);
        
        if (nextSlot) {
          console.log(`✅ [DEBUG] Auto-llenando slot encontrado: ${nextSlot.date} ${nextSlot.time}`);
          setDate(nextSlot.date);
          setTime(nextSlot.time);
          setIsAutoInitializing(true); // Marcar que estamos en auto-init
          toast.success(`📅 Próximo horario disponible: ${nextSlot.date} a las ${nextSlot.time}`);
        } else {
          console.warn('⚠️ [DEBUG] No hay slots disponibles en los próximos 30 días');
          toast.error('No hay horarios disponibles en los próximos 30 días');
        }
      } catch (error) {
        console.error('❌ [DEBUG] Error buscando próximo slot:', error);
        toast.error('Error al buscar disponibilidad');
      }
    };

    autoFillNextSlot();
  }, [isOpen, isEditMode, sourceType, locationType, config, appointments.length, clinicTimezone, findNextAvailableSlot]);

  // 🎯 NUEVO: Cargar extendedRangeAppointments cuando se abre el modal
  // Esto permite que el usuario pueda cambiar la fecha sin recargar datos
  useEffect(() => {
    if (!isOpen || isEditMode || !clinicTimezone) return;

    const loadExtendedRangeAppointments = async () => {
      try {
        // 🎯 FIX: Use format() to get dates in clinic timezone
        const utcNow = new Date();
        const clinicNow = utcToZonedTime(utcNow, clinicTimezone);
        
        // Cargar citas desde hoy hasta 60 días adelante
        const startDate = format(clinicNow, 'yyyy-MM-dd');
        const sixtyDaysLater = addMinutes(clinicNow, 60 * 24 * 60);
        const endDate = format(sixtyDaysLater, 'yyyy-MM-dd');
        
        console.log('📥 [DEBUG] Cargando extendedRangeAppointments:', { startDate, endDate, clinicTimezone });
        
        const response = await appointmentsApi.getAppointments({
          from: startDate,
          to: endDate,
        });
        
        const loadedAppointments = Array.isArray(response) ? response : (response?.data || []);
        console.log(`✅ [DEBUG] ${loadedAppointments.length} citas cargadas para el rango extendido`);
        
        setExtendedRangeAppointments(loadedAppointments);
      } catch (error) {
        console.error('❌ [DEBUG] Error cargando extendedRangeAppointments:', error);
        // Fall back silently - usarán los appointments del prop
        setExtendedRangeAppointments([]);
      }
    };

    loadExtendedRangeAppointments();
  }, [isOpen, isEditMode, clinicTimezone]);

  // Load services, packages, and price lists on mount
  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      setIsLoadingData(true);
      try {
        const [servicesRes, packagesRes, priceListsRes] = await Promise.all([
          servicesApi.getServices(),
          packagesApi.getPackages(),
          (async () => {
            try {
              const res = await pricingApi.getPriceLists();
              return Array.isArray(res) ? res : (res?.data || []);
            } catch {
              return [];
            }
          })(),
        ]);
        setServices(servicesRes || []);
        setPackages(packagesRes || []);
        setPriceLists(priceListsRes || []);
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error loading services';
        setError(message);
        console.error('Error loading grooming modal data:', err);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadData();
  }, [isOpen]);

  // 🎯 EDIT MODE: Pre-load appointment data when editing
  // Esperar a que los servicios estén cargados (services.length > 0) antes de cargar los datos de la cita
  useEffect(() => {
    if (!isOpen || !isEditMode || !editingAppointment) return;
    // Evitar cargar múltiples veces
    if (editDataLoaded) {
      console.log('✅ EDIT: Datos ya cargados, saltando...');
      return;
    }
    // Esperar a que se carguen los servicios disponibles
    if (services.length === 0) {
      console.log('⏳ EDIT: Esperando que se carguen los servicios disponibles...');
      return;
    }

    const loadEditData = async () => {
      try {
        console.log('🎯 EDIT: Cargando datos de la cita...', editingAppointment.id);
        // Obtener client_id del appointment (puede estar en client_id o en client.id)
        const clientId = editingAppointment.client_id || editingAppointment.client?.id;
        
        if (!clientId) {
          throw new Error('No se pudo obtener el cliente de la cita');
        }

        // Cargar cliente
        const client = await clientsApi.getClient(clientId);
        setSelectedClient(client);
        setSelectedClientId(clientId);

        // Cargar mascotas y direcciones
        const [petsRes, addressesRes] = await Promise.all([
          petsApi.getClientPets(clientId),
          addressesApi.getClientAddresses(clientId),
        ]);
        setPets(petsRes || []);
        setAddresses(addressesRes || []);

        // Pre-llenar forma - obtener pet_id del appointment
        const petId = editingAppointment.pet_id || editingAppointment.pet?.id;
        if (petId) {
          setSelectedPetIds([petId]);
        }
        setLocationType(editingAppointment.location_type as 'CLINIC' | 'HOME');
        
        // Cargar dirección para citas a domicilio
        // El backend envía la relación 'address' con el objeto completo
        const addressId = (editingAppointment as any).address?.id 
          || editingAppointment.address_id 
          || (editingAppointment as any).addressId;
        console.log('🏠 EDIT: Cargando dirección:', { 
          location_type: editingAppointment.location_type, 
          address_id: addressId,
        });
        if (editingAppointment.location_type === 'HOME' && addressId) {
          setSelectedAddressId(addressId);
        }
        setSelectedStaffUserId(editingAppointment.assigned_staff_user_id || '');

        // Pre-llenar fecha/hora (readonly en modo EDIT)
        if (editingAppointment.scheduled_at && clinicTimezone) {
          // Convertir UTC a zona horaria de la clínica
          const utcDate = new Date(editingAppointment.scheduled_at);
          const clinicDate = utcToZonedTime(utcDate, clinicTimezone);
          
          setDate(format(clinicDate, 'yyyy-MM-dd'));
          setTime(format(clinicDate, 'HH:mm'));
          console.log('📅 EDIT: Fecha/hora cargada (clinic TZ):', { 
            date: format(clinicDate, 'yyyy-MM-dd'), 
            time: format(clinicDate, 'HH:mm'),
            timezone: clinicTimezone 
          });
        }
        // 🎯 SIEMPRE cargar la duración en EDIT mode (nunca undefined)
        const appointmentDuration = editingAppointment.duration_minutes || 30; // Default a 30 si no existe
        console.log('⏱️ [EDIT DURATION] Cargando duración de cita:', {
          duration_minutes: editingAppointment.duration_minutes,
          finalDuration: appointmentDuration,
          type: typeof editingAppointment.duration_minutes,
        });
        setDurationMinutes(appointmentDuration);
        // 🎯 En EDIT mode, guardar el valor en finalDuration pero NO activar personalización aún
        // El usuario debe hacer click en "Sobreescribir Duración" para editarlo
        setFinalDuration(appointmentDuration);
        setIsPersonalizingDuration(false); // Campo oculto por defecto
        console.log('⏱️ [EDIT DURATION] Estados seteados:', {
          durationMinutes: appointmentDuration,
          finalDuration: appointmentDuration,
          isPersonalizingDuration: false, // Campo oculto, esperando click en "Sobreescribir"
        });

        // 🎯 Cargar servicios/items desde la API de pricing
        try {
          console.log('🔄 EDIT: Llamando a pricingApi.getAppointmentPricing...', editingAppointment.id);
          const pricingData = await pricingApi.getAppointmentPricing(editingAppointment.id);
          console.log('📦 EDIT: Respuesta de pricing API:', pricingData);
          
          if (pricingData?.items && Array.isArray(pricingData.items)) {
            const servicesToSet: { [key: string]: number } = {};
            const pricesToSet: { [key: string]: number } = {};

            pricingData.items.forEach((item: any) => {
              console.log('📍 EDIT: Procesando item:', item);
              // API retorna camelCase: serviceId, priceAtBooking
              if (item.serviceId) {
                servicesToSet[item.serviceId] = item.quantity || 1;
                pricesToSet[item.serviceId] = item.priceAtBooking || 0;
              }
            });

            console.log('🎯 EDIT: Servicios a setear:', servicesToSet);
            console.log('💰 EDIT: Precios a setear:', pricesToSet);
            
            setCommonServices(servicesToSet);
            setServicePrices(pricesToSet);
            console.log('✅ Servicios cargados desde pricing API:', servicesToSet);
          } else {
            console.warn('⚠️ EDIT: No hay items en la respuesta o formato incorrecto:', pricingData);
          }
        } catch (pricingErr) {
          console.error('❌ EDIT: Error cargando pricing:', pricingErr);
          // No es fatal - el usuario puede agregar servicios nuevos
        }

        setError(null);
        setEditDataLoaded(true); // 🎯 Marcar como cargado
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error loading appointment data';
        setError(message);
        console.error('Error loading edit appointment data:', err);
        toast.error(message);
      }
    };

    loadEditData();
  }, [isOpen, isEditMode, editingAppointment?.id, services.length, clinicTimezone, editDataLoaded]);

  // Function to refresh client data after editing/creating
  const refreshClientData = useCallback(async () => {
    if (!selectedClientId) return;

    try {
      // Reload client info
      const updatedClient = await clientsApi.getClient(selectedClientId);
      setSelectedClient(updatedClient);

      // Reload pets and addresses
      const [petsRes, addressesRes] = await Promise.all([
        petsApi.getClientPets(selectedClientId),
        addressesApi.getClientAddresses(selectedClientId),
      ]);
      setPets(petsRes || []);
      setAddresses(addressesRes || []);

      toast.success('Información del cliente actualizada');
    } catch (err) {
      console.error('Error refreshing client data:', err);
      toast.error('Error al actualizar información del cliente');
    }
  }, [selectedClientId]);

  // Load pets and addresses when client changes
  useEffect(()=> {
    console.log('👤 [SELECTED CLIENT CHANGED]:', {
      clientId: selectedClient?.id,
      clientName: selectedClient?.name,
      price_list_id: selectedClient?.price_list_id,
    });

    if (!selectedClientId) {
      setPets([]);
      setAddresses([]);
      setSelectedPetIds([]);
      // 🔧 FIX: Reset ALL conflict states when client changes
      setConflictWarning({ hasWarning: false });
      setPetConflicts([]);
      setShowConflictConfirmation(false);
      setValidPetIds([]);
      return;
    }

    const loadClientData = async () => {
      try {
        const [petsRes, addressesRes] = await Promise.all([
          petsApi.getClientPets(selectedClientId),
          addressesApi.getClientAddresses(selectedClientId),
        ]);
        setPets(petsRes || []);
        setAddresses(addressesRes || []);
      } catch (err) {
        console.error('Error loading client pets/addresses:', err);
        toast.error('Error al cargar datos del cliente');
      }
    };

    loadClientData();
  }, [selectedClientId]);

  // 🎯 CRITICAL FIX: Ensure selectedClient is loaded with price_list_id when selectedClientId changes
  // This handles the case where onClientSelect callback might not have been called properly
  useEffect(() => {
    if (!selectedClientId) return;
    
    console.log(`🔄 [CLIENT SYNC] Verificando cliente:`, {
      selectedClientId,
      clientLoaded: !!selectedClient,
      clientId: selectedClient?.id,
      clientName: selectedClient?.name,
      clientPriceListId: selectedClient?.price_list_id,
      clientKeys: selectedClient ? Object.keys(selectedClient).sort() : [],
    });
    
    // ¿Ya está cargado con price_list_id?
    if (selectedClient && selectedClient.id === selectedClientId) {
      if (selectedClient.price_list_id) {
        console.log('✅ [CLIENT SYNC] Cliente TIENE lista de precios:', {
          clientId: selectedClient.id,
          price_list_id: selectedClient.price_list_id,
        });
        return;
      } else {
        console.warn('⚠️ [CLIENT SYNC] Cliente NO tiene lista de precios asignada:', {
          clientId: selectedClient.id,
          name: selectedClient.name,
        });
        // NO retornamos aquí - necesitamos recargar para estar seguros
      }
    }

    // Recargar cliente si no está cargado o sin price_list_id
    if (!selectedClient || selectedClient.id !== selectedClientId) {
      console.log('🔄 [CLIENT SYNC] Cargando cliente desde API:', selectedClientId);
      const abortController = new AbortController();
      (async () => {
        try {
          const client = await clientsApi.getClient(selectedClientId);
          if (!abortController.signal.aborted) {
            console.log('✅ [CLIENT SYNC] Cliente cargado desde API:', {
              id: client.id,
              name: client.name,
              price_list_id: client.price_list_id,
              allKeys: Object.keys(client).sort(),
            });
            setSelectedClient(client);
          }
        } catch (err) {
          if (!abortController.signal.aborted) {
            console.error('❌ [CLIENT SYNC] Error cargando cliente:', err);
            toast.error('Error al cargar información del cliente');
          }
        }
      })();
      return () => abortController.abort();
    }
  }, [selectedClientId]);

  // 🎯 RESET cuando cambia el cliente (solo en modo CREATE)
  // Limpia: mascotas, servicios, paquetes, precios
  // Mantiene: tipo de visita, domicilio
  useEffect(() => {
    // Solo reset en modo CREATE
    if (isEditMode) return;

    // Solo hacer reset si hay un cliente seleccionado y es diferente al anterior
    if (!selectedClientId) return;

    console.log('🔄 [RESET CLIENT] Cliente cambió, limpiando mascotas y servicios:', {
      newClientId: selectedClientId,
      previousPets: selectedPetIds,
      preservingLocationType: locationType,
      preservingAddressId: selectedAddressId,
    });

    // Limpiar: mascotas, servicios, paquetes, precios
    setSelectedPetIds([]);
    setCommonServices({});
    setCommonPackages({});
    setServicePrices({});
    setPackagePrices({});
    setPetServiceData([]);

    // Mantener: locationType y selectedAddressId
    // No tocar: date, time, stylist selection, location type, address
  }, [selectedClientId, isEditMode]);

  // Clear conflict states when selected pets change (to prevent stale error messages)
  useEffect(() => {
    setConflictWarning({ hasWarning: false });
    setPetConflicts([]);
    setShowConflictConfirmation(false);
    setValidPetIds([]);
  }, [selectedPetIds.join(',')]);

  /**
   * 🎯 LOGICA DE PRECIOS PARA PAQUETES
   * Resuelve el precio de un servicio siguiendo este orden:
   * 1. Lista de precios del cliente + tamaño del perro
   * 2. Lista de precios del cliente + default
   * 3. Tabla de servicios + tamaño del perro
   * 4. Tabla de servicios + default (si existe)
   */
  const resolveServicePrice = useCallback(
    async (serviceId: string, petSize?: string): Promise<number> => {
      const service = services.find(s => s.id === serviceId);
      if (!service) {
        console.warn(`⚠️ [RESOLVE PRICE] Servicio no encontrado: ${serviceId}`);
        return 0;
      }

      // 1️⃣ Intenta lista de precios del cliente con tamaño
      if (selectedClient?.price_list_id && petSize && service.category === 'GROOMING') {
        try {
          const sizePrice = await serviceSizePriceApi.getPriceListSizePrice(
            selectedClient.price_list_id,
            serviceId,
            petSize
          );
          if (sizePrice?.price) {
            const price = typeof sizePrice.price === 'string' ? parseFloat(sizePrice.price) : sizePrice.price;
            if (price > 0) {
              console.log(`✅ [RESOLVE] Precio de lista+tamaño para ${serviceId}: ${price}`);
              return price;
            }
          }
        } catch (err) {
          console.log(`⚠️ [RESOLVE] Error obteniendo precio lista+tamaño para ${serviceId}`);
        }
      }

      // 2️⃣ Intenta lista de precios del cliente sin tamaño (default)
      if (selectedClient?.price_list_id) {
        try {
          const pricingRes = await pricingApi.calculatePricing({
            priceListId: selectedClient.price_list_id,
            serviceIds: [serviceId],
            quantities: [1],
          });
          if (pricingRes?.items?.[0]?.priceAtBooking) {
            const price = pricingRes.items[0].priceAtBooking;
            console.log(`✅ [RESOLVE] Precio de lista (default) para ${serviceId}: ${price}`);
            return price;
          }
        } catch (err) {
          console.log(`⚠️ [RESOLVE] Error obteniendo precio de lista para ${serviceId}`);
        }
      }

      // 3️⃣ Intenta tabla de servicios con tamaño
      if (petSize && service.category === 'GROOMING') {
        try {
          const sizePrice = await serviceSizePriceApi.getSizePrice(serviceId, petSize);
          if (sizePrice?.price) {
            const price = typeof sizePrice.price === 'string' ? parseFloat(sizePrice.price) : sizePrice.price;
            if (price > 0) {
              console.log(`✅ [RESOLVE] Precio global+tamaño para ${serviceId}: ${price}`);
              return price;
            }
          }
        } catch (err) {
          console.log(`⚠️ [RESOLVE] Error obteniendo precio global+tamaño para ${serviceId}`);
        }
      }

      // 4️⃣ Sin precio encontrado, retornar 0
      console.warn(`❌ [RESOLVE] No hay precio para ${serviceId}, retornando 0`);
      return 0;
    },
    [selectedClient, services]
  );

  /**
   * 🎯 Calcula el precio total de un paquete sumando los precios de sus servicios
   */
  const resolvePackagePrice = useCallback(
    async (packageId: string): Promise<number> => {
      const pkg = packages.find(p => p.id === packageId);
      if (!pkg) {
        console.warn(`⚠️ [PACKAGE PRICE] Paquete no encontrado: ${packageId}`);
        return 0;
      }

      console.log(`📦 [PACKAGE PRICE] Calculando precio para paquete: ${pkg.name}`, {
        items: pkg.items.map(item => ({
          serviceId: item.serviceId,
          serviceName: item.serviceName,
          quantity: item.quantity,
        })),
      });

      let totalPrice = 0;
      const firstPetId = selectedPetIds[0];
      const firstPet = pets.find(p => p.id === firstPetId);
      const petSize = firstPet?.size;

      // Por cada servicio en el paquete, resuelve su precio
      for (const item of pkg.items) {
        const servicePrice = await resolveServicePrice(item.serviceId, petSize);
        const itemTotal = servicePrice * (item.quantity || 1);
        totalPrice += itemTotal;
        console.log(`  - ${item.serviceName}: ${servicePrice} × ${item.quantity || 1} = ${itemTotal}`);
      }

      console.log(`✅ [PACKAGE PRICE] Total para ${pkg.name}: ${totalPrice}`);
      return totalPrice;
    },
    [packages, selectedPetIds, pets, resolveServicePrice]
  );

  // Load prices when client is selected

  // Calculate and fetch prices for selected services - ONLY when selections change
  useEffect(() => {
    console.log('💰 [PRICE] ==== PRICE EFFECT TRIGGERED ====', {
      selectedClient: selectedClient ? { 
        id: selectedClient.id, 
        name: selectedClient.name, 
        price_list_id: selectedClient.price_list_id 
      } : 'NO CLIENTE',
      commonServices: Object.keys(commonServices),
      commonPackages: Object.keys(commonPackages),
      selectedPetIds,
      firstPet: selectedPetIds.length > 0 ? pets.find(p => p.id === selectedPetIds[0]) : 'NO PET',
    });
    
    const loadSelectedPrices = async () => {
      // Get IDs of selected services and packages
      const selectedServiceIds = Object.keys(commonServices);
      const selectedPackageIds = Object.keys(commonPackages);

      // If nothing selected, clear prices
      if (selectedServiceIds.length === 0 && selectedPackageIds.length === 0) {
        console.log('⚠️ [PRICE] No hay servicios/paquetes seleccionados - limpiando precios');
        setServicePrices({});
        setPackagePrices({});
        return;
      }

      // If client has NO price_list_id, use base service prices as fallback
      if (!selectedClient?.price_list_id) {
        console.error('❌ [PRICE] ¡¡¡CLIENTE SIN LISTA DE PRECIOS!!!', {
          selectedClient: selectedClient ? {
            id: selectedClient.id,
            name: selectedClient.name,
            price_list_id: selectedClient.price_list_id,
          } : null,
          selectedServiceIds,
          message: '⚠️ El cliente no tiene lista de precios asignada - los precios mostrarán como 0. Edita el cliente para asignarle una lista.',
        });
        const newServicePrices: { [key: string]: number } = {};
        const newPackagePrices: { [key: string]: number } = {};
        
        selectedServiceIds.forEach((id) => {
          // Service type doesn't have price - prices come from PriceList
          newServicePrices[id] = 0;
          console.log(`💬 [PRICE] Servicio ${id} sin lista de precios => asignando 0`);
        });
        
        setServicePrices(newServicePrices);
        setPackagePrices(newPackagePrices);
        return;
      }

      // Get the first selected pet (for size-based pricing)
      const firstPetId = selectedPetIds[0];
      const firstPet = pets.find(p => p.id === firstPetId);
      const petSize = firstPet?.size;

      console.log(`🐕 [PRICE] Mascota seleccionada:`, {
        firstPetId,
        petFound: !!firstPet,
        petName: firstPet?.name,
        petSize: petSize,
        allPets: pets.map(p => ({ id: p.id, name: p.name, size: p.size })),
        selectedPetIds,
      });

      // Try to load size-based prices if a pet with size is selected
      const sizeBasedPrices: { [key: string]: number } = {};
      if (petSize && selectedServiceIds.length > 0) {
        console.log(`📏 [PRICE] Intentando cargar precios por tamaño:`, {
          petSize,
          selectedServiceIds,
          serviceName: services.find(s => s.id === selectedServiceIds[0])?.name,
          clientPriceListId: selectedClient?.price_list_id,
        });
        
        // Try to fetch size prices for each service
        for (const serviceId of selectedServiceIds) {
          try {
            const serviceData = services.find(s => s.id === serviceId);
            console.log(`🔍 [PRICE] Buscando precio por tamaño para:`, {
              serviceId,
              serviceName: serviceData?.name,
              petSize,
              serviceCategory: serviceData?.category,
              clientPriceListId: selectedClient?.price_list_id,
            });
            
            // If client has a price list, try to get the list-specific price first
            let sizePrice = null;
            if (selectedClient?.price_list_id && serviceData?.category === 'GROOMING') {
              try {
                console.log(`🔄 [PRICE] Intentando cargar precio específico de lista de precios`);
                sizePrice = await serviceSizePriceApi.getPriceListSizePrice(
                  selectedClient.price_list_id,
                  serviceId,
                  petSize
                );
                if (sizePrice) {
                  console.log(`✅ [PRICE] Precio específico de lista obtenido:`, sizePrice);
                }
              } catch (err) {
                console.log(`⚠️ [PRICE] Error obteniendo precio de lista, usando global`);
              }
            }
            
            // Fallback to global price if list-specific not found
            if (!sizePrice) {
              console.log(`📥 [PRICE] Usando precio global`);
              sizePrice = await serviceSizePriceApi.getSizePrice(serviceId, petSize);
            }
            console.log(`📥 [PRICE] Respuesta de getSizePrice:`, {
              serviceId,
              petSize,
              sizePrice,
            });
            
            if (sizePrice && sizePrice.price) {
              // Convertir a número si es string
              const priceValue = typeof sizePrice.price === 'string'
                ? parseFloat(sizePrice.price)
                : sizePrice.price;
              
              if (priceValue > 0) {
                sizeBasedPrices[serviceId] = priceValue;
                console.log(`✅ [PRICE] Precio por tamaño cargado:`, {
                  serviceId,
                  price: priceValue,
                  originalPrice: sizePrice.price,
                  petSize: sizePrice.petSize,
                });
              }
            } else {
              // No size-based price found
              console.log(`📥 [PRICE] No hay precio por tamaño para ${serviceId}`);
            }
          } catch (error) {
            // Size price not found for this service, will use fallback pricing
            console.log(`ℹ️ [PRICE] No hay precio por tamaño para ${serviceId}, se usará fallback`);
          }
        }
      }

      // If we found size-based prices for all services, use them
      if (Object.keys(sizeBasedPrices).length === selectedServiceIds.length && selectedServiceIds.length > 0) {
        console.log('✅✅✅ [PRICE] USANDO PRECIOS POR TAMAÑO COMPLETOS:', {
          sizeBasedPrices,
          selectedServiceIds,
        });
        setServicePrices(sizeBasedPrices);
        setPackagePrices({});
        return;
      }

      try {
        const allIds = [...selectedServiceIds, ...selectedPackageIds];
        const quantities = [
          ...selectedServiceIds.map((id) => commonServices[id]),
          ...selectedPackageIds.map((id) => commonPackages[id]),
        ];

        console.log('� [PRICE] Calculando precios desde lista:', {
          priceListId: selectedClient.price_list_id,
          allIds,
          quantities,
          selectedServiceIds,
          selectedPackageIds,
        });

        const pricingRes = await pricingApi.calculatePricing({
          priceListId: selectedClient.price_list_id,
          serviceIds: allIds,
          quantities,
        });

        console.log('📥 [PRICE] Respuesta de calculatePricing:', {
          hasItems: !!pricingRes?.items,
          itemsCount: pricingRes?.items?.length,
          items: pricingRes?.items?.map((i: any) => ({
            serviceId: i.serviceId,
            serviceName: services.find(s => s.id === i.serviceId)?.name,
            quantity: i.quantity,
            priceAtBooking: i.priceAtBooking,
          })),
          responseType: Array.isArray(pricingRes) ? 'array' : 'object',
        });

        // Handle different response structures
        let items = pricingRes?.items || [];
        
        // If response is directly the items array
        if (Array.isArray(pricingRes)) {
          items = pricingRes;
          console.log('🔄 [PRICE] Response es un array, usándolo directamente');
        }

        console.log('🎯 [PRICE] Items finales a procesar:', {
          count: items.length,
          items: items.map((i: any) => ({
            serviceId: i.serviceId,
            quantity: i.quantity,
            priceAtBooking: i.priceAtBooking,
          })),
        });

        if (items && items.length > 0) {
          const priceMap: { [key: string]: number } = {};
          items.forEach((item: any) => {
            console.log(`💰 [PRICE] Mapeando precio - serviceId: ${item.serviceId}, price: ${item.priceAtBooking}`);
            priceMap[item.serviceId] = item.priceAtBooking;
          });

          // Split into services and packages
          const newServicePrices: { [key: string]: number } = {};
          const newPackagePrices: { [key: string]: number } = {};

          selectedServiceIds.forEach((id) => {
            // Use size-based price if available, otherwise use price list price
            if (sizeBasedPrices[id]) {
              newServicePrices[id] = sizeBasedPrices[id];
              console.log(`✅ [PRICE] Usando precio por tamaño para ${id}: ${sizeBasedPrices[id]}`);
            } else if (priceMap[id]) {
              newServicePrices[id] = priceMap[id];
              console.log(`✅ [PRICE] Usando precio de lista para ${id}: ${priceMap[id]}`);
            } else {
              newServicePrices[id] = 0;
              console.log(`❌ [PRICE] NO HAY PRECIO para ${id} - asignando 0`);
            }
          });
          selectedPackageIds.forEach((id) => {
            // Para paquetes: NO usamos priceMap directamente
            // Se calculan automáticamente en resolvePackagePrice
            newPackagePrices[id] = 0;
          });

          console.log('📝 Service prices:', newServicePrices);
          console.log('📦 Package prices (initial):', newPackagePrices);

          setServicePrices(newServicePrices);
          
          // 🎯 NUEVO: Calcular precios de paquetes de forma asincrónica
          if (selectedPackageIds.length > 0) {
            (async () => {
              const calculatedPackagePrices: { [key: string]: number } = {};
              for (const packageId of selectedPackageIds) {
                const price = await resolvePackagePrice(packageId);
                calculatedPackagePrices[packageId] = price;
              }
              console.log('📦 Package prices (calculated):', calculatedPackagePrices);
              setPackagePrices(calculatedPackagePrices);
            })();
          } else {
            setPackagePrices(newPackagePrices);
          }
        } else {
          console.warn('⚠️ No items in pricing response:', pricingRes);
          // 🎯 Si no hay respuesta, usar 0 como fallback
          const newServicePrices: { [key: string]: number } = {};
          const newPackagePrices: { [key: string]: number } = {};
          
          selectedServiceIds.forEach((id) => {
            newServicePrices[id] = 0;
          });
          
          setServicePrices(newServicePrices);
          setPackagePrices(newPackagePrices);
        }
      } catch (err) {
        console.error('❌ [PRICE] Error calculando precios:', {
          error: err instanceof Error ? err.message : String(err),
          selectedServiceIds,
          selectedPackageIds,
          priceListId: selectedClient.price_list_id,
        });
        const newServicePrices: { [key: string]: number } = {};
        const newPackagePrices: { [key: string]: number } = {};
        
        selectedServiceIds.forEach((id) => {
          newServicePrices[id] = sizeBasedPrices[id] || 0;
          console.log(`⚠️ [PRICE] Error => asignando ${sizeBasedPrices[id] || 0} para ${id}`);
        });

        // En caso de error, intentar calcular paquetes igual
        if (selectedPackageIds.length > 0) {
          (async () => {
            const calculatedPackagePrices: { [key: string]: number } = {};
            for (const packageId of selectedPackageIds) {
              try {
                const price = await resolvePackagePrice(packageId);
                calculatedPackagePrices[packageId] = price;
              } catch (pkgErr) {
                console.warn(`⚠️ [PACKAGE PRICE] Error calculando precio para ${packageId}:`, pkgErr);
                calculatedPackagePrices[packageId] = 0;
              }
            }
            setPackagePrices(calculatedPackagePrices);
          })();
        } else {
          setPackagePrices(newPackagePrices);
        }
        
        setServicePrices(newServicePrices);
      }
    };

    loadSelectedPrices();
  }, [selectedClient?.price_list_id, Object.keys(commonServices).join(','), Object.keys(commonPackages).join(','), services, selectedPetIds.join(','), pets, resolvePackagePrice]);

  /**
   * 🎯 GROOMING: Calcular duración automática cuando cambien servicios o mascota
   * 🏥 MEDICAL: No calcular duración automática - usar default 30 min
   */
  useEffect(() => {
    const calculateAutoDuration = async () => {
      // 🏥 MEDICAL: No calcular duración automática
      if (serviceType === 'MEDICAL') {
        setFinalDuration(30);
        setDurationMinutes(30);
        return;
      }

      // Solo calcular si hay mascota seleccionada Y servicios seleccionados
      if (selectedPetIds.length === 0 || Object.keys(commonServices).length === 0) {
        resetDuration();
        // 🎯 En EDIT mode, NO resetear finalDuration a 30
        // Si está cargando datos de la cita, preservar el valor que se va a cargar
        if (!isEditMode) {
          setFinalDuration(30); // Default solo en CREATE mode
        }
        // 🎯 En EDIT mode, NO resetear la personalización del usuario
        // Si está editando y ya personalizó duración, dejar que persista
        if (!isEditMode) {
          setIsPersonalizingDuration(false);
        }
        return;
      }

      // Tomar el primer petId (en modo SINGLE)
      const petId = selectedPetIds[0];
      const serviceIds = Object.keys(commonServices);
      const pet = pets.find(p => p.id === petId);

      console.log('🎯 [DURATION CALC] Iniciando cálculo:', {
        petId,
        petName: pet?.name,
        petSize: pet?.size,
        serviceIds,
        serviceCount: serviceIds.length,
      });

      try {
        const result = await calculateDuration(petId, serviceIds);
        if (!result) {
          console.warn('⚠️ [DURATION CALC] API retornó null/undefined');
          // 🎯 En EDIT mode, no resetear
          if (!isEditMode) {
            setFinalDuration(30);
          }
          return;
        }
        console.log('✅ [DURATION CALC] Éxito:', {
          calculatedDuration: result.calculation?.calculatedDuration,
          roundedDuration: result.calculation?.roundedDuration,
        });
      } catch (err: any) {
        const errorMsg = err?.response?.data?.message || err?.message || 'Error desconocido';
        console.error('❌ [DURATION CALC] Error:', {
          error: errorMsg,
          petId,
          serviceIds,
          petSize: pet?.size,
        });
        toast.error(`⚠️ Error calculando duración: ${errorMsg}`);
        // 🎯 En EDIT mode, no resetear
        if (!isEditMode) {
          setFinalDuration(30);
        }
      }
    };

    calculateAutoDuration();
  }, [serviceType, selectedPetIds.join(','), Object.keys(commonServices).join(','), calculateDuration, pets, isEditMode]);

  /**
   * Actualizar finalDuration cuando se calcula automáticamente
   * ℹ️ Solo en CREATE mode - en EDIT mode, preservar el valor cargado
   * 🏥 MEDICAL: No actualizar automáticamente - mantener 30 min
   */
  useEffect(() => {
    // 🏥 MEDICAL: No actualizar duración automáticamente
    if (serviceType === 'MEDICAL') {
      return;
    }

    // En EDIT mode, NO sobreescribir finalDuration (esperar a que usuario haga click en "Sobreescribir")
    // En CREATE mode, sí actualizar con la duración calculada
    if (durationInfo && !isPersonalizingDuration && !isEditMode) {
      setFinalDuration(durationInfo.calculation.roundedDuration);
      // Actualizar durationMinutes también para compatibilidad con el resto del código
      setDurationMinutes(durationInfo.calculation.roundedDuration);
    }
  }, [serviceType, durationInfo, isPersonalizingDuration, isEditMode]);

  /**
   * 💰 Formatea un número como moneda con 2 decimales
   * Ej: 2023.5 -> "$2,023.50"
   */
  const formatCurrency = (amount: number): string => {
    return `$${amount.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };

  // Memoize active packages - filter only isActive packages
  const activePackages = useMemo(() => {
    return packages.filter((pkg) => pkg.isActive !== false);
  }, [packages]);

  // Filter services by category based on serviceType
  // MEDICAL: Only MEDICAL category services
  // GROOMING: All services (current behavior)
  const filteredServices = useMemo(() => {
    if (serviceType === 'MEDICAL') {
      return services.filter((svc) => svc.category === 'MEDICAL');
    }
    return services;
  }, [services, serviceType]);

  // Determine if packages tab should be visible (only if there are active packages)

  // Clear errors when critical appointment parameters change
  useEffect(() => {
    // When user changes date, time, location, or pets, clear previous validation errors
    // This allows the user to retry after fixing an issue
    // Also marks that we're no longer in auto-init phase
    setError(null);
    setOverlapError(null);
    setIsAutoInitializing(false); // User is now manually interacting
  }, [date, time, locationType, selectedPetIds.join(','), selectedClientId]);

  // Check if time is within clinic business hours
  const isTimeWithinBusinessHours = useMemo(() => {
    return (timeStr: string): boolean => {
      if (!date || !config?.businessHours) {
        console.warn(`⚠️ [DEBUG] isTimeWithinBusinessHours: missing date (${date}) or businessHours config`);
        return true;
      }

      try {
        // 🎯 FIX: Parse date string in clinic timezone to get correct day of week
        // When you do new Date('2026-03-09'), it's interpreted as UTC
        // But we need the day of week in the CLINIC timezone
        let selectedDate: Date;
        
        if (clinicTimezone) {
          // Parse the date string (yyyy-MM-dd) and treat it as local clinic time
          // Parse returns a Date in UTC, so we need to interpret the string as clinic local
          const [year, month, day] = date.split('-').map(Number);
          const tempDate = new Date(year, month - 1, day, 12, 0, 0); // noon UTC
          selectedDate = utcToZonedTime(tempDate, clinicTimezone);
        } else {
          selectedDate = new Date(date);
        }
        
        const dayOfWeek = selectedDate.getDay();
        const dayMap = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        const dayKey = dayMap[dayOfWeek] as keyof typeof config.businessHours.week;

      
        const dayHours = config.businessHours.week[dayKey];
        
        // If no hours configured for this day, assume closed
        if (!dayHours || dayHours.length === 0) {
          console.warn(`⚠️ [DEBUG] isTimeWithinBusinessHours: No hours for ${dayKey} (${date})`);
          return false;
        }

        // Check if timeStr falls within any of the business hour ranges for this day
        const [hours, mins] = timeStr.split(':').map(Number);
        const timeInMinutes = hours * 60 + mins;

        const isValid = dayHours.some((range) => {
          const [startHours, startMins] = range.start.split(':').map(Number);
          const [endHours, endMins] = range.end.split(':').map(Number);
          const startMinutes = startHours * 60 + startMins;
          const endMinutes = endHours * 60 + endMins;

          return timeInMinutes >= startMinutes && timeInMinutes < endMinutes;
        });

        return isValid;
      } catch (err) {
        console.error('Error checking business hours:', err);
        return true; // Default to allowing if error
      }
    };
  }, [date, config, clinicTimezone]);

  // Check if time is in the past (for today's date) - based on CLINIC timezone
  const isCurrentTimeInPast = useMemo(() => {
    return (timeStr: string): boolean => {
      // Only filter if date is today
      if (date !== minDate) {
        //console.log(`⏰ No es hoy: date=${date}, minDate=${minDate}`);
        return false;
      }

      try {
        const [hours, mins] = timeStr.split(':').map(Number);
        const slotMinutes = hours * 60 + mins;
        
        // Get current time in clinic timezone
        const utcNow = new Date();
        const clinicNow = clinicTimezone 
          ? utcToZonedTime(utcNow, clinicTimezone)
          : utcNow;
        const currentMinutes = clinicNow.getHours() * 60 + clinicNow.getMinutes();
        
        // Filter out times that are at or before current time
        return slotMinutes <= currentMinutes;
      } catch (err) {
        console.error('Error checking current time:', err);
        return false;
      }
    };
  }, [date, minDate, clinicTimezone]);

  useEffect(() => {
    console.log(`🕐 [DEBUG] date vs minDate: date="${date}", minDate="${minDate}", isToday=${date === minDate}`);
  }, [date, minDate]);

  // Check if there are any available times today
  const hasAvailableTimesToday = useMemo(() => {
    if (date !== minDate) return true; // Not today, so we assume there are times

    // Count available time slots for today
    let availableCount = 0;
    for (let i = 0; i < 96; i++) {
      const hours = Math.floor(i * 15 / 60);
      const mins = (i * 15) % 60;
      const timeStr = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
      const isOutsideBusinessHours = !isTimeWithinBusinessHours(timeStr);
      const isInThePast = isCurrentTimeInPast(timeStr);
      
      // Simple check: time is available if it's not in the past and within business hours
      if (!isOutsideBusinessHours && !isInThePast) {
        availableCount++;
      }
    }
    return availableCount > 0;
  }, [date, minDate, isTimeWithinBusinessHours, isCurrentTimeInPast]);

  // Recompute scheduledAt from date and time BEFORE using in other memos
  // CRITICAL: Use clinicLocalToUtc to convert clinic local time to UTC
  // This ensures date+time from form (in clinic timezone) are correctly converted
  const computedScheduledAt = useMemo(() => {
    if (!date || !time || !clinicTimezone) return null;
    return clinicLocalToUtc(date, time, clinicTimezone);
  }, [date, time, clinicTimezone]);

  // Calculate end time based on computed scheduled time
  const endTime = useMemo(() => {
    if (!computedScheduledAt) return null;
    return addMinutes(computedScheduledAt, durationMinutes);
  }, [computedScheduledAt, durationMinutes]);

  // Check booking validity - but skip during auto-initialization
  useEffect(() => {
    if (isAutoInitializing) {
      setBookingValidationError(null);
      return;
    }
    
    if (!scheduledAt || !config) {
      setBookingValidationError(null);
      return;
    }

    const validation = isBookable(scheduledAt, durationMinutes, config, exceptions, clinicTimezone);
    if (!validation.valid) {
      setBookingValidationError(validation.reason || null);
    } else {
      setBookingValidationError(null);
    }
  }, [scheduledAt, durationMinutes, config, exceptions, clinicTimezone, isAutoInitializing]);

  // Validate appointment conflicts (blocking overlaps + same day warnings)
  // Skip during auto-initialization phase and in EDIT mode (editing existing appointment)
  useEffect(() => {
    // En modo EDIT no validamos conflictos - la cita ya existe
    if (isEditMode) {
      setConflictWarning({ hasWarning: false });
      setPetConflicts([]);
      return;
    }

    if (isAutoInitializing) {
      setConflictWarning({ hasWarning: false });
      setPetConflicts([]);
      return;
    }
    
    if (selectedPetIds.length === 0 || !date || !time || !config || !locationType) {
      setConflictWarning({ hasWarning: false });
      setPetConflicts([]);
      return;
    }

    // Build the scheduledAt from date + time for conflict checking
    // 🎯 Use computedScheduledAt which is already correctly converted from clinic timezone to UTC
    if (!computedScheduledAt) {
      setConflictWarning({ hasWarning: false });
      setPetConflicts([]);
      return;
    }

    const scheduledAtForConflict = computedScheduledAt;

    console.log('🔄 Conflict validation useEffect triggered:', {
      selectedPetIds,
      date,
      time,
      appointmentsAvailable: appointments.length,
    });

      const petConflictResults = validateAppointmentConflicts(
        selectedPetIds,
        scheduledAtForConflict,
        durationMinutes,
        locationType as 'CLINIC' | 'HOME',
        appointments,
        clinicTimezone,
      );

    console.log('📊 Conflict validation results:', petConflictResults);

    // Store results for later use in validateForm
    setPetConflicts(petConflictResults);

    // Check if any pet has blocking conflicts to show warning
    const blockingResults = petConflictResults.filter(
      (result) => result.hasConflict && result.conflictType === 'BLOCKING'
    );

    if (blockingResults.length > 0) {
      // Show warning for blocking conflicts
      setConflictWarning({
        hasWarning: true,
        message: blockingResults.map((r) => r.reason).join('; ') || 'Hay un conflicto de horario con una cita existente',
      });
    } else {
      // No blocking conflicts, clear warning
      setConflictWarning({ hasWarning: false });
    }
  }, [selectedPetIds.join(','), date, time, durationMinutes, locationType, appointments.length, config, clinicTimezone, isAutoInitializing]);

  // Calculate occupied time slots based on clinic configuration
  // LOGIC:
  // 1. If clinic allows overlapping appointments → don't block any times
  // 2. If MEDICAL service and allowMedicalAppointmentOverlap=false → allow simultaneous (don't block)
  // 3. If clinic doesn't allow overlapping:
  //    - Block times only if there's a conflict in the SAME location type (CLINIC-CLINIC or HOME-HOME)
  //    - Allow times if conflict is with different location (CLINIC-HOME or HOME-CLINIC)
  // 4. Always exclude CANCELLED, NO_SHOW, and RESCHEDULED appointments from blocking
  const occupiedTimeSlots = useMemo(() => {
    const occupied = new Set<string>();
    
    if (!date || !config || !clinicTimezone) return occupied;

    // Check if MEDICAL appointments allow simultaneous visits
    const isMedical = serviceType === 'MEDICAL';
    const allowsMedicalSimultaneous = (config as any)?.allowMedicalAppointmentOverlap !== true; // false or undefined = allow simultaneous
    const allowsGroomingOverlap = (config as any)?.allowAppointmentOverlap ?? false;
    
    // For MEDICAL appointments when allowMedicalAppointmentOverlap=false, allow all times
    if (isMedical && allowsMedicalSimultaneous) {
      console.log('✅ Medical appointments allow simultaneous visits - all times available');
      return occupied;
    }
    
    // For GROOMING, check general overlap setting
    if (!isMedical && allowsGroomingOverlap) {
      console.log('✅ Clinic allows overlapping appointments - all times available');
      return occupied;
    }

    // Use extended range appointments if available (for auto-fill), otherwise use prop appointments
    const appointmentsToCheck = extendedRangeAppointments.length > 0 ? extendedRangeAppointments : appointments;

    // Get the appointments for the selected date that conflict with current location type
    // CRITICAL: 
    // 1. Use getClinicDateKey to compare dates in clinic timezone
    // 2. Exclude CANCELLED, NO_SHOW, and RESCHEDULED appointments - they don't block times
    const conflictingAppointments = appointmentsToCheck.filter((apt) => {
      // Skip cancelled, no-show, and rescheduled appointments - they don't block times
      if (apt.status === 'CANCELLED' || apt.status === 'NO_SHOW' || apt.rescheduled_at) {
        return false;
      }
      
      const aptDate = getClinicDateKey(new Date(apt.scheduled_at), clinicTimezone);
      // Only consider appointments:
      // 1. On the same date (in clinic timezone)
      // 2. In the SAME location type (to prevent overlaps)
      const sameLocation = (apt.location_type || 'CLINIC') === (locationType || 'CLINIC');
      return aptDate === date && sameLocation;
    });

    console.log(`🚫 Blocking times for ${locationType} appointments:`, {
      totalAppointmentsToday: appointmentsToCheck.filter(a => 
        getClinicDateKey(new Date(a.scheduled_at), clinicTimezone) === date
      ).length,
      conflictingAppointments: conflictingAppointments.length,
      locationType,
      date,
      usingExtendedRange: extendedRangeAppointments.length > 0
    });

    // Mark all 15-minute intervals occupied by conflicting appointments
    conflictingAppointments.forEach((apt) => {
      const aptStart = utcToZonedTime(new Date(apt.scheduled_at), clinicTimezone);
      const aptDuration = apt.duration_minutes || 30;
      const aptEnd = addMinutes(aptStart, aptDuration);

      console.log(`⏱️ Blocking ${apt.pet?.name || 'Pet'} appointment:`, {
        start: format(aptStart, 'HH:mm'),
        end: format(aptEnd, 'HH:mm'),
        location: apt.location_type
      });

      // Mark every 15-minute interval within the appointment duration as occupied
      let current = new Date(aptStart);
      while (current < aptEnd) {
        const hours = String(current.getHours()).padStart(2, '0');
        const mins = String(current.getMinutes()).padStart(2, '0');
        const timeStr = `${hours}:${mins}`;
        occupied.add(timeStr);
        current = addMinutes(current, 15);
      }

      // Also mark the last interval if appointment doesn't end exactly on 15-min boundary
      if (aptEnd.getMinutes() % 15 !== 0 || aptEnd.getMinutes() === 0) {
        const hours = String(aptEnd.getHours()).padStart(2, '0');
        const mins = String(aptEnd.getMinutes()).padStart(2, '0');
        const timeStr = `${hours}:${mins}`;
        occupied.add(timeStr);
      }
    });

    console.log(`🕐 [DEBUG] occupiedTimeSlots para ${date}:`, Array.from(occupied).sort(), {
      totalOccupied: occupied.size,
      locationType,
      usingExtendedRange: extendedRangeAppointments.length > 0,
      appointmentsCount: (extendedRangeAppointments.length > 0 ? extendedRangeAppointments : appointments).length
    });

    return occupied;
  }, [date, appointments.length, extendedRangeAppointments, locationType, config, clinicTimezone]);

  // Calculate price details for single appointment
  const singlePriceDetails = useMemo(() => {
    const details: PriceDetail[] = [];
    let total = 0;

    Object.entries(commonServices).forEach(([serviceId, qty]) => {
      const service = services.find((s) => s.id === serviceId);
      const price = servicePrices[serviceId] || 0;
      const subtotal = price * qty;
      details.push({
        itemName: service?.name || serviceId,
        itemType: 'service',
        price,
        quantity: qty,
        subtotal,
      });
      total += subtotal;
    });

    Object.entries(commonPackages).forEach(([packageId, qty]) => {
      const pkg = activePackages.find((p) => p.id === packageId);
      const price = packagePrices[packageId] || 0;
      const subtotal = price * qty;
      details.push({
        itemName: pkg?.name || packageId,
        itemType: 'package',
        price,
        quantity: qty,
        subtotal,
      });
      total += subtotal;
    });

    return { details, total };
  }, [commonServices, commonPackages, services, packages, servicePrices, packagePrices]);

  // Calculate price details for batch appointment
  const batchPriceTotal = useMemo(() => {
    let total = 0;

    if (!customizePerPet) {
      // Same services for all pets
      Object.entries(commonServices).forEach(([serviceId, qty]) => {
        const price = servicePrices[serviceId] || 0;
        total += price * qty;
      });
      Object.entries(commonPackages).forEach(([packageId, qty]) => {
        const price = packagePrices[packageId] || 0;
        total += price * qty;
      });
      // Multiply by number of pets
      total *= selectedPetIds.length;
    } else {
      // Each pet has different services
      petServiceData.forEach((petData) => {
        let petTotal = 0;
        Object.entries(petData.services).forEach(([serviceId, qty]) => {
          const price = servicePrices[serviceId] || 0;
          petTotal += price * qty;
        });
        Object.entries(petData.packages).forEach(([packageId, qty]) => {
          const price = packagePrices[packageId] || 0;
          petTotal += price * qty;
        });
        total += petTotal;
      });
    }

    return total;
  }, [customizePerPet, commonServices, commonPackages, petServiceData, servicePrices, packagePrices, selectedPetIds.length]);

  const handleAddressChange = (newAddressId: string) => {
    setSelectedAddressId(newAddressId);
  };

  const handleLocationChange = (newLocationType: 'CLINIC' | 'HOME') => {
    setLocationType(newLocationType);
    if (newLocationType === 'CLINIC') {
      setSelectedAddressId('');
    } else {
      setSelectedStaffUserId('');
    }
  };

  const handlePetToggle = (petId: string) => {
    setSelectedPetIds((prev) => {
      if (prev.includes(petId)) {
        return prev.filter((id) => id !== petId);
      } else {
        return [...prev, petId];
      }
    });
  };

  const handleCommonServiceAdd = (serviceId: string) => {
    setCommonServices((prev) => ({
      ...prev,
      [serviceId]: 1,
    }));
  };

  const handleCommonServiceRemove = (serviceId: string) => {
    setCommonServices((prev) => {
      const newServices = { ...prev };
      delete newServices[serviceId];
      return newServices;
    });
  };

  const handleCommonServiceQuantityChange = (serviceId: string, quantity: number) => {
    if (quantity <= 0) {
      handleCommonServiceRemove(serviceId);
    } else {
      setCommonServices((prev) => ({
        ...prev,
        [serviceId]: quantity,
      }));
    }
  };

  const handleCommonPackageAdd = (packageId: string) => {
    setCommonPackages((prev) => ({
      ...prev,
      [packageId]: 1,
    }));
  };

  const handleCommonPackageRemove = (packageId: string) => {
    setCommonPackages((prev) => {
      const newPackages = { ...prev };
      delete newPackages[packageId];
      return newPackages;
    });
  };

  const handleCommonPackageQuantityChange = (packageId: string, quantity: number) => {
    if (quantity <= 0) {
      handleCommonPackageRemove(packageId);
    } else {
      setCommonPackages((prev) => ({
        ...prev,
        [packageId]: quantity,
      }));
    }
  };

  const handlePetServiceAdd = (petIndex: number, serviceId: string) => {
    setPetServiceData((prev) => {
      const newData = [...prev];
      newData[petIndex].services = {
        ...newData[petIndex].services,
        [serviceId]: 1,
      };
      return newData;
    });
  };

  const handlePetServiceRemove = (petIndex: number, serviceId: string) => {
    setPetServiceData((prev) => {
      const newData = [...prev];
      const newServices = { ...newData[petIndex].services };
      delete newServices[serviceId];
      newData[petIndex].services = newServices;
      return newData;
    });
  };

  const handlePetServiceQuantityChange = (petIndex: number, serviceId: string, quantity: number) => {
    if (quantity <= 0) {
      handlePetServiceRemove(petIndex, serviceId);
    } else {
      setPetServiceData((prev) => {
        const newData = [...prev];
        newData[petIndex].services = {
          ...newData[petIndex].services,
          [serviceId]: quantity,
        };
        return newData;
      });
    }
  };

  const handlePetPackageAdd = (petIndex: number, packageId: string) => {
    setPetServiceData((prev) => {
      const newData = [...prev];
      newData[petIndex].packages = {
        ...newData[petIndex].packages,
        [packageId]: 1,
      };
      return newData;
    });
  };

  const handlePetPackageRemove = (petIndex: number, packageId: string) => {
    setPetServiceData((prev) => {
      const newData = [...prev];
      const newPackages = { ...newData[petIndex].packages };
      delete newPackages[packageId];
      newData[petIndex].packages = newPackages;
      return newData;
    });
  };

  const handlePetPackageQuantityChange = (petIndex: number, packageId: string, quantity: number) => {
    if (quantity <= 0) {
      handlePetPackageRemove(petIndex, packageId);
    } else {
      setPetServiceData((prev) => {
        const newData = [...prev];
        newData[petIndex].packages = {
          ...newData[petIndex].packages,
          [packageId]: quantity,
        };
        return newData;
      });
    }
  };

  const checkOverlaps = useCallback(async () => {
    if (!computedScheduledAt || selectedPetIds.length === 0) return null;

    try {
      const dateKey = getClinicDateKey(computedScheduledAt, clinicTimezone);
      const response = await appointmentsApi.getAppointments({
        from: dateKey,
        to: dateKey,
      });

      const appointmentsList = Array.isArray(response) ? response : (response.data || []);
      const startTime = computedScheduledAt.getTime();
      const endTimeMs = endTime!.getTime();

      for (const apt of appointmentsList) {
        const aptStart = new Date(apt.scheduled_at).getTime();
        const aptEnd = aptStart + (apt.duration_minutes || 30) * 60000;

        const hasTimeOverlap = startTime < aptEnd && endTimeMs > aptStart;

        if (hasTimeOverlap && apt.location_type === locationType) {
          return `Se empalma con cita a las ${format(
            new Date(apt.scheduled_at),
            'HH:mm'
          )} - ${apt.pet?.name || 'Cliente'}`;
        }
      }

      return null;
    } catch (err) {
      console.error('Error checking overlaps:', err);
      return null;
    }
  }, [computedScheduledAt, endTime, locationType, clinicTimezone]);

  const validateForm = (): boolean => {
    if (!selectedClientId) {
      toast.error('Selecciona un cliente');
      return false;
    }
    if (selectedPetIds.length === 0) {
      toast.error('Selecciona al menos una mascota');
      return false;
    }

    // 🎯 Validar que mascotas pertenezcan al cliente y tengan tamaño definido
    const selectedPets = pets.filter(p => selectedPetIds.includes(p.id));
    const petsWithoutSize = selectedPets.filter(p => !p.size);
    if (petsWithoutSize.length > 0) {
      const petNames = petsWithoutSize.map(p => p.name).join(', ');
      toast.error(`Mascotas sin tamaño definido: ${petNames}. Actualiza el tamaño en el perfil.`);
      return false;
    }

    if (locationType === 'HOME' && !selectedAddressId) {
      toast.error('Selecciona una dirección para citas a domicilio');
      return false;
    }
    if (!computedScheduledAt) {
      toast.error('Fecha/hora no válida');
      return false;
    }

    // 🎯 Validar fecha no sea más allá de 90 días
    const maxFutureDate = addMinutes(new Date(), 90 * 24 * 60);
    if (computedScheduledAt > maxFutureDate) {
      toast.error('No puedes agendar citas más allá de 90 días');
      return false;
    }

    // 🎯 Validar duración mínima
    if (!durationMinutes || durationMinutes < 15) {
      toast.error('Duración mínima: 15 minutos');
      return false;
    }
    if (durationMinutes > 480) {
      toast.error('Duración máxima: 480 minutos (8 horas)');
      return false;
    }

    // Validate services/packages
    if (mode === 'SINGLE') {
      if (Object.keys(commonServices).length === 0 && Object.keys(commonPackages).length === 0) {
        toast.error('Selecciona al menos un servicio o paquete');
        return false;
      }
      // 🎯 Validar que servicios existan
      const invalidServices = Object.keys(commonServices).filter(
        sId => !services.find(s => s.id === sId)
      );
      if (invalidServices.length > 0) {
        toast.error('Algunos servicios son inválidos. Recarga la página.');
        return false;
      }
    } else {
      // Batch mode
      const hasServices = customizePerPet
        ? petServiceData.some(
            (p) => Object.keys(p.services).length > 0 || Object.keys(p.packages).length > 0
          )
        : Object.keys(commonServices).length > 0 || Object.keys(commonPackages).length > 0;

      if (!hasServices) {
        toast.error('Selecciona al menos un servicio o paquete');
        return false;
      }

      // 🎯 Validar en customize per pet: cada mascota debe tener servicios
      if (customizePerPet) {
        const petsWithoutServices = petServiceData.filter(
          p => selectedPetIds.includes(p.petId) && 
               Object.keys(p.services).length === 0 && 
               Object.keys(p.packages).length === 0
        );
        if (petsWithoutServices.length > 0) {
          toast.error(`Algunas mascotas no tienen servicios asignados. Todos deben tener al menos uno.`);
          return false;
        }
      }
    }

    // 🎯 Validar estilista requerido para citas GROOMING
    if (serviceType === 'GROOMING' && !selectedStaffUserId) {
      toast.error('Selecciona un estilista para la cita de grooming');
      return false;
    }

    // 🎯 Validar veterinario requerido para citas MEDICAL
    if (serviceType === 'MEDICAL' && !selectedStaffUserId) {
      toast.error('Selecciona un veterinario para la cita médica');
      return false;
    }

    // 🎯 Validar precio total válido (> 0)
    if (mode === 'SINGLE' && singlePriceDetails.total <= 0) {
      toast.error('El precio total debe ser mayor a 0. Verifica que los servicios tengan precio configurado.');
      return false;
    }

    if (config) {
      const bookingValidation = isBookable(
        computedScheduledAt,
        durationMinutes,
        config,
        exceptions,
        clinicTimezone
      );
      if (!bookingValidation.valid) {
        toast.error(bookingValidation.reason || 'Horario no disponible');
        return false;
      }

      const capacityValidation = validateCapacity(
        locationType as 'CLINIC' | 'HOME',
        computedScheduledAt,
        endTime || new Date(),
        appointments,
        config,
        clinicTimezone,
        selectedStaffUserId // Pass assigned stylist ID to skip general HOME capacity check
      );
      if (!capacityValidation.valid) {
        toast.error(capacityValidation.reason || 'Capacidad alcanzada');
        return false;
      }

      // Validate stylist availability if assigned
      // Skip conflict check for MEDICAL appointments when allowMedicalAppointmentOverlap=false (simultaneous allowed)
      if (selectedStaffUserId) {
        const isMedicalType = serviceType === 'MEDICAL';
        const allowsMedicalSimultaneous = (config as any)?.allowMedicalAppointmentOverlap !== true; // false or undefined = allow simultaneous
        const shouldCheckConflict = !(isMedicalType && allowsMedicalSimultaneous);
        
        if (shouldCheckConflict) {
          const stylistValidation = checkStylistOverlap(
            selectedStaffUserId,
            computedScheduledAt,
            durationMinutes,
            appointments
          );
          if (!stylistValidation.valid) {
            toast.error(stylistValidation.reason || 'Estilista no disponible', {
              id: 'stylist-overlap-error',
            });
            return false;
          }
        }
      }

      // Validate appointment conflicts - now returns per-pet results
      const petConflictResults = validateAppointmentConflicts(
        selectedPetIds,
        computedScheduledAt,
        durationMinutes,
        locationType as 'CLINIC' | 'HOME',
        appointments,
        clinicTimezone
      );

      // Store conflict results for later use (in modal or filtering)
      setPetConflicts(petConflictResults);

      // Check if any pet has BLOCKING conflicts (temporal overlap)
      const blockingPets = petConflictResults.filter(
        (result) => result.hasConflict && result.conflictType === 'BLOCKING'
      );

      // Check if any pet has SAME_DAY conflicts (warning, not blocker)
      const sameDayPets = petConflictResults.filter(
        (result) => !result.hasConflict && result.conflictType === 'SAME_DAY'
      );

      // Calculate valid pets (those without blocking conflicts)
      const validPets = selectedPetIds.filter(
        (petId) =>
          !petConflictResults.find(
            (result) => result.petId === petId && result.hasConflict && result.conflictType === 'BLOCKING'
          )
      );
      setValidPetIds(validPets);

      // Handle BLOCKING conflicts (temporal overlaps)
      if (blockingPets.length > 0 && mode === 'BATCH') {
        // In BATCH mode with blocking conflicts, show partial batch modal
        setShowPartialBatchModal(true);
        return false; // Stop validation until user confirms partial batch
      }

      if (blockingPets.length > 0 && mode === 'SINGLE') {
        // In SINGLE mode, even one blocking conflict blocks everything
        const message = blockingPets[0].reason || 'Hay un conflicto de horario con una cita existente';
        toast.error(message);
        return false;
      }

      // Handle SAME_DAY conflicts (warnings)
      if (sameDayPets.length > 0 && !showConflictConfirmation) {
        // Mostrar modal de confirmación pero permitir continuar si el usuario confirma
        setShowConflictConfirmation(true);
        return false; // Detener aquí para que usuario confirme
      }
    }

    return true;
  };

  // 🎯 EDIT MODE: Submit handler for updating existing appointment
  const handleEditSubmit = async () => {
    if (!editingAppointment) return;

    setIsLoading(true);
    setError(null);

    try {
      // Build payload for updateAppointmentServices
      const serviceIds = Object.keys(commonServices);
      const payload: any = {};

      // Services (only if changed)
      if (serviceIds.length > 0) {
        payload.services = serviceIds.map((serviceId) => ({
          serviceId,
          quantity: commonServices[serviceId],
        }));
      }

      // Direction (only for HOME, if changed)
      if (editingAppointment.location_type === 'HOME' && selectedAddressId) {
        payload.address_id = selectedAddressId;
      }

      // Stylist (always include, even if empty to allow unsassigning)
      payload.assignedStaffUserId = selectedStaffUserId || null;

      // Duration (only if user explicitly customized it)
      // If not customized, backend will auto-calculate based on services
      console.log('📤 [EDIT SUBMIT] Estado de personalización de duración:', {
        isPersonalizingDuration,
        finalDuration,
        durationMinutes,
        willSendDuration: isPersonalizingDuration,
      });
      
      if (isPersonalizingDuration) {
        payload.durationMinutes = finalDuration;
        console.log('✅ [EDIT SUBMIT] Agregando durationMinutes al payload:', finalDuration);
      } else {
        console.log('ℹ️ [EDIT SUBMIT] NO agregando durationMinutes (backend recalculará automáticamente)');
      }

      console.log('📤 [EDIT SUBMIT] Payload completo a enviar:', JSON.stringify(payload, null, 2));
      
      await appointmentsApi.updateAppointmentServices(editingAppointment.id, payload);

      toast.success('Cita actualizada exitosamente');
      await onSuccess();
      await new Promise((resolve) => setTimeout(resolve, 500));
      handleClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error actualizando cita';
      setError(message);
      toast.error(message);
      console.error('Error updating appointment:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 🎯 EDIT MODE: Handle differently
    if (isEditMode && editingAppointment) {
      return handleEditSubmit();
    }

    // Validar que locationType fue seleccionado
    if (!locationType) {
      setError('Por favor selecciona el tipo de ubicación (Clínica o Domicilio)');
      return;
    }

    // All date/time corrections are now handled by useEffect above
    // This handleSubmit only focuses on validation and submission

    if (!validateForm()) return;

    // Si se mostró el modal de lote parcial, este será manejado desde allí
    // y no necesitamos continuar aquí
    if (mode === 'BATCH' && validPetIds.length > 0 && validPetIds.length < selectedPetIds.length && showPartialBatchModal) {
      return;
    }

    const petsToCreate = validPetIds.length > 0 ? validPetIds : selectedPetIds;
    const excludedPets = selectedPetIds.filter((petId) => !petsToCreate.includes(petId));

    setIsLoading(true);
    setError(null);
    setOverlapError(null);

    try {
      // 🎯 computedScheduledAt is already UTC (from clinicLocalToUtc)
      // Do NOT apply another timezone conversion
      const scheduledAtUtc = computedScheduledAt!.toISOString();
      
      console.log('%c🔍 [FRONTEND] Creando cita - Validación de UTC', 'color: blue; font-weight: bold');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Entrada del usuario:');
      console.log('  date:', date);
      console.log('  time:', time);
      console.log('  clinicTimezone:', clinicTimezone);
      console.log('');
      console.log('Conversión:');
      console.log('  computedScheduledAt:', computedScheduledAt!);
      console.log('  scheduledAtUtc (ISO):', scheduledAtUtc);
      console.log('  ¿Termina en Z?', scheduledAtUtc.endsWith('Z') ? '✅ SÍ' : '❌ NO');
      console.log('');
      console.log('Validación:');
      const isValidUtc = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/.test(scheduledAtUtc);
      console.log('  ¿Formato UTC válido?', isValidUtc ? '✅ SÍ' : '❌ NO');
      console.log('');
      console.log('Lo que se enviará al backend:');
      console.log('  scheduledAt:', scheduledAtUtc);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');

      if (mode === 'SINGLE') {
        // Single appointment
        const petId = petsToCreate[0];
        const serviceIds = Object.keys(commonServices);
        const quantities = serviceIds.map((id) => commonServices[id]);
        const packageIds = Object.keys(commonPackages);
        const packageQuantities = packageIds.map((id) => commonPackages[id]);

        // 🎯 Usar finalDuration si fue personalizada, si no usar durationMinutes (calculada)
        const appointmentDuration = isPersonalizingDuration ? finalDuration : durationMinutes;
        console.log('📤 [CREATE SUBMIT] Duración a enviar:', {
          isPersonalizingDuration,
          finalDuration,
          durationMinutes,
          appointmentDuration,
        });

        await pricingApi.createAppointmentWithPricing({
          clientId: selectedClientId,
          petId,
          scheduledAt: scheduledAtUtc,
          durationMinutes: appointmentDuration,
          locationType: locationType as 'CLINIC' | 'HOME',
          serviceType: serviceType,
          serviceIds,
          quantities,
          ...(packageIds.length > 0 && { packageIds }),
          ...(packageQuantities.length > 0 && { packageQuantities }),
          ...(locationType === 'HOME' && { addressId: selectedAddressId }),
          ...(selectedStaffUserId && {
            assignedStaffUserId: selectedStaffUserId,
          }),
          ...(notes && { reason: notes }),
        });

        toast.success('1 cita creada exitosamente');
      } else if (mode === 'BATCH') {
        // Batch appointments without partial conflicts (no valid/excluded distinction)
        // 🎯 Usar finalDuration si fue personalizada, si no usar durationMinutes (calculada)
        const appointmentDuration = isPersonalizingDuration ? finalDuration : durationMinutes;
        console.log('📤 [BATCH SUBMIT] Duración a enviar:', {
          isPersonalizingDuration,
          finalDuration,
          durationMinutes,
          appointmentDuration,
        });

        const payload = {
          clientId: selectedClientId,
          scheduledAt: scheduledAtUtc,
          durationMinutes: appointmentDuration,
          locationType: locationType as 'CLINIC' | 'HOME',
          serviceType: serviceType,
          ...(locationType === 'HOME' && { addressId: selectedAddressId }),
          ...(selectedStaffUserId && {
            assignedStaffUserId: selectedStaffUserId,
          }),
          ...(notes && { notes }),
          pets: selectedPetIds.map((petId, index) => {
            let serviceIds: string[];
            let quantities: number[];
            let packageIds: string[];
            let packageQuantities: number[];

            if (customizePerPet) {
              const petData = petServiceData[index];
              serviceIds = Object.keys(petData.services);
              quantities = serviceIds.map((id) => petData.services[id]);
              packageIds = Object.keys(petData.packages);
              packageQuantities = packageIds.map((id) => petData.packages[id]);
            } else {
              serviceIds = Object.keys(commonServices);
              quantities = serviceIds.map((id) => commonServices[id]);
              packageIds = Object.keys(commonPackages);
              packageQuantities = packageIds.map((id) => commonPackages[id]);
            }

            return {
              petId,
              serviceIds,
              quantities,
              ...(packageIds.length > 0 && { packageIds }),
              ...(packageQuantities.length > 0 && { packageQuantities }),
            };
          }),
        };

        await appointmentsApi.createBatchAppointmentWithPricing(payload);
        toast.success(`${selectedPetIds.length} citas creadas exitosamente`);
      }

      await onSuccess();
      await new Promise((resolve) => setTimeout(resolve, 500));
      handleClose();
    } catch (err) {
      let message = err instanceof Error ? err.message : 'Error creating appointment(s)';
      
      if (message.includes('Pet already has an appointment on this day')) {
        message = '❌ Una mascota seleccionada ya tiene una cita programada para este día. Por favor, cambia la fecha o selecciona otra mascota.';
      } else if (message.includes('Clinic capacity reached')) {
        message = '❌ Capacidad de la clínica completa para la hora seleccionada. Por favor, elige otro horario.';
      } else if (message.includes('Home capacity reached')) {
        message = '❌ No hay capacidad disponible para servicio a domicilio en la hora seleccionada. Por favor, elige otro horario.';
      } else if (message.includes('Clinic is closed')) {
        message = '❌ La clínica está cerrada en la fecha seleccionada. Por favor, elige un día laboral.';
      } else if (message.includes('addressId is required')) {
        message = '❌ Dirección requerida para servicio a domicilio. Por favor, selecciona una dirección.';
      }
      
      setError(message);
      console.error('Error creating appointment:', err);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedClientId('');
    setSelectedClient(null);
    setSelectedPetIds([]);
    // Resetear locationType al cerrar: en calendar usar defaultLocationType, en new-button usar defaultLocationType o null
    setLocationType(defaultLocationType || null);
    // 🔧 FIX: Reset ALL conflict states when closing modal
    setConflictWarning({ hasWarning: false });
    setPetConflicts([]);
    setShowConflictConfirmation(false);
    setValidPetIds([]);
    setSelectedAddressId('');
    setSelectedStaffUserId('');
    setDate('');
    setTime('09:00');
    setDurationMinutes(30);
    // 🎯 Reset para duración automática grooming
    setFinalDuration(30);
    setIsPersonalizingDuration(false);
    resetDuration();
    setNotes('');
    setCommonServices({});
    setCommonPackages({});
    setPetServiceData([]);
    setCustomizePerPet(false);
    setServicePrices({});
    setPackagePrices({});
    setExtendedRangeAppointments([]);
    setError(null);
    setOverlapError(null);
    setBookingValidationError(null);
    setShowPartialBatchModal(false);
    setIsAutoInitializing(true); // Reset for next modal open
    setEditDataLoaded(false); // 🎯 Reset para la próxima apertura en modo EDIT
    onClose();
  };

  if (!isOpen) return null;

  // 🎯 Validar que mascotas seleccionadas tengan tamaño
  const petsWithoutSize = selectedPetIds.some(
    (petId) => !pets.find((p) => p.id === petId)?.size
  );

  // 🎯 Validar que no haya blocking conflicts
  const hasBlockingConflicts = petConflicts.some(
    (p) => p.hasConflict && p.conflictType === 'BLOCKING'
  );

  const isSubmitDisabled =
    isLoading ||
    isLoadingData ||
    !selectedClientId ||
    selectedPetIds.length === 0 ||
    (locationType === 'HOME' && !selectedAddressId) ||
    (mode === 'SINGLE' &&
      Object.keys(commonServices).length === 0 &&
      Object.keys(commonPackages).length === 0) ||
    !!overlapError ||
    !!bookingValidationError ||
    petsWithoutSize ||
    hasBlockingConflicts;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <MdCalendarToday size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                {isEditMode 
                  ? 'Editar Cita' 
                  : serviceType === 'MEDICAL' 
                    ? 'Nueva Visita Médica'
                    : 'Nueva Cita de Grooming'
                }
              </h2>
              <p className="text-primary-100 text-sm mt-0.5">
                {isEditMode 
                  ? `${locationType === 'CLINIC' ? '🏥 Clínica' : '🚗 Domicilio'}` 
                  : (mode === 'SINGLE' ? '1 mascota' : `${selectedPetIds.length} mascotas`)
                }
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-white/70 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-all disabled:opacity-50"
          >
            <MdClose size={24} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg text-red-700 text-sm flex items-start gap-3">
              <span className="text-lg mt-0.5">⚠️</span>
              <p>{error}</p>
            </div>
          )}

          {/* STEP 1: Seleccionar tipo de ubicación - SOLO para GROOMING (MEDICAL siempre es CLINIC) */}
          {!locationType && !isEditMode && serviceType === 'GROOMING' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-2">¿Dónde será la cita?</h3>
                <p className="text-sm text-gray-600">
                  {sourceType === 'new-button' 
                    ? 'Selecciona el tipo de ubicación para encontrar el próximo horario disponible'
                    : 'Selecciona el tipo de ubicación para esta cita'
                  }
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                <button
                  type="button"
                  onClick={() => {
                    console.log('🏥 [DEBUG] Usuario seleccionó CLINIC');
                    setLocationType('CLINIC');
                  }}
                  className="flex flex-col items-center gap-3 p-6 border-2 border-gray-200 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-all"
                >
                  <div className="text-4xl">🏥</div>
                  <span className="font-semibold text-gray-900">En Clínica</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    console.log('🏠 [DEBUG] Usuario seleccionó HOME');
                    setLocationType('HOME');
                  }}
                  className="flex flex-col items-center gap-3 p-6 border-2 border-gray-200 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-all"
                >
                  <div className="text-4xl">🏠</div>
                  <span className="font-semibold text-gray-900">A Domicilio</span>
                </button>
              </div>
            </div>
          )}

          {/* EDIT MODE: Loading while data loads */}
          {isEditMode && !locationType && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <div className="animate-spin mb-3">
                <MdCalendarToday size={32} />
              </div>
              <p>Cargando datos de la cita...</p>
            </div>
          )}

          {/* RESTO DEL CONTENIDO: Solo mostrar después de seleccionar tipo de ubicación */}
          {locationType && (
            <>
              {overlapError && (
                <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-lg text-amber-700 text-sm flex items-start gap-3">
                  <span className="text-lg mt-0.5">⏰</span>
                  <p>{overlapError}</p>
                </div>
              )}

              {bookingValidationError && (
                <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg text-red-700 text-sm flex items-start gap-3">
                  <span className="text-lg mt-0.5">🚫</span>
                  <p>{bookingValidationError}</p>
                </div>
              )}

              {(conflictWarning.hasWarning || showConflictConfirmation) && (
                <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-lg text-amber-700 text-sm flex items-start gap-3">
                  <span className="text-lg mt-0.5">⚠️</span>
                  <p>{conflictWarning.message || 'Hay un conflicto de horario'}</p>
                </div>
              )}

              {isLoadingData ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <div className="animate-spin mb-3">
                    <MdCalendarToday size={32} />
                  </div>
                  <p>Cargando información...</p>
                </div>
              ) : (
                <>
                  {/* NEW LAYOUT: TOP ROW CLIENT + FECHA */}
                  <div className="grid grid-cols-2 gap-5 mb-5">
                    {/* LEFT: Cliente */}
                    <div className="space-y-3">
                      {/* Client Selection - EDIT MODE: READ ONLY */}
                      <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="bg-primary-100 p-2 rounded-lg">
                            <MdPerson className="text-primary-600" size={18} />
                          </div>
                          <label className="text-sm font-semibold text-gray-700">
                            {isEditMode ? 'Cliente' : 'Selecciona el Cliente'} *
                          </label>
                        </div>
                        {isEditMode ? (
                          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                            <p className="text-sm font-semibold text-gray-900">{selectedClient?.name}</p>
                            <p className="text-xs text-gray-600 mt-1">Solo lectura</p>
                          </div>
                        ) : (
                          <ClientAutocomplete
                            value={selectedClientId}
                            onChange={setSelectedClientId}
                            onClientSelect={setSelectedClient}
                            disabled={isLoading}
                            onCreateClientClick={() => {
                              setIsCreatingClient(true);
                              setShowClientFormModal(true);
                            }}
                          />
                        )}
                      </div>

                      {/* Client Info Card - Minimalist */}
                      {selectedClient && (
                        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                          <div className="flex items-start justify-between mb-3">
                            <p className="text-sm font-bold text-gray-900">{selectedClient.name}</p>
                            {!isEditMode && (
                              <button
                                type="button"
                                onClick={() => {
                                  setIsCreatingClient(false);
                                  setShowClientFormModal(true);
                                }}
                                disabled={isLoading}
                                className="px-3 py-1 text-xs bg-primary-50 text-primary-600 border border-primary-300 rounded-lg hover:bg-primary-100 transition-colors disabled:opacity-50 font-semibold whitespace-nowrap hover:shadow-sm"
                              >
                                Editar
                              </button>
                            )}
                          </div>
                          <div className="space-y-2">
                            {selectedClient.phone && (
                              <p className="flex items-center gap-2 text-xs text-gray-600">
                                <span className="text-gray-400">📞</span> {selectedClient.phone}
                              </p>
                            )}
                            {selectedClient.email && (
                              <p className="flex items-center gap-2 text-xs text-gray-600">
                                <span className="text-gray-400">✉️</span> <span className="truncate">{selectedClient.email}</span>
                              </p>
                            )}
                            {selectedClient.notes && (
                              <p className="flex items-start gap-2 text-xs text-gray-500 italic">
                                <span className="text-gray-400 mt-0.5">📝</span> {selectedClient.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* RIGHT: Fecha, Hora, Duración */}
                    <div className="space-y-3">
                      <div className="bg-white rounded-xl p-4 border border-gray-200 space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="bg-gray-100 p-2 rounded-lg">
                            <MdCalendarToday className="text-gray-700" size={18} />
                          </div>
                          <label className="text-sm font-semibold text-gray-700">Fecha y Hora *</label>
                        </div>

                        {/* En modo EDIT: mostrar como label readonly */}
                        {isEditMode ? (
                          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                            <p className="text-emerald-800 font-medium text-lg">
                              <span className="text-emerald-600">Horario:</span>{' '}
                              {date && time ? (
                                <>
                                  {new Date(`${date}T${time}`).toLocaleDateString('es-CO', { 
                                    weekday: 'long', 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                  })}{' '}
                                  {time} → {(() => {
                                    const [h, m] = time.split(':').map(Number);
                                    const endMinutes = h * 60 + m + durationMinutes;
                                    const endH = Math.floor(endMinutes / 60);
                                    const endM = endMinutes % 60;
                                    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
                                  })()}
                                </>
                              ) : 'Cargando...'}
                            </p>
                            <p className="text-emerald-600 text-sm mt-1">
                              ⏱️ Duración: {durationMinutes} minutos
                            </p>
                          </div>
                        ) : (
                          <>
                        {/* Fecha y Hora en el mismo renglón */}
                        <div className="grid grid-cols-2 gap-4">
                          {/* Fecha */}
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">
                              📅 Fecha *
                            </label>
                            <input
                              type="date"
                              value={date}
                              onChange={(e) => setDate(e.target.value)}
                              min={minDate}
                              disabled={isLoading}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 text-gray-900"
                            />
                          </div>

                          {/* Hora */}
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">
                              🕐 Hora (15 min) *
                            </label>
                            {date === minDate && !hasAvailableTimesToday && !isAutoInitializing && sourceType !== 'new-button' && (
                              <div className="bg-amber-50 border-l-4 border-amber-500 rounded p-3 mb-3">
                                <p className="text-sm text-amber-700 font-medium mb-2">⏰ No hay horarios disponibles para hoy</p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    // 🎯 FIX: Use clinic timezone for date calculation
                                    const tomorrowUTC = new Date();
                                    tomorrowUTC.setDate(tomorrowUTC.getDate() + 1);
                                    const tomorrowInClinicTz = clinicTimezone
                                      ? utcToZonedTime(tomorrowUTC, clinicTimezone)
                                      : tomorrowUTC;
                                    setDate(format(tomorrowInClinicTz, 'yyyy-MM-dd'));
                                    setTime('09:00');
                                  }}
                                  className="text-sm bg-amber-600 text-white px-3 py-1.5 rounded font-semibold hover:bg-amber-700 transition-colors"
                                >
                                  📅 Cambiar a mañana
                                </button>
                              </div>
                            )}
                            <select
                              value={time}
                              onChange={(e) => setTime(e.target.value)}
                              disabled={isLoading}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 text-gray-900"
                            >
                              <option value="">Selecciona una hora</option>
                              {(() => {
                                console.log(`🔍 [RENDER] Select horario - date=${date}, minDate=${minDate}, isToday=${date === minDate}`);
                                const validOptions: JSX.Element[] = [];
                                const debugInfo = { occupied: 0, outsideHours: 0, inPast: 0, valid: 0 };
                                const examples = { outsideHours: [] as string[], inPast: [] as string[], occupied: [] as string[] };
                                
                                for (let i = 0; i < 96; i++) {
                                  const hours = Math.floor(i * 15 / 60);
                                  const mins = (i * 15) % 60;
                                  const timeStr = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
                                  const isOccupied = occupiedTimeSlots.has(timeStr);
                                  const isOutsideBusinessHours = !isTimeWithinBusinessHours(timeStr);
                                  const isInThePast = isCurrentTimeInPast(timeStr);
                                  
                                  if (isOccupied) {
                                    debugInfo.occupied++;
                                    if (examples.occupied.length < 2) examples.occupied.push(timeStr);
                                  } else if (isOutsideBusinessHours) {
                                    debugInfo.outsideHours++;
                                    if (examples.outsideHours.length < 2) examples.outsideHours.push(timeStr);
                                  } else if (isInThePast) {
                                    debugInfo.inPast++;
                                    if (examples.inPast.length < 2) examples.inPast.push(timeStr);
                                  } else {
                                    debugInfo.valid++;
                                    validOptions.push(
                                      <option 
                                        key={timeStr} 
                                        value={timeStr}
                                      >
                                        {timeStr}
                                      </option>
                                    );
                                  }
                                }
                                
                                console.log(`📊 [DEBUG] Análisis para ${date}:`, {
                                  ...debugInfo,
                                  'válidas found': validOptions.length,
                                  examples
                                });
                                
                                return validOptions;
                              })()}
                            </select>
                          </div>
                        </div>
                          </>
                        )}

                        {/* Duración - editable en CREATE, editable en EDIT */}
                        {(
                          <div className="space-y-3">
                            {isEditMode && (
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <p className="text-sm text-blue-800">
                                  ℹ️ La duración se recalcula automáticamente según los servicios seleccionados.
                                </p>
                              </div>
                            )}
                            {/* Mostrar DurationBreakdownCard si hay servicios seleccionados (CREATE o EDIT) */}
                            {Object.keys(commonServices).length > 0 && durationInfo ? (
                              <>
                                {/* DurationBreakdownCard */}
                                <DurationBreakdownCard durationInfo={durationInfo} />

                                {/* Opciones de personalización - mostrar botón si NO está personalizando */}
                                {!isPersonalizingDuration ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      console.log('🔄 [OVERRIDE] Usuario presionó "Sobreescribir Duración"', {
                                        finalDuration,
                                        durationMinutes,
                                      });
                                      setIsPersonalizingDuration(true);
                                    }}
                                    className="w-full px-4 py-2 text-sm font-medium text-orange-600 hover:bg-orange-50 border border-orange-200 rounded-lg transition-colors"
                                  >
                                    ⚡ Sobreescribir Duración
                                  </button>
                                ) : (
                                  <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                      ⏱️ Duración Personalizada (minutos)
                                    </label>
                                    <div className="flex gap-2">
                                      <input
                                        type="number"
                                        value={finalDuration}
                                        onChange={(e) => {
                                          const val = parseInt(e.target.value) || 30;
                                          const finalVal = Math.min(480, Math.max(30, val));
                                          console.log('⏱️ [DURATION INPUT] Usuario cambió duración:', {
                                            input: e.target.value,
                                            parsed: val,
                                            final: finalVal,
                                            isEditMode,
                                            isPersonalizingDuration,
                                          });
                                          setFinalDuration(finalVal);
                                          setDurationMinutes(finalVal);
                                        }}
                                        min="30"
                                        max="480"
                                        step="5"
                                        disabled={isLoading || isDurationLoading}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 text-gray-900"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          console.log('❌ [OVERRIDE] Usuario canceló personalización', {
                                            finalDuration: durationInfo?.calculation?.roundedDuration,
                                          });
                                          setIsPersonalizingDuration(false);
                                          // Restaurar el valor calculado si es CREATE mode, o el valor original si es EDIT mode
                                          if (isEditMode) {
                                            // En EDIT, restaurar el valor que se cargó
                                            const originalDuration = editingAppointment.duration_minutes || 30;
                                            setFinalDuration(originalDuration);
                                            setDurationMinutes(originalDuration);
                                          } else if (durationInfo) {
                                            // En CREATE, restaurar el calculado
                                            setFinalDuration(durationInfo.calculation.roundedDuration);
                                            setDurationMinutes(durationInfo.calculation.roundedDuration);
                                          }
                                        }}
                                        className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 border border-gray-300 rounded-lg transition-colors"
                                      >
                                        ❌ Cancelar
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </>
                            ) : (
                              // Si no hay servicios seleccionados O falla el cálculo, mostrar select default
                              <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">
                                  ⏱️ Duración * {isDurationLoading && '(calculando...)'}
                                </label>
                                {/* Si hay servicios pero falla el cálculo, mostrar aviso */}
                                {Object.keys(commonServices).length > 0 && !durationInfo && !isDurationLoading && (
                                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                                    <p className="text-sm text-yellow-800">
                                      ⚠️ No se pudo calcular automáticamente. Selecciona manualmente:
                                    </p>
                                  </div>
                                )}
                                <select
                                  value={durationMinutes.toString()}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    setDurationMinutes(val);
                                    setFinalDuration(val);
                                  }}
                                  disabled={isLoading || isDurationLoading}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 text-gray-900"
                                >
                                  <option value="30">30 minutos</option>
                                  <option value="45">45 minutos</option>
                                  <option value="60">1 hora</option>
                                  <option value="90">1 hora 30 minutos</option>
                                  <option value="120">2 horas</option>
                                </select>
                              </div>
                            )}
                          </div>
                        )}

                        {/* End time display - solo en modo CREATE */}
                        {!isEditMode && computedScheduledAt && endTime && (
                          <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-3">
                            <p className="text-green-700 text-sm">
                              <strong>Horario:</strong> {displayFormatters.formatForModal(computedScheduledAt, clinicTimezone)} → {displayFormatters.formatTimeOnly(endTime, clinicTimezone)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* MASCOTAS SECTION - FULL WIDTH WITH HORIZONTAL SCROLL, OR READONLY IN EDIT MODE */}
                  {selectedClientId && (
                    <div className="bg-white rounded-xl p-4 border border-gray-200 mb-5">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="bg-gray-100 p-2 rounded-lg">
                          <MdPets className="text-gray-700" size={18} />
                        </div>
                        <label className="text-sm font-semibold text-gray-700">
                          {isEditMode ? 'Mascota' : `Mascotas * (${selectedPetIds.length})`}
                        </label>
                      </div>
                      {isEditMode ? (
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <p className="text-sm font-semibold text-gray-900">
                            {pets.find((p) => p.id === selectedPetIds[0])?.name}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">Solo lectura</p>
                        </div>
                      ) : (
                        <>
                          {pets.length === 0 ? (
                            <p className="text-gray-600 text-sm py-4 text-center">No hay mascotas para este cliente</p>
                          ) : (
                            <div className="flex gap-3 overflow-x-auto snap-x pb-2">
                          {pets.map((pet) => {
                            // Helper function to get species emoji
                            const getSpeciesEmoji = (species: string): string => {
                              const speciesMap: { [key: string]: string } = {
                                'DOG': '🐕',
                                'CAT': '🐈',
                                'BIRD': '🦜',
                                'RABBIT': '🐰',
                                'HAMSTER': '🐹',
                                'GUINEA_PIG': '🐹',
                                'FISH': '🐠',
                                'TURTLE': '🐢',
                                'FERRET': '🦢',
                                'OTHER': '🐾',
                              };
                              return speciesMap[species] || '🐾';
                            };

                            // Helper function to get size label
                            const getSizeLabel = (size?: string): string => {
                              const sizeMap: { [key: string]: string } = {
                                'XS': 'XS',
                                'S': 'S',
                                'M': 'M',
                                'L': 'L',
                                'XL': 'XL',
                              };
                              return size ? sizeMap[size] || size : '';
                            };

                            const isSelected = selectedPetIds.includes(pet.id);

                            return (
                              <button
                                key={pet.id}
                                type="button"
                                onClick={() => handlePetToggle(pet.id)}
                                disabled={isLoading}
                                className={`flex-shrink-0 w-56 rounded-lg border transition-all text-left snap-center ${
                                  isSelected
                                    ? 'bg-white border-primary-500 shadow-md'
                                    : 'bg-gray-50 border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300'
                                } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                              >
                                <div className="p-4">
                                  {/* Header */}
                                  <div className="flex items-start justify-between gap-2 mb-3">
                                    <div className="flex items-center gap-2">
                                      <span className="text-2xl">{getSpeciesEmoji(pet.species)}</span>
                                      <p className="text-base font-semibold text-gray-900 truncate">{pet.name}</p>
                                    </div>
                                    {isSelected && (
                                      <MdCheckCircle className="text-primary-600 flex-shrink-0" size={20} />
                                    )}
                                  </div>
                                  
                                  {/* Details */}
                                  <div className="flex flex-col gap-2 text-xs text-gray-600">
                                    {pet.breed && <span className="font-medium text-gray-700">{pet.breed}</span>}
                                    <div className="flex items-center gap-2">
                                      {pet.size && <span className="text-gray-600">📏 {getSizeLabel(pet.size)}</span>}
                                      {pet.sex && pet.sex !== 'UNKNOWN' && (
                                        <span className="text-gray-600">{pet.sex === 'MALE' ? '♂ M' : '♀ H'}</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                        )}
                        </>
                      )}
                    </div>
                  )}

                  {/* DIRECCIONES SECTION - FULL WIDTH WITH HORIZONTAL SCROLL (only for HOME) */}
                  {locationType === 'HOME' && selectedClientId && addresses.length > 0 && (
                    <div className="bg-white rounded-xl p-4 border border-gray-200 mb-5">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="bg-gray-100 p-2 rounded-lg">
                          <MdLocationOn className="text-gray-700" size={18} />
                        </div>
                        <label className="text-sm font-semibold text-gray-700">Dirección *</label>
                      </div>
                      <div className="flex gap-3 overflow-x-auto snap-x pb-2">
                        {addresses.map((address) => {
                          const isSelected = selectedAddressId === address.id;
                          const addressLabel = address.label ? `${address.label}` : 'Sin etiqueta';
                          const addressStreet = `${address.street} ${address.number_ext || ''}${address.number_int ? `-${address.number_int}` : ''}`.trim();
                          
                          return (
                            <button
                              type="button"
                              key={address.id}
                              onClick={() => handleAddressChange(address.id)}
                              disabled={isLoading}
                              className={`flex-shrink-0 w-56 rounded-lg border transition-all text-left snap-center ${
                                isSelected
                                  ? 'bg-white border-primary-500 shadow-md'
                                  : 'bg-gray-50 border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300'
                              } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                              <div className="p-4">
                                <div className="flex items-start justify-between gap-2 mb-3">
                                  <p className="font-semibold text-sm text-gray-900">{addressLabel}</p>
                                  {isSelected && (
                                    <MdCheckCircle className="text-primary-600 flex-shrink-0" size={20} />
                                  )}
                                </div>
                                
                                <div className="space-y-1">
                                  <p className="text-xs text-gray-600 line-clamp-2">{addressStreet}</p>
                                  <p className="text-xs text-gray-500">{address.city}</p>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* STAFF SECTION - ESTILISTA (GROOMING) or VETERINARIO (MEDICAL) */}
                  <div className="bg-white rounded-xl p-4 border border-gray-200 mb-5">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="bg-gray-100 p-2 rounded-lg">
                        <MdPerson className="text-gray-700" size={18} />
                      </div>
                      <label className="text-sm font-semibold text-gray-700">
                        {serviceType === 'MEDICAL' 
                          ? 'Veterinario (Opcional)' 
                          : 'Estilista (Opcional)'}
                      </label>
                    </div>
                    {locationType || serviceType === 'MEDICAL' ? (
                      <>
                        {/* EDIT MODE: Mostrar quién está actualmente asignado */}
                        {isEditMode && selectedStaffUserId && (
                          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-3">
                            <p className="text-xs font-semibold text-purple-700 mb-1">👤 Asignado actualmente:</p>
                            <p className="text-sm text-purple-900 font-medium">
                              {allStylists.find(s => s.userId === selectedStaffUserId)?.displayName || 'Desconocido'}
                            </p>
                          </div>
                        )}
                        <div className="flex gap-3 overflow-x-auto snap-x pb-2">
                          {/* Show "Sin asignar" button for both GROOMING and MEDICAL (both optional) */}
                          {(serviceType === 'GROOMING' || serviceType === 'MEDICAL') && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedStaffUserId('');
                              }}
                              disabled={isLoading}
                              className={`flex-shrink-0 w-48 rounded-lg border transition-all text-left snap-center ${
                                selectedStaffUserId === ''
                                  ? 'bg-white border-primary-500 shadow-md'
                                  : 'bg-gray-50 border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300'
                              } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                              <div className="p-4">
                                <div className="flex items-start justify-between gap-2 mb-3">
                                  <div className="flex items-center gap-2">
                                    <span className="text-2xl">🚫</span>
                                    <p className="text-base font-semibold text-gray-900">Sin asignar</p>
                                  </div>
                                  {selectedStaffUserId === '' && (
                                    <MdCheckCircle className="text-primary-600 flex-shrink-0" size={20} />
                                  )}
                                </div>
                                <p className="text-xs text-gray-500">Se asignará después</p>
                              </div>
                            </button>
                          )}

                          {/* Staff cards - Estilistas (GROOMING) or Veterinarios (MEDICAL) */}
                          {stylists.map((staff) => {
                            const isSelected = selectedStaffUserId === staff.userId;
                            const staffName = staff.displayName;
                            const staffEmoji = serviceType === 'GROOMING' ? '✂️' : '🩺';
                            const typeInfo = serviceType === 'GROOMING' 
                              ? `${staff.type === 'CLINIC' ? '🏥' : '🏠'} ${staff.type === 'CLINIC' ? 'Clínica' : 'Domicilio'}`
                              : `👨‍⚕️ Veterinario`;

                            return (
                              <button
                                key={staff.id}
                                type="button"
                                onClick={() => {
                                  setSelectedStaffUserId(staff.userId);
                                }}
                                disabled={isLoading}
                                className={`flex-shrink-0 w-48 rounded-lg border transition-all text-left snap-center ${
                                  isSelected
                                    ? 'bg-white border-primary-500 shadow-md'
                                    : 'bg-gray-50 border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300'
                                } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                              >
                                <div className="p-4">
                                  <div className="flex items-start justify-between gap-2 mb-3">
                                    <div className="flex items-center gap-2">
                                      <span className="text-2xl">{staffEmoji}</span>
                                      <p className="text-base font-semibold text-gray-900 truncate">{staffName}</p>
                                    </div>
                                    {isSelected && (
                                      <MdCheckCircle className="text-primary-600 flex-shrink-0" size={20} />
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-600">
                                    {typeInfo}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>


                      </>
                    ) : serviceType === 'GROOMING' ? (
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 text-center">
                        <p className="text-sm text-gray-500">Selecciona un tipo de cita primero</p>
                      </div>
                    ) : null}
                    {/* Show messages for GROOMING mode only */}
                    {serviceType === 'GROOMING' && locationType && allStylists.length === 0 && (
                      <p className="text-xs text-gray-500 mt-2">
                        No hay estilistas registrados para tipo {locationType === 'CLINIC' ? '🏥 Clínica' : '🏠 Domicilio'}
                      </p>
                    )}
                    {serviceType === 'GROOMING' && locationType && allStylists.length > 0 && stylists.length === 0 && date && time && (
                      <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
                        <p className="flex items-center gap-2 font-semibold">
                          <span>⚠️</span>
                          No hay estilistas disponibles para este horario
                        </p>
                        <p className="text-xs mt-1">
                          Hay {allStylists.length} estilista(s) de tipo {locationType === 'CLINIC' ? 'Clínica' : 'Domicilio'}, pero ninguno está disponible para el {date} a las {time}. Pueden estar ocupados, de vacaciones, o fuera de su horario laboral.
                        </p>
                      </div>
                    )}
                    {/* Show message for MEDICAL mode when no veterinarians available */}
                    {serviceType === 'MEDICAL' && allVeterinarians.length === 0 && (
                      <p className="text-xs text-gray-500 mt-2">
                        No hay veterinarios registrados
                      </p>
                    )}
                  </div>



                  {/* BATCH MODE: Banner */}
                  {mode === 'BATCH' && (
                    <div className="bg-white rounded-xl p-4 border border-gray-200 mb-5">
                      <p className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <span className="text-xl">📋</span>
                        Modo Batch: Se crearán <span className="bg-gray-100 px-2 py-0.5 rounded font-bold">{selectedPetIds.length}</span> citas simultáneamente
                      </p>
                    </div>
                  )}

                  {/* WARNING: No active packages available - only show for GROOMING */}
                  {serviceType === 'GROOMING' && activePackages.length === 0 && (
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 mb-5">
                      <p className="text-sm text-blue-700 flex items-center gap-2">
                        <span className="text-lg">ℹ️</span>
                        No hay paquetes activos disponibles. Puedes seleccionar servicios individuales.
                      </p>
                    </div>
                  )}

                  {/* SERVICES/PACKAGES SECTION - FULL WIDTH */}
                  {selectedPetIds.length > 0 && (
                    <div className="bg-white rounded-xl p-4 border border-gray-200 mb-5">
                      {mode === 'SINGLE' ? (
                        <div>
                          <div className="flex items-center gap-2 mb-4">
                            <span className="text-2xl">✨</span>
                            <h3 className="font-semibold text-gray-900">
                              {serviceType === 'MEDICAL' ? 'Servicios Médicos' : 'Servicios y Paquetes'}
                            </h3>
                          </div>
                          <ServicePicker
                            services={filteredServices}
                            packages={serviceType === 'MEDICAL' ? [] : activePackages}
                            selectedServices={commonServices}
                            servicePrices={{ ...servicePrices, ...packagePrices }}
                            onServiceAdd={handleCommonServiceAdd}
                            onServiceRemove={handleCommonServiceRemove}
                            onQuantityChange={handleCommonServiceQuantityChange}
                            disabled={isLoading}
                          />
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">✨</span>
                              <h3 className="font-semibold text-gray-900">
                                {serviceType === 'MEDICAL' ? 'Servicios Médicos' : 'Servicios y Paquetes'}
                              </h3>
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={customizePerPet}
                                onChange={(e) => setCustomizePerPet(e.target.checked)}
                                disabled={isLoading}
                                className="w-4 h-4"
                              />
                              <span className="text-sm text-gray-700">Personalizar por mascota</span>
                            </label>
                          </div>

                          {!customizePerPet ? (
                            <div>
                              <p className="text-sm text-gray-600 mb-4">
                                Los mismos servicios{serviceType === 'GROOMING' ? ' y paquetes' : ''} se aplicarán a todas las mascotas
                              </p>
                              <ServicePicker
                                services={filteredServices}
                                packages={serviceType === 'MEDICAL' ? [] : activePackages}
                                selectedServices={commonServices}
                                servicePrices={{ ...servicePrices, ...packagePrices }}
                                onServiceAdd={handleCommonServiceAdd}
                                onServiceRemove={handleCommonServiceRemove}
                                onQuantityChange={handleCommonServiceQuantityChange}
                                disabled={isLoading}
                              />
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {petServiceData.map((petData, index) => {
                                const petName = pets.find((p) => p.id === petData.petId)?.name || 'Mascota';
                                return (
                                  <div key={petData.petId} className="border border-gray-200 rounded-lg p-4">
                                    <h4 className="font-medium text-gray-900 mb-3">{petName}</h4>
                                    <ServicePicker
                                      services={filteredServices}
                                      packages={serviceType === 'MEDICAL' ? [] : activePackages}
                                      selectedServices={petData.services}
                                      servicePrices={{ ...servicePrices, ...packagePrices }}
                                      onServiceAdd={(serviceId) => handlePetServiceAdd(index, serviceId)}
                                      onServiceRemove={(serviceId) => handlePetServiceRemove(index, serviceId)}
                                      onQuantityChange={(serviceId, qty) =>
                                        handlePetServiceQuantityChange(index, serviceId, qty)
                                      }
                                      disabled={isLoading}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* NOTES SECTION - FULL WIDTH */}
                  <div className="bg-white rounded-xl p-4 border border-gray-200 mb-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl">📝</span>
                      <label className="text-sm font-semibold text-gray-700">Notas Especiales (Opcional)</label>
                    </div>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Instrucciones especiales, alergias, comportamiento, preferencias, etc."
                      rows={2}
                      disabled={isLoading}
                      className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:bg-gray-100 text-gray-900"
                    />
                  </div>


              </>
            )}
          </>
        )}
      </form>

        {/* Footer */}
        <div className="sticky bottom-0 flex justify-between gap-3 p-6 border-t border-gray-200 bg-white">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 font-semibold transition-all"
          >
            ✕ Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            className={`px-8 py-3 text-white font-bold rounded-lg transition-all flex items-center gap-2 ${
              isSubmitDisabled
                ? 'bg-gray-400 cursor-not-allowed opacity-50'
                : 'bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 hover:shadow-lg hover:scale-105 active:scale-95'
            }`}
          >
            {isLoading ? (
              <>
                <span className="animate-spin">⏳</span>
                {isEditMode ? 'Guardando...' : 'Creando...'}
              </>
            ) : (
              <>
                <span>{isEditMode ? '✓' : '✓'}</span>
                {isEditMode ? 'Guardar Cambios' : `Crear ${mode === 'BATCH' ? `${selectedPetIds.length} Citas` : 'Cita'}`}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Duplicate Appointment Warning Modal */}
      <DuplicateAppointmentWarningModal
        isOpen={showConflictConfirmation}
        message={conflictWarning.message || ''}
        onConfirm={() => {
          setShowConflictConfirmation(false);
          // Usuario confirmó, permitir que continúe con el submit
          handleSubmit(new Event('submit') as any);
        }}
        onCancel={() => {
          setShowConflictConfirmation(false);
          setConflictWarning({ hasWarning: false });
        }}
      />

      {/* Partial Batch Conflict Modal */}
      {mode === 'BATCH' && (
        <PartialBatchConflictModal
          isOpen={showPartialBatchModal}
          validPets={validPetIds.map((petId) => ({
            petId,
            petName: pets.find((p) => p.id === petId)?.name || petId,
          }))}
          excludedPets={selectedPetIds
            .filter((petId) => !validPetIds.includes(petId))
            .map((petId) => ({
              petId,
              petName: pets.find((p) => p.id === petId)?.name || petId,
              reason: petConflicts.find((c) => c.petId === petId)?.reason,
            }))}
          locationType={(locationType || 'CLINIC') as 'CLINIC' | 'HOME'}
          onConfirm={async () => {
            setShowPartialBatchModal(false);
            // Usuario confirmó, ejecutar lógica de submit directamente
            setIsLoading(true);
            setError(null);
            setOverlapError(null);

            try {
              const overlap = await checkOverlaps();
              if (overlap) {
                setOverlapError(overlap);
                toast.error(overlap);
                setIsLoading(false);
                return;
              }

              // 🎯 computedScheduledAt is already UTC (from clinicLocalToUtc)
              // Do NOT apply another timezone conversion
              const scheduledAtUtc = computedScheduledAt!.toISOString();
              const petsToCreate = validPetIds;
              const excludedPets = selectedPetIds.filter((petId) => !petsToCreate.includes(petId));

              // Batch appointments - use petsToCreate (filtered list)
              const payload = {
                clientId: selectedClientId,
                scheduledAt: scheduledAtUtc,
                durationMinutes,
                locationType: locationType as 'CLINIC' | 'HOME',
                serviceType: serviceType,
                ...(locationType === 'HOME' && { addressId: selectedAddressId }),
                ...(locationType === 'HOME' && selectedStaffUserId && {
                  assignedStaffUserId: selectedStaffUserId,
                }),
                ...(notes && { notes }),
                pets: petsToCreate.map((petId) => {
                  const originalIndex = selectedPetIds.indexOf(petId);
                  let serviceIds: string[];
                  let quantities: number[];
                  let packageIds: string[];
                  let packageQuantities: number[];

                  if (customizePerPet) {
                    const petData = petServiceData[originalIndex];
                    serviceIds = Object.keys(petData.services);
                    quantities = serviceIds.map((id) => petData.services[id]);
                    packageIds = Object.keys(petData.packages);
                    packageQuantities = packageIds.map((id) => petData.packages[id]);
                  } else {
                    serviceIds = Object.keys(commonServices);
                    quantities = serviceIds.map((id) => commonServices[id]);
                    packageIds = Object.keys(commonPackages);
                    packageQuantities = packageIds.map((id) => commonPackages[id]);
                  }

                  return {
                    petId,
                    serviceIds,
                    quantities,
                    ...(packageIds.length > 0 && { packageIds }),
                    ...(packageQuantities.length > 0 && { packageQuantities }),
                  };
                }),
              };

              await appointmentsApi.createBatchAppointmentWithPricing(payload);

              // Show appropriate success message
              if (excludedPets.length > 0) {
                const excludedNames = excludedPets
                  .map((petId) => pets.find((p) => p.id === petId)?.name || petId)
                  .join(', ');
                toast.success(
                  `${petsToCreate.length} cita(s) creada(s). Se excluyeron: ${excludedNames}`
                );
              } else {
                toast.success(
                  `${petsToCreate.length} citas creadas exitosamente`
                );
              }

              await onSuccess();
              await new Promise((resolve) => setTimeout(resolve, 500));
              handleClose();
            } catch (err) {
              let message = err instanceof Error ? err.message : 'Error creating appointment(s)';
              setError(message);
              console.error('Error creating appointment:', err);
              toast.error(message);
            } finally {
              setIsLoading(false);
            }
          }}
          onCancel={() => {
            setShowPartialBatchModal(false);
            setValidPetIds([]);
          }}
        />
      )}
      
      {/* Client Form Modal (Create or Edit) */}
      <ClientFormModal
        isOpen={showClientFormModal}
        onClose={() => {
          setShowClientFormModal(false);
          setIsCreatingClient(false);
        }}
        client={isCreatingClient ? undefined : selectedClient || undefined}
        onSuccess={async (client) => {
          setShowClientFormModal(false);
          
          // If creating a new client, select it automatically
          if (isCreatingClient && client) {
            setSelectedClientId(client.id);
            setSelectedClient(client);
          } else if (!isCreatingClient && selectedClientId) {
            // If editing, refresh the client data
            await refreshClientData();
          }
          
          setIsCreatingClient(false);
        }}
      />
    </div>
  );
}
