'use client';

import React, { useState, useEffect } from 'react';
import { MdClose, MdPerson, MdEmail, MdPhone, MdContentCut, MdColorLens, MdLocalHospital } from 'react-icons/md';
import { ClinicUser, RoleWithPermissions, CreateClinicUserPayload, UpdateClinicUserPayload } from '@/types';
import { clinicUsersApi } from '@/api/clinic-users-api';
import toast from 'react-hot-toast';

interface CreateClinicUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user?: ClinicUser | null;
  roles: RoleWithPermissions[];
}

// Predefined calendar colors for stylists
const CALENDAR_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
  '#FFEAA7', // Yellow
  '#DDA0DD', // Plum
  '#98D8C8', // Mint
  '#F7DC6F', // Gold
  '#BB8FCE', // Purple
  '#85C1E9', // Light Blue
];

export const CreateClinicUserModal: React.FC<CreateClinicUserModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  user,
  roles,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [stylistDisplayName, setStylistDisplayName] = useState('');
  const [stylistCalendarColor, setStylistCalendarColor] = useState(CALENDAR_COLORS[0]);
  const [veterinarianDisplayName, setVeterinarianDisplayName] = useState('');
  const [veterinarianCalendarColor, setVeterinarianCalendarColor] = useState(CALENDAR_COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!user?.id;
  const hasStylistRole = selectedRoles.includes('CLINIC_STYLIST');
  const hasVeterinarianRole = selectedRoles.includes('CLINIC_VETERINARIAN');

  // Reset/populate form when modal opens or user changes
  useEffect(() => {
    if (isOpen) {
      if (user) {
        setName(user.name);
        setEmail(user.email);
        setPhone(user.phone || '');
        setSelectedRoles(user.roles.map((r) => r.code));
        if (user.stylistProfile) {
          setStylistDisplayName(user.stylistProfile.displayName || '');
          setStylistCalendarColor(user.stylistProfile.calendarColor || CALENDAR_COLORS[0]);
        } else {
          setStylistDisplayName('');
          setStylistCalendarColor(CALENDAR_COLORS[0]);
        }
        if (user.veterinarianProfile) {
          setVeterinarianDisplayName(user.veterinarianProfile.displayName || '');
          setVeterinarianCalendarColor(user.veterinarianProfile.calendarColor || CALENDAR_COLORS[0]);
        } else {
          setVeterinarianDisplayName('');
          setVeterinarianCalendarColor(CALENDAR_COLORS[0]);
        }
      } else {
        setName('');
        setEmail('');
        setPhone('');
        setSelectedRoles(['CLINIC_STAFF']);
        setStylistDisplayName('');
        setStylistCalendarColor(CALENDAR_COLORS[0]);
        setVeterinarianDisplayName('');
        setVeterinarianCalendarColor(CALENDAR_COLORS[0]);
      }
    }
  }, [isOpen, user]);

  // Auto-populate stylist display name when name changes and stylist is selected
  useEffect(() => {
    if (hasStylistRole && !stylistDisplayName && name) {
      setStylistDisplayName(name);
    }
  }, [hasStylistRole, name, stylistDisplayName]);

  // Auto-populate veterinarian display name when name changes and veterinarian is selected
  useEffect(() => {
    if (hasVeterinarianRole && !veterinarianDisplayName && name) {
      setVeterinarianDisplayName(name);
    }
  }, [hasVeterinarianRole, name, veterinarianDisplayName]);

  const handleRoleToggle = (roleCode: string) => {
    setSelectedRoles((prev) => {
      if (prev.includes(roleCode)) {
        return prev.filter((r) => r !== roleCode);
      }
      return [...prev, roleCode];
    });
  };

  const isFormValid = () => {
    if (!name.trim() || name.length < 2) return false;
    if (!email.trim() || !email.includes('@')) return false;
    if (selectedRoles.length === 0) return false;
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditing && user) {
        // Update existing user
        const payload: UpdateClinicUserPayload = {
          name: name.trim(),
          phone: phone.trim() || undefined,
          roles: selectedRoles,
        };

        if (hasStylistRole) {
          payload.stylistProfile = {
            displayName: stylistDisplayName.trim() || name.trim(),
            calendarColor: stylistCalendarColor,
          };
        }

        if (hasVeterinarianRole) {
          payload.veterinarianProfile = {
            displayName: veterinarianDisplayName.trim() || name.trim(),
            calendarColor: veterinarianCalendarColor,
          };
        }

        await clinicUsersApi.updateUser(user.id, payload);
      } else {
        // Create new user
        const payload: CreateClinicUserPayload = {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          roles: selectedRoles,
        };

        if (hasStylistRole) {
          payload.stylistProfile = {
            displayName: stylistDisplayName.trim() || name.trim(),
            calendarColor: stylistCalendarColor,
          };
        }

        if (hasVeterinarianRole) {
          payload.veterinarianProfile = {
            displayName: veterinarianDisplayName.trim() || name.trim(),
            calendarColor: veterinarianCalendarColor,
          };
        }

        await clinicUsersApi.createUser(payload);
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error saving user:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
          <h2 className="text-xl font-bold text-white">
            {isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}
          </h2>
          <button onClick={onClose} className="p-2 text-white hover:text-gray-200 transition">
            <MdClose size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              Información Básica
            </h3>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre completo *
              </label>
              <div className="relative">
                <MdPerson className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nombre del usuario"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Email - disabled when editing */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correo electrónico *
              </label>
              <div className="relative">
                <MdEmail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  disabled={isEditing}
                  className={`w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    isEditing ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                  }`}
                  required
                />
              </div>
              {!isEditing && (
                <p className="text-xs text-gray-500 mt-1">
                  Se enviará una invitación a este correo para que el usuario establezca su contraseña
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <div className="relative">
                <MdPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="81 1234 5678"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Roles */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              Roles *
            </h3>
            <p className="text-sm text-gray-500">
              Selecciona uno o más roles para este usuario
            </p>
            <div className="grid grid-cols-1 gap-3">
              {roles
                .filter((role) => role.code !== 'CLINIC_OWNER') // Can't assign owner role manually
                .map((role) => {
                  const isSelected = selectedRoles.includes(role.code);
                  return (
                    <label
                      key={role.id}
                      className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleRoleToggle(role.code)}
                        className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{role.name}</p>
                        <p className="text-sm text-gray-500">{role.description}</p>
                      </div>
                    </label>
                  );
                })}
            </div>
          </div>

          {/* Stylist Profile - shown when CLINIC_STYLIST is selected */}
          {hasStylistRole && (
            <div className="space-y-4 p-4 bg-pink-50 rounded-lg border border-pink-200">
              <div className="flex items-center gap-2">
                <MdContentCut className="text-pink-500" size={20} />
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                  Perfil de Estilista
                </h3>
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre para mostrar
                </label>
                <input
                  type="text"
                  value={stylistDisplayName}
                  onChange={(e) => setStylistDisplayName(e.target.value)}
                  placeholder={name || 'Nombre del estilista'}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Este nombre aparecerá en el calendario de citas
                </p>
              </div>

              {/* Calendar Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color del calendario
                </label>
                <div className="flex flex-wrap gap-2">
                  {CALENDAR_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setStylistCalendarColor(color)}
                      className={`w-8 h-8 rounded-full transition-transform ${
                        stylistCalendarColor === color
                          ? 'ring-2 ring-offset-2 ring-gray-400 scale-110'
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <MdColorLens className="text-gray-400" size={16} />
                  <span className="text-sm text-gray-600">
                    Color seleccionado:
                  </span>
                  <span
                    className="w-4 h-4 rounded-full border border-gray-300"
                    style={{ backgroundColor: stylistCalendarColor }}
                  />
                  <span className="text-sm text-gray-500 font-mono">
                    {stylistCalendarColor}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Veterinarian Profile - shown when CLINIC_VETERINARIAN is selected */}
          {hasVeterinarianRole && (
            <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2">
                <MdLocalHospital className="text-blue-600" size={20} />
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                  Perfil de Veterinario
                </h3>
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre para mostrar
                </label>
                <input
                  type="text"
                  value={veterinarianDisplayName}
                  onChange={(e) => setVeterinarianDisplayName(e.target.value)}
                  placeholder={name || 'Nombre del veterinario'}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Este nombre aparecerá en el calendario de citas
                </p>
              </div>

              {/* Calendar Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color del calendario
                </label>
                <div className="flex flex-wrap gap-2">
                  {CALENDAR_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setVeterinarianCalendarColor(color)}
                      className={`w-8 h-8 rounded-full transition-transform ${
                        veterinarianCalendarColor === color
                          ? 'ring-2 ring-offset-2 ring-gray-400 scale-110'
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <MdColorLens className="text-gray-400" size={16} />
                  <span className="text-sm text-gray-600">
                    Color seleccionado:
                  </span>
                  <span
                    className="w-4 h-4 rounded-full border border-gray-300"
                    style={{ backgroundColor: veterinarianCalendarColor }}
                  />
                  <span className="text-sm text-gray-500 font-mono">
                    {veterinarianCalendarColor}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isFormValid()}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting
                ? 'Guardando...'
                : isEditing
                  ? 'Actualizar Usuario'
                  : 'Crear Usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
