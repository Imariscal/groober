'use client';

import React from 'react';
import { motion } from 'framer-motion';

/**
 * COMPONENTE WRAPPER PARA GRÁFICAS
 * Proporciona un contenedor consistente para gráficas
 */
export interface ChartWrapperProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  rightActions?: React.ReactNode;
  footer?: React.ReactNode;
  isLoading?: boolean;
}

export function ChartWrapper({
  title,
  subtitle,
  children,
  rightActions,
  footer,
  isLoading = false,
}: ChartWrapperProps) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          {subtitle && <p className="text-sm text-slate-600 mt-1">{subtitle}</p>}
        </div>
        {rightActions && <div className="flex-shrink-0">{rightActions}</div>}
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin">
              <div className="w-8 h-8 border-4 border-slate-200 border-t-primary-500 rounded-full" />
            </div>
          </div>
        ) : (
          children
        )}
      </div>

      {/* Footer */}
      {footer && (
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 text-sm text-slate-600">
          {footer}
        </div>
      )}
    </div>
  );
}

/**
 * COMPONENTE WRAPPER PARA TABLAS
 * Proporciona estructura consistente con header, tabla y paginación
 */
export interface TableWrapperProps {
  title: string;
  columns: Array<{
    key: string;
    label: string;
    sortable?: boolean;
    width?: string;
  }>;
  data: Array<Record<string, any>>;
  renderCell?: (value: any, column: string) => React.ReactNode;
  isLoading?: boolean;
  onSort?: (column: string) => void;
  actions?: {
    label: string;
    onClick: (row: any) => void;
  }[];
  rightActions?: React.ReactNode;
  footer?: React.ReactNode;
}

export function TableWrapper({
  title,
  columns,
  data,
  renderCell,
  isLoading = false,
  onSort,
  actions,
  rightActions,
  footer,
}: TableWrapperProps) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        {rightActions && <div>{rightActions}</div>}
      </div>

      {/* Table */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-6 py-3 text-left text-xs font-semibold text-slate-600"
                  style={{ width: col.width }}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && (
                      <button
                        onClick={() => onSort?.(col.key)}
                        className="p-1 hover:bg-slate-100 rounded"
                        aria-label="Ordenar"
                      >
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </th>
              ))}
              {actions && <th className="px-6 py-3 text-xs font-semibold text-slate-600">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="px-6 py-8 text-center">
                  <div className="flex justify-center">
                    <div className="animate-spin">
                      <div className="w-6 h-6 border-3 border-slate-200 border-t-primary-500 rounded-full" />
                    </div>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="px-6 py-12 text-center text-slate-600"
                >
                  <p className="text-sm">Sin datos para mostrar</p>
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <motion.tr
                  key={idx}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.02 }}
                  className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  {columns.map((col) => (
                    <td
                      key={`${idx}-${col.key}`}
                      className="px-6 py-4 text-sm"
                      style={{ width: col.width }}
                    >
                      {renderCell ? renderCell(row[col.key], col.key) : row[col.key]}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {actions.map((action, aIdx) => (
                          <button
                            key={aIdx}
                            onClick={() => action.onClick(row)}
                            className="px-2 py-1 text-xs font-medium text-primary-500 hover:text-primary-600"
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    </td>
                  )}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      {footer && (
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 text-sm text-slate-600">
          {footer}
        </div>
      )}
    </div>
  );
}

/**
 * COMPONENTE CARD GENÉRICO
 * Para secciones de contenido genérico
 */
export interface CardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  border?: boolean;
  shadow?: boolean;
  padding?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Card({
  title,
  subtitle,
  children,
  footer,
  border = true,
  shadow = true,
  padding = 'md',
  className = '',
}: CardProps) {
  const paddingClass = {
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8',
  }[padding];

  return (
    <div
      className={`
        bg-white rounded-lg
        ${border ? 'border border-slate-200' : ''}
        ${shadow ? 'shadow-xs' : ''}
        overflow-hidden
        ${className}
      `}
    >
      {(title || subtitle) && (
        <div className={`border-b border-slate-200 ${paddingClass}`}>
          {title && <h3 className="text-lg font-semibold text-slate-900">{title}</h3>}
          {subtitle && <p className="text-sm text-slate-600 mt-1">{subtitle}</p>}
        </div>
      )}

      <div className={paddingClass}>{children}</div>

      {footer && (
        <div className={`border-t border-slate-200 bg-slate-50 ${paddingClass} text-sm text-slate-600`}>
          {footer}
        </div>
      )}
    </div>
  );
}

/**
 * COMPONENTE ALERT
 * Para mensajes de error, éxito, advertencia, etc.
 */
export interface AlertProps {
  type: 'success' | 'warning' | 'critical' | 'info';
  title: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  onClose?: () => void;
  dismissible?: boolean;
}

const alertConfig = {
  success: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    title: 'text-emerald-900',
    text: 'text-emerald-800',
    icon: '✓',
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    title: 'text-amber-900',
    text: 'text-amber-800',
    icon: '⚠',
  },
  critical: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    title: 'text-red-900',
    text: 'text-red-800',
    icon: '✕',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    title: 'text-blue-900',
    text: 'text-blue-800',
    icon: 'ℹ',
  },
};

