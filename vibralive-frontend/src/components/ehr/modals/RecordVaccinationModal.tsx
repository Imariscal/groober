'use client';

import { useState } from 'react';
import { MdClose, MdAdd } from 'react-icons/md';
import { RecordVaccinationDto } from '@/types/ehr';
import { ehrApi } from '@/api/ehr-api';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { useClinicTimezone } from '@/hooks/useClinicTimezone';
import { toUtcIsoFromClinicLocal, toClinicZonedDate } from '@/lib/datetime-tz';

interface RecordVaccinationModalProps {
  isOpen: boolean;
  petId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function RecordVaccinationModal({
  isOpen,
  petId,
  onClose,
  onSuccess,
}: RecordVaccinationModalProps) {
  const clinicTimezone = useClinicTimezone();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const today = new Date();
  const todayString = format(today, 'yyyy-MM-dd');
  
  const [formData, setFormData] = useState<RecordVaccinationDto>({
    petId,
    vaccineId: '',
    vaccineName: '',
    vaccineBatch: '',
    manufacturer: '',
    lotNumber: '',
    administeredDate: today,
    expirationDate: new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000), // 1 year
    adverseReactions: '',
    notes: '',
  });

  const handleChange = (field: keyof RecordVaccinationDto, value: any) => {
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

    // Todos los campos obligatorios
    if (!formData.vaccineId?.trim()) newErrors.vaccineId = 'Requerido';
    if (!formData.vaccineName?.trim()) newErrors.vaccineName = 'Requerido';
    if (!formData.manufacturer?.trim()) newErrors.manufacturer = 'Requerido';
    if (!formData.lotNumber?.trim()) newErrors.lotNumber = 'Requerido';
    if (!formData.vaccineBatch?.trim()) newErrors.vaccineBatch = 'Requerido';
    if (!formData.administeredDate) newErrors.administeredDate = 'Requerido';
    if (!formData.expirationDate) newErrors.expirationDate = 'Requerido';
    if (!formData.adverseReactions?.trim()) newErrors.adverseReactions = 'Requerido';
    if (!formData.notes?.trim()) newErrors.notes = 'Requerido';

    // Validar que la fecha de expiración no sea menor a hoy
    if (formData.expirationDate) {
      const expirationDate = new Date(formData.expirationDate);
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);
      if (expirationDate < todayDate) {
        newErrors.expirationDate = 'No puede ser menor a hoy';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isFormValid = (): boolean => {
    return (
      formData.vaccineId?.trim() &&
      formData.vaccineName?.trim() &&
      formData.manufacturer?.trim() &&
      formData.lotNumber?.trim() &&
      formData.vaccineBatch?.trim() &&
      formData.administeredDate &&
      formData.expirationDate &&
      formData.adverseReactions?.trim() &&
      formData.notes?.trim()
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Por favor corrige los errores');
      return;
    }

    try {
      setLoading(true);
      
      // Convert dates from clinic timezone to UTC ISO
      const administeredDate = toUtcIsoFromClinicLocal(formData.administeredDate as any, clinicTimezone);
      const expirationDate = toUtcIsoFromClinicLocal(formData.expirationDate as any, clinicTimezone);

      const payload: RecordVaccinationDto = {
        ...formData,
        administeredDate,
        expirationDate,
      };

      await ehrApi.recordVaccination(payload);
      toast.success('Vacunación registrada');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error recording vaccination:', err);
      toast.error(err?.message || 'Error al registrar');
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
          <h2 className="text-xl font-bold">Registrar Vacunación</h2>
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
              Seleccionar Vacuna *
            </label>
            <input
              type="text"
              value={formData.vaccineName}
              onChange={(e) => {
                handleChange('vaccineName', e.target.value);
                handleChange('vaccineId', e.target.value); // Sincronizar con vaccineId
              }}
              placeholder="Buscar o seleccionar vacuna"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            {errors.vaccineName && (
              <p className="text-xs text-red-500 mt-1">{errors.vaccineName}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Fabricante *
              </label>
              <input
                type="text"
                value={formData.manufacturer}
                onChange={(e) => handleChange('manufacturer', e.target.value)}
                placeholder="Ej: Merial"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {errors.manufacturer && (
                <p className="text-xs text-red-500 mt-1">{errors.manufacturer}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Número de Lote *
              </label>
              <input
                type="text"
                value={formData.lotNumber}
                onChange={(e) => handleChange('lotNumber', e.target.value)}
                placeholder="Ej: 25336"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {errors.lotNumber && (
                <p className="text-xs text-red-500 mt-1">{errors.lotNumber}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Lote de Vacuna *
              </label>
              <input
                type="text"
                value={formData.vaccineBatch}
                onChange={(e) => handleChange('vaccineBatch', e.target.value)}
                placeholder="Ej: 2366"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {errors.vaccineBatch && (
                <p className="text-xs text-red-500 mt-1">{errors.vaccineBatch}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Reacciones Adversas *
              </label>
              <input
                type="text"
                value={formData.adverseReactions || ''}
                onChange={(e) => handleChange('adverseReactions', e.target.value)}
                placeholder="Ej: Ninguna"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {errors.adverseReactions && (
                <p className="text-xs text-red-500 mt-1">{errors.adverseReactions}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Fecha Administración *
              </label>
              <input
                type="date"
                value={todayString}
                disabled
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-100 text-slate-700 cursor-not-allowed disabled:opacity-50"
              />
              <p className="text-xs text-slate-500 mt-1">Se registra como hoy</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Fecha Expiración *
              </label>
              <input
                type="date"
                value={format(formData.expirationDate as any, 'yyyy-MM-dd')}
                min={todayString}
                onChange={(e) =>
                  handleChange('expirationDate', new Date(e.target.value))
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {errors.expirationDate && (
                <p className="text-xs text-red-500 mt-1">{errors.expirationDate}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Notas Adicionales *
            </label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Ej: Se aplicó en la extremidad posterior derecha"
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            {errors.notes && (
              <p className="text-xs text-red-500 mt-1">{errors.notes}</p>
            )}
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
              disabled={loading || !isFormValid()}
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
