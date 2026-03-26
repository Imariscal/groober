'use client';

import React, { useState } from 'react';
import { FiDownload, FiFilter } from 'react-icons/fi';
import { displayFormatters } from '@/lib/datetime-tz';

interface InventoryMovementHistoryProps {
  movements: any[];
  clinicTimezone?: string;
}

const MOVEMENT_TYPES = {
  'add': { label: 'Entrada', color: 'green' },
  'remove': { label: 'Salida', color: 'red' },
  'adjustment': { label: 'Ajuste', color: 'blue' },
  'return': { label: 'Devolución', color: 'purple' },
};

export default function InventoryMovementHistory({
  movements = [],
  clinicTimezone = 'UTC',
}: InventoryMovementHistoryProps) {
  const [filterType, setFilterType] = useState<string>('all');

  const filteredMovements = filterType === 'all'
    ? movements
    : movements.filter(m => m.type === filterType);

  const handleExport = () => {
    const csv = [
      ['Fecha', 'Producto', 'Tipo', 'Cantidad', 'Razón', 'Usuario'],
      ...filteredMovements.map(m => [
        displayFormatters.formatDateOnly(m.createdAt, clinicTimezone),
        m.productName,
        MOVEMENT_TYPES[m.type as keyof typeof MOVEMENT_TYPES]?.label || m.type,
        m.quantity,
        m.reason || '-',
        m.userName || '-',
      ]),
    ]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `movimientos-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex gap-4 items-end">
        <div className="flex items-center gap-2">
          <FiFilter className="text-gray-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos los tipos</option>
            {Object.entries(MOVEMENT_TYPES).map(([key, value]) => (
              <option key={key} value={key}>
                {value.label}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
        >
          <FiDownload size={18} />
          Exportar
        </button>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="divide-y divide-gray-200 max-h-[500px] overflow-y-auto">
          {filteredMovements.length > 0 ? (
            filteredMovements.map((movement, idx) => {
              const typeInfo = MOVEMENT_TYPES[movement.type as keyof typeof MOVEMENT_TYPES] || {
                label: movement.type,
                color: 'gray',
              };
              const colorClass = {
                green: 'bg-green-50 border-l-green-500',
                red: 'bg-red-50 border-l-red-500',
                blue: 'bg-blue-50 border-l-blue-500',
                purple: 'bg-purple-50 border-l-purple-500',
                gray: 'bg-gray-50 border-l-gray-500',
              }[typeInfo.color as 'green' | 'red' | 'blue' | 'purple' | 'gray'];

              const textColorClass = {
                green: 'text-green-700',
                red: 'text-red-700',
                blue: 'text-blue-700',
                purple: 'text-purple-700',
                gray: 'text-gray-700',
              }[typeInfo.color as 'green' | 'red' | 'blue' | 'purple' | 'gray'];

              return (
                <div
                  key={movement.id || idx}
                  className={`border-l-4 p-6 transition hover:bg-opacity-75 ${colorClass}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${textColorClass} bg-white`}
                        >
                          {typeInfo.label}
                        </span>
                        <span className="text-sm text-gray-600">
                          {displayFormatters.formatCompact(movement.createdAt, clinicTimezone)}
                        </span>
                      </div>
                      <p className="font-semibold text-gray-900">
                        {movement.productName}
                      </p>
                      <div className="mt-2 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-600">Cantidad</p>
                          <p className="text-lg font-bold text-gray-900">
                            {movement.quantity} unidades
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Usuario</p>
                          <p className="text-sm text-gray-900">
                            {movement.userName || 'Sistema'}
                          </p>
                        </div>
                      </div>
                      {movement.reason && (
                        <p className="mt-2 text-sm text-gray-700">
                          <span className="font-semibold">Razón:</span> {movement.reason}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-gray-500">
              No hay movimientos de inventario
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      {filteredMovements.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(MOVEMENT_TYPES).map(([key, value]) => {
            const count = filteredMovements.filter(m => m.type === key).length;
            const total = filteredMovements
              .filter(m => m.type === key)
              .reduce((sum, m) => sum + (m.quantity || 0), 0);

            return (
              <div key={key} className="bg-white rounded-lg border border-gray-200 p-4">
                <p className="text-xs text-gray-600 uppercase">{value.label}</p>
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                <p className="text-sm text-gray-600">{total} unidades</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
