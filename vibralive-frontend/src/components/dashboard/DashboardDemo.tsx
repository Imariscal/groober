'use client';

import React from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { RevenueKPICard, SimpleLineChart, SimpleBarChart } from '@/components/dashboard/DashboardKPICards';
import { UpcomingAppointments } from '@/components/dashboard/UpcomingAppointments';
import { TopServices } from '@/components/dashboard/TopServices';

/**
 * Mock data for demonstration purposes
 * Muestra cómo se vería el dashboard con datos reales
 */

export const mockRevenueData = [
  { name: 'Lun', value: 4200 },
  { name: 'Mar', value: 5200 },
  { name: 'Mié', value: 4800 },
  { name: 'Jue', value: 6100 },
  { name: 'Vie', value: 7200 },
  { name: 'Sáb', value: 5900 },
  { name: 'Dom', value: 3100 },
];

export const mockAppointmentsData = [
  { name: 'Lun', CONFIRMED: 8, SCHEDULED: 3, CANCELLED: 1 },
  { name: 'Mar', CONFIRMED: 10, SCHEDULED: 2, CANCELLED: 1 },
  { name: 'Mié', CONFIRMED: 9, SCHEDULED: 4, CANCELLED: 0 },
  { name: 'Jue', CONFIRMED: 11, SCHEDULED: 3, CANCELLED: 2 },
  { name: 'Vie', CONFIRMED: 12, SCHEDULED: 5, CANCELLED: 1 },
  { name: 'Sáb', CONFIRMED: 10, SCHEDULED: 2, CANCELLED: 0 },
  { name: 'Dom', CONFIRMED: 6, SCHEDULED: 1, CANCELLED: 1 },
];

export const mockAppointments = [
  {
    id: '1',
    client_name: 'Juan García',
    pet_name: 'Max',
    scheduled_at: new Date(new Date().setHours(9, 30, 0)).toISOString(),
    status: 'CONFIRMED',
  },
  {
    id: '2',
    client_name: 'María López',
    pet_name: 'Luna',
    scheduled_at: new Date(new Date().setHours(11, 0, 0)).toISOString(),
    status: 'CONFIRMED',
  },
  {
    id: '3',
    client_name: 'Carlos Rodríguez',
    pet_name: 'Bella',
    scheduled_at: new Date(new Date().setHours(14, 30, 0)).toISOString(),
    status: 'SCHEDULED',
  },
] as any[];

export const mockTomorrowAppointments = [
  {
    id: '4',
    client_name: 'Ana Martínez',
    pet_name: 'Toby',
    scheduled_at: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(),
    status: 'CONFIRMED',
  },
  {
    id: '5',
    client_name: 'Pedro González',
    pet_name: 'Rocky',
    scheduled_at: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(),
    status: 'SCHEDULED',
  },
] as any[];

export const mockTopServices = [
  {
    id: '1',
    name: 'Baño y Secado Completo',
    revenue: 28500,
    total_revenue: 28500,
    count: 45,
    appointment_count: 45,
    avg_price: 633,
  },
  {
    id: '2',
    name: 'Corte de Pelo',
    revenue: 24200,
    total_revenue: 24200,
    count: 44,
    appointment_count: 44,
    avg_price: 550,
  },
  {
    id: '3',
    name: 'Consulta Veterinaria',
    revenue: 18900,
    total_revenue: 18900,
    count: 27,
    appointment_count: 27,
    avg_price: 700,
  },
  {
    id: '4',
    name: 'Limpieza de Oídos',
    revenue: 12300,
    total_revenue: 12300,
    count: 41,
    appointment_count: 41,
    avg_price: 300,
  },
  {
    id: '5',
    name: 'Corte de Uñas',
    revenue: 9100,
    total_revenue: 9100,
    count: 65,
    appointment_count: 65,
    avg_price: 140,
  },
];

export const DashboardDemoSection: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Demo KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <RevenueKPICard
          label="Ingresos (MTD)"
          value={93000}
          unit="MXN"
          trend={8}
          trendLabel="vs mes anterior"
          color="green"
        />
        <RevenueKPICard
          label="Citas Confirmadas"
          value={58}
          unit="semana"
          trend={12}
          trendLabel="vs semana anterior"
          color="blue"
        />
        <RevenueKPICard
          label="Clientes Activos"
          value={42}
          unit="usuarios"
          trend={5}
          trendLabel="vs mes anterior"
          color="purple"
        />
        <RevenueKPICard
          label="Tasa Confirmación"
          value="92%"
          unit="objetivo: 85%"
          color="amber"
        />
      </div>

      {/* Demo Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SimpleLineChart data={mockRevenueData} title="📈 Ingresos Acumulados (Esta Semana)" />
        <SimpleBarChart data={mockAppointmentsData} title="📅 Citas por Día (Esta Semana)" />
      </div>

      {/* Demo Appointments & Services */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <UpcomingAppointments
            todayAppointments={mockAppointments}
            tomorrowAppointments={mockTomorrowAppointments}
          />
        </div>
        <div>
          <TopServices services={mockTopServices} />
        </div>
      </div>

      {/* Info Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-semibold text-blue-900 mb-2">📊 Datos de Demostración</h3>
        <p className="text-blue-800 text-sm mb-3">
          Estos son datos de ejemplo para mostrar cómo se verá el dashboard cuando haya información disponible en la base de datos.
        </p>
        <ul className="text-blue-700 text-sm space-y-1 ml-4">
          <li>✓ Asegúrate de tener citas registradas en el sistema</li>
          <li>✓ Los reportes se rellenarán automáticamente cuando haya datos</li>
          <li>✓ Recarga la página para obtener actualizaciones</li>
        </ul>
      </div>
    </div>
  );
};
