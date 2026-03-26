'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { MdAdd, MdEdit, MdDelete } from 'react-icons/md';
import { FiFilter, FiSearch, FiRefreshCw, FiAlertCircle } from 'react-icons/fi';
import { ServicePackage } from '@/types';
import { PackageCard } from '@/components/platform/PackageCard';
import { PackageTable } from '@/components/platform/PackageTable';
import { useClinicTimezone } from '@/hooks/useClinicTimezone';
import { utcToZonedTime } from 'date-fns-tz';
import { CreatePackageModal } from '@/components/CreatePackageModal';
import { DeletePackageConfirmModal } from '@/components/DeletePackageConfirmModal';
import { HardDeletePackageModal } from '@/components/HardDeletePackageModal';
import { packagesApi } from '@/api/packages-api';
import toast from 'react-hot-toast';
import { PermissionGateRoute } from '@/components/PermissionGateRoute';
import { PermissionGate } from '@/components/PermissionGate';
import { usePermissions } from '@/hooks/usePermissions';

type SortOption = 'name-asc' | 'name-desc' | 'created-desc' | 'created-asc';

function ClinicPackagesPageContent() {
  const clinicTimezone = useClinicTimezone();
  const { has } = usePermissions();

  // Data & Loading
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<ServicePackage | null>(null);
  const [deactivateConfirmPackage, setDeactivateConfirmPackage] = useState<ServicePackage | null>(null);
  const [hardDeleteConfirmPackage, setHardDeleteConfirmPackage] = useState<ServicePackage | null>(null);

  // Fetch packages
  const fetchPackages = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await packagesApi.getPackages();
      setPackages(response);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar paquetes';
      setError(message);
      console.error('Error fetching packages:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  // Filter & Sort packages
  const filteredAndSortedPackages = useMemo(() => {
    let filtered = packages;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          (p.description?.toLowerCase().includes(term) || false)
      );
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
  }, [packages, searchTerm, sortBy, clinicTimezone]);

  // Pagination logic
  const totalPages = useMemo(() => {
    return Math.ceil(filteredAndSortedPackages.length / itemsPerPage);
  }, [filteredAndSortedPackages.length, itemsPerPage]);

  const paginatedPackages = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedPackages.slice(startIndex, endIndex);
  }, [filteredAndSortedPackages, currentPage, itemsPerPage]);

  // Reset to first page when search/filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy]);

  // Handlers
  const handleCreateNew = useCallback(() => {
    setEditingPackage(null);
    setIsFormModalOpen(true);
  }, []);

  const handleEditPackage = useCallback((pkg: ServicePackage) => {
    setEditingPackage(pkg);
    setIsFormModalOpen(true);
  }, []);

  const handleDeletePackage = useCallback((pkg: ServicePackage) => {
    setHardDeleteConfirmPackage(pkg);
  }, []);

  const handleDeactivatePackage = useCallback(async (pkg: ServicePackage) => {
    // Si está INACTIVO, activar directamente sin modal
    if (!pkg.isActive) {
      try {
        await packagesApi.deactivatePackage(pkg.id);
        toast.success(`Paquete "${pkg.name}" activado exitosamente`);
        fetchPackages();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error al activar el paquete';
        toast.error(message);
        console.error('Error activating package:', error);
      }
      return;
    }

    // Si está ACTIVO, mostrar modal de confirmación
    setDeactivateConfirmPackage(pkg);
  }, [fetchPackages]);

  const handleFormModalSuccess = () => {
    fetchPackages();
    setIsFormModalOpen(false);
    setEditingPackage(null);
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
                📦 Paquetes
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Gestiona los paquetes de servicios disponibles
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Refresh */}
              <button
                onClick={fetchPackages}
                disabled={isLoading}
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                title="Actualizar"
              >
                <FiRefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>

              {/* New Package Button */}
              <PermissionGate require={{ permissions: ['packages:create'] }}>
                <button
                  onClick={handleCreateNew}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                >
                  <MdAdd className="w-5 h-5" />
                  <span className="hidden sm:inline">Nuevo Paquete</span>
                </button>
              </PermissionGate>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="flex flex-wrap gap-3 mt-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-sm">
              <FiSearch className="text-slate-500" />
              <span className="text-slate-600">Total:</span>
              <span className="font-semibold">{packages.length}</span>
            </div>
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
                    placeholder="Buscar paquete..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 border-none focus:outline-none focus:ring-0 text-sm"
                  />
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

            {/* Right Panel - Packages */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Header with view toggle */}
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                  <p className="text-sm text-slate-600">
                    {filteredAndSortedPackages.length} paquetes encontrados
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setViewMode('cards')}
                      className={`p-2 rounded-lg transition ${viewMode === 'cards'
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
                      className={`p-2 rounded-lg transition ${viewMode === 'table'
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
                      <p className="text-slate-500">Cargando paquetes...</p>
                    </div>
                  ) : filteredAndSortedPackages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <FiAlertCircle className="w-12 h-12 text-slate-300 mb-3" />
                      <p className="text-slate-500">No hay paquetes que mostrar</p>
                    </div>
                  ) : viewMode === 'cards' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                      {paginatedPackages.map((pkg) => (
                        <PackageCard
                          key={pkg.id}
                          pkg={pkg}
                          size="XS"
                          onEdit={handleEditPackage}
                          onDeactivate={handleDeactivatePackage}
                          onDelete={handleDeletePackage}
                        />
                      ))}
                    </div>
                  ) : (
                    <PackageTable
                      packages={paginatedPackages}
                      onEdit={handleEditPackage}
                      onDeactivate={handleDeactivatePackage}
                      onDelete={handleDeletePackage}
                    />
                  )}
                </div>

                {/* Pagination */}
                {filteredAndSortedPackages.length > itemsPerPage && (
                  <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div className="text-sm text-slate-600">
                      Página {currentPage} de {Math.ceil(filteredAndSortedPackages.length / itemsPerPage)}
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
                        onClick={() => setCurrentPage(Math.min(Math.ceil(filteredAndSortedPackages.length / itemsPerPage), currentPage + 1))}
                        disabled={currentPage === Math.ceil(filteredAndSortedPackages.length / itemsPerPage)}
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
      <CreatePackageModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingPackage(null);
        }}
        onSuccess={handleFormModalSuccess}
        pkg={editingPackage || undefined}
      />

      <DeletePackageConfirmModal
        isOpen={!!deactivateConfirmPackage}
        pkg={deactivateConfirmPackage}
        onClose={() => setDeactivateConfirmPackage(null)}
        onSuccess={fetchPackages}
      />

      <HardDeletePackageModal
        isOpen={!!hardDeleteConfirmPackage}
        pkg={hardDeleteConfirmPackage}
        onClose={() => setHardDeleteConfirmPackage(null)}
        onSuccess={fetchPackages}
      />

    </>
  );
}

export default function ClinicPackagesPage() {
  return (
    <PermissionGateRoute permissions={['packages:read']}>
      <ClinicPackagesPageContent />
    </PermissionGateRoute>
  );
}
