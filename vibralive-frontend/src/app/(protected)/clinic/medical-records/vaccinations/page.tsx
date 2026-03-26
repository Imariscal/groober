'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { MdVaccines, MdAdd } from 'react-icons/md';
import { FiFilter, FiSearch, FiRefreshCw, FiCheck } from 'react-icons/fi';
import { PermissionGate } from '@/components/PermissionGate';
import { usePermissions } from '@/hooks/usePermissions';
import { VaccineCard } from '@/components/platform/VaccineCard';
import { VaccinesTable } from '@/components/platform/VaccinesTable';
import { CreateVaccineModal } from '@/components/platform/CreateVaccineModal';
import { EditVaccineModal } from '@/components/platform/EditVaccineModal';
import { DeleteVaccineConfirmation } from '@/components/platform/DeleteVaccineConfirmation';
import {
  getAllVaccines,
  getActiveVaccines,
  activateVaccine,
  deactivateVaccine,
} from '@/api/ehr-api';
import toast from 'react-hot-toast';

interface Vaccine {
  id: string;
  name: string;
  description?: string;
  diseasesCovered?: string[];
  isSingleDose?: boolean;
  boosterDays?: number;
  isActive: boolean;
  createdAt?: string;
}

type ViewMode = 'cards' | 'table';
type StatusFilter = 'all' | 'active' | 'inactive';
type SortOption = 'name-asc' | 'name-desc' | 'created-desc' | 'created-asc';

