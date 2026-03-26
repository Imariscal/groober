'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/dashboard/page-header/PageHeader';
import { MdCheckBox, MdCheckBoxOutlineBlank, MdLock, MdAdd, MdDelete, MdEdit, MdCheck, MdClose } from 'react-icons/md';
import toast from 'react-hot-toast';

interface Permission {
  id: string;
  code: string;
  name: string;
  description: string;
  resource: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: string[];
  usersCount: number;
  createdAt: string;
}

// Mock data - TODO: Fetch from API
const mockPermissions: Permission[] = [
  { id: '1', code: 'clinic.create', name: 'Crear Clínicas', description: 'Permite crear nuevas clínicas', resource: 'Clínicas' },
  { id: '2', code: 'clinic.read', name: 'Ver Clínicas', description: 'Permite ver información de clínicas', resource: 'Clínicas' },
  { id: '3', code: 'clinic.update', name: 'Editar Clínicas', description: 'Permite editar información de clínicas', resource: 'Clínicas' },
  { id: '4', code: 'clinic.delete', name: 'Eliminar Clínicas', description: 'Permite eliminar clínicas', resource: 'Clínicas' },
  { id: '5', code: 'clinic.suspend', name: 'Suspender Clínicas', description: 'Permite suspender clínicas', resource: 'Clínicas' },
  { id: '6', code: 'user.create', name: 'Crear Usuarios', description: 'Permite crear nuevos usuarios', resource: 'Usuarios' },
  { id: '7', code: 'user.read', name: 'Ver Usuarios', description: 'Permite ver información de usuarios', resource: 'Usuarios' },
  { id: '8', code: 'user.update', name: 'Editar Usuarios', description: 'Permite editar información de usuarios', resource: 'Usuarios' },
  { id: '9', code: 'user.delete', name: 'Eliminar Usuarios', description: 'Permite eliminar usuarios', resource: 'Usuarios' },
  { id: '10', code: 'report.read', name: 'Ver Reportes', description: 'Permite acceder a reportes', resource: 'Reportes' },
  { id: '11', code: 'report.export', name: 'Exportar Reportes', description: 'Permite exportar reportes', resource: 'Reportes' },
  { id: '12', code: 'audit.read', name: 'Ver Auditoría', description: 'Permite ver logs de auditoría', resource: 'Auditoría' },
];

const mockRoles: Role[] = [
  {
    id: '1',
    name: 'Super Admin',
    description: 'Acceso total a la plataforma',
    isSystem: true,
    permissions: mockPermissions.map(p => p.id),
    usersCount: 2,
    createdAt: '2025-01-01',
  },
  {
    id: '2',
    name: 'Admin',
    description: 'Administrador con permisos limitados',
    isSystem: true,
    permissions: ['1', '2', '3', '4', '6', '7', '8', '10', '12'],
    usersCount: 5,
    createdAt: '2025-01-05',
  },
  {
    id: '3',
    name: 'Operator',
    description: 'Operador básico del sistema',
    isSystem: true,
    permissions: ['2', '7', '10', '12'],
    usersCount: 15,
    createdAt: '2025-01-10',
  },
  {
    id: '4',
    name: 'Viewer',
    description: 'Solo lectura de la plataforma',
    isSystem: false,
    permissions: ['2', '10'],
    usersCount: 3,
    createdAt: '2025-02-01',
  },
];

