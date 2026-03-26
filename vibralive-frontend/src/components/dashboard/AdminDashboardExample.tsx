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
  FiShoppingCart,
  FiGlobe,
  FiSend,
  FiMoreHorizontal,
  FiArrowUp,
  FiArrowDown,
} from 'react-icons/fi';
import {
  ModernDashboardLayout,
  KPICard,
  ActivityPanel,
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
    label: 'Ingresos Mes Actual',
    trend: {
      value: 25,
      direction: 'up' as const,
      period: 'vs mes anterior',
    },
    color: 'info' as const,
  },
];

const activityData = [
  {
    id: '1',
    icon: FiCheckCircle,
    title: 'Cita completada',
    description: 'Juan Rodriguez recibió tratamiento exitosamente',
    timestamp: new Date(Date.now() - 2 * 60 * 1000),
    type: 'success' as const,
    actionUrl: '/dashboard/appointments/1',
  },
  {
    id: '2',
    icon: FiUsers,
    title: 'Nuevo cliente registrado',
    description: 'María López se registró en la plataforma',
    timestamp: new Date(Date.now() - 45 * 60 * 1000),
    type: 'info' as const,
    actionUrl: '/dashboard/clients/2',
  },
  {
    id: '3',
    icon: FiCalendar,
    title: 'Recordatorio enviado',
    description: 'Recordatorio de cita enviado a Carlos García',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    type: 'info' as const,
  },
  {
    id: '4',
    icon: FiTrendingUp,
    title: 'Meta alcanzada',
    description: 'Se alcanzó la meta mensual de nuevos clientes',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
    type: 'success' as const,
  },
  {
    id: '5',
    icon: FiCheckCircle,
    title: 'Cambio de estado',
    description: 'Mascota "Fluffy" marcada como de alta',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    type: 'success' as const,
  },
];

const statusExamples = [
  { id: '1', status: 'active' as const, label: 'Activo' },
  { id: '2', status: 'inactive' as const, label: 'Inactivo' },
  { id: '3', status: 'pending' as const, label: 'Pendiente' },
  { id: '4', status: 'archived' as const, label: 'Archivado' },
];

export function AdminDashboardExample() {
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
                <h3 className="text-base font-semibold text-slate-900">Sales Recap</h3>
                <p className="text-xs text-slate-600 mt-1">1 Jan, 2024 - 30 Jul, 2024</p>
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
                  <span className="text-xs text-slate-500 mt-2">{['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'][i]}</span>
                </motion.div>
              ))}
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div>
                <p className="text-xs text-slate-600 font-medium">Total Profit</p>
                <p className="text-lg font-bold text-slate-900 mt-1">$35,816.43</p>
              </div>
              <div>
                <p className="text-xs text-slate-600 font-medium">Total Cost</p>
                <p className="text-lg font-bold text-slate-900 mt-1">$10,390.50</p>
              </div>
              <div>
                <p className="text-xs text-slate-600 font-medium">Total Sales</p>
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
                <h4 className="text-sm font-semibold text-slate-900">Goal Completion</h4>
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
                <h4 className="text-sm font-semibold text-slate-900">Inventory</h4>
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
                <h4 className="text-sm font-semibold text-slate-900">Mentions</h4>
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
                <h4 className="text-sm font-semibold text-slate-900">Downloads</h4>
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
            <h3 className="text-base font-semibold text-slate-900 mb-4">Visitors Report</h3>
            <div className="h-64 bg-slate-100 rounded-lg flex items-center justify-center">
              <svg className="w-full h-full opacity-10" viewBox="0 0 960 600" xmlns="http://www.w3.org/2000/svg">
                <rect width="960" height="600" fill="#f3f4f6" />
              </svg>
              <p className="absolute text-slate-400">World Map Placeholder</p>
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
              <h3 className="text-sm font-semibold text-slate-900">Direct Chat</h3>
              <button className="p-1 hover:bg-slate-100 rounded transition-colors">
                <FiMoreHorizontal className="w-4 h-4 text-slate-600" />
              </button>
            </div>
            <div className="flex-1 p-4 space-y-3 overflow-y-auto">
              {[
                { name: 'Alexander Pierce', msg: 'Is this template really for free?', time: '10:56', sent: false },
                { name: 'You', msg: 'Yes, absolutely free!', time: '11:02', sent: true },
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
                  placeholder="Type message..."
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
              <h3 className="text-base font-semibold text-slate-900">Latest Members</h3>
              <span className="text-xs bg-critical-100 text-critical-800 px-2 py-1 rounded font-medium">New Member</span>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {[
                { initials: 'AP', name: 'Alexander Pierce' },
                { initials: 'NR', name: 'Norman Robinson' },
                { initials: 'JM', name: 'Jane Martin' },
                { initials: 'JH', name: 'John Hou' },
                { initials: 'MJ', name: 'Michelle Johnson' },
                { initials: 'KS', name: 'Kevin Smith' },
                { initials: 'SR', name: 'Sarah Rodriguez' },
                { initials: 'DJ', name: 'David Johnson' },
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
            <h3 className="text-base font-semibold text-slate-900 mb-4">Browser Usage</h3>
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
                  { label: 'Chrome', value: '60%', color: 'primary-500' },
                  { label: 'Firefox', value: '20%', color: 'success-500' },
                  { label: 'Safari', value: '12%', color: 'warning-500' },
                  { label: 'Explorer', value: '8%', color: 'slate-400' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-sm bg-${item.color}`} style={{ backgroundColor: item.color === 'primary-500' ? '#3b82f6' : item.color === 'success-500' ? '#10b981' : item.color === 'warning-500' ? '#f59e0b' : '#cbd5e1' }} />
                    <span className="text-sm text-slate-600">{item.label}</span>
                    <span className="ml-auto text-sm font-semibold text-slate-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200">
              <p className="text-xs text-slate-600 text-center">United States of America</p>
            </div>
          </div>
        </motion.div>
      </div>
    </ModernDashboardLayout>
  );
}

export default AdminDashboardExample;
