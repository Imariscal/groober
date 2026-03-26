'use client';

import React, { useState } from 'react';
import {
  FiDollarSign,
  FiCalendar,
  FiUsers,
  FiArrowLeft,
  FiTrendingUp,
  FiBell,
} from 'react-icons/fi';
import { motion } from 'framer-motion';
import { KPICard } from '@/components/dashboard';
import Link from 'next/link';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useOverviewReport } from '@/hooks/useReports';

export default function OverviewReport() {
  const [dateRange, setDateRange] = useState('month');
  const { data, loading, error } = useOverviewReport({ period: dateRange as any });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mb-4"></div>
          <p className="text-slate-600">Cargando reporte...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <FiBell size={48} className="mx-auto" />
          </div>
          <p className="text-red-600">{error}</p>
          <Link href="/clinic/reports" className="text-blue-600 hover:underline mt-4 block">
            Volver a reportes
          </Link>
        </div>
      </div>
    );
  }

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
            <h1 className="text-4xl font-bold text-slate-900">Resumen Ejecutivo</h1>
            <p className="text-slate-600 mt-2">Panel consolidado con las métricas clave de tu negocio</p>
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
              icon={FiDollarSign}
              metric={String(data?.healthMetrics?.revenueThisMonth?.value || '$0')}
              label="Ingresos Mensuales"
              trend={{
                value: 15,
                direction: 'up' as const,
                period: 'vs mes anterior',
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
              metric={String(data?.healthMetrics?.appointmentsThisWeek?.value || '0')}
              label="Citas Esta Semana"
              trend={{
                value: 8,
                direction: 'up' as const,
                period: 'vs semana anterior',
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
              icon={FiUsers}
              metric={String(data?.healthMetrics?.activeClients?.value || '0')}
              label="Clientes Activos"
              trend={{
                value: 12,
                direction: 'up' as const,
                period: 'vs mes anterior',
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
              icon={FiTrendingUp}
              metric={String(data?.healthMetrics?.occupancyRate?.value || '0')}
              label="Tasa de Ocupación"
              trend={{
                value: 2,
                direction: 'up' as const,
                period: 'vs mes anterior',
              }}
              color="warning"
            />
          </motion.div>
        </div>

        {/* Charts */}
        {data?.charts && (data.charts.revenueLastWeek?.length > 0 || data.charts.appointmentsByStylist?.length > 0 || data.charts.clientGrowth?.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {data.charts.revenueLastWeek && data.charts.revenueLastWeek.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.32 }}
                className="bg-white rounded-xl shadow-sm p-6 border border-slate-200"
              >
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Ingresos Última Semana</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.charts.revenueLastWeek}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#4F46E5" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </motion.div>
            )}
            {data.charts.appointmentsByStylist && data.charts.appointmentsByStylist.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.40 }}
                className="bg-white rounded-xl shadow-sm p-6 border border-slate-200"
              >
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Citas por Estilista</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.charts.appointmentsByStylist}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#8B5CF6" />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            )}
          </div>
        )}

        {/* Alerts */}
        {data?.alerts && data.alerts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.alerts.map((alert, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.48 + idx * 0.08 }}
                className={`p-4 rounded-lg border-l-4 ${
                  alert.type === 'warning'
                    ? 'bg-yellow-50 border-l-yellow-500 text-yellow-800'
                    : alert.type === 'success'
                    ? 'bg-green-50 border-l-green-500 text-green-800'
                    : 'bg-blue-50 border-l-blue-500 text-blue-800'
                }`}
              >
                <p className="font-semibold">{alert.message}</p>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
