'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { MdAdd, MdEdit, MdDelete } from 'react-icons/md';
import {
  FiFilter,
  FiSearch,
  FiRefreshCw,
  FiAlertCircle,
} from 'react-icons/fi';
import { Service } from '@/types';
import { servicesConfig } from '@/config/servicesConfig';
import { ServiceCard } from '@/components/platform/ServiceCard';
import { ServiceTable } from '@/components/platform/ServiceTable';
import { useClinicTimezone } from '@/hooks/useClinicTimezone';
import { utcToZonedTime } from 'date-fns-tz';
import { CreateServiceModal } from '@/components/CreateServiceModal';
import { DeleteServiceConfirmModal } from '@/components/DeleteServiceConfirmModal';
import { HardDeleteServiceModal } from '@/components/HardDeleteServiceModal';
import { servicesApi } from '@/api/services-api';
import toast from 'react-hot-toast';
import { PermissionGateRoute } from '@/components/PermissionGateRoute';
import { PermissionGate } from '@/components/PermissionGate';
import { usePermissions } from '@/hooks/usePermissions';

type SortOption = 'name-asc' | 'name-desc' | 'created-desc' | 'created-asc';

function ServicesPageContent() {
  const clinicTimezone = useClinicTimezone();
  const { has } = usePermissions();
  const searchParams = useSearchParams();
  
  // Data & Loading
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'GROOMING' | 'MEDICAL'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deactivateConfirmService, setDeactivateConfirmService] = useState<Service | null>(null);
  const [hardDeleteConfirmService, setHardDeleteConfirmService] = useState<Service | null>(null);

  // Lee el parámetro 'category' de la URL al montar el componente
  useEffect(() => {
    const categoryParam = searchParams?.get('category');
    if (categoryParam === 'GROOMING' || categoryParam === 'MEDICAL') {
      setCategoryFilter(categoryParam);
      console.log(`📌 Filtro de categoría establecido por URL: ${categoryParam}`);
    }
  }, [searchParams]);

  // Fetch services
  const fetchServices = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await servicesApi.getServices();
      setServices(response);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar servicios';
      setError(message);
      console.error('Error fetching services:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  // Filter & Sort services
  const filteredAndSortedServices = useMemo(() => {
    let filtered = services;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(term) ||
          (s.description?.toLowerCase().includes(term) || false)
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter((s) => s.category === categoryFilter);
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
  }, [services, searchTerm, sortBy, categoryFilter, clinicTimezone]);

  // Pagination logic
  const totalPages = useMemo(() => {
    return Math.ceil(filteredAndSortedServices.length / itemsPerPage);
  }, [filteredAndSortedServices.length, itemsPerPage]);

  const paginatedServices = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedServices.slice(startIndex, endIndex);
  }, [filteredAndSortedServices, currentPage, itemsPerPage]);

  // Reset to first page when search/filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy]);

  // Handlers
  const handleCreateNew = useCallback(() => {
    setEditingService(null);
    setIsFormModalOpen(true);
  }, []);

  const handleEditService = useCallback((service: Service) => {
    setEditingService(service);
    setIsFormModalOpen(true);
  }, []);

  const handleDeleteService = useCallback((service: Service) => {
    setHardDeleteConfirmService(service);
  }, []);

  const handleDeactivateService = useCallback((service: Service) => {
    setDeactivateConfirmService(service);
  }, []);

  const handleFormModalSuccess = () => {
    fetchServices();
    setIsFormModalOpen(false);
    setEditingService(null);
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
                ✂️ Servicios
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Gestiona los servicios disponibles
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Refresh */}
              <button
                onClick={fetchServices}
                disabled={isLoading}
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                title="Actualizar"
              >
                <FiRefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>

              {/* New Service Button */}
              <PermissionGate require={{ permissions: ['services:create'] }}>
                <button
                  onClick={handleCreateNew}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                >
                  <MdAdd className="w-5 h-5" />
                  <span className="hidden sm:inline">Nuevo Servicio</span>
                </button>
              </PermissionGate>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="flex flex-wrap gap-3 mt-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-sm">
              <FiSearch className="text-slate-500" />
              <span className="text-slate-600">Total:</span>
              <span className="font-semibold">{services.length}</span>
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
                  placeholder="Buscar servicio..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 border-none focus:outline-none focus:ring-0 text-sm"
                />
              </div>
            </div>

            {/* Sort */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <label className="text-sm font-medium text-slate-700 block mb-2 text-left">
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

            {/* Category Filter */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <label className="text-sm font-medium text-slate-700 block mb-2 text-left">
                Categoría
              </label>
              <div className="space-y-2">
                {[
                  { value: 'all', label: 'Todas' },
                  { value: 'GROOMING', label: 'Grooming' },
                  { value: 'MEDICAL', label: 'Médico' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setCategoryFilter(option.value as 'all' | 'GROOMING' | 'MEDICAL')}
                    className={`w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                      categoryFilter === option.value
                        ? 'bg-blue-100 text-blue-700 border border-blue-300'
                        : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel - Services */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              {/* Header with view toggle */}
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <p className="text-sm text-slate-600">
                  {filteredAndSortedServices.length} servicios encontrados
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
                    <p className="text-slate-500">Cargando servicios...</p>
                  </div>
                ) : filteredAndSortedServices.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <FiAlertCircle className="w-12 h-12 text-slate-300 mb-3" />
                    <p className="text-slate-500">No hay servicios que mostrar</p>
                  </div>
                ) : viewMode === 'cards' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {paginatedServices.map((service) => (
                      <ServiceCard
                        key={service.id}
                        service={service}
                        servicePrice={Number(service.price) || 0}
                        size="XS"
                        onEdit={handleEditService}
                        onDeactivate={handleDeactivateService}
                        onDelete={handleDeleteService}
                      />
                    ))}
                  </div>
                ) : (
                  <ServiceTable
                    services={paginatedServices}
                    onEdit={handleEditService}
                    onDeactivate={handleDeactivateService}
                    onDelete={handleDeleteService}
                  />
                )}
              </div>

              {/* Pagination */}
              {filteredAndSortedServices.length > itemsPerPage && (
                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div className="text-sm text-slate-600">
                    Página {currentPage} de {Math.ceil(filteredAndSortedServices.length / itemsPerPage)}
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
                      onClick={() => setCurrentPage(Math.min(Math.ceil(filteredAndSortedServices.length / itemsPerPage), currentPage + 1))}
                      disabled={currentPage === Math.ceil(filteredAndSortedServices.length / itemsPerPage)}
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
      <CreateServiceModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingService(null);
        }}
        onSuccess={handleFormModalSuccess}
        service={editingService || undefined}
      />

      <DeleteServiceConfirmModal
        isOpen={!!deactivateConfirmService}
        service={deactivateConfirmService}
        onClose={() => setDeactivateConfirmService(null)}
        onSuccess={fetchServices}
      />

      <HardDeleteServiceModal
        isOpen={!!hardDeleteConfirmService}
        service={hardDeleteConfirmService}
        onClose={() => setHardDeleteConfirmService(null)}
        onSuccess={fetchServices}
      />
    </>
  );
}

export default function ClinicServicesPage() {
  return (
    <PermissionGateRoute permissions={['services:read']}>
      <ServicesPageContent />
    </PermissionGateRoute>
  );
}
