'use client';

import { useState, useEffect } from 'react';
import { MdClose, MdAdd } from 'react-icons/md';
import { CreatePrescriptionDto } from '@/types/ehr';
import { ehrApi, getUniqueMedications } from '@/api/ehr-api';
import { toast } from 'react-hot-toast';

interface CreatePrescriptionModalProps {
  isOpen: boolean;
  medicalVisitId: string;
  petId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreatePrescriptionModal({
  isOpen,
  medicalVisitId,
  petId,
  onClose,
  onSuccess,
}: CreatePrescriptionModalProps) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [medications, setMedications] = useState<string[]>([]);
  const [filteredMedications, setFilteredMedications] = useState<string[]>([]);
  const [showMedicationDropdown, setShowMedicationDropdown] = useState(false);

  // Cargar medicamentos al abrir el modal
  useEffect(() => {
    if (isOpen) {
      loadMedications();
    }
  }, [isOpen]);

  const loadMedications = async () => {
    try {
      const meds = await getUniqueMedications();
      setMedications(meds || []);
    } catch (err) {
      console.error('Error loading medications:', err);
    }
  };

  // Helper function to calculate dosage frequency per day
  const getFrequencyPerDay = (frequency: string): number => {
    switch (frequency) {
      case 'ONCE_DAILY':
        return 1;
      case 'TWICE_DAILY':
        return 2;
      case 'THREE_TIMES_DAILY':
        return 3;
      case 'FOUR_TIMES_DAILY':
        return 4;
      case 'EVERY_12_HOURS':
        return 2;
      case 'EVERY_8_HOURS':
        return 3;
      case 'AS_NEEDED':
        return 0;
      default:
        return 1;
    }
  };

  // Helper function to calculate quantity based on duration and frequency
  const calculateQuantity = (durationDays: number, frequency: string): number => {
    const frequencyPerDay = getFrequencyPerDay(frequency);
    if (frequencyPerDay === 0) return 0;
    return durationDays * frequencyPerDay;
  };

