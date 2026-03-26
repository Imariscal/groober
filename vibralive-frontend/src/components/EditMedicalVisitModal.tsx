'use client';

import React, { useState } from 'react';
import { MdClose } from 'react-icons/md';
import { MedicalVisit, CreateMedicalVisitDto } from '@/types/ehr';
import { ehrApi } from '@/api/ehr-api';
import { toast } from 'react-hot-toast';

interface EditMedicalVisitModalProps {
  isOpen: boolean;
  visit: MedicalVisit;
  appointmentId?: string;
  petId?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * EditMedicalVisitModal
 * Modal para editar visitas médicas existentes
 * Reutiliza los mismos campos y validaciones que MedicalVisitDetailView
 */
export function EditMedicalVisitModal({
  isOpen,
  visit,
  appointmentId,
  petId,
  onClose,
  onSuccess,
}: EditMedicalVisitModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState<CreateMedicalVisitDto>({
    visitType: (visit.reasonForVisit as any) || 'CHECKUP',
    chiefComplaint: visit.chiefComplaint || '',
    weight: visit.weight,
    temperature: visit.temperature,
    heartRate: visit.heartRate,
    respiratoryRate: visit.respiratoryRate,
    bloodPressure: visit.bloodPressure,
    bodyConditionScore: visit.bodyConditionScore || 5,
    coatCondition: visit.coatCondition,
    generalNotes: visit.generalNotes || '',
    preliminaryDiagnosis: visit.preliminaryDiagnosis || '',
    finalDiagnosis: visit.finalDiagnosis || '',
    treatmentPlan: visit.treatmentPlan || '',
    prognosis: visit.prognosis || '',
    followUpRequired: visit.followUpRequired || false,
    reasonForVisit: visit.reasonForVisit,
    petId: petId || '',
    appointmentId: appointmentId || '',
  });

  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!formData.visitType) {
      errors.visitType = 'Tipo de visita es requerido';
    }

    if (!formData.chiefComplaint?.trim()) {
      errors.chiefComplaint = 'Motivo principal es requerido';
    }

    if (!formData.weight || formData.weight <= 0) {
      errors.weight = 'Peso debe ser mayor a 0';
    }

    if (!formData.temperature || formData.temperature <= 0) {
      errors.temperature = 'Temperatura es requerida';
    }

    if (!formData.heartRate || formData.heartRate <= 0) {
      errors.heartRate = 'Frecuencia cardíaca es requerida';
    }

