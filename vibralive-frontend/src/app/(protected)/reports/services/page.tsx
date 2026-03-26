'use client';

import React, { useState } from 'react';
import { FiAward, FiDownload, FiTrendingUp, FiStar } from 'react-icons/fi';
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
  ScatterChart,
  Scatter,
} from 'recharts';

const servicesPerformanceData = [
  { servicio: 'Grooming Premium', demanda: 68, ingresos: 18500, margin: 65 },
  { servicio: 'Consulta General', demanda: 52, ingresos: 15200, margin: 72 },
  { servicio: 'Hospedaje', demanda: 38, ingresos: 7800, margin: 55 },
  { servicio: 'Baño Completo', demanda: 34, ingresos: 2720, margin: 80 },
  { servicio: 'Vacunación', demanda: 28, ingresos: 1960, margin: 75 },
];

const topServicesData = [
  { servicio: 'Grooming Premium', citas: 68, rating: 4.8, ingresos: '$18,500', demanda: 'Alta' },
  { servicio: 'Consulta General', citas: 52, rating: 4.6, ingresos: '$15,200', demanda: 'Alta' },
  { servicio: 'Hospedaje', citas: 38, rating: 4.4, ingresos: '$7,800', demanda: 'Media' },
  { servicio: 'Baño Completo', citas: 34, rating: 4.7, ingresos: '$2,720', demanda: 'Media' },
  { servicio: 'Vacunación', citas: 28, rating: 4.5, ingresos: '$1,960', demanda: 'Media' },
];

export default function ServicesReport() {
  return (
    <ReportsLayout
      title="Servicios Populares"
      subtitle="Análisis de demanda, rentabilidad y popularidad de servicios"
    >
      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <KPICard
            icon={FiAward}
            metric="5"
            label="Servicios Principales"
            trend={{
              value: 1,
              direction: 'up' as const,
              period: 'nuevos este mes',
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
            metric="$45,780"
            label="Ingresos por Servicios"
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
          transition={{ delay: 0.16 }}
        >
          <KPICard
            icon={FiStar}
            metric="4.6"
            label="Rating Promedio"
            trend={{
              value: 3,
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
            icon={FiAward}
            metric="68%"
            label="Margen Promedio"
            trend={{
              value: 5,
              direction: 'up' as const,
              period: 'vs mes anterior',
            }}
            color="warning"
          />
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Performance Matrix */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32 }}
          className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm"
        >
          <h3 className="font-semibold text-slate-900 mb-6">Matriz de Demanda vs Ingresos</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis type="number" dataKey="demanda" stroke="#94A3B8" name="Demanda (citas)" />
              <YAxis type="number" dataKey="ingresos" stroke="#94A3B8" name="Ingresos ($)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1E293B',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#E2E8F0',
                }}
                cursor={{ strokeDasharray: '3 3' }}
              />
              <Scatter
                name="Servicios"
                data={servicesPerformanceData}
                fill="#4F46E5"
                onClick={(state: any) => {
                  console.log(state);
                }}
              />
            </ScatterChart>
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
            <BarChart data={servicesPerformanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="servicio" angle={-45} textAnchor="end" height={100} stroke="#94A3B8" />
              <YAxis stroke="#94A3B8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1E293B',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#E2E8F0',
                }}
              />
              <Bar dataKey="ingresos" fill="#10B981" name="Ingresos" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Services Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.48 }}
        className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-slate-900">Análisis Detallado de Servicios</h3>
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
                  Citas
                </th>
                <th className="text-center py-3 px-4 font-semibold text-slate-900 text-sm">
                  Rating
                </th>
                <th className="text-right py-3 px-4 font-semibold text-slate-900 text-sm">
                  Ingresos
                </th>
                <th className="text-right py-3 px-4 font-semibold text-slate-900 text-sm">
                  Demanda
                </th>
              </tr>
            </thead>
            <tbody>
              {topServicesData.map((service, index) => (
                <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-4 px-4 text-sm text-slate-900 font-medium">{service.servicio}</td>
                  <td className="py-4 px-4 text-sm text-right text-slate-700">{service.citas}</td>
                  <td className="py-4 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <FiStar size={14} className="text-amber-400 fill-amber-400" />
                      <span className="text-sm font-semibold text-slate-900">{service.rating}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm text-right text-slate-900 font-semibold">
                    {service.ingresos}
                  </td>
                  <td className="py-4 px-4 text-sm text-right">
                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full ${
                        service.demanda === 'Alta'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {service.demanda}
                    </span>
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
