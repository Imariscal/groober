'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { IconType } from 'react-icons';

interface KPICardProps {
  icon: IconType;
  metric: string | number;
  label: string;
  trend?: {
    value: number;
    direction: 'up' | 'down';
    period: string;
  };
  color?: 'primary' | 'success' | 'warning' | 'critical' | 'info';
  isLoading?: boolean;
  onClick?: () => void;
}

const colorConfig = {
  primary: {
    bg: 'bg-primary-50',
    icon: 'text-primary-500',
    iconBg: 'bg-primary-100',
    trend: 'text-primary-600',
  },
  success: {
    bg: 'bg-emerald-50',
    icon: 'text-success-500',
    iconBg: 'bg-success-100',
    trend: 'text-success-600',
  },
  warning: {
    bg: 'bg-amber-50',
    icon: 'text-warning-500',
    iconBg: 'bg-warning-100',
    trend: 'text-warning-600',
  },
  critical: {
    bg: 'bg-red-50',
    icon: 'text-critical-500',
    iconBg: 'bg-critical-100',
    trend: 'text-critical-600',
  },
  info: {
    bg: 'bg-sky-50',
    icon: 'text-primary-500',
    iconBg: 'bg-primary-100',
    trend: 'text-primary-600',
  },
};

const trendIcons = {
  up: '↑',
  down: '↓',
};

export function KPICard({
  icon: Icon,
  metric,
  label,
  trend,
  color = 'primary',
  isLoading = false,
  onClick,
}: KPICardProps) {
  const colors = colorConfig[color];

  return (
    <motion.div
      whileHover={{ y: -2 }}
      onClick={onClick}
      className={`
        relative bg-white rounded-lg p-5 border border-slate-200
        shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer
        ${onClick ? 'cursor-pointer' : ''}
      `}
    >
      {/* Background accent - subtle */}
      <div className={`absolute inset-0 rounded-lg ${colors.bg} opacity-20 pointer-events-none`} />

      <div className="relative z-10">
        {/* Icon Circle */}
        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-md ${colors.iconBg} mb-3`}>
          <Icon className={`w-6 h-6 ${colors.icon}`} />
        </div>

        {/* Metric */}
        {isLoading ? (
          <div className="h-8 bg-slate-200 rounded-md w-24 animate-pulse mb-1" />
        ) : (
          <div className="text-3xl font-bold text-slate-900 leading-none mb-1">
            {metric}
          </div>
        )}

        {/* Label */}
        <p className="text-sm font-medium text-slate-600 mb-2">{label}</p>

        {/* Trend Indicator */}
        {trend && !isLoading && (
          <div className={`text-xs font-medium ${colors.trend} flex items-center gap-1`}>
            <span className="text-lg">{trendIcons[trend.direction]}</span>
            <span>
              {trend.value > 0 ? '+' : ''}{trend.value}% {trend.period}
            </span>
          </div>
        )}

        {/* Hover line accent */}
        <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-primary-500 to-primary-400 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 w-0 group-hover:w-full" />
      </div>
    </motion.div>
  );
}

// Skeleton Loader untuk KPI
export function KPICardSkeleton() {
  return (
    <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-xs">
      <div className="animate-pulse">
        <div className="w-12 h-12 bg-slate-200 rounded-md mb-3" />
        <div className="h-8 bg-slate-200 rounded-md w-24 mb-2" />
        <div className="h-4 bg-slate-200 rounded w-32 mb-2" />
        <div className="h-3 bg-slate-200 rounded w-20" />
      </div>
    </div>
  );
}


