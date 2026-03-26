'use client';

import React, { useEffect, useState } from 'react';
import { PermissionGate } from '@/components/PermissionGate';
import { MdAdd } from 'react-icons/md';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  clinic_id?: string;
  status: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Placeholder: In production, this would be an actual API call
        setUsers([
          { id: '1', name: 'Admin User', email: 'superAdmin@Groober.com', role: 'superadmin', status: 'ACTIVE' },
          { id: '2', name: 'Dr. García', email: 'garcia@clinica.com', role: 'owner', clinic_id: '1', status: 'ACTIVE' },
          { id: '3', name: 'Enfermera Silva', email: 'silva@clinica.com', role: 'staff', clinic_id: '1', status: 'ACTIVE' },
          { id: '4', name: 'Dr. López', email: 'lopez@vetcare.com', role: 'owner', clinic_id: '2', status: 'ACTIVE' },
        ]);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return (
    <>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Usuarios</h2>
          <PermissionGate require={{ permissions: ['users:create'] }}>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold">
              <MdAdd size={20} />
              Nuevo Usuario
            </button>
          </PermissionGate>
        </div>

        {/* Table */}
        {!loading ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Nombre</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Rol</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Clínica</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Estado</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm text-gray-900 font-semibold">{user.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        user.role === 'SUPER_ADMIN' ? 'bg-red-100 text-red-800' :
                        user.role === 'CLINIC_OWNER' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{user.clinic_id || '-'}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button className="text-blue-600 hover:text-blue-800 font-semibold">Editar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-600">Cargando usuarios...</p>
          </div>
        )}
      </div>
    </>
  );
}
