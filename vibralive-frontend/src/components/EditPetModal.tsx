'use client';

import React, { useState, useEffect } from 'react';
import { MdClose, MdPets } from 'react-icons/md';
import { Pet, Client } from '@/types';
import { petsApi } from '@/lib/pets-api';
import { clientsApi } from '@/lib/clients-api';
import toast from 'react-hot-toast';

interface EditPetModalProps {
  isOpen: boolean;
  pet: Pet | null;
  clientId: string;
  onClose: () => void;
  onSuccess?: (pet: Pet) => void;
}

export function EditPetModal({ isOpen, pet, clientId, onClose, onSuccess }: EditPetModalProps) {
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(false);
  const [clientLoading, setClientLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    species: '',
    breed: '',
    dateOfBirth: '',
    sex: 'UNKNOWN',
    isSterilized: false,
    color: '',
    size: '',
    microchipNumber: '',
    tagNumber: '',
    notes: '',
    allergies: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load client info and populate form
  useEffect(() => {
    if (isOpen && pet && clientId) {
      fetchClient();
      setFormData({
        name: pet.name || '',
        species: pet.species || '',
        breed: pet.breed || '',
        dateOfBirth: pet.date_of_birth || '',
        sex: pet.sex || 'UNKNOWN',
        isSterilized: pet.is_sterilized || false,
        color: pet.color || '',
        size: pet.size || '',
        microchipNumber: pet.microchip_number || '',
        tagNumber: pet.tag_number || '',
        notes: pet.notes || '',
        allergies: pet.allergies || '',
      });
      setErrors({});
    }
  }, [isOpen, pet, clientId]);

  const fetchClient = async () => {
    try {
      setClientLoading(true);
      const response = await clientsApi.getClient(clientId);
      setClient(response);
    } catch (error) {
      console.error('Error fetching client:', error);
    } finally {
      setClientLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
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
      newErrors.name = 'El nombre de la mascota es requerido';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'El nombre debe tener al menos 2 caracteres';
    } else if (formData.name.trim().length > 50) {
      newErrors.name = 'El nombre no puede exceder 50 caracteres';
    }

    if (!formData.species) {
      newErrors.species = 'Selecciona una especie';
    }

    if (!formData.size) {
      newErrors.size = 'Selecciona un tamaño';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!pet?.id) return;

    try {
      setLoading(true);
      const payload = {
        name: formData.name,
        species: formData.species as any,
        breed: formData.breed || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        sex: formData.sex as any,
        isSterilized: formData.isSterilized,
        color: formData.color || undefined,
        size: (formData.size || undefined) as any,
        microchipNumber: formData.microchipNumber || undefined,
        tagNumber: formData.tagNumber || undefined,
        notes: formData.notes || undefined,
        allergies: formData.allergies || undefined,
      };

      const updatedPet = await petsApi.updatePet(clientId, pet.id, payload);
      toast.success('Mascota actualizada exitosamente');
      onSuccess?.(updatedPet);
      onClose();
    } catch (error: any) {
      console.error('Error updating pet:', error);
      toast.error(error.message || 'Error al actualizar mascota');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !pet) return null;

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
                <MdPets className="w-6 h-6 text-white" />
                <h2 className="text-2xl font-bold text-white">Editar Mascota</h2>
              </div>
              <p className="text-primary-100 text-sm">
                Actualiza la información de la mascota
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
            {/* Sección: Cliente */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-5 bg-purple-600 rounded-full"></div>
                <h3 className="text-sm font-semibold text-gray-900">Información del Cliente</h3>
              </div>

              <div>
                {clientLoading ? (
                  <div className="h-10 bg-gray-200 rounded-lg animate-pulse" />
                ) : (
                  <div className="p-3 bg-purple-50 border border-purple-100 rounded-lg">
                    <p className="text-sm font-semibold text-purple-900">{client?.name || 'Cargando...'}</p>
                    <p className="text-xs text-purple-700 mt-1">Teléfono: {client?.phone}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Sección: Información Básica */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-5 bg-primary-600 rounded-full"></div>
                <h3 className="text-sm font-semibold text-gray-900">Información Básica</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">
                    Nombre <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="ej: Max"
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition ${
                      errors.name
                        ? 'border-red-300 focus:ring-red-500 bg-red-50'
                          : 'border-gray-300 focus:ring-primary-500 focus:border-primary-300'
                    }`}
                  />
                  {errors.name && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      ⚠️ {errors.name}
                    </p>
                  )}
                </div>

                {/* Species */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">
                    Especie <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="species"
                    value={formData.species}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition ${
                      errors.species
                        ? 'border-red-300 focus:ring-red-500 bg-red-50'
                          : 'border-gray-300 focus:ring-primary-500 focus:border-primary-300'
                    }`}
                  >
                    <option value="">Selecciona una especie</option>
                    <option value="DOG">Perro</option>
                    <option value="CAT">Gato</option>
                    <option value="BIRD">Ave</option>
                    <option value="RABBIT">Conejo</option>
                    <option value="HAMSTER">Hámster</option>
                    <option value="GUINEA_PIG">Cobaya</option>
                    <option value="FISH">Pez</option>
                    <option value="TURTLE">Tortuga</option>
                    <option value="FERRET">Hurón</option>
                    <option value="OTHER">Otro</option>
                  </select>
                  {errors.species && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      ⚠️ {errors.species}
                    </p>
                  )}
                </div>

                {/* Breed */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">
                    Raza
                  </label>
                  <input
                    type="text"
                    name="breed"
                    value={formData.breed}
                    onChange={handleInputChange}
                    placeholder="ej: Golden Retriever"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-300 transition"
                  />
                </div>

                {/* Sex */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">
                    Sexo
                  </label>
                  <select
                    name="sex"
                    value={formData.sex}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-300 transition"
                  >
                    <option value="UNKNOWN">Desconocido</option>
                    <option value="MALE">♂️ Macho</option>
                    <option value="FEMALE">♀️ Hembra</option>
                  </select>
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">
                    Fecha de Nacimiento
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-300 transition"
                  />
                </div>

                {/* Size */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">
                    Tamaño <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="size"
                    value={formData.size || ''}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition ${
                      errors.size
                        ? 'border-red-300 focus:ring-red-500 bg-red-50'
                        : 'border-gray-300 focus:ring-primary-500 focus:border-primary-300'
                    }`}
                  >
                    <option value="">Selecciona un tamaño</option>
                    <option value="XS">XS - Miniatura (&lt; 3kg)</option>
                    <option value="S">S - Pequeño (3-10kg)</option>
                    <option value="M">M - Mediano (10-25kg)</option>
                    <option value="L">L - Grande (25-45kg)</option>
                    <option value="XL">XL - Gigante (&gt; 45kg)</option>
                  </select>
                  {errors.size && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      ⚠️ {errors.size}
                    </p>
                  )}
                </div>

                {/* Color */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">
                    Color
                  </label>
                  <input
                    type="text"
                    name="color"
                    value={formData.color}
                    onChange={handleInputChange}
                    placeholder="ej: Blanco y marrón"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-300 transition"
                  />
                </div>
              </div>

              {/* Esterilization Checkbox */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isSterilized"
                    checked={formData.isSterilized}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Mascota esterilizada</span>
                </label>
              </div>
            </div>

            {/* Sección: Información Médica */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-5 bg-primary-600 rounded-full"></div>
                <h3 className="text-sm font-semibold text-gray-900">Información Médica</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Microchip */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">
                    Número de Microchip
                  </label>
                  <input
                    type="text"
                    name="microchipNumber"
                    value={formData.microchipNumber}
                    onChange={handleInputChange}
                    placeholder="Número de microchip"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-300 transition"
                  />
                </div>

                {/* Tag Number */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">
                    Número de Placa
                  </label>
                  <input
                    type="text"
                    name="tagNumber"
                    value={formData.tagNumber}
                    onChange={handleInputChange}
                    placeholder="Número de placa/tag"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-300 transition"
                  />
                </div>
              </div>

              {/* Allergies */}
              <div className="mt-4">
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">
                  Alergias
                </label>
                <textarea
                  name="allergies"
                  value={formData.allergies}
                  onChange={handleInputChange}
                  placeholder="Describe cualquier alergia conocida..."
                  rows={2}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-300 transition resize-none"
                />
              </div>
            </div>

            {/* Sección: Notas Adicionales */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-5 bg-primary-600 rounded-full"></div>
                <h3 className="text-sm font-semibold text-gray-900">Notas Adicionales</h3>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">
                  Observaciones
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Agrega cualquier nota adicional sobre la mascota..."
                  rows={3}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-300 transition resize-none"
                />
              </div>
            </div>

            {/* Footer - Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-semibold text-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold text-sm flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <MdPets className="w-4 h-4" />
                    Guardar Cambios
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}




