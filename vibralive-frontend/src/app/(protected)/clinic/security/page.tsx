'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { PermissionGateRoute } from '@/components/PermissionGateRoute';
import { PermissionGate } from '@/components/PermissionGate';
import { usePermissions } from '@/hooks/usePermissions';
import { clinicUsersApi } from '@/api/clinic-users-api';
import { ClinicUser, RoleWithPermissions } from '@/types';
import { UsersTab } from '@/components/security/UsersTab';
import { RolesTab } from '@/components/security/RolesTab';
import toast from 'react-hot-toast';

type TabType = 'users' | 'roles';

interface SubMenuItem {
  id: TabType;
  label: string;
  disabled: boolean;
}

const SUB_MENU: SubMenuItem[] = [
  { id: 'users', label: 'Usuarios', disabled: false },
  { id: 'roles', label: 'Roles', disabled: false },
];

function SecurityPageContent() {
  const { has } = usePermissions();
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [users, setUsers] = useState<ClinicUser[]>([]);
  const [roles, setRoles] = useState<RoleWithPermissions[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);

  // Load users
  const loadUsers = useCallback(async () => {
    try {
      setIsLoadingUsers(true);
      const data = await clinicUsersApi.listUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Error al cargar usuarios');
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Load roles when switching to that tab
  useEffect(() => {
    if (activeTab === 'roles' && roles.length === 0) {
      loadRoles();
    }
  }, [activeTab, roles.length]);

  const loadRoles = async () => {
    try {
      setIsLoadingRoles(true);
      const data = await clinicUsersApi.listRoles();
      setRoles(data);
    } catch (error) {
      console.error('Error loading roles:', error);
      toast.error('Error al cargar roles');
    } finally {
      setIsLoadingRoles(false);
    }
  };

  const handleUserCreated = () => {
    loadUsers();
  };

  const handleUserUpdated = () => {
    loadUsers();
  };

  const handleUserDeactivated = async (userId: string) => {
    try {
      await clinicUsersApi.deactivateUser(userId);
      loadUsers();
    } catch (error) {
      console.error('Error deactivating user:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Seguridad</h1>
        <p className="text-gray-600">Administra usuarios y permisos de tu clínica</p>
      </div>

      {/* Main Container - 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar - Sub Menu */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <nav className="space-y-2">
              {SUB_MENU.map((item) => (
                <button
                  key={item.id}
                  onClick={() => !item.disabled && setActiveTab(item.id)}
                  disabled={item.disabled}
                  className={`w-full text-left px-4 py-3 rounded-lg transition font-medium text-sm ${
                    activeTab === item.id && !item.disabled
                      ? 'bg-primary-100 text-primary-700 border-l-4 border-primary-600'
                      : item.disabled
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Right Content - Tab Content */}
        <div className="lg:col-span-3">
          {activeTab === 'users' && (
            <UsersTab
              users={users}
              roles={roles.length > 0 ? roles : undefined}
              isLoading={isLoadingUsers}
              onUserCreated={handleUserCreated}
              onUserUpdated={handleUserUpdated}
              onUserDeactivated={handleUserDeactivated}
              onLoadRoles={loadRoles}
            />
          )}

          {activeTab === 'roles' && (
            <RolesTab
              roles={roles}
              isLoading={isLoadingRoles}
              onRolesChange={loadRoles}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function SecurityPage() {
  return (
    <PermissionGateRoute permissions={['users:read']}>
      <SecurityPageContent />
    </PermissionGateRoute>
  );
}
