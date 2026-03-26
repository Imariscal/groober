'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useFormValidation } from '@/hooks/useFormValidation';
import { RegisterSchema, RegisterFormData } from '@/lib/validations';
import { FormInput, InfoAlert } from './FormFields';
import toast from 'react-hot-toast';
import { useState } from 'react';

export function RegisterForm() {
  const { register, isLoading, error: authError } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useFormValidation<RegisterFormData>(
    {
      clinic_name: '',
      clinic_phone: '',
      owner_name: '',
      owner_email: '',
      password: '',
      confirm_password: '',
    },
    RegisterSchema
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validate form
    const isValid = await form.validate();
    if (!isValid) {
      toast.error('Por favor, completa todos los campos correctamente');
      return;
    }

    try {
      await register(
        form.values.clinic_name,
        form.values.clinic_phone,
        form.values.owner_name,
        form.values.owner_email,
        form.values.password
      );
      toast.success('¡Registro exitoso!');
      form.resetForm();
    } catch (err) {
      const message = authError || 'Error en el registro. Intenta de nuevo';
      setFormError(message);
      toast.error(message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {(formError || authError) && (
        <InfoAlert onClose={() => setFormError(null)}>
          {formError || authError}
        </InfoAlert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Clinic Info */}
        <FormInput
          id="clinic_name"
          type="text"
          label="Nombre de la Clínica"
          placeholder="Clínica Veterinaria..."
          {...form.getFieldProps('clinic_name')}
          error={form.touched.clinic_name ? form.errors.clinic_name?.message : undefined}
          containerClassName="space-y-2"
          required
        />

        <FormInput
          id="clinic_phone"
          type="tel"
          label="Teléfono de la Clínica"
          placeholder="+52 (555) 123-4567"
          {...form.getFieldProps('clinic_phone')}
          error={form.touched.clinic_phone ? form.errors.clinic_phone?.message : undefined}
          containerClassName="space-y-2"
          required
        />
      </div>

      <hr className="my-6" />

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Datos del Propietario</h3>

        <FormInput
          id="owner_name"
          type="text"
          label="Nombre Completo"
          placeholder="Tu nombre completo"
          {...form.getFieldProps('owner_name')}
          error={form.touched.owner_name ? form.errors.owner_name?.message : undefined}
          containerClassName="space-y-2"
          required
        />

        <FormInput
          id="owner_email"
          type="email"
          label="Email"
          placeholder="correo@ejemplo.com"
          {...form.getFieldProps('owner_email')}
          error={form.touched.owner_email ? form.errors.owner_email?.message : undefined}
          containerClassName="space-y-2"
          required
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Seguridad</h3>

        <FormInput
          id="password"
          type="password"
          label="Contraseña"
          placeholder="••••••••"
          helperText="Mínimo 8 caracteres, mayúscula, número y carácter especial"
          {...form.getFieldProps('password')}
          error={form.touched.password ? form.errors.password?.message : undefined}
          containerClassName="space-y-2"
          required
        />

        <FormInput
          id="confirm_password"
          type="password"
          label="Confirmar Contraseña"
          placeholder="••••••••"
          {...form.getFieldProps('confirm_password')}
          error={form.touched.confirm_password ? form.errors.confirm_password?.message : undefined}
          containerClassName="space-y-2"
          required
        />
      </div>

      <button
        type="submit"
        disabled={isLoading || form.isValidating}
        className="w-full rounded-lg bg-primary-600 px-4 py-3 text-white font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? 'Registrando...' : 'Crear Cuenta'}
      </button>

      <p className="text-center text-sm text-gray-600">
        ¿Ya tienes cuenta?{' '}
        <Link href="/auth/login" className="text-primary-600 hover:text-primary-700 font-medium">
          Inicia sesión aquí
        </Link>
      </p>
    </form>
  );
}
