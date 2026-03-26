'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  MdAdd,
  MdMedicalInformation,
  MdEdit,
  MdDelete,
  MdCheckCircle,
} from 'react-icons/md';
import {
  FiFilter,
  FiSearch,
  FiRefreshCw,
  FiAlertCircle,
} from 'react-icons/fi';
import { useAuthStore } from '@/store/auth-store';
import { usePermissions } from '@/hooks/usePermissions';
import { useEhrStore } from '@/store/ehr-store';
import { MedicalVisit, MedicalVisitStatus, ReasonForVisit } from '@/types/ehr';
import { MedicalVisitCard } from '@/components/platform/MedicalVisitCard';
import { MedicalVisitsTable } from '@/components/platform/MedicalVisitsTable';
import { CreateMedicalVisitModal } from '@/components/CreateMedicalVisitModal';
import { EditMedicalVisitModal } from '@/components/EditMedicalVisitModal';
import { DeleteMedicalVisitConfirmation } from '@/components/DeleteMedicalVisitConfirmation';
import toast from 'react-hot-toast';

type SortOption = 'date-desc' | 'date-asc' | 'status-signed' | 'status-completed' | 'status-inprogress' | 'status-draft';
type StatusFilter = 'all' | 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'SIGNED';
type VisitTypeFilter = 'all' | ReasonForVisit;

/**
 * MedicalRecordsPage
 * Gestión de registros médicos con layout similar a Mascotas
 * - Sidebar izquierdo: filtros (Status, Tipo visita, Ordenar)
 * - Panel derecho: cards/table con registros
 */
