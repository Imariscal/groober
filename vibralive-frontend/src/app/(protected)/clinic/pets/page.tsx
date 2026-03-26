'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { MdAdd, MdEdit, MdDelete, MdPets, MdSearch, MdRefresh } from 'react-icons/md';
import {
  FiFilter,
  FiSearch,
  FiRefreshCw,
  FiAlertCircle,
  FiCheck,
} from 'react-icons/fi';
import { PermissionGateRoute } from '@/components/PermissionGateRoute';
import { PermissionGate } from '@/components/PermissionGate';
import { usePermissions } from '@/hooks/usePermissions';
import { Pet } from '@/types';
import { petsConfig } from '@/config/petsConfig';
import { PetsTable } from '@/components/platform/PetsTable';
import { PetCard } from '@/components/platform/PetCard';
import { CreatePetModal } from '@/components/CreatePetModal';
import { EditPetModal } from '@/components/EditPetModal';
import { DeletePetConfirmation } from '@/components/DeletePetConfirmation';
import { clientsApi } from '@/lib/clients-api';import { useSearchModalTrigger } from '@/hooks/useSearchModalTrigger';import toast from 'react-hot-toast';

interface PetWithClient extends Pet {
  clientName?: string;
  clientId?: string;
}

type SortOption = 'name-asc' | 'name-desc' | 'species-asc' | 'species-desc' | 'created-desc' | 'created-asc';
type SpeciesFilter = 'all' | 'Perro' | 'Gato' | 'Otro';
type StatusFilter = 'all' | 'active' | 'sterilized';

/**
 * ClinicPetsPage
 * Manages clinic pets with improved layout similar to route-planning
 */
