'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ClinicConfiguration, BusinessHours } from '@/types';
import { MdSave, MdWarning, MdSchedule, MdAccessTime, MdLocationOn } from 'react-icons/md';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';

// Dynamic import for Google Maps (client-side only)
const LocationPickerMap = dynamic(
  () => import('@/components/maps/GoogleMapComponent'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-64 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex flex-col items-center justify-center text-gray-500 gap-2">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm">Cargando mapa...</span>
      </div>
    ),
  }
);

interface ConfigurationTabProps {
  config: ClinicConfiguration;
  isSaving: boolean;
  onSave: (config: Partial<ClinicConfiguration>) => Promise<void>;
}

const HOURS = Array.from({ length: 15 }, (_, i) => `${String(i + 7).padStart(2, '0')}:00`); // 07:00 - 21:00
const MINUTES = ['00', '15', '30', '45'];

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

const DAYS = [
  { key: 'mon', label: 'Lunes' },
  { key: 'tue', label: 'Martes' },
  { key: 'wed', label: 'Miércoles' },
  { key: 'thu', label: 'Jueves' },
  { key: 'fri', label: 'Viernes' },
  { key: 'sat', label: 'Sábado' },
  { key: 'sun', label: 'Domingo' },
];

export function ConfigurationTab({ config, isSaving, onSave }: ConfigurationTabProps) {
  const [formData, setFormData] = useState<Partial<ClinicConfiguration>>({
    ...config,
    allowAppointmentOverlap: config?.allowAppointmentOverlap ?? false,
    allowMedicalAppointmentOverlap: config?.allowMedicalAppointmentOverlap ?? false,
  });
  const [businessHours, setBusinessHours] = useState<BusinessHours>(config.businessHours || { week: { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] } });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isOpen, setIsOpen] = useState<Record<string, boolean>>({
    mon: config.businessHours?.week?.mon?.length > 0 || false,
    tue: config.businessHours?.week?.tue?.length > 0 || false,
    wed: config.businessHours?.week?.wed?.length > 0 || false,
    thu: config.businessHours?.week?.thu?.length > 0 || false,
    fri: config.businessHours?.week?.fri?.length > 0 || false,
    sat: config.businessHours?.week?.sat?.length > 0 || false,
    sun: config.businessHours?.week?.sun?.length > 0 || false,
  });

  // Sincronizar formData cuando config cambia
  useEffect(() => {
    setFormData({
      ...config,
      allowAppointmentOverlap: config?.allowAppointmentOverlap ?? false,
      allowMedicalAppointmentOverlap: config?.allowMedicalAppointmentOverlap ?? false,
    });
    const bh = config.businessHours || { week: { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] } };
    setBusinessHours(bh);
    setIsOpen({
      mon: bh?.week?.mon?.length > 0 || false,
      tue: bh?.week?.tue?.length > 0 || false,
      wed: bh?.week?.wed?.length > 0 || false,
      thu: bh?.week?.thu?.length > 0 || false,
      fri: bh?.week?.fri?.length > 0 || false,
      sat: bh?.week?.sat?.length > 0 || false,
      sun: bh?.week?.sun?.length > 0 || false,
    });
  }, [config]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let finalValue: any = value;
    
    if (type === 'checkbox') {
      finalValue = (e.target as HTMLInputElement).checked;
      console.log(`[ConfigurationTab] Checkbox ${name} changed to:`, finalValue);
    } else if (type === 'number') {
      finalValue = Number(value);
    }
    
    console.log(`[ConfigurationTab] Setting formData[${name}] =`, finalValue);
    setFormData({ ...formData, [name]: finalValue });
  };

  const handleBusinessHourChange = (
    day: string,
    index: number,
    field: 'start' | 'end',
    value: string,
  ) => {
    const dayKey = day as keyof typeof businessHours.week;
    const updated = { ...businessHours };
    
    // Asegurar que existe la estructura
    if (!updated.week) {
      updated.week = { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] };
    }
    if (!updated.week[dayKey]) {
      updated.week[dayKey] = [];
    }
    if (!updated.week[dayKey][index]) {
      updated.week[dayKey][index] = { start: '09:00', end: '17:00' };
    }
    
    updated.week[dayKey][index][field] = value;
    setBusinessHours(updated);
    
    // Validate the time range
    const slot = updated.week[dayKey][index];
    if (slot.start && slot.end) {
      if (slot.start >= slot.end) {
        setValidationErrors(prev => ({ ...prev, [day]: 'La hora de fin debe ser mayor que la de inicio' }));
      } else {
        setValidationErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[day];
          return newErrors;
        });
      }
    }
  };

  const toggleDayOpen = (day: string) => {
    setIsOpen({ ...isOpen, [day]: !isOpen[day] });
    const dayKey = day as keyof typeof businessHours.week;
    const updated = { ...businessHours };
    
    // Asegurar que existe la estructura
    if (!updated.week) {
      updated.week = { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] };
    }
    
    if (isOpen[day]) {
      updated.week[dayKey] = [];
    } else {
      updated.week[dayKey] = [{ start: '09:00', end: '17:00' }];
    }
    setBusinessHours(updated);
  };

  const handleSave = async () => {
    // Validate all business hours before saving
    const errors: Record<string, string> = {};
    
    for (const { key, label } of DAYS) {
      const dayKey = key as keyof typeof businessHours.week;
      const slots = businessHours?.week?.[dayKey];
      if (slots && slots.length > 0) {
        const slot = slots[0];
        if (slot.start >= slot.end) {
          errors[key] = `${label}: La hora de fin debe ser mayor que la de inicio`;
        }
      }
    }
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast.error('Corrige los horarios inválidos antes de guardar');
      return;
    }
    
    try {
      // Construir payload con todos los campos necesarios
      const payload = {
        timezone: formData.timezone,
        businessHours,
        clinicGroomingCapacity: formData.clinicGroomingCapacity,
        homeGroomingCapacity: formData.homeGroomingCapacity,
        homeTravelBufferMinutes: formData.homeTravelBufferMinutes,
        preventSamePetSameDay: formData.preventSamePetSameDay,
        maxClinicOverlappingAppointments: formData.maxClinicOverlappingAppointments,
        allowAppointmentOverlap: formData.allowAppointmentOverlap,
        clinicMedicalCapacity: formData.clinicMedicalCapacity,
        homeMedicalCapacity: formData.homeMedicalCapacity,
        medicalTravelBufferMinutes: formData.medicalTravelBufferMinutes,
        maxClinicMedicalOverlappingAppointments: formData.maxClinicMedicalOverlappingAppointments,
        allowMedicalAppointmentOverlap: formData.allowMedicalAppointmentOverlap,
        baseLat: formData.baseLat,
        baseLng: formData.baseLng,
      };
      
      console.log('[ConfigurationTab] Saving payload:', payload);
      await onSave(payload);
      toast.success('Configuración guardada');
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar');
    }
  };

  return (
    <div className="space-y-6 bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-2xl">
      {/* Grooming */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center text-white">
            <MdSchedule className="text-lg" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Grooming - Configuración</h3>
            <p className="text-sm text-slate-500">Capacidades y horarios para servicios de grooming</p>
          </div>
        </div>

        {/* Capacidades Grooming */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Capacidad Grooming (Clínica)
            </label>
            <input
              type="number"
              name="clinicGroomingCapacity"
              value={formData.clinicGroomingCapacity ?? 1}
              onChange={handleInputChange}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Capacidad Grooming (Casa)
            </label>
            <input
              type="number"
              name="homeGroomingCapacity"
              value={formData.homeGroomingCapacity ?? 1}
              onChange={handleInputChange}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        {/* Máximo de citas simultáneas en clínica */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Máximo de Citas Simultáneas en Clínica (Grooming)
          </label>
          <input
            type="number"
            name="maxClinicOverlappingAppointments"
            value={formData.maxClinicOverlappingAppointments ?? 5}
            onChange={handleInputChange}
            min="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
          <p className="text-xs text-gray-500 mt-1">Número máximo de grooming que pueden ocurrir al mismo tiempo en la clínica</p>
        </div>

        {/* Buffer de viaje Grooming */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Buffer de Viaje Grooming (minutos)
          </label>
          <input
            type="number"
            name="homeTravelBufferMinutes"
            value={formData.homeTravelBufferMinutes ?? 20}
            onChange={handleInputChange}
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
          <p className="text-xs text-gray-500 mt-1">Tiempo de búfer entre grooming en casa para viaje</p>
        </div>

        {/* Permitir citas simultáneas Grooming */}
        <div className="flex items-center">
          <input
            type="checkbox"
            name="allowAppointmentOverlap"
            checked={formData.allowAppointmentOverlap ?? false}
            onChange={handleInputChange}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label className="ml-2 text-sm text-gray-700">
            Permitir citas simultáneas de grooming en la clínica
          </label>
        </div>
      </div>

      {/* Medical */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center text-white">
            <MdSchedule className="text-lg" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Medical - Configuración</h3>
            <p className="text-sm text-slate-500">Capacidades y horarios para servicios médicos</p>
          </div>
        </div>

        {/* Capacidades Medical */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Capacidad Medical (Clínica)
            </label>
            <input
              type="number"
              name="clinicMedicalCapacity"
              value={formData.clinicMedicalCapacity ?? 1}
              onChange={handleInputChange}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Capacidad Medical (Casa)
            </label>
            <input
              type="number"
              name="homeMedicalCapacity"
              value={formData.homeMedicalCapacity ?? 1}
              onChange={handleInputChange}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        {/* Máximo de citas simultáneas en clínica Medical */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Máximo de Citas Simultáneas en Clínica (Medical)
          </label>
          <input
            type="number"
            name="maxClinicMedicalOverlappingAppointments"
            value={formData.maxClinicMedicalOverlappingAppointments ?? 5}
            onChange={handleInputChange}
            min="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
          <p className="text-xs text-gray-500 mt-1">Número máximo de visitas médicas que pueden ocurrir al mismo tiempo en la clínica</p>
        </div>

        {/* Buffer de viaje Medical */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Buffer de Viaje Medical (minutos)
          </label>
          <input
            type="number"
            name="medicalTravelBufferMinutes"
            value={formData.medicalTravelBufferMinutes ?? 20}
            onChange={handleInputChange}
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
          <p className="text-xs text-gray-500 mt-1">Tiempo de búfer entre visitas médicas en casa para viaje</p>
        </div>

        {/* Permitir citas simultáneas Medical */}
        <div className="flex items-center">
          <input
            type="checkbox"
            name="allowMedicalAppointmentOverlap"
            checked={formData.allowMedicalAppointmentOverlap ?? false}
            onChange={handleInputChange}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label className="ml-2 text-sm text-gray-700">
            Permitir visitas médicas simultáneas en la clínica
          </label>
        </div>
      </div>

      {/* General Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white">
            <MdSchedule className="text-lg" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Configuración General</h3>
            <p className="text-sm text-slate-500">Zona horaria y configuraciones globales</p>
          </div>
        </div>

        {/* Timezone */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Zona Horaria <span className="text-red-500">*</span>
          </label>
          <select
            name="timezone"
            value={formData.timezone || ''}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Selecciona una zona horaria</option>
            <optgroup label="México">
              <option value="America/Mexico_City">Ciudad de México (UTC-6/-5)</option>
              <option value="America/Monterrey">Monterrey (UTC-6/-5)</option>
              <option value="America/Cancun">Cancún (UTC-5)</option>
              <option value="America/Merida">Mérida (UTC-6/-5)</option>
              <option value="America/Chihuahua">Chihuahua (UTC-7/-6)</option>
              <option value="America/Hermosillo">Hermosillo (UTC-7)</option>
              <option value="America/Tijuana">Tijuana (UTC-8/-7)</option>
              <option value="America/Mazatlan">Mazatlán (UTC-7/-6)</option>
            </optgroup>
            <optgroup label="Centroamérica">
              <option value="America/Guatemala">Guatemala (UTC-6)</option>
              <option value="America/El_Salvador">El Salvador (UTC-6)</option>
              <option value="America/Tegucigalpa">Honduras (UTC-6)</option>
              <option value="America/Managua">Nicaragua (UTC-6)</option>
              <option value="America/Costa_Rica">Costa Rica (UTC-6)</option>
              <option value="America/Panama">Panamá (UTC-5)</option>
            </optgroup>
            <optgroup label="Sudamérica">
              <option value="America/Bogota">Colombia (UTC-5)</option>
              <option value="America/Lima">Perú (UTC-5)</option>
              <option value="America/Guayaquil">Ecuador (UTC-5)</option>
              <option value="America/Caracas">Venezuela (UTC-4)</option>
              <option value="America/La_Paz">Bolivia (UTC-4)</option>
              <option value="America/Santiago">Chile (UTC-4/-3)</option>
              <option value="America/Argentina/Buenos_Aires">Argentina (UTC-3)</option>
              <option value="America/Sao_Paulo">Brasil (UTC-3)</option>
              <option value="America/Montevideo">Uruguay (UTC-3)</option>
              <option value="America/Asuncion">Paraguay (UTC-4/-3)</option>
            </optgroup>
            <optgroup label="Estados Unidos">
              <option value="America/New_York">Este - New York (UTC-5/-4)</option>
              <option value="America/Chicago">Central - Chicago (UTC-6/-5)</option>
              <option value="America/Denver">Montaña - Denver (UTC-7/-6)</option>
              <option value="America/Los_Angeles">Pacífico - Los Angeles (UTC-8/-7)</option>
              <option value="America/Phoenix">Arizona (UTC-7)</option>
              <option value="Pacific/Honolulu">Hawái (UTC-10)</option>
              <option value="America/Anchorage">Alaska (UTC-9/-8)</option>
            </optgroup>
            <optgroup label="Europa">
              <option value="Europe/Madrid">España (UTC+1/+2)</option>
              <option value="Europe/London">Reino Unido (UTC+0/+1)</option>
              <option value="Europe/Paris">Francia (UTC+1/+2)</option>
              <option value="Europe/Berlin">Alemania (UTC+1/+2)</option>
              <option value="Europe/Rome">Italia (UTC+1/+2)</option>
              <option value="Europe/Lisbon">Portugal (UTC+0/+1)</option>
            </optgroup>
          </select>
        </div>

        {/* Evitar misma mascota mismo día */}
        <div className="flex items-center">
          <input
            type="checkbox"
            name="preventSamePetSameDay"
            checked={formData.preventSamePetSameDay ?? true}
            onChange={handleInputChange}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label className="ml-2 text-sm text-gray-700">
            Evitar múltiples citas de la misma mascota el mismo día
          </label>
        </div>
      </div>

      {/* Ubicación Base de la Clínica */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-rose-600 rounded-lg flex items-center justify-center text-white">
            <MdLocationOn className="text-lg" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Ubicación Base</h3>
            <p className="text-sm text-slate-500">Define la ubicación de tu clínica para inicializar mapas</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Latitud
            </label>
            <input
              type="number"
              name="baseLat"
              value={formData.baseLat ?? ''}
              onChange={handleInputChange}
              step="0.0000001"
              placeholder="Ej: 25.6866"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Longitud
            </label>
            <input
              type="number"
              name="baseLng"
              value={formData.baseLng ?? ''}
              onChange={handleInputChange}
              step="0.0000001"
              placeholder="Ej: -100.3161"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        <p className="text-xs text-gray-500 mb-4">
          Haz clic en el mapa para seleccionar la ubicación de tu clínica, busca una dirección, o ingresa las coordenadas manualmente.
        </p>

        <div className="rounded-lg overflow-hidden border border-gray-200">
          <LocationPickerMap
            onCoordinatesSelected={(lat, lng) => {
              setFormData({ ...formData, baseLat: lat, baseLng: lng });
            }}
            initialLat={formData.baseLat ?? undefined}
            initialLng={formData.baseLng ?? undefined}
          />
        </div>
        
        {formData.baseLat && formData.baseLng && (
          <p className="text-xs text-green-600 mt-2">
            ✓ Ubicación configurada: {Number(formData.baseLat).toFixed(6)}, {Number(formData.baseLng).toFixed(6)}
          </p>
        )}
      </div>

      {/* Horarios Laborales */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center text-white">
            <MdAccessTime className="text-lg" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Horarios Laborales</h3>
            <p className="text-sm text-slate-500">Define tu jornada de trabajo (7:00 AM - 9:00 PM)</p>
          </div>
        </div>
        <div className="space-y-4">
          {DAYS.map(({ key, label }) => (
            <div key={key} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">{label}</label>
                <button
                  onClick={() => toggleDayOpen(key)}
                  className={`px-3 py-1 text-xs rounded font-medium transition ${
                    isOpen[key]
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {isOpen[key] ? 'Abierto' : 'Cerrado'}
                </button>
              </div>

              {isOpen[key] && (
                <div className="mt-3">
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-600 mb-1">Inicio</label>
                      <select
                        value={businessHours?.week?.[key as any]?.[0]?.start || '09:00'}
                        onChange={(e) =>
                          handleBusinessHourChange(key, 0, 'start', e.target.value)
                        }
                        className={`w-full px-2 py-2 border rounded text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 ${
                          validationErrors[key] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
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
                        value={businessHours?.week?.[key as any]?.[0]?.end || '17:00'}
                        onChange={(e) =>
                          handleBusinessHourChange(key, 0, 'end', e.target.value)
                        }
                        className={`w-full px-2 py-2 border rounded text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 ${
                          validationErrors[key] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                      >
                        {TIME_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {validationErrors[key] && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <MdWarning className="w-3 h-3" />
                      {validationErrors[key]}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-sky-500 to-sky-600 text-white rounded-lg hover:shadow-lg disabled:opacity-50 transition-all font-semibold"
        >
          <MdSave className="w-5 h-5" />
          {isSaving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  );
}
