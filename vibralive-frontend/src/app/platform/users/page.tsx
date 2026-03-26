'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/dashboard/page-header/PageHeader';
import { MdEdit, MdDelete, MdAdd, MdSearch, MdKey, MdBlock } from 'react-icons/md';
import { useClinicTimezone } from '@/hooks/useClinicTimezone';
import { formatInTimeZone } from 'date-fns-tz';
import toast from 'react-hot-toast';
import { CreatePlatformUserModal } from '@/components/CreatePlatformUserModal';
import {
  listPlatformUsers,
  updatePlatformUser,
  deletePlatformUser,
  type PlatformUser,
} from '@/lib/platformApi';

interface Role {
  id: string;
  name: string;
  display_name: string;
}

const roleLabels: Record<string, string> = {
  super_admin: '👑 Super Admin',
  admin: '🔐 Administrador',
  support: '🎧 Soporte',
  viewer: '👤 Visualizador',
};

const roleColors: Record<string, string> = {
  super_admin: 'bg-purple-100 text-purple-800',
  admin: 'bg-blue-100 text-blue-800',
  support: 'bg-green-100 text-green-800',
  viewer: 'bg-gray-100 text-gray-800',
};

const statusLabels: Record<string, string> = {
  ACTIVE: 'Activo',
  SUSPENDED: 'Suspendido',
  DEACTIVATED: 'Desactivado',
  INVITED: 'Invitado',
};

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  SUSPENDED: 'bg-orange-100 text-orange-800',
  DEACTIVATED: 'bg-red-100 text-red-800',
  INVITED: 'bg-blue-100 text-blue-800',
};

export default function UsersPage() {
  const clinicTimezone = useClinicTimezone();
  
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<PlatformUser | null>(null);
  const [counts, setCounts] = useState({ total: 0, active: 0, suspended: 0 });

  // Fetch users from API
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await listPlatformUsers();
      setUsers(data.data || []);
      // Calcular conteos
      const active = (data.data || []).filter((u) => u.status === 'ACTIVE').length;
      const suspended = (data.data || []).filter((u) => u.status === 'SUSPENDED').length;
      setCounts({
        total: data.total || (data.data || []).length,
        active,
        suspended,
      });
    } catch (err) {
      console.error('Error fetching users:', err);
      // El toast del error ya se muestra en listPlatformUsers
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchSearch =
        user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'all' || user.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [users, searchTerm, statusFilter]);

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await updatePlatformUser(userId, { status: newStatus as 'ACTIVE' | 'SUSPENDED' });
      fetchUsers();
    } catch (err) {
      // El toast del error ya se muestra en updatePlatformUser
      console.error(err);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return;
    try {
      await deletePlatformUser(userId);
      fetchUsers();
    } catch (err) {
      // El toast del error ya se muestra en deletePlatformUser
      console.error(err);
    }
  };

  const handleEditUser = (user: PlatformUser) => {
    setEditingUser(user);
    setShowCreateModal(true);
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    setEditingUser(null);
    fetchUsers();
  };

  // Stats
  const stats = {
    total: counts.total,
    active: counts.active,
    suspended: counts.suspended,
  };

  const pageHeader = {
    title: 'Usuarios',
    subtitle: 'Gestiona los usuarios con acceso de administrador a la plataforma',
    breadcrumbs: [
      { label: 'Plataforma', href: '/platform/dashboard' },
      { label: 'Usuarios' },
    ],
    primaryAction: {
      label: 'Nuevo Usuario',
      onClick: () => {
        setEditingUser(null);
        setShowCreateModal(true);
      },
      icon: <MdAdd />,
    },
  };

  return (
    <>
      <PageHeader {...pageHeader} />
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <p className="text-sm text-slate-600 mb-1">Total Usuarios</p>
          <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <p className="text-sm text-slate-600 mb-1">Activos</p>
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <p className="text-sm text-slate-600 mb-1">Suspendidos</p>
          <p className="text-2xl font-bold text-orange-600">{stats.suspended}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="flex gap-3 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">Todos los estados</option>
            <option value="ACTIVE">Activos</option>
            <option value="SUSPENDED">Suspendidos</option>
          </select>

          <div className="ml-auto text-sm text-slate-600">
            Mostrando <span className="font-semibold">{filteredUsers.length}</span> de{' '}
            <span className="font-semibold">{users.length}</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-6 py-3 text-left font-semibold text-slate-900">Nombre</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-900">Email</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-900">Rol</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-900">Estado</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-900">Creado</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-900">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    Cargando usuarios...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No hay usuarios que coincidan con los filtros
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-slate-200 hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">{user.full_name}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                        👑 Super Admin
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          statusColors[user.status] || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {statusLabels[user.status] || user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-xs">
                      {formatInTimeZone(new Date(user.created_at), clinicTimezone, 'dd/MM/yyyy')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                          title="Editar"
                        >
                          <MdEdit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(user.id, user.status)}
                          className={`p-2 rounded-lg transition ${
                            user.status === 'ACTIVE'
                              ? 'text-orange-600 bg-orange-50 hover:bg-orange-100'
                              : 'text-green-600 bg-green-50 hover:bg-green-100'
                          }`}
                          title={user.status === 'ACTIVE' ? 'Suspender' : 'Activar'}
                        >
                          <MdBlock className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"
                          title="Eliminar"
                        >
                          <MdDelete className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de crear/editar usuario */}
      <CreatePlatformUserModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingUser(null);
        }}
        onSuccess={handleCreateSuccess}
        user={editingUser}
      />
    </>
  );
}
