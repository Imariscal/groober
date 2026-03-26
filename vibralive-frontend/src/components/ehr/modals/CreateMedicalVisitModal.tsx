'use client';

import { useState } from 'react';
import { MdClose, MdAdd } from 'react-icons/md';
import { CreateMedicalVisitDto, ReasonForVisit } from '@/types/ehr';
import { ehrApi } from '@/api/ehr-api';
import { toast } from 'react-hot-toast';

interface CreateMedicalVisitModalProps {
  isOpen: boolean;
  petId: string;
  appointmentId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateMedicalVisitModal({
  isOpen,
  petId,
  appointmentId,
  onClose,
  onSuccess,
}: CreateMedicalVisitModalProps) {
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [visitId, setVisitId] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const [formData, setFormData] = useState<CreateMedicalVisitDto>({
    reasonForVisit: 'CHECKUP',
    chiefComplaint: '',
    weight: 0,
    temperature: 37,
    heartRate: 0,
    respiratoryRate: 0,
    bloodPressure: '',
    bodyConditionScore: 5,
    coatCondition: '',
    generalNotes: '',
    preliminaryDiagnosis: '',
    treatmentPlan: '',
    followUpRequired: false,
    petId,
    appointmentId,
  });

  const handleChange = (field: keyof CreateMedicalVisitDto, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.reasonForVisit) newErrors.reasonForVisit = 'Requerido';
    if (!formData.chiefComplaint.trim()) newErrors.chiefComplaint = 'Requerido';
    if (!formData.weight || formData.weight <= 0) newErrors.weight = 'Debe ser > 0';
    if (!formData.temperature || formData.temperature < 35 || formData.temperature > 42) {
      newErrors.temperature = 'Rango: 35-42°C';
    }
    if (!formData.heartRate || formData.heartRate < 40 || formData.heartRate > 300) {
      newErrors.heartRate = 'Rango: 40-300 bpm';
    }
    if (!formData.respiratoryRate || formData.respiratoryRate < 5 || formData.respiratoryRate > 100) {
      newErrors.respiratoryRate = 'Rango: 5-100 rpm';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Por favor corrige los errores');
      return;
    }

    try {
      setLoading(true);
      
      // Si está en modo edición, actualizar
      if (isEditMode && visitId) {
        await ehrApi.updateMedicalVisit(visitId, formData);
        toast.success('Visita médica actualizada');
        onSuccess();
        onClose();
        return;
      }
      
      // Si es creación, crear nueva visita
      const response = await ehrApi.createMedicalVisit(formData);
      toast.success('Visita médica creada');
      
      // 🎯 En lugar de cerrar, cambiar a modo edición
      setVisitId(response.id);
      setIsEditMode(true);
      
      // No llamar onSuccess ni onClose para mantener el modal abierto
    } catch (err: any) {
      console.error('Error saving medical visit:', err);
      toast.error(err?.message || 'Error al guardar visita');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const reasonOptions: { value: ReasonForVisit; label: string }[] = [
    { value: 'CHECKUP', label: '🔍 Revisión General' },
    { value: 'VACCINATION', label: '💉 Vacunación' },
    { value: 'DIAGNOSIS', label: '🩺 Diagnóstico' },
    { value: 'FOLLOW_UP', label: '⏰ Seguimiento' },
    { value: 'OTHER', label: '📋 Otra' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {isEditMode ? 'Editar Visita Médica' : 'Nueva Visita Médica'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-primary-600 rounded transition"
          >
            <MdClose size={24} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Información Básica */}
          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Información Básica</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tipo de Visita *
                </label>
                <select
                  value={formData.reasonForVisit}
                  onChange={(e) =>
                    handleChange('reasonForVisit', e.target.value as ReasonForVisit)
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {reasonOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {errors.reasonForVisit && (
                  <p className="text-xs text-red-500 mt-1">{errors.reasonForVisit}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Motivo Principal *
                </label>
                <input
                  type="text"
                  value={formData.chiefComplaint}
                  onChange={(e) => handleChange('chiefComplaint', e.target.value)}
                  placeholder="Ej: Revisión rutinaria"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {errors.chiefComplaint && (
                  <p className="text-xs text-red-500 mt-1">{errors.chiefComplaint}</p>
                )}
              </div>
            </div>
          </section>

          {/* Signos Vitales */}
          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Signos Vitales</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Peso (kg) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.weight || ''}
                  onChange={(e) => handleChange('weight', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {errors.weight && <p className="text-xs text-red-500 mt-1">{errors.weight}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Temperatura (°C) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.temperature || ''}
                  onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {errors.temperature && (
                  <p className="text-xs text-red-500 mt-1">{errors.temperature}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Freq. Cardíaca (bpm) *
                </label>
                <input
                  type="number"
                  value={formData.heartRate || ''}
                  onChange={(e) => handleChange('heartRate', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {errors.heartRate && (
                  <p className="text-xs text-red-500 mt-1">{errors.heartRate}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Freq. Respiratoria (rpm) *
                </label>
                <input
                  type="number"
                  value={formData.respiratoryRate || ''}
                  onChange={(e) => handleChange('respiratoryRate', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {errors.respiratoryRate && (
                  <p className="text-xs text-red-500 mt-1">{errors.respiratoryRate}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Presión Arterial
                </label>
                <input
                  type="text"
                  placeholder="Ej: 120/80"
                  value={formData.bloodPressure || ''}
                  onChange={(e) => handleChange('bloodPressure', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  BCS (1-9)
                </label>
                <input
                  type="number"
                  min="1"
                  max="9"
                  value={formData.bodyConditionScore || ''}
                  onChange={(e) => handleChange('bodyConditionScore', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </section>

          {/* Notas Clínicas */}
          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Notas Clínicas</h3>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Hallazgos del Examen
              </label>
              <textarea
                rows={3}
                value={formData.generalNotes || ''}
                onChange={(e) => handleChange('generalNotes', e.target.value)}
                placeholder="Describe los hallazgos..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Diagnóstico Preliminar
              </label>
              <textarea
                rows={3}
                value={formData.preliminaryDiagnosis || ''}
                onChange={(e) => handleChange('preliminaryDiagnosis', e.target.value)}
                placeholder="Diagnóstico preliminar..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Plan de Tratamiento
              </label>
              <textarea
                rows={3}
                value={formData.treatmentPlan || ''}
                onChange={(e) => handleChange('treatmentPlan', e.target.value)}
                placeholder="Plan de tratamiento..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </section>

          {/* Seguimiento */}
          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Seguimiento</h3>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.followUpRequired || false}
                onChange={(e) => handleChange('followUpRequired', e.target.checked)}
                className="w-4 h-4 rounded border-slate-300"
              />
              <span className="text-sm font-medium text-slate-700">
                Requiere seguimiento
              </span>
            </label>

            {formData.followUpRequired && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Fecha de Seguimiento
                </label>
                <input
                  type="date"
                  onChange={(e) => handleChange('followUpDate', new Date(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            )}
          </section>

          {/* Actions */}
          <div className="flex gap-3 pt-6 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition font-medium"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={loading}
            >
              <MdAdd size={20} />
              {loading ? (isEditMode ? 'Actualizando...' : 'Guardando...') : (isEditMode ? 'Actualizar Visita' : 'Guardar Visita')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
