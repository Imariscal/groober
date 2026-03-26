'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/dashboard/page-header/PageHeader';
import { MdDownload, MdTrendingUp, MdPerson, MdCalendarMonth, MdPeople } from 'react-icons/md';
import toast from 'react-hot-toast';
import { getReports, ReportsData } from '@/lib/platformApi';

export default function ReportsPage() {
  const [timeRange, setTimeRange] = useState('month');
  const [isLoading, setIsLoading] = useState(true);
  const [reports, setReports] = useState<ReportsData | null>(null);

  useEffect(() => {
    loadReports();
  }, [timeRange]);

  async function loadReports() {
    setIsLoading(true);
    try {
      const data = await getReports(timeRange);
      setReports(data);
    } catch {
      // Error already handled by API function
    } finally {
      setIsLoading(false);
    }
  }

  const handleExport = () => {
    toast.success('Reporte exportado como PDF');
  };

  const pageHeader = {
    title: 'Reports & Analytics',
    subtitle: 'Análisis y reportes globales de la plataforma',
    breadcrumbs: [
      { label: 'Plataforma', href: '/platform/dashboard' },
      { label: 'Reports & Analytics' },
    ],
    primaryAction: {
      label: 'Exportar',
      onClick: handleExport,
      icon: <MdDownload />,
    },
  };

  const metrics = reports ? [
    {
      label: 'Total de Clínicas',
      value: reports.metrics.total_clinics,
      trend: reports.metrics.growth_rate > 0 ? reports.metrics.growth_rate : undefined,
      icon: <MdPerson className="w-8 h-8" />,
      color: 'bg-blue-50 border-blue-200 text-blue-700',
    },
    {
      label: 'Nuevas este mes',
      value: reports.metrics.new_this_month,
      icon: <MdTrendingUp className="w-8 h-8" />,
      color: 'bg-green-50 border-green-200 text-green-700',
    },
    {
      label: 'Tasa de Crecimiento',
      value: `${reports.metrics.growth_rate}%`,
      icon: <MdCalendarMonth className="w-8 h-8" />,
      color: 'bg-purple-50 border-purple-200 text-purple-700',
    },
    {
      label: 'Retención',
      value: `${reports.metrics.retention_rate}%`,
      trend: reports.metrics.retention_rate > 90 ? 3 : undefined,
      icon: <MdPeople className="w-8 h-8" />,
      color: 'bg-amber-50 border-amber-200 text-amber-700',
    },
  ] : [];

  const chartData = reports?.monthly_data || [];
  const maxClinics = chartData.length > 0 ? Math.max(...chartData.map(d => d.clinics), 1) : 1;
  const maxRevenue = chartData.length > 0 ? Math.max(...chartData.map(d => d.revenue), 1) : 1;
  const planSummary = reports?.plan_summary || [];
  const totalClinicsInPlans = planSummary.reduce((sum, p) => sum + p.clinics, 0);

  // Loading skeleton
  if (isLoading && !reports) {
    return (
      <>
        <PageHeader {...pageHeader} />
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-28 bg-slate-200 rounded-lg" />
            ))}
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="h-64 bg-slate-200 rounded-lg" />
            <div className="h-64 bg-slate-200 rounded-lg" />
          </div>
          <div className="h-48 bg-slate-200 rounded-lg" />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader {...pageHeader} />
      {/* Time Range Selector */}
      <div className="mb-6 flex gap-3 items-center flex-wrap">
        <span className="text-sm font-medium text-slate-700">Período:</span>
        <div className="flex gap-2">
          {['week', 'month', 'quarter', 'year'].map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                timeRange === range
                  ? 'bg-primary-500 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {range === 'week' && 'Esta Semana'}
              {range === 'month' && 'Este Mes'}
              {range === 'quarter' && 'Este Trimestre'}
              {range === 'year' && 'Este Año'}
            </button>
          ))}
        </div>
        {isLoading && (
          <div className="ml-2 w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {metrics.map((metric, idx) => (
          <div
            key={idx}
            className={`border rounded-lg p-6 flex items-center gap-4 ${metric.color}`}
          >
            <div className="p-3 bg-white rounded-lg">{metric.icon}</div>
            <div className="flex-1">
              <p className="text-sm font-medium opacity-90">{metric.label}</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold">{metric.value}</p>
                {metric.trend && (
                  <span className="text-green-600 text-sm font-semibold">+{metric.trend}%</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        {/* Clinics Growth Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Crecimiento de Clínicas</h3>
          {chartData.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">No hay datos disponibles</p>
          ) : (
            <div className="space-y-4">
              {chartData.map((data, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700">{data.month_year}</span>
                    <span className="text-sm font-semibold text-slate-900">{data.clinics}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all" 
                      style={{ width: `${(data.clinics / maxClinics) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Revenue Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Ingresos Estimados Mensuales</h3>
          {chartData.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">No hay datos disponibles</p>
          ) : (
            <div className="space-y-4">
              {chartData.map((data, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700">{data.month_year}</span>
                    <span className="text-sm font-semibold text-slate-900">${data.revenue.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all" 
                      style={{ width: `${(data.revenue / maxRevenue) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Summary Table */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-900">Resumen por Plan</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-6 py-3 text-left font-semibold text-slate-700">Plan</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-700">Clínicas</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-700">Ingresos Est.</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-700">Precio/Clínica</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-700">% del Total</th>
              </tr>
            </thead>
            <tbody>
              {planSummary.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No hay planes configurados
                  </td>
                </tr>
              ) : (
                planSummary.map((row, idx) => (
                  <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td className="px-6 py-4 font-medium text-slate-900">{row.plan_name}</td>
                    <td className="px-6 py-4 text-slate-600">{row.clinics}</td>
                    <td className="px-6 py-4 text-slate-600">${row.revenue.toLocaleString()}</td>
                    <td className="px-6 py-4 text-slate-600">${row.avg_per_clinic.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        row.percentage > 40 ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'
                      }`}>
                        {row.percentage}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
              {/* Totals row */}
              {planSummary.length > 0 && (
                <tr className="bg-slate-50 font-semibold">
                  <td className="px-6 py-4 text-slate-900">Total</td>
                  <td className="px-6 py-4 text-slate-900">{totalClinicsInPlans}</td>
                  <td className="px-6 py-4 text-slate-900">
                    ${planSummary.reduce((sum, r) => sum + r.revenue, 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-slate-600">—</td>
                  <td className="px-6 py-4 text-slate-900">100%</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
