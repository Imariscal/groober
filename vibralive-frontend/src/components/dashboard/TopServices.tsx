'use client';

import React from 'react';
import { MdArrowRight, MdTrendingUp } from 'react-icons/md';

interface TopServicesProps {
  services: any[];
}

export const TopServices: React.FC<TopServicesProps> = ({ services }) => {
  if (!services || services.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Top Servicios</h3>
        <p className="text-center text-slate-500 py-8">No hay datos de servicios disponibles</p>
      </div>
    );
  }

  // Calcular total para porcentajes
  const total = services.reduce((sum, s) => sum + (s.revenue || s.total_revenue || 0), 0);

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Top Servicios</h3>
        <MdTrendingUp className="w-5 h-5 text-slate-400" />
      </div>

      <div className="space-y-4">
        {services.slice(0, 5).map((service, index) => {
          const revenue = service.revenue || service.total_revenue || 0;
          const percentage = total > 0 ? ((revenue / total) * 100).toFixed(1) : '0.0';
          const appointmentCount = service.appointment_count || service.citas || service.count || 0;
          const avgPrice = service.avg_price || service.average_price || (appointmentCount > 0 ? revenue / appointmentCount : 0);

          return (
            <div key={service.id || index} className="flex items-start gap-4">
              {/* Rank Badge */}
              <div className="flex-shrink-0">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm ${
                    index === 0
                      ? 'bg-yellow-500'
                      : index === 1
                        ? 'bg-gray-400'
                        : index === 2
                          ? 'bg-orange-600'
                          : 'bg-slate-400'
                  }`}
                >
                  {index + 1}
                </div>
              </div>

              {/* Service Info */}
              <div className="flex-grow min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="font-semibold text-slate-900 truncate">{service.name}</p>
                  <span className="flex-shrink-0 text-xs font-semibold text-emerald-600 whitespace-nowrap">
                    {percentage}%
                  </span>
                </div>

                {/* Info Row */}
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <span>{appointmentCount} cita{appointmentCount !== 1 ? 's' : ''}</span>
                  <span>•</span>
                  <span>${avgPrice.toLocaleString('es-MX', { maximumFractionDigits: 0 })} promedio</span>
                </div>

                {/* Progress Bar */}
                <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>

              {/* Revenue */}
              <div className="flex-shrink-0 text-right">
                <p className="font-bold text-slate-900">
                  ${revenue.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                </p>
                <MdArrowRight className="w-4 h-4 text-emerald-600 ml-auto" />
              </div>
            </div>
          );
        })}
      </div>

      {services.length > 5 && (
        <div className="mt-4 pt-4 border-t border-slate-100 text-center">
          <p className="text-sm text-slate-500">
            +{services.length - 5} servicios más
          </p>
        </div>
      )}
    </div>
  );
};
