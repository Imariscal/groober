'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { MdAdd, MdEdit, MdBlock, MdDelete, MdPerson } from 'react-icons/md';
import {
  FiFilter,
  FiSearch,
  FiRefreshCw,
  FiAlertCircle,
  FiCheck,
} from 'react-icons/fi';
import { Client } from '@/types';
import { ClientCard } from '@/components/platform/ClientCard';
import { ClientTable } from '@/components/platform/ClientTable';
import { clientsConfig } from '@/config/clientsConfig';
import { ClientFormModal } from '@/components/ClientFormModal';
import { DeleteClientConfirmModal } from '@/components/DeleteClientConfirmModal';
import { HardDeleteClientModal } from '@/components/HardDeleteClientModal';
import { clientsApi } from '@/lib/clients-api';
import { useSearchModalTrigger } from '@/hooks/useSearchModalTrigger';
import { PermissionGate } from '@/components/PermissionGate';
import { usePermissions } from '@/hooks/usePermissions';

type SortOption = 'name-asc' | 'name-desc' | 'created-desc' | 'created-asc';
type StatusFilter = 'all' | 'active' | 'inactive';

export default function ClinicClientsPage() {
  // ==================== HOOKS ====================
  const { has } = usePermissions();

  // ==================== STATE MANAGEMENT ====================
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deactivateConfirmClient, setDeactivateConfirmClient] = useState<Client | null>(null);
  const [hardDeleteConfirmClient, setHardDeleteConfirmClient] = useState<Client | null>(null);

  // Estado para manejar cliente pendiente desde búsqueda global
  const [pendingClientId, setPendingClientId] = useState<string | null>(null);

  // ==================== API METHODS ====================

  /**
   * Cargar clientes desde el servidor
   */
  const fetchClients = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await clientsApi.listClients();
      setClients(response.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar clientes';
      setError(message);
      console.error('Error fetching clients:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Cargar clientes al montar
  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Hook para detectar modales desde búsqueda global
  useSearchModalTrigger({
    onOpenClient: (clientId) => {
      // Guardar el clientId pendiente, será procesado cuando los datos carguen
      setPendingClientId(clientId);
    },
  });

  // Efecto para abrir el modal cuando los clientes se carguen y haya un cliente pendiente
  useEffect(() => {
    if (pendingClientId && !isLoading && clients.length > 0) {
      const client = clients.find((c) => c.id === pendingClientId);
      if (client) {
        setEditingClient(client);
        setIsFormModalOpen(true);
        setPendingClientId(null);
      }
    }
  }, [pendingClientId, isLoading, clients]);

  // ==================== WORKFLOW HANDLERS ====================

  /**
   * Abrir modal para crear nuevo cliente
   */
  const handleCreateNew = useCallback(() => {
    setEditingClient(null);
    setIsFormModalOpen(true);
  }, []);

  /**
   * Abrir modal para editar cliente
   */
  const handleEditClient = useCallback((client: Client) => {
    setEditingClient(client);
    setIsFormModalOpen(true);
  }, []);

  /**
   * Abrir modal de confirmación para desactivar
   */
  const handleDeactivateClient = useCallback((client: Client) => {
    setDeactivateConfirmClient(client);
  }, []);

  /**
   * Abrir modal de confirmación para eliminar permanentemente
   * TODO: Añadir validación RBAC antes de mostrar
   */
  const handleHardDeleteClient = useCallback((client: Client) => {
    setHardDeleteConfirmClient(client);
  }, []);

  /**
   * Callback cuando el modal de formulario se cierra exitosamente
   */
  const handleFormModalSuccess = useCallback(() => {
    fetchClients();
  }, [fetchClients]);

  /**
   * Callback cuando se confirma eliminación
   */
  const handleDeleteConfirmed = useCallback(() => {
    fetchClients();
  }, [fetchClients]);

  // ==================== FILTERING & SORTING ====================
  const filteredAndSortedClients = useMemo(() => {
    let filtered = clients;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          c.phone.includes(term) ||
          c.address?.toLowerCase().includes(term) ||
          c.email?.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (statusFilter === 'active') {
      filtered = filtered.filter((c) => !c.deleted_at);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter((c) => c.deleted_at);
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'created-desc':
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        case 'created-asc':
          return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [clients, searchTerm, statusFilter, sortBy]);

  // Pagination
  const totalPages = useMemo(() => {
    return Math.ceil(filteredAndSortedClients.length / itemsPerPage);
  }, [filteredAndSortedClients.length, itemsPerPage]);

  const paginatedClients = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedClients.slice(startIndex, endIndex);
  }, [filteredAndSortedClients, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sortBy]);

  // ==================== ENTITY ACTIONS ====================

  /**
   * Obtener acciones disponibles para un cliente
   */
  const getRowActions = useCallback((client: Client) => {
    const allActions = [
      ...(has('clients:update') ? [{
        id: 'edit',
        label: 'Editar',
        icon: MdEdit,
        onClick: () => handleEditClient(client),
      }] : []),
      ...(has('clients:update') ? [{
        id: 'deactivate',
        label: 'Desactivar',
        icon: MdBlock,
        onClick: () => handleDeactivateClient(client),
        variant: 'secondary',
      }] : []),
      ...(has('clients:delete') ? [{
        id: 'delete',
        label: 'Eliminar',
        icon: MdDelete,
        onClick: () => handleHardDeleteClient(client),
        variant: 'danger',
      }] : []),
    ];
    return allActions;
  }, [has, handleEditClient, handleDeactivateClient, handleHardDeleteClient]);

  // ==================== STATS ====================
  const stats = useMemo(() => {
    const total = clients.length;
    const active = clients.filter((c) => !c.deleted_at).length;
    const inactive = clients.filter((c) => c.deleted_at).length;
    const withPets = clients.filter((c) => c.pets && c.pets.length > 0).length;

    return { total, active, inactive, withPets };
  }, [clients]);

  if (!isLoading && error) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        {error}
      </div>
    );
  }

  // ==================== RENDER ====================

  return (
    <div className="min-h-screen bg-slate-50 -m-6 lg:-m-4">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <MdPerson className="text-blue-600 text-3xl" />
              Gestión de Clientes
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Administra los clientes de tu clínica
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Refresh */}
            <button
              onClick={fetchClients}
              disabled={isLoading}
              className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              title="Actualizar"
            >
              <FiRefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            {/* New Client Button */}
            <PermissionGate require={{ permissions: ['clients:create'] }}>
              <button
                onClick={handleCreateNew}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
              >
                <MdAdd className="w-5 h-5" />
                <span className="hidden sm:inline">Nuevo Cliente</span>
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
            <span className="text-green-700">Activos:</span>
            <span className="font-semibold text-green-700">{stats.active}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-sm">
            <FiAlertCircle className="text-slate-600" />
            <span className="text-slate-700">Inactivos:</span>
            <span className="font-semibold text-slate-700">{stats.inactive}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg text-sm">
            <MdPerson className="text-blue-600" />
            <span className="text-blue-700">Con mascotas:</span>
            <span className="font-semibold text-blue-700">{stats.withPets}</span>
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
                  placeholder="Buscar cliente..."
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
                    {status === 'all' && 'Todos'}
                    {status === 'active' && 'Activos'}
                    {status === 'inactive' && 'Inactivos'}
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
                <option value="name-asc">Nombre (A-Z)</option>
                <option value="name-desc">Nombre (Z-A)</option>
                <option value="created-desc">Más recientes</option>
                <option value="created-asc">Más antiguos</option>
              </select>
            </div>
          </div>

          {/* Right Panel - Clients */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              {/* Header with view toggle */}
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <p className="text-sm text-slate-600">
                  {filteredAndSortedClients.length} clientes encontrados
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
                    <p className="text-slate-500">Cargando clientes...</p>
                  </div>
                ) : filteredAndSortedClients.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <FiAlertCircle className="w-12 h-12 text-slate-300 mb-3" />
                    <p className="text-slate-500">No hay clientes que mostrar</p>
                  </div>
                ) : viewMode === 'cards' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {paginatedClients.map((client) => (
                      <ClientCard
                        key={client.id}
                        client={client}
                        actions={getRowActions(client)}
                        onActionClick={(action) => {
                          if (action.id === 'edit') handleEditClient(client);
                          if (action.id === 'deactivate') handleDeactivateClient(client);
                          if (action.id === 'delete') handleHardDeleteClient(client);
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <ClientTable
                    clients={paginatedClients}
                    onEdit={handleEditClient}
                    onDeactivate={handleDeactivateClient}
                    onDelete={handleHardDeleteClient}
                  />
                )}
              </div>

              {/* Pagination */}
              {filteredAndSortedClients.length > itemsPerPage && (
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
      <ClientFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingClient(null);
        }}
        onSuccess={handleFormModalSuccess}
        client={editingClient || undefined}
      />

      <DeleteClientConfirmModal
        isOpen={!!deactivateConfirmClient}
        client={deactivateConfirmClient}
        onClose={() => setDeactivateConfirmClient(null)}
        onSuccess={handleDeleteConfirmed}
      />

      <HardDeleteClientModal
        isOpen={!!hardDeleteConfirmClient}
        client={hardDeleteConfirmClient}
        onClose={() => setHardDeleteConfirmClient(null)}
        onSuccess={handleDeleteConfirmed}
      />
    </div>
  );
}
