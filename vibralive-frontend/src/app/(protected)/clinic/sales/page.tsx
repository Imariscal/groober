'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { MdAdd, MdShoppingCart } from 'react-icons/md';
import { FiFilter, FiSearch, FiAlertCircle, FiRefreshCw } from 'react-icons/fi';
import { CreateSaleModal } from '@/components/CreateSaleModal';
import { DeleteSaleConfirmation } from '@/components/DeleteSaleConfirmation';
import { SaleCard } from '@/components/platform/SaleCard';
import { SalesTable } from '@/components/platform/SalesTable';
import { useSalesQuery } from '@/hooks/usePosMutations';
import { completeSale, refundSale } from '@/lib/pos-api';
import { formatCurrency } from '@/lib/currency';
import toast from 'react-hot-toast';

interface Sale {
  id: string;
  date: string;
  items?: any[];
  total: number;
  status: 'DRAFT' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
  customerName?: string;
  paymentMethod?: string;
}

type ViewMode = 'cards' | 'table';

export default function SalesPageV2() {
  // ==================== STATE ====================
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');

  // Modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deletingSale, setDeletingSale] = useState<Sale | null>(null);

  // ==================== QUERIES ====================
  const { data: salesData, isLoading, refetch } = useSalesQuery({
    status: filterStatus !== 'all' ? filterStatus : undefined,
  });

  // Transform API data to UI format - only POS sales
  const sales = useMemo(() => {
    if (!salesData || !Array.isArray(salesData.data)) return [];
    
    return salesData.data
      .filter((sale: any) => sale.saleType === 'POS') // 👈 Only show POS sales, not APPOINTMENT_ADDON
      .map((sale: any) => ({
        id: sale.id,
        saleType: sale.saleType, // Include saleType for reference
        date: sale.createdAt ? new Date(sale.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        items: sale.items || [], // Pass full items array
        total: sale.totalAmount || 0,
        status: sale.status || 'DRAFT' as const,
        customerName: sale.clientId ? `Cliente ${sale.clientId.substring(0, 8)}` : 'Venta Anónima',
        paymentMethod: 'NO_ESPECIFICADO',
      }));
  }, [salesData?.data]);

  // ==================== HANDLERS ====================
  const handleRefresh = async () => {
    try {
      await refetch();
      toast.success('Ventas actualizadas');
    } catch (error) {
      toast.error('Error al actualizar ventas');
    }
  };

  const handleCreateSaleSuccess = () => {
    setIsCreateModalOpen(false);
    refetch(); // Refresh the list
    toast.success('Venta creada exitosamente');
  };

  const handleEditSale = (updatedSale: Sale) => {
    // TODO: Implement update mutation
    toast.success('Venta actualizada exitosamente');
  };

  const handleDeleteSale = (sale: Sale) => {
    setDeletingSale(sale);
  };

  const handleConfirmDelete = () => {
    if (deletingSale) {
      // TODO: Implement delete mutation
      setDeletingSale(null);
      refetch(); // Refresh the list
      toast.success('Venta eliminada');
    }
  };

  const handleToggleStatus = useCallback(async (sale: Sale) => {
    if (sale.status === 'DRAFT') {
      try {
        // Call the API directly
        const result = await completeSale(sale.id);
        toast.success('Venta completada exitosamente');
        refetch(); // Refresh the list
      } catch (error: any) {
        const errorMessage = error?.response?.data?.message || 'Error al completar la venta';
        toast.error(errorMessage);
      }
    } else {
      // TODO: Implement convert to draft mutation
      toast.success('Convertir a borrador no está implementado aún');
    }
  }, [refetch]);

  const handleRefundSale = useCallback(async (sale: Sale) => {
    try {
      await refundSale(sale.id);
      toast.success('Venta reembolsada exitosamente');
      refetch(); // Refresh the list
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Error al reembolsar la venta';
      toast.error(errorMessage);
    }
  }, [refetch]);

  // ==================== FILTERING ====================
  const filteredSales = useMemo(() => {
    let filtered = sales;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((s: Sale) =>
        s.customerName?.toLowerCase().includes(term) ||
        s.id.includes(term)
      );
    }

    return filtered;
  }, [sales, searchTerm]);

  // ==================== STATISTICS ====================
  const stats = useMemo(() => {
    return {
      total: sales.length,
      completed: sales.filter((s: Sale) => s.status === 'COMPLETED').length,
      draft: sales.filter((s: Sale) => s.status === 'DRAFT').length,
      refunded: sales.filter((s: Sale) => s.status === 'REFUNDED').length,
      totalAmount: sales.reduce((sum: number, s: Sale) => sum + Number(s.total || 0), 0),
    };
  }, [sales]);

  // ==================== RENDER ====================
  return (
    <div className="min-h-screen bg-slate-50 -m-6 lg:-m-4">
      
      {/* MODALES */}
      {/* For Create: isEditMode=false, saleId=undefined */}
      {/* For Edit: isEditMode=true, saleId=editingSale?.id */}
      {/* forceType="POS" hides the sale type selector - always POS in sales page */}
      <CreateSaleModal
        isOpen={isCreateModalOpen || isEditModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setIsEditModalOpen(false);
          setEditingSale(null);
        }}
        onSuccess={isEditModalOpen ? handleEditSale : handleCreateSaleSuccess}
        saleId={editingSale?.id}
        forceType="POS"
      />
      <DeleteSaleConfirmation
        isOpen={!!deletingSale}
        sale={deletingSale}
        onClose={() => setDeletingSale(null)}
        onSuccess={handleConfirmDelete}
      />

      {/* HEADER */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <MdShoppingCart className="text-primary-600 text-3xl" />
              Punto de Venta (POS)
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Gestión de ventas y transacciones
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition disabled:opacity-50"
              title="Actualizar"
            >
              <FiRefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            {/* New Sale Button */}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition"
            >
              <MdAdd className="w-5 h-5" />
              <span className="hidden sm:inline">Nueva Venta</span>
            </button>
          </div>
        </div>

        {/* STATS BAR */}
        <div className="flex flex-wrap gap-3 mt-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-sm">
            <FiSearch className="text-slate-500" />
            <span className="text-slate-600">Total:</span>
            <span className="font-semibold">{stats.total}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-success-50 rounded-lg text-sm">
            <span className="text-success-600">✓</span>
            <span className="text-success-700">Completadas:</span>
            <span className="font-semibold text-success-700">{stats.completed}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg text-sm">
            <span className="text-slate-600">✎</span>
            <span className="text-slate-700">Borradores:</span>
            <span className="font-semibold text-slate-700">{stats.draft}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg text-sm">
            <span className="text-blue-600">♻️</span>
            <span className="text-blue-700">Reembolsos:</span>
            <span className="font-semibold text-blue-700">{stats.refunded}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg text-sm">
            <span className="text-slate-600">💰</span>
            <span className="text-slate-700">Total:</span>
            <span className="font-semibold text-slate-700">{formatCurrency(Number(stats.totalAmount || 0))}</span>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* LEFT PANEL - FILTERS */}
          <div className="lg:col-span-1 space-y-4">
            
            {/* Search */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2">
                <FiSearch className="text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 border-none outline-none text-sm bg-transparent"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
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
                    {status === 'all' ? 'Todas' : status === 'COMPLETED' ? 'Completadas' : status === 'REFUNDED' ? 'Reembolsadas' : 'Borradores'}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT PANEL - CONTENT */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              
              {/* VIEW TOGGLE */}
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <p className="text-sm text-slate-600">
                  {filteredSales.length} ventas encontradas
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`p-2 rounded-lg transition ${
                      viewMode === 'cards'
                        ? 'bg-primary-100 text-primary-600'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                    title="Vista de tarjetas"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4z" />
                      <path d="M3 10a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-2 rounded-lg transition ${
                      viewMode === 'table'
                        ? 'bg-primary-100 text-primary-600'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                    title="Vista de tabla"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* CONTENT */}
              <div className="p-6">
                {filteredSales.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <FiAlertCircle className="w-12 h-12 text-slate-300 mb-3" />
                    <p className="text-slate-500">No hay ventas que mostrar</p>
                  </div>
                ) : viewMode === 'cards' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filteredSales.map((sale: Sale) => (
                      <SaleCard
                        key={sale.id}
                        sale={sale}
                        onEdit={(s) => {
                          setEditingSale(s);
                          setIsEditModalOpen(true);
                        }}
                        onDelete={handleDeleteSale}
                        onToggleActive={handleToggleStatus}
                        onRefund={handleRefundSale}
                      />
                    ))}
                  </div>
                ) : (
                  <SalesTable
                    sales={filteredSales}
                    onEdit={(s) => {
                      setEditingSale(s);
                      setIsEditModalOpen(true);
                    }}
                    onDelete={handleDeleteSale}
                    onToggleActive={handleToggleStatus}
                    onRefund={handleRefundSale}
                  />
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

