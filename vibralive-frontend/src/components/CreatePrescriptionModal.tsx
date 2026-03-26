'use client';

import React from 'react';
import { MdClose, MdLocalPharmacy } from 'react-icons/md';
import { Prescription, MedicationFrequency, AdministrationRoute } from '@/types/ehr';
import { useEhrStore } from '@/store/ehr-store';
import { useAuthStore } from '@/store/auth-store';
import toast from 'react-hot-toast';

interface CreatePrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  petId?: string;
}

/**
 * Frequency options
 */
const frequencyOptions: Array<{ value: MedicationFrequency; label: string }> = [
  { value: 'ONCE_DAILY' as MedicationFrequency, label: '1x diaria' },
  { value: 'TWICE_DAILY' as MedicationFrequency, label: '2x diaria' },
  { value: 'THREE_TIMES_DAILY' as MedicationFrequency, label: '3x diaria' },
  { value: 'FOUR_TIMES_DAILY' as MedicationFrequency, label: '4x diaria' },
  { value: 'EVERY_12_HOURS' as MedicationFrequency, label: 'Cada 12 horas' },
  { value: 'EVERY_8_HOURS' as MedicationFrequency, label: 'Cada 8 horas' },
  { value: 'AS_NEEDED' as MedicationFrequency, label: 'Según sea necesario' },
];

/**
 * Route options
 */
const routeOptions: Array<{ value: AdministrationRoute; label: string }> = [
  { value: 'ORAL' as AdministrationRoute, label: 'Oral' },
  { value: 'INJECTION' as AdministrationRoute, label: 'Inyección' },
  { value: 'TOPICAL' as AdministrationRoute, label: 'Tópica' },
  { value: 'INHALATION' as AdministrationRoute, label: 'Inhalación' },
  { value: 'INTRAVENOUS' as AdministrationRoute, label: 'Intravenosa' },
  { value: 'INTRAMUSCULAR' as AdministrationRoute, label: 'Intramuscular' },
];

interface FormData {
  medicationName: string;
  dosage: string;
  frequency: MedicationFrequency;
  route: AdministrationRoute;
  duration: string;
  refills: string;
  instructions: string;
}

interface FormErrors {
  [key: string]: string;
}

/**
 * CreatePrescriptionModal
 * Form to create a new prescription
 */
