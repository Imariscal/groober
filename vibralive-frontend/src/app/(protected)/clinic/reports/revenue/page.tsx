'use client';

import React, { useState } from 'react';
import {
  FiDollarSign,
  FiCalendar,
  FiFilter,
  FiDownload,
  FiTrendingUp,
  FiArrowLeft,
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
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useRevenueReport } from '@/hooks/useRevenueReport';
import { PeriodFilter, PeriodType } from '@/components/reports/PeriodFilter';
import { LocationTypeFilter, LocationType } from '@/components/reports/LocationTypeFilter';

const COLORS = ['#4F46E5', '#EC4899', '#F59E0B', '#10B981', '#06B6D4', '#8B5CF6', '#EF4444', '#14B8A6'];

export default function RevenueReport() {
  const [period, setPeriod] = useState<PeriodType>('month');
  const [startDate, setStartDate] = useState<string>();
  const [endDate, setEndDate] = useState<string>();
  const [locationType, setLocationType] = useState<LocationType>('all');
  const [onlyPaid, setOnlyPaid] = useState<boolean>(false);

  const { data, loading, error } = useRevenueReport({ 
    period, 
    startDate, 
    endDate,
    locationType: locationType === 'all' ? undefined : locationType,
    statuses: onlyPaid ? ['COMPLETED'] : undefined,
  });
  
  const handlePeriodChange = (newPeriod: PeriodType, newStartDate?: string, newEndDate?: string) => {
    setPeriod(newPeriod);
    setStartDate(newStartDate);
    setEndDate(newEndDate);
  };

  const kpis = data?.kpis || {
    totalRevenue: { label: 'Ingresos Totales', value: '$0', change: '—', period: '' },
    avgPerAppointment: { label: 'Promedio por Cita', value: '$0', change: '—', period: '' },
    dailyAverage: { label: 'Promedio Diario', value: '$0', change: '—', period: '' },
    ticketPerClient: { label: 'Ticket por Cliente', value: '$0', change: '—', period: '' },
  };

  const serviceRevenueData = data?.charts.byService || [];
  const cumulativeData = data?.charts.cumulativeRevenue || [];

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
            <h1 className="text-4xl font-bold text-slate-900">Reporte de Ingresos</h1>
            <p className="text-slate-600 mt-2">Análisis detallado de ingresos, tendencias y proyecciones</p>
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
          <div className="flex items-center justify-start">
            <label className="inline-flex items-center cursor-pointer gap-3 px-4 py-2 bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
              <input
                type="checkbox"
                checked={onlyPaid}
                onChange={(e) => setOnlyPaid(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 cursor-pointer"
              />
              <span className="text-sm font-medium text-slate-700">Solo Pagados</span>
            </label>
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
              metric={kpis.totalRevenue.value}
              label={kpis.totalRevenue.label}
              trend={{
                value: 15,
                direction: 'up' as const,
                period: kpis.totalRevenue.change || '',
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
              metric={kpis.avgPerAppointment.value}
              label={kpis.avgPerAppointment.label}
              trend={{
                value: 5,
                direction: 'up' as const,
                period: kpis.avgPerAppointment.change || '',
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
              metric={kpis.dailyAverage.value}
              label={kpis.dailyAverage.label}
              trend={{
                value: 5,
                direction: 'up' as const,
                period: kpis.dailyAverage.change || '',
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
              metric={kpis.ticketPerClient.value}
              label={kpis.ticketPerClient.label}
              trend={{
                value: 12,
                direction: 'up' as const,
                period: kpis.ticketPerClient.change || '',
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
                <h3 className="font-semibold text-slate-900">Ingresos Acumulados</h3>
                <p className="text-sm text-slate-600">Tendencia acumulada</p>
              </div>
            </div>

            {cumulativeData && cumulativeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={cumulativeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="date" stroke="#94A3B8" />
                  <YAxis stroke="#94A3B8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1E293B',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#E2E8F0',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#4F46E5"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Ingresos Acumulados"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-300 flex items-center justify-center text-slate-500">No hay datos disponibles</div>
            )}
          </motion.div>

          {/* Revenue by Service */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm"
          >
            <h3 className="font-semibold text-slate-900 mb-6">Ingresos por Servicio</h3>

            {serviceRevenueData && serviceRevenueData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={serviceRevenueData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="revenue"
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

                <div className="mt-6 space-y-3 max-h-64 overflow-y-auto">
                  {serviceRevenueData.map((service, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        ></div>
                        <span className="text-slate-700 truncate">{service.name}</span>
                      </div>
                      <span className="font-semibold text-slate-900">${service.revenue.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-300 flex items-center justify-center text-slate-500">No hay datos disponibles</div>
            )}
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
                  <th className="text-left py-3 px-4 font-semibold text-slate-900 text-sm">Servicio</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-900 text-sm">Cantidad</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-900 text-sm">Ingresos</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-900 text-sm">% Total</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-900 text-sm">Precio Promedio</th>
                </tr>
              </thead>
              <tbody>
                {serviceRevenueData && serviceRevenueData.length > 0 ? (
                  serviceRevenueData.map((service, index) => (
                    <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-4 px-4 text-sm text-slate-900 font-medium">{service.name}</td>
                      <td className="py-4 px-4 text-sm text-right text-slate-700">{service.appointmentCount}</td>
                      <td className="py-4 px-4 text-sm text-right text-slate-900 font-semibold">
                        ${service.revenue.toLocaleString()}
                      </td>
                      <td className="py-4 px-4 text-sm text-right text-slate-700">{service.percentage.toFixed(1)}%</td>
                      <td className="py-4 px-4 text-sm text-right text-slate-700">
                        ${service.avgPrice.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-4 px-4 text-center text-slate-500">
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
