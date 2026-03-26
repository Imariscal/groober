'use client';

import { useState, useEffect } from 'react';
import { MdPets } from 'react-icons/md';
import { CreateClientPetPayload, PetSpecies, PetSex, PetSize } from '@/types';
import { useClinicTimezone } from '@/hooks/useClinicTimezone';
import { getClinicDateKey } from '@/lib/datetime-tz';

// Species options for dropdown
const SPECIES_OPTIONS: { value: PetSpecies; label: string }[] = [
  { value: 'DOG', label: '🐕 Perro' },
  { value: 'CAT', label: '🐱 Gato' },
  { value: 'BIRD', label: '🐦 Ave' },
  { value: 'RABBIT', label: '🐰 Conejo' },
  { value: 'HAMSTER', label: '🐹 Hámster' },
  { value: 'GUINEA_PIG', label: '🐹 Cobayo' },
  { value: 'FISH', label: '🐟 Pez' },
  { value: 'TURTLE', label: '🐢 Tortuga' },
  { value: 'FERRET', label: '🦡 Hurón' },
  { value: 'OTHER', label: '🐾 Otro' },
];

// Sex options for dropdown
const SEX_OPTIONS: { value: PetSex; label: string }[] = [
  { value: 'MALE', label: '♂ Macho' },
  { value: 'FEMALE', label: '♀ Hembra' },
  { value: 'UNKNOWN', label: '? Desconocido' },
];

// Size options for dropdown
const SIZE_OPTIONS: { value: PetSize; label: string }[] = [
  { value: 'XS', label: 'XS - Miniatura (< 3kg)' },
  { value: 'S', label: 'S - Pequeño (3-10kg)' },
  { value: 'M', label: 'M - Mediano (10-25kg)' },
  { value: 'L', label: 'L - Grande (25-45kg)' },
  { value: 'XL', label: 'XL - Gigante (> 45kg)' },
];

// Type for pet prop - can be full Pet or just CreateClientPetPayload fields
type PetInput = Partial<CreateClientPetPayload>;

