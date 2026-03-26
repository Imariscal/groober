'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { MdMedicalServices, MdPeople, MdPets, MdRefresh, MdTrendingUp, MdWarning } from 'react-icons/md';
import { getDashboard, DashboardData, listClinics } from '@/lib/platformApi';
import { useClinicTimezone } from '@/hooks/useClinicTimezone';
import { formatInTimeZone } from 'date-fns-tz';
import { useAuthStore } from '@/store/auth-store';
import { Clinic } from '@/types';
import { PageHeader } from '@/components/dashboard/page-header/PageHeader';

interface KPICard {
  label: string;
  value: number;
  subtext?: string;
  color: string;
  icon: React.ReactNode;
  trend?: number;
}

// Mock clinic data for demo
const mockClinics: Clinic[] = [
  {
    id: '1',
    name: 'Clínica Veterinaria VibraTest',
    phone: '+525551234567',
    email: 'contact@vibratest.com',
    city: 'Mexico City',
    country: 'MX',
    subscriptionPlan: 'basic',
    status: 'ACTIVE',
    maxStaffUsers: 5,
    maxClients: 100,
    maxPets: 200,
    createdAt: '2025-01-15',
    updatedAt: '2025-02-25',
  },
  {
    id: '2',
    name: 'Ignacio Mariscal',
    phone: '+525559876543',
    email: 'ignacio@Groober.com',
    city: 'Guadalajara',
    country: 'MX',
    subscriptionPlan: 'standard',
    status: 'ACTIVE',
    maxStaffUsers: 20,
    maxClients: 500,
    maxPets: 1000,
    createdAt: '2025-01-20',
    updatedAt: '2025-02-25',
  },
  {
    id: '3',
    name: 'Clínica Premium',
    phone: '+525551111111',
    email: 'premium@Groober.com',
    city: 'Monterrey',
    country: 'MX',
    subscriptionPlan: 'standard',
    status: 'ACTIVE',
    maxStaffUsers: 20,
    maxClients: 500,
    maxPets: 1000,
    createdAt: '2025-02-01',
    updatedAt: '2025-02-25',
  },
];

const mockDashboardData: DashboardData = {
  timestamp: new Date().toISOString(),
  kpis: {
    total_clinics: 20,
    active_clinics: 18,
    suspended_clinics: 2,
    statistics: {
      total_active_staff: 156,
      total_active_clients: 3420,
      total_active_pets: 7850,
    },
  },
  recent_clinics: mockClinics,
};

