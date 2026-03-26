'use client';

import React, { useState, useMemo } from 'react';
import { FiArrowLeft, FiFilter, FiDownload, FiCalendar, FiDollarSign, FiShoppingCart } from 'react-icons/fi';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { PermissionGateRoute } from '@/components/PermissionGateRoute';
import { KPICard } from '@/components/dashboard';
import { useSalesQuery } from '@/hooks/usePosMutations';
import { formatCurrency } from '@/lib/currency';
import toast from 'react-hot-toast';

function ProductProfitReportContent() {
  // ==================== STATE ====================
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'year'>('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // ==================== QUERIES ====================
  const { data: salesData, isLoading } = useSalesQuery({
    status: 'COMPLETED', // Only completed sales have profit
  });

  // ==================== COMPUTED METRICS ====================
  const metrics = useMemo(() => {
    if (!salesData?.data) {
      return {
        totalProducts: 0,
        totalRevenue: 0,
        averageMargin: 0,
        topProfitProducts: [],
      };
    }

    const sales = salesData.data;
    const productMap = new Map<string, { 
      name: string; 
      quantity: number; 
      revenue: number;
      costPrice: number;
      profit: number;
      margin: number;
    }>();

    sales.forEach((sale: any) => {
      if (sale.items && Array.isArray(sale.items)) {
        sale.items.forEach((item: any) => {
          const productName = item.productName || item.name || 'Producto sin nombre';
          const quantity = item.quantity || 0;
          const unitPrice = item.unitPrice || item.price || 0;
          const costPrice = item.costPrice || (unitPrice * 0.6); // Default 40% margin if no cost
          const itemRevenue = quantity * unitPrice;
          const itemProfit = quantity * (unitPrice - costPrice);

          let current = productMap.get(productName);
          if (!current) {
            current = {
              name: productName,
              quantity: 0,
              revenue: 0,
              costPrice: costPrice,
              profit: 0,
              margin: 0,
            };
          }

          current.quantity += quantity;
          current.revenue += itemRevenue;
          current.profit = current.profit + itemProfit;
          current.margin = current.revenue > 0 ? (current.profit / current.revenue) * 100 : 0;
          current.costPrice = costPrice;

          productMap.set(productName, current);
        });
      }
    });

    const products = Array.from(productMap.values()).sort((a, b) => (b.profit || 0) - (a.profit || 0));
    const totalRevenue = products.reduce((sum, p) => sum + p.revenue, 0);
    const totalProfit = products.reduce((sum, p) => sum + (p.profit || 0), 0);
    const averageMargin = products.length > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return {
      totalProducts: products.length,
      totalRevenue,
      totalProfit,
      averageMargin,
      topProfitProducts: products,
    };
  }, [salesData?.data]);

  const handleExportCSV = () => {
    try {
      let csvContent = 'data:text/csv;charset=utf-8,';
      csvContent += 'Producto,Cantidad,Ingresos,Ganancia,Margen (%)\n';

      metrics.topProfitProducts.forEach((product: any) => {
        const revenue = product.revenue;
        const profit = product.profit || 0;
        const margin = product.margin || 0;
        csvContent += `${product.name},${product.quantity},${revenue.toFixed(2)},${profit.toFixed(2)},${margin.toFixed(2)}\n`;
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `profit-report-${new Date().toISOString().split('T')[0]}.csv`);
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
        <div className="mb-8 flex items-center gap-4">
          <Link href="/clinic/sales-reports" className="inline-flex items-center justify-center w-10 h-10 rounded-lg hover:bg-slate-200 transition">
            <FiArrowLeft className="w-6 h-6 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Ganancias por Producto</h1>
            <p className="text-slate-600 mt-2 text-base">
              Analiza las ganancias y márgenes de rentabilidad por producto
            </p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Indicadores Clave</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
              <KPICard
                icon={FiShoppingCart}
                metric={String(metrics.totalProducts)}
                label="Total de Productos"
                color="primary"
              />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
              <KPICard
                icon={FiDollarSign}
                metric={formatCurrency(metrics.totalRevenue)}
                label="Ingresos Totales"
                color="success"
              />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
              <KPICard
                icon={FiDollarSign}
                metric={formatCurrency(metrics.totalProfit || 0)}
                label="Ganancia Total"
                color="info"
              />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}>
              <KPICard
                icon={FiDollarSign}
                metric={`${metrics.averageMargin.toFixed(1)}%`}
                label="Margen Promedio"
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

                {/* Custom Date Range */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FiCalendar className="text-slate-500" />
                    <span className="text-sm font-medium text-slate-700">Rango Personalizado</span>
                  </div>
                  <div className="space-y-2">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Fecha inicio"
                    />
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Fecha fin"
                    />
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
            {/* Products Profit Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900">Productos Ordenados por Ganancia</h3>
              </div>
              <div className="overflow-x-auto overflow-y-auto max-h-96">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold text-slate-900">Producto</th>
                      <th className="px-6 py-3 text-center font-semibold text-slate-900">Cantidad</th>
                      <th className="px-6 py-3 text-right font-semibold text-slate-900">Ingresos</th>
                      <th className="px-6 py-3 text-right font-semibold text-slate-900">Ganancia</th>
                      <th className="px-6 py-3 text-right font-semibold text-slate-900">Margen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                          Cargando...
                        </td>
                      </tr>
                    ) : metrics.topProfitProducts.length > 0 ? (
                      metrics.topProfitProducts.map((product: any, idx: number) => (
                        <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition">
                          <td className="px-6 py-3 text-slate-900 font-medium">{product.name}</td>
                          <td className="px-6 py-3 text-center text-slate-900">{product.quantity}</td>
                          <td className="px-6 py-3 text-right text-slate-900">{formatCurrency(product.revenue)}</td>
                          <td className="px-6 py-3 text-right font-semibold text-green-600">
                            {formatCurrency(product.profit || 0)}
                          </td>
                          <td className="px-6 py-3 text-right">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              (product.margin || 0) >= 40
                                ? 'bg-green-100 text-green-800'
                                : (product.margin || 0) >= 20
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {(product.margin || 0).toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                          No hay datos disponibles
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductProfitReportPage() {
  return (
    <PermissionGateRoute permissions={['pos:sales:read']}>
      <ProductProfitReportContent />
    </PermissionGateRoute>
  );
}
