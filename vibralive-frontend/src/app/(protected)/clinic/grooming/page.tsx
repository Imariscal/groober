'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { MdToday, MdChevronLeft, MdChevronRight, MdAdd, MdWarning, MdClose, MdEventNote, MdList } from 'react-icons/md';
import { FiRefreshCw, FiSearch } from 'react-icons/fi';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import momentTimezonePlugin from '@fullcalendar/moment-timezone';
import {
  addMonths,
  addWeeks,
  addDays,
  addHours,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfDay,
  endOfDay,
  isSameDay,
  set,
  format,
} from 'date-fns';
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';
import { useAppointmentsRangeQuery } from '@/hooks/useAppointmentsRangeQuery';
import { useClinicConfiguration } from '@/hooks/useClinicConfiguration';
import { useClinicCalendarExceptions } from '@/hooks/useClinicCalendarExceptions';
import { useClinicTimezone } from '@/hooks/useClinicTimezone';
import { useSearchModalTrigger } from '@/hooks/useSearchModalTrigger';
import { formatInClinicTz, getClinicRangeForCalendarView } from '@/lib/datetime-tz';
import { UnifiedGroomingModal, InvalidDateModal, CancelAppointmentModal, AppointmentContextMenu, CompleteAppointmentModal, AssignStylistModal, RescheduleAppointmentModal } from '@/components/appointments';
import { apiClient } from '@/lib/api-client';
import { petsApi } from '@/lib/pets-api';
import { appointmentsApi } from '@/lib/appointments-api';
import {
  isBookable,
  isPastDate,
  getExceptionForDate,
  formatBusinessHoursDisplay,
  getBusinessHoursForDate,
  hasConflictingAppointment,
} from '@/lib/grooming-validation';
import { Appointment } from '@/types';
import toast from 'react-hot-toast';
import { PermissionGateRoute } from '@/components/PermissionGateRoute';
import { PermissionGate } from '@/components/PermissionGate';
import { usePermissions } from '@/hooks/usePermissions';

type ViewType = 'month' | 'week' | 'day';
type ModalType = 'unified' | null;
type LocationType = 'ALL' | 'CLINIC' | 'HOME';
type SlotInterval = '15' | '30' | '60';

function ClinicGroomingPageContent() {
  // 🎯 Track hydration to prevent SSR mismatch
  const [isHydrated, setIsHydrated] = useState(false);
  const { has } = usePermissions();

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    // Server-side render: minimal placeholder that matches server output
    return (
      <div className="w-full flex flex-col bg-slate-50 -m-6 lg:-m-4" style={{ height: 'calc(100vh - 64px)' }}>
        <div className="bg-white border-b border-slate-200 shadow-xs z-40 flex-shrink-0 px-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2 pb-2">
            <h1 className="text-2xl font-bold text-slate-900">Grooming</h1>
          </div>
        </div>
        <div className="flex-1 p-2 overflow-hidden min-h-0" />
      </div>
    );
  }

  // After hydration: full component
  return <ClinicGroomingContent />;
}

