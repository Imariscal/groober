'use client';

import React, { useState } from 'react';
import {
  FiUsers,
  FiCalendar,
  FiCheckCircle,
  FiTrendingUp,
  FiAward,
  FiDownload,
  FiFilter,
  FiMoreHorizontal,
  FiArrowUp,
  FiArrowDown,
  FiSend,
} from 'react-icons/fi';
import {
  ModernDashboardLayout,
  KPICard,
  StateBadge,
} from '@/components/dashboard';
import { motion } from 'framer-motion';

// Mock data para ejemplo
const kpiData = [
  {
    icon: FiUsers,
    metric: '1,234',
    label: 'Clientes Activos',
    trend: {
      value: 12,
      direction: 'up' as const,
      period: 'vs mes anterior',
    },
    color: 'primary' as const,
  },
  {
    icon: FiCalendar,
    metric: '542',
    label: 'Citas Programadas',
    trend: {
      value: 8,
      direction: 'up' as const,
      period: 'vs mes anterior',
    },
    color: 'success' as const,
  },
  {
    icon: FiCheckCircle,
    metric: '98%',
    label: 'Tasa Completitud',
    trend: {
      value: 3,
      direction: 'down' as const,
      period: 'vs mes anterior',
    },
    color: 'warning' as const,
  },
  {
    icon: FiAward,
    metric: '$24.5K',
    label: 'Ingresos Mes',
    trend: {
      value: 25,
      direction: 'up' as const,
      period: 'vs mes anterior',
    },
    color: 'info' as const,
  },
];

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    console.log('Buscando:', query);
  };

  return (
    <ModernDashboardLayout
      title="Dashboard"
      breadcrumbs={[
        { label: 'Home', href: '/dashboard' },
        { label: 'Dashboard' },
      ]}
      onSearch={handleSearch}
      ctaLabel="Nuevo Cliente"
      ctaHref="/dashboard/clients/new"
      notificationCount={3}
    >
      {/* KPI Cards - Row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpiData.map((kpi, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
          >
            <KPICard {...kpi} />
          </motion.div>
        ))}
      </div>

      {/* Main Content - Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* Monthly Chart - Left 2 cols */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2"
        >
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Resumen Mensual</h3>
                <p className="text-xs text-slate-600 mt-1">Ingresos y clientes nuevos</p>
              </div>
              <div className="flex gap-2">
                <button className="px-2 py-1 text-xs font-medium text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors">
                  Semana
                </button>
                <button className="px-2 py-1 text-xs font-medium text-white bg-primary-500 rounded-md hover:bg-primary-600 transition-colors">
                  Mes
                </button>
              </div>
            </div>

            {/* Area Chart Simulation */}
            <div className="h-56 relative bg-gradient-to-b from-slate-50 to-white rounded-lg border border-slate-200 p-4 flex items-end justify-between gap-1">
              {[45, 52, 48, 65, 58, 72, 68, 82, 78].map((height, i) => (
                <motion.div
                  key={i}
                  initial={{ y: 200, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: i * 0.05, type: 'spring', stiffness: 100 }}
                  className="flex-1 flex flex-col items-end"
                >
                  <div
                    className="w-full bg-gradient-to-t from-primary-500 to-primary-300 rounded-t-md opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
                    style={{ height: `${(height / 100) * 180}px` }}
                  />
                  <span className="text-xs text-slate-500 mt-2">{['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep'][i]}</span>
                </motion.div>
              ))}
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div>
                <p className="text-xs text-slate-600 font-medium">Ganancia Total</p>
                <p className="text-lg font-bold text-slate-900 mt-1">$35,816.43</p>
              </div>
              <div>
                <p className="text-xs text-slate-600 font-medium">Costo Total</p>
                <p className="text-lg font-bold text-slate-900 mt-1">$10,390.50</p>
              </div>
              <div>
                <p className="text-xs text-slate-600 font-medium">Ventas Totales</p>
                <p className="text-lg font-bold text-slate-900 mt-1">$24,813.53</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Goal Completion - Right col */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="space-y-4"
        >
          {/* Goal Card 1 */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Meta Mensual</h4>
                <p className="text-xs text-slate-600 mt-1">$24,813.53</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-success-600 flex items-center gap-1">
                  <FiArrowUp className="w-3 h-3" /> 24%
                </p>
              </div>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full w-3/4 bg-gradient-to-r from-primary-500 to-primary-400"></div>
            </div>
          </div>

          {/* Goal Card 2 */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Inventario</h4>
                <p className="text-xs text-slate-600 mt-1">$5,200</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-warning-600 flex items-center gap-1">
                  <FiArrowDown className="w-3 h-3" /> 5%
                </p>
              </div>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full w-1/4 bg-gradient-to-r from-warning-500 to-warning-400"></div>
            </div>
          </div>

          {/* Goal Card 3 */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Menciones</h4>
                <p className="text-xs text-slate-600 mt-1">$2,050</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-success-600 flex items-center gap-1">
                  <FiArrowUp className="w-3 h-3" /> 28%
                </p>
              </div>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full w-2/3 bg-gradient-to-r from-success-500 to-success-400"></div>
            </div>
          </div>

          {/* Goal Card 4 */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Descargas</h4>
                <p className="text-xs text-slate-600 mt-1">$114,381</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-critical-600 flex items-center gap-1">
                  <FiArrowDown className="w-3 h-3" /> 18%
                </p>
              </div>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full w-1/2 bg-gradient-to-r from-critical-500 to-critical-400"></div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Row 3 - Visitors & Direct Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* Visitors Report Map */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="lg:col-span-2"
        >
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-6">
            <h3 className="text-base font-semibold text-slate-900 mb-4">Reporte de Visitantes</h3>
            <div className="h-64 bg-slate-100 rounded-lg flex items-center justify-center">
              <p className="text-slate-400">Mapa mundial de visitantes</p>
            </div>
          </div>
        </motion.div>

        {/* Direct Chat */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs flex flex-col h-full">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Chat Directo</h3>
              <button className="p-1 hover:bg-slate-100 rounded transition-colors">
                <FiMoreHorizontal className="w-4 h-4 text-slate-600" />
              </button>
            </div>
            <div className="flex-1 p-4 space-y-3 overflow-y-auto">
              {[
                { name: 'Admin', msg: '¿Puedo verte?', time: '10:56', sent: false },
                { name: 'Tú', msg: '¡Sí, claro!', time: '11:02', sent: true },
              ].map((msg, idx) => (
                <div key={idx} className={`flex ${msg.sent ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                      msg.sent
                        ? 'bg-primary-500 text-white'
                        : 'bg-slate-100 text-slate-900'
                    }`}
                  >
                    {msg.msg}
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 py-3 border-t border-slate-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Escribe un mensaje..."
                  className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button className="p-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
                  <FiSend className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Row 4 - Latest Members & Browser Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Latest Members */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
        >
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-900">Últimos Miembros</h3>
              <span className="text-xs bg-critical-100 text-critical-800 px-2 py-1 rounded font-medium">Nuevo</span>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {[
                { initials: 'JR', name: 'Juan Rodriguez' },
                { initials: 'ML', name: 'María López' },
                { initials: 'CG', name: 'Carlos García' },
                { initials: 'AM', name: 'Ana Martínez' },
                { initials: 'LS', name: 'Luis Silva' },
                { initials: 'PM', name: 'Patricia Morales' },
                { initials: 'RF', name: 'Roberto Fernández' },
                { initials: 'EM', name: 'Elena Muñoz' },
              ].map((member, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-sm mb-2">
                    {member.initials}
                  </div>
                  <p className="text-xs text-slate-600 text-center truncate">{member.name.split(' ')[0]}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Browser Usage */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-6">
            <h3 className="text-base font-semibold text-slate-900 mb-4">Uso de Navegadores</h3>
            <div className="flex items-center justify-between">
              {/* Pie Chart Placeholder */}
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary-500 via-success-500 to-warning-500 opacity-20 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-900">42%</p>
                    <p className="text-xs text-slate-600">Chrome</p>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="space-y-3 flex-1 ml-4">
                {[
                  { label: 'Chrome', value: '60%', color: '#3b82f6' },
                  { label: 'Firefox', value: '20%', color: '#10b981' },
                  { label: 'Safari', value: '12%', color: '#f59e0b' },
                  { label: 'Otros', value: '8%', color: '#cbd5e1' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-slate-600">{item.label}</span>
                    <span className="ml-auto text-sm font-semibold text-slate-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200">
              <p className="text-xs text-slate-600 text-center">Principales mercados</p>
            </div>
          </div>
        </motion.div>
      </div>
    </ModernDashboardLayout>
  );
}
