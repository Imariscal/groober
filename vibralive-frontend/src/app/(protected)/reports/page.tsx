'use client';

import React, { useState } from 'react';
import {
  FiTrendingUp,
  FiUsers,
  FiDollarSign,
  FiCalendar,
  FiMap,
  FiAward,
  FiFilter,
} from 'react-icons/fi';
import { motion } from 'framer-motion';
import { ReportsLayout } from '@/components/reports/ReportsLayout';
import { KPICard } from '@/components/dashboard';

// Report sections/items
const reportItems = [
  {
    id: 'revenue',
    icon: FiDollarSign,
    title: 'Reporte de Ingresos',
    description: 'Ingresos mensuales, tendencias y proyecciones',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
  },
  {
    id: 'appointments',
    icon: FiCalendar,
    title: 'Análisis de Citas',
    description: 'Citas programadas, completadas y canceladas',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    id: 'clients',
    icon: FiUsers,
    title: 'Base de Clientes',
    description: 'Crecimiento, retención y valor de cliente',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  {
    id: 'services',
    icon: FiAward,
    title: 'Servicios Populares',
    description: 'Servicios más demandados y rentables',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  {
    id: 'performance',
    icon: FiTrendingUp,
    title: 'Performance de Equipo',
    description: 'Productividad de estilistas y especialistas',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
  },
  {
    id: 'heatmap',
    icon: FiMap,
    title: 'Mapa de Zonas Calientes',
    description: 'Distribución geográfica de clientes',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
];

const ReportCard = ({ item, onClick }: any) => (
  <motion.button
    onClick={() => onClick(item.id)}
    whileHover={{ y: -4 }}
    className={`${item.bgColor} rounded-xl p-6 text-left border border-slate-200 hover:border-slate-300 transition-all duration-300 group`}
  >
    <div className="flex items-start justify-between mb-3">
      <div className={`p-3 rounded-lg ${item.bgColor}`}>
        <item.icon size={24} className={item.color} />
      </div>
    </div>
    <h3 className="font-semibold text-slate-900 mb-1">{item.title}</h3>
    <p className="text-sm text-slate-600">{item.description}</p>
  </motion.button>
);

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  const handleReportSelect = (reportId: string) => {
    // Navigate to specific report page
    window.location.href = `/reports/${reportId}`;
  };

  return (
    <ReportsLayout
      title="Reportes"
      subtitle="Panel de control con 6 reportes clave para gestionar tu negocio"
    >
      {/* Summary KPIs */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Indicadores Clave</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
              icon={FiCalendar}
              metric="287"
              label="Citas Completadas"
              trend={{
                value: 8,
                direction: 'up' as const,
                period: 'vs mes anterior',
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
              metric="523"
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
              metric="94%"
              label="Tasa Satisfacción"
              trend={{
                value: 2,
                direction: 'up' as const,
                period: 'vs mes anterior',
              }}
              color="warning"
            />
          </motion.div>
        </div>
      </div>

      {/* Available Reports */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Reportes Disponibles</h2>
            <p className="text-sm text-slate-600 mt-1">6 reportes clave para gestionar tu negocio</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
            >
              <ReportCard item={item} onClick={handleReportSelect} />
            </motion.div>
          ))}
        </div>
      </div>
    </ReportsLayout>
  );
}