export function CreatePrescriptionModal({
  isOpen,
  onClose,
  onSuccess,
  petId: propPetId,
}: CreatePrescriptionModalProps) {
  const createPrescription = useEhrStore((state) => state.createPrescription);
  const selectedPetId = useAuthStore((state) => state.selectedPetId);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<FormErrors>({});

  const petId = propPetId || selectedPetId;

  const [formData, setFormData] = React.useState<FormData>({
    medicationName: '',
    dosage: '',
    frequency: 'ONCE_DAILY' as MedicationFrequency,
    route: 'ORAL' as AdministrationRoute,
    duration: '',
    refills: '0',
    instructions: '',
  });

  const handleClose = () => {
    setFormData({
      medicationName: '',
      dosage: '',
      frequency: 'ONCE_DAILY' as MedicationFrequency,
      route: 'ORAL' as AdministrationRoute,
      duration: '',
      refills: '0',
      instructions: '',
    });
    setErrors({});
    onClose();
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.medicationName.trim()) {
      newErrors.medicationName = 'El nombre del medicamento es requerido';
    }

    if (!formData.dosage.trim()) {
      newErrors.dosage = 'La dosis es requerida';
    }

    if (!formData.duration.trim()) {
      newErrors.duration = 'La duración es requerida';
    }

    const refills = parseInt(formData.refills, 10);
    if (isNaN(refills) || refills < 0) {
      newErrors.refills = 'Debe ser un número positivo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Por favor, verifica los campos del formulario');
      return;
    }

    if (!petId) {
      toast.error('No se encontró la mascota seleccionada');
      return;
    }

    try {
      setIsSubmitting(true);

      const prescriptionData = {
        medicalVisitId: '',
        petId,
        medicationName: formData.medicationName.trim(),
        dosage: formData.dosage.trim(),
        frequency: formData.frequency,
        route: formData.route,
        duration: formData.duration.trim(),
        instructions: formData.instructions.trim() || undefined,
        maxRefills: parseInt(formData.refills, 10),
      };

      await createPrescription(prescriptionData as any);

      toast.success('Prescripción creada exitosamente');
      handleClose();
      onSuccess?.();
    } catch (error) {
      console.error('Error creating prescription:', error);
      toast.error('Error al crear la prescripción');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-primary-600 via-primary-600 to-primary-700 px-6 py-4 flex items-center justify-between border-b border-primary-700">
          <div className="flex items-center gap-3">
            <MdLocalPharmacy className="w-6 h-6 text-white" />
            <div>
              <h2 className="text-xl font-bold text-white">Nueva Prescripción</h2>
              <p className="text-xs text-primary-100">Registra un nuevo medicamento para la mascota</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-primary-700 rounded transition"
            title="Cerrar"
          >
            <MdClose className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-primary-600 rounded" />
              Información Básica
            </h3>
            <div className="bg-slate-50 rounded-lg p-4 space-y-4">
              {/* Medication Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Nombre del Medicamento *
                </label>
                <input
                  type="text"
                  value={formData.medicationName}
                  onChange={(e) => setFormData({ ...formData, medicationName: e.target.value })}
                  onBlur={() => {
                    if (!formData.medicationName.trim()) {
                      setErrors({ ...errors, medicationName: 'Campo requerido' });
                    } else {
                      setErrors({ ...errors, medicationName: '' });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition text-sm"
                  placeholder="p.ej. Amoxicilina"
                />
                {errors.medication_name && (
                  <p className="text-xs text-red-600 mt-1">{errors.medication_name}</p>
                )}
              </div>

              {/* Dosage */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Dosis *
                </label>
                <input
                  type="text"
                  value={formData.dosage}
                  onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                  onBlur={() => {
                    if (!formData.dosage.trim()) {
                      setErrors({ ...errors, dosage: 'Campo requerido' });
                    } else {
                      setErrors({ ...errors, dosage: '' });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition text-sm"
                  placeholder="p.ej. 250 mg"
                />
                {errors.dosage && (
                  <p className="text-xs text-red-600 mt-1">{errors.dosage}</p>
                )}
              </div>

              {/* Frequency & Route */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Frecuencia *
                  </label>
                  <select
                    value={formData.frequency}
                    onChange={(e) =>
                      setFormData({ ...formData, frequency: e.target.value as MedicationFrequency })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition text-sm"
                  >
                    {frequencyOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Vía de Administración *
                  </label>
                  <select
                    value={formData.route}
                    onChange={(e) =>
                      setFormData({ ...formData, route: e.target.value as AdministrationRoute })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition text-sm"
                  >
                    {routeOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Duration & Refills Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-primary-600 rounded" />
              Duración y Renovaciones
            </h3>
            <div className="bg-slate-50 rounded-lg p-4 space-y-4">
              {/* Duration */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Duración del Tratamiento *
                </label>
                <input
                  type="text"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  onBlur={() => {
                    if (!formData.duration.trim()) {
                      setErrors({ ...errors, duration: 'Campo requerido' });
                    } else {
                      setErrors({ ...errors, duration: '' });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition text-sm"
                  placeholder="p.ej. 10 días"
                />
                {errors.duration && (
                  <p className="text-xs text-red-600 mt-1">{errors.duration}</p>
                )}
              </div>

              {/* Refills */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Renovaciones Disponibles
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.refills}
                  onChange={(e) => setFormData({ ...formData, refills: e.target.value })}
                  onBlur={() => {
                    const refills = parseInt(formData.refills, 10);
                    if (isNaN(refills) || refills < 0) {
                      setErrors({ ...errors, refills: 'Debe ser un número positivo' });
                    } else {
                      setErrors({ ...errors, refills: '' });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition text-sm"
                  placeholder="0"
                />
                {errors.refills && (
                  <p className="text-xs text-red-600 mt-1">{errors.refills}</p>
                )}
              </div>
            </div>
          </div>

          {/* Instructions & Notes Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-primary-600 rounded" />
              Instrucciones y Notas
            </h3>
            <div className="bg-slate-50 rounded-lg p-4 space-y-4">
              {/* Instructions */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Instrucciones de Uso
                </label>
                <textarea
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition text-sm resize-none"
                  placeholder="p.ej. Tomar con alimento, no mezclar con otros medicamentos"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Notas Adicionales
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition text-sm resize-none"
                  placeholder="Observaciones adicionales sobre el medicamento..."
                />
              </div>
            </div>
          </div>

          {/* Footer with Actions */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex gap-3 justify-end">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg font-medium hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
            >
              {isSubmitting ? 'Creando...' : 'Crear Prescripción'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
