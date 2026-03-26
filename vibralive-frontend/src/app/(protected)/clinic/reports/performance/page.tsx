'use client';

import React, { useState } from 'react';
import {
  FiUsers,
  FiCalendar,
  FiTrendingUp,
  FiDollarSign,
  FiArrowLeft,
  FiDownload,
  FiTarget,
} from 'react-icons/fi';
import { motion } from 'framer-motion';
import { KPICard } from '@/components/dashboard';
import Link from 'next/link';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { usePerformanceReport } from '@/hooks/usePerformanceReport';
import { PeriodFilter, PeriodType } from '@/components/reports/PeriodFilter';
import { LocationTypeFilter, LocationType } from '@/components/reports/LocationTypeFilter';
import { StatusFilter, AppointmentStatus } from '@/components/reports/StatusFilter';

const COLORS = ['#4F46E5', '#EC4899', '#F59E0B', '#10B981', '#06B6D4', '#8B5CF6', '#EF4444', '#14B8A6'];

export default function PerformanceReport() {
  const [period, setPeriod] = useState<PeriodType>('month');
  const [startDate, setStartDate] = useState<string>();
  const [endDate, setEndDate] = useState<string>();
  const [locationType, setLocationType] = useState<LocationType>('all');
  const [selectedStatuses, setSelectedStatuses] = useState<AppointmentStatus[]>([
    'SCHEDULED',
    'CONFIRMED',
    'CANCELLED',
    'IN_PROGRESS',
    'COMPLETED',
  ]);

  const { data, loading, error } = usePerformanceReport({ 
    period, 
    startDate, 
    endDate,
    locationType: locationType === 'all' ? undefined : locationType,
    statuses: selectedStatuses,
  });

  const handlePeriodChange = (newPeriod: PeriodType, newStartDate?: string, newEndDate?: string) => {
    setPeriod(newPeriod);
    setStartDate(newStartDate);
    setEndDate(newEndDate);
  };

  const kpis = data?.kpis || {
    activeStylistsCount: {
      label: 'Estilistas Activos',
      value: '0',
      trending: 'Disponibles',
    },
    avgAppointmentsPerWeek: {
      label: 'Citas promedio/semana',
      value: '0',
      trending: 'Eficiencia',
    },
    occupancyRate: {
      label: 'Tasa de ocupación',
      value: '0%',
      trending: 'Capacidad',
    },
    revenuePerStylist: {
      label: 'Ingresos/estilista',
      value: '$0',
      trending: 'Semanal',
    },
  };

  const utilizationData = data?.charts.utilization || [];
  const revenueComparisonData = data?.charts.revenueComparison || [];
  const stylistsData = data?.stylists || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Link
            href="/clinic/reports"
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <FiArrowLeft size={24} className="text-slate-600" />
          </Link>
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Reporte de Desempeño</h1>
            <p className="text-slate-600 mt-2">Análisis de productividad, ocupación y rendimiento de estilistas</p>
          </div>
        </div>

        {/* Period Filter */}
        <div className="mb-8">
          <PeriodFilter
            selectedPeriod={period}
            selectedStartDate={startDate}
            selectedEndDate={endDate}
            onPeriodChange={handlePeriodChange}
          />
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            Error al cargar datos: {error}
          </div>
        )}

        {loading && (
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700">
            Cargando datos...
          </div>
        )}

        {/* Filters */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
          <LocationTypeFilter 
            selectedLocation={locationType} 
            onLocationChange={setLocationType} 
          />
          <div className="lg:col-span-3">
            <StatusFilter 
              selectedStatuses={selectedStatuses} 
              onStatusChange={setSelectedStatuses} 
            />
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
          >
            <KPICard
              icon={FiUsers}
              metric={kpis.activeStylistsCount.value}
              label={kpis.activeStylistsCount.label}
              trend={{
                value: 0,
                direction: 'up' as const,
                period: kpis.activeStylistsCount.trending || '',
              }}
              color="success"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
          >
            <KPICard
              icon={FiCalendar}
              metric={kpis.avgAppointmentsPerWeek.value}
              label={kpis.avgAppointmentsPerWeek.label}
              trend={{
                value: 15,
                direction: 'up' as const,
                period: kpis.avgAppointmentsPerWeek.trending || '',
              }}
              color="primary"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
          >
            <KPICard
              icon={FiTarget}
              metric={kpis.occupancyRate.value}
              label={kpis.occupancyRate.label}
              trend={{
                value: 8,
                direction: 'up' as const,
                period: kpis.occupancyRate.trending || '',
              }}
              color="info"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24 }}
          >
            <KPICard
              icon={FiDollarSign}
              metric={kpis.revenuePerStylist.value}
              label={kpis.revenuePerStylist.label}
              trend={{
                value: 15,
                direction: 'up' as const,
                period: kpis.revenuePerStylist.trending || '',
              }}
              color="warning"
            />
          </motion.div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Utilization Rate */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32 }}
            className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm"
          >
            <div className="mb-6">
              <h3 className="font-semibold text-slate-900">Tasa de Utilización por Día</h3>
              <p className="text-sm text-slate-600">Porcentaje de ocupación diaria</p>
            </div>

            {utilizationData && utilizationData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={utilizationData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="name" stroke="#94A3B8" />
                  <YAxis stroke="#94A3B8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1E293B',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#E2E8F0',
                    }}
                  />
                  <Bar
                    dataKey="utilizationPercentage"
                    fill="#4F46E5"
                    name="Ocupación (%)"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-300 flex items-center justify-center text-slate-500">No hay datos disponibles</div>
            )}
          </motion.div>

          {/* Revenue vs Target */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm"
          >
            <div className="mb-6">
              <h3 className="font-semibold text-slate-900">Ingresos vs Objetivo por Estilista</h3>
              <p className="text-sm text-slate-600">Comparación de desempeño</p>
            </div>

            {revenueComparisonData && revenueComparisonData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueComparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="name" stroke="#94A3B8" />
                  <YAxis stroke="#94A3B8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1E293B',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#E2E8F0',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="current" fill="#4F46E5" name="Ingresos Actuales" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="target" fill="#10B981" name="Objetivo" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-300 flex items-center justify-center text-slate-500">No hay datos disponibles</div>
            )}
          </motion.div>
        </div>

        {/* Stylists Details Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.48 }}
          className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-slate-900">Desempeño de Estilistas</h3>
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              <FiDownload size={16} />
              Descargar CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-900 text-sm">Estilista</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-900 text-sm">Citas Totales</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-900 text-sm">Confirmadas</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-900 text-sm">Canceladas</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-900 text-sm">Calificación</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-900 text-sm">Ingresos Semanales</th>
                </tr>
              </thead>
              <tbody>
                {stylistsData && stylistsData.length > 0 ? (
                  stylistsData.map((stylist, index) => (
                    <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-4 px-4 text-sm text-slate-900 font-medium">{stylist.name}</td>
                      <td className="py-4 px-4 text-sm text-right text-slate-700">{stylist.totalAppointments}</td>
                      <td className="py-4 px-4 text-sm text-right text-slate-700">{stylist.confirmedCount}</td>
                      <td className="py-4 px-4 text-sm text-right text-slate-700 text-red-600">{stylist.cancelledCount}</td>
                      <td className="py-4 px-4 text-sm text-right text-slate-900 font-semibold">
                        <div className="flex items-center justify-end gap-2">
                          <span>{stylist.rating}</span>
                          <span className="text-yellow-500">★</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm text-right text-slate-900 font-semibold">
                        ${stylist.weeklyRevenue}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-4 px-4 text-center text-slate-500">
                      No hay datos disponibles
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
