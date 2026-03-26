'use client';

import React from 'react';
import { FiDollarSign, FiCalendar, FiUsers, FiTrendingUp, FiCheckCircle, FiClock, FiAlertCircle } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { PermissionGateRoute } from '@/components/PermissionGateRoute';
import { PermissionGate } from '@/components/PermissionGate';
import { usePermissions } from '@/hooks/usePermissions';
import { KPICard } from '@/components/dashboard';
import { useOverviewReport } from '@/hooks/useReports';
import { useAppointmentKPIs } from '@/hooks/useAppointmentKPIs';
import { ReportsSection } from '@/components/reports/ReportsSection';

function ReportsPageContent() {
  const { has } = usePermissions();
  const { data: overviewData, loading, error } = useOverviewReport();
  const { data: kpiData, isLoading: kpiLoading } = useAppointmentKPIs({ period: 'month' });

  console.log('=== Reports Page ===');
  console.log('Loading:', loading);
  console.log('Error:', error);
  console.log('Overview Data:', overviewData);
  console.log('KPI Data:', kpiData);

  // Get KPI values from overview data or use defaults
  const revenue = overviewData?.healthMetrics?.revenueThisMonth?.value || '$0';
  const appointmentsValue = overviewData?.healthMetrics?.appointmentsThisWeek?.value || '0';
  const activeClientsValue = overviewData?.healthMetrics?.activeClients?.value || '0';
  const occupancyRate = overviewData?.healthMetrics?.occupancyRate?.value || '0';

  console.log('Extracted values:', { revenue, appointmentsValue, activeClientsValue, occupancyRate });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900">Reportes</h1>
          <p className="text-slate-600 mt-2 text-base">
            Panel de control con 6 reportes clave para gestionar tu negocio
          </p>
        </div>

        {/* Summary KPIs */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Indicadores Clave</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 }}
            >
              <KPICard
                icon={FiDollarSign}
                metric={String(revenue)}
                label="Ingresos Este Mes"
                trend={{
                  value: 15,
                  direction: 'up' as const,
                  period: 'vs mes anterior',
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
                icon={FiCalendar}
                metric={String(appointmentsValue)}
                label="Citas Completadas"
                trend={{
                  value: 8,
                  direction: 'up' as const,
                  period: 'vs mes anterior',
                }}
                color="primary"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16 }}
            >
              <KPICard
                icon={FiUsers}
                metric={String(activeClientsValue)}
                label="Clientes Activos"
                trend={{
                  value: 12,
                  direction: 'up' as const,
                  period: 'vs mes anterior',
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
                icon={FiTrendingUp}
                metric={String(occupancyRate)}
                label="Tasa de Ocupación"
                trend={{
                  value: 2,
                  direction: 'up' as const,
                  period: 'vs mes anterior',
                }}
                color="warning"
              />
            </motion.div>
          </div>
        </div>

        {/* Payment Status KPIs - Revenue and Appointments */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Estado de Pagos - Ingresos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Ingresos Este Mes */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.32 }}
            >
              <KPICard
                icon={FiDollarSign}
                metric={`$${(overviewData?.paymentMetrics?.totalRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                label="Ingresos Este Mes"
                trend={{
                  value: overviewData?.paymentMetrics?.totalAppointments || 0,
                  direction: 'up' as const,
                  period: `${overviewData?.paymentMetrics?.totalAppointments || 0} citas`,
                }}
                color="primary"
              />
            </motion.div>

            {/* Total Pagado */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.40 }}
            >
              <KPICard
                icon={FiCheckCircle}
                metric={`$${(overviewData?.paymentMetrics?.paidRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                label="Total Pagado"
                trend={{
                  value: overviewData?.paymentMetrics?.paidAppointments || 0,
                  direction: 'up' as const,
                  period: `${overviewData?.paymentMetrics?.paidAppointments || 0} citas pagadas`,
                }}
                color="success"
              />
            </motion.div>

            {/* Total por Pagar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.48 }}
            >
              <KPICard
                icon={FiClock}
                metric={`$${(overviewData?.paymentMetrics?.pendingRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                label="Total por Pagar"
                trend={{
                  value: overviewData?.paymentMetrics?.pendingAppointments || 0,
                  direction: 'up' as const,
                  period: `${overviewData?.paymentMetrics?.pendingAppointments || 0} citas pendientes`,
                }}
                color="warning"
              />
            </motion.div>

            {/* Total Cancelado */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.56 }}
            >
              <KPICard
                icon={FiAlertCircle}
                metric={`$${(overviewData?.paymentMetrics?.cancelledRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                label="Total Cancelado"
                trend={{
                  value: overviewData?.paymentMetrics?.cancelledAppointments || 0,
                  direction: 'down' as const,
                  period: `${overviewData?.paymentMetrics?.cancelledAppointments || 0} citas`,
                }}
                color="critical"
              />
            </motion.div>
          </div>
        </div>

        {/* Payment Status KPIs - Appointments Count */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Estado de Pagos - Citas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Citas */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.64 }}
            >
              <KPICard
                icon={FiCalendar}
                metric={`${overviewData?.paymentMetrics?.totalAppointments || 0}`}
                label="Total de Citas"
                trend={{
                  value: 100,
                  direction: 'up' as const,
                  period: 'citas del mes',
                }}
                color="info"
              />
            </motion.div>

            {/* Citas Pagadas */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.72 }}
            >
              <KPICard
                icon={FiCheckCircle}
                metric={`${overviewData?.paymentMetrics?.paidAppointments || 0}`}
                label="Citas Pagadas"
                trend={{
                  value: overviewData?.paymentMetrics?.totalAppointments ? Math.round((overviewData.paymentMetrics.paidAppointments / overviewData.paymentMetrics.totalAppointments) * 100) : 0,
                  direction: 'up' as const,
                  period: `% del total`,
                }}
                color="success"
              />
            </motion.div>

            {/* Citas por Pagar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.80 }}
            >
              <KPICard
                icon={FiClock}
                metric={`${overviewData?.paymentMetrics?.pendingAppointments || 0}`}
                label="Citas por Pagar"
                trend={{
                  value: overviewData?.paymentMetrics?.totalAppointments ? Math.round((overviewData.paymentMetrics.pendingAppointments / overviewData.paymentMetrics.totalAppointments) * 100) : 0,
                  direction: 'up' as const,
                  period: `% del total`,
                }}
                color="warning"
              />
            </motion.div>

            {/* Citas Canceladas */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.88 }}
            >
              <KPICard
                icon={FiAlertCircle}
                metric={`${overviewData?.paymentMetrics?.cancelledAppointments || 0}`}
                label="Citas Canceladas"
                trend={{
                  value: overviewData?.paymentMetrics?.totalAppointments ? Math.round((overviewData.paymentMetrics.cancelledAppointments / overviewData.paymentMetrics.totalAppointments) * 100) : 0,
                  direction: 'down' as const,
                  period: `% del total`,
                }}
                color="critical"
              />
            </motion.div>
          </div>
        </div>
        <ReportsSection />
      </div>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <PermissionGateRoute permissions={['reports:view']}>
      <ReportsPageContent />
    </PermissionGateRoute>
  );
}