function ClinicGroomingContent() {
  // Detectar la ruta para adaptar funcionalidad
  const pathname = usePathname();
  const router = useRouter();
  const isGroomingPage = pathname?.includes('/grooming');
  const isVisitsPage = pathname?.includes('/visits');
  
  // Tab navigation - Solo para grooming
  const [activeTab, setActiveTab] = useState<LocationType>(isGroomingPage ? 'ALL' : 'CLINIC');
  
  // Maintain independent navigation for each tab
  const [currentDateAll, setCurrentDateAll] = useState<Date>(new Date());
  const [currentDateClinic, setCurrentDateClinic] = useState<Date>(new Date());
  const [currentDateHome, setCurrentDateHome] = useState<Date>(new Date());
  const [viewTypeAll, setViewTypeAll] = useState<ViewType>('month');
  const [viewTypeClinic, setViewTypeClinic] = useState<ViewType>('month');
  const [viewTypeHome, setViewTypeHome] = useState<ViewType>('month');
  const [slotInterval, setSlotInterval] = useState<SlotInterval>('15');
  
  // Current values based on active tab
  const currentDate = activeTab === 'ALL' ? currentDateAll : activeTab === 'CLINIC' ? currentDateClinic : currentDateHome;
  const setCurrentDate = activeTab === 'ALL' ? setCurrentDateAll : activeTab === 'CLINIC' ? setCurrentDateClinic : setCurrentDateHome;
  const viewType = activeTab === 'ALL' ? viewTypeAll : activeTab === 'CLINIC' ? viewTypeClinic : viewTypeHome;
  const setViewType = activeTab === 'ALL' ? setViewTypeAll : activeTab === 'CLINIC' ? setViewTypeClinic : setViewTypeHome;
  
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalSourceType, setModalSourceType] = useState<'calendar' | 'new-button'>('calendar');
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [invalidDateModalOpen, setInvalidDateModalOpen] = useState<boolean>(false);
  const [invalidDateReason, setInvalidDateReason] = useState<string>('');
  const [invalidDateSelected, setInvalidDateSelected] = useState<Date | null>(null);
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [appointmentToComplete, setAppointmentToComplete] = useState<Appointment | null>(null);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [appointmentToAssign, setAppointmentToAssign] = useState<Appointment | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [startAfterAssign, setStartAfterAssign] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [appointmentToReschedule, setAppointmentToReschedule] = useState<Appointment | null>(null);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ appointment: Appointment; position: { x: number; y: number } } | null>(null);
  
  // Estado para manejar cita pendiente desde búsqueda global
  const [pendingAppointmentId, setPendingAppointmentId] = useState<string | null>(null);
  
  const clinicTimezone = useClinicTimezone();
  const [isCalendarReady, setIsCalendarReady] = useState(false);
  const [initialDateSynced, setInitialDateSynced] = useState(false);

  // Fetch configuration early - needed by calendar ready check
  const { config } = useClinicConfiguration();

  // 🎯 DEBUG: Print timezone being used on this page
  useEffect(() => {
    if (clinicTimezone) {
      console.log('✅ [CALENDAR] Timezone loaded:', clinicTimezone);
    }
  }, [clinicTimezone]);

  // 🎯 FIX: Sync initial dates to clinic timezone "today" once timezone is available
  // This prevents issues when user is near midnight in a different timezone
  useEffect(() => {
    if (clinicTimezone && !initialDateSynced) {
      const clinicToday = utcToZonedTime(new Date(), clinicTimezone);
      setCurrentDateAll(clinicToday);
      setCurrentDateClinic(clinicToday);
      setCurrentDateHome(clinicToday);
      setInitialDateSynced(true);
      console.log('📅 [CALENDAR] Initial dates synced to clinic today:', format(clinicToday, 'yyyy-MM-dd'));
    }
  }, [clinicTimezone, initialDateSynced]);

  // 🎯 Check if calendar is ready to display
  useEffect(() => {
    const hasTimezone = !!clinicTimezone;
    const hasBusinessHours = config?.businessHours?.week && 
      Object.values(config.businessHours.week).some((day: any) => Array.isArray(day) && day.length > 0);
    
    const isReady = !!(hasTimezone && hasBusinessHours);
    
    console.log('📋 [CALENDAR READY CHECK]', {
      hasTimezone,
      clinicTimezone,
      hasBusinessHours,
      businessHoursWeek: config?.businessHours?.week,
      isReady,
    });
    
    setIsCalendarReady(isReady);
  }, [clinicTimezone, config]);

  // 🎯 Effect to style past days in WEEK/DAY views
  useEffect(() => {
    if (viewType === 'month' || !clinicTimezone) return;
    
    const applyPastDayStyles = () => {
      const cols = document.querySelectorAll('.fc-wrapper .fc-timegrid-col[data-date]');
      const todayStart = startOfDay(utcToZonedTime(new Date(), clinicTimezone));
      
      cols.forEach((col: Element) => {
        const dateAttr = col.getAttribute('data-date');
        if (!dateAttr) return;
        
        const colDate = new Date(dateAttr + 'T12:00:00');
        const colDateStart = startOfDay(utcToZonedTime(colDate, clinicTimezone));
        const isPast = colDateStart.getTime() < todayStart.getTime();
        
        if (isPast) {
          const pastGradient = 'repeating-linear-gradient(-45deg, #e2e8f0, #e2e8f0 4px, #cbd5e1 4px, #cbd5e1 8px)';
          const colEl = col as HTMLElement;
          colEl.style.setProperty('background', pastGradient, 'important');
          colEl.style.setProperty('opacity', '0.8', 'important');
          
          const frame = col.querySelector('.fc-timegrid-col-frame') as HTMLElement;
          if (frame) {
            frame.style.setProperty('background', pastGradient, 'important');
          }
          const bg = col.querySelector('.fc-timegrid-col-bg') as HTMLElement;
          if (bg) {
            bg.style.setProperty('background', pastGradient, 'important');
          }
        }
      });
      
      // También estilizar headers
      const headers = document.querySelectorAll('.fc-wrapper .fc-col-header-cell[data-date]');
      headers.forEach((header: Element) => {
        const dateAttr = header.getAttribute('data-date');
        if (!dateAttr) return;
        
        const headerDate = new Date(dateAttr + 'T12:00:00');
        const headerDateStart = startOfDay(utcToZonedTime(headerDate, clinicTimezone));
        const isPast = headerDateStart.getTime() < todayStart.getTime();
        
        if (isPast) {
          const headerEl = header as HTMLElement;
          headerEl.style.setProperty('background-color', '#cbd5e1', 'important');
          headerEl.style.setProperty('color', '#64748b', 'important');
        }
      });
    };
    
    // Apply immediately and also with delays to catch late renders
    applyPastDayStyles();
    const timer1 = setTimeout(applyPastDayStyles, 100);
    const timer2 = setTimeout(applyPastDayStyles, 300);
    const timer3 = setTimeout(applyPastDayStyles, 500);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [viewType, currentDate, clinicTimezone, isCalendarReady]);

  // Calculate visible range based on view type
  // Uses getClinicRangeForCalendarView which properly handles timezone-aware date calculations
  const visibleRange = useMemo(() => {
    if (!clinicTimezone) {
      return { start: currentDate, end: currentDate };
    }
    
    // Get UTC date range that corresponds to the visible period in clinic timezone
    const range = getClinicRangeForCalendarView(viewType, currentDate, clinicTimezone);
    return {
      start: new Date(range.fromUtc),
      end: new Date(range.toUtc),
    };
  }, [currentDate, viewType, clinicTimezone]);

  // Hook para detectar citas desde búsqueda global
  useSearchModalTrigger({
    onOpenAppointment: (appointmentId) => {
      // Guardar el appointmentId pendiente, será procesado cuando los datos carguen
      setPendingAppointmentId(appointmentId);
    },
  });

  // Fetch configuration and exceptions
  const { exceptions } = useClinicCalendarExceptions({
    start: visibleRange.start,
    end: visibleRange.end,
  });

  // Fetch appointments for visible range
  const { appointments, isLoading, refetch } = useAppointmentsRangeQuery({
    start: visibleRange.start,
    end: visibleRange.end,
    clinicTimezone,
    serviceType: isGroomingPage ? 'GROOMING' : isVisitsPage ? 'MEDICAL' : undefined,
  });

  // Efecto para abrir el modal cuando las citas se carguen y haya una cita pendiente
  useEffect(() => {
    if (pendingAppointmentId && !isLoading && appointments && appointments.length > 0) {
      const appointment = appointments.find((a) => a.id === pendingAppointmentId);
      if (appointment) {
        setEditingAppointment(appointment);
        setModalOpen(true);
        setModalSourceType('calendar');
        setPendingAppointmentId(null);
      }
    }
  }, [pendingAppointmentId, isLoading, appointments]);

  // Filter appointments by location type - Para visits, solo MEDICAL
  const filteredAppointments = useMemo(() => {
    let filtered = appointments;

    // First filter by service type if not already done at API level
    // (appointments should already be filtered, but this is a safety net)
    if (isGroomingPage) {
      filtered = filtered.filter(apt => apt.service_type === 'GROOMING');
    } else if (isVisitsPage) {
      filtered = filtered.filter(apt => apt.service_type === 'MEDICAL');
    }

    // Then apply location type tab filtering (only relevant for grooming page)
    if (isGroomingPage && activeTab !== 'ALL') {
      return filtered.filter(apt => {
        const locType = apt.location_type || 'CLINIC';
        return locType === activeTab;
      });
    }
    
    if (isVisitsPage) {
      // In visits page, also filter by location type (only CLINIC)
      return filtered.filter(apt => {
        const locType = apt.location_type || 'CLINIC';
        return locType === 'CLINIC';
      });
    }

    return filtered;
  }, [appointments, activeTab, isGroomingPage, isVisitsPage]);

  // 🎯 businessHours are stored in local clinic time
  // FullCalendar's slotMinTime/slotMaxTime expect times in UTC (will be converted by FC)
  const adjustedBusinessHours = useMemo(() => {
    const bh = config?.businessHours || { week: {} };
    return bh;
  }, [config]);

  // Generate unavailable slot events (gray blocking events)
  const unavailableSlotEvents = useMemo(() => {
    const events: any[] = [];
    if (!adjustedBusinessHours?.week) return events;

    // 🎯 FIXED TIME RANGE: 7 AM to 9 PM (matches slotMinTime/slotMaxTime)
    const CALENDAR_MIN_HOUR = 7;
    const CALENDAR_MAX_HOUR = 21;

    // Generate for visible date range (plus buffer) - with clinic timezone
    const rangeStart = startOfDay(visibleRange.start);
    const rangeEnd = endOfDay(visibleRange.end);
    
    // 🎯 FIX: Use clinic timezone for day iteration
    // Convert UTC range to clinic timezone to iterate through actual days clinic sees
    const clinicRangeStart = clinicTimezone ? utcToZonedTime(rangeStart, clinicTimezone) : rangeStart;
    const clinicRangeEnd = clinicTimezone ? utcToZonedTime(rangeEnd, clinicTimezone) : rangeEnd;
    
    let currentDay = startOfDay(clinicRangeStart);

    while (currentDay <= endOfDay(clinicRangeEnd)) {
      const dayOfWeek = currentDay.getDay();
      const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
      const dayKey = dayKeys[dayOfWeek];
      const businessHoursRaw = (adjustedBusinessHours.week as any)?.[dayKey];
      // 🎯 FIX: Handle all cases - undefined, null, empty array, or array with no valid entries
      const businessHours = Array.isArray(businessHoursRaw) ? businessHoursRaw : [];

      // Check if day is closed - if no business hours for this day of week, it's closed
      const dayException = getExceptionForDate(currentDay, exceptions);
      const hasValidBusinessHours = businessHours.length > 0 && businessHours.some((h: any) => h && h.start && h.end);
      const isHoliday = dayException?.type === 'CLOSED'; // Día festivo (excepción)
      const isRestDay = !hasValidBusinessHours && !isHoliday; // Día de descanso regular
      const isClosed = isHoliday || isRestDay;

      if (isClosed) {
        // 🎯 Entire day is closed - block full visible range (7 AM to 9 PM)
        // Create dates in clinic local time, then convert to UTC for FullCalendar
        const blockStartLocal = new Date(currentDay);
        blockStartLocal.setHours(CALENDAR_MIN_HOUR, 0, 0, 0);
        const blockEndLocal = new Date(currentDay);
        blockEndLocal.setHours(CALENDAR_MAX_HOUR, 0, 0, 0);
        
        // Convert to UTC using clinic timezone
        const blockStartUtc = clinicTimezone ? zonedTimeToUtc(blockStartLocal, clinicTimezone) : blockStartLocal;
        const blockEndUtc = clinicTimezone ? zonedTimeToUtc(blockEndLocal, clinicTimezone) : blockEndLocal;
        
        // 🎨 UX: Colores diferentes según tipo
        // - Día festivo: Amber/dorado (especial)
        // - Día de descanso: Gris medio (regular)
        const bgColor = isHoliday ? '#fef3c7' : '#d1d5db'; // amber-100 vs gray-300
        const borderCol = isHoliday ? '#f59e0b' : '#9ca3af'; // amber-500 vs gray-400
        const cssClass = isHoliday ? 'holiday-day' : 'rest-day';
        
        events.push({
          id: `unavailable_${currentDay.toISOString()}_full`,
          title: '',
          start: blockStartUtc.toISOString(),
          end: blockEndUtc.toISOString(),
          backgroundColor: bgColor,
          borderColor: borderCol,
          textColor: '#374151',
          extendedProps: { isUnavailable: true, isClosed: true, isHoliday, isRestDay },
          display: 'background',
          classNames: ['unavailable-slot', 'closed-day', cssClass],
        });
      } else {
        // Day has some business hours - block outside those hours
        const sortedHours = [...businessHours].sort((a, b) => a.start.localeCompare(b.start));

        // Block before first business hour (from 7 AM to first business hour)
        if (sortedHours[0]) {
          const firstStart = sortedHours[0].start;
          const [hour, minute] = firstStart.split(':');
          const blockStartLocal = new Date(currentDay);
          blockStartLocal.setHours(CALENDAR_MIN_HOUR, 0, 0, 0);
          const blockEndLocal = new Date(currentDay);
          blockEndLocal.setHours(parseInt(hour), parseInt(minute), 0, 0);

          if (blockEndLocal.getTime() > blockStartLocal.getTime()) {
            const blockStartUtc = clinicTimezone ? zonedTimeToUtc(blockStartLocal, clinicTimezone) : blockStartLocal;
            const blockEndUtc = clinicTimezone ? zonedTimeToUtc(blockEndLocal, clinicTimezone) : blockEndLocal;
            
            events.push({
              id: `unavailable_${currentDay.toISOString()}_before`,
              title: '',
              start: blockStartUtc.toISOString(),
              end: blockEndUtc.toISOString(),
              backgroundColor: '#f1f5f9', // slate-100 - Horas fuera de horario
              borderColor: '#cbd5e1', // slate-300
              extendedProps: { isUnavailable: true, isOffHours: true },
              display: 'background',
              classNames: ['unavailable-slot', 'off-hours', 'before-hours'],
            });
          }
        }

        // Block after last business hour (from last business hour to 9 PM)
        if (sortedHours[sortedHours.length - 1]) {
          const lastEnd = sortedHours[sortedHours.length - 1].end;
          const [hour, minute] = lastEnd.split(':');
          const blockStartLocal = new Date(currentDay);
          blockStartLocal.setHours(parseInt(hour), parseInt(minute), 0, 0);
          const blockEndLocal = new Date(currentDay);
          blockEndLocal.setHours(CALENDAR_MAX_HOUR, 0, 0, 0);

          if (blockEndLocal.getTime() > blockStartLocal.getTime()) {
            const blockStartUtc = clinicTimezone ? zonedTimeToUtc(blockStartLocal, clinicTimezone) : blockStartLocal;
            const blockEndUtc = clinicTimezone ? zonedTimeToUtc(blockEndLocal, clinicTimezone) : blockEndLocal;
            
            events.push({
              id: `unavailable_${currentDay.toISOString()}_after`,
              title: '',
              start: blockStartUtc.toISOString(),
              end: blockEndUtc.toISOString(),
              backgroundColor: '#f1f5f9', // slate-100 - Horas fuera de horario
              borderColor: '#cbd5e1', // slate-300
              extendedProps: { isUnavailable: true, isOffHours: true },
              display: 'background',
              classNames: ['unavailable-slot', 'off-hours', 'after-hours'],
            });
          }
        }

        // Block gaps between business hour ranges (if there are multiple intervals in a day)
        for (let i = 0; i < sortedHours.length - 1; i++) {
          const currentEnd = sortedHours[i].end;
          const nextStart = sortedHours[i + 1].start;

          const [endHour, endMin] = currentEnd.split(':');
          const blockGapStartLocal = new Date(currentDay);
          blockGapStartLocal.setHours(parseInt(endHour), parseInt(endMin), 0, 0);

          const [nextHour, nextMin] = nextStart.split(':');
          const blockGapEndLocal = new Date(currentDay);
          blockGapEndLocal.setHours(parseInt(nextHour), parseInt(nextMin), 0, 0);

          if (blockGapEndLocal.getTime() > blockGapStartLocal.getTime()) {
            const blockGapStartUtc = clinicTimezone ? zonedTimeToUtc(blockGapStartLocal, clinicTimezone) : blockGapStartLocal;
            const blockGapEndUtc = clinicTimezone ? zonedTimeToUtc(blockGapEndLocal, clinicTimezone) : blockGapEndLocal;
            events.push({
              id: `unavailable_${currentDay.toISOString()}_gap_${i}`,
              title: '',
              start: blockGapStartUtc.toISOString(),
              end: blockGapEndUtc.toISOString(),
              backgroundColor: '#f1f5f9', // slate-100 - Horas fuera de horario (gap)
              borderColor: '#cbd5e1', // slate-300
              extendedProps: { isUnavailable: true, isOffHours: true },
              display: 'background',
              classNames: ['unavailable-slot', 'off-hours', 'gap-hours'],
            });
          }
        }
      }

      currentDay = addDays(currentDay, 1);
    }

    return events;
  }, [adjustedBusinessHours, exceptions, visibleRange, clinicTimezone, viewType]);

  // Transform appointments to FullCalendar format
  const calendarEvents = useMemo(() => {
    const events = filteredAppointments.map((apt) => {
      const locType = apt.location_type || 'CLINIC';
      
      // Colores según estado (prioridad 1: cancelado, no-show, reprogramado)
      let bgColor = '#3b82f6';     // Default: azul para CLINIC
      let borderCol = '#1d4ed8';
      
      if (locType === 'HOME') {
        bgColor = '#10b981';       // Verde para domicilio
        borderCol = '#059669';
      }
      
      // Override colors based on status
      if (apt.status === 'CANCELLED') {
        bgColor = '#ef4444';       // Rojo para cancelado
        borderCol = '#dc2626';
      } else if (apt.status === 'NO_SHOW') {
        bgColor = '#6b7280';       // Gris para no-show
        borderCol = '#4b5563';
      } else if (apt.rescheduled_at) {
        bgColor = '#f97316';       // Naranja para reprogramado
        borderCol = '#ea580c';
      }

      // Icono según estado (sin cambiar colores)
      let statusIcon = '';
      if (apt.status === 'UNATTENDED') {
        statusIcon = '⚠️ ';
      } else if (apt.status === 'IN_PROGRESS') {
        statusIcon = '▶️ ';
      } else if (apt.status === 'COMPLETED') {
        statusIcon = '✅ ';
      } else if (apt.status === 'CANCELLED') {
        statusIcon = '🚫 ';
      } else if (apt.status === 'NO_SHOW') {
        statusIcon = '❌ ';
      } else if (apt.rescheduled_at) {
        // Si fue reprogramada y está en SCHEDULED/CONFIRMED
        statusIcon = '🔄 ';
      }

      const baseTitle = apt.pet?.name ? `${apt.pet.name} - ${apt.client?.name || 'Cliente'}` : 'Cita';
      const assignedIcon = apt.assigned_staff_user_id ? (apt.service_type === 'MEDICAL' ? '🩺 ' : '✂️ ') : '';

      return {
        id: apt.id,
        title: `${statusIcon}${assignedIcon}${baseTitle}`,
        start: apt.scheduled_at,
        end: new Date(new Date(apt.scheduled_at).getTime() + (apt.duration_minutes || 30) * 60000).toISOString(),
        backgroundColor: bgColor,
        borderColor: borderCol,
        extendedProps: {
          appointmentId: apt.id,
          clientName: apt.client?.name,
          petName: apt.pet?.name,
          status: apt.status,
          locationType: locType,
        },
      };
    });
    // Combine appointment events with unavailable slot events
    return [...events, ...unavailableSlotEvents];
  }, [filteredAppointments, unavailableSlotEvents, clinicTimezone, viewType]);

  // 🎯 FIXED CALENDAR TIME RANGE: 7 AM to 9 PM
  const slotMinTime = '07:00:00';
  const slotMaxTime = '21:00:00';

  // Compute day cell classes (to mark closed days)
  const dayCellClassNames = useCallback(
    (info: any) => {
      const classes: string[] = [];
      
      // Check if date is in the past
      if (isPastDate(info.date, clinicTimezone)) {
        classes.push('fc-day-past-date');
      }

      const dayException = getExceptionForDate(info.date, exceptions, clinicTimezone);
      if (dayException?.type === 'CLOSED') {
        classes.push('fc-day-closed');
        return classes;
      }

      const businessHours = getBusinessHoursForDate(info.date, config, clinicTimezone);
      if (businessHours.length === 0) {
        classes.push('fc-day-closed');
      }

      return classes;
    },
    [exceptions, config, clinicTimezone],
  );

  // Add appointment count cards to day cells in month view
  // Also style closed days in week/day views
  const dayCellDidMount = useCallback(
    (info: any) => {
      // 🎯 Style closed days and past days in week/day views (time grid)
      if (viewType !== 'month') {
        // Check if this day is closed
        const dayException = getExceptionForDate(info.date, exceptions, clinicTimezone);
        const businessHours = getBusinessHoursForDate(info.date, config, clinicTimezone);
        const isClosed = dayException?.type === 'CLOSED' || businessHours.length === 0;
        
        // Check if this day is in the past
        const isPast = isPastDate(info.date, clinicTimezone);
        
        const el = info.el as HTMLElement;
        if (el) {
          if (isClosed) {
            // Apply gray background to the entire column for closed days
            el.style.backgroundColor = '#d1d5db';
            const frame = el.querySelector('.fc-timegrid-col-frame') as HTMLElement;
            if (frame) {
              frame.style.backgroundColor = '#d1d5db';
            }
            const bg = el.querySelector('.fc-timegrid-col-bg') as HTMLElement;
            if (bg) {
              bg.style.backgroundColor = '#d1d5db';
            }
          } else if (isPast) {
            // Apply distinctive style for past days
            el.style.backgroundColor = '#e2e8f0';
            el.style.backgroundImage = 'repeating-linear-gradient(-45deg, transparent, transparent 4px, rgba(148, 163, 184, 0.15) 4px, rgba(148, 163, 184, 0.15) 8px)';
            el.style.cursor = 'not-allowed';
            const frame = el.querySelector('.fc-timegrid-col-frame') as HTMLElement;
            if (frame) {
              frame.style.backgroundColor = '#e2e8f0';
              frame.style.backgroundImage = 'repeating-linear-gradient(-45deg, transparent, transparent 4px, rgba(148, 163, 184, 0.15) 4px, rgba(148, 163, 184, 0.15) 8px)';
              frame.style.opacity = '0.7';
            }
            const bg = el.querySelector('.fc-timegrid-col-bg') as HTMLElement;
            if (bg) {
              bg.style.backgroundColor = '#e2e8f0';
            }
          }
        }
        return;
      }

      // 🎯 Month view: Add appointment cards
      let dayDate: Date;
      if (clinicTimezone) {
        const clinicDate = utcToZonedTime(info.date, clinicTimezone);
        dayDate = startOfDay(clinicDate);
      } else {
        dayDate = new Date(info.date);
        dayDate.setHours(0, 0, 0, 0);
      }
      
      // Fecha de hoy para comparar (en zona horaria clínica)
      let today: Date;
      if (clinicTimezone) {
        const utcNow = new Date();
        const clinicNow = utcToZonedTime(utcNow, clinicTimezone);
        today = startOfDay(clinicNow);
      } else {
        today = new Date();
        today.setHours(0, 0, 0, 0);
      }
      const isDayPast = dayDate.getTime() < today.getTime();

      const dayAppointments = filteredAppointments.filter((apt) => {
        // 🎯 FIX: Compare dates in clinic timezone
        let aptDate: Date;
        if (clinicTimezone) {
          const aptUtc = new Date(apt.scheduled_at);
          const aptClinic = utcToZonedTime(aptUtc, clinicTimezone);
          aptDate = startOfDay(aptClinic);
        } else {
          aptDate = new Date(apt.scheduled_at);
          aptDate.setHours(0, 0, 0, 0);
        }
        return aptDate.getTime() === dayDate.getTime();
      });

      if (dayAppointments.length === 0) return;

      // Separar citas normales, UNATTENDED, y reprogramadas
      const unattendedAppointments = dayAppointments.filter((apt) => apt.status === 'UNATTENDED');
      const rescheduledAppointments = dayAppointments.filter((apt) => apt.rescheduled_at && apt.status !== 'UNATTENDED');
      const normalAppointments = dayAppointments.filter((apt) => apt.status !== 'UNATTENDED' && !apt.rescheduled_at);

      const unattendedCount = unattendedAppointments.length;
      const rescheduledCount = rescheduledAppointments.length;

      // Create cards container
      const cardsDiv = document.createElement('div');
      cardsDiv.className = 'flex flex-col gap-1 items-center justify-center px-1';
      cardsDiv.style.display = 'flex';
      cardsDiv.style.justifyContent = 'center';
      cardsDiv.style.alignItems = 'center';

      // Mostrar citas UNATTENDED primero (solo en días pasados)
      if (isDayPast && unattendedCount > 0) {
        const unattendedCard = document.createElement('div');
        unattendedCard.className = 'bg-orange-500 text-white px-2 py-1 rounded text-xs font-bold text-center hover:bg-orange-600 cursor-pointer transition-colors animate-pulse';
        unattendedCard.style.width = '75px';
        unattendedCard.innerHTML = `⚠️ Sin atender ${unattendedCount}`;
        unattendedCard.title = `${unattendedCount} cita(s) sin atender`;
        cardsDiv.appendChild(unattendedCard);
      }

      // Mostrar citas reprogramadas
      if (rescheduledCount > 0) {
        const rescheduledCard = document.createElement('div');
        rescheduledCard.className = activeTab === 'CLINIC' 
          ? 'bg-blue-500 text-white px-2 py-1 rounded text-xs font-bold text-center hover:bg-blue-600 cursor-pointer transition-colors border-2 border-amber-400'
          : 'bg-green-500 text-white px-2 py-1 rounded text-xs font-bold text-center hover:bg-green-600 cursor-pointer transition-colors border-2 border-amber-400';
        rescheduledCard.style.width = '75px';
        rescheduledCard.innerHTML = `🔄 Reprogr. ${rescheduledCount}`;
        rescheduledCard.title = `${rescheduledCount} cita(s) reprogramada(s)`;
        cardsDiv.appendChild(rescheduledCard);
      }

      // Mostrar citas normales
      if (isGroomingPage && activeTab === 'ALL') {
        // En tab ALL (solo grooming), separar por ubicación
        const clinicCount = normalAppointments.filter(apt => (apt.location_type || 'CLINIC') === 'CLINIC').length;
        const homeCount = normalAppointments.filter(apt => (apt.location_type || 'CLINIC') === 'HOME').length;
        const assignedCount = normalAppointments.filter(apt => apt.assigned_staff_user_id).length;

        if (clinicCount > 0) {
          const clinicCard = document.createElement('div');
          clinicCard.className = 'bg-blue-500 text-white px-2 py-1 rounded text-xs font-bold text-center hover:bg-blue-600 cursor-pointer transition-colors';
          clinicCard.style.width = '75px';
          clinicCard.textContent = `🏥 ${clinicCount}`;
          clinicCard.title = `${clinicCount} cita(s) clínica`;
          cardsDiv.appendChild(clinicCard);
        }

        if (homeCount > 0) {
          const homeCard = document.createElement('div');
          homeCard.className = 'bg-green-500 text-white px-2 py-1 rounded text-xs font-bold text-center hover:bg-green-600 cursor-pointer transition-colors';
          homeCard.style.width = '75px';
          homeCard.textContent = `🏠 ${homeCount}`;
          homeCard.title = `${homeCount} cita(s) domicilio`;
          cardsDiv.appendChild(homeCard);
        }

        if (assignedCount > 0) {
          const assignedCard = document.createElement('div');
          assignedCard.className = 'bg-purple-600 text-white px-2 py-1 rounded text-xs font-bold text-center hover:bg-purple-700 cursor-pointer transition-colors';
          assignedCard.style.width = '75px';
          assignedCard.textContent = `✂️ ${assignedCount}`;
          assignedCard.title = `${assignedCount} cita(s) con estilista asignado`;
          cardsDiv.appendChild(assignedCard);
        }
      } else {
        // En tabs específicos o en visits, mostrar el total sin separar
        const totalCount = normalAppointments.length;
        const assignedCount = isGroomingPage ? normalAppointments.filter(apt => apt.assigned_staff_user_id).length : 0;
        
        if (totalCount > 0) {
          const card = document.createElement('div');
          card.className = activeTab === 'CLINIC'
            ? 'bg-blue-500 text-white px-2 py-1 rounded text-xs font-bold text-center hover:bg-blue-600 cursor-pointer transition-colors'
            : 'bg-green-500 text-white px-2 py-1 rounded text-xs font-bold text-center hover:bg-green-600 cursor-pointer transition-colors';
          card.style.width = '75px';
          
          // Mostrar total de citas y cantidad asignadas (solo en grooming)
          if (isGroomingPage && assignedCount > 0) {
            card.textContent = `${totalCount} cita(s) (✂️${assignedCount})`;
            card.title = `${totalCount} cita(s) total - ${assignedCount} con estilista asignado`;
          } else {
            card.textContent = `${totalCount} cita(s)`;
            card.title = `${totalCount} cita(s)`;
          }
          cardsDiv.appendChild(card);
        }
      }

      info.el.appendChild(cardsDiv);
    },
    [viewType, filteredAppointments, activeTab, clinicTimezone, exceptions, config, isGroomingPage, isVisitsPage],
  );

  // Apply styling to time grid columns (week/day views) for past dates
  const slotLabelDidMount = useCallback(
    (info: any) => {
      // Only apply to week and day views
      if (viewType === 'month') return;

      const columnDate = new Date(info.date);
      
      // 🎯 DEBUG: Log all slot labels being rendered to see the time range
      if (info.text) {
        // This fires for each time slot label (09:00, 09:15, etc.)
        // Log only a sample to avoid spam
        const hour = info.date.getHours();
        if (info.date.getMinutes() === 0) {
          console.log(`⏰ [SLOT LABEL] Rendering hour: ${hour}:00, text: "${info.text}"`);
        }
      }
      
      if (isPastDate(columnDate, clinicTimezone)) {
        // Get the column element (parent of slot label)
        const colElement = info.el?.closest('.fc-col') as HTMLElement;
        
        if (colElement) {
          // Mark this column as past-date so we can style it with CSS
          colElement.setAttribute('data-past-date', 'true');
          colElement.style.opacity = '0.5';
          colElement.style.backgroundColor = 'rgb(229, 231, 235)'; // gray-200
          colElement.style.cursor = 'not-allowed';
        }
      }
    },
    [viewType, clinicTimezone],
  );


  // Validate slot selection
  const selectAllow = useCallback(
    (info: any) => {
      // MONTH VIEW: Completely disable selection
      if (viewType === 'month') {
        return false;
      }

      // WEEK/DAY VIEW: Check booking validity
      // 🎯 FullCalendar already returns UTC times when timeZone is set
      // No conversion needed - the dates from FC are correct as-is
      const startDate = new Date(info.startStr);
      const endDate = new Date(info.endStr);

      // ✅ Block past dates: Check if the DATE (not time) is in the past
      // Compare dates in clinic timezone to match what user sees
      const today = new Date();
      const todayDate = clinicTimezone 
        ? startOfDay(utcToZonedTime(today, clinicTimezone))
        : startOfDay(today);
      const selectedDate = clinicTimezone
        ? startOfDay(utcToZonedTime(startDate, clinicTimezone))
        : startOfDay(startDate);
      
      if (selectedDate < todayDate) {
        console.log("❌ [BLOCK] Past date not allowed:", selectedDate);
        return false;
      }

      const validation = isBookable(startDate, 30, config, exceptions, clinicTimezone);
      
      if (!validation.valid) {
        return false;
      }

      // Check if selected time overlaps with unavailable slots (gray blocked areas)
      const hasUnavailableOverlap = unavailableSlotEvents.some((event) => {
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);
        // Check if selection overlaps with unavailable block
        return !(endDate <= eventStart || startDate >= eventEnd);
      });

      return !hasUnavailableOverlap;
    },
    [viewType, config, exceptions, unavailableSlotEvents, clinicTimezone],
  );

  // Navigation handlers
  const handleToday = useCallback(() => {
    // 🎯 FIX: Get "today" in clinic timezone, not browser timezone
    // This ensures the calendar navigates to the correct day for the clinic
    if (clinicTimezone) {
      const clinicNow = utcToZonedTime(new Date(), clinicTimezone);
      setCurrentDate(clinicNow);
    } else {
      setCurrentDate(new Date());
    }
  }, [setCurrentDate, clinicTimezone]);

  const handlePrevious = useCallback(() => {
    switch (viewType) {
      case 'month':
        setCurrentDate((prev) => addMonths(prev, -1));
        break;
      case 'week':
        setCurrentDate((prev) => addWeeks(prev, -1));
        break;
      case 'day':
        setCurrentDate((prev) => addDays(prev, -1));
        break;
    }
  }, [viewType, setCurrentDate]);

  const handleNext = useCallback(() => {
    switch (viewType) {
      case 'month':
        setCurrentDate((prev) => addMonths(prev, 1));
        break;
      case 'week':
        setCurrentDate((prev) => addWeeks(prev, 1));
        break;
      case 'day':
        setCurrentDate((prev) => addDays(prev, 1));
        break;
    }
  }, [viewType, setCurrentDate]);

  const handleViewChange = useCallback((view: ViewType) => {
    // When switching to month view, clear any selections to prevent modal from appearing
    if (view === 'month') {
      setSelectedSlot(null);
      setModalOpen(false);
      setInvalidDateModalOpen(false);
    }
    setViewType(view);
  }, [setViewType]);

  // Handle calendar slot click
  const handleDateClick = useCallback(
    (info: any) => {
      // Close context menu if open
      setContextMenu(null);

      // MONTH VIEW: Completely disabled - clicks ignored
      // Only way to create appointment in month view is via "Nueva Cita" button
      if (viewType === 'month') {
        return;
      }

      // WEEK/DAY VIEW: Allow clicks with validation
      // 🎯 FullCalendar already returns UTC times when timeZone is set
      // No conversion needed - the date from FC is correct as-is
      const clickedDate = new Date(info.dateStr);
      
      // 🎯 Past dates: Silently ignore clicks (no modal, no feedback)
      if (isPastDate(clickedDate, clinicTimezone)) {
        return;
      }
      
      const validation = isBookable(clickedDate, 30, config, exceptions, clinicTimezone);
      
      if (!validation.valid) {
        // Show warning modal for invalid dates (closed days, outside hours, etc)
        setInvalidDateSelected(clickedDate);
        setInvalidDateReason(validation.reason || 'Fecha no disponible');
        setInvalidDateModalOpen(true);
        return;
      }

      // Check if allowAppointmentOverlap is disabled and there's a conflicting appointment
      const locationType = activeTab === 'ALL' ? 'ALL' : (activeTab === 'HOME' ? 'HOME' : 'CLINIC');
      const conflict = hasConflictingAppointment(clickedDate, 30, appointments, config, locationType as 'CLINIC' | 'HOME' | 'ALL');
      if (conflict.hasConflict) {
        const conflictingApt = conflict.conflictingAppointment;
        const existingStart = new Date(conflictingApt!.scheduled_at);
        const existingEnd = new Date(existingStart.getTime() + (conflictingApt!.duration_minutes || 30) * 60000);
        const tz = config?.timezone || 'America/Monterrey';
        const timeStr = `${formatInClinicTz(existingStart, tz, 'HH:mm')} - ${formatInClinicTz(existingEnd, tz, 'HH:mm')}`;
        
        toast.error(
          `No se puede crear cita en este horario. Ya existe una cita reservada de ${timeStr}.`,
          { id: 'appointment-conflict', duration: 4000 }
        );
        return;
      }

      // Valid date - open creation modal
      setSelectedSlot(clickedDate);
      setModalSourceType('calendar'); // 🎯 Viene del click en calendario
      setModalOpen(true);
    },
    [viewType, config, exceptions, appointments, activeTab, clinicTimezone],
  );

  const handleSelectSlot = useCallback(
    (info: any) => {
      // Close context menu if open
      setContextMenu(null);

      // WEEK/DAY VIEW ONLY: Handle slot selection
      // 🎯 FullCalendar already returns UTC times when timeZone is set
      // No conversion needed - the dates from FC are correct as-is
      const slotDate = new Date(info.startStr);
      const slotEndDate = new Date(info.endStr);
      
      // 🎯 Past dates: Silently ignore selections (no modal, no feedback)
      if (isPastDate(slotDate, clinicTimezone)) {
        return;
      }

      // 🎯 DEBUG: Log what FC is giving us
      console.log('📅 [CALENDAR] handleSelectSlot from FullCalendar:', {
        startStr: info.startStr,
        endStr: info.endStr,
        slotDate: slotDate.toISOString(),
        slotEndDate: slotEndDate.toISOString(),
        clinicTimezone,
        clinicLocalStartTime: clinicTimezone ? new Date(slotDate).toLocaleString('es-MX', { timeZone: clinicTimezone }) : 'NO TZ',
        clinicLocalEndTime: clinicTimezone ? new Date(slotEndDate).toLocaleString('es-MX', { timeZone: clinicTimezone }) : 'NO TZ',
      });

      const durationMinutes = Math.round((slotEndDate.getTime() - slotDate.getTime()) / 60000);
      const validation = isBookable(slotDate, durationMinutes, config, exceptions, clinicTimezone);

      if (!validation.valid) {
        // Show warning modal for invalid dates (closed days, outside hours, etc)
        setInvalidDateSelected(slotDate);
        setInvalidDateReason(validation.reason || 'Horario no disponible');
        setInvalidDateModalOpen(true);
        return;
      }

      // Check if allowAppointmentOverlap is disabled and there's a conflicting appointment
      const locationType = activeTab === 'ALL' ? 'ALL' : (activeTab === 'HOME' ? 'HOME' : 'CLINIC');
      const conflict = hasConflictingAppointment(slotDate, durationMinutes, appointments, config, locationType as 'CLINIC' | 'HOME' | 'ALL');
      if (conflict.hasConflict) {
        const conflictingApt = conflict.conflictingAppointment;
        const existingStart = new Date(conflictingApt!.scheduled_at);
        const existingEnd = new Date(existingStart.getTime() + (conflictingApt!.duration_minutes || 30) * 60000);
        const tz = config?.timezone || 'America/Monterrey';
        const timeStr = `${formatInClinicTz(existingStart, tz, 'HH:mm')} - ${formatInClinicTz(existingEnd, tz, 'HH:mm')}`;
        
        toast.error(
          `No se puede crear cita en este horario. Ya existe una cita reservada de ${timeStr}.`,
          { id: 'appointment-conflict', duration: 4000 }
        );
        return;
      }

      // Valid slot - open creation modal
      setSelectedSlot(slotDate);
      setModalSourceType('calendar'); // 🎯 Viene del click en calendario
      setModalOpen(true);
    },
    [config, exceptions, appointments, activeTab, clinicTimezone],
  );

  // Handle event click to show context menu or take action
  const handleEventClick = useCallback(
    async (info: any) => {
      const appointmentId = info.event.id || info.event.extendedProps.appointmentId;
      const baseAppointment = appointments.find((apt) => apt.id === appointmentId);
      
      if (!baseAppointment) return;
      
      console.log('🔍 [DEBUG] handleEventClick - Initial appointment:', { appointmentId, baseAppointment });
      
      let finalAppointment = baseAppointment;
      
      // Si el pet no tiene toda la información, hacer fetch adicional
      if (baseAppointment.pet && (!baseAppointment.pet.species || !baseAppointment.pet.breed || !baseAppointment.pet.size || !baseAppointment.pet.sex || !baseAppointment.pet.color)) {
        try {
          const clientId = baseAppointment.client_id || baseAppointment.client?.id;
          
          if (!clientId) {
            console.warn('⚠️ [DEBUG] No se encontró client_id');
            // Get position from click event
            const posX = info.jsEvent.pageX;
            const posY = info.jsEvent.pageY;
            setContextMenu({ appointment: finalAppointment, position: { x: posX, y: posY } });
            return;
          }
          
          console.log('📥 [DEBUG] Buscando pet completo desde cliente...', { clientId });
          // Usar petsApi para obtener los pets del cliente
          const petList = await petsApi.getClientPets(clientId);
          const completePet = petList.find((p: any) => p.id === baseAppointment.pet?.id);
          
          if (completePet) {
            console.log('✅ [DEBUG] Pet completo obtenido:', completePet);
            // Actualizar el appointment con el pet completo
            finalAppointment = {
              ...baseAppointment,
              pet: completePet,
            };
          } else {
            console.warn('⚠️ [DEBUG] Pet no encontrado en la lista del cliente');
          }
        } catch (error) {
          console.error('❌ [DEBUG] Error obteniendo pet completo:', error);
          // Continuar con la información disponible
        }
      }
      
      // 🎯 Para citas MEDICAL sin veterinario: abrir directamente modal de asignación
      if (finalAppointment.service_type === 'MEDICAL' && !finalAppointment.assigned_staff_user_id) {
        console.log('🏥 MEDICAL appointment without veterinarian - opening assign modal');
        setAppointmentToAssign(finalAppointment);
        setStartAfterAssign(false);
        setAssignModalOpen(true);
        return;
      }
      
      // Get position from click event
      const posX = info.jsEvent.pageX;
      const posY = info.jsEvent.pageY;
      setContextMenu({ appointment: finalAppointment, position: { x: posX, y: posY } });
    },
    [appointments],
  );

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedSlot(null);
    setModalSourceType('calendar'); // 🎯 Reset
    setEditingAppointment(null); // 🎯 Reset edit mode
  };

  const handleModalSuccess = async () => {
    handleModalClose();
    await refetch();
  };

  // Handler para empezar una cita
  const handleStartAppointment = async (apt: Appointment) => {
    // Si ya tiene estilista/veterinario asignado, empezar directamente
    if (apt.assigned_staff_user_id) {
      try {
        await appointmentsApi.updateAppointmentStatus(apt.id, 'IN_PROGRESS');
        toast.success('Cita iniciada');
        refetch();
      } catch (error) {
        console.error('Error starting appointment:', error);
        toast.error('Error al iniciar la cita');
      }
    } else {
      // Si no tiene staff, abrir modal para asignar y luego empezar
      setAppointmentToAssign(apt);
      setStartAfterAssign(true);
      setAssignModalOpen(true);
    }
  };

  // Format current date display - Simple & Reliable
  const dateDisplay = useMemo(() => {
    try {
      if (viewType === 'month') {
        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
      } else if (viewType === 'week') {
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
        return `${weekStart.getDate()} - ${weekEnd.getDate()} de ${['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][weekEnd.getMonth()]}`;
      } else {
        const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        return `${dayNames[currentDate.getDay()]}, ${currentDate.getDate()} de ${monthNames[currentDate.getMonth()]}`;
      }
    } catch (e) {
      return 'Grooming';
    }
  }, [currentDate, viewType]);

  // Business hours display
  const businessHoursDisplay = useMemo(() => {
    return formatBusinessHoursDisplay(config);
  }, [config]);

  // Calculate statistics
  const stats = useMemo(() => {
    return {
      total: filteredAppointments?.length || 0,
      completed: filteredAppointments?.filter((apt: Appointment) => apt.status === 'COMPLETED').length || 0,
      pending: filteredAppointments?.filter((apt: Appointment) => apt.status !== 'COMPLETED').length || 0,
    };
  }, [filteredAppointments]);

  return (
    <div className="min-h-screen bg-slate-50 -m-6 lg:-m-4" style={{ height: 'calc(100vh - 64px)' }}>
      <div className="flex flex-col h-full">
      {/* HEADER - ESTÁNDAR */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 z-50 flex-shrink-0 w-full">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <MdEventNote className={`text-3xl ${isVisitsPage ? 'text-emerald-600' : 'text-blue-600'}`} />
              {isVisitsPage ? 'Visitas Clínica' : 'Grooming'}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {isVisitsPage 
                ? 'Calendario y gestión de visitas veterinarias'
                : 'Calendario y gestión de citas de grooming'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Refresh Button */}
            <button
              onClick={() => {
                refetch();
              }}
              disabled={isLoading}
              className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition disabled:opacity-50"
              title="Actualizar"
            >
              <FiRefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            {/* New Appointment Button */}
            <PermissionGate
              fallback={null}
              require={{ permissions: ['appointments:create'] }}
            >
              <button
                onClick={() => {
                  setSelectedSlot(null);
                  setModalSourceType('new-button');
                  setModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 text-white rounded-lg transition bg-blue-600 hover:bg-blue-700"
              >
                <MdAdd className="w-5 h-5" />
                <span className="hidden sm:inline">{isVisitsPage ? 'Nueva Visita' : 'Nueva Cita'}</span>
              </button>
            </PermissionGate>
          </div>
        </div>

        {/* STATS BAR */}
        <div className="flex flex-wrap gap-3 mt-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-sm">
            <FiSearch className="text-slate-500" />
            <span className="text-slate-600">Total:</span>
            <span className="font-semibold">{stats.total}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-success-50 rounded-lg text-sm">
            <span className="text-success-600">✓</span>
            <span className="text-success-700">Completadas:</span>
            <span className="font-semibold text-success-700">{stats.completed}</span>
          </div>
          {stats.pending > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg text-sm">
              <span className="text-blue-600">⏳</span>
              <span className="text-blue-700">Pendientes:</span>
              <span className="font-semibold text-blue-700">{stats.pending}</span>
            </div>
          )}
          {config && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-sm">
              <span className="text-slate-600">Horarios:</span>
              <span className="font-medium text-slate-700">{businessHoursDisplay}</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs & Controls Toolbar */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 z-40 flex-shrink-0 w-full">
        <div className="flex flex-col lg:flex-row items-center gap-4 justify-between">
          {/* Tabs - Solo mostrar en grooming */}
          {isGroomingPage && (
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 w-fit">
              <button
                onClick={() => setActiveTab('ALL')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'ALL'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📅 Todas
              </button>
              <button
                onClick={() => setActiveTab('CLINIC')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'CLINIC'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🏥 Clínica
              </button>
              <button
                onClick={() => setActiveTab('HOME')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'HOME'
                    ? 'bg-white text-green-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🏠 Domicilio
              </button>
            </div>
          )}

          {/* Navigation & View Controls */}
          <div className="flex items-center gap-2 flex-wrap ml-auto">
            {/* Today Button */}
            <button
              onClick={handleToday}
              className="px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Hoy
            </button>

            {/* List Mode Button - Only on Visits Page */}
            {isVisitsPage && (
              <button
                onClick={() => router.push('/clinic/visits/list')}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                title="Ver lista de visitas del día"
              >
                <MdList size={18} />
                <span className="hidden sm:inline">Modo Lista</span>
              </button>
            )}

            {/* Date Navigation */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg overflow-hidden">
              <button
                onClick={handlePrevious}
                className="p-2 text-slate-600 hover:bg-slate-50 transition-colors"
                aria-label="Anterior"
              >
                <MdChevronLeft size={20} />
              </button>

              <div className="text-center text-sm font-semibold text-slate-900 px-4 py-2 min-w-48 whitespace-nowrap border-l border-r border-slate-200">
                {dateDisplay}
              </div>

              <button
                onClick={handleNext}
                className="p-2 text-slate-600 hover:bg-slate-50 transition-colors"
                aria-label="Siguiente"
              >
                <MdChevronRight size={20} />
              </button>
            </div>

            {/* View Type Toggle */}
            <div className="flex gap-1 bg-white border border-slate-200 rounded-lg overflow-hidden">
              {(['month', 'week', 'day'] as ViewType[]).map((view) => (
                <button
                  key={view}
                  onClick={() => handleViewChange(view)}
                  className={`px-3 py-2 text-xs font-medium transition-colors ${
                    viewType === view
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {view === 'month' ? 'Mes' : view === 'week' ? 'Semana' : 'Día'}
                </button>
              ))}
            </div>

            {/* Slot Interval Selector */}
            {viewType !== 'month' && (
              <div className="flex gap-1 bg-white border border-slate-200 rounded-lg overflow-hidden">
                {(['60', '30', '15'] as SlotInterval[]).map((interval) => (
                  <button
                    key={interval}
                    onClick={() => setSlotInterval(interval)}
                    className={`px-2 py-2 text-xs font-medium transition-colors ${
                      slotInterval === interval
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                    title={`Intervalos de ${interval} minutos`}
                  >
                    {interval === '60' ? '1h' : `${interval}m`}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Calendar Container */}
      <div className="flex-1 p-6 overflow-hidden min-h-0 w-full">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-auto h-full">
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-slate-500">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span>Cargando citas...</span>
              </div>
            </div>
          ) : !isCalendarReady ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="text-slate-600">Cargando configuración del calendario...</p>
            </div>
          ) : (
            <div className={`fc-wrapper h-full ${viewType === 'month' ? 'fc-month-hide-events' : ''} fc-slot-${slotInterval}`}>
              <style>{`
                .fc-wrapper {
                  height: 100%;
                }
                .fc-wrapper .fc {
                  height: 100% !important;
                }
                /* Altura de slots según intervalo */
                .fc-wrapper.fc-slot-15 .fc-timegrid-slot {
                  height: 1.5em !important;
                }
                .fc-wrapper.fc-slot-30 .fc-timegrid-slot {
                  height: 3em !important;
                }
                .fc-wrapper.fc-slot-60 .fc-timegrid-slot {
                  height: 5em !important;
                }
                /* Líneas entre días más visibles */
                .fc-wrapper .fc-scrollgrid {
                  border-color: #94a3b8 !important;
                }
                .fc-wrapper .fc-scrollgrid td,
                .fc-wrapper .fc-scrollgrid th {
                  border-color: #cbd5e1 !important;
                }
                .fc-wrapper .fc-col-header-cell {
                  border-color: #94a3b8 !important;
                }
                .fc-wrapper .fc-daygrid-day {
                  border-color: #cbd5e1 !important;
                }
                .fc-wrapper .fc-timegrid-slot {
                  border-color: #e2e8f0 !important;
                }
                .fc-wrapper .fc-timegrid-col {
                  border-color: #94a3b8 !important;
                }
                /* Líneas verticales entre días en vista semana/día */
                .fc-wrapper .fc-timegrid-cols > table {
                  border-collapse: collapse;
                }
                .fc-wrapper .fc-timegrid-col {
                  border-right: 2px solid #94a3b8 !important;
                }
                .fc-wrapper .fc-timegrid-col:last-child {
                  border-right: none !important;
                }
                .fc-wrapper .fc-timegrid-axis {
                  border-right: 2px solid #94a3b8 !important;
                }
                .fc-wrapper .fc-col-header-cell {
                  border-right: 2px solid #94a3b8 !important;
                }
                .fc-wrapper .fc-col-header-cell:last-child {
                  border-right: none !important;
                }
                /* 🎯 BACKGROUND EVENTS - Ensure closed day/unavailable slots are clearly visible */
                .fc-wrapper .fc-bg-event {
                  opacity: 1 !important;
                  pointer-events: none;
                }
                /* Contenedor de eventos de fondo - debe estar por encima del fondo pero debajo de eventos reales */
                .fc-wrapper .fc-timegrid-bg-harness {
                  z-index: 2 !important;
                }
                .fc-wrapper .fc-timegrid-col-bg {
                  z-index: 2 !important;
                }
                /* Asegurar que los slots de tiempo están por debajo de eventos de fondo */
                .fc-wrapper .fc-timegrid-slots {
                  z-index: 0 !important;
                }
                .fc-wrapper .fc-timegrid-slot-lane {
                  z-index: 0 !important;
                }
                /* Eventos de fondo deben cubrir toda el área */
                .fc-wrapper .fc-timegrid-event-harness {
                  z-index: 3 !important;
                }
                /* Background events en vista semana específicamente */
                .fc-wrapper .fc-timegrid-col .fc-bg-event {
                  position: absolute !important;
                  left: 0 !important;
                  right: 0 !important;
                  opacity: 1 !important;
                }
                
                /* ═══════════════════════════════════════════════════════════
                   🎨 PALETA UX - HORARIOS NO DISPONIBLES
                   ═══════════════════════════════════════════════════════════
                   1. HORAS FUERA DE HORARIO (off-hours): Gris muy claro con líneas
                      - Antes/después del horario laboral en días abiertos
                      - Color: slate-100 (#f1f5f9) con patrón diagonal sutil
                   
                   2. DÍAS DE DESCANSO (rest-day): Gris medio sólido
                      - Días regulares sin horario (ej: domingos)
                      - Color: gray-300 (#d1d5db)
                   
                   3. DÍAS FESTIVOS (holiday-day): Dorado/Amber distintivo
                      - Excepciones marcadas como cerrado
                      - Color: amber-100 (#fef3c7) con borde amber-500
                   ═══════════════════════════════════════════════════════════ */
                
                /* 1️⃣ HORAS FUERA DE HORARIO - Gris claro con patrón diagonal */
                .fc-wrapper .off-hours {
                  background: repeating-linear-gradient(
                    -45deg,
                    #f1f5f9,
                    #f1f5f9 4px,
                    #e2e8f0 4px,
                    #e2e8f0 8px
                  ) !important;
                  opacity: 1 !important;
                }
                
                /* 2️⃣ DÍAS DE DESCANSO - Gris medio sólido */
                .fc-wrapper .rest-day {
                  background-color: #d1d5db !important;
                  opacity: 1 !important;
                }
                
                /* 3️⃣ DÍAS FESTIVOS - Dorado con patrón especial */
                .fc-wrapper .holiday-day {
                  background: repeating-linear-gradient(
                    45deg,
                    #fef3c7,
                    #fef3c7 6px,
                    #fde68a 6px,
                    #fde68a 12px
                  ) !important;
                  opacity: 1 !important;
                }
                
                /* Estilos base para slots no disponibles */
                .fc-wrapper .unavailable-slot {
                  opacity: 1 !important;
                }
                
                /* 🎯 DOMINGO/DÍAS DE DESCANSO - Columna completa */
                .fc-wrapper .fc-day-sun.fc-timegrid-col {
                  background-color: #d1d5db !important;
                }
                .fc-wrapper .fc-day-sun.fc-timegrid-col .fc-timegrid-col-frame,
                .fc-wrapper .fc-day-sun.fc-timegrid-col .fc-timegrid-col-bg {
                  background-color: #d1d5db !important;
                }
                .fc-wrapper .fc-day-sun.fc-col-header-cell {
                  background-color: #d1d5db !important;
                  color: #374151 !important;
                }
                .fc-wrapper .fc-day-sun.fc-daygrid-day {
                  background-color: #e5e7eb !important;
                }
                
                /* Días cerrados genéricos */
                .fc-wrapper .fc-day-closed {
                  background-color: #d1d5db !important;
                }
                .fc-wrapper .fc-day-closed .fc-daygrid-day-frame {
                  opacity: 0.7;
                }
                
                /* Días pasados - Color gris distinguido y no clickeable */
                .fc-wrapper .fc-day-past-date {
                  background-color: #e2e8f0 !important;
                  background-image: repeating-linear-gradient(
                    -45deg,
                    transparent,
                    transparent 4px,
                    rgba(148, 163, 184, 0.15) 4px,
                    rgba(148, 163, 184, 0.15) 8px
                  ) !important;
                }
                .fc-wrapper .fc-day-past-date .fc-daygrid-day-frame {
                  opacity: 0.6;
                  cursor: not-allowed;
                }
                .fc-wrapper .fc-day-past-date .fc-daygrid-day-number {
                  color: #94a3b8 !important;
                }
                /* Días pasados en vista semana/día (timegrid) */
                .fc-wrapper .fc-day-past-date.fc-timegrid-col {
                  background-color: #e2e8f0 !important;
                  background-image: repeating-linear-gradient(
                    -45deg,
                    transparent,
                    transparent 4px,
                    rgba(148, 163, 184, 0.15) 4px,
                    rgba(148, 163, 184, 0.15) 8px
                  ) !important;
                }
                .fc-wrapper .fc-day-past-date.fc-timegrid-col .fc-timegrid-col-frame {
                  background-color: #e2e8f0 !important;
                  opacity: 0.7;
                }
                .fc-wrapper .fc-day-past-date.fc-col-header-cell {
                  background-color: #cbd5e1 !important;
                  color: #64748b !important;
                }
                /* Permitir ver eventos pero no crear nuevos */
                .fc-wrapper .fc-day-past-date .fc-daygrid-day-events {
                  pointer-events: auto;
                }
                .fc-wrapper .fc-day-past-date .fc-daygrid-day-bg {
                  pointer-events: none;
                }
                .fc-month-hide-events .fc-daygrid-event {
                  display: none !important;
                }
                .fc-month-hide-events .fc-daygrid-day-frame {
                  min-height: 120px;
                }
                .fc-month-hide-events .fc-daygrid-day-more {
                  display: none !important;
                }
                .fc-month-hide-events a[class*="more"] {
                  display: none !important;
                }
                .fc-month-hide-events .fc-col-time-area {
                  display: none !important;
                }
                
                /* 🎯 Línea indicadora de hora actual */
                .fc-wrapper .fc-now-indicator {
                  border-color: #ef4444 !important;
                }
                .fc-wrapper .fc-now-indicator-line {
                  border-color: #ef4444 !important;
                  border-width: 2px !important;
                  z-index: 10 !important;
                }
                .fc-wrapper .fc-now-indicator-arrow {
                  border-color: #ef4444 !important;
                  border-top-color: transparent !important;
                  border-bottom-color: transparent !important;
                }
                .fc-wrapper .fc-timegrid-now-indicator-container {
                  overflow: visible !important;
                }
                .fc-wrapper .fc-timegrid-now-indicator-line {
                  border-color: #ef4444 !important;
                  border-width: 2px !important;
                  position: relative;
                }
                .fc-wrapper .fc-timegrid-now-indicator-line::before {
                  content: '';
                  position: absolute;
                  left: -6px;
                  top: -5px;
                  width: 10px;
                  height: 10px;
                  background-color: #ef4444;
                  border-radius: 50%;
                }
              `}</style>
              <FullCalendar
                key={`${activeTab}-${viewType}-${currentDate.toISOString()}-${slotMinTime}-${slotMaxTime}-${clinicTimezone}-${isCalendarReady}-${slotInterval}`}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, momentTimezonePlugin]}
                initialView={
                  viewType === 'month' ? 'dayGridMonth' : viewType === 'week' ? 'timeGridWeek' : 'timeGridDay'
                }
                initialDate={currentDate}
                timeZone={clinicTimezone || 'UTC'}
                headerToolbar={false}
                events={calendarEvents}
                dateClick={handleDateClick}
                select={handleSelectSlot}
                selectAllow={selectAllow}
                eventClick={handleEventClick}
                dayCellClassNames={dayCellClassNames}
                dayCellDidMount={dayCellDidMount}
                slotLabelDidMount={slotLabelDidMount}
                selectable={viewType !== 'month'}
                editable={false}
                slotMinTime={slotMinTime}
                slotMaxTime={slotMaxTime}
                slotDuration={slotInterval === '60' ? '01:00:00' : slotInterval === '30' ? '00:30:00' : '00:15:00'}
                slotLabelInterval={slotInterval === '60' ? '01:00' : slotInterval === '30' ? '00:30' : '00:15'}
                slotLabelFormat={{
                  hour: '2-digit',
                  minute: '2-digit',
                  meridiem: false,
                  hour12: false,
                }}
                allDaySlot={viewType === 'month'}
                nowIndicator={true}
                height="100%"
                dayMaxEvents={3}
                locale="es"
                firstDay={1}
                datesSet={(info) => {
                  // 🎯 Apply closed day and past day styles after view renders
                  if (viewType === 'month') return;
                  
                  // Use setTimeout to ensure DOM is fully updated
                  setTimeout(() => {
                    const cols = document.querySelectorAll('.fc-wrapper .fc-timegrid-col[data-date]');
                    
                    cols.forEach((col: Element) => {
                      const dateAttr = col.getAttribute('data-date');
                      if (!dateAttr) return;
                      
                      const colDate = new Date(dateAttr + 'T12:00:00');
                      const businessHours = getBusinessHoursForDate(colDate, config, clinicTimezone);
                      const dayException = getExceptionForDate(colDate, exceptions, clinicTimezone);
                      
                      const isHoliday = dayException?.type === 'CLOSED';
                      const isRestDay = businessHours.length === 0 && !isHoliday;
                      
                      // 🎯 Comparar DÍAS completos (no horas) para detectar días pasados
                      const todayStart = startOfDay(utcToZonedTime(new Date(), clinicTimezone || 'America/Monterrey'));
                      const colDateStart = startOfDay(utcToZonedTime(colDate, clinicTimezone || 'America/Monterrey'));
                      const isPast = colDateStart.getTime() < todayStart.getTime();
                      
                      if (isHoliday) {
                        // 🎨 Día festivo - Dorado con patrón
                        const gradient = 'repeating-linear-gradient(45deg, #fef3c7, #fef3c7 6px, #fde68a 6px, #fde68a 12px)';
                        (col as HTMLElement).style.background = gradient;
                        const frame = col.querySelector('.fc-timegrid-col-frame') as HTMLElement;
                        if (frame) frame.style.background = gradient;
                      } else if (isRestDay) {
                        // 🎨 Día de descanso - Gris sólido
                        (col as HTMLElement).style.backgroundColor = '#d1d5db';
                        const frame = col.querySelector('.fc-timegrid-col-frame') as HTMLElement;
                        if (frame) frame.style.backgroundColor = '#d1d5db';
                      } else if (isPast) {
                        // 🎨 Día pasado - Gris con líneas diagonales
                        const pastGradient = 'repeating-linear-gradient(-45deg, #e2e8f0, #e2e8f0 4px, #cbd5e1 4px, #cbd5e1 8px)';
                        const colEl = col as HTMLElement;
                        colEl.style.setProperty('background', pastGradient, 'important');
                        colEl.style.setProperty('opacity', '0.8', 'important');
                        const frame = col.querySelector('.fc-timegrid-col-frame') as HTMLElement;
                        if (frame) {
                          frame.style.setProperty('background', pastGradient, 'important');
                        }
                        const bg = col.querySelector('.fc-timegrid-col-bg') as HTMLElement;
                        if (bg) {
                          bg.style.setProperty('background', pastGradient, 'important');
                        }
                        // También los eventos
                        const events = col.querySelector('.fc-timegrid-col-events') as HTMLElement;
                        if (events) {
                          events.style.opacity = '0.9';
                        }
                      }
                    });
                    
                    // 🎨 También estilizar los headers de días pasados
                    const headers = document.querySelectorAll('.fc-wrapper .fc-col-header-cell[data-date]');
                    const todayForHeaders = startOfDay(utcToZonedTime(new Date(), clinicTimezone || 'America/Monterrey'));
                    headers.forEach((header: Element) => {
                      const dateAttr = header.getAttribute('data-date');
                      if (!dateAttr) return;
                      
                      const headerDate = new Date(dateAttr + 'T12:00:00');
                      const headerDateStart = startOfDay(utcToZonedTime(headerDate, clinicTimezone || 'America/Monterrey'));
                      const isPast = headerDateStart.getTime() < todayForHeaders.getTime();
                      
                      if (isPast) {
                        const headerEl = header as HTMLElement;
                        headerEl.style.setProperty('background-color', '#cbd5e1', 'important');
                        headerEl.style.setProperty('color', '#64748b', 'important');
                      }
                    });
                  }, 100);
                }}
                buttonText={{
                  today: 'Hoy',
                  month: 'Mes',
                  week: 'Semana',
                  day: 'Día',
                  list: 'Lista',
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Modal - Unified Grooming (Create or Edit) */}
      <UnifiedGroomingModal
        isOpen={modalOpen}
        scheduledAt={selectedSlot}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        config={config}
        exceptions={exceptions}
        appointments={appointments}
        sourceType={modalSourceType}
        editingAppointment={editingAppointment || undefined}
        defaultLocationType={isVisitsPage ? 'CLINIC' : (activeTab === 'ALL' ? undefined : activeTab)}
        serviceType={isGroomingPage ? 'GROOMING' : isVisitsPage ? 'MEDICAL' : 'GROOMING'}
      />

      {/* Modal - Fecha Inválida */}
      <InvalidDateModal
        isOpen={invalidDateModalOpen}
        selectedDate={invalidDateSelected}
        reason={invalidDateReason}
        onClose={() => setInvalidDateModalOpen(false)}
      />

      {/* Modal - Cancelar Cita */}
      <CancelAppointmentModal
        isOpen={cancelModalOpen}
        appointment={appointmentToCancel}
        onClose={() => {
          setCancelModalOpen(false);
          setAppointmentToCancel(null);
        }}
        onSuccess={(cancelled: Appointment) => {
          toast.success('Cita cancelada exitosamente');
          setCancelModalOpen(false);
          setAppointmentToCancel(null);
          refetch();
        }}
      />

      {/* Modal - Completar Cita */}
      <CompleteAppointmentModal
        isOpen={completeModalOpen}
        appointment={appointmentToComplete}
        onClose={() => {
          setCompleteModalOpen(false);
          setAppointmentToComplete(null);
        }}
        onSuccess={(completed: Appointment) => {
          toast.success('Cita completada exitosamente');
          setCompleteModalOpen(false);
          setAppointmentToComplete(null);
          refetch();
        }}
      />

      {/* Context Menu - Opciones de Cita */}
      <AppointmentContextMenu
        isOpen={!!contextMenu}
        appointment={contextMenu?.appointment || null}
        position={contextMenu?.position || null}
        onClose={() => setContextMenu(null)}
        onViewDetails={(apt) => {
          setContextMenu(null);
          // Si la cita está completada, ir al expediente médico
          // Si no, ir a la captura de datos
          const route = apt.status === 'COMPLETED' 
            ? `/clinic/medical-history/${apt.id}` 
            : `/clinic/visits/${apt.id}`;
          router.push(route);
        }}
        onAssignStylist={(apt) => {
          setAppointmentToAssign(apt);
          setStartAfterAssign(false);
          setAssignModalOpen(true);
        }}
        onEdit={(apt) => {
          setEditingAppointment(apt);
          setModalOpen(true);
        }}
        onStartAppointment={handleStartAppointment}
        onComplete={(apt) => {
          setAppointmentToComplete(apt);
          setCompleteModalOpen(true);
        }}
        onReschedule={(apt) => {
          setAppointmentToReschedule(apt);
          setRescheduleModalOpen(true);
        }}
        onCancel={(apt) => {
          setAppointmentToCancel(apt);
          setCancelModalOpen(true);
        }}
        onMarkNoShow={async (apt) => {
          try {
            await appointmentsApi.updateAppointmentStatus(apt.id, 'NO_SHOW');
            toast.success('Cita marcada como No asistió');
            refetch();
          } catch (error) {
            console.error('Error marking as no show:', error);
            toast.error('Error al actualizar estado');
          }
        }}
      />

      {/* Modal - Asignar Estilista */}
      <AssignStylistModal
        isOpen={assignModalOpen}
        appointment={appointmentToAssign}
        appointments={appointments}
        onClose={() => {
          setAssignModalOpen(false);
          setAppointmentToAssign(null);
          setStartAfterAssign(false);
        }}
        onSuccess={async (updated: Appointment) => {
          toast.success('Estilista asignado exitosamente');
          setAssignModalOpen(false);
          setAppointmentToAssign(null);
          
          // Si se activó "empezar después de asignar", iniciar la cita
          if (startAfterAssign) {
            setStartAfterAssign(false);
            try {
              await appointmentsApi.updateAppointmentStatus(updated.id, 'IN_PROGRESS');
              toast.success('Cita iniciada');
            } catch (error) {
              console.error('Error starting appointment:', error);
              toast.error('Error al iniciar la cita');
            }
          }
          
          refetch();
        }}
      />

      {/* Modal - Reprogramar Cita */}
      <RescheduleAppointmentModal
        isOpen={rescheduleModalOpen}
        appointment={appointmentToReschedule}
        config={config}
        exceptions={exceptions}
        appointments={filteredAppointments}
        onClose={() => {
          setRescheduleModalOpen(false);
          setAppointmentToReschedule(null);
        }}
        onSuccess={() => {
          setRescheduleModalOpen(false);
          setAppointmentToReschedule(null);
          refetch();
        }}
      />
      </div>
    </div>
  );
}

export default function ClinicGroomingPage() {
  return (
    <PermissionGateRoute permissions={['appointments:read']}>
      <ClinicGroomingPageContent />
    </PermissionGateRoute>
  );
}
