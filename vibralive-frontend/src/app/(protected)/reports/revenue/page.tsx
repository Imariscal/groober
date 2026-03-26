'use client';

import React, { useState } from 'react';
import {
  FiDollarSign,
  FiCalendar,
  FiFilter,
  FiDownload,
  FiTrendingUp,
} from 'react-icons/fi';
import { motion } from 'framer-motion';
import { ReportsLayout } from '@/components/reports/ReportsLayout';
import { KPICard } from '@/components/dashboard';
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
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// Mock data for charts
const monthlyRevenueData = [
  { month: 'Ene', ingresos: 28000, proyectado: 30000 },
  { month: 'Feb', ingresos: 32000, proyectado: 33000 },
  { month: 'Mar', ingresos: 29500, proyectado: 35000 },
  { month: 'Abr', ingresos: 38000, proyectado: 40000 },
  { month: 'May', ingresos: 42000, proyectado: 43000 },
  { month: 'Jun', ingresos: 45230, proyectado: 46000 },
];

const serviceRevenueData = [
  { name: 'Grooming', value: 18500, color: '#4F46E5' },
  { name: 'Veterinaria', value: 15200, color: '#EC4899' },
  { name: 'Hospedaje', value: 7800, color: '#F59E0B' },
  { name: 'Consultas', value: 3730, color: '#10B981' },
];

const COLORS = ['#4F46E5', '#EC4899', '#F59E0B', '#10B981'];

export default function RevenueReport() {
  const [dateRange, setDateRange] = useState('month');

  return (
    <ReportsLayout
      title="Reporte de Ingresos"
      subtitle="Análisis detallado de ingresos, tendencias y proyecciones"
    >
      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <KPICard
            icon={FiDollarSign}
            metric="$45,230"
            label="Ingresos Este Mes"
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
            icon={FiTrendingUp}
            metric="$268,960"
            label="YTD (Año)"
            trend={{
              value: 28,
              direction: 'up' as const,
              period: 'vs año anterior',
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
            icon={FiCalendar}
            metric="$7,539"
            label="Promedio Diario"
            trend={{
              value: 5,
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
            icon={FiDollarSign}
            metric="6 servicios"
            label="Clientes Activos"
            trend={{
              value: 12,
              direction: 'up' as const,
              period: 'vs mes anterior',
            }}
            color="warning"
          />
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Revenue Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32 }}
          className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-slate-900">Ingresos Mensuales</h3>
              <p className="text-sm text-slate-600">Tendencia actual vs proyectado</p>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200">
                6M
              </button>
              <button className="px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded-lg">
                1A
              </button>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyRevenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="month" stroke="#94A3B8" />
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
              <Line
                type="monotone"
                dataKey="ingresos"
                stroke="#4F46E5"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Ingresos Reales"
              />
              <Line
                type="monotone"
                dataKey="proyectado"
                stroke="#94A3B8"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Proyectado"
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Revenue by Service */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm"
        >
          <h3 className="font-semibold text-slate-900 mb-6">Ingresos por Servicio</h3>

          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={serviceRevenueData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {serviceRevenueData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1E293B',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#E2E8F0',
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="mt-6 space-y-3">
            {serviceRevenueData.map((service, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index] }}
                  ></div>
                  <span className="text-slate-700">{service.name}</span>
                </div>
                <span className="font-semibold text-slate-900">${service.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Details Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.48 }}
        className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-slate-900">Detalles por Servicio</h3>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
            <FiDownload size={16} />
            Descargar CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 font-semibold text-slate-900 text-sm">
                  Servicio
                </th>
                <th className="text-right py-3 px-4 font-semibold text-slate-900 text-sm">
                  Citas
                </th>
                <th className="text-right py-3 px-4 font-semibold text-slate-900 text-sm">
                  Ingresos
                </th>
                <th className="text-right py-3 px-4 font-semibold text-slate-900 text-sm">
                  % Total
                </th>
                <th className="text-right py-3 px-4 font-semibold text-slate-900 text-sm">
                  Tendencia
                </th>
              </tr>
            </thead>
            <tbody>
              {serviceRevenueData.map((service, index) => (
                <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-4 px-4 text-sm text-slate-900 font-medium">{service.name}</td>
                  <td className="py-4 px-4 text-sm text-right text-slate-700">
                    {Math.floor(service.value / 100)}
                  </td>
                  <td className="py-4 px-4 text-sm text-right text-slate-900 font-semibold">
                    ${service.value.toLocaleString()}
                  </td>
                  <td className="py-4 px-4 text-sm text-right text-slate-700">
                    {((service.value / 45230) * 100).toFixed(1)}%
                  </td>
                  <td className="py-4 px-4 text-sm text-right">
                    <span className="text-emerald-600 font-medium">↑ 12%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </ReportsLayout>
  );
}
