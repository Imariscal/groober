'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  MdArrowBack,
  MdEventNote,
  MdChevronLeft,
  MdChevronRight,
  MdCalendarMonth,
  MdMore,
  MdPlayArrow,
  MdPerson,
  MdCheck,
  MdClose,
  MdEdit,
  MdArrowForward,
} from 'react-icons/md';
import { FiRefreshCw } from 'react-icons/fi';
import { useAppointmentsRangeQuery } from '@/hooks/useAppointmentsRangeQuery';
import { useClinicTimezone } from '@/hooks/useClinicTimezone';
import { formatInClinicTz } from '@/lib/datetime-tz';
import { Appointment } from '@/types';
import { startOfDay, endOfDay, format } from 'date-fns';
import { zonedTimeToUtc, formatInTimeZone } from 'date-fns-tz';
import toast from 'react-hot-toast';
import {
  UnifiedGroomingModal,
  CompleteAppointmentModal,
  AssignStylistModal,
  CancelAppointmentModal,
  AppointmentContextMenu,
} from '@/components/appointments';
import { PermissionGate } from '@/components/PermissionGate';
import { usePermissions } from '@/hooks/usePermissions';
import { clinicUsersApi } from '@/api/clinic-users-api';
import { useAuthStore } from '@/store/auth-store';
import { ehrApi } from '@/api/ehr-api';
import { appointmentsApi } from '@/lib/appointments-api';

interface VisitsListViewProps {
  showCalendarToggle?: boolean;
}

type ModalType = 'unified' | 'complete' | 'assign' | 'cancel' | null;