interface PetFormProps {
  pet?: PetInput;
  onSubmit: (data: CreateClientPetPayload) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function PetForm({
  pet,
  onSubmit,
  onCancel,
  loading = false,
}: PetFormProps) {
  const clinicTimezone = useClinicTimezone();
  const [formData, setFormData] = useState<CreateClientPetPayload>({
    name: pet?.name || '',
    species: pet?.species || 'DOG',
    breed: pet?.breed || '',
    dateOfBirth: pet?.dateOfBirth || '',
    sex: pet?.sex || 'UNKNOWN',
    isSterilized: pet?.isSterilized ?? false,
    color: pet?.color || '',
    size: pet?.size || undefined,
    microchipNumber: pet?.microchipNumber || '',
    tagNumber: pet?.tagNumber || '',
    notes: pet?.notes || '',
    allergies: pet?.allergies || '',
  });

  const [formError, setFormError] = useState<string | null>(null);

  // Update form when pet prop changes (editing)
  useEffect(() => {
    if (pet) {
      setFormData({
        name: pet.name || '',
        species: pet.species || 'DOG',
        breed: pet.breed || '',
        dateOfBirth: pet.dateOfBirth || '',
        sex: pet.sex || 'UNKNOWN',
        isSterilized: pet.isSterilized ?? false,
        color: pet.color || '',
        size: pet.size || undefined,
        microchipNumber: pet.microchipNumber || '',
        tagNumber: pet.tagNumber || '',
        notes: pet.notes || '',
        allergies: pet.allergies || '',
      });
      setFormError(null);
    } else {
      // Clear form if no pet being edited
      setFormData({
        name: '',
        species: 'DOG',
        breed: '',
        dateOfBirth: '',
        sex: 'UNKNOWN',
        isSterilized: false,
        color: '',
        size: undefined,
        microchipNumber: '',
        tagNumber: '',
        notes: '',
        allergies: '',
      });
    }
  }, [pet]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value || undefined,
      }));
    }
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.name?.trim()) {
      setFormError('El nombre de la mascota es requerido');
      return;
    }

    if (!formData.species) {
      setFormError('La especie es requerida');
      return;
    }

    if (!formData.size) {
      setFormError('El tamaño de la mascota es requerido (necesario para citas de grooming)');
      return;
    }

    try {
      await onSubmit({
        ...formData,
        name: formData.name.trim(),
        breed: formData.breed?.trim() || undefined,
        color: formData.color?.trim() || undefined,
        microchipNumber: formData.microchipNumber?.trim() || undefined,
        tagNumber: formData.tagNumber?.trim() || undefined,
        notes: formData.notes?.trim() || undefined,
        allergies: formData.allergies?.trim() || undefined,
      });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Error al guardar');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {formError && (
        <div className="p-3 bg-red-50 border border-red-300 rounded-lg text-red-700 text-sm font-medium">
          {formError}
        </div>
      )}

      {/* Row 1: Name + Species */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
            Nombre <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Firulais"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
            Especie <span className="text-red-500">*</span>
          </label>
          <select
            name="species"
            value={formData.species}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {SPECIES_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 2: Breed + Sex */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
            Raza <span className="text-gray-400 font-normal text-[10px]">(opcional)</span>
          </label>
          <input
            type="text"
            name="breed"
            value={formData.breed || ''}
            onChange={handleInputChange}
            placeholder="Golden Retriever"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
            Sexo
          </label>
          <select
            name="sex"
            value={formData.sex || 'UNKNOWN'}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {SEX_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 3: Date of Birth + Size */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
            Fecha de Nacimiento <span className="text-gray-400 font-normal text-[10px]">(opcional)</span>
          </label>
          <input
            type="date"
            name="dateOfBirth"
            value={formData.dateOfBirth || ''}
            onChange={handleInputChange}
            max={getClinicDateKey(new Date(), clinicTimezone)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
            Tamaño <span className="text-red-500">*</span>
          </label>
          <select
            name="size"
            value={formData.size || ''}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Seleccionar...</option>
            {SIZE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 4: Color + Sterilized */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
            Color <span className="text-gray-400 font-normal text-[10px]">(opcional)</span>
          </label>
          <input
            type="text"
            name="color"
            value={formData.color || ''}
            onChange={handleInputChange}
            placeholder="Dorado"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="isSterilized"
              checked={formData.isSterilized || false}
              onChange={handleInputChange}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Esterilizado/Castrado</span>
          </label>
        </div>
      </div>

      {/* Row 5: Microchip + Tag Number */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
            No. Microchip <span className="text-gray-400 font-normal text-[10px]">(opcional)</span>
          </label>
          <input
            type="text"
            name="microchipNumber"
            value={formData.microchipNumber || ''}
            onChange={handleInputChange}
            placeholder="981000123456789"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
            No. Placa/Tag <span className="text-gray-400 font-normal text-[10px]">(opcional)</span>
          </label>
          <input
            type="text"
            name="tagNumber"
            value={formData.tagNumber || ''}
            onChange={handleInputChange}
            placeholder="MTY-2024-0001"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Row 6: Allergies */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
          Alergias <span className="text-gray-400 font-normal text-[10px]">(opcional)</span>
        </label>
        <input
          type="text"
          name="allergies"
          value={formData.allergies || ''}
          onChange={handleInputChange}
          placeholder="Pollo, látex..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Row 7: Notes */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
          Notas <span className="text-gray-400 font-normal text-[10px]">(opcional)</span>
        </label>
        <textarea
          name="notes"
          value={formData.notes || ''}
          onChange={handleInputChange}
          placeholder="Información adicional sobre la mascota..."
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <MdPets className="w-4 h-4" />
          {loading ? 'Guardando...' : pet ? 'Actualizar' : 'Agregar'}
        </button>
      </div>
    </form>
  );
}
