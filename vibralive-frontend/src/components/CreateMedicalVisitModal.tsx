'use client';

import React, { useState, useEffect } from 'react';
import {
  MdClose,
  MdMedicalInformation,
  MdNotes,
  MdThermostat,
  MdFavoriteBorder,
  MdSpeed,
  MdBloodtype,
} from 'react-icons/md';
import { MedicalVisit, ReasonForVisit, CreateMedicalVisitDto } from '@/types/ehr';
import { useEhrStore } from '@/store/ehr-store';
import { useAuthStore } from '@/store/auth-store';
import { formatInClinicTz } from '@/lib/datetime-tz';
import { formatISO } from 'date-fns';
import toast from 'react-hot-toast';

interface CreateMedicalVisitModalProps {
  isOpen: boolean;
  petId: string;
  appointmentId?: string;
  onClose: () => void;
  onSuccess?: (visit?: MedicalVisit) => void;
}

interface FormErrors {
  visit_type?: string;
  chief_complaint?: string;
  visit_date?: string;
  weight?: string;
  temperature?: string;
  heart_rate?: string;
  respiratory_rate?: string;
}

interface FormTouched {
  visit_type: boolean;
  chief_complaint: boolean;
  visit_date: boolean;
  weight: boolean;
  temperature: boolean;
  heart_rate: boolean;
}

/**
 * CreateMedicalVisitModal
 * Modal para crear nuevas visitas médicas
 * Patrón: Basado en ClientFormModal para consistencia
 * 
 * Sigue HOMOLOGACION_VISTAS_STANDAR.md:
 * - Modal header con gradiente primary
 * - Form sections con bg-slate-50
 * - Validación visible inline
 * - Buttons: Cancel (slate-200), Submit (primary-600)
 */
