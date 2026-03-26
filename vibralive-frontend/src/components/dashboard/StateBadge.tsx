'use client';

import React from 'react';
import { FiCheck, FiCircle, FiClock, FiX } from 'react-icons/fi';

type BadgeStatus = 'active' | 'inactive' | 'pending' | 'archived' | 'success' | 'warning' | 'critical';

interface StateBadgeProps {
  status: BadgeStatus;
  label?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig = {
  active: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    icon: FiCheck,
    defaultLabel: 'Activo',
  },
  inactive: {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
    icon: FiCircle,
    defaultLabel: 'Inactivo',
  },
  pending: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    icon: FiClock,
    defaultLabel: 'Pendiente',
  },
  archived: {
    bg: 'bg-slate-50',
    text: 'text-slate-500',
    border: 'border-slate-200',
    icon: FiX,
    defaultLabel: 'Archivado',
  },
  success: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    icon: FiCheck,
    defaultLabel: 'Éxito',
  },
  warning: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    icon: FiClock,
    defaultLabel: 'Advertencia',
  },
  critical: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    icon: FiX,
    defaultLabel: 'Crítico',
  },
};

const sizeConfig = {
  sm: {
    px: 'px-2',
    py: 'py-1',
    text: 'text-xs',
    gap: 'gap-1',
    icon: 'w-3 h-3',
  },
  md: {
    px: 'px-3',
    py: 'py-1.5',
    text: 'text-sm',
    gap: 'gap-1.5',
    icon: 'w-4 h-4',
  },
  lg: {
    px: 'px-4',
    py: 'py-2',
    text: 'text-base',
    gap: 'gap-2',
    icon: 'w-5 h-5',
  },
};

export function StateBadge({
  status,
  label,
  showIcon = true,
  size = 'md',
}: StateBadgeProps) {
  const config = statusConfig[status];
  const sizeStyle = sizeConfig[size];
  const Icon = config.icon;

  return (
    <div
      className={`
        inline-flex items-center
        ${sizeStyle.px} ${sizeStyle.py}
        rounded-full
        border ${config.border}
        ${config.bg}
        ${config.text}
        ${sizeStyle.text}
        font-medium
        ${sizeStyle.gap}
        whitespace-nowrap
      `}
    >
      {showIcon && <Icon className={sizeStyle.icon} />}
      <span>{label || config.defaultLabel}</span>
    </div>
  );
}

// Grid de badges para múltiples estados
interface StateBadgeGridProps {
  items: Array<{ id: string; status: BadgeStatus; label?: string }>;
  size?: 'sm' | 'md' | 'lg';
}

export function StateBadgeGrid({ items, size = 'md' }: StateBadgeGridProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <StateBadge
          key={item.id}
          status={item.status}
          label={item.label}
          size={size}
        />
      ))}
    </div>
  );
}
