'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { MdLock, MdAdd, MdEdit, MdDelete, MdCheck, MdInfo } from 'react-icons/md';
import { RoleWithPermissions, Permission } from '@/types';
import { CreateRoleModal } from './CreateRoleModal';
import { clinicUsersApi } from '@/api/clinic-users-api';
import toast from 'react-hot-toast';

interface RolesTabProps {
  roles: RoleWithPermissions[];
  isLoading: boolean;
  onRolesChange?: () => void;
}

// Permission descriptions for display
const PERMISSION_DESCRIPTIONS: Record<string, string> = {
  USER_CREATE: 'Permite crear nuevos usuarios en la clínica',
  USER_READ: 'Permite ver información de usuarios',
  USER_UPDATE: 'Permite editar información de usuarios',
  USER_DEACTIVATE: 'Permite desactivar usuarios',
  CLIENT_CREATE: 'Permite registrar nuevos clientes',
  CLIENT_READ: 'Permite ver información de clientes',
  CLIENT_UPDATE: 'Permite editar información de clientes',
  CLIENT_DELETE: 'Permite eliminar clientes',
  PET_CREATE: 'Permite registrar nuevas mascotas',
  PET_READ: 'Permite ver información de mascotas',
  PET_UPDATE: 'Permite editar información de mascotas',
  PET_DELETE: 'Permite eliminar mascotas',
  APPOINTMENT_CREATE: 'Permite crear nuevas citas',
  APPOINTMENT_READ: 'Permite ver citas programadas',
  APPOINTMENT_UPDATE: 'Permite modificar citas existentes',
  APPOINTMENT_CANCEL: 'Permite cancelar citas',
  STYLIST_READ: 'Permite ver información de estilistas',
  STYLIST_UPDATE: 'Permite editar perfil de estilistas',
  SERVICE_CREATE: 'Permite crear nuevos servicios',
  SERVICE_READ: 'Permite ver catálogo de servicios',
  SERVICE_UPDATE: 'Permite editar servicios',
  SERVICE_DELETE: 'Permite eliminar servicios',
  PRICING_MANAGE: 'Permite gestionar listas de precios',
  CLINIC_SETTINGS_READ: 'Permite ver configuración de la clínica',
  CLINIC_SETTINGS_UPDATE: 'Permite modificar configuración de la clínica',
  REPORTS_VIEW: 'Permite acceder a reportes y estadísticas',
};

// Category labels in Spanish
const CATEGORY_LABELS: Record<string, string> = {
  users: 'Usuarios',
  clients: 'Clientes',
  pets: 'Mascotas',
  appointments: 'Citas',
  stylists: 'Estilistas',
  services: 'Servicios',
  clinic: 'Clínica',
  general: 'General',
};