function VaccinesPageContent() {
  const { has } = usePermissions();

  // ==================== STATE MANAGEMENT ====================
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('created-desc');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingVaccine, setEditingVaccine] = useState<Vaccine | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deletingVaccine, setDeletingVaccine] = useState<Vaccine | null>(null);

  // ==================== API METHODS ====================
  const fetchVaccines = async () => {
    setIsLoading(true);
    try {
      // Página está protegida por PermissionGate, así que siempre cargamos todas
      const data = await getAllVaccines();
      console.log('[Vaccinations] Loaded vaccines:', data);
      setVaccines(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al cargar vacunas';
      console.error('Error loading vaccines:', error);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVaccines();
  }, []);

  // ==================== HANDLERS ====================
  const handleEditVaccine = (vaccine: Vaccine) => {
    setEditingVaccine(vaccine);
    setIsEditModalOpen(true);
  };

  const handleDeleteVaccine = (vaccine: Vaccine) => {
    setDeletingVaccine(vaccine);
  };

  const handleActivateVaccine = async (vaccine: Vaccine) => {
    try {
      await activateVaccine(vaccine.id);
      toast.success('Vacuna activada');
      fetchVaccines();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al activar vacuna';
      toast.error(message);
    }
  };

  const handleDeactivateVaccine = async (vaccine: Vaccine) => {
    try {
      await deactivateVaccine(vaccine.id);
      toast.success('Vacuna desactivada');
      fetchVaccines();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al desactivar vacuna';
      toast.error(message);
    }
  };

  const handleCreateSuccess = () => {
    fetchVaccines();
    setIsCreateModalOpen(false);
    setCurrentPage(1);
  };

  const handleEditSuccess = () => {
    fetchVaccines();
    setIsEditModalOpen(false);
    setEditingVaccine(null);
  };

  const handleDeleteSuccess = () => {
    fetchVaccines();
    setDeletingVaccine(null);
    setCurrentPage(1);
  };

  // ==================== FILTERING & SORTING ====================
  const filteredAndSortedVaccines = useMemo(() => {
    return vaccines
      .filter((vaccine) => {
        // Status filter
        if (statusFilter === 'active' && !vaccine.isActive) return false;
        if (statusFilter === 'inactive' && vaccine.isActive) return false;

        // Search filter
        const searchLower = searchTerm.toLowerCase();
        return (
          vaccine.name.toLowerCase().includes(searchLower) ||
          vaccine.description?.toLowerCase().includes(searchLower) ||
          vaccine.diseasesCovered?.some((d) => d.toLowerCase().includes(searchLower))
        );
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'name-asc':
            return a.name.localeCompare(b.name);
          case 'name-desc':
            return b.name.localeCompare(a.name);
          case 'created-desc':
            return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
          case 'created-asc':
            return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
          default:
            return 0;
        }
      });
  }, [vaccines, statusFilter, searchTerm, sortBy]);

  const paginatedVaccines = useMemo(() => {
    return filteredAndSortedVaccines.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredAndSortedVaccines, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sortBy]);

  // ==================== STATS ====================
  const stats = useMemo(() => {
    const total = vaccines.length;
    const active = vaccines.filter((v) => v.isActive).length;
    const inactive = vaccines.filter((v) => !v.isActive).length;

    return { total, active, inactive };
  }, [vaccines]);

  const totalPages = Math.ceil(filteredAndSortedVaccines.length / itemsPerPage);

  return (
    <div className="min-h-screen bg-slate-50 -m-6 lg:-m-4">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <MdVaccines className="text-blue-600 text-3xl" />
              Catálogo de Vacunas
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Gestiona el catálogo de vacunas disponibles para tu clínica
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Refresh */}
            <button
              onClick={fetchVaccines}
              disabled={isLoading}
              className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              title="Actualizar"
            >
              <FiRefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            {/* New Vaccine Button */}
            <PermissionGate require={{ permissions: ['vaccines:create'] }}>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
              >
                <MdAdd className="w-5 h-5" />
                <span className="hidden sm:inline">Nueva Vacuna</span>
              </button>
            </PermissionGate>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="flex flex-wrap gap-3 mt-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-sm">
            <FiSearch className="text-slate-500" />
            <span className="text-slate-600">Total:</span>
            <span className="font-semibold">{stats.total}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg text-sm">
            <FiCheck className="text-green-600" />
            <span className="text-green-700">Activas:</span>
            <span className="font-semibold text-green-700">{stats.active}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-sm">
            <span className="text-slate-600">−</span>
            <span className="text-slate-600">Inactivas:</span>
            <span className="font-semibold text-slate-600">{stats.inactive}</span>
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
                  placeholder="Buscar vacuna..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 border-none focus:outline-none focus:ring-0 text-sm"
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
                {(['all', 'active', 'inactive'] as StatusFilter[]).map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${
                      statusFilter === status
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {status === 'all' && 'Todas'}
                    {status === 'active' && 'Solo Activas'}
                    {status === 'inactive' && 'Solo Inactivas'}
                  </button>
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
                <option value="created-desc">Más recientes</option>
                <option value="created-asc">Más antiguos</option>
                <option value="name-asc">Nombre (A-Z)</option>
                <option value="name-desc">Nombre (Z-A)</option>
              </select>
            </div>
          </div>

          {/* Right Panel - Vaccines */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              {/* Header with view toggle */}
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <p className="text-sm text-slate-600">
                  {filteredAndSortedVaccines.length} vacunas encontradas
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
                      <path
                        fillRule="evenodd"
                        d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
                    <p className="text-slate-500">Cargando vacunas...</p>
                  </div>
                ) : filteredAndSortedVaccines.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                      <MdVaccines className="w-8 h-8 text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      {vaccines.length === 0
                        ? 'No hay vacunas en el catálogo'
                        : 'No hay vacunas que coincidan'}
                    </h3>
                    <p className="text-slate-600 mb-6">
                      {vaccines.length === 0
                        ? 'Comienza creando la primera vacuna en el catálogo'
                        : 'Ajusta los filtros o la búsqueda para encontrar lo que buscas'}
                    </p>
                    {vaccines.length === 0 && has('vaccines:create') && (
                      <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium flex items-center gap-2"
                      >
                        <MdAdd className="w-5 h-5" />
                        Crear Primera Vacuna
                      </button>
                    )}
                  </div>
                ) : viewMode === 'cards' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {paginatedVaccines.map((vaccine) => (
                      <VaccineCard
                        key={vaccine.id}
                        vaccine={vaccine}
                        onEdit={handleEditVaccine}
                        onDelete={handleDeleteVaccine}
                        onActivate={handleActivateVaccine}
                        onDeactivate={handleDeactivateVaccine}
                      />
                    ))}
                  </div>
                ) : (
                  <VaccinesTable
                    vaccines={paginatedVaccines}
                    onEdit={handleEditVaccine}
                    onDelete={handleDeleteVaccine}
                    onActivate={handleActivateVaccine}
                    onDeactivate={handleDeactivateVaccine}
                  />
                )}
              </div>

              {/* Pagination */}
              {filteredAndSortedVaccines.length > itemsPerPage && (
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

      {/* Modals */}
      <CreateVaccineModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      {editingVaccine && (
        <EditVaccineModal
          isOpen={isEditModalOpen}
          vaccine={editingVaccine}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingVaccine(null);
          }}
          onSuccess={handleEditSuccess}
        />
      )}

      {deletingVaccine && (
        <DeleteVaccineConfirmation
          isOpen={true}
          vaccine={deletingVaccine}
          onClose={() => setDeletingVaccine(null)}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </div>
  );
}

export default function VaccinesPage() {
  return (
    <PermissionGate require={{ permissions: ['vaccines:read'] }}>
      <VaccinesPageContent />
    </PermissionGate>
  );
}
