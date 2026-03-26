'use client';

import React, { useState } from 'react';
import { FiX, FiRefreshCw } from 'react-icons/fi';

export interface CampaignReportFilters {
  status?: string;
  channel?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface CampaignReportFiltersPanelProps {
  onApply: (filters: CampaignReportFilters) => void;
  onReset?: () => void;
}

export default function CampaignReportFiltersPanel({ onApply, onReset }: CampaignReportFiltersPanelProps) {
  const [filters, setFilters] = useState<CampaignReportFilters>({
    status: 'ALL',
    channel: 'ALL',
  });

  const handleApply = () => {
    onApply(filters);
  };

  const handleReset = () => {
    const resetFilters: CampaignReportFilters = {
      status: 'ALL',
      channel: 'ALL',
    };
    setFilters(resetFilters);
    onApply(resetFilters);
    if (onReset) {
      onReset();
    }
  };

  const handleChange = (key: keyof CampaignReportFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const hasActiveFilters = (filters.status && filters.status !== 'ALL') || (filters.channel && filters.channel !== 'ALL') || filters.dateFrom || filters.dateTo;

  return (
    <div className="space-y-4">
      {/* Filters Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Estado */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">
            Estado
          </label>
          <select
            value={filters.status || 'ALL'}
            onChange={(e) => handleChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white"
          >
            <option value="ALL">Todos</option>
            <option value="DRAFT">Borrador</option>
            <option value="SCHEDULED">Programada</option>
            <option value="RUNNING">En ejecución</option>
            <option value="COMPLETED">Completada</option>
            <option value="PAUSED">Pausada</option>
            <option value="CANCELLED">Cancelada</option>
          </select>
        </div>

        {/* Canal */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">
            Canal
          </label>
          <select
            value={filters.channel || 'ALL'}
            onChange={(e) => handleChange('channel', e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white"
          >
            <option value="ALL">Todos</option>
            <option value="WHATSAPP">WhatsApp</option>
            <option value="EMAIL">Email</option>
          </select>
        </div>

        {/* Fecha Desde */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">
            Desde
          </label>
          <input
            type="date"
            value={filters.dateFrom || ''}
            onChange={(e) => handleChange('dateFrom', e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white"
          />
        </div>

        {/* Fecha Hasta */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">
            Hasta
          </label>
          <input
            type="date"
            value={filters.dateTo || ''}
            onChange={(e) => handleChange('dateTo', e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end pt-2 border-t border-slate-200">
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