export const RolesTab: React.FC<RolesTabProps> = ({ roles, isLoading, onRolesChange }) => {
  const [selectedRole, setSelectedRole] = useState<RoleWithPermissions | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleWithPermissions | null>(null);
  const [deletingRoleId, setDeletingRoleId] = useState<string | null>(null);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);

  // Select first role by default when roles load
  useEffect(() => {
    if (roles.length > 0 && !selectedRole) {
      setSelectedRole(roles[0]);
    }
    // Update selectedRole if it was modified
    if (selectedRole) {
      const updated = roles.find(r => r.id === selectedRole.id);
      if (updated) setSelectedRole(updated);
    }
  }, [roles]);

  // Load all permissions for display
  useEffect(() => {
    const loadPermissions = async () => {
      try {
        const perms = await clinicUsersApi.listPermissions();
        setAllPermissions(perms);
      } catch (error) {
        console.error('Error loading permissions:', error);
      }
    };
    loadPermissions();
  }, []);

  // Group permissions by category
  const permissionsByCategory = useMemo(() => {
    const grouped: Record<string, Permission[]> = {};
    allPermissions.forEach(p => {
      const category = p.category || 'general';
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(p);
    });
    return grouped;
  }, [allPermissions]);

  const handleCreateRole = () => {
    setEditingRole(null);
    setIsModalOpen(true);
  };

  const handleEditRole = (role: RoleWithPermissions) => {
    setEditingRole(role);
    setIsModalOpen(true);
  };

  const handleDeleteRole = async (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (role?.isSystem) {
      toast.error('No puedes eliminar un rol del sistema');
      return;
    }
    if (!confirm('¿Estás seguro de eliminar este rol?')) return;

    setDeletingRoleId(roleId);
    try {
      await clinicUsersApi.deleteRole(roleId);
      // Select another role after deletion
      const remaining = roles.filter(r => r.id !== roleId);
      setSelectedRole(remaining[0] || null);
      onRolesChange?.();
    } catch (error) {
      console.error('Error deleting role:', error);
    } finally {
      setDeletingRoleId(null);
    }
  };

  const handleModalSuccess = () => {
    onRolesChange?.();
  };

  // Check if a permission is granted to the selected role
  const hasPermission = (permissionCode: string) => {
    if (!selectedRole) return false;
    return selectedRole.permissions.some(p => 
      typeof p === 'string' ? p === permissionCode : p.code === permissionCode
    );
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Gestión de Roles</h2>
          <p className="text-sm text-gray-500 mt-1">
            Define roles y permisos personalizados para tu clínica
          </p>
        </div>
        <button
          onClick={handleCreateRole}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
        >
          <MdAdd size={20} />
          Nuevo Rol
        </button>
      </div>

      {/* Main Grid - Similar to Platform */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Roles List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200 px-6 py-4">
            <h3 className="text-lg font-semibold text-gray-900">Roles</h3>
            <p className="text-xs text-gray-500 mt-1">{roles.length} rol{roles.length !== 1 ? 'es' : ''}</p>
          </div>
          <div className="divide-y divide-gray-200 max-h-[500px] overflow-y-auto">
            {roles.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                No hay roles configurados
              </div>
            ) : (
              roles.map(role => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role)}
                  className={`w-full text-left px-6 py-4 transition ${
                    selectedRole?.id === role.id
                      ? 'bg-primary-50 border-l-4 border-primary-500'
                      : 'hover:bg-gray-50 border-l-4 border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className={`font-medium ${selectedRole?.id === role.id ? 'text-primary-700' : 'text-gray-900'}`}>
                          {role.name}
                        </p>
                        {role.isSystem && (
                          <MdLock className="text-gray-400" size={14} />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {role.permissions.length} permiso{role.permissions.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    {!role.isSystem && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-medium rounded">
                        Custom
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Role Details */}
        {selectedRole ? (
          <div className="xl:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Header */}
              <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900">{selectedRole.name}</h3>
                    {selectedRole.isSystem && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                        Sistema
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{selectedRole.description}</p>
                </div>
                <div className="flex gap-2">
                  {!selectedRole.isSystem && (
                    <>
                      <button
                        onClick={() => handleEditRole(selectedRole)}
                        className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                        title="Editar"
                      >
                        <MdEdit size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteRole(selectedRole.id)}
                        disabled={deletingRoleId === selectedRole.id}
                        className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition disabled:opacity-50"
                        title="Eliminar"
                      >
                        {deletingRoleId === selectedRole.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600" />
                        ) : (
                          <MdDelete size={18} />
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Permissions by Category */}
              <div className="divide-y divide-gray-200 max-h-[450px] overflow-y-auto">
                {Object.entries(permissionsByCategory).map(([category, permissions]) => (
                  <div key={category} className="p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">
                      {CATEGORY_LABELS[category] || category}
                    </h4>
                    <div className="space-y-3">
                      {permissions.map(permission => {
                        const isGranted = hasPermission(permission.code);
                        return (
                          <div
                            key={permission.code}
                            className={`flex items-start gap-3 p-3 rounded-lg transition ${
                              isGranted ? 'bg-green-50' : 'bg-gray-50'
                            }`}
                          >
                            <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${
                              isGranted 
                                ? 'bg-green-500 text-white' 
                                : 'bg-gray-300 text-gray-500'
                            }`}>
                              {isGranted && <MdCheck size={14} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`font-medium ${isGranted ? 'text-green-900' : 'text-gray-600'}`}>
                                {permission.name}
                              </p>
                              <p className={`text-sm ${isGranted ? 'text-green-700' : 'text-gray-500'}`}>
                                {permission.description || PERMISSION_DESCRIPTIONS[permission.code] || ''}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {Object.keys(permissionsByCategory).length === 0 && (
                  <div className="p-6 text-center text-gray-500">
                    Cargando permisos...
                  </div>
                )}
              </div>

              {/* System Role Badge */}
              {selectedRole.isSystem && (
                <div className="px-6 py-4 bg-blue-50 border-t border-gray-200 flex items-center gap-2">
                  <MdInfo className="text-blue-500" size={18} />
                  <span className="text-sm text-blue-700">
                    Este es un rol del sistema y no puede ser modificado
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="xl:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center text-gray-500">
              Selecciona un rol para ver sus permisos
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Role Modal */}
      <CreateRoleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
        editingRole={editingRole}
      />
    </div>
  );
};
