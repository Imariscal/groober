'use client';

import React, { useState } from 'react';
import { FiUsers, FiTrendingUp, FiTarget, FiDownload, FiFilter } from 'react-icons/fi';
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
} from 'recharts';

const clientGrowthData = [
  { mes: 'Ene', nuevos: 15, activos: 280, perdidos: 3 },
  { mes: 'Feb', nuevos: 22, activos: 299, perdidos: 2 },
  { mes: 'Mar', nuevos: 18, activos: 315, perdidos: 2 },
  { mes: 'Abr', nuevos: 25, activos: 338, perdidos: 3 },
  { mes: 'May', nuevos: 28, activos: 363, perdidos: 3 },
  { mes: 'Jun', nuevos: 34, activos: 395, perdidos: 2 },
];

const clientSegmentData = [
  { segmento: 'Frecuentes', cantidad: 156, porcentaje: 39 },
  { segmento: 'Regulares', cantidad: 118, porcentaje: 30 },
  { segmento: 'Ocasionales', cantidad: 89, porcentaje: 22 },
  { segmento: 'Nuevos', cantidad: 32, porcentaje: 8 },
];

const topClientsData = [
  { nombre: 'Juan García', citas: 24, gasto: '$2,400', estado: 'Activo' },
  { nombre: 'María López', citas: 22, gasto: '$2,200', estado: 'Activo' },
  { nombre: 'Carlos Rodríguez', citas: 18, gasto: '$1,800', estado: 'Activo' },
  { nombre: 'Ana Martínez', citas: 16, gasto: '$1,600', estado: 'Activo' },
  { nombre: 'Pedro Pérez', citas: 12, gasto: '$1,200', estado: 'Inactivo' },
];

export default function ClientsReport() {
  return (
    <ReportsLayout
      title="Base de Clientes"
      subtitle="Análisis de crecimiento, segmentación y valor de cliente"
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
            metric="523"
            label="Clientes Activos"
            trend={{
              value: 12,
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
            metric="34"
            label="Clientes Nuevos"
            trend={{
              value: 21,
              direction: 'up' as const,
              period: 'vs mes anterior',
            }}
            color="info"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
        >
          <KPICard
            icon={FiTarget}
            metric="92%"
            label="Retención"
            trend={{
              value: 3,
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
            icon={FiUsers}
            metric="$86.42"
            label="LTV Promedio"
            trend={{
              value: 8,
              direction: 'up' as const,
              period: 'vs mes anterior',
            }}
            color="primary"
          />
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Growth Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32 }}
          className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm"
        >
          <h3 className="font-semibold text-slate-900 mb-6">Crecimiento de Base</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={clientGrowthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="mes" stroke="#94A3B8" />
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
                dataKey="activos"
                stroke="#10B981"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Clientes Activos"
              />
              <Line
                type="monotone"
                dataKey="nuevos"
                stroke="#4F46E5"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Nuevos"
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Segmentation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm"
        >
          <h3 className="font-semibold text-slate-900 mb-6">Segmentación de Clientes</h3>

          <div className="space-y-4">
            {clientSegmentData.map((segment, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-900">{segment.segmento}</span>
                    <span className="text-sm text-slate-600">{segment.cantidad}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${segment.porcentaje}%` }}
                      transition={{ duration: 0.8, delay: index * 0.1 }}
                      className="bg-emerald-500 rounded-full h-2"
                    ></motion.div>
                  </div>
                </div>
                <span className="text-sm font-semibold text-slate-900 w-12 text-right">
                  {segment.porcentaje}%
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Top Clients Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.48 }}
        className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-slate-900">Top 10 Clientes por Valor</h3>
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
                  Cliente
                </th>
                <th className="text-right py-3 px-4 font-semibold text-slate-900 text-sm">
                  Citas
                </th>
                <th className="text-right py-3 px-4 font-semibold text-slate-900 text-sm">
                  Gasto Total
                </th>
                <th className="text-right py-3 px-4 font-semibold text-slate-900 text-sm">
                  Ticket Promedio
                </th>
                <th className="text-center py-3 px-4 font-semibold text-slate-900 text-sm">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody>
              {topClientsData.map((client, index) => (
                <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-4 px-4 text-sm text-slate-900 font-medium">{client.nombre}</td>
                  <td className="py-4 px-4 text-sm text-right text-slate-700">{client.citas}</td>
                  <td className="py-4 px-4 text-sm text-right text-slate-900 font-semibold">
                    {client.gasto}
                  </td>
                  <td className="py-4 px-4 text-sm text-right text-slate-700">
                    ${(parseInt(client.gasto.replace('$', '')) / client.citas).toFixed(0)}
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full ${
                        client.estado === 'Activo'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {client.estado}
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
