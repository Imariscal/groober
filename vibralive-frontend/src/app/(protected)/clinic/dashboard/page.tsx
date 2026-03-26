'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { PermissionGate } from '@/components/PermissionGate';
import { ClientGrowthKPIsSection } from '@/components/dashboard/ClientGrowthKPIsSection';
import { dashboardApi, DashboardKPIs, DashboardData } from '@/api/dashboard-api';
import {
  RevenueKPICard,
  SimpleLineChart,
  SimpleBarChart,
  LoadingSkeleton,
} from '@/components/dashboard/DashboardKPICards';
import { UpcomingAppointments } from '@/components/dashboard/UpcomingAppointments';
import { TopServices } from '@/components/dashboard/TopServices';
import { DashboardDemoSection } from '@/components/dashboard/DashboardDemo';
import { ReportsSection } from '@/components/reports/ReportsSection';
import { MdPeople, MdPets, MdAccessTime, MdBarChart, MdArrowForward, MdTrendingUp, MdInfo } from 'react-icons/md';

interface ClinicStats {
  totalClients: number;
  totalPets: number;
  upcomingAppointments: number;
  pendingReminders: number;
}

const StatCard = ({ icon: Icon, label, value, color }: any) => (
  <div className={`relative overflow-hidden bg-white rounded-xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all duration-300 group`}>
    {/* Background gradient accent */}
    <div className={`absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-5 group-hover:opacity-10 transition-opacity ${color}`}></div>
    
    <div className="relative flex items-center justify-between">
      <div>
        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">{label}</p>
        <p className="text-4xl font-bold text-slate-900 mt-3">{value}</p>
      </div>
      <div className={`p-3 rounded-lg ${color} opacity-20 group-hover:opacity-30 transition-opacity`}>
        <Icon size={32} className={color} />
      </div>
    </div>
  </div>
);

