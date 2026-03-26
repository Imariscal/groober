'use client';

import React, { useState } from 'react';
import {
  FiCalendar,
  FiCheckCircle,
  FiX,
  FiClock,
  FiDownload,
  FiArrowLeft,
} from 'react-icons/fi';
import { motion } from 'framer-motion';
import { KPICard } from '@/components/dashboard';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useAppointmentsReport } from '@/hooks/useAppointmentsReport';
import { PeriodFilter, PeriodType } from '@/components/reports/PeriodFilter';
import { LocationTypeFilter, LocationType } from '@/components/reports/LocationTypeFilter';
import { StatusFilter, AppointmentStatus } from '@/components/reports/StatusFilter';

export default function AppointmentsReport() {
  const [period, setPeriod] = useState<PeriodType>('week');
  const [startDate, setStartDate] = useState<string>();
  const [endDate, setEndDate] = useState<string>();
  const [locationType, setLocationType] = useState<LocationType>('all');
  const [selectedStatuses, setSelectedStatuses] = useState<AppointmentStatus[]>([
    'SCHEDULED',
    'CONFIRMED',
    'CANCELLED',
    'IN_PROGRESS',
    'COMPLETED',
  ]);

  const { data, loading, error } = useAppointmentsReport({
    period,
    startDate,
    endDate,
    locationType: locationType === 'all' ? undefined : locationType,
    statuses: selectedStatuses,
  });

  const handlePeriodChange = (newPeriod: PeriodType, newStartDate?: string, newEndDate?: string) => {
    setPeriod(newPeriod);
    setStartDate(newStartDate);
    setEndDate(newEndDate);
  };

  const kpis = data?.kpis || {
    confirmedThisWeek: { label: 'Citas Confirmadas', value: '0 citas', trending: '' },
    confirmationRate: { label: 'Tasa de Confirmación', value: '0%', trending: '' },
    cancelledThisMonth: { label: 'Canceladas', value: '0 citas', trending: '' },
    mostActiveClient: { label: 'Cliente más activo', value: 'N/A', trending: '' },
  };

  const byDay = data?.charts.byDay || [];
  const byStylist = data?.charts.byStylist || [];
  const appointments = data?.appointments || [];

  // Log de datos para debugging
  console.log('=== AppointmentsReport Data ===');
  console.log('Current period:', period, { startDate, endDate });
  console.log('Appointments data:', appointments);

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
            <h1 className="text-4xl font-bold text-slate-900">Análisis de Citas</h1>
            <p className="text-slate-600 mt-2">Estadísticas completas de citas programadas, completadas y canceladas</p>
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
          <LocationTypeFilter 
            selectedLocation={locationType} 
            onLocationChange={setLocationType} 
          />
          <div className="lg:col-span-3">
            <StatusFilter 
              selectedStatuses={selectedStatuses} 
              onStatusChange={setSelectedStatuses} 
            />
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
          >
            <KPICard
              icon={FiCalendar}
              metric={kpis.confirmedThisWeek.value}
              label={kpis.confirmedThisWeek.label}
              trend={{
                value: 18,
                direction: 'up' as const,
                period: kpis.confirmedThisWeek.trending || '',
              }}
              color="success"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
          >
            <KPICard
              icon={FiX}
              metric={kpis.cancelledThisMonth.value}
              label={kpis.cancelledThisMonth.label}
              trend={{
                value: 8,
                direction: 'down' as const,
                period: kpis.cancelledThisMonth.trending || '',
              }}
              color="warning"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
          >
            <KPICard
              icon={FiCheckCircle}
              metric={kpis.confirmationRate.value}
              label={kpis.confirmationRate.label}
              trend={{
                value: 3,
                direction: 'up' as const,
                period: kpis.confirmationRate.trending || '',
              }}
              color="primary"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24 }}
          >
            <KPICard
              icon={FiClock}
              metric={kpis.mostActiveClient.value}
              label={kpis.mostActiveClient.label}
              trend={{
                value: 2,
                direction: 'up' as const,
                period: kpis.mostActiveClient.trending || '',
              }}
              color="info"
            />
          </motion.div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* By Day Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32 }}
            className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm"
          >
            <h3 className="font-semibold text-slate-900 mb-6">Citas por Día</h3>
            {byDay && byDay.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={byDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="date" stroke="#94A3B8" />
                  <YAxis stroke="#94A3B8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1E293B',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#E2E8F0',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="scheduled" fill="#94A3B8" name="Programadas" />
                  <Bar dataKey="confirmed" fill="#10B981" name="Confirmadas" />
                  <Bar dataKey="cancelled" fill="#EF4444" name="Canceladas" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-300 flex items-center justify-center text-slate-500">No hay datos disponibles</div>
            )}
          </motion.div>

          {/* By Stylist Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm"
          >
            <h3 className="font-semibold text-slate-900 mb-6">Citas por Personal</h3>

            {byStylist && byStylist.length > 0 ? (
              <div className="space-y-4">
                {byStylist.map((stylist, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-slate-900">{stylist.name}</span>
                        <span className="text-sm text-slate-600">{stylist.appointmentCount}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-600">
                        <span>Confirmadas: {stylist.confirmedCount}</span>
                        <span>Canceladas: {stylist.cancelledCount}</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(stylist.appointmentCount / Math.max(...byStylist.map(s => s.appointmentCount), 1)) * 100}%` }}
                          transition={{ duration: 0.8, delay: index * 0.1 }}
                          className="bg-indigo-600 rounded-full h-2"
                        ></motion.div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-300 flex items-center justify-center text-slate-500">No hay datos disponibles</div>
            )}
          </motion.div>
        </div>

        {/* Today's Appointments Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.48 }}
          className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-slate-900">Citas de Hoy</h3>
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              <FiDownload size={16} />
              Descargar
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-900 text-sm">Hora</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900 text-sm">Cliente</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900 text-sm">Mascota</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900 text-sm">Servicio</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900 text-sm">Personal</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900 text-sm">Estado</th>
                </tr>
              </thead>
              <tbody>
                {appointments && appointments.length > 0 ? (
                  appointments.map((apt, index) => (
                    <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-4 px-4 text-sm text-slate-900 font-medium">{apt.time}</td>
                      <td className="py-4 px-4 text-sm text-slate-700">{apt.clientName}</td>
                      <td className="py-4 px-4 text-sm text-slate-700">{apt.petName}</td>
                      <td className="py-4 px-4 text-sm text-slate-700">{apt.service}</td>
                      <td className="py-4 px-4 text-sm">
                        <span className={apt.stylistName ? 'text-slate-700' : 'text-slate-400 italic'}>
                          {apt.stylistName || 'Sin asignar'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            apt.status === 'CONFIRMED'
                              ? 'bg-green-100 text-green-800'
                              : apt.status === 'CANCELLED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {apt.status === 'CONFIRMED'
                            ? 'Confirmada'
                            : apt.status === 'CANCELLED'
                            ? 'Cancelada'
                            : 'Programada'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-4 px-4 text-center text-slate-500">
                      No hay citas para hoy
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
