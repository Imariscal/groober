/**
 * Componente: DurationBreakdownCard
 * Muestra el desglose y cálculo de duración para citas grooming
 */

'use client';

import React from 'react';
import { FiClock } from 'react-icons/fi';

interface DurationBreakdownCardProps {
  durationInfo: {
    calculation: {
      servicesTotal: number;
      comboReduction: number;
      calculatedDuration: number;
      slot: {
        minutes: number;
        label: string;
      };
      breakdown: Array<{
        serviceId: string;
        serviceName: string;
        duration: number;
      }>;
    };
  } | null;
  className?: string;
}

export function DurationBreakdownCard({
  durationInfo,
  className = '',
}: DurationBreakdownCardProps) {
  if (!durationInfo?.calculation) {
    return null;
  }

  const { breakdown, servicesTotal, comboReduction, slot } = durationInfo.calculation;

  return (
    <div className={`rounded-lg bg-blue-50 border border-blue-200 p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <FiClock className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-gray-900 text-lg">
          Duración Calculada
        </h3>
      </div>

      {/* Breakdown Items */}
      <div className="bg-white rounded p-3 mb-3 space-y-2 max-h-[150px] overflow-y-auto">
        {breakdown.map((item, idx) => (
          <div key={idx} className="flex justify-between text-sm">
            <span className="text-gray-700">{item.serviceName}</span>
            <span className="font-medium text-gray-900">{item.duration} min</span>
          </div>
        ))}

        {/* Subtotal divider */}
        <div className="border-t pt-2 mt-2">
          <div className="flex justify-between text-sm font-medium">
            <span className="text-gray-700">Subtotal</span>
            <span className="text-gray-900">{servicesTotal} min</span>
          </div>
        </div>

        {/* Combo reduction */}
        {comboReduction > 0 && (
          <div className="flex justify-between text-sm text-green-700 font-medium">
            <span>Combo (eficiencia)</span>
            <span>-{comboReduction} min</span>
          </div>
        )}

        {/* Total calculated */}
        <div className="border-t pt-2 mt-2">
          <div className="flex justify-between text-sm font-bold">
            <span className="text-gray-900">Total Calculado</span>
            <span className="text-blue-600">
              {servicesTotal - comboReduction} min
            </span>
          </div>
        </div>
      </div>

      {/* Final Slot - HIGHLIGHTED */}
      <div className="bg-gradient-to-r from-blue-100 to-blue-50 rounded-lg p-4 border border-blue-300">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-semibold text-blue-900">
            Duración Final (Redondeada)
          </span>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">
              {slot.minutes} min
            </div>
            <div className="text-sm text-blue-700 font-medium">
              {slot.label}
            </div>
          </div>
        </div>
        <p className="text-xs text-blue-600 mt-2">
          ℹ️ Se redondea al slot más cercano para optimizar disponibilidad
        </p>
      </div>
    </div>
  );
}
