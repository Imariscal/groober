'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useFormValidation } from '@/hooks/useFormValidation';
import { LoginSchema, LoginFormData } from '@/lib/validations';
import { FormInput, InfoAlert } from './FormFields';
import toast from 'react-hot-toast';
import { useState } from 'react';

export function LoginForm() {
  const { login, isLoading, error: authError } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useFormValidation<LoginFormData>(
    { email: '', password: '' },
    LoginSchema
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
      await login(form.values.email, form.values.password);
      toast.success('¡Login exitoso!');
      form.resetForm();
    } catch (err) {
      const message = authError || 'Error en el login. Verifica tus credenciales';
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

      <FormInput
        id="email"
        type="email"
        label="Email"
        placeholder="correo@ejemplo.com"
        {...form.getFieldProps('email')}
        error={form.touched.email ? form.errors.email?.message : undefined}
        containerClassName="space-y-2"
      />

      <FormInput
        id="password"
        type="password"
        label="Contraseña"
        placeholder="••••••••"
        {...form.getFieldProps('password')}
        error={form.touched.password ? form.errors.password?.message : undefined}
        containerClassName="space-y-2"
      />

      <button
        type="submit"
        disabled={isLoading || form.isValidating}
        className="w-full rounded-lg bg-primary-600 px-4 py-2 text-white font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
      </button>

      <p className="text-center text-sm text-gray-600">
        ¿No tienes cuenta?{' '}
        <Link href="/auth/register" className="text-primary-600 hover:text-primary-700 font-medium">
          Regístrate aquí
        </Link>
      </p>
    </form>
  );
}
