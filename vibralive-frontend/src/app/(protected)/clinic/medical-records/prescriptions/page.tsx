'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  MdAdd,
  MdLocalPharmacy,
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
import { Prescription } from '@/types/ehr';
import { PrescriptionCard } from '@/components/platform/PrescriptionCard';
import { PrescriptionsTable } from '@/components/platform/PrescriptionsTable';
import { CreatePrescriptionModal } from '@/components/CreatePrescriptionModal';
import { EditPrescriptionModal } from '@/components/EditPrescriptionModal';
import { DeletePrescriptionConfirmation } from '@/components/ehr/modals/DeletePrescriptionConfirmation';
import toast from 'react-hot-toast';

type ViewMode = 'cards' | 'table';
type StatusFilterType = 'all' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

/**
 * PrescriptionsPage
 * Gestión de prescripciones con layout similar a Expediente Médico
 * - Sidebar: filtros (buscar, estado)
 * - Panel derecho: cards/table con prescripciones
 */
export default function PrescriptionsPage() {
  const { has } = usePermissions();
  const { petPrescriptions: prescriptions, isLoadingPetData: isLoading, fetchActivePrescriptions } = useEhrStore();

  // ==================== STATE ====================
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPrescription, setEditingPrescription] = useState<Prescription | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deletingPrescription, setDeletingPrescription] = useState<Prescription | null>(null);

  // ==================== EFFECTS ====================
  useEffect(() => {
    const petId = useAuthStore.getState().selectedPetId;
    if (petId) {
      fetchActivePrescriptions(petId);
    }
  }, [fetchActivePrescriptions]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // ==================== FILTERING & SORTING ====================
  const filteredPrescriptions = useMemo(() => {
    let filtered = [...prescriptions];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.medicationName?.toLowerCase().includes(term) ||
          p.dosage?.toLowerCase().includes(term) ||
          p.instructions?.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }

    return filtered;
  }, [prescriptions, searchTerm, statusFilter]);

  // Pagination
  const totalPages = useMemo(() => {
    return Math.ceil(filteredPrescriptions.length / itemsPerPage);
  }, [filteredPrescriptions.length, itemsPerPage]);

  const paginatedPrescriptions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredPrescriptions.slice(startIndex, endIndex);
  }, [filteredPrescriptions, currentPage, itemsPerPage]);

  // ==================== STATS ====================
  const stats = useMemo(() => {
    return {
      total: prescriptions.length,
      active: prescriptions.filter((p) => p.status === 'ACTIVE').length,
      completed: prescriptions.filter((p) => p.status === 'COMPLETED').length,
      cancelled: prescriptions.filter((p) => p.status === 'CANCELLED').length,
    };
  }, [prescriptions]);

  // ==================== HANDLERS ====================
  const handleCreateNew = useCallback(() => {
    if (has('prescriptions:create')) {
      setIsCreateModalOpen(true);
    } else {
      toast.error('No tienes permisos para crear prescripciones');
    }
  }, [has]);

  const handleRefresh = useCallback(async () => {
    const petId = useAuthStore.getState().selectedPetId;
    if (petId) {
      await fetchActivePrescriptions(petId);
      toast.success('Prescripciones actualizadas');
    }
  }, [fetchActivePrescriptions]);

  const handleEditPrescription = useCallback((prescription: Prescription) => {
    setEditingPrescription(prescription);
    setIsEditModalOpen(true);
  }, []);

  const handleDeletePrescription = useCallback((prescription: Prescription) => {
    setDeletingPrescription(prescription);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 -m-6 lg:-m-4">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <MdLocalPharmacy className="text-blue-600 text-3xl" />
              Prescripciones
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Gestiona los medicamentos prescritos para tus mascotas
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Refresh */}
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              title="Actualizar"
            >
              <FiRefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            {/* New Prescription Button */}
            <button
              onClick={handleCreateNew}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
            >
              <MdAdd className="w-5 h-5" />
              <span className="hidden sm:inline">Nueva Prescripción</span>
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
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg text-sm">
            <MdCheckCircle className="text-blue-600" />
            <span className="text-blue-700">Activos:</span>
            <span className="font-semibold text-blue-700">{stats.active}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg text-sm">
            <MdCheckCircle className="text-green-600" />
            <span className="text-green-700">Completados:</span>
            <span className="font-semibold text-green-700">{stats.completed}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 rounded-lg text-sm">
            <FiAlertCircle className="text-red-600" />
            <span className="text-red-700">Cancelados:</span>
            <span className="font-semibold text-red-700">{stats.cancelled}</span>
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
                  placeholder="Buscar medicamento..."
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
                {(['all', 'ACTIVE', 'COMPLETED', 'CANCELLED'] as StatusFilterType[]).map(
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
                      {status === 'ACTIVE' && 'Activos'}
                      {status === 'COMPLETED' && 'Completados'}
                      {status === 'CANCELLED' && 'Cancelados'}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Prescriptions */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              {/* Header with view toggle */}
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <p className="text-sm text-slate-600">
                  {filteredPrescriptions.length} prescripciones encontradas
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
                    <p className="text-slate-500">Cargando prescripciones...</p>
                  </div>
                ) : filteredPrescriptions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <FiAlertCircle className="w-12 h-12 text-slate-300 mb-3" />
                    <p className="text-slate-500">No hay prescripciones que mostrar</p>
                  </div>
                ) : viewMode === 'cards' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {paginatedPrescriptions.map((prescription) => (
                      <PrescriptionCard
                        key={prescription.id}
                        prescription={prescription}
                        onEdit={handleEditPrescription}
                        onDelete={handleDeletePrescription}
                      />
                    ))}
                  </div>
                ) : (
                  <PrescriptionsTable
                    prescriptions={paginatedPrescriptions}
                    isLoading={isLoading}
                    onEdit={handleEditPrescription}
                    onDelete={handleDeletePrescription}
                  />
                )}
              </div>

              {/* Pagination */}
              {filteredPrescriptions.length > itemsPerPage && (
                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div className="text-sm text-slate-600">
                    Página {currentPage} de {totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm hover:bg-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 rounded-lg text-sm transition ${
                          currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'border border-slate-300 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm hover:bg-white transition disabled:opacity-50 disabled:cursor-not-allowed"
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
        <CreatePrescriptionModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            setIsCreateModalOpen(false);
            setCurrentPage(1);
          }}
          petId={useAuthStore.getState().selectedPetId || ''}
        />
      )}
      {isEditModalOpen && (
        <EditPrescriptionModal
          isOpen={isEditModalOpen}
          prescription={editingPrescription || undefined}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingPrescription(null);
          }}
          onSuccess={() => {
            setIsEditModalOpen(false);
            setEditingPrescription(null);
            setCurrentPage(1);
          }}
        />
      )}
      {deletingPrescription && (
        <DeletePrescriptionConfirmation
          isOpen={!!deletingPrescription}
          prescription={deletingPrescription || undefined}
          onClose={() => setDeletingPrescription(null)}
          onSuccess={() => {
            setDeletingPrescription(null);
            setCurrentPage(1);
          }}
        />
      )}
    </div>
  );
}
