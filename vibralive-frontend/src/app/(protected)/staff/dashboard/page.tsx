'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { PermissionGate } from '@/components/PermissionGate';
import { MdPeople, MdPets, MdAssignmentInd, MdAlarm } from 'react-icons/md';

interface StaffStats {
  myClients: number;
  myPets: number;
  assignedTasks: number;
  myReminders: number;
}

const StatCard = ({ icon: Icon, label, value, color }: any) => (
  <div className={`bg-white rounded-lg shadow p-6 border-l-4 ${color}`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-600 text-sm font-semibold">{label}</p>
        <p className="text-3xl font-bold text-gray-800 mt-2">{value}</p>
      </div>
      <Icon size={40} className="text-gray-400" />
    </div>
  </div>
);

export default function StaffDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<StaffStats>({
    myClients: 0,
    myPets: 0,
    assignedTasks: 0,
    myReminders: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Placeholder: In production, these would be actual API calls
        setStats({
          myClients: 15,
          myPets: 22,
          assignedTasks: 5,
          myReminders: 3,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <>
      <div className="p-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Hola, {user?.name}
          </h2>
          <p className="text-gray-600">
            Aquí está tu resumen de trabajo para hoy
          </p>
        </div>

        {/* Stats Grid */}
        {!loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={MdPeople}
              label="Mis Clientes"
              value={stats.myClients}
              color="border-blue-500"
            />
            <StatCard
              icon={MdPets}
              label="Mis Mascotas"
              value={stats.myPets}
              color="border-green-500"
            />
            <StatCard
              icon={MdAssignmentInd}
              label="Tareas Asignadas"
              value={stats.assignedTasks}
              color="border-purple-500"
            />
            <StatCard
              icon={MdAlarm}
              label="Recordatorios"
              value={stats.myReminders}
              color="border-orange-500"
            />
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">Cargando estadísticas...</p>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Mis Acciones</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PermissionGate require={{ permissions: ['clients:*'] }}>
              <a
                href="/staff/clients"
                className="block p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition text-blue-600 font-semibold"
              >
                → Ver Mis Clientes
              </a>
            </PermissionGate>

            <PermissionGate require={{ permissions: ['pets:*'] }}>
              <a
                href="/staff/pets"
                className="block p-4 bg-green-50 rounded-lg hover:bg-green-100 transition text-green-600 font-semibold"
              >
                → Ver Mis Mascotas
              </a>
            </PermissionGate>
          </div>
        </div>

        {/* Today's Tasks */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tareas para Hoy</h3>
          <div className="space-y-3">
            <div className="flex items-center p-3 bg-blue-50 rounded-lg">
              <input type="checkbox" className="mr-4" />
              <span className="text-gray-900">Revisar nuevo cliente - María González</span>
            </div>
            <div className="flex items-center p-3 bg-blue-50 rounded-lg">
              <input type="checkbox" className="mr-4" />
              <span className="text-gray-900">Enviar recordatorio a Pedro López</span>
            </div>
            <div className="flex items-center p-3 bg-blue-50 rounded-lg">
              <input type="checkbox" className="mr-4" />
              <span className="text-gray-900">Registrar nueva mascota - Gato</span>
            </div>
            <div className="flex items-center p-3 bg-blue-50 rounded-lg">
              <input type="checkbox" className="mr-4" />
              <span className="text-gray-900">Actualizar notas de cliente</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
