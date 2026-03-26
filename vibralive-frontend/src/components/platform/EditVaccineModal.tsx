'use client';

import React, { useState, useEffect } from 'react';
import { MdClose, MdVaccines } from 'react-icons/md';
import { updateVaccine } from '@/api/ehr-api';
import toast from 'react-hot-toast';

interface Vaccine {
  id: string;
  name: string;
  description?: string;
  diseasesCovered?: string[];
  isSingleDose?: boolean;
  boosterDays?: number;
  isActive: boolean;
  createdAt?: string;
}

interface EditVaccineModalProps {
  isOpen: boolean;
  vaccine: Vaccine | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function EditVaccineModal({
  isOpen,
  vaccine,
  onClose,
  onSuccess,
}: EditVaccineModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    diseasesCovered: '',
    isSingleDose: false,
    boosterDays: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data when vaccine changes
  useEffect(() => {
    if (vaccine) {
      setFormData({
        name: vaccine.name,
        description: vaccine.description || '',
        diseasesCovered: vaccine.diseasesCovered?.join(', ') || '',
        isSingleDose: vaccine.isSingleDose ?? false,
        boosterDays: vaccine.boosterDays?.toString() || '',
      });
      setErrors({});
    }
  }, [vaccine, isOpen]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre de la vacuna es requerido';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'El nombre debe tener al menos 2 caracteres';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'El nombre no puede exceder 100 caracteres';
    }

    // Only validate boosterDays if it's NOT a single-dose vaccine
    if (!formData.isSingleDose) {
      if (!formData.boosterDays) {
        newErrors.boosterDays = 'Los días de refuerzo son requeridos para vacunas multi-dosis';
      } else if (isNaN(Number(formData.boosterDays))) {
        newErrors.boosterDays = 'El refuerzo debe ser un número';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !vaccine) {
      return;
    }

    try {
      setLoading(true);
      const payload = {
        name: formData.name,
        description: formData.description || undefined,
        diseasesCovered: formData.diseasesCovered
          ? formData.diseasesCovered.split(',').map((d) => d.trim())
          : undefined,
        isSingleDose: formData.isSingleDose,
        boosterDays: !formData.isSingleDose && formData.boosterDays 
          ? parseInt(formData.boosterDays, 10) 
          : undefined,
      };

      await updateVaccine(vaccine.id, payload);
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Error updating vaccine:', error);
      toast.error(error.message || 'Error al actualizar vacuna');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !vaccine) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[95vh] flex flex-col transform transition-all duration-300">
          {/* Header */}
          <div className="sticky top-0 z-20 bg-gradient-to-r from-primary-600 via-primary-600 to-primary-700 px-6 py-4 flex items-center justify-between border-b border-primary-600 shadow-sm">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <MdVaccines className="w-6 h-6 text-white" />
                <h2 className="text-2xl font-bold text-white">Editar Vacuna</h2>
              </div>
              <p className="text-primary-100 text-sm">
                Actualiza los datos de la vacuna
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition duration-200"
            >
              <MdClose className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
            {/* Información Básica */}
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-5 bg-primary-600 rounded-full"></div>
                <h3 className="text-sm font-semibold text-slate-900">Información Básica</h3>
              </div>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">
                    Nombre <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition ${
                      errors.name
                        ? 'border-red-300 focus:ring-red-500 bg-red-50'
                        : 'border-slate-300 focus:ring-primary-500 focus:border-primary-300'
                    }`}
                  />
                  {errors.name && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      ⚠️ {errors.name}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">
                    Descripción
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-300"
                  />
                </div>

                {/* Diseases Covered */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">
                    Enfermedades Cubiertas
                  </label>
                  <input
                    type="text"
                    name="diseasesCovered"
                    value={formData.diseasesCovered}
                    onChange={handleInputChange}
                    placeholder="Ej: Parvovirus, Distemper (separadas por comas)"
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-300"
                  />
                </div>

                {/* Vaccine Type Toggle */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-2.5">
                    Tipo de Vacuna
                  </label>
                  <div className="flex gap-3">
                    <label className={`flex items-center gap-2 px-3 py-2 border-2 rounded-lg cursor-pointer transition ${
                      formData.isSingleDose
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-slate-300 bg-white hover:border-slate-400'
                    }`}>
                      <input
                        type="radio"
                        name="vaccineType"
                        checked={formData.isSingleDose}
                        onChange={() => {
                          setFormData((prev) => ({
                            ...prev,
                            isSingleDose: true,
                            boosterDays: '',
                          }));
                          if (errors.boosterDays) {
                            setErrors((prev) => ({
                              ...prev,
                              boosterDays: '',
                            }));
                          }
                        }}
                        className="w-4 h-4 cursor-pointer"
                      />
                      <span className="text-sm font-medium text-slate-700">Dosis Única</span>
                    </label>
                    <label className={`flex items-center gap-2 px-3 py-2 border-2 rounded-lg cursor-pointer transition ${
                      !formData.isSingleDose
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-slate-300 bg-white hover:border-slate-400'
                    }`}>
                      <input
                        type="radio"
                        name="vaccineType"
                        checked={!formData.isSingleDose}
                        onChange={() => {
                          setFormData((prev) => ({
                            ...prev,
                            isSingleDose: false,
                          }));
                        }}
                        className="w-4 h-4 cursor-pointer"
                      />
                      <span className="text-sm font-medium text-slate-700">Con Refuerzos</span>
                    </label>
                  </div>
                </div>

                {/* Booster Days - Conditional */}
                {!formData.isSingleDose && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">
                      Días para Refuerzo
                    </label>
                    <input
                      type="number"
                      name="boosterDays"
                      value={formData.boosterDays}
                      onChange={handleInputChange}
                      min="0"
                      className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition ${
                        errors.boosterDays
                          ? 'border-red-300 focus:ring-red-500 bg-red-50'
                          : 'border-slate-300 focus:ring-primary-500 focus:border-primary-300'
                      }`}
                    />
                    {errors.boosterDays && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        ⚠️ {errors.boosterDays}
                      </p>
                    )}
                  </div>
                )}

                {/* Status Info */}
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                  <p className="text-xs text-blue-700">
                    <span className="font-semibold">Estado:</span>{' '}
                    {vaccine.isActive ? 'Activa' : 'Inactiva'}
                  </p>
                </div>
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition font-medium text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Actualizando...' : 'Guardar Cambios'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
