'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSearch,
  FiFilter,
  FiSettings,
  FiDownload,
  FiMoreVertical,
  FiEdit,
  FiTrash2,
  FiEye,
  FiCopy,
} from 'react-icons/fi';

export interface TableToolbarProps {
  onSearch?: (query: string) => void;
  onFilterClick?: () => void;
  onColumnsClick?: () => void;
  onExportClick?: () => void;
  searchPlaceholder?: string;
  showExport?: boolean;
}

export function TableToolbar({
  onSearch,
  onFilterClick,
  onColumnsClick,
  onExportClick,
  searchPlaceholder = 'Buscar en tabla...',
  showExport = true,
}: TableToolbarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearch?.(value);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center px-4 py-3 bg-slate-50 border-b border-slate-200"
    >
      {/* Search Input */}
      <div className="flex-1 relative">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={handleSearchChange}
          className={`
            w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200
            text-sm placeholder:text-slate-400
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
            transition-colors
          `}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 items-center flex-shrink-0">
        {onFilterClick && (
          <button
            onClick={onFilterClick}
            className={`
              flex items-center justify-center gap-2 px-3 py-2 rounded-lg
              text-sm font-medium text-slate-700 bg-white border border-slate-200
              hover:bg-slate-50 transition-colors
              focus:outline-none focus:ring-2 focus:ring-primary-500
            `}
            title="Filtros"
          >
            <FiFilter className="w-4 h-4" />
            <span className="hidden sm:inline">Filtros</span>
          </button>
        )}

        {onColumnsClick && (
          <button
            onClick={onColumnsClick}
            className={`
              flex items-center justify-center gap-2 px-3 py-2 rounded-lg
              text-sm font-medium text-slate-700 bg-white border border-slate-200
              hover:bg-slate-50 transition-colors
              focus:outline-none focus:ring-2 focus:ring-primary-500
            `}
            title="Columnas"
          >
            <FiSettings className="w-4 h-4" />
            <span className="hidden sm:inline">Columnas</span>
          </button>
        )}

        {showExport && onExportClick && (
          <button
            onClick={onExportClick}
            className={`
              flex items-center justify-center gap-2 px-3 py-2 rounded-lg
              text-sm font-medium text-slate-700 bg-white border border-slate-200
              hover:bg-slate-50 transition-colors
              focus:outline-none focus:ring-2 focus:ring-primary-500
            `}
            title="Exportar"
          >
            <FiDownload className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar</span>
          </button>
        )}
      </div>
    </motion.div>
  );
}

export interface RowAction {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger';
  divider?: boolean;
}

export interface RowActionsMenuProps {
  actions: RowAction[];
  rowId?: string;
}

export function RowActionsMenu({ actions, rowId }: RowActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          p-2 rounded-lg transition-colors
          text-slate-600 hover:text-slate-900 hover:bg-slate-100
          focus:outline-none focus:ring-2 focus:ring-primary-500
          ${isOpen ? 'bg-slate-100' : ''}
        `}
        title="Acciones"
      >
        <FiMoreVertical className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-30"
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -8 }}
              transition={{ duration: 0.15 }}
              className={`
                absolute right-0 top-full mt-1 z-40
                min-w-48 bg-white rounded-lg border border-slate-200 shadow-lg
                overflow-hidden
              `}
            >
              {actions.map((action, idx) => (
                <React.Fragment key={idx}>
                  {action.divider && (
                    <div className="h-px bg-slate-200 my-1" />
                  )}
                  <button
                    onClick={() => {
                      action.onClick();
                      setIsOpen(false);
                    }}
                    className={`
                      w-full px-4 py-2.5 flex items-center gap-3 text-sm
                      transition-colors text-left
                      ${
                        action.variant === 'danger'
                          ? 'text-critical-600 hover:bg-critical-50'
                          : 'text-slate-700 hover:bg-slate-50'
                      }
                      focus:outline-none focus-visible:bg-slate-100
                    `}
                  >
                    {action.icon}
                    <span>{action.label}</span>
                  </button>
                </React.Fragment>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Preset row actions factory
 * @example
 * const actions = makeRowActions({
 *   onEdit: () => router.push(`/clients/${id}/edit`),
 *   onView: () => router.push(`/clients/${id}`),
 *   onDelete: () => setShowDeleteModal(true),
 * });
 */
export function makeRowActions({
  onEdit,
  onView,
  onDelete,
  onCopy,
}: {
  onEdit?: () => void;
  onView?: () => void;
  onDelete?: () => void;
  onCopy?: () => void;
}): RowAction[] {
  const actions: RowAction[] = [];

  if (onView) {
    actions.push({
      label: 'Ver detalles',
      icon: <FiEye className="w-4 h-4" />,
      onClick: onView,
    });
  }

  if (onEdit) {
    actions.push({
      label: 'Editar',
      icon: <FiEdit className="w-4 h-4" />,
      onClick: onEdit,
    });
  }

  if (onCopy) {
    actions.push({
      label: 'Duplicar',
      icon: <FiCopy className="w-4 h-4" />,
      onClick: onCopy,
    });
  }

  if (onDelete) {
    actions.push(
      {
        divider: true,
      } as unknown as RowAction,
      {
        label: 'Eliminar',
        icon: <FiTrash2 className="w-4 h-4" />,
        onClick: onDelete,
        variant: 'danger',
      }
    );
  }

  return actions;
}

export interface BulkActionBarProps {
  selectedCount: number;
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
  actions: Array<{
    label: string;
    onClick: () => void;
    variant?: 'default' | 'danger';
    icon?: React.ReactNode;
  }>;
}

export function BulkActionBar({
  selectedCount,
  onSelectAll,
  onDeselectAll,
  actions,
}: BulkActionBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className={`
        fixed bottom-0 left-0 right-0 sm:relative z-20
        bg-white border-t border-slate-200 shadow-lg
        px-4 py-3 flex items-center justify-between gap-4 flex-wrap
      `}
    >
      {/* Count & Clear */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-slate-900">
          {selectedCount} seleccionado{selectedCount !== 1 ? 's' : ''}
        </span>
        {onDeselectAll && (
          <button
            onClick={onDeselectAll}
            className="text-xs text-slate-600 hover:text-slate-900 underline"
          >
            Limpiar selección
          </button>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        {actions.map((action, idx) => (
          <button
            key={idx}
            onClick={action.onClick}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
              transition-colors
              ${
                action.variant === 'danger'
                  ? 'bg-critical-500 hover:bg-critical-600 text-white'
                  : 'bg-primary-500 hover:bg-primary-600 text-white'
              }
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
            `}
          >
            {action.icon}
            {action.label}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