export function VisitsListView({ showCalendarToggle = true }: VisitsListViewProps) {
  const router = useRouter();
  const { has } = usePermissions();
  const timezone = useClinicTimezone();
  const { user } = useAuthStore();

  // Estado de la fecha actual resaltada
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Estado de modales
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [lastVisitData, setLastVisitData] = useState<any>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Cache de nombres de usuarios para evitar múltiples llamadas
  const [userCache, setUserCache] = useState<Map<string, string>>(new Map());

  // Función para obtener el nombre del usuario
  const getUserName = async (userId: string | null | undefined): Promise<string> => {
    if (!userId) return 'N/A';
    
    if (userCache.has(userId)) {
      return userCache.get(userId) || 'N/A';
    }
    
    try {
      const clinicId = user?.clinic_id;
      if (!clinicId) return 'N/A';
      
      const clinicUser = await clinicUsersApi.getUser(userId);
      const userName = (clinicUser as any).name || (clinicUser as any).email || 'N/A';
      setUserCache((prev) => new Map(prev).set(userId, userName));
      return userName;
    } catch (error) {
      return 'N/A';
    }
  };

  // Memoizar fechas para evitar re-renders innecesarios
  const { startOfToday, endOfToday } = useMemo(() => {
    return {
      startOfToday: startOfDay(selectedDate),
      endOfToday: endOfDay(selectedDate),
    };
  }, [selectedDate]);

  const { appointments, isLoading, refetch } = useAppointmentsRangeQuery({
    start: startOfToday,
    end: endOfToday,
    clinicTimezone: timezone,
    serviceType: 'MEDICAL',
  });

  // Ordenar por hora y filtrar solo citas activas (memoizado para evitar re-renders)
  const sortedVisits = useMemo(() => {
    return [...appointments]
      .filter((apt) => apt.status !== 'COMPLETED' && apt.status !== 'CANCELLED')
      .sort((a, b) => {
        const timeA = new Date(a.scheduled_at).getTime();
        const timeB = new Date(b.scheduled_at).getTime();
        return timeA - timeB;
      });
  }, [appointments]);

  // Cargar nombres de usuarios cuando cambian los appointments
  useEffect(() => {
    const loadVeterinarianNames = async () => {
      const uniqueUserIds = new Set(
        sortedVisits
          .filter((apt) => apt.assigned_staff_user_id && !userCache.has(apt.assigned_staff_user_id))
          .map((apt) => apt.assigned_staff_user_id)
      );

      for (const userId of uniqueUserIds) {
        if (userId) {
          await getUserName(userId);
        }
      }
    };

    loadVeterinarianNames();
  }, [sortedVisits, userCache]);

  // Cargar historial médico cuando se selecciona una cita
  useEffect(() => {
    if (!selectedAppointment?.pet_id) {
      setLastVisitData(null);
      return;
    }

    const loadMedicalHistory = async () => {
      try {
        setLoadingHistory(true);
        const response = await ehrApi.getPetMedicalHistory(selectedAppointment.pet_id);
        if (response?.medicalVisits && response.medicalVisits.length > 0) {
          setLastVisitData(response.medicalVisits[0]); // Get last (most recent) visit
        } else {
          setLastVisitData(null);
        }
      } catch (error) {
        console.error('Error loading medical history:', error);
        setLastVisitData(null);
      } finally {
        setLoadingHistory(false);
      }
    };

    loadMedicalHistory();
  }, [selectedAppointment?.pet_id]);

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const handlePrevDay = () => {
    setSelectedDate((prev) => new Date(prev.getTime() - 24 * 60 * 60 * 1000));
  };

  const handleNextDay = () => {
    setSelectedDate((prev) => new Date(prev.getTime() + 24 * 60 * 60 * 1000));
  };

  const handleOpenModal = async (apt: Appointment, type: ModalType) => {
    setSelectedAppointment(apt);
    
    // Si es "Empezar" (SCHEDULED - start visit)
    if (type === 'complete' && apt.status === 'SCHEDULED') {
      try {
        setActionLoading(true);
        // Cambiar status del appointment a IN_PROGRESS
        await appointmentsApi.updateAppointment(apt.id, { status: 'IN_PROGRESS' });
        
        // Redirigir a la pantalla de captura de historial
        router.push(`/clinic/visits/${apt.id}`);
        toast.success('Visita iniciada');
      } catch (error) {
        toast.error('Error al iniciar la visita');
        console.error('Error:', error);
      } finally {
        setActionLoading(false);
      }
      return;
    }
    
    // Si es "Terminar" (IN_PROGRESS - complete visit)
    if (type === 'complete' && apt.status === 'IN_PROGRESS') {
      try {
        setActionLoading(true);
        // Cambio directo sin modal - Update appointment status
        await appointmentsApi.updateAppointment(apt.id, { status: 'COMPLETED' });
        
        // Buscar y actualizar también la medical_visit
        if (apt.pet_id) {
          const response = await ehrApi.getPetMedicalHistory(apt.pet_id);
          const medicalVisit = response?.medicalVisits?.[0];
          if (medicalVisit) {
            await ehrApi.updateMedicalVisitStatus(medicalVisit.id, {
              status: 'COMPLETED',
              signedByVeterinarianId: user?.id,
            });
          }
        }
        
        toast.success('Visita completada');
        setSelectedAppointment(null);
        refetch();
      } catch (error) {
        toast.error('Error al completar la visita');
        console.error('Error:', error);
      } finally {
        setActionLoading(false);
      }
      return;
    }
    
    // Otros tipos de modal (mantener comportamiento anterior)
    setModalType(type);
  };

  const handleContextMenu = (e: React.MouseEvent, apt: Appointment) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedAppointment(apt);
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleViewDetail = (apt: Appointment) => {
    const route = apt.status === 'COMPLETED'
      ? `/clinic/medical-history/${apt.id}`
      : `/clinic/visits/${apt.id}`;
    router.push(route);
  };

  const handleModalClose = () => {
    setModalType(null);
  };

  const handleModalSuccess = () => {
    handleModalClose();
    refetch();
  };

  const dateDisplay = useMemo(() => {
    return format(selectedDate, 'd \'de\' MMMM\'de\' yyyy', {
      locale: require('date-fns/locale/es').default,
    });
  }, [selectedDate]);

  // Función para verificar si la visita es del día actual (sin considerar hora)
  // Usa la zona horaria de la clínica para la comparación
  const isVisitToday = (appointmentDate: Date): boolean => {
    const appointmentDateStr = formatInTimeZone(
      new Date(appointmentDate),
      timezone,
      'yyyy-MM-dd'
    );
    const todayDateStr = formatInTimeZone(
      new Date(),
      timezone,
      'yyyy-MM-dd'
    );
    return appointmentDateStr === todayDateStr;
  };

  return (
    <div className="min-h-screen bg-slate-50 -m-6 lg:-m-4" style={{ height: 'calc(100vh - 64px)' }}>
      <div className="flex flex-col h-full">
        {/* HEADER */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 z-50 flex-shrink-0 w-full">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <MdEventNote className="text-3xl text-emerald-600" />
                Visitas Clínica - Hoy
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Lista de visitas veterinarias del día
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Refresh Button */}
              <button
                onClick={() => refetch()}
                disabled={isLoading}
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition disabled:opacity-50"
                title="Actualizar"
              >
                <FiRefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>

              {/* Toggle Calendar View */}
              {showCalendarToggle && (
                <button
                  onClick={() => router.push('/clinic/visits')}
                  className="flex items-center gap-2 px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                  title="Ver calendario"
                >
                  <MdCalendarMonth className="w-5 h-5" />
                  <span className="hidden sm:inline">Calendario</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* DATE NAVIGATION */}
        <div className="bg-white border-b border-slate-200 px-6 py-3 z-40 flex-shrink-0 w-full">
          <div className="flex items-center justify-between gap-4">
            {/* Today Button */}
            <button
              onClick={handleToday}
              className="px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Hoy
            </button>

            {/* Date Navigation */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg overflow-hidden">
              <button
                onClick={handlePrevDay}
                className="p-2 text-slate-600 hover:bg-slate-50 transition-colors"
                aria-label="Día anterior"
              >
                <MdChevronLeft size={20} />
              </button>

              <div className="text-center text-sm font-semibold text-slate-900 px-4 py-2 min-w-64">
                {dateDisplay}
              </div>

              <button
                onClick={handleNextDay}
                className="p-2 text-slate-600 hover:bg-slate-50 transition-colors"
                aria-label="Próximo día"
              >
                <MdChevronRight size={20} />
              </button>
            </div>

            <div className="flex-1" />
          </div>
        </div>

        {/* MAIN CONTENT: 2 COLUMNS (40% LEFT, 60% RIGHT) */}
        <div className="flex-1 overflow-hidden flex gap-6 p-6">
          {/* LEFT COLUMN: VISITS LIST (40%) */}
          <div className="w-2/5 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-3 text-slate-500">
                  <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <span>Cargando visitas...</span>
                </div>
              </div>
            ) : sortedVisits.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-slate-500">
                  <MdEventNote className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No hay visitas para este día</p>
                </div>
              </div>
            ) : (
              <div className="grid gap-3">
                {sortedVisits.map((apt) => {
                  const petSex =
                    apt.pet?.sex === 'MALE' ? '♂' : apt.pet?.sex === 'FEMALE' ? '♀' : '•';
                  const sizeLabel = (apt.pet?.size || 'M').toUpperCase();
                  const isSelected = selectedAppointment?.id === apt.id;

                  return (
                    <div
                      key={apt.id}
                      onClick={() => setSelectedAppointment(apt)}
                      className={`bg-white rounded-lg border overflow-hidden transition cursor-pointer ${
                        isSelected
                          ? 'ring-2 ring-emerald-500 shadow-lg'
                          : apt.status === 'CANCELLED'
                          ? 'border-red-500 hover:border-red-600 shadow-sm shadow-red-200'
                          : apt.status === 'COMPLETED'
                          ? 'border-green-500 hover:border-green-600 shadow-sm shadow-green-200'
                          : apt.status === 'IN_PROGRESS'
                          ? 'border-blue-500 hover:border-blue-600 shadow-sm shadow-blue-200'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                      onContextMenu={(e) => handleContextMenu(e, apt)}
                    >
                      {/* HEADER: Mascota + Cliente + Status */}
                      <div className="px-6 py-2.5 border-b border-slate-100">
                        <div className="flex items-baseline justify-between gap-3 mb-1">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base font-bold text-slate-900 truncate">
                              {apt.pet?.name || 'Mascota'}
                            </h3>
                            <span className="text-xs text-slate-500">
                              {petSex} {apt.pet?.breed || 'Raza'} • {sizeLabel}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <span
                              className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${
                                apt.status === 'COMPLETED'
                                  ? 'bg-green-100 text-green-700'
                                  : apt.status === 'IN_PROGRESS'
                                  ? 'bg-blue-100 text-blue-700'
                                  : apt.status === 'CANCELLED'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}
                            >
                              {apt.status === 'COMPLETED'
                                ? '✓'
                                : apt.status === 'IN_PROGRESS'
                                ? '⏳'
                                : apt.status === 'CANCELLED'
                                ? '✕'
                                : '◯'}
                            </span>
                            <button
                              onClick={(e) => handleContextMenu(e, apt)}
                              className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition flex-shrink-0"
                            >
                              <MdMore size={14} />
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-slate-500">👤 {apt.client?.name || 'Cliente'}</p>
                      </div>

                      {/* INFO BAR: Hora + Duración + Veterinario (Horizontal) */}
                      <div className="px-6 py-2.5 bg-gradient-to-r from-emerald-50 to-blue-50 border-b border-slate-100">
                        <div className="flex items-center gap-3 flex-wrap">
                          {/* HORA - Principal */}
                          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-emerald-200 shadow-sm">
                            <span className="text-base font-bold text-emerald-700">
                              {formatInClinicTz(apt.scheduled_at, timezone, 'HH:mm')}
                            </span>
                          </div>

                          {/* Duración */}
                          <div className="flex items-center gap-1 text-xs font-medium text-slate-700">
                            <span>⏱️</span>
                            <span>{apt.duration_minutes || 30} min</span>
                          </div>

                          {/* Separador */}
                          <div className="h-4 border-l border-slate-300" />

                          {/* Veterinario */}
                          <div className="flex items-center gap-1 text-xs">
                            {apt.assigned_staff_user_id ? (
                              <>
                                <span className="text-sm">👨‍⚕️</span>
                                <span className="font-semibold text-slate-700 truncate max-w-xs">
                                  {userCache.get(apt.assigned_staff_user_id) || 'Cargando...'}
                                </span>
                              </>
                            ) : (
                              <span className="text-slate-400 italic text-xs">Sin asignar</span>
                            )}
                          </div>
                        </div>

                        {/* Servicios - Debajo si existen */}
                        {(apt as any).appointmentItems && (apt as any).appointmentItems.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-slate-200">
                            <div className="flex flex-wrap gap-1.5">
                              {(apt as any).appointmentItems.map(
                                (item: any, idx: number) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center px-2 py-1 bg-white text-emerald-700 rounded text-xs font-semibold border border-emerald-200 shadow-xs"
                                  >
                                    {item.service?.name || item.package?.name || 'Servicio'}
                                  </span>
                                )
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* ACTIONS ROW */}
                      <div className="flex items-center gap-1.5 px-6 py-2 flex-wrap bg-slate-50">
                      {apt.status !== 'COMPLETED' && apt.status !== 'CANCELLED' && (
                        <>
                          {!apt.assigned_staff_user_id && isVisitToday(apt.scheduled_at) && (
                            <button
                              onClick={() => handleOpenModal(apt, 'assign')}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 rounded transition font-medium flex-shrink-0"
                            >
                              <MdPerson size={13} />
                              Asignar
                            </button>
                          )}
                          
                          {isVisitToday(apt.scheduled_at) ? (
                            apt.status === 'SCHEDULED' ? (
                              <button
                                onClick={() => handleOpenModal(apt, 'complete')}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 rounded transition font-medium flex-shrink-0"
                              >
                                <MdPlayArrow size={13} />
                                Empezar
                              </button>
                            ) : apt.status === 'IN_PROGRESS' ? (
                              <button
                                onClick={() => handleOpenModal(apt, 'complete')}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-green-50 text-green-700 hover:bg-green-100 rounded transition font-medium flex-shrink-0"
                              >
                                <MdCheck size={13} />
                                Terminar
                              </button>
                            ) : null
                          ) : (
                            // Mostrar mensaje si no es hoy
                            <span className="inline-flex items-center px-2.5 py-1 text-xs bg-slate-100 text-slate-500 rounded font-medium flex-shrink-0">
                              No disponible en esta fecha
                            </span>
                          )}
                        </>
                      )}

                      {apt.status === 'IN_PROGRESS' && isVisitToday(apt.scheduled_at) && (
                        <button
                          onClick={() => handleViewDetail(apt)}
                          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-lg transition-all duration-300 hover:shadow-lg hover:scale-105 active:scale-95 flex-shrink-0 shadow-md hover:from-emerald-600 hover:to-blue-600"
                        >
                          <MdArrowForward size={14} />
                          Continuar
                        </button>
                      )}

                      {apt.status !== 'COMPLETED' && apt.status !== 'CANCELLED' && (
                        <button
                          onClick={() => handleOpenModal(apt, 'cancel')}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-red-50 text-red-700 hover:bg-red-100 rounded transition font-medium ml-auto flex-shrink-0"
                        >
                          <MdClose size={13} />
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          </div>

          {/* RIGHT COLUMN: PREVIEW PANEL (60%) */}
          <div className="w-3/5 bg-gradient-to-b from-slate-50 to-white rounded-lg border border-slate-200 overflow-hidden flex flex-col">
            {selectedAppointment ? (
              <>
                {/* Preview Header */}
                <div className="px-4 py-4 border-b border-slate-200 bg-white relative">
                  <h2 className="text-lg font-bold text-slate-900 mb-1 pr-6">
                    {selectedAppointment.pet?.name || 'Mascota'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {selectedAppointment.pet?.breed} • {selectedAppointment.pet?.size}
                  </p>
                  <button
                    onClick={() => setSelectedAppointment(null)}
                    className="absolute top-3 right-3 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition"
                  >
                    <MdClose size={16} />
                  </button>
                </div>

                {/* Preview Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Cita Actual */}
                  <div className="bg-white rounded-lg p-3 border border-emerald-200">
                    <h3 className="text-xs font-bold text-slate-900 mb-2">Cita Actual</h3>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Hora:</span>
                        <span className="font-semibold">
                          {formatInClinicTz(selectedAppointment.scheduled_at, timezone, 'HH:mm')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Duración:</span>
                        <span className="font-semibold">{selectedAppointment.duration_minutes || 30} min</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Cliente:</span>
                        <span className="font-semibold">{selectedAppointment.client?.name}</span>
                      </div>
                      {selectedAppointment.assigned_staff_user_id && (
                        <div className="flex justify-between">
                          <span className="text-slate-600">Veterinario:</span>
                          <span className="font-semibold">
                            {userCache.get(selectedAppointment.assigned_staff_user_id) || 'Cargando...'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Información de Mascota */}
                  <div className="bg-white rounded-lg p-3 border border-slate-200">
                    <h3 className="text-xs font-bold text-slate-900 mb-2">Información</h3>
                    <div className="space-y-1.5 text-xs">
                      <div>
                        <span className="text-slate-600">Sexo:</span>{' '}
                        <span className="font-semibold">
                          {selectedAppointment.pet?.sex === 'MALE'
                            ? 'Macho ♂'
                            : selectedAppointment.pet?.sex === 'FEMALE'
                            ? 'Hembra ♀'
                            : 'Desconocido'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-600">Raza:</span>{' '}
                        <span className="font-semibold">{selectedAppointment.pet?.breed || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-600">Tamaño:</span>{' '}
                        <span className="font-semibold">{selectedAppointment.pet?.size || 'M'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Última Visita Médica - Medical History */}
                  {loadingHistory ? (
                    <div className="bg-white rounded-lg p-3 border border-slate-200 text-center text-xs text-slate-500">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      Cargando historial...
                    </div>
                  ) : lastVisitData ? (
                    <div className="space-y-3">
                      {/* Vital Signs */}
                      {(lastVisitData.temperature || lastVisitData.heart_rate || lastVisitData.respiratory_rate || lastVisitData.blood_pressure || lastVisitData.weight) && (
                        <div className="bg-white rounded-lg p-3 border border-blue-200">
                          <h3 className="text-xs font-bold text-slate-900 mb-2">💓 Signos Vitales (Última Visita)</h3>
                          <div className="space-y-1.5 text-xs">
                            {lastVisitData.temperature && (
                              <div className="flex justify-between">
                                <span className="text-slate-600">Temperatura:</span>
                                <span className="font-semibold">{lastVisitData.temperature}°C</span>
                              </div>
                            )}
                            {lastVisitData.heart_rate && (
                              <div className="flex justify-between">
                                <span className="text-slate-600">Frecuencia Cardíaca:</span>
                                <span className="font-semibold">{lastVisitData.heart_rate} bpm</span>
                              </div>
                            )}
                            {lastVisitData.respiratory_rate && (
                              <div className="flex justify-between">
                                <span className="text-slate-600">Freq. Respiratoria:</span>
                                <span className="font-semibold">{lastVisitData.respiratory_rate} rpm</span>
                              </div>
                            )}
                            {lastVisitData.blood_pressure && (
                              <div className="flex justify-between">
                                <span className="text-slate-600">Presión Arterial:</span>
                                <span className="font-semibold">{lastVisitData.blood_pressure}</span>
                              </div>
                            )}
                            {lastVisitData.weight && (
                              <div className="flex justify-between">
                                <span className="text-slate-600">Peso:</span>
                                <span className="font-semibold">{lastVisitData.weight} kg</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Clinical Notes */}
                      {lastVisitData.clinical_notes && (
                        <div className="bg-white rounded-lg p-3 border border-amber-200">
                          <h3 className="text-xs font-bold text-slate-900 mb-2">📝 Notas Clínicas</h3>
                          <p className="text-xs text-slate-700 line-clamp-3">{lastVisitData.clinical_notes}</p>
                        </div>
                      )}

                      {/* Procedures */}
                      {lastVisitData.procedures && lastVisitData.procedures.length > 0 && (
                        <div className="bg-white rounded-lg p-3 border border-purple-200">
                          <h3 className="text-xs font-bold text-slate-900 mb-2">🔧 Procedimientos</h3>
                          <div className="space-y-1 text-xs">
                            {lastVisitData.procedures.slice(0, 3).map((proc: any, idx: number) => (
                              <div key={idx} className="flex items-start gap-2">
                                <span className="text-purple-600 font-bold">•</span>
                                <span className="text-slate-700">{proc.procedure_type || proc.name}</span>
                              </div>
                            ))}
                            {lastVisitData.procedures.length > 3 && (
                              <span className="text-slate-500 italic">+{lastVisitData.procedures.length - 3} más</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Follow-up Notes */}
                      {lastVisitData.followUpNotes && lastVisitData.followUpNotes.length > 0 && (
                        <div className="bg-white rounded-lg p-3 border border-green-200">
                          <h3 className="text-xs font-bold text-slate-900 mb-2">📌 Notas de Seguimiento</h3>
                          <div className="space-y-1 text-xs">
                            {lastVisitData.followUpNotes.slice(0, 2).map((note: any, idx: number) => (
                              <div key={idx} className="text-slate-700">
                                <span className="font-semibold text-green-600">{note.status}:</span> {note.description}
                              </div>
                            ))}
                            {lastVisitData.followUpNotes.length > 2 && (
                              <span className="text-slate-500 italic">+{lastVisitData.followUpNotes.length - 2} más</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Vaccines */}
                      {lastVisitData.vaccines && lastVisitData.vaccines.length > 0 && (
                        <div className="bg-white rounded-lg p-3 border border-cyan-200">
                          <h3 className="text-xs font-bold text-slate-900 mb-2">💉 Vacunas</h3>
                          <div className="space-y-1 text-xs">
                            {lastVisitData.vaccines.slice(0, 3).map((vaccine: any, idx: number) => (
                              <div key={idx} className="flex justify-between">
                                <span className="text-slate-700">{vaccine.vaccine_name || vaccine.name}</span>
                                <span className="text-slate-500 text-xs">{vaccine.date_administered ? new Date(vaccine.date_administered).toLocaleDateString('es-ES') : 'N/A'}</span>
                              </div>
                            ))}
                            {lastVisitData.vaccines.length > 3 && (
                              <span className="text-slate-500 italic">+{lastVisitData.vaccines.length - 3} más</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Allergies */}
                      {lastVisitData.allergies && lastVisitData.allergies.length > 0 && (
                        <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                          <h3 className="text-xs font-bold text-red-900 mb-2">⚠️ Alergias</h3>
                          <div className="space-y-1 text-xs">
                            {lastVisitData.allergies.map((allergy: any, idx: number) => (
                              <div key={idx} className="text-red-700">
                                <span className="font-semibold">{allergy.allergen || allergy.name}:</span> {allergy.reaction || 'Alergia registrada'}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : null}

                  {/* Servicios */}
                  {(selectedAppointment as any).appointmentItems && (selectedAppointment as any).appointmentItems.length > 0 && (
                    <div className="bg-white rounded-lg p-3 border border-slate-200">
                      <h3 className="text-xs font-bold text-slate-900 mb-2">Servicios</h3>
                      <div className="flex flex-wrap gap-1.5">
                        {(selectedAppointment as any).appointmentItems.map((item: any, idx: number) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-xs font-semibold border border-emerald-200"
                          >
                            {item.service?.name || item.package?.name || 'Servicio'}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-slate-400">
                  <MdEventNote className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">Selecciona una cita para ver el preview</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODALS */}
      {selectedAppointment && (
        <>
          <CompleteAppointmentModal
            isOpen={modalType === 'complete'}
            appointment={selectedAppointment}
            onClose={handleModalClose}
            onSuccess={() => handleModalSuccess()}
          />

          <AssignStylistModal
            isOpen={modalType === 'assign'}
            appointment={selectedAppointment}
            onClose={handleModalClose}
            onSuccess={() => handleModalSuccess()}
          />

          <CancelAppointmentModal
            isOpen={modalType === 'cancel'}
            appointment={selectedAppointment}
            onClose={handleModalClose}
            onSuccess={() => handleModalSuccess()}
          />

          <UnifiedGroomingModal
            isOpen={modalType === 'unified'}
            scheduledAt={
              selectedAppointment.scheduled_at
                ? new Date(selectedAppointment.scheduled_at)
                : null
            }
            onClose={handleModalClose}
            onSuccess={async () => handleModalSuccess()}
            editingAppointment={selectedAppointment}
            serviceType="MEDICAL"
          />
        </>
      )}

      {/* CONTEXT MENU */}
      {contextMenu && selectedAppointment && (
        <AppointmentContextMenu
          isOpen={true}
          appointment={selectedAppointment}
          position={contextMenu}
          onClose={() => setContextMenu(null)}
          onViewDetails={() => {
            if (selectedAppointment) handleViewDetail(selectedAppointment);
          }}
          onAssignStylist={() => {
            if (selectedAppointment) handleOpenModal(selectedAppointment, 'assign');
          }}
          onEdit={() => {
            if (selectedAppointment) handleOpenModal(selectedAppointment, 'unified');
          }}
          onStartAppointment={() => {}}
          onComplete={() => {
            if (selectedAppointment) handleOpenModal(selectedAppointment, 'complete');
          }}
          onReschedule={() => {}}
          onCancel={() => {
            if (selectedAppointment) handleOpenModal(selectedAppointment, 'cancel');
          }}
          onMarkNoShow={() => {}}
        />
      )}
    </div>
  );
}

