'use client';

import React, { useState } from 'react';
import { FiCalendar, FiPhone, FiX, FiRefreshCw } from 'react-icons/fi';
import { type NotificationFilters } from '@/store/notificationStore';

interface NotificationFiltersPanelProps {
  onApply: (filters: NotificationFilters) => void;
}

export default function NotificationFiltersPanel({ onApply }: NotificationFiltersPanelProps) {
  const [filters, setFilters] = useState<NotificationFilters>({
    page: 1,
    limit: 20,
  });

  const handleApply = () => {
    onApply(filters);
  };

  const handleReset = () => {
    setFilters({ page: 1, limit: 20 });
    onApply({ page: 1, limit: 20 });
  };

  const hasActiveFilters =
    filters.dateFrom ||
    filters.dateTo ||
    filters.phoneNumber ||
    filters.status ||
    filters.direction ||
    filters.messageType ||
    filters.errorsOnly;

  return (
    <div className="space-y-4">
      {/* Filters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Date From */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <FiCalendar className="w-4 h-4" />
              <span>Desde</span>
            </div>
          </label>
          <input
            type="date"
            value={filters.dateFrom ? filters.dateFrom.toISOString().split('T')[0] : ''}
            onChange={(e) =>
              setFilters({
                ...filters,
                dateFrom: e.target.value ? new Date(e.target.value) : undefined,
              })
            }
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>

        {/* Date To */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <FiCalendar className="w-4 h-4" />
              <span>Hasta</span>
            </div>
          </label>
          <input
            type="date"
            value={filters.dateTo ? filters.dateTo.toISOString().split('T')[0] : ''}
            onChange={(e) =>
              setFilters({
                ...filters,
                dateTo: e.target.value ? new Date(e.target.value) : undefined,
              })
            }
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>

        {/* Phone Number */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <FiPhone className="w-4 h-4" />
              <span>Teléfono</span>
            </div>
          </label>
          <input
            type="tel"
            placeholder="+52..."
            value={filters.phoneNumber || ''}
            onChange={(e) => setFilters({ ...filters, phoneNumber: e.target.value })}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">
            Estado
          </label>
          <select
            value={filters.status || ''}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          >
            <option value="">Todos</option>
            <option value="delivered">Entregado</option>
            <option value="read">Leído</option>
            <option value="sent">Enviado</option>
            <option value="failed">Fallido</option>
          </select>
        </div>

        {/* Direction */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">
            Dirección
          </label>
          <select
            value={filters.direction || ''}
            onChange={(e) => setFilters({ ...filters, direction: e.target.value as any })}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          >
            <option value="">Todos</option>
            <option value="inbound">Entrante</option>
            <option value="outbound">Saliente</option>
          </select>
        </div>

        {/* Message Type */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">
            Tipo Mensaje
          </label>
          <select
            value={filters.messageType || ''}
            onChange={(e) => setFilters({ ...filters, messageType: e.target.value })}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          >
            <option value="">Todos</option>
            <option value="text">Texto</option>
            <option value="template">Plantilla</option>
            <option value="image">Imagen</option>
            <option value="document">Documento</option>
          </select>
        </div>
      </div>

      {/* Checkboxes */}
      <div>
        <label className="inline-flex items-center gap-3 px-3 py-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition">
          <input
            type="checkbox"
            checked={filters.errorsOnly || false}
            onChange={(e) => setFilters({ ...filters, errorsOnly: e.target.checked })}
            className="w-4 h-4 border-slate-300 rounded text-blue-600 focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-slate-700">Solo Errores</span>
        </label>
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end pt-2">
        {hasActiveFilters && (
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition text-sm"
          >
            <FiX className="w-4 h-4" />
            <span>Limpiar</span>
          </button>
        )}
        <button
          onClick={handleApply}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition text-sm"
        >
          <FiRefreshCw className="w-4 h-4" />
          <span>Aplicar</span>
        </button>
      </div>
    </div>
  );
}
