'use client';

import React, { useState, useEffect } from 'react';
import { MdClose } from 'react-icons/md';
import toast from 'react-hot-toast';
import {
  createPlatformUser,
  updatePlatformUser,
  type CreatePlatformUserPayload,
  type UpdatePlatformUserPayload,
  type PlatformUser,
} from '@/lib/platformApi';

interface CreatePlatformUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user?: PlatformUser | null;
}

interface FormTouched {
  fullName: boolean;
  email: boolean;
  password: boolean;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  password?: string;
}

// Validación de email
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const CreatePlatformUserModal: React.FC<CreatePlatformUserModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  user,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState<FormTouched>({
    fullName: false,
    email: false,
    password: false,
  });

  const isEditing = !!user?.id;

  // Cargar datos del usuario si es edición
  useEffect(() => {
    if (isOpen) {
      if (user) {
        setFullName(user.full_name || '');
        setEmail(user.email || '');
        setPassword('');
      } else {
        setFullName('');
        setEmail('');
        setPassword('');
      }
      setTouched({
        fullName: false,
        email: false,
        password: false,
      });
    }
  }, [user, isOpen]);

  // Validaciones
  const validateField = (name: keyof FormErrors, value: string): string => {
    switch (name) {
      case 'fullName':
        if (!value || value.trim().length < 3) {
          return 'El nombre debe tener al menos 3 caracteres';
        }
        return '';
      
      case 'email':
        if (!value) {
          return 'El correo electrónico es requerido';
        } else if (!isValidEmail(value)) {
          return 'Correo electrónico inválido';
        }
        return '';
      
      case 'password':
        if (!isEditing && !value) {
          return 'La contraseña es requerida';
        } else if (value && value.length < 8) {
          return 'La contraseña debe tener al menos 8 caracteres';
        }
        return '';
      
      default:
        return '';
    }
  };

  // Calcular errores
  const errors: FormErrors = {
    fullName: validateField('fullName', fullName),
    email: validateField('email', email),
    password: validateField('password', password),
  };

  // Determinar si mostrar error (solo si fue tocado)
  const showError = (field: keyof FormErrors): boolean => {
    return touched[field] && !!errors[field];
  };

  // Determinar si el formulario es válido
  const isFormValid =
    fullName.trim().length >= 3 &&
    email.trim().length > 0 &&
    (isEditing ? true : password.length >= 8) &&
    !errors.fullName &&
    !errors.email &&
    !errors.password;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'fullName') setFullName(value);
    if (name === 'email') setEmail(value);
    if (name === 'password') setPassword(value);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (isEditing && user) {
        // Actualizar usuario
        const payload: UpdatePlatformUserPayload = {
          full_name: fullName,
          email,
        };
        if (password) {
          payload.password = password;
        }
        await updatePlatformUser(user.id, payload);
      } else {
        // Crear nuevo usuario
        const payload: CreatePlatformUserPayload = {
          full_name: fullName,
          email,
          password,
        };
        await createPlatformUser(payload);
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      // El toast del error ya se muestra en las funciones de API
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4 border-b">
          <h2 className="text-xl font-bold text-white">
            {isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-white hover:text-gray-200 transition"
          >
            <MdClose className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Nombre Completo */}
          <div>
            <label
              htmlFor="fullName"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Nombre Completo *
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              value={fullName}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition ${
                showError('fullName')
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-slate-300 focus:ring-primary-500 focus:border-primary-500'
              }`}
              placeholder="Ej: Juan Pérez"
            />
            {showError('fullName') && (
              <p className="text-red-600 text-xs mt-1.5">{errors.fullName}</p>
            )}
          </div>

          {/* Correo Electrónico */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Correo Electrónico *
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition ${
                showError('email')
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-slate-300 focus:ring-primary-500 focus:border-primary-500'
              }`}
              placeholder="usuario@Groober.com"
            />
            {showError('email') && (
              <p className="text-red-600 text-xs mt-1.5">{errors.email}</p>
            )}
          </div>

          {/* Contraseña */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Contraseña {isEditing ? '(dejar vacío para mantener)' : '*'}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition ${
                showError('password')
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-slate-300 focus:ring-primary-500 focus:border-primary-500'
              }`}
              placeholder="Mínimo 8 caracteres"
            />
            {showError('password') && (
              <p className="text-red-600 text-xs mt-1.5">{errors.password}</p>
            )}
          </div>

          {/* Nota: Super Admin */}
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <p className="text-sm text-purple-700">
              👑 Este usuario tendrá permisos de <strong>Super Admin</strong>
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition ${
                !isFormValid || isSubmitting
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              }`}
            >
              {isSubmitting
                ? 'Guardando...'
                : isEditing
                  ? 'Actualizar'
                  : 'Crear Usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