function PetsPageContent() {
  // ==================== HOOKS ====================
  const { has } = usePermissions();

  // ==================== STATE MANAGEMENT ====================
  const [pets, setPets] = useState<PetWithClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState<SpeciesFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPet, setEditingPet] = useState<PetWithClient | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deletingPet, setDeletingPet] = useState<PetWithClient | null>(null);
  const [selectedPet, setSelectedPet] = useState<PetWithClient | null>(null);

  // Estado para manejar mascota pendiente desde búsqueda global
  const [pendingPetId, setPendingPetId] = useState<string | null>(null);

  // ==================== API METHODS ====================
  const fetchPets = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const clientsResponse = await clientsApi.listClients(1, 1000);
      const allPets: PetWithClient[] = [];

      if (clientsResponse.data) {
        for (const client of clientsResponse.data) {
          if (client.pets && Array.isArray(client.pets)) {
            client.pets.forEach((pet) => {
              allPets.push({
                ...pet,
                clientName: client.name,
                clientId: client.id,
              });
            });
          }
        }
      }

      setPets(allPets);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar mascotas';
      setError(message);
      console.error('Error fetching pets:', err);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPets();
  }, [fetchPets]);

  // Hook para detectar mascotas desde búsqueda global
  useSearchModalTrigger({
    onOpenPet: (petId, clientId) => {
      // Guardar el petId pendiente, será procesado cuando los datos carguen
      setPendingPetId(petId);
    },
  });

  // Efecto para abrir el modal cuando los pets se carguen y haya una mascota pendiente
  useEffect(() => {
    if (pendingPetId && !isLoading && pets.length > 0) {
      const pet = pets.find((p) => p.id === pendingPetId);
      if (pet) {
        setEditingPet(pet);
        setIsEditModalOpen(true);
        setPendingPetId(null);
      }
    }
  }, [pendingPetId, isLoading, pets]);

  // ==================== HANDLERS ====================
  const handleCreateNew = useCallback(() => {
    setIsCreateModalOpen(true);
  }, []);

  const handleEditPet = useCallback((pet: PetWithClient) => {
    setEditingPet(pet);
    setIsEditModalOpen(true);
  }, []);

  const handleDeletePet = useCallback((pet: PetWithClient) => {
    setDeletingPet(pet);
  }, []);

  const handleCreateSuccess = useCallback(() => {
    fetchPets();
    setIsCreateModalOpen(false);
  }, [fetchPets]);

  const handleEditSuccess = useCallback(() => {
    fetchPets();
    setIsEditModalOpen(false);
    setEditingPet(null);
  }, [fetchPets]);

  const handleDeleteSuccess = useCallback(() => {
    fetchPets();
    setDeletingPet(null);
  }, [fetchPets]);

  // ==================== FILTERING & SORTING ====================
  const filteredAndSortedPets = useMemo(() => {
    let filtered = pets;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.species.toLowerCase().includes(term) ||
          p.breed?.toLowerCase().includes(term) ||
          p.clientName?.toLowerCase().includes(term)
      );
    }

    // Species filter
    if (speciesFilter !== 'all') {
      filtered = filtered.filter((p) => p.species === speciesFilter);
    }

    // Status filter
    if (statusFilter === 'sterilized') {
      filtered = filtered.filter((p) => p.is_sterilized === true);
    } else if (statusFilter === 'active') {
      filtered = filtered.filter((p) => p.is_sterilized === false);
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'species-asc':
          return a.species.localeCompare(b.species);
        case 'species-desc':
          return b.species.localeCompare(a.species);
        case 'created-desc':
          return (
            new Date(b.created_at || 0).getTime() -
            new Date(a.created_at || 0).getTime()
          );
        case 'created-asc':
          return (
            new Date(a.created_at || 0).getTime() -
            new Date(b.created_at || 0).getTime()
          );
        default:
          return 0;
      }
    });

    return filtered;
  }, [pets, searchTerm, speciesFilter, statusFilter, sortBy]);

  // Pagination
  const totalPages = useMemo(() => {
    return Math.ceil(filteredAndSortedPets.length / itemsPerPage);
  }, [filteredAndSortedPets.length, itemsPerPage]);

  const paginatedPets = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedPets.slice(startIndex, endIndex);
  }, [filteredAndSortedPets, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, speciesFilter, statusFilter, sortBy]);

  // ==================== STATS ====================
  const stats = useMemo(() => {
    const total = pets.length;
    const perros = pets.filter((p) => p.species === 'Perro').length;
    const gatos = pets.filter((p) => p.species === 'Gato').length;
    const sterilized = pets.filter((p) => p.is_sterilized === true).length;

    return { total, perros, gatos, sterilized };
  }, [pets]);

  if (!isLoading && error) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 -m-6 lg:-m-4">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <MdPets className="text-blue-600 text-3xl" />
              Gestión de Mascotas
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Administra las mascotas de tus clientes
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Refresh */}
            <button
              onClick={fetchPets}
              disabled={isLoading}
              className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              title="Actualizar"
            >
              <FiRefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            {/* New Pet Button */}
            <PermissionGate require={{ permissions: ['pets:create'] }}>
              <button
                onClick={handleCreateNew}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
              >
                <MdAdd className="w-5 h-5" />
                <span className="hidden sm:inline">Nueva Mascota</span>
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
          <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 rounded-lg text-sm">
            <MdPets className="text-orange-600" />
            <span className="text-orange-700">Perros:</span>
            <span className="font-semibold text-orange-700">{stats.perros}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-lg text-sm">
            <MdPets className="text-amber-600" />
            <span className="text-amber-700">Gatos:</span>
            <span className="font-semibold text-amber-700">{stats.gatos}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg text-sm">
            <FiCheck className="text-green-600" />
            <span className="text-green-700">Esterilizadas:</span>
            <span className="font-semibold text-green-700">{stats.sterilized}</span>
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
                  placeholder="Buscar mascota..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 border-none focus:outline-none focus:ring-0 text-sm"
                />
              </div>
            </div>

            {/* Species Filter */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <FiFilter className="text-slate-500" />
                <span className="text-sm font-medium text-slate-700">Especie</span>
              </div>
              <div className="space-y-2">
                {(['all', 'Perro', 'Gato', 'Otro'] as SpeciesFilter[]).map((species) => (
                  <button
                    key={species}
                    onClick={() => setSpeciesFilter(species)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${
                      speciesFilter === species
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {species === 'all' ? 'Todas' : species}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <FiFilter className="text-slate-500" />
                <span className="text-sm font-medium text-slate-700">Estado</span>
              </div>
              <div className="space-y-2">
                {(['all', 'active', 'sterilized'] as StatusFilter[]).map((status) => (
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
                    {status === 'active' && 'Sin esterilizar'}
                    {status === 'sterilized' && 'Esterilizadas'}
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
                <option value="species-asc">Especie (A-Z)</option>
                <option value="species-desc">Especie (Z-A)</option>
                <option value="created-desc">Más recientes</option>
                <option value="created-asc">Más antiguos</option>
              </select>
            </div>
          </div>

          {/* Right Panel - Pets */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              {/* Header with view toggle */}
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <p className="text-sm text-slate-600">
                  {filteredAndSortedPets.length} mascotas encontradas
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
                    <p className="text-slate-500">Cargando mascotas...</p>
                  </div>
                ) : filteredAndSortedPets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <FiAlertCircle className="w-12 h-12 text-slate-300 mb-3" />
                    <p className="text-slate-500">No hay mascotas que mostrar</p>
                  </div>
                ) : viewMode === 'cards' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {paginatedPets.map((pet) => (
                      <PetCard
                        key={pet.id}
                        pet={pet}
                        actions={[
                          ...(has('pets:update') ? [{
                            id: 'edit',
                            label: 'Editar',
                            icon: MdEdit,
                            onClick: () => handleEditPet(pet),
                          }] : []),
                          ...(has('pets:delete') ? [{
                            id: 'delete',
                            label: 'Eliminar',
                            icon: MdDelete,
                            onClick: () => handleDeletePet(pet),
                            variant: 'danger',
                          }] : []),
                        ]}
                        onActionClick={(action) => {
                          if (action.id === 'edit') handleEditPet(pet);
                          if (action.id === 'delete') handleDeletePet(pet);
                        }}
                        onEdit={handleEditPet}
                        onDelete={handleDeletePet}
                      />
                    ))}
                  </div>
                ) : (
                  <PetsTable
                    pets={paginatedPets}
                    onEdit={handleEditPet}
                    onDelete={handleDeletePet}
                  />
                )}
              </div>

              {/* Pagination */}
              {filteredAndSortedPets.length > itemsPerPage && (
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
      <CreatePetModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      {editingPet && (
        <EditPetModal
          isOpen={isEditModalOpen}
          pet={editingPet}
          clientId={editingPet.clientId || ''}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingPet(null);
          }}
          onSuccess={handleEditSuccess}
        />
      )}

      {deletingPet && (
        <DeletePetConfirmation
          isOpen={!!deletingPet}
          pet={deletingPet}
          clientId={deletingPet.clientId || ''}
          onClose={() => setDeletingPet(null)}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </div>
  );
}

export default function ClinicPetsPage() {
  return (
    <PermissionGateRoute permissions={['pets:read']}>
      <PetsPageContent />
    </PermissionGateRoute>
  );
}