export default function MedicalRecordsPage() {
  const { has } = usePermissions();
  const { medicalVisits, isLoadingVisits, fetchMedicalVisits } = useEhrStore();

  // ==================== STATE ====================
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [visitTypeFilter, setVisitTypeFilter] = useState<VisitTypeFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingVisit, setEditingVisit] = useState<MedicalVisit | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deletingVisit, setDeletingVisit] = useState<MedicalVisit | null>(null);

  // ==================== EFFECTS ====================
  useEffect(() => {
    fetchMedicalVisits();
  }, [fetchMedicalVisits]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, visitTypeFilter, sortBy]);

  // ==================== FILTERING & SORTING ====================
  const filteredAndSortedVisits = useMemo(() => {
    let filtered = [...medicalVisits];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (v) =>
          v.visit_type?.toLowerCase().includes(term) ||
          v.chief_complaint?.toLowerCase().includes(term) ||
          v.id.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((v) => v.status === statusFilter);
    }

    // Visit type filter
    if (visitTypeFilter !== 'all') {
      filtered = filtered.filter((v) => v.visit_type === visitTypeFilter);
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      const aDate = new Date(a.visit_date || 0).getTime();
      const bDate = new Date(b.visit_date || 0).getTime();

      switch (sortBy) {
        case 'date-desc':
          return bDate - aDate;
        case 'date-asc':
          return aDate - bDate;
        case 'status-signed':
          return (a.status === 'SIGNED' ? -1 : 1) - (b.status === 'SIGNED' ? -1 : 1);
        case 'status-completed':
          return (a.status === 'COMPLETED' ? -1 : 1) - (b.status === 'COMPLETED' ? -1 : 1);
        case 'status-inprogress':
          return (a.status === 'IN_PROGRESS' ? -1 : 1) - (b.status === 'IN_PROGRESS' ? -1 : 1);
        case 'status-draft':
          return (a.status === 'DRAFT' ? -1 : 1) - (b.status === 'DRAFT' ? -1 : 1);
        default:
          return 0;
      }
    });

    return filtered;
  }, [medicalVisits, searchTerm, statusFilter, visitTypeFilter, sortBy]);

  // Pagination
  const totalPages = useMemo(() => {
    return Math.ceil(filteredAndSortedVisits.length / itemsPerPage);
  }, [filteredAndSortedVisits.length, itemsPerPage]);

  const paginatedVisits = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedVisits.slice(startIndex, endIndex);
  }, [filteredAndSortedVisits, currentPage, itemsPerPage]);

  // ==================== STATS ====================
  const stats = useMemo(() => {
    return {
      total: medicalVisits.length,
      signed: medicalVisits.filter((v) => v.status === 'SIGNED').length,
      pending: medicalVisits.filter((v) => v.status === 'DRAFT' || v.status === 'IN_PROGRESS').length,
      completed: medicalVisits.filter((v) => v.status === 'COMPLETED').length,
    };
  }, [medicalVisits]);

  // ==================== HANDLERS ====================
  const handleCreateNew = useCallback(() => {
    if (has('medical_visits:create')) {
      setIsCreateModalOpen(true);
    } else {
      toast.error('No tienes permisos para crear registros médicos');
    }
  }, [has]);

  const handleRefresh = useCallback(async () => {
    await fetchMedicalVisits();
    toast.success('Registros médicos actualizados');
  }, [fetchMedicalVisits]);

  const handleEditVisit = useCallback((visit: MedicalVisit) => {
    setEditingVisit(visit);
    setIsEditModalOpen(true);
  }, []);

  const handleDeleteVisit = useCallback((visit: MedicalVisit) => {
    setDeletingVisit(visit);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 -m-6 lg:-m-4">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <MdMedicalInformation className="text-blue-600 text-3xl" />
              Expediente Médico Electrónico
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Administra los registros médicos de tus mascotas
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Refresh */}
            <button
              onClick={handleRefresh}
              disabled={isLoadingVisits}
              className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              title="Actualizar"
            >
              <FiRefreshCw className={`w-5 h-5 ${isLoadingVisits ? 'animate-spin' : ''}`} />
            </button>

            {/* New Visit Button */}
            <button
              onClick={handleCreateNew}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
            >
              <MdAdd className="w-5 h-5" />
              <span className="hidden sm:inline">Nueva Visita</span>
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="flex flex-wrap gap-3 mt-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-sm">
            <FiSearch className="text-slate-500" />
            <span className="text-slate-600">Total:</span>
            <span className="font-semibold">{stats.total}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-lg text-sm">
            <MdCheckCircle className="text-emerald-600" />
            <span className="text-emerald-700">Firmados:</span>
            <span className="font-semibold text-emerald-700">{stats.signed}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg text-sm">
            <MdCheckCircle className="text-green-600" />
            <span className="text-green-700">Completados:</span>
            <span className="font-semibold text-green-700">{stats.completed}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-50 rounded-lg text-sm">
            <FiAlertCircle className="text-yellow-600" />
            <span className="text-yellow-700">Pendientes:</span>
            <span className="font-semibold text-yellow-700">{stats.pending}</span>
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
                  placeholder="Buscar por motivo..."
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
                {(['all', 'DRAFT', 'IN_PROGRESS', 'COMPLETED', 'SIGNED'] as StatusFilter[]).map(
                  (status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${
                        statusFilter === status
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {status === 'all' && 'Todos'}
                      {status === 'DRAFT' && 'Borrador'}
                      {status === 'IN_PROGRESS' && 'En Progreso'}
                      {status === 'COMPLETED' && 'Completado'}
                      {status === 'SIGNED' && 'Firmado'}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Visit Type Filter */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <FiFilter className="text-slate-500" />
                <span className="text-sm font-medium text-slate-700">Tipo de Visita</span>
              </div>
              <div className="space-y-2">
                {(['all', 'CHECKUP', 'VACCINATION', 'DIAGNOSIS', 'FOLLOW_UP', 'OTHER'] as VisitTypeFilter[]).map(
                  (type) => (
                    <button
                      key={type}
                      onClick={() => setVisitTypeFilter(type)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${
                        visitTypeFilter === type
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {type === 'all' && 'Todos'}
                      {type === 'CHECKUP' && '🏥 Revisión'}
                      {type === 'VACCINATION' && '💉 Vacunación'}
                      {type === 'DIAGNOSIS' && '🔍 Diagnóstico'}
                      {type === 'FOLLOW_UP' && '📋 Seguimiento'}
                      {type === 'OTHER' && 'Otro'}
                    </button>
                  )
                )}
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
                <option value="date-desc">Más recientes</option>
                <option value="date-asc">Más antiguos</option>
                <option value="status-signed">Firmados primero</option>
                <option value="status-completed">Completados primero</option>
                <option value="status-inprogress">En progreso primero</option>
                <option value="status-draft">Borradores primero</option>
              </select>
            </div>
          </div>

          {/* Right Panel - Visits */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              {/* Header with view toggle */}
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <p className="text-sm text-slate-600">
                  {filteredAndSortedVisits.length} registros encontrados
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
                {isLoadingVisits ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
                    <p className="text-slate-500">Cargando registros médicos...</p>
                  </div>
                ) : filteredAndSortedVisits.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <FiAlertCircle className="w-12 h-12 text-slate-300 mb-3" />
                    <p className="text-slate-500">No hay registros médicos que mostrar</p>
                  </div>
                ) : viewMode === 'cards' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {paginatedVisits.map((visit) => (
                      <MedicalVisitCard
                        key={visit.id}
                        visit={visit}
                        onEdit={handleEditVisit}
                        onDelete={handleDeleteVisit}
                      />
                    ))}
                  </div>
                ) : (
                  <MedicalVisitsTable
                    visits={paginatedVisits}
                    onEdit={handleEditVisit}
                    onDelete={handleDeleteVisit}
                  />
                )}
              </div>

              {/* Pagination */}
              {filteredAndSortedVisits.length > itemsPerPage && (
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
      {isCreateModalOpen && (
        <CreateMedicalVisitModal
          isOpen={isCreateModalOpen}
          petId={useAuthStore.getState().selectedPetId || ''}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            setIsCreateModalOpen(false);
            fetchMedicalVisits();
          }}
        />
      )}

      {isEditModalOpen && editingVisit && (
        <EditMedicalVisitModal
          isOpen={isEditModalOpen}
          visit={editingVisit}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingVisit(null);
          }}
          onSuccess={() => {
            setIsEditModalOpen(false);
            setEditingVisit(null);
            fetchMedicalVisits();
          }}
        />
      )}

      {deletingVisit && (
        <DeleteMedicalVisitConfirmation
          visit={deletingVisit}
          isOpen={!!deletingVisit}
          onClose={() => setDeletingVisit(null)}
          onSuccess={() => {
            setDeletingVisit(null);
            fetchMedicalVisits();
          }}
        />
      )}
    </div>
  );
}