  // Generate default dates
  const getDefaultDates = () => {
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 7);

    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    return {
      startDate: formatDate(today),
      endDate: formatDate(endDate),
    };
  };

  const [formData, setFormData] = useState<CreatePrescriptionDto>(() => {
    const defaultDates = getDefaultDates();
    const defaultDuration = 7;
    const defaultFrequency = 'TWICE_DAILY';
    const defaultQuantity = calculateQuantity(defaultDuration, defaultFrequency);
    return {
      medicalVisitId,
      petId,
      medicationName: '',
      dosage: '',
      dosageUnit: 'mg',
      frequency: defaultFrequency,
      route: 'ORAL',
      durationDays: defaultDuration,
      quantity: defaultQuantity,
      refillsAllowed: 0,
      instructions: '',
      ...defaultDates,
    };
  });

  // Helper to calculate end date based on start date and duration
  const calculateEndDate = (startDate: string, durationDays: number): string => {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + durationDays);

    const year = end.getFullYear();
    const month = String(end.getMonth() + 1).padStart(2, '0');
    const day = String(end.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleChange = (field: keyof CreatePrescriptionDto, value: any) => {
    let updatedData: any = { [field]: value };

    // If duration or start date changed, recalculate end date
    if (field === 'durationDays' && formData.startDate) {
      updatedData.endDate = calculateEndDate(formData.startDate, value);
      // Auto-calculate quantity when duration changes
      updatedData.quantity = calculateQuantity(value, formData.frequency);
    } else if (field === 'startDate' && formData.durationDays) {
      updatedData.endDate = calculateEndDate(value, formData.durationDays);
    } else if (field === 'frequency') {
      // Auto-calculate quantity when frequency changes
      updatedData.quantity = calculateQuantity(formData.durationDays, value);
    }

    setFormData((prev) => ({
      ...prev,
      ...updatedData,
    }));

    // Filter medications when typing in medicationName field
    if (field === 'medicationName') {
      const valueStr = String(value).toLowerCase().trim();
      if (valueStr.length > 0) {
        const filtered = medications.filter(med =>
          med.toLowerCase().includes(valueStr)
        );
        setFilteredMedications(filtered);
        setShowMedicationDropdown(true);
      } else {
        setFilteredMedications([]);
        setShowMedicationDropdown(false);
      }
    }

    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleMedicationSelect = (medicationName: string) => {
    setFormData((prev) => ({
      ...prev,
      medicationName,
    }));
    setShowMedicationDropdown(false);
    setFilteredMedications([]);
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.medicationName.trim()) newErrors.medicationName = 'Requerido';
    if (!formData.dosage.trim()) newErrors.dosage = 'Requerido';
    if (!formData.dosageUnit.trim()) newErrors.dosageUnit = 'Requerido';
    if (!formData.frequency) newErrors.frequency = 'Requerido';
    if (!formData.route) newErrors.route = 'Requerido';
    if (!formData.durationDays || formData.durationDays < 1) {
      newErrors.durationDays = 'Debe ser ≥ 1';
    }
    if (!formData.quantity || formData.quantity < 1) {
      newErrors.quantity = 'Debe ser ≥ 1';
    }
    if (!formData.startDate) newErrors.startDate = 'Requerido';
    if (!formData.endDate) newErrors.endDate = 'Requerido';
    if (formData.startDate && formData.endDate && formData.endDate <= formData.startDate) {
      newErrors.endDate = 'Debe ser posterior a la fecha de inicio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    const defaultDates = getDefaultDates();
    const defaultDuration = 7;
    const defaultFrequency = 'TWICE_DAILY';
    const defaultQuantity = calculateQuantity(defaultDuration, defaultFrequency);
    setFormData({
      medicalVisitId,
      petId,
      medicationName: '',
      dosage: '',
      dosageUnit: 'mg',
      frequency: defaultFrequency,
      route: 'ORAL',
      durationDays: defaultDuration,
      quantity: defaultQuantity,
      refillsAllowed: 0,
      instructions: '',
      ...defaultDates,
    });
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Por favor corrige los errores');
      return;
    }

    try {
      setLoading(true);
      await ehrApi.createPrescription(medicalVisitId, formData);
      toast.success('Prescripción creada');
      resetForm();
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error creating prescription:', err);
      toast.error(err?.message || 'Error al crear prescripción');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold">Nueva Prescripción</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-primary-600 rounded transition"
          >
            <MdClose size={24} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Medicamento *
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.medicationName}
                onChange={(e) => handleChange('medicationName', e.target.value)}
                onFocus={() => {
                  if (formData.medicationName.length > 0 && filteredMedications.length > 0) {
                    setShowMedicationDropdown(true);
                  }
                }}
                onBlur={() => {
                  if (medications.includes(formData.medicationName)) {
                    setShowMedicationDropdown(false);
                  }
                }}
                placeholder="Buscar o escribir medicamento..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />

              {/* Medication Autocomplete Dropdown */}
              {showMedicationDropdown && filteredMedications.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-slate-300 rounded-lg mt-1 max-h-48 overflow-y-auto z-10 shadow-lg">
                  {filteredMedications.map((med) => (
                    <div
                      key={med}
                      onClick={() => handleMedicationSelect(med)}
                      className="px-3 py-2 hover:bg-slate-100 cursor-pointer border-b border-slate-100 last:border-b-0 transition"
                    >
                      {med}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {errors.medicationName && (
              <p className="text-xs text-red-500 mt-1">{errors.medicationName}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Dosis *
              </label>
              <input
                type="text"
                value={formData.dosage}
                onChange={(e) => handleChange('dosage', e.target.value)}
                placeholder="Ej: 500"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {errors.dosage && <p className="text-xs text-red-500 mt-1">{errors.dosage}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Unidad *
              </label>
              <input
                type="text"
                value={formData.dosageUnit}
                onChange={(e) => handleChange('dosageUnit', e.target.value)}
                placeholder="Ej: mg, ml"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {errors.dosageUnit && <p className="text-xs text-red-500 mt-1">{errors.dosageUnit}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Frecuencia *
              </label>
              <select
                value={formData.frequency}
                onChange={(e) => handleChange('frequency', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="ONCE_DAILY">Una vez al día</option>
                <option value="TWICE_DAILY">Dos veces al día</option>
                <option value="THREE_TIMES_DAILY">Tres veces al día</option>
                <option value="FOUR_TIMES_DAILY">Cuatro veces al día</option>
                <option value="EVERY_12_HOURS">Cada 12 horas</option>
                <option value="EVERY_8_HOURS">Cada 8 horas</option>
                <option value="AS_NEEDED">Según sea necesario</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Vía *
              </label>
              <select
                value={formData.route}
                onChange={(e) => handleChange('route', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="ORAL">Oral</option>
                <option value="INJECTION">Inyección</option>
                <option value="TOPICAL">Tópica</option>
                <option value="INHALATION">Inhalación</option>
                <option value="INTRAVENOUS">Intravenosa</option>
                <option value="INTRAMUSCULAR">Intramuscular</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Duración (días) *
              </label>
              <input
                type="number"
                value={formData.durationDays}
                onChange={(e) => handleChange('durationDays', parseInt(e.target.value) || 1)}
                min="1"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {errors.durationDays && (
                <p className="text-xs text-red-500 mt-1">{errors.durationDays}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Cantidad a dispensar *
              </label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => handleChange('quantity', parseInt(e.target.value) || 1)}
                min="1"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-xs text-slate-500 mt-1">
                {formData.durationDays && formData.frequency && getFrequencyPerDay(formData.frequency) > 0
                  ? `${formData.durationDays} días × ${getFrequencyPerDay(formData.frequency)}x = ${formData.quantity} dosis`
                  : 'Editable manualmente'}
              </p>
              {errors.quantity && (
                <p className="text-xs text-red-500 mt-1">{errors.quantity}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Refills
              </label>
              <input
                type="number"
                value={formData.refillsAllowed || 0}
                onChange={(e) => handleChange('refillsAllowed', parseInt(e.target.value) || 0)}
                min="0"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Fecha Inicio *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {errors.startDate && (
                <p className="text-xs text-red-500 mt-1">{errors.startDate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Fecha Fin *
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => handleChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {errors.endDate && (
                <p className="text-xs text-red-500 mt-1">{errors.endDate}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Instrucciones
            </label>
            <textarea
              rows={2}
              value={formData.instructions || ''}
              onChange={(e) => handleChange('instructions', e.target.value)}
              placeholder="Instrucciones especiales..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-200">
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
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