export function CreateMedicalVisitModal({
  isOpen,
  petId,
  appointmentId,
  onClose,
  onSuccess,
}: CreateMedicalVisitModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [visitId, setVisitId] = useState<string | null>(null);
  const { user } = useAuthStore();
  const { createMedicalVisit, updateMedicalVisit } = useEhrStore();

  // Form data
  const [formData, setFormData] = useState({
    visit_type: 'CHECKUP' as ReasonForVisit,
    chief_complaint: '',
    visit_date: formatISO(new Date()).split('T')[0],
    visit_time: formatInClinicTz(new Date(), 'HH:mm'),
    weight: '',
    temperature: '',
    heart_rate: '',
    respiratory_rate: '',
    blood_pressure: '',
    general_observations: '',
    preliminary_diagnosis: '',
    final_diagnosis: '',
    treatment_plan: '',
    prognosis: '',
    notes: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<FormTouched>({
    visit_type: false,
    chief_complaint: false,
    visit_date: false,
    weight: false,
    temperature: false,
    heart_rate: false,
  });

  // Validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.visit_type) {
      newErrors.visit_type = 'Tipo de visita es requerido';
    }

    if (!formData.chief_complaint.trim()) {
      newErrors.chief_complaint = 'Motivo de la consulta es requerido';
    }

    if (!formData.visit_date) {
      newErrors.visit_date = 'Fecha de visita es requerida';
    }

    if (formData.weight && (isNaN(Number(formData.weight)) || Number(formData.weight) <= 0)) {
      newErrors.weight = 'Peso debe ser un número válido';
    }

    if (
      formData.temperature &&
      (isNaN(Number(formData.temperature)) || Number(formData.temperature) < 35 || Number(formData.temperature) > 42)
    ) {
      newErrors.temperature = 'Temperatura debe estar entre 35°C y 42°C';
    }

    if (formData.heart_rate && (isNaN(Number(formData.heart_rate)) || Number(formData.heart_rate) <= 0)) {
      newErrors.heart_rate = 'Frecuencia cardíaca debe ser un número válido';
    }

    if (
      formData.respiratory_rate &&
      (isNaN(Number(formData.respiratory_rate)) || Number(formData.respiratory_rate) <= 0)
    ) {
      newErrors.respiratory_rate = 'Frecuencia respiratoria debe ser un número válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handlers
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleBlur = (field: keyof FormTouched) => {
    setTouched((prev) => ({
      ...prev,
      [field]: true,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Por favor, revisa los errores del formulario');
      return;
    }

    setIsLoading(true);
    try {
      // Combine date and time
      const dateTime = new Date(`${formData.visit_date}T${formData.visit_time}`);

      // Si estamos en modo edición, actualizar
      if (isEditMode && visitId) {
        const payload = {
          visit_type: formData.visit_type,
          chief_complaint: formData.chief_complaint.trim(),
          visit_date: dateTime,
          vital_signs: {
            body_temperature: formData.temperature ? Number(formData.temperature) : undefined,
            heart_rate: formData.heart_rate ? Number(formData.heart_rate) : undefined,
            respiratory_rate: formData.respiratory_rate ? Number(formData.respiratory_rate) : undefined,
            blood_pressure: formData.blood_pressure || undefined,
            weight: formData.weight ? Number(formData.weight) : undefined,
          },
          general_observations: formData.general_observations.trim() || undefined,
          notes: formData.notes.trim() || undefined,
        };

        await updateMedicalVisit(visitId, payload);
        toast.success('Registro médico actualizado exitosamente');
        onSuccess?.();
        return;
      }

      // Si es creación, crear nueva visita
      const payload: CreateMedicalVisitDto = {
        pet_id: petId,
        appointment_id: appointmentId,
        visit_type: formData.visit_type,
        chief_complaint: formData.chief_complaint.trim(),
        visit_date: dateTime,
        vital_signs: {
          body_temperature: formData.temperature ? Number(formData.temperature) : undefined,
          heart_rate: formData.heart_rate ? Number(formData.heart_rate) : undefined,
          respiratory_rate: formData.respiratory_rate ? Number(formData.respiratory_rate) : undefined,
          blood_pressure: formData.blood_pressure || undefined,
          weight: formData.weight ? Number(formData.weight) : undefined,
        },
        general_observations: formData.general_observations.trim() || undefined,
        preliminary_diagnosis: formData.preliminary_diagnosis.trim() || undefined,
        final_diagnosis: formData.final_diagnosis.trim() || undefined,
        treatment_plan: formData.treatment_plan.trim() || undefined,
        prognosis: formData.prognosis.trim() || undefined,
        notes: formData.notes.trim() || undefined,
      };

      const visit = await createMedicalVisit(payload);
      toast.success('Registro médico creado exitosamente');
      
      // 🎯 En lugar de cerrar, cambiar a modo edición
      setVisitId(visit.id);
      setIsEditMode(true);
      
      // Opcionalmente notificar al padre (pero no cerrar)
      // onSuccess?.(visit);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al guardar el registro médico';
      toast.error(message);
      console.error('Error creating/updating medical visit:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const sectionClasses = 'bg-slate-50 rounded-lg p-4 space-y-3';
  const labelClasses = 'block text-sm font-medium text-gray-700 mb-1';
  const inputClasses =
    'w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition disabled:bg-gray-100 disabled:cursor-not-allowed';
  const errorClasses = 'text-red-600 text-xs mt-1';

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full flex flex-col max-h-[90vh]">
          {/* Header - Gradient per HOMOLOGACION_VISTAS_STANDAR */}
          <div className="flex justify-between items-center px-6 py-4 border-b border-primary-600 bg-gradient-to-r from-primary-600 via-primary-600 to-primary-700">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary-100 rounded-lg">
                <MdMedicalInformation size={24} className="text-primary-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  {isEditMode ? 'Editar Visita Médica' : 'Nueva Visita Médica'}
                </h2>
                <p className="text-primary-100 text-sm mt-0.5">
                  {isEditMode ? 'Actualiza los detalles de la consulta' : 'Registra los detalles de la consulta'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="p-1 text-white hover:bg-white hover:bg-opacity-20 rounded transition disabled:opacity-50"
            >
              <MdClose size={24} />
            </button>
          </div>

          {/* Content - Scrollable */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Section: Información Básica */}
            <div className={sectionClasses}>
              <h3 className="font-semibold text-gray-900 mb-4">Información Básica</h3>

              {/* Tipo de Visita */}
              <div>
                <label htmlFor="visit_type" className={labelClasses}>
                  Tipo de Visita <span className="text-red-500">*</span>
                </label>
                <select
                  id="visit_type"
                  name="visit_type"
                  value={formData.visit_type}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur('visit_type')}
                  disabled={isLoading}
                  className={inputClasses}
                >
                  <option value="CHECKUP">Revisión General</option>
                  <option value="VACCINATION">Vacunación</option>
                  <option value="DIAGNOSIS">Diagnóstico</option>
                  <option value="FOLLOW_UP">Seguimiento</option>
                  <option value="OTHER">Otro</option>
                </select>
                {touched.visit_type && errors.visit_type && <p className={errorClasses}>{errors.visit_type}</p>}
              </div>

              {/* Motivo de Consulta */}
              <div>
                <label htmlFor="chief_complaint" className={labelClasses}>
                  Motivo de Consulta <span className="text-red-500">*</span>
                </label>
                <input
                  id="chief_complaint"
                  name="chief_complaint"
                  type="text"
                  value={formData.chief_complaint}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur('chief_complaint')}
                  placeholder="Ej: Dolor abdominal, vómitos..."
                  disabled={isLoading}
                  className={inputClasses}
                />
                {touched.chief_complaint && errors.chief_complaint && (
                  <p className={errorClasses}>{errors.chief_complaint}</p>
                )}
              </div>

              {/* Fecha y Hora */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="visit_date" className={labelClasses}>
                    Fecha <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="visit_date"
                    name="visit_date"
                    type="date"
                    value={formData.visit_date}
                    onChange={handleInputChange}
                    onBlur={() => handleBlur('visit_date')}
                    disabled={isLoading}
                    className={inputClasses}
                  />
                  {touched.visit_date && errors.visit_date && <p className={errorClasses}>{errors.visit_date}</p>}
                </div>
                <div>
                  <label htmlFor="visit_time" className={labelClasses}>
                    Hora
                  </label>
                  <input
                    id="visit_time"
                    name="visit_time"
                    type="time"
                    value={formData.visit_time}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    className={inputClasses}
                  />
                </div>
              </div>
            </div>

            {/* Section: Signos Vitales */}
            <div className={sectionClasses}>
              <h3 className="font-semibold text-gray-900 mb-4">Signos Vitales</h3>

              {/* Weight */}
              <div>
                <label htmlFor="weight" className={labelClasses}>
                  Peso (kg)
                </label>
                <input
                  id="weight"
                  name="weight"
                  type="number"
                  step="0.1"
                  value={formData.weight}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur('weight')}
                  placeholder="Ej: 25.5"
                  disabled={isLoading}
                  className={inputClasses}
                />
                {touched.weight && errors.weight && <p className={errorClasses}>{errors.weight}</p>}
              </div>

              {/* Vital Signs Grid */}
              <div className="grid grid-cols-3 gap-3">
                {/* Temperature */}
                <div>
                  <label htmlFor="temperature" className={`${labelClasses} flex items-center gap-2`}>
                    <MdThermostat size={16} className="text-orange-500" />
                    Temp (°C)
                  </label>
                  <input
                    id="temperature"
                    name="temperature"
                    type="number"
                    step="0.1"
                    min="35"
                    max="42"
                    value={formData.temperature}
                    onChange={handleInputChange}
                    onBlur={() => handleBlur('temperature')}
                    placeholder="37.5"
                    disabled={isLoading}
                    className={inputClasses}
                  />
                  {touched.temperature && errors.temperature && (
                    <p className={errorClasses}>{errors.temperature}</p>
                  )}
                </div>

                {/* Heart Rate */}
                <div>
                  <label htmlFor="heart_rate" className={`${labelClasses} flex items-center gap-2`}>
                    <MdFavoriteBorder size={16} className="text-red-500" />
                    FC (bpm)
                  </label>
                  <input
                    id="heart_rate"
                    name="heart_rate"
                    type="number"
                    value={formData.heart_rate}
                    onChange={handleInputChange}
                    onBlur={() => handleBlur('heart_rate')}
                    placeholder="80"
                    disabled={isLoading}
                    className={inputClasses}
                  />
                  {touched.heart_rate && errors.heart_rate && (
                    <p className={errorClasses}>{errors.heart_rate}</p>
                  )}
                </div>

                {/* Respiratory Rate */}
                <div>
                  <label htmlFor="respiratory_rate" className={`${labelClasses} flex items-center gap-2`}>
                    <MdSpeed size={16} className="text-blue-500" />
                    FR (rpm)
                  </label>
                  <input
                    id="respiratory_rate"
                    name="respiratory_rate"
                    type="number"
                    value={formData.respiratory_rate}
                    onChange={handleInputChange}
                    onBlur={() => handleBlur('respiratory_rate')}
                    placeholder="20"
                    disabled={isLoading}
                    className={inputClasses}
                  />
                </div>
              </div>

              {/* Blood Pressure */}
              <div>
                <label htmlFor="blood_pressure" className={`${labelClasses} flex items-center gap-2`}>
                  <MdBloodtype size={16} className="text-purple-500" />
                  Presión Arterial (mmHg)
                </label>
                <input
                  id="blood_pressure"
                  name="blood_pressure"
                  type="text"
                  value={formData.blood_pressure}
                  onChange={handleInputChange}
                  placeholder="120/80"
                  disabled={isLoading}
                  className={inputClasses}
                />
              </div>
            </div>

            {/* Section: Notas Clínicas */}
            <div className={sectionClasses}>
              <h3 className="font-semibold text-gray-900 mb-4">Notas Clínicas</h3>

              {/* General Observations */}
              <div>
                <label htmlFor="general_observations" className={`${labelClasses} flex items-center gap-2`}>
                  <MdNotes size={16} className="text-blue-600" />
                  Observaciones Generales
                </label>
                <textarea
                  id="general_observations"
                  name="general_observations"
                  value={formData.general_observations}
                  onChange={handleInputChange}
                  placeholder="Comportamiento, apariencia, estado general..."
                  rows={3}
                  disabled={isLoading}
                  className={`${inputClasses} resize-none`}
                />
              </div>

              {/* Preliminary Diagnosis */}
              <div>
                <label htmlFor="preliminary_diagnosis" className={labelClasses}>
                  Diagnóstico Preliminar
                </label>
                <textarea
                  id="preliminary_diagnosis"
                  name="preliminary_diagnosis"
                  value={formData.preliminary_diagnosis}
                  onChange={handleInputChange}
                  placeholder="Impresión clínica inicial..."
                  rows={3}
                  disabled={isLoading}
                  className={`${inputClasses} resize-none`}
                />
              </div>

              {/* Final Diagnosis */}
              <div>
                <label htmlFor="final_diagnosis" className={labelClasses}>
                  Diagnóstico Final
                </label>
                <textarea
                  id="final_diagnosis"
                  name="final_diagnosis"
                  value={formData.final_diagnosis}
                  onChange={handleInputChange}
                  placeholder="Diagnóstico confirmado después de exámenes..."
                  rows={3}
                  disabled={isLoading}
                  className={`${inputClasses} resize-none`}
                />
              </div>

              {/* Treatment Plan */}
              <div>
                <label htmlFor="treatment_plan" className={labelClasses}>
                  Plan de Tratamiento
                </label>
                <textarea
                  id="treatment_plan"
                  name="treatment_plan"
                  value={formData.treatment_plan}
                  onChange={handleInputChange}
                  placeholder="Medicamentos, terapias, recomendaciones..."
                  rows={3}
                  disabled={isLoading}
                  className={`${inputClasses} resize-none`}
                />
              </div>

              {/* Prognosis */}
              <div>
                <label htmlFor="prognosis" className={labelClasses}>
                  Pronóstico
                </label>
                <textarea
                  id="prognosis"
                  name="prognosis"
                  value={formData.prognosis}
                  onChange={handleInputChange}
                  placeholder="Evaluación del futuro curso de la enfermedad..."
                  rows={3}
                  disabled={isLoading}
                  className={`${inputClasses} resize-none`}
                />
              </div>

              {/* Additional Notes */}
              <div>
                <label htmlFor="notes" className={`${labelClasses} flex items-center gap-2`}>
                  <MdNotes size={16} className="text-green-600" />
                  Notas Adicionales
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Información adicional, seguimiento recomendado..."
                  rows={3}
                  disabled={isLoading}
                  className={`${inputClasses} resize-none`}
                />
              </div>
            </div>
          </form>

          {/* Buttons - Sticky Footer per HOMOLOGACION_VISTAS_STANDAR */}
          <div className="sticky bottom-0 flex gap-3 justify-end px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-6 py-2.5 text-white bg-slate-600 hover:bg-slate-700 rounded-lg font-medium transition disabled:opacity-50"
            >
              Cerrar
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-6 py-2.5 text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 hover:shadow-lg rounded-lg font-medium transition disabled:opacity-50"
            >
              {isLoading ? (isEditMode ? 'Actualizando...' : 'Guardando...') : (isEditMode ? 'Actualizar Visita' : 'Guardar Visita')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
