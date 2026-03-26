'use client';

import React, { useEffect, useState } from 'react';
import {
  MdDelete,
  MdEdit,
  MdAdd,
  MdCheckCircle,
  MdCancel,
  MdAccessTime,
  MdEventBusy,
  MdPeopleAlt,
} from 'react-icons/md';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { useClinicTimezone } from '@/hooks/useClinicTimezone';
import { formatInTimeZone } from 'date-fns-tz';
import { stylistsApi, StylistUnavailablePeriod, StylistCapacity, StylistAvailability } from '@/api/stylists-api';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Lunes' },
  { value: 1, label: 'Martes' },
  { value: 2, label: 'Miércoles' },
  { value: 3, label: 'Jueves' },
  { value: 4, label: 'Viernes' },
  { value: 5, label: 'Sábado' },
  { value: 6, label: 'Domingo' },
];

// Generate time options from 7:00 AM to 9:00 PM in 30-minute intervals
const TIME_OPTIONS = (() => {
  const options: { value: string; label: string }[] = [];
  for (let hour = 7; hour <= 21; hour++) {
    for (const min of ['00', '30']) {
      if (hour === 21 && min === '30') continue; // Don't go past 21:00
      const value = `${String(hour).padStart(2, '0')}:${min}`;
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const label = `${displayHour}:${min} ${ampm}`;
      options.push({ value, label });
    }
  }
  return options;
})();

const UNAVAILABLE_REASONS = [
  { value: 'VACATION', label: 'Vacaciones' },
  { value: 'SICK_LEAVE', label: 'Incapacidad' },
  { value: 'REST_DAY', label: 'Día de descanso' },
  { value: 'PERSONAL', label: 'Asunto personal' },
  { value: 'OTHER', label: 'Otro' },
];

type StylistTab = 'availabilities' | 'unavailable' | 'capacities';

interface LocalStylist {
  id: string;
  display_name: string;
  type?: 'CLINIC' | 'HOME';
}