    if (!formData.respiratoryRate || formData.respiratoryRate <= 0) {
      errors.respiratoryRate = 'Frecuencia respiratoria es requerida';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormChange = (field: keyof CreateMedicalVisitDto, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Por favor corrige los errores');
      return;
    }

    try {
      setIsLoading(true);

      const payload: CreateMedicalVisitDto = {
        visitType: formData.visitType,
        petId: formData.petId,
        appointmentId: formData.appointmentId,
        reasonForVisit: formData.reasonForVisit && formData.reasonForVisit.trim() ? formData.reasonForVisit : undefined,
        chiefComplaint: formData.chiefComplaint && formData.chiefComplaint.trim() ? formData.chiefComplaint : undefined,
        weight: formData.weight && formData.weight > 0 ? formData.weight : undefined,
        temperature: formData.temperature && formData.temperature > 0 ? formData.temperature : undefined,
        heartRate: formData.heartRate && formData.heartRate > 0 ? formData.heartRate : undefined,
        respiratoryRate: formData.respiratoryRate && formData.respiratoryRate > 0 ? formData.respiratoryRate : undefined,
        bloodPressure: formData.bloodPressure && typeof formData.bloodPressure === 'string' && formData.bloodPressure.trim() ? formData.bloodPressure : undefined,
        bodyConditionScore: formData.bodyConditionScore,
        coatCondition: formData.coatCondition && typeof formData.coatCondition === 'string' && formData.coatCondition.trim() ? formData.coatCondition : undefined,
        generalNotes: formData.generalNotes && formData.generalNotes.trim() ? formData.generalNotes : undefined,
        preliminaryDiagnosis: formData.preliminaryDiagnosis && formData.preliminaryDiagnosis.trim() ? formData.preliminaryDiagnosis : undefined,
        finalDiagnosis: formData.finalDiagnosis && formData.finalDiagnosis.trim() ? formData.finalDiagnosis : undefined,
        treatmentPlan: formData.treatmentPlan && formData.treatmentPlan.trim() ? formData.treatmentPlan : undefined,
        prognosis: formData.prognosis && formData.prognosis.trim() ? formData.prognosis : undefined,
        followUpRequired: formData.followUpRequired,
      };

      await ehrApi.updateMedicalVisit(visit.id, payload);
      toast.success('Visita médica actualizada exitosamente');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error('Error updating medical visit:', err);
      toast.error(err?.message || 'Error al actualizar visita');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-primary-600 to-primary-700">
            <h2 className="text-lg font-bold text-white">Editar Visita Médica</h2>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="text-white hover:bg-white/20 p-1 rounded transition disabled:opacity-50"
            >
              <MdClose size={24} />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Información Básica */}
            <section className="space-y-3">
              <label className="block text-sm font-semibold text-slate-700 uppercase tracking-wide">Tipo de Visita</label>
              <select
                value={formData.visitType}
                onChange={(e) => handleFormChange('visitType', e.target.value)}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm disabled:bg-slate-100"
              >
                <option value="CHECKUP">🔍 Revisión General</option>
                <option value="VACCINATION">💉 Vacunación</option>
                <option value="SURGERY">🏥 Cirugía</option>
                <option value="CONSULTATION">🩺 Consulta</option>
                <option value="FOLLOWUP">⏰ Seguimiento</option>
                <option value="EMERGENCY">🚨 Emergencia</option>
              </select>
              {formErrors.visitType && <p className="text-xs text-red-500">{formErrors.visitType}</p>}
            </section>

            <section className="space-y-3">
              <label className="block text-sm font-semibold text-slate-700 uppercase tracking-wide">Motivo Principal</label>
              <input
                type="text"
                value={formData.chiefComplaint || ''}
                onChange={(e) => handleFormChange('chiefComplaint', e.target.value)}
                placeholder="Ej: Revisión rutinaria"
                disabled={isLoading}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm disabled:bg-slate-100"
              />
              {formErrors.chiefComplaint && <p className="text-xs text-red-500">{formErrors.chiefComplaint}</p>}
            </section>

            {/* Signos Vitales */}
            <section className="space-y-3 pt-3 border-t border-slate-200">
              <label className="block text-sm font-semibold text-slate-700 uppercase tracking-wide">Signos Vitales & Condición</label>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Peso (kg) *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.weight || ''}
                    onChange={(e) => handleFormChange('weight', parseFloat(e.target.value) || 0)}
                    disabled={isLoading}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm disabled:bg-slate-100"
                  />
                  {formErrors.weight && <p className="text-xs text-red-500">{formErrors.weight}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Temperatura (°C) *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.temperature || ''}
                    onChange={(e) => handleFormChange('temperature', parseFloat(e.target.value) || 37)}
                    disabled={isLoading}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm disabled:bg-slate-100"
                  />
                  {formErrors.temperature && <p className="text-xs text-red-500">{formErrors.temperature}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Frec. Cardíaca (bpm) *</label>
                  <input
                    type="number"
                    value={formData.heartRate || ''}
                    onChange={(e) => handleFormChange('heartRate', parseInt(e.target.value) || 0)}
                    disabled={isLoading}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm disabled:bg-slate-100"
                  />
                  {formErrors.heartRate && <p className="text-xs text-red-500">{formErrors.heartRate}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Frec. Respiratoria (rpm) *</label>
                  <input
                    type="number"
                    value={formData.respiratoryRate || ''}
                    onChange={(e) => handleFormChange('respiratoryRate', parseInt(e.target.value) || 0)}
                    disabled={isLoading}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm disabled:bg-slate-100"
                  />
                  {formErrors.respiratoryRate && <p className="text-xs text-red-500">{formErrors.respiratoryRate}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Presión Arterial</label>
                  <input
                    type="text"
                    placeholder="Ej: 120/80"
                    value={formData.bloodPressure || ''}
                    onChange={(e) => handleFormChange('bloodPressure', e.target.value)}
                    disabled={isLoading}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Body Condition (1-9)</label>
                  <input
                    type="number"
                    min="1"
                    max="9"
                    value={formData.bodyConditionScore || 5}
                    onChange={(e) => handleFormChange('bodyConditionScore', parseInt(e.target.value) || 5)}
                    disabled={isLoading}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm disabled:bg-slate-100"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Estado del Pelaje</label>
                  <input
                    type="text"
                    placeholder="Ej: Brillante, sin irritaciones"
                    value={formData.coatCondition || ''}
                    onChange={(e) => handleFormChange('coatCondition', e.target.value)}
                    disabled={isLoading}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm disabled:bg-slate-100"
                  />
                </div>
              </div>
            </section>

            {/* Notas Clínicas */}
            <section className="space-y-3 pt-3 border-t border-slate-200">
              <label className="block text-sm font-semibold text-slate-700 uppercase tracking-wide">Notas Clínicas</label>
              
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Observaciones Generales</label>
                <textarea
                  value={formData.generalNotes || ''}
                  onChange={(e) => handleFormChange('generalNotes', e.target.value)}
                  placeholder="Hallazgos físicos generales..."
                  disabled={isLoading}
                  rows={3}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm resize-none disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Diagnóstico Preliminar</label>
                <textarea
                  value={formData.preliminaryDiagnosis || ''}
                  onChange={(e) => handleFormChange('preliminaryDiagnosis', e.target.value)}
                  placeholder="Impresión clínica inicial..."
                  disabled={isLoading}
                  rows={3}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm resize-none disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Plan de Tratamiento</label>
                <textarea
                  value={formData.treatmentPlan || ''}
                  onChange={(e) => handleFormChange('treatmentPlan', e.target.value)}
                  placeholder="Medicamentos, terapias, recomendaciones..."
                  disabled={isLoading}
                  rows={3}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm resize-none disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Diagnóstico Final</label>
                <textarea
                  value={formData.finalDiagnosis || ''}
                  onChange={(e) => handleFormChange('finalDiagnosis', e.target.value)}
                  placeholder="Diagnóstico confirmado después de exámenes..."
                  disabled={isLoading}
                  rows={3}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm resize-none disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Pronóstico</label>
                <textarea
                  value={formData.prognosis || ''}
                  onChange={(e) => handleFormChange('prognosis', e.target.value)}
                  placeholder="Evaluación del futuro curso de la enfermedad..."
                  disabled={isLoading}
                  rows={3}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm resize-none disabled:bg-slate-100"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="followUpRequired"
                  checked={formData.followUpRequired || false}
                  onChange={(e) => handleFormChange('followUpRequired', e.target.checked)}
                  disabled={isLoading}
                  className="rounded disabled:bg-slate-100"
                />
                <label htmlFor="followUpRequired" className="text-sm text-slate-700">
                  Requiere seguimiento
                </label>
              </div>
            </section>
          </form>

          {/* Footer */}
          <div className="flex gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isLoading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

