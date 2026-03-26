'use client';

import React, { useState } from 'react';
import { FiAward, FiDownload, FiTrendingUp, FiStar, FiArrowLeft } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { KPICard } from '@/components/dashboard';
import Link from 'next/link';
import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { useServicesReport } from '@/hooks/useServicesReport';
import { PeriodFilter, PeriodType } from '@/components/reports/PeriodFilter';
import { LocationTypeFilter, LocationType } from '@/components/reports/LocationTypeFilter';

export default function ServicesReport() {
  const [period, setPeriod] = useState<PeriodType>('month');
  const [startDate, setStartDate] = useState<string>();
  const [endDate, setEndDate] = useState<string>();
  const [locationType, setLocationType] = useState<LocationType>('all');

  const { data, loading, error } = useServicesReport({ 
    period, 
    startDate, 
    endDate,
    locationType: locationType === 'all' ? undefined : locationType,
    paid: true, // Always show paid appointments only
  });

  const handlePeriodChange = (newPeriod: PeriodType, newStartDate?: string, newEndDate?: string) => {
    setPeriod(newPeriod);
    setStartDate(newStartDate);
    setEndDate(newEndDate);
  };

  const kpis = data?.kpis || {
    activeServices: { label: 'Servicios Activos', value: '0 servicios', trending: '' },
    mostDemanded: { label: 'Servicio más demandado', value: 'N/A', trending: '' },
    mostProfitable: { label: 'Servicio más rentable', value: '$0 MXN', trending: '' },
    availabilityRate: { label: 'Tasa de disponibilidad', value: '0%', trending: '' },
  };

  const scatterData = data?.charts.scatterDemandVsRevenue || [];
  const topByDemand = data?.charts.topByDemand || [];
  const services = data?.services || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Link
            href="/clinic/reports"
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <FiArrowLeft size={24} className="text-slate-600" />
          </Link>
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Análisis de Servicios</h1>
            <p className="text-slate-600 mt-2">Demanda, rentabilidad y disponibilidad de servicios</p>
          </div>
        </div>

        {/* Period Filter */}
        <div className="mb-8">
          <PeriodFilter
            selectedPeriod={period}
            selectedStartDate={startDate}
            selectedEndDate={endDate}
            onPeriodChange={handlePeriodChange}
          />
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            Error al cargar datos: {error}
          </div>
        )}

        {loading && (
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700">
            Cargando datos...
          </div>
        )}

        {/* Filters */}
        <div className="mb-8">
          <LocationTypeFilter 
            selectedLocation={locationType} 
            onLocationChange={setLocationType} 
          />
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
          >
            <KPICard
              icon={FiAward}
              metric={kpis.activeServices.value}
              label={kpis.activeServices.label}
              trend={{
                value: 2,
                direction: 'up' as const,
                period: kpis.activeServices.trending || '',
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
              icon={FiTrendingUp}
              metric={kpis.mostProfitable.value}
              label={kpis.mostProfitable.label}
              trend={{
                value: 8,
                direction: 'up' as const,
                period: kpis.mostProfitable.trending || '',
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
              icon={FiStar}
              metric={kpis.mostDemanded.value}
              label={kpis.mostDemanded.label}
              trend={{
                value: 3,
                direction: 'up' as const,
                period: kpis.mostDemanded.trending || '',
              }}
              color="info"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24 }}
          >
            <KPICard
              icon={FiAward}
              metric={kpis.availabilityRate.value}
              label={kpis.availabilityRate.label}
              trend={{
                value: 1,
                direction: 'up' as const,
                period: kpis.availabilityRate.trending || '',
              }}
              color="warning"
            />
          </motion.div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Demand vs Revenue Scatter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32 }}
            className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm"
          >
            <h3 className="font-semibold text-slate-900 mb-6">Demanda vs Ingresos</h3>
            {scatterData && scatterData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="demandCount" name="Demanda (# citas)" stroke="#94A3B8" />
                  <YAxis dataKey="totalRevenue" name="Ingresos (MXN)" stroke="#94A3B8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1E293B',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#E2E8F0',
                    }}
                    cursor={{ strokeDasharray: '3 3' }}
                  />
                  <Scatter name="Servicios" data={scatterData} fill="#3B82F6" />
                </ScatterChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-300 flex items-center justify-center text-slate-500">No hay datos disponibles</div>
            )}
          </motion.div>

          {/* Top Services by Demand */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm"
          >
            <h3 className="font-semibold text-slate-900 mb-6">Servicios Más Demandados</h3>
            {topByDemand && topByDemand.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topByDemand}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="name" stroke="#94A3B8" />
                  <YAxis stroke="#94A3B8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1E293B',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#E2E8F0',
                    }}
                  />
                  <Bar dataKey="demandCount" fill="#10B981" name="# Citas" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-300 flex items-center justify-center text-slate-500">No hay datos disponibles</div>
            )}
          </motion.div>
        </div>

        {/* Services Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.48 }}
          className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-slate-900">Análisis Detallado de Servicios</h3>
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              <FiDownload size={16} />
              Descargar
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-900 text-sm">Servicio</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900 text-sm">Tipo</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-900 text-sm">Demanda (citas)</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-900 text-sm">Ingresos</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-900 text-sm">Precio Promedio</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-900 text-sm">Margen Estimado</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-900 text-sm">Estado</th>
                </tr>
              </thead>
              <tbody>
                {services && services.length > 0 ? (
                  services.map((service, index) => (
                    <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-4 px-4 text-sm text-slate-900 font-medium">{service.name}</td>
                      <td className="py-4 px-4 text-sm text-slate-700">{service.type}</td>
                      <td className="py-4 px-4 text-sm text-right text-slate-700">{service.demandCount}</td>
                      <td className="py-4 px-4 text-sm text-right text-slate-900 font-semibold">${service.totalRevenue.toLocaleString('es-MX')}</td>
                      <td className="py-4 px-4 text-sm text-right text-slate-700">${service.avgPrice.toFixed(2)} MXN</td>
                      <td className="py-4 px-4 text-sm text-right text-slate-700">{service.estimatedMargin}</td>
                      <td className="py-4 px-4 text-center text-sm">
                        <span className="text-green-600 font-semibold">{service.status}</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-4 px-4 text-center text-slate-500">
                      No hay servicios disponibles
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