export default function PermissionsPage() {
  const [roles, setRoles] = useState<Role[]>(mockRoles);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(roles[0]);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const pageHeader = {
    title: 'Gestión de Permisos',
    subtitle: 'Define roles y permisos personalizados para la plataforma',
    breadcrumbs: [
      { label: 'Plataforma', href: '/platform/dashboard' },
      { label: 'Gestión de Permisos' },
    ],
    primaryAction: {
      label: 'Nuevo Rol',
      onClick: () => {
        setEditingRole(null);
        setShowEditForm(true);
      },
      icon: <MdAdd />,
    },
  };

  // Get permissions by resource
  const permissionsByResource = useMemo(() => {
    const grouped: Record<string, Permission[]> = {};
    mockPermissions.forEach(p => {
      if (!grouped[p.resource]) grouped[p.resource] = [];
      grouped[p.resource].push(p);
    });
    return grouped;
  }, []);

  const handleTogglePermission = (roleId: string, permissionId: string) => {
    setRoles(roles.map(r => {
      if (r.id === roleId) {
        const hasPermission = r.permissions.includes(permissionId);
        return {
          ...r,
          permissions: hasPermission
            ? r.permissions.filter(p => p !== permissionId)
            : [...r.permissions, permissionId],
        };
      }
      return r;
    }));
    if (selectedRole?.id === roleId) {
      const updated = roles.find(r => r.id === roleId);
      if (updated) setSelectedRole(updated);
    }
    toast.success('Permiso actualizado');
  };

  const handleDeleteRole = (roleId: string) => {
    if (mockRoles.find(r => r.id === roleId)?.isSystem) {
      toast.error('No puedes eliminar un rol del sistema');
      return;
    }
    setRoles(roles.filter(r => r.id !== roleId));
    setSelectedRole(roles.find(r => r.id !== roleId) || roles[0]);
    toast.success('Rol eliminado');
  };

  return (
    <>
      <PageHeader {...pageHeader} />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Roles List */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-4">
            <h3 className="text-lg font-semibold text-slate-900">Roles</h3>
          </div>
          <div className="divide-y divide-slate-200 max-h-96 overflow-y-auto">
            {roles.map(role => (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role)}
                className={`w-full text-left px-6 py-3 transition ${
                  selectedRole?.id === role.id
                    ? 'bg-primary-50 border-l-4 border-primary-500 text-primary-700'
                    : 'hover:bg-slate-50'
                }`}
              >
                <p className="font-medium">{role.name}</p>
                <p className="text-xs text-slate-600 mt-1">
                  {role.usersCount} usuario{role.usersCount !== 1 ? 's' : ''}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Role Details */}
        {selectedRole && (
          <div className="xl:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
              {/* Header */}
              <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{selectedRole.name}</h3>
                  <p className="text-sm text-slate-600 mt-1">{selectedRole.description}</p>
                </div>
                <div className="flex gap-2">
                  {!selectedRole.isSystem && (
                    <>
                      <button
                        onClick={() => {
                          setEditingRole(selectedRole);
                          setShowEditForm(true);
                        }}
                        className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                        title="Editar"
                      >
                        <MdEdit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteRole(selectedRole.id)}
                        className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"
                        title="Eliminar"
                      >
                        <MdDelete className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Permissions by Resource */}
              <div className="divide-y divide-slate-200">
                {Object.entries(permissionsByResource).map(([resource, permissions]) => (
                  <div key={resource} className="p-6">
                    <h4 className="font-semibold text-slate-900 mb-4">{resource}</h4>
                    <div className="space-y-3">
                      {permissions.map(permission => (
                        <label
                          key={permission.id}
                          className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-slate-50 transition"
                        >
                          <input
                            type="checkbox"
                            checked={selectedRole.permissions.includes(permission.id)}
                            onChange={() => handleTogglePermission(selectedRole.id, permission.id)}
                            disabled={selectedRole.isSystem}
                            className="mt-1 w-4 h-4 rounded border-slate-300"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-slate-900">{permission.name}</p>
                            <p className="text-sm text-slate-600">{permission.description}</p>
                          </div>
                          {selectedRole.permissions.includes(permission.id) && (
                            <MdCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* System Role Badge */}
              {selectedRole.isSystem && (
                <div className="px-6 py-4 bg-blue-50 border-t border-slate-200 text-xs text-blue-700">
                  ℹ️ Este es un rol del sistema y no puede ser modificado
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* TODO: Implement create/edit role modal */}
    </>
  );
}
