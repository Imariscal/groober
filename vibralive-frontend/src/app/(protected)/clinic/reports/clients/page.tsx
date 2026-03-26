'use client';

import React, { useState } from 'react';
import {
  FiUsers,
  FiTrendingUp,
  FiTarget,
  FiBarChart2,
  FiDownload,
  FiArrowLeft,
} from 'react-icons/fi';
import { motion } from 'framer-motion';
import { KPICard } from '@/components/dashboard';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { useClientsReport } from '@/hooks/useClientsReport';
import { PeriodFilter, PeriodType } from '@/components/reports/PeriodFilter';

export default function ClientsReport() {
  const [period, setPeriod] = useState<PeriodType>('month');
  const [startDate, setStartDate] = useState<string>();
  const [endDate, setEndDate] = useState<string>();

  const { data, loading, error } = useClientsReport({ 
    period, 
    startDate, 
    endDate,
  });

  const handlePeriodChange = (newPeriod: PeriodType, newStartDate?: string, newEndDate?: string) => {
    setPeriod(newPeriod);
    setStartDate(newStartDate);
    setEndDate(newEndDate);
  };

  const kpis = data?.kpis || {
    totalActiveClients: { label: 'Clientes Activos', value: '0 clientes', trending: '' },
    newClientsThisMonth: { label: 'Nuevos Clientes', value: '0 clientes', trending: '' },
    repeatRate: { label: 'Tasa de Repetición', value: '0%', trending: '' },
    clientsByPlan: [],
  };

  const growthTrend = data?.charts.growthTrend || [];
  const topClients = data?.charts.topByRevenue || [];
  const byPlan = data?.kpis.clientsByPlan || [];

  const COLORS = ['#3b82f6', '#a855f7', '#f59e0b', '#ef4444', '#10b981'];

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
            <h1 className="text-4xl font-bold text-slate-900">Análisis de Clientes</h1>
            <p className="text-slate-600 mt-2">Estadísticas de clientes activos, retenidos y crecimiento</p>
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

        {/* KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
          >
            <KPICard
              icon={FiUsers}
              metric={kpis.totalActiveClients.value}
              label={kpis.totalActiveClients.label}
              trend={{
                value: 12,
                direction: 'up' as const,
                period: kpis.totalActiveClients.trending || '',
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
              metric={kpis.newClientsThisMonth.value}
              label={kpis.newClientsThisMonth.label}
              trend={{
                value: 5,
                direction: 'up' as const,
                period: kpis.newClientsThisMonth.trending || '',
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
              metric={kpis.repeatRate.value}
              label={kpis.repeatRate.label}
              trend={{
                value: 8,
                direction: 'up' as const,
                period: kpis.repeatRate.trending || '',
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
              icon={FiBarChart2}
              metric={byPlan.reduce((sum, p) => sum + p.count, 0).toString()}
              label="Total de Clientes"
              trend={{
                value: 15,
                direction: 'up' as const,
                period: '',
              }}
              color="warning"
            />
          </motion.div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Growth Trend Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32 }}
            className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm"
          >
            <h3 className="font-semibold text-slate-900 mb-6">Tendencia de Crecimiento</h3>
            {growthTrend && growthTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={growthTrend}>
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
                  <Line type="monotone" dataKey="newClients" stroke="#10B981" name="Clientes Nuevos" strokeWidth={2} />
                  <Line type="monotone" dataKey="cumulativeClients" stroke="#3B82F6" name="Total Acumulado" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-300 flex items-center justify-center text-slate-500">No hay datos disponibles</div>
            )}
          </motion.div>

          {/* By Plan Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm"
          >
            <h3 className="font-semibold text-slate-900 mb-6">Clientes por Plan</h3>

            {byPlan && byPlan.length > 0 ? (
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={byPlan}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ plan, count }) => `${plan}: ${count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {byPlan.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 flex flex-wrap gap-4 justify-center">
                  {byPlan.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                      <span className="text-sm text-slate-600">{item.plan}: {item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-300 flex items-center justify-center text-slate-500">No hay datos disponibles</div>
            )}
          </motion.div>
        </div>

        {/* Top Clients by Revenue Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.48 }}
          className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-slate-900">Clientes con Mayor Gasto</h3>
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              <FiDownload size={16} />
              Descargar
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-900 text-sm">Nombre</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900 text-sm">Total Citas</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900 text-sm">Gasto Total</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900 text-sm">Gasto Promedio</th>
                </tr>
              </thead>
              <tbody>
                {topClients && topClients.length > 0 ? (
                  topClients.map((client, index) => (
                    <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-4 px-4 text-sm font-medium text-slate-900">{client.name}</td>
                      <td className="py-4 px-4 text-sm text-slate-700">{client.totalAppointments}</td>
                      <td className="py-4 px-4 text-sm text-slate-700 font-medium">${client.totalSpent.toFixed(2)} MXN</td>
                      <td className="py-4 px-4 text-sm text-slate-700">
                        ${(client.totalSpent / client.totalAppointments).toFixed(2)} MXN
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-4 px-4 text-center text-slate-500">
                      No hay datos de clientes
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
