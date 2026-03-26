'use client';

import { useState } from 'react';
import { MdClose, MdAdd } from 'react-icons/md';
import { RecordAllergyDto, AllergySeverity } from '@/types/ehr';
import { ehrApi } from '@/api/ehr-api';
import { toast } from 'react-hot-toast';

interface RecordAllergyModalProps {
  isOpen: boolean;
  petId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function RecordAllergyModal({
  isOpen,
  petId,
  onClose,
  onSuccess,
}: RecordAllergyModalProps) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const [formData, setFormData] = useState<RecordAllergyDto>({
    petId,
    allergen: '',
    severity: 'MODERATE',
    symptoms: [],
    discoveredDate: new Date(),
  });

  const [newSymptom, setNewSymptom] = useState('');

  const handleChange = (field: keyof RecordAllergyDto, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const addSymptom = () => {
    if (newSymptom.trim()) {
      setFormData((prev) => ({
        ...prev,
        symptoms: [...prev.symptoms, newSymptom.trim()],
      }));
      setNewSymptom('');
    }
  };

  const removeSymptom = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      symptoms: prev.symptoms.filter((_, i) => i !== index),
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.allergen.trim()) newErrors.allergen = 'Requerido';
    if (!formData.severity) newErrors.severity = 'Requerido';

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
      await ehrApi.recordAllergy(formData);
      toast.success('Alergia registrada');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error recording allergy:', err);
      toast.error(err?.message || 'Error al registrar');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const severities: { value: AllergySeverity; label: string; color: string }[] = [
    { value: 'MILD', label: 'Leve', color: 'bg-blue-100 text-blue-800' },
    {
      value: 'MODERATE',
      label: 'Moderada',
      color: 'bg-amber-100 text-amber-800',
    },
    { value: 'SEVERE', label: 'Severa', color: 'bg-red-100 text-red-800' },
  ];

  const commonSymptoms = [
    'Picazón',
    'Enrojecimiento',
    'Caída de pelaje',
    'Lesiones de piel',
    'Hinchazón facial',
    'Estornudos',
    'Descarga nasal',
    'Vómito',
    'Diarrea',
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6 flex items-center justify-between sticky top-0">
          <h2 className="text-xl font-bold">Registrar Alergia</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-primary-600 rounded transition"
          >
            <MdClose size={24} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Alérgeno *
              </label>
              <input
                type="text"
                value={formData.allergen}
                onChange={(e) => handleChange('allergen', e.target.value)}
                placeholder="Ej: Penicilina, Pollo"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {errors.allergen && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.allergen}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Severidad *
              </label>
              <select
                value={formData.severity}
                onChange={(e) =>
                  handleChange('severity', e.target.value as AllergySeverity)
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {severities.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Symptoms */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Síntomas
            </label>

            {/* Common symptoms buttons */}
            <div className="flex flex-wrap gap-2 mb-3">
              {commonSymptoms.map((symptom) => (
                <button
                  key={symptom}
                  type="button"
                  onClick={() => {
                    if (!formData.symptoms.includes(symptom)) {
                      setFormData((prev) => ({
                        ...prev,
                        symptoms: [...prev.symptoms, symptom],
                      }));
                    }
                  }}
                  disabled={formData.symptoms.includes(symptom)}
                  className="px-3 py-1 text-sm border border-primary-300 rounded-full hover:bg-primary-50 disabled:bg-primary-100 disabled:text-primary-700 transition cursor-pointer"
                >
                  {symptom}
                </button>
              ))}
            </div>

            {/* Add custom symptom */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newSymptom}
                onChange={(e) => setNewSymptom(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addSymptom()}
                placeholder="Otro síntoma..."
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                type="button"
                onClick={addSymptom}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition"
              >
                Agregar
              </button>
            </div>

            {/* Selected symptoms */}
            {formData.symptoms.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {formData.symptoms.map((symptom, idx) => (
                  <div
                    key={idx}
                    className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full flex items-center gap-2 text-sm"
                  >
                    {symptom}
                    <button
                      type="button"
                      onClick={() => removeSymptom(idx)}
                      className="hover:text-primary-900 font-bold"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Fecha de Descubrimiento
            </label>
            <input
              type="date"
              defaultValue={
                formData.discoveredDate instanceof Date
                  ? formData.discoveredDate.toISOString().split('T')[0]
                  : new Date().toISOString().split('T')[0]
              }
              onChange={(e) =>
                handleChange('discoveredDate', new Date(e.target.value))
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

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
              {loading ? 'Guardando...' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
