'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useFormValidation } from '@/hooks/useFormValidation';
import { LoginSchema, LoginFormData } from '@/lib/validations';
import { FormInput } from './FormFields';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight } from 'react-icons/fi';

export function ModernLoginForm() {
  const { login, isLoading, error: authError } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const form = useFormValidation<LoginFormData>(
    { email: '', password: '' },
    LoginSchema
  );

  // Calcular si el formulario es válido
  const isFormValid =
    form.values.email.trim() !== '' &&
    form.values.password.trim() !== '' &&
    !form.errors.email &&
    !form.errors.password;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const isValid = await form.validate();
    if (!isValid) {
      toast.error('Por favor, completa todos los campos correctamente');
      return;
    }

    try {
      await login(form.values.email, form.values.password, rememberMe);
      toast.success('¡Bienvenido!');
      // Reset form immediately after successful login
      form.resetForm();
      setRememberMe(false);
      // Clear form error state as well
      setFormError(null);
    } catch (err) {
      const message = authError || 'Error en el login. Verifica tus credenciales';
      setFormError(message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {(formError || authError) && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">{formError || authError}</p>
          </div>
          <button
            onClick={() => setFormError(null)}
            className="text-red-400 hover:text-red-500"
          >
            ✕
          </button>
        </div>
      )}

      {/* Email Field */}
      <div className="relative group">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Correo Electrónico <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <FiMail className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
          <input
            type="email"
            placeholder="tu@clinica.com"
            {...form.getFieldProps('email')}
            onBlur={(e) => {
              form.setFieldTouched('email', true);
              form.validateField('email', form.values.email);
            }}
            className={`w-full pl-12 pr-4 py-3 border rounded-lg outline-none transition-all ${
              form.touched.email && form.errors.email
                ? 'border-red-500 bg-red-50 focus:ring-2 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            }`}
          />
        </div>
        {form.touched.email && form.errors.email && (
          <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
            <span>⚠</span> {form.errors.email.message}
          </p>
        )}
      </div>

      {/* Password Field */}
      <div className="relative group">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Contraseña <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <FiLock className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            {...form.getFieldProps('password')}
            onBlur={(e) => {
              form.setFieldTouched('password', true);
              form.validateField('password', form.values.password);
            }}
            className={`w-full pl-12 pr-12 py-3 border rounded-lg outline-none transition-all ${
              form.touched.password && form.errors.password
                ? 'border-red-500 bg-red-50 focus:ring-2 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
          </button>
        </div>
        {form.touched.password && form.errors.password && (
          <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
            <span>⚠</span> {form.errors.password.message}
          </p>
        )}
      </div>

      {/* Remember & Forgot */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer group">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer"
          />
          <span className="text-sm text-gray-600 group-hover:text-gray-700">Recuérdame</span>
        </label>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!isFormValid || isLoading || form.isValidating}
        className={`w-full font-bold py-3 px-4 rounded-xl transition-all duration-200 transform shadow-lg flex items-center justify-center gap-2 text-white text-lg ${
          !isFormValid || isLoading || form.isValidating
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 hover:-translate-y-1 hover:shadow-2xl'
        }`}
      >
        {isLoading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Iniciando sesión...
          </>
        ) : (
          <>
            🐾 Ingresar a Groober
            <FiArrowRight size={20} />
          </>
        )}
      </button>

      {/* Divider */}
   
      {/* Register Link */}
     
    </form>
  );
}
