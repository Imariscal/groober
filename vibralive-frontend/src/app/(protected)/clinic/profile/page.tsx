'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { MdSave, MdEmail, MdPhone, MdLocationOn, MdPerson, MdLock, MdCheckCircle, MdVisibility, MdVisibilityOff } from 'react-icons/md';
import toast from 'react-hot-toast';

interface UserProfileForm {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
}

interface ChangePasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function UserProfilePage() {
  const { user, updateUser, refreshUser } = useAuth();
  const { has } = usePermissions();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState<UserProfileForm>({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
    postalCode: user?.postal_code || '',
    country: user?.country || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Password change states
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isChangingPasswordLoading, setIsChangingPasswordLoading] = useState(false);
  const [passwordForm, setPasswordForm] = useState<ChangePasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Cargar datos frescos del usuario al montar el componente
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setIsLoading(true);
        await refreshUser();
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        postalCode: user.postal_code || '',
        country: user.country || '',
      });
    }
  }, [user]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }
    if (formData.phone && !/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'El teléfono no es válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Por favor corrige los errores en el formulario');
      return;
    }

    setIsSaving(true);
    try {
      const { authApi } = await import('@/lib/auth-api');
      
      // Solo envía los campos que realmente cambiaron
      const payload: any = {};
      
      if (formData.name !== (user?.name || '')) payload.name = formData.name;
      if (formData.email !== (user?.email || '')) payload.email = formData.email;
      if (formData.phone !== (user?.phone || '')) payload.phone = formData.phone;
      if (formData.address !== (user?.address || '')) payload.address = formData.address;
      if (formData.city !== (user?.city || '')) payload.city = formData.city;
      if (formData.postalCode !== (user?.postal_code || '')) payload.postalCode = formData.postalCode;
      if (formData.country !== (user?.country || '')) payload.country = formData.country;

      // Si no hay cambios, mostrar mensaje
      if (Object.keys(payload).length === 0) {
        toast.info('No hay cambios para guardar');
        return;
      }

      const updatedUser = await authApi.updateProfile(payload);

      // Actualizar el usuario en el contexto y localStorage
      updateUser({
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        address: updatedUser.address,
        city: updatedUser.city,
        postal_code: updatedUser.postal_code,
        country: updatedUser.country,
      });

      toast.success('Perfil actualizado exitosamente');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(
        error instanceof Error ? error.message : 'Error al actualizar perfil'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Limpiar errores cuando el usuario empieza a escribir
    if (passwordErrors[name]) {
      setPasswordErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validatePasswordForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!passwordForm.currentPassword.trim()) {
      newErrors.currentPassword = 'La contraseña actual es requerida';
    }
    if (!passwordForm.newPassword.trim()) {
      newErrors.newPassword = 'La nueva contraseña es requerida';
    } else if (passwordForm.newPassword.length < 8) {
      newErrors.newPassword = 'La contraseña debe tener al menos 8 caracteres';
    }
    if (!passwordForm.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Debe confirmar la contraseña';
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }
    if (passwordForm.currentPassword === passwordForm.newPassword) {
      newErrors.newPassword = 'La nueva contraseña debe ser diferente a la actual';
    }

    setPasswordErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePasswordForm()) {
      toast.error('Por favor corrige los errores en el formulario');
      return;
    }

    setIsChangingPasswordLoading(true);
    try {
      const { authApi } = await import('@/lib/auth-api');
      await authApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      toast.success('Contraseña cambiada exitosamente');
      setIsChangingPassword(false);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setPasswordErrors({});
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error(
        error instanceof Error ? error.message : 'Error al cambiar la contraseña'
      );
    } finally {
      setIsChangingPasswordLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          {/* Header Section */}
          <div className="border-b border-gray-200 px-6 py-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <MdPerson className="w-8 h-8 text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-gray-900 truncate">{formData.name}</h1>
                <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                  <MdEmail className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{formData.email}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Formulario de Edición de Perfil */}
          <form onSubmit={handleSubmit} className="px-6 py-8 space-y-8">
            {/* Información Personal */}
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <MdPerson className="w-5 h-5 text-blue-600" />
                Información Personal
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre Completo *
                  </label>
                  <input
                    id="name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-md text-sm bg-white transition-colors focus:outline-none focus:ring-2 ${
                      errors.name
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-300 bg-red-50'
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-300'
                    }`}
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-md text-sm bg-white transition-colors focus:outline-none focus:ring-2 ${
                      errors.email
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-300 bg-red-50'
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-300'
                    }`}
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>
              </div>
            </div>

            {/* Información de Contacto */}
            <div className="space-y-6 border-t border-gray-200 pt-8">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <MdPhone className="w-5 h-5 text-blue-600" />
                Información de Contacto
              </h2>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono
                </label>
                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-md text-sm bg-white transition-colors focus:outline-none focus:ring-2 ${
                    errors.phone
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-300 bg-red-50'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-300'
                  }`}
                />
                {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
              </div>
            </div>

            {/* Dirección */}
            <div className="space-y-6 border-t border-gray-200 pt-8">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <MdLocationOn className="w-5 h-5 text-blue-600" />
                Dirección
              </h2>
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                  Calle y Número
                </label>
                <input
                  id="address"
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-300"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                    Ciudad
                  </label>
                  <input
                    id="city"
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-300"
                  />
                </div>

                <div>
                  <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-2">
                    Código Postal
                  </label>
                  <input
                    id="postalCode"
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-300"
                  />
                </div>

                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                    País
                  </label>
                  <input
                    id="country"
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-300"
                  />
                </div>
              </div>
            </div>

            {/* Footer con Button */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
              >
                <MdSave className="w-4 h-4" />
                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>

        {/* Formulario Cambiar Contraseña */}
        {isChangingPassword && (
          <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden mt-6">
            {/* Header */}
            <div className="border-b border-gray-200 px-6 py-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-3">
                <MdLock className="w-6 h-6 text-blue-600" />
                Cambiar Contraseña
              </h2>
            </div>

            {/* Content */}
            <form onSubmit={handleChangePassword} className="px-6 py-8 space-y-6">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña Actual *
                </label>
                <div className="relative">
                  <input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    name="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="Ingresa tu contraseña actual"
                    className={`w-full px-4 py-2 border rounded-md text-sm bg-white transition-colors focus:outline-none focus:ring-2 pr-10 ${
                      passwordErrors.currentPassword
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-300 bg-red-50'
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showCurrentPassword ? (
                      <MdVisibilityOff className="w-5 h-5" />
                    ) : (
                      <MdVisibility className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {passwordErrors.currentPassword && (
                  <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword}</p>
                )}
              </div>

              <div className="border-t border-gray-200 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Nueva Contraseña *
                  </label>
                  <div className="relative">
                    <input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      name="newPassword"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                      placeholder="Mínimo 8 caracteres"
                      className={`w-full px-4 py-2 border rounded-md text-sm bg-white transition-colors focus:outline-none focus:ring-2 pr-10 ${
                        passwordErrors.newPassword
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-300 bg-red-50'
                          : 'border-gray-300 focus:ring-blue-500 focus:border-blue-300'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showNewPassword ? (
                        <MdVisibilityOff className="w-5 h-5" />
                      ) : (
                        <MdVisibility className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {passwordErrors.newPassword && (
                    <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword}</p>
                  )}
                  <p className="mt-2 text-xs text-gray-500">Mínimo 8 caracteres</p>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmar Contraseña *
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordChange}
                      placeholder="Repite tu nueva contraseña"
                      className={`w-full px-4 py-2 border rounded-md text-sm bg-white transition-colors focus:outline-none focus:ring-2 pr-10 ${
                        passwordErrors.confirmPassword
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-300 bg-red-50'
                          : 'border-gray-300 focus:ring-blue-500 focus:border-blue-300'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? (
                        <MdVisibilityOff className="w-5 h-5" />
                      ) : (
                        <MdVisibility className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {passwordErrors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword}</p>
                  )}
                </div>
              </div>

              {/* Footer con Botones */}
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsChangingPassword(false);
                    setPasswordForm({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: '',
                    });
                    setPasswordErrors({});
                  }}
                  disabled={isChangingPasswordLoading}
                  className="px-6 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 active:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isChangingPasswordLoading}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                >
                  <MdCheckCircle className="w-4 h-4" />
                  {isChangingPasswordLoading ? 'Actualizando...' : 'Actualizar Contraseña'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Botón Cambiar Contraseña - Solo visible cuando NO está en modo cambio */}
        {!isChangingPassword && (
          <div className="mt-6">
            <button
              type="button"
              onClick={() => setIsChangingPassword(true)}
              className="flex items-center gap-2 px-6 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 active:bg-gray-300 transition-colors font-medium text-sm"
            >
              <MdLock className="w-4 h-4" />
              Cambiar Contraseña
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
