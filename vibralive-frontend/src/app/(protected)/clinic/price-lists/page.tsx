'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { MdAdd, MdEdit, MdDelete } from 'react-icons/md';
import { FiFilter, FiSearch, FiRefreshCw, FiAlertCircle } from 'react-icons/fi';
import { PermissionGateRoute } from '@/components/PermissionGateRoute';
import { PermissionGate } from '@/components/PermissionGate';
import { usePermissions } from '@/hooks/usePermissions';
import { PriceList } from '@/types';
import { PriceListCard } from '@/components/platform/PriceListCard';
import { PriceListTable } from '@/components/platform/PriceListTable';
import { useClinicTimezone } from '@/hooks/useClinicTimezone';
import { utcToZonedTime } from 'date-fns-tz';
import { CreatePriceListModal } from '@/components/CreatePriceListModal';
import { priceListsApi } from '@/api/price-lists-api';
import toast from 'react-hot-toast';

type SortOption = 'name-asc' | 'name-desc' | 'created-desc' | 'created-asc';
type FilterOption = 'all' | 'active' | 'inactive' | 'default';

function ClinicPriceListsPageContent() {
  const router = useRouter();
  const clinicTimezone = useClinicTimezone();
  const { has } = usePermissions();
  
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPriceList, setEditingPriceList] = useState<PriceList | null>(null);
  const [deleteConfirmPriceList, setDeleteConfirmPriceList] = useState<PriceList | null>(null);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  // Fetch price lists
  const fetchPriceLists = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await priceListsApi.getActivePriceLists();
      setPriceLists(response);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar listas de precios';
      setError(message);
      console.error('Error fetching price lists:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPriceLists();
  }, [fetchPriceLists]);

  // Filter & Sort price lists
  const filteredAndSortedLists = useMemo(() => {
    let filtered = priceLists;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((p) => p.name.toLowerCase().includes(term));
    }

    if (filterBy !== 'all') {
      if (filterBy === 'active') {
        filtered = filtered.filter((p) => p.isActive);
      } else if (filterBy === 'inactive') {
        filtered = filtered.filter((p) => !p.isActive);
      } else if (filterBy === 'default') {
        filtered = filtered.filter((p) => p.isDefault);
      }
    }

    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'created-desc': {
          const aDate = utcToZonedTime(new Date(a.createdAt), clinicTimezone);
          const bDate = utcToZonedTime(new Date(b.createdAt), clinicTimezone);
          return bDate.getTime() - aDate.getTime();
        }
        case 'created-asc': {
          const aDate = utcToZonedTime(new Date(a.createdAt), clinicTimezone);
          const bDate = utcToZonedTime(new Date(b.createdAt), clinicTimezone);
          return aDate.getTime() - bDate.getTime();
        }
        default:
          return 0;
      }
    });

    return filtered;
  }, [priceLists, searchTerm, filterBy, sortBy, clinicTimezone]);

  // Pagination logic
  const totalPages = useMemo(() => {
    return Math.ceil(filteredAndSortedLists.length / itemsPerPage);
  }, [filteredAndSortedLists.length, itemsPerPage]);

  const paginatedLists = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedLists.slice(startIndex, endIndex);
  }, [filteredAndSortedLists, currentPage, itemsPerPage]);

  // Reset to first page when search/filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterBy, sortBy]);

  // Handlers
  const handleCreateNew = useCallback(() => {
    setIsCreateOpen(true);
  }, []);

  const handleCreateSuccess = () => {
    fetchPriceLists();
    setIsCreateOpen(false);
  };

  const handleEditPriceList = useCallback((priceList: PriceList) => {
    setEditingPriceList(priceList);
  }, []);

  const handleEditSuccess = () => {
    fetchPriceLists();
    setEditingPriceList(null);
  };

  const handleDeletePriceList = (priceList: PriceList) => {
    if (priceList.isDefault) {
      toast.error('No se puede eliminar la lista predeterminada');
      return;
    }
    setDeleteConfirmPriceList(priceList);
  };

  const handleConfirmDeletePriceList = async () => {
    if (!deleteConfirmPriceList) return;

    setIsDeleteLoading(true);
    try {
      await priceListsApi.deletePriceList(deleteConfirmPriceList.id);
      toast.success('Lista de precios eliminada');
      setDeleteConfirmPriceList(null);
      fetchPriceLists();
    } catch (error) {
      console.error('Error deleting price list:', error);
      toast.error('Error al eliminar la lista de precios');
    } finally {
      setIsDeleteLoading(false);
    }
  };

  const handleViewDetails = (priceList: PriceList) => {
    router.push(`/clinic/price-lists/${priceList.id}`);
  };

  if (!isLoading && error) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        {error}
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-slate-50 -m-6 lg:-m-4">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                💰 Listas de Precios
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Gestiona las listas de precios disponibles
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Refresh */}
              <button
                onClick={fetchPriceLists}
                disabled={isLoading}
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                title="Actualizar"
              >
                <FiRefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>

              {/* New Price List Button */}
              <PermissionGate require={{ permissions: ['price-lists:create'] }}>
                <button
                  onClick={handleCreateNew}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                >
                  <MdAdd className="w-5 h-5" />
                  <span className="hidden sm:inline">Nueva Lista</span>
                </button>
              </PermissionGate>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="flex flex-wrap gap-3 mt-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-sm">
              <FiSearch className="text-slate-500" />
              <span className="text-slate-600">Total:</span>
              <span className="font-semibold">{priceLists.length}</span>
            </div>
            {priceLists.filter((p) => p.isDefault).length > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg text-sm">
                <span className="text-blue-600 font-semibold">⭐ Predeterminada</span>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Panel - Filters */}
          <div className="lg:col-span-1 space-y-4">
            {/* Search */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2">
                <FiSearch className="text-slate-400 w-4 h-4 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Buscar lista..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 border-none focus:outline-none focus:ring-0 text-sm"
                />
              </div>
            </div>

            {/* Filter by Status */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <label className="text-sm font-medium text-slate-700 block mb-3">
                Estado
              </label>
              <div className="space-y-2">
                {[
                  { value: 'all', label: 'Todas' },
                  { value: 'active', label: 'Activas' },
                  { value: 'inactive', label: 'Inactivas' },
                  { value: 'default', label: 'Predeterminada' },
                ].map((option) => (
                  <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value={option.value}
                      checked={filterBy === (option.value as FilterOption)}
                      onChange={(e) => setFilterBy(e.target.value as FilterOption)}
                      className="w-4 h-4 text-blue-600 cursor-pointer"
                    />
                    <span className="text-sm text-slate-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Sort */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <label className="text-sm font-medium text-slate-700 block mb-2">
                Ordenar por
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="name-asc">Nombre (A-Z)</option>
                <option value="name-desc">Nombre (Z-A)</option>
                <option value="created-desc">Más recientes</option>
                <option value="created-asc">Más antiguos</option>
              </select>
            </div>
          </div>

          {/* Right Panel - Price Lists */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              {/* Header with view toggle */}
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <p className="text-sm text-slate-600">
                  {filteredAndSortedLists.length} listas encontradas
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`p-2 rounded-lg transition ${
                      viewMode === 'cards'
                        ? 'bg-blue-100 text-blue-600'
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
                        ? 'bg-blue-100 text-blue-600'
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

              {/* Content */}
              <div className="p-6">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
                    <p className="text-slate-500">Cargando listas de precios...</p>
                  </div>
                ) : filteredAndSortedLists.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <FiAlertCircle className="w-12 h-12 text-slate-300 mb-3" />
                    <p className="text-slate-500">No hay listas de precios que mostrar</p>
                  </div>
                ) : viewMode === 'cards' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {paginatedLists.map((priceList) => (
                      <PriceListCard
                        key={priceList.id}
                        priceList={priceList}
                        size="S"
                        onEdit={handleEditPriceList}
                        onDelete={handleDeletePriceList}
                        onViewDetails={handleViewDetails}
                      />
                    ))}
                  </div>
                ) : (
                  <PriceListTable
                    priceLists={paginatedLists}
                    onEdit={handleEditPriceList}
                    onDelete={handleDeletePriceList}
                    onViewDetails={handleViewDetails}
                  />
                )}
              </div>

              {/* Pagination */}
              {filteredAndSortedLists.length > itemsPerPage && (
                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div className="text-sm text-slate-600">
                    Página {currentPage} de {totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      Anterior
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Modals */}
      <CreatePriceListModal
        isOpen={isCreateOpen || !!editingPriceList}
        onClose={() => {
          setIsCreateOpen(false);
          setEditingPriceList(null);
        }}
        onSuccess={editingPriceList ? handleEditSuccess : handleCreateSuccess}
        priceList={editingPriceList || undefined}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmPriceList && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
            onClick={() => setDeleteConfirmPriceList(null)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
              {/* Header */}
              <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MdDelete className="w-6 h-6 text-white" />
                  <h2 className="text-lg font-bold text-white">Eliminar Lista</h2>
                </div>
                <button
                  onClick={() => setDeleteConfirmPriceList(null)}
                  className="text-white hover:bg-red-600 rounded-lg p-2 transition"
                >
                  ✕
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-900">
                    <strong>⚠️ Advertencia:</strong> Esta acción no se puede deshacer. Se eliminarán todos los precios configurados en esta lista.
                  </p>
                </div>

                <p className="text-sm text-gray-700">
                  ¿Estás seguro de que deseas eliminar la lista <strong>"{deleteConfirmPriceList.name}"</strong>?
                </p>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl flex gap-3 justify-end">
                <button
                  onClick={() => setDeleteConfirmPriceList(null)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                  disabled={isDeleteLoading}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmDeletePriceList}
                  className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition font-medium flex items-center gap-2 disabled:opacity-50"
                  disabled={isDeleteLoading}
                >
                  {isDeleteLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Eliminando...
                    </>
                  ) : (
                    <>
                      <MdDelete className="w-4 h-4" />
                      Eliminar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default function ClinicPriceListsPage() {
  return (
    <PermissionGateRoute permissions={['pricing:price_lists:read']}>
      <ClinicPriceListsPageContent />
    </PermissionGateRoute>
  );
}