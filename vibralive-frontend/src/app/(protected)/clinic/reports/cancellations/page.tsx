'use client';

import React, { useState } from 'react';
import {
  FiArrowLeft,
  FiAlertCircle,
  FiCalendar,
  FiUser,
  FiDollarSign,
} from 'react-icons/fi';
import { MdPets } from 'react-icons/md';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useCancelledAppointments } from '@/hooks/useAppointmentKPIs';
import { PeriodFilter, PeriodType } from '@/components/reports/PeriodFilter';
import { LocationTypeFilter, LocationType } from '@/components/reports/LocationTypeFilter';

interface CancelledAppointment {
  id: string;
  date: string;
  clientName: string;
  petName: string;
  serviceName: string;
  cancellationReason?: string;
  amount: number;
}

export default function CancellationsReport() {
  const [period, setPeriod] = useState<PeriodType>('month');
  const [startDate, setStartDate] = useState<string>();
  const [endDate, setEndDate] = useState<string>();
  const [locationType, setLocationType] = useState<LocationType>('all');

  const { data: cancelledAppointments, isLoading } = useCancelledAppointments({
    startDate,
    endDate,
    locationType: locationType === 'all' ? undefined : locationType,
  });

  const handlePeriodChange = (newPeriod: PeriodType, newStartDate?: string, newEndDate?: string) => {
    setPeriod(newPeriod);
    setStartDate(newStartDate);
    setEndDate(newEndDate);
  };

  // Calcular estadísticas
  const totalCancelled = cancelledAppointments?.length || 0;
  const totalCancelledAmount = (cancelledAppointments || []).reduce((sum, apt) => sum + (apt.amount || 0), 0);
  const avgCancelledAmount = totalCancelled > 0 ? totalCancelledAmount / totalCancelled : 0;

  // Agrupar por motivo de cancelación
  const reasonCounts = (cancelledAppointments || []).reduce((acc: Record<string, number>, apt) => {
    const reason = apt.cancellationReason || 'Sin especificar';
    acc[reason] = (acc[reason] || 0) + 1;
    return acc;
  }, {});

  const topReasons = Object.entries(reasonCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

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
            <h1 className="text-4xl font-bold text-slate-900">Reporte de Cancelaciones</h1>
            <p className="text-slate-600 mt-2">Análisis de citas canceladas, razones y pérdida de ingresos</p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-col gap-4">
          <PeriodFilter
            selectedPeriod={period}
            selectedStartDate={startDate}
            selectedEndDate={endDate}
            onPeriodChange={handlePeriodChange}
          />
          <LocationTypeFilter
            selectedLocation={locationType}
            onLocationChange={setLocationType}
          />
        </div>

        {/* KPIs */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Resumen de Cancelaciones</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Total Citas */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 }}
              className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">Citas Canceladas</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">{totalCancelled}</p>
                </div>
                <div className="bg-red-100 p-4 rounded-full">
                  <FiAlertCircle size={24} className="text-red-600" />
                </div>
              </div>
            </motion.div>

            {/* Total Pérdida */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">Pérdida Total</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">
                    ${totalCancelledAmount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="bg-orange-100 p-4 rounded-full">
                  <FiDollarSign size={24} className="text-orange-600" />
                </div>
              </div>
            </motion.div>

            {/* Promedio */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16 }}
              className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">Monto Promedio</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">
                    ${avgCancelledAmount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="bg-yellow-100 p-4 rounded-full">
                  <FiCalendar size={24} className="text-yellow-600" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Top Cancellation Reasons */}
        {topReasons.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Principales Motivos de Cancelación</h2>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <div className="space-y-3">
                  {topReasons.map(([reason, count], idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-slate-700 font-medium">{reason}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-48 bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-red-500 h-full"
                            style={{
                              width: `${(count / totalCancelled) * 100}%`,
                            }}
                          />
                        </div>
                        <p className="text-slate-700 font-semibold min-w-12 text-right">{count}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cancelled Appointments Table */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Detalle de Cancelaciones</h2>
          {isLoading ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center text-slate-600">
              Cargando citas canceladas...
            </div>
          ) : cancelledAppointments && cancelledAppointments.length > 0 ? (
            <div className="bg-white rounded-lg shadow-md overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold text-slate-700">Fecha</th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-700">Cliente</th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-700">Mascota</th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-700">Servicio</th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-700">Motivo</th>
                    <th className="px-6 py-4 text-right font-semibold text-slate-700">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {cancelledAppointments.map((apt: any, idx: number) => (
                    <motion.tr
                      key={apt.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-slate-700">
                        <div className="flex items-center gap-2">
                          <FiCalendar size={16} className="text-slate-400" />
                          {new Date(apt.date).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        <div className="flex items-center gap-2">
                          <FiUser size={16} className="text-slate-400" />
                          {apt.clientName}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        <div className="flex items-center gap-2">
                          <MdPets size={16} className="text-slate-400" />
                          {apt.petName}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-700">{apt.serviceName}</td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                          {apt.cancellationReason || 'Sin especificar'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-slate-900">
                        ${(apt.amount || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-8 text-center text-slate-600">
              No hay citas canceladas en este período
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
