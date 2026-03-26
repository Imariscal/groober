'use client';

import React, { useState, useEffect } from 'react';
import { MdAdd, MdSearch, MdEdit, MdBlock, MdCheck, MdContentCut, MdLocalHospital } from 'react-icons/md';
import { ClinicUser, RoleWithPermissions } from '@/types';
import { CreateClinicUserModal } from './CreateClinicUserModal';
import { clinicUsersApi } from '@/api/clinic-users-api';

interface UsersTabProps {
  users: ClinicUser[];
  roles?: RoleWithPermissions[];
  isLoading: boolean;
  onUserCreated: () => void;
  onUserUpdated: () => void;
  onUserDeactivated: (userId: string) => void;
  onLoadRoles: () => void;
}

export const UsersTab: React.FC<UsersTabProps> = ({
  users,
  roles,
  isLoading,
  onUserCreated,
  onUserUpdated,
  onUserDeactivated,
  onLoadRoles,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ClinicUser | null>(null);
  const [availableRoles, setAvailableRoles] = useState<RoleWithPermissions[]>([]);

  // Load roles when modal opens
  useEffect(() => {
    if (isModalOpen && availableRoles.length === 0) {
      loadRoles();
    }
  }, [isModalOpen]);

  useEffect(() => {
    if (roles && roles.length > 0) {
      setAvailableRoles(roles);
    }
  }, [roles]);

  const loadRoles = async () => {
    try {
      const data = await clinicUsersApi.listRoles();
      setAvailableRoles(data);
    } catch (error) {
      console.error('Error loading roles:', error);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      !searchTerm ||
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = !statusFilter || user.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleOpenCreate = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: ClinicUser) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSuccess = () => {
    if (editingUser) {
      onUserUpdated();
    } else {
      onUserCreated();
    }
    handleCloseModal();
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      ACTIVE: 'bg-green-100 text-green-800',
      INVITED: 'bg-yellow-100 text-yellow-800',
      DEACTIVATED: 'bg-red-100 text-red-800',
    };
    const labels = {
      ACTIVE: 'Activo',
      INVITED: 'Invitado',
      DEACTIVATED: 'Desactivado',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  const getRoleBadges = (userRoles: { code: string; name: string }[]) => {
    return userRoles.map((role) => {
      const colorMap: Record<string, string> = {
        CLINIC_OWNER: 'bg-purple-100 text-purple-800',
        CLINIC_STAFF: 'bg-blue-100 text-blue-800',
        CLINIC_STYLIST: 'bg-pink-100 text-pink-800',
      };
      return (
        <span
          key={role.code}
          className={`px-2 py-0.5 rounded text-xs font-medium ${colorMap[role.code] || 'bg-gray-100 text-gray-700'}`}
        >
          {role.name}
        </span>
      );
    });
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
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Usuarios</h2>
              <p className="text-sm text-gray-500 mt-1">
                {users.length} usuario{users.length !== 1 ? 's' : ''} en tu clínica
              </p>
            </div>
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium"
            >
              <MdAdd size={20} />
              Nuevo Usuario
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2">
              <MdSearch className="text-gray-400 w-5 h-5 flex-shrink-0" />
              <input
                type="text"
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 border-none focus:outline-none focus:ring-0 text-sm"
              />
            </div>
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
            >
              <option value="">Todos los estados</option>
              <option value="ACTIVE">Activo</option>
              <option value="INVITED">Invitado</option>
              <option value="DEACTIVATED">Desactivado</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Roles
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Estilista
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Veterinario
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    {searchTerm || statusFilter
                      ? 'No se encontraron usuarios con los filtros seleccionados'
                      : 'No hay usuarios registrados'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-primary-700 font-semibold text-sm">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {getRoleBadges(user.roles)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(user.status)}
                    </td>
                    <td className="px-6 py-4">
                      {user.isStylist ? (
                        <div className="flex items-center gap-2">
                          <MdContentCut className="text-pink-500" size={18} />
                          <span className="text-sm text-gray-700">
                            {user.stylistProfile?.displayName || user.name}
                          </span>
                          {user.stylistProfile?.calendarColor && (
                            <span
                              className="w-4 h-4 rounded-full border border-gray-300"
                              style={{ backgroundColor: user.stylistProfile.calendarColor }}
                            />
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {user.isVeterinarian ? (
                        <div className="flex items-center gap-2">
                          <MdLocalHospital className="text-blue-600" size={18} />
                          <span className="text-sm text-gray-700">
                            {user.veterinarianProfile?.displayName || user.name}
                          </span>
                          {user.veterinarianProfile?.calendarColor && (
                            <span
                              className="w-4 h-4 rounded-full border border-gray-300"
                              style={{ backgroundColor: user.veterinarianProfile.calendarColor }}
                            />
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(user)}
                          className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition"
                          title="Editar"
                        >
                          <MdEdit size={18} />
                        </button>
                        {user.status !== 'DEACTIVATED' && (
                          <button
                            onClick={() => onUserDeactivated(user.id)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Desactivar"
                          >
                            <MdBlock size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <CreateClinicUserModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
        user={editingUser}
        roles={availableRoles}
      />
    </>
  );
};
