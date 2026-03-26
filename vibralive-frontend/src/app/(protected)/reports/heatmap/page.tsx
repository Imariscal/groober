'use client';

import React, { useState, useEffect } from 'react';
import { FiMap, FiDownload, FiFilter } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { ReportsLayout } from '@/components/reports/ReportsLayout';
import { KPICard } from '@/components/dashboard';

// Mock data for heat zones
const heatmapData = [
  { zona: 'Centro', clientes: 156, citas: 287, ingresos: 8610, densidad: 'muy alta' },
  { zona: 'Sur', clientes: 98, citas: 165, ingresos: 4950, densidad: 'alta' },
  { zona: 'Norte', clientes: 72, citas: 98, ingresos: 2940, densidad: 'media' },
  { zona: 'Este', clientes: 65, citas: 87, ingresos: 2610, densidad: 'media' },
  { zona: 'Oeste', clientes: 42, citas: 54, ingresos: 1620, densidad: 'baja' },
  { zona: 'Periferia', clientes: 28, citas: 32, ingresos: 960, densidad: 'muy baja' },
];

const neighborhoodData = [
  { barrio: 'La Paz', clientes: 45, utilidad: 'Alta' },
  { barrio: 'Mirafuentes', clientes: 38, utilidad: 'Alta' },
  { barrio: 'San Isidro', clientes: 35, utilidad: 'Media' },
  { barrio: 'Bellavista', clientes: 28, utilidad: 'Media' },
  { barrio: 'Villa Verde', clientes: 18, utilidad: 'Baja' },
  { barrio: 'Los Alpes', clientes: 15, utilidad: 'Baja' },
  { barrio: 'Centro Histórico', clientes: 25, utilidad: 'Media' },
  { barrio: 'Novo', clientes: 12, utilidad: 'Baja' },
];

export default function HeatmapReport() {
  const [selectedZona, setSelectedZona] = useState<string | null>(null);
  const [mapData, setMapData] = useState<any>(null);

  const getDensityColor = (densidad: string) => {
    switch (densidad) {
      case 'muy alta':
        return 'bg-red-600';
      case 'alta':
        return 'bg-orange-500';
      case 'media':
        return 'bg-yellow-400';
      case 'baja':
        return 'bg-lime-400';
      case 'muy baja':
        return 'bg-slate-300';
      default:
        return 'bg-slate-300';
    }
  };

  return (
    <ReportsLayout
      title="Mapa de Zonas Calientes"
      subtitle="Distribución geográfica de clientes y demanda por zona"
    >
      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <KPICard
            icon={FiMap}
            metric="6"
            label="Zonas Geográficas"
            trend={{
              value: 0,
              direction: 'up' as const,
              period: 'análisis actual',
            }}
            color="primary"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
        >
          <KPICard
            icon={FiMap}
            metric="461"
            label="Clientes Alcanzados"
            trend={{
              value: 8,
              direction: 'up' as const,
              period: 'crecimiento geográfico',
            }}
            color="success"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
        >
          <KPICard
            icon={FiMap}
            metric="156"
            label="Mayor Concentración"
            trend={{
              value: 12,
              direction: 'up' as const,
              period: 'clientes en Centro',
            }}
            color="warning"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24 }}
        >
          <KPICard
            icon={FiDownload}
            metric="$21,690"
            label="Ingresos del Mapa"
            trend={{
              value: 15,
              direction: 'up' as const,
              period: 'vs mes anterior',
            }}
            color="info"
          />
        </motion.div>
      </div>

      {/* Heatmap Visualization */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.32 }}
        className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm mb-8"
      >
        <h3 className="font-semibold text-slate-900 mb-8">Mapa de Densidad de Clientes</h3>

        {/* Legend */}
        <div className="flex items-center justify-start gap-4 mb-8">
          <span className="text-xs font-semibold text-slate-600">DENSIDAD:</span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-red-600 rounded"></div>
              <span className="text-xs text-slate-600">Muy Alta</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-orange-500 rounded"></div>
              <span className="text-xs text-slate-600">Alta</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-yellow-400 rounded"></div>
              <span className="text-xs text-slate-600">Media</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-lime-400 rounded"></div>
              <span className="text-xs text-slate-600">Baja</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-slate-300 rounded"></div>
              <span className="text-xs text-slate-600">Muy Baja</span>
            </div>
          </div>
        </div>

        {/* Grid representation of zones */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {heatmapData.map((zona, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => setSelectedZona(zona.zona)}
              className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
                selectedZona === zona.zona
                  ? 'border-indigo-600 ring-2 ring-indigo-100'
                  : 'border-transparent'
              } ${getDensityColor(zona.densidad)}`}
            >
              <p className="font-bold text-white text-lg">{zona.zona}</p>
              <p className="text-xs text-white/90 mt-2">{zona.clientes} clientes</p>
            </motion.div>
          ))}
        </div>

        {/* Selected Zone Details */}
        {selectedZona && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-indigo-50 border border-indigo-200 rounded-lg p-6"
          >
            <h4 className="font-semibold text-indigo-900 mb-4">
              Detalles de Zona: {selectedZona}
            </h4>
            {heatmapData
              .filter((z) => z.zona === selectedZona)
              .map((zona, idx) => (
                <div key={idx} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-indigo-700 font-semibold">Clientes</p>
                    <p className="text-2xl font-bold text-indigo-900">{zona.clientes}</p>
                  </div>
                  <div>
                    <p className="text-xs text-indigo-700 font-semibold">Citas</p>
                    <p className="text-2xl font-bold text-indigo-900">{zona.citas}</p>
                  </div>
                  <div>
                    <p className="text-xs text-indigo-700 font-semibold">Ingresos</p>
                    <p className="text-2xl font-bold text-indigo-900">${zona.ingresos.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-indigo-700 font-semibold">Ticket Promedio</p>
                    <p className="text-2xl font-bold text-indigo-900">
                      ${Math.round(zona.ingresos / zona.citas)}
                    </p>
                  </div>
                </div>
              ))}
          </motion.div>
        )}
      </motion.div>

      {/* Neighborhoods Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.48 }}
        className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-slate-900">Barrios Principales</h3>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
            <FiDownload size={16} />
            Descargar Mapa
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-900 text-sm">
                    Barrio
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-900 text-sm">
                    Clientes
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-900 text-sm">
                    Utilidad
                  </th>
                </tr>
              </thead>
              <tbody>
                {neighborhoodData.map((barrio, index) => (
                  <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-4 px-4 text-sm text-slate-900 font-medium">{barrio.barrio}</td>
                    <td className="py-4 px-4 text-sm text-right text-slate-700">{barrio.clientes}</td>
                    <td className="py-4 px-4 text-center">
                      <span
                        className={`text-xs font-semibold px-3 py-1 rounded-full ${
                          barrio.utilidad === 'Alta'
                            ? 'bg-emerald-100 text-emerald-700'
                            : barrio.utilidad === 'Media'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {barrio.utilidad}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Growth Recommendation */}
          <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
            <h4 className="font-semibold text-slate-900 mb-4">Oportunidades de Crecimiento</h4>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-red-500 mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    Expandir en Zona Centro
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    Mayor demanda y mejor ROI. Considerar nueva sucursal.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-orange-500 mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    Reforzar Zona Sur
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    Segunda zona en demanda. Marketing localizado recomendado.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-yellow-400 mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    Explorar Zonas Periféricas
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    Bajo aprovechamiento. Potencial para campañas de adquisición.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </ReportsLayout>
  );
}