export default function PlatformDashboard() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const clinicTimezone = useClinicTimezone();
  
  const [data, setData] = useState<DashboardData>(mockDashboardData);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Check auth (only if authenticated)
  useEffect(() => {
    if (isAuthenticated && user?.role !== 'superadmin') {
      router.push('/unauthorized');
    }
  }, [isAuthenticated, user?.role, router]);

  // Fetch dashboard
  const fetchDashboard = async () => {
    const isRefresh = isLoading === false;
    if (isRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const result = await getDashboard();
      setData(result);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      // Fallback to mock data on error
      setData(mockDashboardData);
    } finally {
      if (isRefresh) setIsRefreshing(false);
      else setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const kpis: KPICard[] = data
    ? [
        {
          label: 'Total Clínicas',
          value: data.kpis.total_clinics,
          color: 'bg-blue-50 border-blue-200 text-blue-700',
          icon: <MdMedicalServices className="w-8 h-8 text-blue-600" />,
          trend: 15,
        },
        {
          label: 'Clínicas Activas',
          value: data.kpis.active_clinics,
          color: 'bg-green-50 border-green-200 text-green-700',
          icon: <MdMedicalServices className="w-8 h-8 text-green-600" />,
          trend: 10,
        },
        {
          label: 'Clínicas Suspendidas',
          value: data.kpis.suspended_clinics,
          color: 'bg-red-50 border-red-200 text-red-700',
          icon: <MdWarning className="w-8 h-8 text-red-600" />,
        },
        {
          label: 'Staff Activo',
          value: data.kpis.statistics.total_active_staff,
          color: 'bg-purple-50 border-purple-200 text-purple-700',
          icon: <MdPeople className="w-8 h-8 text-purple-600" />,
          trend: 8,
        },
        {
          label: 'Total Clientes',
          value: data.kpis.statistics.total_active_clients,
          color: 'bg-amber-50 border-amber-200 text-amber-700',
          icon: <MdPeople className="w-8 h-8 text-amber-600" />,
          trend: 22,
        },
        {
          label: 'Total Mascotas',
          value: data.kpis.statistics.total_active_pets,
          color: 'bg-pink-50 border-pink-200 text-pink-700',
          icon: <MdPets className="w-8 h-8 text-pink-600" />,
          trend: 18,
        },
      ]
    : [];

  const pageHeader = {
    title: 'Dashboard Admin',
    subtitle: 'Vista general y análisis de la plataforma Groober',
    breadcrumbs: [
      { label: 'Plataforma', href: '/platform/dashboard' },
      { label: 'Dashboard' },
    ],
    primaryAction: {
      label: 'Actualizar',
      onClick: fetchDashboard,
      icon: <MdRefresh className="w-5 h-5" />,
    },
  };

  const suspensionRate = data ? Math.round((data.kpis.suspended_clinics / data.kpis.total_clinics) * 100) : 0;
  const utilizationRate = 85; // Mock data

  return (
    <>
      <PageHeader {...pageHeader} />
      {isLoading ? (
        // Skeleton loading
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-slate-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {kpis.map((kpi, index) => (
              <div
                key={index}
                className={`border rounded-lg shadow-sm p-6 flex items-center gap-4 hover:shadow-md transition ${kpi.color}`}
              >
                <div className="p-3 bg-white rounded-lg">{kpi.icon}</div>
                <div className="flex-1">
                  <p className="text-sm font-medium opacity-90">{kpi.label}</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold">{kpi.value.toLocaleString()}</p>
                    {kpi.trend && (
                      <div className="flex items-center gap-1 text-green-600 text-sm font-semibold">
                        <MdTrendingUp className="w-4 h-4" />
                        {kpi.trend}%
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Suspension Rate */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Tasa de Suspensión</h3>
                <MdWarning className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-3xl font-bold text-slate-900">{suspensionRate}%</span>
                <span className="text-sm text-slate-600">({data.kpis.suspended_clinics} de {data.kpis.total_clinics})</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div 
                  className="bg-orange-500 h-2 rounded-full transition-all" 
                  style={{ width: `${suspensionRate}%` }}
                />
              </div>
            </div>

            {/* Utilization Rate */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Tasa de Utilización</h3>
                <MdTrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-3xl font-bold text-slate-900">{utilizationRate}%</span>
                <span className="text-sm text-slate-600">espacio promedio usado</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all" 
                  style={{ width: `${utilizationRate}%` }}
                />
              </div>
            </div>
          </div>

          {/* Recent Clinics Table */}
          {data && data.recent_clinics.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
              <div className="border-b border-slate-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-slate-900">
                  Clínicas Recientes
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-6 py-3 text-left font-semibold text-slate-700">
                        Clínica
                      </th>
                      <th className="px-6 py-3 text-left font-semibold text-slate-700">
                        Teléfono
                      </th>
                      <th className="px-6 py-3 text-left font-semibold text-slate-700">
                        Plan
                      </th>
                      <th className="px-6 py-3 text-left font-semibold text-slate-700">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left font-semibold text-slate-700">
                        Creada
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent_clinics.map((clinic) => (
                      <tr
                        key={clinic.id}
                        className="border-b border-slate-100 hover:bg-slate-50 transition"
                      >
                        <td className="px-6 py-4 font-medium text-slate-900">
                          {clinic.name}
                        </td>
                        <td className="px-6 py-4 text-slate-600">{clinic.phone}</td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 capitalize">
                            {clinic.subscriptionPlan || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                              clinic.status === 'ACTIVE'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {clinic.status === 'ACTIVE' ? 'Activa' : 'Suspendida'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {formatInTimeZone(new Date(clinic.createdAt), clinicTimezone, 'dd/MM/yyyy')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* No data message */}
          {data && data.recent_clinics.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-slate-200">
              <p className="text-slate-500">No hay clínicas registradas aún</p>
            </div>
          )}
        </>
      )}
    </>
  );
}
