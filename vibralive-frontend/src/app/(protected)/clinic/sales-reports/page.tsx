'use client';

import React, { useState, useMemo } from 'react';
import { FiDollarSign, FiShoppingCart, FiTrendingUp, FiFilter, FiDownload, FiArrowRight, FiBox } from 'react-icons/fi';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { PermissionGateRoute } from '@/components/PermissionGateRoute';
import { KPICard } from '@/components/dashboard';
import { useSalesQuery } from '@/hooks/usePosMutations';
import { formatCurrency } from '@/lib/currency';
import toast from 'react-hot-toast';

function SalesReportsPageContent() {
  // ==================== STATE ====================
  const [filterStatus, setFilterStatus] = useState('all');
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'year'>('month');

  // ==================== QUERIES ====================
  const { data: salesData, isLoading } = useSalesQuery({
    status: filterStatus !== 'all' ? filterStatus : undefined,
  });

  // ==================== COMPUTED METRICS ====================
  const metrics = useMemo(() => {
    if (!salesData?.data) {
      return {
        totalSales: 0,
        totalRevenue: 0,
        completedSales: 0,
        refundedSales: 0,
        draftSales: 0,
        averageOrderValue: 0,
        topProducts: [],
      };
    }

    const sales = salesData.data;
    const completedSales = sales.filter((s: any) => s.status === 'COMPLETED').length;
    const refundedSales = sales.filter((s: any) => s.status === 'REFUNDED').length;
    const draftSales = sales.filter((s: any) => s.status === 'DRAFT').length;
    const totalRevenue = sales
      .filter((s: any) => s.status === 'COMPLETED')
      .reduce((sum: number, s: any) => sum + Number(s.totalAmount || 0), 0);

    // Calculate top products
    const productMap = new Map<string, { name: string; quantity: number; revenue: number }>();
    sales.forEach((sale: any) => {
      if (sale.items && Array.isArray(sale.items)) {
        sale.items.forEach((item: any) => {
          const productName = item.productName || item.name || 'Producto sin nombre';
          const current = productMap.get(productName) || { name: productName, quantity: 0, revenue: 0 };
          current.quantity += item.quantity || 0;
          current.revenue += (item.quantity || 0) * (item.unitPrice || item.price || 0);
          productMap.set(productName, current);
        });
      }
    });

    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      totalSales: sales.length,
      totalRevenue,
      completedSales,
      refundedSales,
      draftSales,
      averageOrderValue: sales.length > 0 ? totalRevenue / completedSales : 0,
      topProducts,
    };
  }, [salesData?.data]);

  const handleExportCSV = () => {
    try {
      let csvContent = 'data:text/csv;charset=utf-8,';
      csvContent += 'Fecha,Estado,Total,Items\n';

      salesData?.data.forEach((sale: any) => {
        const date = sale.createdAt ? new Date(sale.createdAt).toISOString().split('T')[0] : 'N/A';
        const status = sale.status || 'UNKNOWN';
        const total = sale.totalAmount || 0;
        const items = sale.items?.length || 0;
        csvContent += `${date},${status},${total},${items}\n`;
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `sales-report-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Reporte descargado exitosamente');
    } catch (error) {
      toast.error('Error al descargar reporte');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900">Reportes de Ventas POS</h1>
          <p className="text-slate-600 mt-2 text-base">
            Análisis completo de ventas, productos y tendencias
          </p>
        </div>

        {/* KPI Cards */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Indicadores Clave</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
              <KPICard
                icon={FiShoppingCart}
                metric={String(metrics.totalSales)}
                label="Total de Ventas"
                color="primary"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
            >
              <KPICard
                icon={FiDollarSign}
                metric={formatCurrency(metrics.totalRevenue)}
                label="Ingresos Totales"
                color="success"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16 }}
            >
              <KPICard
                icon={FiTrendingUp}
                metric={String(metrics.completedSales)}
                label="Ventas Completadas"
                color="info"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24 }}
            >
              <KPICard
                icon={FiDollarSign}
                metric={formatCurrency(metrics.averageOrderValue)}
                label="Ticket Promedio"
                color="warning"
              />
            </motion.div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Filters */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sticky top-6">
              <div className="space-y-6">
                {/* State Filter */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FiFilter className="text-slate-500" />
                    <span className="text-sm font-medium text-slate-700">Estado</span>
                  </div>
                  <div className="space-y-2">
                    {['all', 'COMPLETED', 'DRAFT', 'REFUNDED'].map((status) => (
                      <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${
                          filterStatus === status
                            ? 'bg-primary-100 text-primary-700'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {status === 'all'
                          ? 'Todas'
                          : status === 'COMPLETED'
                          ? 'Completadas'
                          : status === 'REFUNDED'
                          ? 'Reembolsadas'
                          : 'Borradores'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date Range Filter */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FiFilter className="text-slate-500" />
                    <span className="text-sm font-medium text-slate-700">Período</span>
                  </div>
                  <div className="space-y-2">
                    {(['week', 'month', 'year'] as const).map((range) => (
                      <button
                        key={range}
                        onClick={() => setDateRange(range)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${
                          dateRange === range
                            ? 'bg-primary-100 text-primary-700'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {range === 'week' ? 'Esta Semana' : range === 'month' ? 'Este Mes' : 'Este Año'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Export Button */}
                <button
                  onClick={handleExportCSV}
                  className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white py-2 px-3 rounded-lg font-medium transition"
                >
                  <FiDownload className="w-4 h-4" />
                  Descargar CSV
                </button>
              </div>
            </div>
          </div>

          {/* Main Reports */}
          <div className="lg:col-span-3 space-y-6">
            {/* Status Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Resumen de Estados</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-700">{metrics.completedSales}</div>
                  <div className="text-sm text-blue-600 mt-1">Completadas</div>
                </div>
                <div className="bg-amber-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-amber-700">{metrics.draftSales}</div>
                  <div className="text-sm text-amber-600 mt-1">Borradores</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-700">{metrics.refundedSales}</div>
                  <div className="text-sm text-green-600 mt-1">Reembolsos</div>
                </div>
              </div>
            </div>

            {/* Top Products */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Top 5 Productos</h3>
              {metrics.topProducts.length > 0 ? (
                <div className="space-y-3">
                  {metrics.topProducts.map((product, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-slate-900">{product.name}</div>
                        <div className="text-xs text-slate-600">Cantidad: {product.quantity}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-slate-900">{formatCurrency(product.revenue)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">No hay datos disponibles</div>
              )}
            </div>

            {/* Sales List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900">Últimas Ventas</h3>
              </div>
              <div className="overflow-x-auto overflow-y-auto max-h-96">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold text-slate-900">Fecha</th>
                      <th className="px-6 py-3 text-left font-semibold text-slate-900">Estado</th>
                      <th className="px-6 py-3 text-center font-semibold text-slate-900">Items</th>
                      <th className="px-6 py-3 text-right font-semibold text-slate-900">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                          Cargando...
                        </td>
                      </tr>
                    ) : salesData?.data && salesData.data.length > 0 ? (
                      salesData.data.map((sale: any) => (
                        <tr key={sale.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                          <td className="px-6 py-3 text-slate-900">
                            {sale.createdAt ? new Date(sale.createdAt).toISOString().split('T')[0] : 'N/A'}
                          </td>
                          <td className="px-6 py-3">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                sale.status === 'COMPLETED'
                                  ? 'bg-green-100 text-green-800'
                                  : sale.status === 'REFUNDED'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {sale.status === 'COMPLETED'
                                ? 'Completada'
                                : sale.status === 'REFUNDED'
                                ? 'Reembolso'
                                : 'Borrador'}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-center text-slate-900">{sale.items?.length || 0}</td>
                          <td className="px-6 py-3 text-right font-semibold text-slate-900">
                            {formatCurrency(Number(sale.totalAmount || 0))}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                          No hay ventas registradas
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Report Navigation Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/clinic/sales-reports/products-profit">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6 cursor-pointer shadow-sm hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-purple-900 mb-2">Ganancias por Producto</h3>
                      <p className="text-sm text-purple-700">Analiza las ganancias y márgenes por producto</p>
                    </div>
                    <FiTrendingUp className="w-8 h-8 text-purple-600" />
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-purple-700 font-medium text-sm">
                    Ver reporte <FiArrowRight className="w-4 h-4" />
                  </div>
                </motion.div>
              </Link>

              <Link href="/clinic/sales-reports/inventory">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-6 cursor-pointer shadow-sm hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-orange-900 mb-2">Reporte de Inventario</h3>
                      <p className="text-sm text-orange-700">Monitorea el estado del inventario</p>
                    </div>
                    <FiBox className="w-8 h-8 text-orange-600" />
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-orange-700 font-medium text-sm">
                    Ver reporte <FiArrowRight className="w-4 h-4" />
                  </div>
                </motion.div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SalesReportsPage() {
  return (
    <PermissionGateRoute permissions={['pos:sales:read']}>
      <SalesReportsPageContent />
    </PermissionGateRoute>
  );
}
