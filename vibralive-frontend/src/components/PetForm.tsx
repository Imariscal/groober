'use client';

import { useFormValidation } from '@/hooks/useFormValidation';
import { PetSchema, PetFormData } from '@/lib/validations';
import { FormInput, FormSelect, InfoAlert } from './FormFields';
import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';

interface AnimalType {
  id: string;
  name: string;
}

interface PetFormProps {
  initialValues?: Partial<PetFormData>;
  onSubmit: (data: PetFormData) => Promise<void>;
  isLoading?: boolean;
  animalTypes: AnimalType[];
  title?: string;
}

export function PetForm({
  initialValues,
  onSubmit,
  isLoading = false,
  animalTypes,
  title = 'Nueva Mascota',
}: PetFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const [animalTypeOptions, setAnimalTypeOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);

  useEffect(() => {
    setAnimalTypeOptions(
      animalTypes.map((type) => ({
        value: type.id,
        label: type.name,
      }))
    );
  }, [animalTypes]);

  const form = useFormValidation<PetFormData>(
    {
      name: initialValues?.name || '',
      animal_type_id: initialValues?.animal_type_id || '',
      birth_date: initialValues?.birth_date || '',
      gender: initialValues?.gender || 'male',
      weight_kg: initialValues?.weight_kg || 0,
      color_description: initialValues?.color_description || '',
      next_vaccine_date: initialValues?.next_vaccine_date || '',
      next_deworming_date: initialValues?.next_deworming_date || '',
    },
    PetSchema
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const isValid = await form.validate();
    if (!isValid) {
      toast.error('Por favor, completa todos los campos correctamente');
      return;
    }

    try {
      await onSubmit(form.values);
      toast.success('Mascota guardada correctamente');
      form.resetForm();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al guardar la mascota';
      setFormError(message);
      toast.error(message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
      </div>

      {formError && (
        <InfoAlert onClose={() => setFormError(null)}>
          {formError}
        </InfoAlert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FormInput
          id="name"
          type="text"
          label="Nombre de la Mascota"
          placeholder="Nombre"
          {...form.getFieldProps('name')}
          error={form.touched.name ? form.errors.name?.message : undefined}
          containerClassName="space-y-2"
          required
        />

        <FormSelect
          id="animal_type_id"
          label="Tipo de Animal"
          placeholder="Selecciona un tipo"
          options={animalTypeOptions}
          {...form.getFieldProps('animal_type_id')}
          error={form.touched.animal_type_id ? form.errors.animal_type_id?.message : undefined}
          containerClassName="space-y-2"
          required
        />

        <FormSelect
          id="gender"
          label="Género"
          options={[
            { value: 'male', label: 'Macho' },
            { value: 'female', label: 'Hembra' },
          ]}
          {...form.getFieldProps('gender')}
          error={form.touched.gender ? form.errors.gender?.message : undefined}
          containerClassName="space-y-2"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FormInput
          id="birth_date"
          type="date"
          label="Fecha de Nacimiento"
          {...form.getFieldProps('birth_date')}
          error={form.touched.birth_date ? form.errors.birth_date?.message : undefined}
          containerClassName="space-y-2"
          required
        />

        <FormInput
          id="weight_kg"
          type="number"
          label="Peso (kg)"
          placeholder="0.0"
          step="0.1"
          min="0"
          {...form.getFieldProps('weight_kg')}
          error={form.touched.weight_kg ? form.errors.weight_kg?.message : undefined}
          containerClassName="space-y-2"
          required
        />

        <FormInput
          id="color_description"
          type="text"
          label="Descripción de Color"
          placeholder="Ej: Marrón oscuro con manchas blancas"
          {...form.getFieldProps('color_description')}
          error={form.touched.color_description ? form.errors.color_description?.message : undefined}
          containerClassName="space-y-2"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
        <FormInput
          id="next_vaccine_date"
          type="date"
          label="Próxima Fecha de Vacuna"
          {...form.getFieldProps('next_vaccine_date')}
          error={form.touched.next_vaccine_date ? form.errors.next_vaccine_date?.message : undefined}
          containerClassName="space-y-2"
          required
        />

        <FormInput
          id="next_deworming_date"
          type="date"
          label="Próxima Desparasitación"
          {...form.getFieldProps('next_deworming_date')}
          error={form.touched.next_deworming_date ? form.errors.next_deworming_date?.message : undefined}
          containerClassName="space-y-2"
          required
        />
      </div>

      <div className="flex gap-4 justify-end pt-4">
        <button
          type="button"
          onClick={() => form.resetForm()}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
        >
          Limpiar
        </button>
        <button
          type="submit"
          disabled={isLoading || form.isValidating}
          className="px-6 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Guardando...' : 'Guardar Mascota'}
        </button>
      </div>
    </form>
  );
}
