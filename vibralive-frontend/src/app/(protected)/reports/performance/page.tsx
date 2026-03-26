'use client';

import React, { useState } from 'react';
import { FiTrendingUp, FiDownload, FiAward, FiUsers } from 'react-icons/fi';
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';

const teamPerformanceData = [
  { estilista: 'Ana García', citas: 42, ingresos: 12600, rating: 4.8, utilización: 95 },
  { estilista: 'Carlos López', citas: 38, ingresos: 11400, rating: 4.6, utilización: 92 },
  { estilista: 'María Rodríguez', citas: 35, ingresos: 10500, rating: 4.5, utilización: 88 },
  { estilista: 'Juan Pérez', citas: 32, ingresos: 9600, rating: 4.3, utilización: 85 },
  { estilista: 'Laura Martínez', citas: 28, ingresos: 8400, rating: 4.7, utilización: 80 },
];

const radarData = [
  { metrica: 'Citas', Ana: 95, Carlos: 88, María: 82 },
  { metrica: 'Ingresos', Ana: 98, Carlos: 90, María: 82 },
  { metrica: 'Rating', Ana: 96, Carlos: 92, María: 90 },
  { metrica: 'Utilización', Ana: 95, Carlos: 92, María: 88 },
  { metrica: 'Retención', Ana: 94, Carlos: 90, María: 85 },
];

export default function PerformanceReport() {
  return (
    <ReportsLayout
      title="Performance de Equipo"
      subtitle="KPIs de productividad, ingresos y satisfacción del equipo"
    >
      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <KPICard
            icon={FiUsers}
            metric="5"
            label="Estilistas Activos"
            trend={{
              value: 0,
              direction: 'up' as const,
              period: 'sin cambios',
            }}
            color="primary"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
        >
          <KPICard
            icon={FiTrendingUp}
            metric="175"
            label="Total Citas"
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
          transition={{ delay: 0.16 }}
        >
          <KPICard
            icon={FiTrendingUp}
            metric="$52,500"
            label="Ingresos Generados"
            trend={{
              value: 18,
              direction: 'up' as const,
              period: 'vs mes anterior',
            }}
            color="warning"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24 }}
        >
          <KPICard
            icon={FiAward}
            metric="4.58"
            label="Rating Promedio"
            trend={{
              value: 2,
              direction: 'up' as const,
              period: 'vs mes anterior',
            }}
            color="info"
          />
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Performance Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32 }}
          className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm"
        >
          <h3 className="font-semibold text-slate-900 mb-6">Productividad por Estilista</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={teamPerformanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis
                dataKey="estilista"
                angle={-45}
                textAnchor="end"
                height={100}
                stroke="#94A3B8"
              />
              <YAxis stroke="#94A3B8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1E293B',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#E2E8F0',
                }}
              />
              <Bar dataKey="citas" fill="#4F46E5" name="Citas" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Radar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm"
        >
          <h3 className="font-semibold text-slate-900 mb-6">Comparativa de Métricas (Top 3)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#E2E8F0" />
              <PolarAngleAxis dataKey="metrica" stroke="#94A3B8" />
              <PolarRadiusAxis stroke="#94A3B8" />
              <Radar name="Ana García" dataKey="Ana" stroke="#4F46E5" fill="#4F46E5" fillOpacity={0.25} />
              <Radar name="Carlos López" dataKey="Carlos" stroke="#10B981" fill="#10B981" fillOpacity={0.25} />
              <Radar name="María Rdz" dataKey="María" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.25} />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Team Details Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.48 }}
        className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-slate-900">Desempeño Individual</h3>
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
                  Estilista
                </th>
                <th className="text-right py-3 px-4 font-semibold text-slate-900 text-sm">
                  Citas
                </th>
                <th className="text-right py-3 px-4 font-semibold text-slate-900 text-sm">
                  Ingresos
                </th>
                <th className="text-center py-3 px-4 font-semibold text-slate-900 text-sm">
                  Rating
                </th>
                <th className="text-right py-3 px-4 font-semibold text-slate-900 text-sm">
                  Utilización
                </th>
                <th className="text-center py-3 px-4 font-semibold text-slate-900 text-sm">
                  Tendencia
                </th>
              </tr>
            </thead>
            <tbody>
              {teamPerformanceData.map((estilista, index) => (
                <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-4 px-4 text-sm text-slate-900 font-medium">{estilista.estilista}</td>
                  <td className="py-4 px-4 text-sm text-right text-slate-700">{estilista.citas}</td>
                  <td className="py-4 px-4 text-sm text-right text-slate-900 font-semibold">
                    ${estilista.ingresos.toLocaleString()}
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="text-sm font-semibold text-slate-900">{estilista.rating}</span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 bg-slate-200 rounded-full h-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${estilista.utilización}%` }}
                          transition={{ duration: 1, delay: index * 0.1 }}
                          className="bg-indigo-600 rounded-full h-2"
                        ></motion.div>
                      </div>
                      <span className="text-xs font-semibold text-slate-700 w-8">
                        {estilista.utilización}%
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="text-sm text-emerald-600 font-semibold">↑ 8%</span>
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
