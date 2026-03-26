'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FiTrendingUp,
  FiUsers,
  FiDollarSign,
  FiCalendar,
  FiMap,
  FiAward,
  FiChevronRight,
} from 'react-icons/fi';
import { motion } from 'framer-motion';

const reportMenuItems = [
  {
    id: 'overview',
    label: 'Resumen',
    icon: FiTrendingUp,
    href: '/reports',
    description: 'Vista general de todos los reportes',
  },
  {
    id: 'revenue',
    label: 'Ingresos',
    icon: FiDollarSign,
    href: '/reports/revenue',
    description: 'Análisis de ingresos',
  },
  {
    id: 'appointments',
    label: 'Citas',
    icon: FiCalendar,
    href: '/reports/appointments',
    description: 'Estadísticas de citas',
  },
  {
    id: 'clients',
    label: 'Clientes',
    icon: FiUsers,
    href: '/reports/clients',
    description: 'Análisis de cliente',
  },
  {
    id: 'services',
    label: 'Servicios',
    icon: FiAward,
    href: '/reports/services',
    description: 'Servicios populares',
  },
  {
    id: 'performance',
    label: 'Performance',
    icon: FiTrendingUp,
    href: '/reports/performance',
    description: 'KPIs del equipo',
  },
  {
    id: 'heatmap',
    label: 'Geografía',
    icon: FiMap,
    href: '/reports/heatmap',
    description: 'Mapa de zonas',
  },
];

interface ReportsLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export const ReportsLayout: React.FC<ReportsLayoutProps> = ({
  children,
  title,
  subtitle,
}) => {
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-64 bg-white border-r border-slate-200 shadow-sm overflow-y-auto"
      >
        <div className="p-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-6">
            <FiTrendingUp className="text-indigo-600" size={20} />
            Reportes
          </h2>

          <nav className="space-y-1">
            {reportMenuItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Icon
                      size={18}
                      className={isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}
                    />
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${isActive ? 'text-indigo-600' : ''}`}>
                        {item.label}
                      </p>
                      <p className="text-xs text-slate-500 hidden group-hover:block">
                        {item.description}
                      </p>
                    </div>
                    {isActive && <FiChevronRight size={16} className="text-indigo-600" />}
                  </Link>
                </motion.div>
              );
            })}
          </nav>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto px-6 py-8"
        >
          {title && (
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-slate-900">{title}</h1>
              {subtitle && <p className="text-slate-600 mt-2">{subtitle}</p>}
            </div>
          )}
          {children}
        </motion.div>
      </main>
    </div>
  );
};

export default ReportsLayout;