export const StylistAvailabilityTab: React.FC = () => {
  const { user } = useAuth();
  const clinicId = user?.clinic_id || '';
  const clinicTimezone = useClinicTimezone();

  const [activeTab, setActiveTab] = useState<StylistTab>('availabilities');
  const [stylists, setStylists] = useState<LocalStylist[]>([]);
  const [selectedStylistId, setSelectedStylistId] = useState<string>('');
  const [selectedStylistType, setSelectedStylistType] = useState<'CLINIC' | 'HOME'>('CLINIC');
  const [isEditingStylistType, setIsEditingStylistType] = useState(false);
  const [tempStylistType, setTempStylistType] = useState<'CLINIC' | 'HOME'>('CLINIC');

  const [availabilities, setAvailabilities] = useState<StylistAvailability[]>([]);
  const [unavailablePeriods, setUnavailablePeriods] = useState<StylistUnavailablePeriod[]>([]);
  const [capacities, setCapacities] = useState<StylistCapacity[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [showAddAvailability, setShowAddAvailability] = useState(false);
  const [showAddUnavailable, setShowAddUnavailable] = useState(false);
  const [showAddCapacity, setShowAddCapacity] = useState(false);

  const [availabilityForm, setAvailabilityForm] = useState({
    day_of_week: 0,
    start_time: '09:00',
    end_time: '18:00',
  });

  const [unavailableForm, setUnavailableForm] = useState({
    reason: 'VACATION' as const,
    start_date: '',
    end_date: '',
    is_all_day: true,
    start_time: '09:00',
    end_time: '18:00',
    notes: '',
  });

  const [capacityForm, setCapacityForm] = useState({
    date: '',
    max_appointments: 6,
    notes: '',
  });

  // Load stylists
  useEffect(() => {
    const loadStylists = async () => {
      try {
        setIsLoading(true);
        const data = await stylistsApi.listStylists(clinicId);
        // Map API response to LocalStylist interface
        const mappedStylists = data.map((stylist: any) => ({
          id: stylist.id,
          display_name: stylist.displayName || stylist.user?.name || 'Unknown',
          type: stylist.type || 'CLINIC',
        }));
        setStylists(mappedStylists);
        if (mappedStylists.length > 0) {
          setSelectedStylistId(mappedStylists[0].id);
          setSelectedStylistType(mappedStylists[0].type || 'CLINIC');
          setTempStylistType(mappedStylists[0].type || 'CLINIC');
        }
      } catch (error) {
        console.error('Error loading stylists:', error);
        toast.error('Error al cargar estilistas');
      } finally {
        setIsLoading(false);
      }
    };
    if (clinicId) {
      loadStylists();
    }
  }, [clinicId]);

  // Load data when stylist or tab changes
  useEffect(() => {
    if (selectedStylistId) {
      loadData();
    }
  }, [selectedStylistId, activeTab]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      if (activeTab === 'availabilities') {
        const data = await stylistsApi.listAvailabilities(clinicId, selectedStylistId);
        setAvailabilities(data);
      } else if (activeTab === 'unavailable') {
        const data = await stylistsApi.listUnavailablePeriods(clinicId, selectedStylistId);
        setUnavailablePeriods(data);
      } else if (activeTab === 'capacities') {
        const data = await stylistsApi.listCapacities(clinicId, selectedStylistId);
        setCapacities(data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar datos');
    } finally {
      setIsLoading(false);
    }
  };

  // ============= AVAILABILITY HANDLERS =============

  const handleAddAvailability = async () => {
    if (!selectedStylistId) return;
    try {
      setIsSaving(true);
      await stylistsApi.createAvailability(clinicId, selectedStylistId, availabilityForm);
      toast.success('Horario agregado');
      setShowAddAvailability(false);
      setAvailabilityForm({ day_of_week: 0, start_time: '09:00', end_time: '18:00' });
      await loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al agregar horario');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAvailability = async (availabilityId: string) => {
    if (!selectedStylistId) return;
    try {
      setIsSaving(true);
      await stylistsApi.deleteAvailability(clinicId, selectedStylistId, availabilityId);
      toast.success('Horario eliminado');
      await loadData();
    } catch (error) {
      toast.error('Error al eliminar horario');
    } finally {
      setIsSaving(false);
    }
  };

  // ============= UNAVAILABLE HANDLERS =============

  const handleAddUnavailable = async () => {
    if (!selectedStylistId) return;
    try {
      setIsSaving(true);
      const payload = {
        ...unavailableForm,
        start_time: unavailableForm.is_all_day ? undefined : unavailableForm.start_time,
        end_time: unavailableForm.is_all_day ? undefined : unavailableForm.end_time,
      };
      await stylistsApi.createUnavailablePeriod(clinicId, selectedStylistId, payload);
      toast.success('Período de no disponibilidad agregado');
      setShowAddUnavailable(false);
      setUnavailableForm({
        reason: 'VACATION',
        start_date: '',
        end_date: '',
        is_all_day: true,
        start_time: '09:00',
        end_time: '18:00',
        notes: '',
      });
      await loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al agregar período');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUnavailable = async (periodId: string) => {
    if (!selectedStylistId) return;
    try {
      setIsSaving(true);
      await stylistsApi.deleteUnavailablePeriod(clinicId, selectedStylistId, periodId);
      toast.success('Período eliminado');
      await loadData();
    } catch (error) {
      toast.error('Error al eliminar período');
    } finally {
      setIsSaving(false);
    }
  };

  // ============= CAPACITY HANDLERS =============

  const handleAddCapacity = async () => {
    if (!selectedStylistId) return;
    try {
      setIsSaving(true);
      await stylistsApi.createCapacity(clinicId, selectedStylistId, capacityForm);
      toast.success('Capacidad agregada');
      setShowAddCapacity(false);
      setCapacityForm({ date: '', max_appointments: 6, notes: '' });
      await loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al agregar capacidad');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCapacity = async (capacityId: string) => {
    if (!selectedStylistId) return;
    try {
      setIsSaving(true);
      await stylistsApi.deleteCapacity(clinicId, selectedStylistId, capacityId);
      toast.success('Capacidad eliminada');
      await loadData();
    } catch (error) {
      toast.error('Error al eliminar capacidad');
    } finally {
      setIsSaving(false);
    }
  };

  // ============= STYLIST TYPE HANDLERS =============

  const handleUpdateStylistType = async () => {
    if (!selectedStylistId) return;
    try {
      setIsSaving(true);
      await stylistsApi.updateStylist(clinicId, selectedStylistId, { type: tempStylistType });
      setSelectedStylistType(tempStylistType);
      setIsEditingStylistType(false);
      toast.success('Tipo de estilista actualizado');
      // Reload stylists to update list
      const data = await stylistsApi.listStylists(clinicId);
      const mappedStylists = data.map((stylist: any) => ({
        id: stylist.id,
        display_name: stylist.displayName || stylist.user?.name || 'Unknown',
        type: stylist.type || 'CLINIC',
      }));
      setStylists(mappedStylists);
    } catch (error) {
      toast.error('Error al actualizar tipo de estilista');
      console.error('Error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEditType = () => {
    setIsEditingStylistType(false);
    setTempStylistType(selectedStylistType);
  };

  // Sincronizar tipo de estilista cuando cambia el estilista seleccionado o la lista de estilistas recarga
  useEffect(() => {
    if (selectedStylistId && stylists.length > 0) {
      const selected = stylists.find(s => s.id === selectedStylistId);
      if (selected) {
        setSelectedStylistType(selected.type || 'CLINIC');
        setTempStylistType(selected.type || 'CLINIC');
      }
    }
  }, [selectedStylistId, stylists]);

  // Update selected stylist type when stylist changes
  const handleStylistChange = (stylistId: string) => {
    setSelectedStylistId(stylistId);
    const selected = stylists.find(s => s.id === stylistId);
    if (selected) {
      setSelectedStylistType(selected.type || 'CLINIC');
      setTempStylistType(selected.type || 'CLINIC');
    }
  };

  if (isLoading && stylists.length === 0) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>;
  }

  if (stylists.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <MdPeopleAlt className="text-4xl text-gray-400" />
        <p className="text-gray-600">No hay estilistas creados</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-2xl">
      {/* Stylist Selector - Modern Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white">
            <MdPeopleAlt className="text-lg" />
          </div>
          <label className="block text-sm font-semibold text-slate-700">
            Seleccionar Estilista
          </label>
        </div>
        <select
          value={selectedStylistId}
          onChange={(e) => handleStylistChange(e.target.value)}
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white font-medium text-slate-700"
        >
          {stylists.map((s) => (
            <option key={s.id} value={s.id}>
              {s.display_name || 'Sin nombre'}
            </option>
          ))}
        </select>
      </div>

      {/* Stylist Type Selector - New Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white">
              <MdEdit className="text-lg" />
            </div>
            <label className="block text-sm font-semibold text-slate-700">
              Tipo de Estilista
            </label>
          </div>
          {!isEditingStylistType && (
            <button
              onClick={() => {
                setIsEditingStylistType(true);
                setTempStylistType(selectedStylistType);
              }}
              className="text-purple-600 hover:text-purple-700 font-semibold text-sm"
            >
              Editar
            </button>
          )}
        </div>

        {!isEditingStylistType ? (
          <div className="flex items-center gap-3">
            <span className="px-4 py-2 bg-gradient-to-r from-purple-100 to-purple-50 border border-purple-200 rounded-lg font-semibold text-purple-700">
              {selectedStylistType === 'CLINIC' ? '🏥 Clínica' : '🏠 Domicilio'}
            </span>
            <span className="text-sm text-slate-500">
              {selectedStylistType === 'CLINIC' ? 'Estilista de clínica' : 'Estilista de domicilio'}
            </span>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setTempStylistType('CLINIC')}
                className={`p-4 border-2 rounded-lg font-semibold transition-all ${
                  tempStylistType === 'CLINIC'
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                🏥 Clínica
              </button>
              <button
                onClick={() => setTempStylistType('HOME')}
                className={`p-4 border-2 rounded-lg font-semibold transition-all ${
                  tempStylistType === 'HOME'
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                🏠 Domicilio
              </button>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleUpdateStylistType}
                disabled={isSaving}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:shadow-lg transform hover:scale-105 transition-all font-semibold text-sm disabled:opacity-50"
              >
                {isSaving ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                onClick={handleCancelEditType}
                disabled={isSaving}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-all font-semibold text-sm disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tabs - Modern Design */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex gap-1 p-1 bg-slate-100">
          <button
            onClick={() => setActiveTab('availabilities')}
            className={`flex-1 px-4 py-3 font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
              activeTab === 'availabilities'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MdAccessTime className="text-lg" /> 
            <span className="hidden sm:inline">Horarios</span>
          </button>
          <button
            onClick={() => setActiveTab('unavailable')}
            className={`flex-1 px-4 py-3 font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
              activeTab === 'unavailable'
                ? 'bg-white text-amber-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MdEventBusy className="text-lg" />
            <span className="hidden sm:inline">Vacaciones</span>
          </button>
          <button
            onClick={() => setActiveTab('capacities')}
            className={`flex-1 px-4 py-3 font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
              activeTab === 'capacities'
                ? 'bg-white text-emerald-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MdPeopleAlt className="text-lg" />
            <span className="hidden sm:inline">Capacidad</span>
          </button>
        </div>

        {/* AVAILABILITIES TAB */}
        {activeTab === 'availabilities' && (
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center text-white">
                <MdAccessTime className="text-lg" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Horarios de Trabajo</h3>
                <p className="text-sm text-slate-500">Define tu jornada de trabajo (7:00 AM - 9:00 PM)</p>
              </div>
            </div>
            <div className="space-y-4">
              {DAYS_OF_WEEK.map(({ value, label }) => {
                const dayAvailability = availabilities.find((a) => a.day_of_week === value);
                const isAvailable = !!dayAvailability;
                const startTime = dayAvailability?.start_time?.substring(0, 5) || '09:00';
                const endTime = dayAvailability?.end_time?.substring(0, 5) || '17:00';

                return (
                  <div key={value} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">{label}</label>
                      <button
                        onClick={async () => {
                          if (isAvailable && dayAvailability) {
                            // Delete availability
                            try {
                              setIsSaving(true);
                              await stylistsApi.deleteAvailability(clinicId, selectedStylistId, dayAvailability.id);
                              toast.success('Horario eliminado');
                              await loadData();
                            } catch (error) {
                              toast.error('Error al eliminar horario');
                            } finally {
                              setIsSaving(false);
                            }
                          } else {
                            // Add new availability with default times
                            try {
                              setIsSaving(true);
                              await stylistsApi.createAvailability(clinicId, selectedStylistId, {
                                day_of_week: value,
                                start_time: '09:00',
                                end_time: '17:00',
                              });
                              toast.success('Horario creado');
                              await loadData();
                            } catch (error) {
                              toast.error('Error al crear horario');
                            } finally {
                              setIsSaving(false);
                            }
                          }
                        }}
                        disabled={isSaving}
                        className={`px-3 py-1 text-xs rounded font-medium transition ${
                          isAvailable
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        } disabled:opacity-50`}
                      >
                        {isAvailable ? 'Disponible' : 'No Disponible'}
                      </button>
                    </div>

                    {isAvailable && dayAvailability && (
                      <div className="mt-3">
                        <div className="flex gap-2 items-end">
                          <div className="flex-1">
                            <label className="block text-xs text-gray-600 mb-1">Inicio</label>
                            <select
                              value={startTime}
                              onChange={async (e) => {
                                try {
                                  setIsSaving(true);
                                  await stylistsApi.updateAvailability(
                                    clinicId,
                                    selectedStylistId,
                                    dayAvailability.id,
                                    { start_time: e.target.value }
                                  );
                                  await loadData();
                                  toast.success('Hora actualizada');
                                } catch (error) {
                                  toast.error('Error al actualizar horario');
                                } finally {
                                  setIsSaving(false);
                                }
                              }}
                              className="w-full px-2 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                            >
                              {TIME_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs text-gray-600 mb-1">Fin</label>
                            <select
                              value={endTime}
                              onChange={async (e) => {
                                try {
                                  setIsSaving(true);
                                  await stylistsApi.updateAvailability(
                                    clinicId,
                                    selectedStylistId,
                                    dayAvailability.id,
                                    { end_time: e.target.value }
                                  );
                                  await loadData();
                                  toast.success('Hora actualizada');
                                } catch (error) {
                                  toast.error('Error al actualizar horario');
                                } finally {
                                  setIsSaving(false);
                                }
                              }}
                              className="w-full px-2 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                            >
                              {TIME_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* UNAVAILABLE PERIODS TAB */}
        {activeTab === 'unavailable' && (
          <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Períodos No Disponible</h3>
                <p className="text-sm text-slate-500 mt-1">Vacaciones, enfermedades y otros períodos</p>
              </div>
              <button
                onClick={() => setShowAddUnavailable(!showAddUnavailable)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg hover:shadow-lg transform hover:scale-105 transition-all font-semibold text-sm"
              >
                <MdAdd className="text-lg" /> Agregar
              </button>
            </div>

            {/* Add Unavailable Form */}
            {showAddUnavailable && (
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-5 rounded-xl border-2 border-amber-200 space-y-4">
                <h4 className="font-semibold text-amber-900">Nuevo Período</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Razón
                    </label>
                    <select
                      value={unavailableForm.reason}
                      onChange={(e) =>
                        setUnavailableForm({
                          ...unavailableForm,
                          reason: e.target.value as any,
                        })
                      }
                      className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white"
                    >
                      {UNAVAILABLE_REASONS.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-end">
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 px-3 py-2 bg-white rounded-lg border border-amber-300 w-full cursor-pointer hover:bg-amber-50">
                      <input
                        type="checkbox"
                        checked={unavailableForm.is_all_day}
                        onChange={(e) =>
                          setUnavailableForm({
                            ...unavailableForm,
                            is_all_day: e.target.checked,
                          })
                        }
                        className="cursor-pointer"
                      />
                      Todo el día
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Fecha Inicio
                    </label>
                    <input
                      type="date"
                      value={unavailableForm.start_date}
                      onChange={(e) =>
                        setUnavailableForm({
                          ...unavailableForm,
                          start_date: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Fecha Fin
                    </label>
                    <input
                      type="date"
                      value={unavailableForm.end_date}
                      onChange={(e) =>
                        setUnavailableForm({
                          ...unavailableForm,
                          end_date: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {!unavailableForm.is_all_day && (
                    <>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Hora Inicio
                        </label>
                        <select
                          value={unavailableForm.start_time}
                          onChange={(e) =>
                            setUnavailableForm({
                              ...unavailableForm,
                              start_time: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white"
                        >
                          {TIME_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Hora Fin
                        </label>
                        <select
                          value={unavailableForm.end_time}
                          onChange={(e) =>
                            setUnavailableForm({
                              ...unavailableForm,
                              end_time: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white"
                        >
                          {TIME_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Notas (Opcional)
                  </label>
                  <textarea
                    value={unavailableForm.notes}
                    onChange={(e) =>
                      setUnavailableForm({
                        ...unavailableForm,
                        notes: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    rows={2}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleAddUnavailable}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:shadow-lg font-semibold disabled:opacity-50 transition-all"
                  >
                    <MdCheckCircle /> Guardar
                  </button>
                  <button
                    onClick={() => setShowAddUnavailable(false)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-400 text-white rounded-lg hover:bg-slate-500 font-semibold transition-all"
                  >
                    <MdCancel /> Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Unavailable Periods List */}
            {unavailablePeriods.length === 0 ? (
              <div className="text-center py-12">
                <MdEventBusy className="text-4xl text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No hay períodos registrados</p>
                <p className="text-sm text-slate-400 mt-1">Agrega períodos de no disponibilidad</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {unavailablePeriods.map((period) => (
                  <div
                    key={period.id}
                    className="flex justify-between items-start p-4 bg-white border border-slate-200 rounded-lg hover:shadow-md hover:border-amber-300 transition-all group"
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600 mt-0.5">
                        <MdEventBusy className="text-lg" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-800">
                            {UNAVAILABLE_REASONS.find((r) => r.value === period.reason)?.label}
                          </p>
                          <span className="px-2 py-0.5 text-xs font-semibold bg-amber-100 text-amber-700 rounded-full">
                            {period.is_all_day ? 'Todo el día' : 'Parcial'}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 mt-1">
                          {formatInTimeZone(new Date(period.start_date), clinicTimezone, 'dd/MM/yyyy')} −{' '}
                          {formatInTimeZone(new Date(period.end_date), clinicTimezone, 'dd/MM/yyyy')}
                        </p>
                        {!period.is_all_day && period.start_time && (
                          <p className="text-xs text-slate-500 mt-1">
                            {period.start_time} − {period.end_time}
                          </p>
                        )}
                        {period.notes && (
                          <p className="text-xs text-slate-500 mt-2 italic">📝 {period.notes}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteUnavailable(period.id)}
                      disabled={isSaving}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      <MdDelete className="text-lg" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CAPACITIES TAB */}
        {activeTab === 'capacities' && (
          <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Capacidades Especiales</h3>
                <p className="text-sm text-slate-500 mt-1">Límites de citas para fechas específicas</p>
              </div>
              <button
                onClick={() => setShowAddCapacity(!showAddCapacity)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:shadow-lg transform hover:scale-105 transition-all font-semibold text-sm"
              >
                <MdAdd className="text-lg" /> Agregar
              </button>
            </div>

            {/* Add Capacity Form */}
            {showAddCapacity && (
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-5 rounded-xl border-2 border-emerald-200 space-y-4">
                <h4 className="font-semibold text-emerald-900">Nueva Capacidad</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Fecha
                    </label>
                    <input
                      type="date"
                      value={capacityForm.date}
                      onChange={(e) =>
                        setCapacityForm({
                          ...capacityForm,
                          date: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Máx. Citas
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={capacityForm.max_appointments}
                      onChange={(e) =>
                        setCapacityForm({
                          ...capacityForm,
                          max_appointments: parseInt(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Notas (Opcional)
                  </label>
                  <textarea
                    value={capacityForm.notes}
                    onChange={(e) =>
                      setCapacityForm({
                        ...capacityForm,
                        notes: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    rows={2}
                    placeholder="Ej: Personal reducido, mantenimiento"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleAddCapacity}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:shadow-lg font-semibold disabled:opacity-50 transition-all"
                  >
                    <MdCheckCircle /> Guardar
                  </button>
                  <button
                    onClick={() => setShowAddCapacity(false)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-400 text-white rounded-lg hover:bg-slate-500 font-semibold transition-all"
                  >
                    <MdCancel /> Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Capacities List */}
            {capacities.length === 0 ? (
              <div className="text-center py-12">
                <MdPeopleAlt className="text-4xl text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No hay capacidades especiales</p>
                <p className="text-sm text-slate-400 mt-1">Define límites específicos para fechas especiales</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {capacities.map((capacity) => (
                  <div
                    key={capacity.id}
                    className="flex justify-between items-center p-4 bg-white border border-slate-200 rounded-lg hover:shadow-md hover:border-emerald-300 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                        <MdPeopleAlt className="text-lg" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">
                          {formatInTimeZone(new Date(capacity.date), clinicTimezone, 'dd/MM/yyyy')}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-sm text-slate-600">
                            Máx. citas: <span className="font-semibold text-emerald-600">{capacity.max_appointments}</span>
                          </span>
                          {capacity.notes && (
                            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                              {capacity.notes}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteCapacity(capacity.id)}
                      disabled={isSaving}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      <MdDelete className="text-lg" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