export default function ClinicDashboard() {
  const { user, refreshUser } = useAuth();
  const { has } = usePermissions();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ClinicStats>({
    totalClients: 0,
    totalPets: 0,
    upcomingAppointments: 0,
    pendingReminders: 0,
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Refresh user permissions from database first
        await refreshUser();
        setLoading(true);

        // Get full dashboard data
        const dashData = await dashboardApi.getFullDashboardData();
        if (dashData) {
          setDashboardData(dashData);
          setKpis(dashData.kpis);

          // Update stats from dashboard KPIs
          setStats({
            totalClients: dashData.kpis.clients.totalActive,
            totalPets: Math.round(dashData.kpis.clients.totalActive * 1.3), // Estimation: ~1.3 pets per client
            upcomingAppointments: dashData.kpis.appointments.confirmedThisWeek,
            pendingReminders: 0, // Requiere API separada de reminders
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-baseline gap-4">
            <h1 className="text-4xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-600 text-lg">
              {user?.clinic_id && `Clínica ID: ${user.clinic_id}`}
            </p>
          </div>
          <p className="text-slate-600 mt-2 text-base">
            {loading ? 'Cargando información...' : kpis ? 'Visión en tiempo real de tu clínica' : 'Datos de demostración'}
          </p>
        </div>

        {/* If no data after loading, show demo + notice */}
        {!loading && !kpis && (
          <div className="mb-8 bg-amber-50 border border-amber-200 rounded-xl p-6 flex items-start gap-4">
            <MdInfo className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-900 mb-2">Sin datos disponibles</h3>
              <p className="text-amber-800 text-sm mb-3">
                El sistema no encontró datos en los reportes. Abajo se muestra cómo se verá el dashboard con información real.
              </p>
              <p className="text-amber-700 text-xs">
                • Asegúrate de tener citas y servicios configurados  
                • Los gráficos se actualizarán automáticamente cuando haya datos  
                • Recarga la página para obtener datos frescos  
              </p>
            </div>
          </div>
        )}

        {/* KPIs Section with real or demo data */}
        {loading ? (
          <LoadingSkeleton count={4} />
        ) : kpis ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <RevenueKPICard
              label="Ingresos (MTD)"
              value={kpis.revenue.totalMTD}
              unit="MXN"
              trend={kpis.revenue.trend}
              trendLabel="vs mes anterior"
              color="green"
            />
            <RevenueKPICard
              label="Citas Confirmadas"
              value={kpis.appointments.confirmedThisWeek}
              unit="semana"
              trend={kpis.appointments.trend}
              trendLabel="vs semana anterior"
              color="blue"
            />
            <RevenueKPICard
              label="Clientes Activos"
              value={kpis.clients.totalActive}
              unit="usuarios"
              trend={kpis.clients.trend}
              trendLabel="vs mes anterior"
              color="purple"
            />
            <RevenueKPICard
              label="Tasa Confirmación"
              value={`${Math.round(kpis.appointments.confirmationRate || 0)}%`}
              unit="objetivo: 85%"
              color="amber"
            />
          </div>
        ) : null}

        {/* Charts - Real or Demo */}
        {!loading && kpis && dashboardData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {dashboardData.revenueChart && dashboardData.revenueChart.length > 0 ? (
              <SimpleLineChart data={dashboardData.revenueChart} title="📈 Ingresos Acumulados (Esta Semana)" />
            ) : (
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 h-80 flex items-center justify-center">
                <p className="text-slate-500">Datos de ingresos no disponibles</p>
              </div>
            )}
            {dashboardData.appointmentsChart && dashboardData.appointmentsChart.length > 0 ? (
              <SimpleBarChart data={dashboardData.appointmentsChart} title="📅 Citas por Día (Esta Semana)" />
            ) : (
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 h-80 flex items-center justify-center">
                <p className="text-slate-500">Datos de citas no disponibles</p>
              </div>
            )}
          </div>
        )}

        {/* Demo mode - Show when no KPIs */}
        {!loading && !kpis && (
          <div className="mb-8">
            <DashboardDemoSection />
          </div>
        )}

        {/* Client Growth KPIs Section */}
        <PermissionGate require={{ permissions: ['clients:*'] }}>
          <div className="mb-8">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
              <ClientGrowthKPIsSection showTitle={true} compact={false} />
            </div>
          </div>
        </PermissionGate>

        {/* Three Column Grid - Appointments, Services, Quick Actions */}
        {kpis && dashboardData && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Upcoming Appointments */}
            <div className="lg:col-span-2">
              {loading ? (
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 h-80 flex items-center justify-center">
                  <p className="text-slate-500">Cargando citas...</p>
                </div>
              ) : (
                <UpcomingAppointments
                  todayAppointments={dashboardData.todayAppointments || []}
                  tomorrowAppointments={dashboardData.tomorrowAppointments || []}
                />
              )}
            </div>

            {/* Top Services */}
            <div>
              {loading ? (
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 h-80 flex items-center justify-center">
                  <p className="text-slate-500">Cargando servicios...</p>
                </div>
              ) : (
                <TopServices services={dashboardData.topServices || []} />
              )}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Acciones Rápidas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <a
              href="/clinic/clients"
              className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg hover:shadow-md transition-all group border border-blue-200 hover:border-blue-300"
            >
              <div>
                <span className="text-blue-900 font-semibold block">Gestionar Clientes</span>
                <span className="text-blue-600 text-sm">{stats.totalClients} activos</span>
              </div>
              <MdArrowForward className="text-blue-600 group-hover:translate-x-1 transition-transform" size={20} />
            </a>

            <a
              href="/clinic/pets"
              className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg hover:shadow-md transition-all group border border-green-200 hover:border-green-300"
            >
              <div>
                <span className="text-green-900 font-semibold block">Gestionar Mascotas</span>
                <span className="text-green-600 text-sm">{stats.totalPets} registradas</span>
              </div>
              <MdArrowForward className="text-green-600 group-hover:translate-x-1 transition-transform" size={20} />
            </a>

            <a
              href="/clinic/users"
              className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg hover:shadow-md transition-all group border border-purple-200 hover:border-purple-300"
            >
              <div>
                <span className="text-purple-900 font-semibold block">Gestionar Staff</span>
                <span className="text-purple-600 text-sm">Equipo</span>
              </div>
              <MdArrowForward className="text-purple-600 group-hover:translate-x-1 transition-transform" size={20} />
            </a>

            <a
              href="/clinic/appointments"
              className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-lg hover:shadow-md transition-all group border border-indigo-200 hover:border-indigo-300"
            >
              <div>
                <span className="text-indigo-900 font-semibold block">Ver Citas</span>
                <span className="text-indigo-600 text-sm">{stats.upcomingAppointments} próximas</span>
              </div>
              <MdArrowForward className="text-indigo-600 group-hover:translate-x-1 transition-transform" size={20} />
            </a>

            <a
              href="/clinic/services"
              className="flex items-center justify-between p-4 bg-gradient-to-r from-cyan-50 to-cyan-100 rounded-lg hover:shadow-md transition-all group border border-cyan-200 hover:border-cyan-300"
            >
              <div>
                <span className="text-cyan-900 font-semibold block">Servicios</span>
                <span className="text-cyan-600 text-sm">Catálogo</span>
              </div>
              <MdArrowForward className="text-cyan-600 group-hover:translate-x-1 transition-transform" size={20} />
            </a>

            <a
              href="/clinic/packages"
              className="flex items-center justify-between p-4 bg-gradient-to-r from-rose-50 to-rose-100 rounded-lg hover:shadow-md transition-all group border border-rose-200 hover:border-rose-300"
            >
              <div>
                <span className="text-rose-900 font-semibold block">Paquetes</span>
                <span className="text-rose-600 text-sm">Ofertas</span>
              </div>
              <MdArrowForward className="text-rose-600 group-hover:translate-x-1 transition-transform" size={20} />
            </a>
          </div>
        </div>

        {/* Reports Section */}
        <ReportsSection />

        {/* Key Metrics Summary - Only show if we have KPIs */}
        {kpis && (
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg p-8 text-white">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <MdTrendingUp className="w-6 h-6" />
              Resumen de Métricas
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <p className="text-blue-100 text-sm font-medium mb-1">Ingreso Promedio/Cita</p>
                <p className="text-3xl font-bold">
                  ${kpis.revenue.avgPerAppointment.toLocaleString('es-MX', { maximumFractionDigits: 0 }) || '0'}
                </p>
              </div>
              <div>
                <p className="text-blue-100 text-sm font-medium mb-1">Promedio Diario (ARPU)</p>
                <p className="text-3xl font-bold">
                  ${kpis.revenue.arpu.toLocaleString('es-MX', { maximumFractionDigits: 0 }) || '0'}
                </p>
              </div>
              <div>
                <p className="text-blue-100 text-sm font-medium mb-1">Clientes Nuevos (MTD)</p>
                <p className="text-3xl font-bold">{kpis.clients.newThisMonth || 0}</p>
              </div>
              <div>
                <p className="text-blue-100 text-sm font-medium mb-1">Retención de Clientes</p>
                <p className="text-3xl font-bold">{Math.round(kpis.clients.retention || 0)}%</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
