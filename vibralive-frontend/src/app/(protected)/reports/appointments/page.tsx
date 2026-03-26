'use client';

import React, { useState } from 'react';
import {
  FiCalendar,
  FiCheckCircle,
  FiX,
  FiClock,
  FiDownload,
  FiTrendingUp,
} from 'react-icons/fi';
import { motion } from 'framer-motion';
import { ReportsLayout } from '@/components/reports/ReportsLayout';
import { KPICard } from '@/components/dashboard';
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
  AreaChart,
  Area,
} from 'recharts';

// Mock data
const appointmentsTrendData = [
  { date: 'Lun', programadas: 32, completadas: 28, canceladas: 4 },
  { date: 'Mar', programadas: 35, completadas: 33, canceladas: 2 },
  { date: 'Mié', programadas: 38, completadas: 36, canceladas: 2 },
  { date: 'Jue', programadas: 40, completadas: 38, canceladas: 2 },
  { date: 'Vie', programadas: 45, completadas: 43, canceladas: 2 },
  { date: 'Sab', programadas: 28, completadas: 26, canceladas: 2 },
];

const serviceAppointmentsData = [
  { servicio: 'Grooming', cantidad: 68, porcentaje: 35 },
  { servicio: 'Consulta', cantidad: 52, porcentaje: 27 },
  { servicio: 'Baño', cantidad: 38, porcentaje: 20 },
  { servicio: 'Corte', cantidad: 24, porcentaje: 12 },
  { servicio: 'Vacunas', cantidad: 12, porcentaje: 6 },
];

export default function AppointmentsReport() {
  return (
    <ReportsLayout
      title="Análisis de Citas"
      subtitle="Estadísticas completas de citas programadas, completadas y canceladas"
    >
      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <KPICard
            icon={FiCalendar}
            metric="287"
            label="Citas Completadas"
            trend={{
              value: 18,
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
            icon={FiX}
            metric="24"
            label="Citas Canceladas"
            trend={{
              value: 8,
              direction: 'down' as const,
              period: 'vs mes anterior',
            }}
            color="warning"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
        >
          <KPICard
            icon={FiCheckCircle}
            metric="92%"
            label="Tasa Completitud"
            trend={{
              value: 3,
              direction: 'up' as const,
              period: 'vs mes anterior',
            }}
            color="primary"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24 }}
        >
          <KPICard
            icon={FiClock}
            metric="45 min"
            label="Duración Promedio"
            trend={{
              value: 2,
              direction: 'down' as const,
              period: 'vs mes anterior',
            }}
            color="info"
          />
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Weekly Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32 }}
          className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm"
        >
          <h3 className="font-semibold text-slate-900 mb-6">Tendencia Semanal</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={appointmentsTrendData}>
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
              <Legend />
              <Bar dataKey="programadas" fill="#4F46E5" name="Programadas" />
              <Bar dataKey="completadas" fill="#10B981" name="Completadas" />
              <Bar dataKey="canceladas" fill="#EF4444" name="Canceladas" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Services Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm"
        >
          <h3 className="font-semibold text-slate-900 mb-6">Citas por Servicio</h3>

          <div className="space-y-4">
            {serviceAppointmentsData.map((service, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-900">{service.servicio}</span>
                    <span className="text-sm text-slate-600">{service.cantidad}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${service.porcentaje}%` }}
                      transition={{ duration: 0.8, delay: index * 0.1 }}
                      className="bg-indigo-600 rounded-full h-2"
                    ></motion.div>
                  </div>
                </div>
                <span className="text-sm font-semibold text-slate-900 w-12 text-right">
                  {service.porcentaje}%
                </span>
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
            Descargar
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
                  Programadas
                </th>
                <th className="text-right py-3 px-4 font-semibold text-slate-900 text-sm">
                  Completadas
                </th>
                <th className="text-right py-3 px-4 font-semibold text-slate-900 text-sm">
                  Tasa Completitud
                </th>
                <th className="text-right py-3 px-4 font-semibold text-slate-900 text-sm">
                  Ingreso Promedio
                </th>
              </tr>
            </thead>
            <tbody>
              {serviceAppointmentsData.map((service, index) => (
                <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-4 px-4 text-sm text-slate-900 font-medium">{service.servicio}</td>
                  <td className="py-4 px-4 text-sm text-right text-slate-700">{service.cantidad}</td>
                  <td className="py-4 px-4 text-sm text-right text-slate-700">
                    {Math.floor(service.cantidad * 0.95)}
                  </td>
                  <td className="py-4 px-4 text-sm text-right text-emerald-600 font-semibold">
                    95%
                  </td>
                  <td className="py-4 px-4 text-sm text-right text-slate-900 font-semibold">
                    ${(Math.random() * 150 + 50).toFixed(2)}
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
