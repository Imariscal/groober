'use client';

import React, { useState, useEffect } from 'react';
import { MdClose, MdSave, MdCheck } from 'react-icons/md';
import { RoleWithPermissions, Permission } from '@/types';
import { clinicUsersApi } from '@/api/clinic-users-api';
import toast from 'react-hot-toast';

interface CreateRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingRole?: RoleWithPermissions | null;
}

// Group permissions by category for display
const PERMISSION_CATEGORY_LABELS: Record<string, string> = {
  users: 'Usuarios',
  clients: 'Clientes',
  pets: 'Mascotas',
  appointments: 'Citas',
  stylists: 'Estilistas',
  services: 'Servicios',
  clinic: 'Clínica',
};

export const CreateRoleModal: React.FC<CreateRoleModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editingRole,
}) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);

  const isEditing = !!editingRole;

  // Load permissions on mount
  useEffect(() => {
    if (isOpen) {
      loadPermissions();
    }
  }, [isOpen]);

  // Populate form when editing
  useEffect(() => {
    if (editingRole) {
      setCode(editingRole.code);
      setName(editingRole.name);
      setDescription(editingRole.description || '');
      setSelectedPermissions(editingRole.permissions.map((p) => p.code));
    } else {
      resetForm();
    }
  }, [editingRole]);

  const loadPermissions = async () => {
    try {
      setIsLoadingPermissions(true);
      const permissions = await clinicUsersApi.listPermissions();
      setAllPermissions(permissions);
    } catch (error) {
      console.error('Error loading permissions:', error);
      toast.error('Error al cargar permisos');
    } finally {
      setIsLoadingPermissions(false);
    }
  };

  const resetForm = () => {
    setCode('');
    setName('');
    setDescription('');
    setSelectedPermissions([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const togglePermission = (permissionCode: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionCode)
        ? prev.filter((p) => p !== permissionCode)
        : [...prev, permissionCode]
    );
  };

  const toggleCategory = (category: string) => {
    const categoryPermissions = allPermissions
      .filter((p) => p.category === category)
      .map((p) => p.code);

    const allSelected = categoryPermissions.every((p) => selectedPermissions.includes(p));

    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((p) => !categoryPermissions.includes(p)));
    } else {
      setSelectedPermissions((prev) => [
        ...prev,
        ...categoryPermissions.filter((p) => !prev.includes(p)),
      ]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('El nombre del rol es requerido');
      return;
    }

    if (!isEditing && !code.trim()) {
      toast.error('El código del rol es requerido');
      return;
    }

    if (selectedPermissions.length === 0) {
      toast.error('Debe seleccionar al menos un permiso');
      return;
    }

    setIsLoading(true);

    try {
      if (isEditing && editingRole) {
        await clinicUsersApi.updateRole(editingRole.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          permissionCodes: selectedPermissions,
        });
      } else {
        await clinicUsersApi.createRole({
          code: code.trim().toUpperCase(),
          name: name.trim(),
          description: description.trim() || undefined,
          permissionCodes: selectedPermissions,
        });
      }
      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Error saving role:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Group permissions by category
  const permissionsByCategory = allPermissions.reduce(
    (acc, permission) => {
      const category = permission.category || 'other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(permission);
      return acc;
    },
    {} as Record<string, Permission[]>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">
            {isEditing ? 'Editar Rol' : 'Crear Nuevo Rol'}
          </h2>
          <button
            onClick={handleClose}
            className="text-white/80 hover:text-white transition"
          >
            <MdClose size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Basic Info */}
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))}
                  disabled={isEditing}
                  placeholder="EJ: CUSTOM_ROLE"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    isEditing ? 'bg-gray-100 text-gray-500' : ''
                  }`}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Solo mayúsculas, números y guiones bajos
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nombre del rol"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripción del rol (opcional)"
                rows={2}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {/* Permissions */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Permisos <span className="text-red-500">*</span>
            </h3>

            {isLoadingPermissions ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(permissionsByCategory).map(([category, permissions]) => {
                  const categoryLabel = PERMISSION_CATEGORY_LABELS[category] || category;
                  const allCategorySelected = permissions.every((p) =>
                    selectedPermissions.includes(p.code)
                  );
                  const someCategorySelected = permissions.some((p) =>
                    selectedPermissions.includes(p.code)
                  );

                  return (
                    <div
                      key={category}
                      className="border rounded-lg p-4 bg-gray-50"
                    >
                      {/* Category Header */}
                      <div className="flex items-center gap-3 mb-3">
                        <button
                          type="button"
                          onClick={() => toggleCategory(category)}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition ${
                            allCategorySelected
                              ? 'bg-primary-600 border-primary-600'
                              : someCategorySelected
                                ? 'bg-primary-200 border-primary-400'
                                : 'border-gray-300 hover:border-primary-500'
                          }`}
                        >
                          {(allCategorySelected || someCategorySelected) && (
                            <MdCheck className="text-white" size={14} />
                          )}
                        </button>
                        <span className="font-medium text-gray-900">{categoryLabel}</span>
                        <span className="text-sm text-gray-500">
                          ({permissions.filter((p) => selectedPermissions.includes(p.code)).length}/{permissions.length})
                        </span>
                      </div>

                      {/* Permissions Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-8">
                        {permissions.map((permission) => (
                          <label
                            key={permission.code}
                            className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded"
                          >
                            <input
                              type="checkbox"
                              checked={selectedPermissions.includes(permission.code)}
                              onChange={() => togglePermission(permission.code)}
                              className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                            />
                            <div>
                              <span className="text-sm text-gray-700">{permission.name}</span>
                              {permission.description && (
                                <p className="text-xs text-gray-500">{permission.description}</p>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {selectedPermissions.length > 0 && (
              <p className="text-sm text-gray-600 mt-3">
                {selectedPermissions.length} permiso(s) seleccionado(s)
              </p>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="border-t px-6 py-4 bg-gray-50 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || isLoadingPermissions}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Guardando...
              </>
            ) : (
              <>
                <MdSave size={18} />
                {isEditing ? 'Guardar Cambios' : 'Crear Rol'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
