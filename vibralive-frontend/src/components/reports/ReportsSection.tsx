'use client';

import React from 'react';
import Link from 'next/link';
import { MdArrowForward, MdTrendingUp, MdCalendarToday, MdPeople, MdLocalActivity } from 'react-icons/md';
import { FiMap, FiAlertCircle } from 'react-icons/fi';
import type { IconType } from 'react-icons';

interface ReportCardProps {
  href: string;
  icon: IconType;
  title: string;
  description: string;
  color: 'blue' | 'green' | 'purple' | 'amber' | 'indigo' | 'rose';
}

const colorMap = {
  blue: {
    bg: 'from-blue-50 to-blue-100',
    border: 'border-blue-200 hover:border-blue-300',
    text: 'text-blue-900',
    icon: 'text-blue-600',
    button: 'hover:bg-blue-100',
  },
  green: {
    bg: 'from-green-50 to-green-100',
    border: 'border-green-200 hover:border-green-300',
    text: 'text-green-900',
    icon: 'text-green-600',
    button: 'hover:bg-green-100',
  },
  purple: {
    bg: 'from-purple-50 to-purple-100',
    border: 'border-purple-200 hover:border-purple-300',
    text: 'text-purple-900',
    icon: 'text-purple-600',
    button: 'hover:bg-purple-100',
  },
  amber: {
    bg: 'from-amber-50 to-amber-100',
    border: 'border-amber-200 hover:border-amber-300',
    text: 'text-amber-900',
    icon: 'text-amber-600',
    button: 'hover:bg-amber-100',
  },
  indigo: {
    bg: 'from-indigo-50 to-indigo-100',
    border: 'border-indigo-200 hover:border-indigo-300',
    text: 'text-indigo-900',
    icon: 'text-indigo-600',
    button: 'hover:bg-indigo-100',
  },
  rose: {
    bg: 'from-rose-50 to-rose-100',
    border: 'border-rose-200 hover:border-rose-300',
    text: 'text-rose-900',
    icon: 'text-rose-600',
    button: 'hover:bg-rose-100',
  },
};

const ReportCard: React.FC<ReportCardProps> = ({ href, icon: Icon, title, description, color }) => {
  const colors = colorMap[color];

  return (
    <Link href={href}>
      <div
        className={`bg-gradient-to-br ${colors.bg} rounded-xl border ${colors.border} p-6 transition-all hover:shadow-lg cursor-pointer group`}
      >
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-lg ${colors.button} transition-colors`}>
            <Icon className={`w-6 h-6 ${colors.icon}`} />
          </div>
          <MdArrowForward className={`w-5 h-5 ${colors.icon} opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all`} />
        </div>

        <h3 className={`${colors.text} text-lg font-semibold mb-2`}>{title}</h3>
        <p className={`${colors.text} text-sm opacity-70`}>{description}</p>
      </div>
    </Link>
  );
};

/**
 * Sección de Reportes con tarjetas de navegación
 * Muestra todos los reportes disponibles en una grid amigable
 */
export const ReportsSection: React.FC = () => {
  const reports = [
    {
      href: '/clinic/reports/revenue',
      icon: MdTrendingUp,
      title: 'Ingresos',
      description: 'Análisis de ingresos, tendencias y rentabilidad',
      color: 'blue' as const,
    },
    {
      href: '/clinic/reports/appointments',
      icon: MdCalendarToday,
      title: 'Citas',
      description: 'Estadísticas de citas, confirmación y cancelación',
      color: 'green' as const,
    },
    {
      href: '/clinic/reports/clients',
      icon: MdPeople,
      title: 'Clientes',
      description: 'Análisis de clientes, crecimiento y retención',
      color: 'purple' as const,
    },
    {
      href: '/clinic/reports/services',
      icon: MdLocalActivity,
      title: 'Servicios',
      description: 'Demanda, rentabilidad y disponibilidad de servicios',
      color: 'amber' as const,
    },
    {
      href: '/clinic/reports/performance',
      icon: MdTrendingUp,
      title: 'Performance',
      description: 'KPIs, eficiencia operativa y productividad',
      color: 'indigo' as const,
    },
    {
      href: '/clinic/reports/heatmap',
      icon: FiMap,
      title: 'Geografía',
      description: 'Ubicación de clientes y cobertura territorial',
      color: 'rose' as const,
    },
    {
      href: '/clinic/reports/cancellations',
      icon: FiAlertCircle,
      title: 'Cancelaciones',
      description: 'Análisis de citas canceladas, razones y pérdida de ingresos',
      color: 'rose' as const,
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Reportes Detallados</h2>
        <p className="text-slate-600">Accede a reportes específicos con filtros avanzados por período y rango de fechas</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((report) => (
          <ReportCard
            key={report.href}
            href={report.href}
            icon={report.icon}
            title={report.title}
            description={report.description}
            color={report.color}
          />
        ))}
      </div>
    </div>
  );
};
