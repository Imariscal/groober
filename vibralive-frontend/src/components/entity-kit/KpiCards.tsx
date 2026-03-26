'use client';

import React from 'react';
import { KpiItem } from './types';

export interface KpiCardsProps {
  items: KpiItem[];
  isLoading?: boolean;
}

const colorConfig = {
  primary: {
    bg: 'bg-primary-50',
    icon: 'text-primary-600',
    iconBg: 'bg-blue-100',
  },
  success: {
    bg: 'bg-emerald-50',
    icon: 'text-emerald-600',
    iconBg: 'bg-emerald-100',
  },
  warning: {
    bg: 'bg-amber-50',
    icon: 'text-amber-600',
    iconBg: 'bg-amber-100',
  },
  critical: {
    bg: 'bg-red-50',
    icon: 'text-red-600',
    iconBg: 'bg-red-100',
  },
  info: {
    bg: 'bg-sky-50',
    icon: 'text-sky-600',
    iconBg: 'bg-sky-100',
  },
};

/**
 * KpiCards - Compact version
 * Displays KPIs in a horizontal bar layout
 */
export function KpiCards({ items, isLoading = false }: KpiCardsProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {items.map((item, idx) => {
        const colors = colorConfig[item.color as keyof typeof colorConfig] || colorConfig.primary;
        const Icon = item.icon;
        
        return (
          <div
            key={idx}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow transition`}
          >
            <div className={`flex items-center justify-center w-8 h-8 rounded-md ${colors.iconBg}`}>
              <Icon className={`w-4 h-4 ${colors.icon}`} />
            </div>
            <div className="flex flex-col">
              {isLoading ? (
                <div className="h-5 w-10 bg-gray-200 rounded animate-pulse" />
              ) : (
                <span className="text-lg font-bold text-gray-900 leading-none">
                  {item.value}
                </span>
              )}
              <span className="text-[11px] text-gray-500 font-medium">
                {item.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

