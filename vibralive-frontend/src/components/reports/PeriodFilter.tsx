'use client';

import React, { useState } from 'react';
import { MdCalendarToday, MdDateRange } from 'react-icons/md';

export type PeriodType = 'today' | 'week' | 'month' | 'year' | 'custom';

interface PeriodFilterProps {
  onPeriodChange: (period: PeriodType, startDate?: string, endDate?: string) => void;
  selectedPeriod?: PeriodType;
  selectedStartDate?: string;
  selectedEndDate?: string;
}

/**
 * Componente de filtro de período reutilizable
 * Soporta: Hoy, Semana, Mes, Año, y Rango Custom (máx 60 días en UTC)
 */
export const PeriodFilter: React.FC<PeriodFilterProps> = ({
  onPeriodChange,
  selectedPeriod = 'month',
  selectedStartDate,
  selectedEndDate,
}) => {
  const [showCustom, setShowCustom] = useState(selectedPeriod === 'custom');
  const [startDate, setStartDate] = useState(selectedStartDate || '');
  const [endDate, setEndDate] = useState(selectedEndDate || '');
  const [error, setError] = useState('');

  // Función para obtener la fecha actual en formato YYYY-MM-DD (sin cambio de zona)
  const getTodayDate = (): string => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Función para obtener la fecha de ayer en formato YYYY-MM-DD
  const getYesterdayDate = (): string => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  };

  const handlePeriodClick = (period: PeriodType) => {
    setShowCustom(period === 'custom');
    setError('');
    if (period !== 'custom') {
      onPeriodChange(period);
    } else {
      // Cuando se selecciona custom, establecer automáticamente ayer a hoy
      const yesterday = getYesterdayDate();
      const today = getTodayDate();
      setStartDate(yesterday);
      setEndDate(today);
      // No llamamos a onPeriodChange aquí, esperamos a que haga clic en "Aplicar Rango"
    }
  };

  const handleCustomFilter = () => {
    // Validar que ambas fechas estén seleccionadas
    if (!startDate || !endDate) {
      setError('Selecciona fecha inicio y fin');
      return;
    }

    // Convertir a Date en UTC
    const start = new Date(startDate + 'T00:00:00Z');
    const end = new Date(endDate + 'T23:59:59Z');

    // Validar que start sea menor a end
    if (start >= end) {
      setError('La fecha inicio debe ser menor que la fecha fin');
      return;
    }

    // Validar máximo 60 días
    const diffMs = end.getTime() - start.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffDays > 60) {
      setError('El rango no puede exceder 60 días');
      return;
    }

    setError('');
    onPeriodChange('custom', startDate, endDate);
  };

  const periods = [
    { id: 'today', label: 'Hoy' },
    { id: 'week', label: 'Esta Semana' },
    { id: 'month', label: 'Este Mes' },
    { id: 'year', label: 'Este Año' },
    { id: 'custom', label: 'Rango Custom' },
  ];

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-900">Período</h3>
        <MdCalendarToday className="w-4 h-4 text-slate-400" />
      </div>

      {/* Period buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        {periods.map((period) => (
          <button
            key={period.id}
            onClick={() => handlePeriodClick(period.id as PeriodType)}
            className={`px-3 py-2 text-xs font-medium rounded-lg transition-all ${
              selectedPeriod === period.id
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {period.label}
          </button>
        ))}
      </div>

      {/* Custom date range */}
      {showCustom && (
        <div className="space-y-3 pt-4 border-t border-slate-200">
          <div className="flex items-center gap-2 text-slate-600 mb-3">
            <MdDateRange className="w-4 h-4" />
            <span className="text-xs font-medium">Rango personalizado (máx 60 días)</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Desde</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Hasta</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

          <button
            onClick={handleCustomFilter}
            className="w-full py-2 px-3 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Aplicar Rango
          </button>
        </div>
      )}
    </div>
  );
};
