'use client';

import { useState } from 'react';
import { MdClose, MdAdd } from 'react-icons/md';
import { CreateDiagnosticOrderDto } from '@/types/ehr';
import { ehrApi } from '@/api/ehr-api';
import { toast } from 'react-hot-toast';

interface CreateDiagnosticOrderModalProps {
  isOpen: boolean;
  petId: string;
  medicalVisitId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateDiagnosticOrderModal({
  isOpen,
  petId,
  medicalVisitId,
  onClose,
  onSuccess,
}: CreateDiagnosticOrderModalProps) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const [formData, setFormData] = useState<CreateDiagnosticOrderDto>({
    petId,
    medicalVisitId,
    testType: 'BLOOD_WORK',
    description: '',
    priority: 'ROUTINE',
  });

  const handleChange = (field: keyof CreateDiagnosticOrderDto, value: any) => {
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

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.testType) newErrors.testType = 'Requerido';
    if (!formData.priority) newErrors.priority = 'Requerido';

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
      await ehrApi.createDiagnosticOrder(formData);
      toast.success('Orden diagnóstica creada');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error creating diagnostic order:', err);
      toast.error(err?.message || 'Error al crear orden');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const testTypes = [
    { value: 'BLOOD_WORK', label: 'Análisis de Sangre' },
    { value: 'URINALYSIS', label: 'Análisis de Orina' },
    { value: 'RADIOGRAPHY', label: 'Radiografía' },
    { value: 'ULTRASOUND', label: 'Ultrasonido' },
    { value: 'ECG', label: 'Electrocardiograma' },
    { value: 'CULTURE', label: 'Cultivo' },
    { value: 'BIOPSY', label: 'Biopsia' },
    { value: 'OTHER', label: 'Otro' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold">Nueva Orden Diagnóstica</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-primary-600 rounded transition"
          >
            <MdClose size={24} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Tipo de Prueba *
            </label>
            <select
              value={formData.testType}
              onChange={(e) => handleChange('testType', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {testTypes.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>



          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Descripción / Indicación
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Ej: Evaluar condición renal, verificar anemia..."
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Prioridad *
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="priority"
                  value="ROUTINE"
                  checked={formData.priority === 'ROUTINE'}
                  onChange={(e) => handleChange('priority', e.target.value)}
                  className="w-4 h-4"
                />
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-800">
                  Rutina
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="priority"
                  value="URGENT"
                  checked={formData.priority === 'URGENT'}
                  onChange={(e) => handleChange('priority', e.target.value)}
                  className="w-4 h-4"
                />
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                  Urgente
                </span>
              </label>
            </div>
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
              {loading ? 'Creando...' : 'Crear Orden'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