export function Alert({
  type,
  title,
  message,
  action,
  onClose,
  dismissible = true,
}: AlertProps) {
  const [isVisible, setIsVisible] = React.useState(true);

  if (!isVisible) return null;

  const config = alertConfig[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`${config.bg} ${config.border} border rounded-lg p-4`}
    >
      <div className="flex gap-3">
        <div className={`flex-shrink-0 text-lg ${config.title}`}>{config.icon}</div>
        <div className="flex-1">
          <h4 className={`text-sm font-semibold ${config.title}`}>{title}</h4>
          {message && <p className={`text-sm mt-1 ${config.text}`}>{message}</p>}
          {action && (
            <button
              onClick={action.onClick}
              className={`text-xs font-semibold mt-2 ${config.title} hover:underline`}
            >
              {action.label} →
            </button>
          )}
        </div>
        {dismissible && (
          <button
            onClick={() => {
              setIsVisible(false);
              onClose?.();
            }}
            className={`flex-shrink-0 ${config.text} hover:opacity-75`}
          >
            ×
          </button>
        )}
      </div>
    </motion.div>
  );
}

/**
 * COMPONENTE HELPER - STAT
 * Para mostrar una estadística con etiqueta
 */
export interface StatProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
}

export function Stat({ label, value, change, changeType = 'neutral' }: StatProps) {
  const changeColor = {
    positive: 'text-success-600',
    negative: 'text-critical-600',
    neutral: 'text-slate-600',
  }[changeType];

  return (
    <div>
      <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">{label}</p>
      <div className="flex items-baseline gap-2 mt-1">
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        {change && <p className={`text-xs font-medium ${changeColor}`}>{change}</p>}
      </div>
    </div>
  );
}

/**
 * COMPONENTE EMPTY STATE
 * Para cuando no hay datos qué mostrar
 */
export interface EmptyStateProps {
  icon?: string | React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon = '📭', title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-3xl mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-1">{title}</h3>
      {description && <p className="text-sm text-slate-600 mb-4">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

/**
 * COMPONENTE SKELETON LOADER
 * Para animación de carga
 */
export interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  count?: number;
}

export function Skeleton({ variant = 'text', width, height, count = 1 }: SkeletonProps) {
  const baseClasses = 'bg-slate-200 animate-pulse';
  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className={`${baseClasses} ${variantClasses[variant]}`}
          style={{
            width: width || '100%',
            height: height || (variant === 'text' ? 'auto' : '40px'),
          }}
        />
      ))}
    </div>
  );
}

export default {
  ChartWrapper,
  TableWrapper,
  Card,
  Alert,
  Stat,
  EmptyState,
  Skeleton,
};
