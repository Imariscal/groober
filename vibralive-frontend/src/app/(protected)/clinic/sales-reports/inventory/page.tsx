'use client';

import React, { useState, useMemo } from 'react';
import { FiArrowLeft, FiFilter, FiDownload, FiAlertCircle, FiBox, FiX, FiArrowDown, FiArrowUp } from 'react-icons/fi';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { PermissionGateRoute } from '@/components/PermissionGateRoute';
import { KPICard } from '@/components/dashboard';
import { useSalesQuery } from '@/hooks/usePosMutations';
import { formatCurrency } from '@/lib/currency';
import toast from 'react-hot-toast';

function InventoryReportContent() {
  // ==================== STATE ====================
  const [sortBy, setSortBy] = useState<'name' | 'quantity' | 'value'>('quantity');
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

  // ==================== QUERIES ====================
  const { data: salesData, isLoading } = useSalesQuery({});

  // ==================== COMPUTED METRICS ====================
  const metrics = useMemo(() => {
    if (!salesData?.data) {
      return {
        totalProducts: 0,
        totalQuantitySold: 0,
        averagePerProduct: 0,
        lowStockProducts: [],
        allProducts: [],
      };
    }

    const sales = salesData.data;
    const productMap = new Map<string, { 
      name: string; 
      totalSold: number;
      lastSale?: string;
      avgPerTransaction: number;
      status: 'normal' | 'low' | 'critical';
    }>();

    sales.forEach((sale: any) => {
      if (sale.items && Array.isArray(sale.items)) {
        sale.items.forEach((item: any) => {
          const productName = item.productName || item.name || 'Producto sin nombre';
          const quantity = item.quantity || 0;

          const current = productMap.get(productName) || {
            name: productName,
            totalSold: 0,
            lastSale: sale.createdAt,
            avgPerTransaction: 0,
            status: 'normal' as const,
          };

          current.totalSold += quantity;
          current.lastSale = sale.createdAt;

          productMap.set(productName, current);
        });
      }
    });

    // Calculate additional metrics
    const products = Array.from(productMap.values()).map((p) => {
      const totalSold = productMap.get(p.name)!.totalSold;
      return {
        ...p,
        avgPerTransaction: totalSold > 0 ? totalSold / sales.length : 0,
        status: totalSold < 5 ? 'critical' : totalSold < 20 ? 'low' : 'normal' as const,
      };
    });

    const lowStockProducts = products.filter((p) => p.status !== 'normal');
    const totalQuantitySold = products.reduce((sum, p) => sum + p.totalSold, 0);
    const averagePerProduct = products.length > 0 ? totalQuantitySold / products.length : 0;

    // Sort products
    let sortedProducts = [...products];
    if (sortBy === 'name') {
      sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'quantity') {
      sortedProducts.sort((a, b) => b.totalSold - a.totalSold);
    }

    return {
      totalProducts: products.length,
      totalQuantitySold,
      averagePerProduct,
      lowStockProducts,
      allProducts: sortedProducts,
    };
  }, [salesData?.data, sortBy]);

  // Get movements for selected product
  const productMovements = useMemo(() => {
    if (!selectedProduct || !salesData?.data) return [];

    const movements: any[] = [];

    salesData.data.forEach((sale: any) => {
      if (sale.items && Array.isArray(sale.items)) {
        sale.items.forEach((item: any) => {
          const productName = item.productName || item.name || 'Producto sin nombre';
          if (productName === selectedProduct) {
            const movementType = sale.status === 'REFUNDED' ? 'IN' : 'OUT';
            movements.push({
              id: sale.id,
              date: sale.createdAt,
              type: movementType,
              quantity: item.quantity || 0,
              unitPrice: item.unitPrice || item.price || 0,
              totalValue: (item.quantity || 0) * (item.unitPrice || item.price || 0),
              saleStatus: sale.status,
              saleRef: sale.id,
            });
          }
        });
      }
    });

    return movements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedProduct, salesData?.data]);

  const handleExportCSV = () => {
    try {
      let csvContent = 'data:text/csv;charset=utf-8,';
      csvContent += 'Producto,Cantidad Vendida,Promedio por Transacción,Estado,Última Venta\n';

      metrics.allProducts.forEach((product: any) => {
        const lastSale = product.lastSale ? new Date(product.lastSale).toISOString().split('T')[0] : 'N/A';
        csvContent += `${product.name},${product.totalSold},${product.avgPerTransaction.toFixed(2)},${product.status},${lastSale}\n`;
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `inventory-report-${new Date().toISOString().split('T')[0]}.csv`);
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
            <h1 className="text-4xl font-bold text-slate-900">Reporte de Inventario</h1>
            <p className="text-slate-600 mt-2 text-base">
              Monitorea el estado y movimiento de inventario de productos
            </p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Indicadores Clave</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
              <KPICard
                icon={FiBox}
                metric={String(metrics.totalProducts)}
                label="Total de Productos"
                color="primary"
              />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
              <KPICard
                icon={FiBox}
                metric={String(Math.round(metrics.totalQuantitySold))}
                label="Unidades Vendidas"
                color="success"
              />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
              <KPICard
                icon={FiBox}
                metric={String(Math.round(metrics.averagePerProduct))}
                label="Promedio por Producto"
                color="info"
              />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}>
              <KPICard
                icon={FiAlertCircle}
                metric={String(metrics.lowStockProducts.length)}
                label="Productos con Poco Stock"
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
                {/* Sort Options */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FiFilter className="text-slate-500" />
                    <span className="text-sm font-medium text-slate-700">Ordenar por</span>
                  </div>
                  <div className="space-y-2">
                    {[
                      { value: 'quantity', label: 'Cantidad Vendida' },
                      { value: 'name', label: 'Nombre del Producto' },
                    ].map(({ value, label }) => (
                      <button
                        key={value}
                        onClick={() => setSortBy(value as any)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${
                          sortBy === value
                            ? 'bg-primary-100 text-primary-700'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {label}
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
            {/* Low Stock Alert */}
            {metrics.lowStockProducts.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <FiAlertCircle className="w-6 h-6 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-amber-900 mb-2">Productos con Poco Stock</h3>
                    <p className="text-sm text-amber-700 mb-3">
                      {metrics.lowStockProducts.length} producto(s) requieren atención:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {metrics.lowStockProducts.map((product: any, idx: number) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-full"
                        >
                          {product.name} ({product.totalSold})
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Inventory Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900">Inventario de Productos</h3>
              </div>
              <div className="overflow-x-auto overflow-y-auto max-h-96">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold text-slate-900">Producto</th>
                      <th className="px-6 py-3 text-center font-semibold text-slate-900">Cantidad Vendida</th>
                      <th className="px-6 py-3 text-center font-semibold text-slate-900">Promedio/Transacción</th>
                      <th className="px-6 py-3 text-center font-semibold text-slate-900">Estado</th>
                      <th className="px-6 py-3 text-left font-semibold text-slate-900">Última Venta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                          Cargando...
                        </td>
                      </tr>
                    ) : metrics.allProducts.length > 0 ? (
                      metrics.allProducts.map((product: any, idx: number) => (
                        <tr
                          key={idx}
                          onClick={() => setSelectedProduct(product.name)}
                          className={`border-b border-slate-100 hover:bg-slate-50 transition cursor-pointer ${
                            selectedProduct === product.name ? 'bg-primary-50' : ''
                          }`}
                        >
                          <td className="px-6 py-3 text-slate-900 font-medium">{product.name}</td>
                          <td className="px-6 py-3 text-center text-slate-900">{product.totalSold}</td>
                          <td className="px-6 py-3 text-center text-slate-900">
                            {product.avgPerTransaction.toFixed(2)}
                          </td>
                          <td className="px-6 py-3 text-center">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                product.status === 'critical'
                                  ? 'bg-red-100 text-red-800'
                                  : product.status === 'low'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-green-100 text-green-800'
                              }`}
                            >
                              {product.status === 'critical'
                                ? 'Crítico'
                                : product.status === 'low'
                                ? 'Bajo'
                                : 'Normal'}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-slate-600 text-xs">
                            {product.lastSale ? new Date(product.lastSale).toISOString().split('T')[0] : 'Sin venta'}
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

            {/* Product Movements Modal */}
            {selectedProduct && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                onClick={() => setSelectedProduct(null)}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-96 overflow-hidden flex flex-col"
                >
                  {/* Modal Header */}
                  <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-50">
                    <h3 className="text-xl font-semibold text-slate-900">Movimientos: {selectedProduct}</h3>
                    <button
                      onClick={() => setSelectedProduct(null)}
                      className="p-1 hover:bg-slate-200 rounded-lg transition"
                    >
                      <FiX className="w-6 h-6 text-slate-600" />
                    </button>
                  </div>

                  {/* Modal Content - Movements Table */}
                  <div className="overflow-y-auto flex-1">
                    {productMovements.length > 0 ? (
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                          <tr>
                            <th className="px-6 py-3 text-left font-semibold text-slate-900">Fecha</th>
                            <th className="px-6 py-3 text-center font-semibold text-slate-900">Tipo</th>
                            <th className="px-6 py-3 text-center font-semibold text-slate-900">Cantidad</th>
                            <th className="px-6 py-3 text-right font-semibold text-slate-900">Unitario</th>
                            <th className="px-6 py-3 text-right font-semibold text-slate-900">Total</th>
                            <th className="px-6 py-3 text-center font-semibold text-slate-900">Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {productMovements.map((movement: any, idx: number) => (
                            <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition">
                              <td className="px-6 py-3 text-slate-900">
                                {new Date(movement.date).toISOString().split('T')[0]}
                              </td>
                              <td className="px-6 py-3 text-center">
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                    movement.type === 'OUT'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-green-100 text-green-800'
                                  }`}
                                >
                                  {movement.type === 'OUT' ? (
                                    <>
                                      <FiArrowDown className="w-3 h-3" />
                                      Salida
                                    </>
                                  ) : (
                                    <>
                                      <FiArrowUp className="w-3 h-3" />
                                      Entrada
                                    </>
                                  )}
                                </span>
                              </td>
                              <td className="px-6 py-3 text-center font-medium text-slate-900">
                                {movement.quantity}
                              </td>
                              <td className="px-6 py-3 text-right text-slate-900">
                                {formatCurrency(movement.unitPrice)}
                              </td>
                              <td className="px-6 py-3 text-right font-semibold text-slate-900">
                                {formatCurrency(movement.totalValue)}
                              </td>
                              <td className="px-6 py-3 text-center">
                                <span
                                  className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    movement.saleStatus === 'COMPLETED'
                                      ? 'bg-blue-100 text-blue-800'
                                      : movement.saleStatus === 'REFUNDED'
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  {movement.saleStatus === 'COMPLETED'
                                    ? 'Completada'
                                    : movement.saleStatus === 'REFUNDED'
                                    ? 'Reembolso'
                                    : 'Borrador'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="p-8 text-center text-slate-500">
                        No hay movimientos registrados para este producto
                      </div>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InventoryReportPage() {
  return (
    <PermissionGateRoute permissions={['pos:sales:read']}>
      <InventoryReportContent />
    </PermissionGateRoute>
  );
}
