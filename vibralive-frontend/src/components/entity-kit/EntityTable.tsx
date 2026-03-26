'use client';

import React from 'react';
import { ColumnDef, EntityAction } from './types';

export interface EntityTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  isLoading?: boolean;
  rowActions?: (row: T) => EntityAction[];
  onRowActionClick?: (action: EntityAction, row: T) => void;
  onRowClick?: (row: T) => void;
}

/**
 * EntityTable
 * Generic, reusable table component for displaying entity data
 * 
 * Features:
 * - Configurable columns via ColumnDef[]
 * - Optional row actions (edit, delete, etc.) displayed as quick action buttons
 * - Responsive with horizontal scroll on mobile
 * - Action buttons with icons displayed inline
 */
export function EntityTable<T extends { id: string }>({
  data,
  columns,
  isLoading = false,
  rowActions,
  onRowActionClick,
  onRowClick,
}: EntityTableProps<T>) {
  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">No hay datos para mostrar</p>
      </div>
    );
  }

  const actions = rowActions ? rowActions(data[0]) : [];

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-6 py-3 text-left font-semibold text-gray-700 ${col.width || ''}`}
              >
                {col.label}
              </th>
            ))}
            {actions.length > 0 && (
              <th className="px-6 py-3 text-center font-semibold text-gray-700">
                Acciones
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.map((row) => (
            <tr
              key={row.id}
              className={`hover:bg-gray-50 transition ${onRowClick ? 'cursor-pointer' : ''}`}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((col) => (
                <td
                  key={`${row.id}-${col.key}`}
                  className={`px-6 py-4 ${col.width || ''}`}
                >
                  {col.accessor(row)}
                </td>
              ))}
              {actions.length > 0 && (
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    {actions.map((action) => (
                      <button
                        key={action.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onRowActionClick?.(action, row);
                        }}
                        className={`
                          p-1.5 rounded-lg transition-colors
                          ${
                            action.variant === 'danger'
                              ? 'text-red-600 hover:bg-red-100'
                              : action.variant === 'secondary'
                                ? 'text-orange-500 hover:bg-orange-100'
                                : 'text-blue-600 hover:bg-blue-100'
                          }
                        `}
                        title={action.label}
                      >
                        {action.icon && <action.icon className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
