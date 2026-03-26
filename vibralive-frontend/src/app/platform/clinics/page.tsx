'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { MdAdd } from 'react-icons/md';
import { listClinics } from '@/lib/platformApi';
import { Clinic } from '@/types';
import { CreateClinicModal } from '@/components/CreateClinicModal';
import { useClinicTimezone } from '@/hooks/useClinicTimezone';
import { utcToZonedTime } from 'date-fns-tz';
import { AssignOwnerModal } from '@/components/AssignOwnerModal';
import { SuspendClinicModal } from '@/components/SuspendClinicModal';
import { AssignPlanModal } from '@/components/AssignPlanModal';
import { useAuthStore } from '@/store/auth-store';
import { EntityManagementPage, EntityAction } from '@/components/entity-kit';
import { ClinicCard } from '@/components/platform/ClinicCard';
import { ClinicTable } from '@/components/platform/ClinicTable';
import { PaginationControls } from '@/components/common/PaginationControls';
import { clinicsConfig } from '@/config/clinicsConfig';

type SortOption = 'name-asc' | 'name-desc' | 'created-desc' | 'created-asc' | 'status';

export default function ClinicsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const clinicTimezone = useClinicTimezone();

  // Data state
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Sort state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingClinic, setEditingClinic] = useState<Clinic | null>(null);
  const [isAssignOwnerOpen, setIsAssignOwnerOpen] = useState(false);
  const [isSuspendOpen, setIsSuspendOpen] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  const [isAssignPlanOpen, setIsAssignPlanOpen] = useState(false);

  // Auth check
  useEffect(() => {
    if (isAuthenticated && user?.role !== 'superadmin') {
      router.push('/unauthorized');
    }
  }, [isAuthenticated, user?.role, router]);

  // Fetch clinics
  const fetchClinics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await listClinics();
      setClinics(response);
    } catch (err) {
      console.error('Error fetching clinics:', err);
      setError('No se pudieron cargar las clínicas. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClinics();
  }, []);

  // Filter & Sort clinics
  const filteredAndSortedClinics = useMemo(() => {
    let filtered = clinics;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          c.phone.includes(term) ||
          c.city?.toLowerCase().includes(term) ||
          c.email?.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'created-desc': {
          const aDate = utcToZonedTime(new Date(a.createdAt || 0), clinicTimezone);
          const bDate = utcToZonedTime(new Date(b.createdAt || 0), clinicTimezone);
          return bDate.getTime() - aDate.getTime();
        }
        case 'created-asc': {
          const aDate = utcToZonedTime(new Date(a.createdAt || 0), clinicTimezone);
          const bDate = utcToZonedTime(new Date(b.createdAt || 0), clinicTimezone);
          return aDate.getTime() - bDate.getTime();
        }
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

    return filtered;
  }, [clinics, searchTerm, statusFilter, sortBy, clinicTimezone]);

  // Pagination logic
  const totalPages = useMemo(() => {
    return Math.ceil(filteredAndSortedClinics.length / itemsPerPage);
  }, [filteredAndSortedClinics.length, itemsPerPage]);

  const paginatedClinics = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedClinics.slice(startIndex, endIndex);
  }, [filteredAndSortedClinics, currentPage, itemsPerPage]);

  // Reset to first page when search/filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sortBy]);

  // Modal handlers
  const handleCreateSuccess = () => {
    fetchClinics();
    setIsCreateOpen(false);
    setEditingClinic(null);
  };

  const handleEditClinic = (clinic: Clinic) => {
    setEditingClinic(clinic);
    setIsCreateOpen(true);
  };

  const handleSuspendClinic = (clinic: Clinic) => {
    setSelectedClinic(clinic);
    setIsSuspendOpen(true);
  };

  const handleAssignOwner = (clinic: Clinic) => {
    setSelectedClinic(clinic);
    setIsAssignOwnerOpen(true);
  };

  const handleAssignPlan = (clinic: Clinic) => {
    setSelectedClinic(clinic);
    setIsAssignPlanOpen(true);
  };

  const handleSuspendSuccess = () => {
    fetchClinics();
    setIsSuspendOpen(false);
  };

  // Row actions for entity management
  const getRowActions = (clinic: Clinic): EntityAction[] => [
    {
      id: 'edit',
      label: 'Editar',
      onClick: () => handleEditClinic(clinic),
    },
    {
      id: 'suspend',
      label: clinic.status === 'ACTIVE' ? 'Suspender' : 'Activar',
      onClick: () => (clinic.status === 'ACTIVE' ? handleSuspendClinic(clinic) : null),
    },
    {
      id: 'assign-owner',
      label: 'Asignar Dueño',
      onClick: () => handleAssignOwner(clinic),
    },
    {
      id: 'assign-plan',
      label: 'Asignar Plan',
      onClick: () => handleAssignPlan(clinic),
    },
  ];

  // Build config with interactive handlers
  const pageConfig = {
    ...clinicsConfig,
    pageHeader: {
      ...clinicsConfig.pageHeader,
      primaryAction: {
        ...clinicsConfig.pageHeader.primaryAction,
        onClick: () => setIsCreateOpen(true),
        icon: <MdAdd />,
      },
    },
    // Custom renderer for clinic cards using ClinicCard component
    renderCard: (clinic: Clinic, actions: EntityAction[]) => (
      <ClinicCard
        key={clinic.id}
        clinic={clinic}
        actions={actions}
        onActionClick={(action) => {
          // Dispatch action to appropriate handler
          switch (action.id) {
            case 'edit':
              handleEditClinic(clinic);
              break;
            case 'suspend':
              handleSuspendClinic(clinic);
              break;
            case 'assign-owner':
              handleAssignOwner(clinic);
              break;
            case 'assign-plan':
              handleAssignPlan(clinic);
              break;
          }
        }}
      />
    ),
  };

  return (
    <>
      <EntityManagementPage
        config={pageConfig}
        data={clinics}
        filteredData={paginatedClinics}
        isLoading={isLoading}
        error={error}
        viewMode={viewMode}
        filters={{ search: searchTerm, status: statusFilter, sortBy }}
        searchTerm={searchTerm}
        onViewModeChange={setViewMode}
        onSearchChange={setSearchTerm}
        onFilterChange={(filters) => {
          setStatusFilter(filters.status || 'all');
          setSortBy((filters.sortBy as SortOption) || 'name-asc');
        }}
        onRefresh={fetchClinics}
        onCreateNew={() => setIsCreateOpen(true)}
        getRowActions={getRowActions}
        onRowActionClick={(action, clinic) => {
          switch (action.id) {
            case 'edit':
              handleEditClinic(clinic);
              break;
            case 'suspend':
              handleSuspendClinic(clinic);
              break;
            case 'assign-owner':
              handleAssignOwner(clinic);
              break;
            case 'assign-plan':
              handleAssignPlan(clinic);
              break;
          }
        }}
        onCardActionClick={(action, clinic) => {
          switch (action.id) {
            case 'edit':
              handleEditClinic(clinic);
              break;
            case 'suspend':
              handleSuspendClinic(clinic);
              break;
            case 'assign-owner':
              handleAssignOwner(clinic);
              break;
            case 'assign-plan':
              handleAssignPlan(clinic);
              break;
          }
        }}
        tableComponent={({ data, onEdit, onSuspend, onAssignOwner, onRefresh }: any) => (
          <ClinicTable
            clinics={data}
            onEdit={onEdit}
            onSuspend={onSuspend}
            onAssignOwner={onAssignOwner}
            onRefresh={onRefresh}
          />
        )}
      />

      {/* Pagination Controls */}
      {!isLoading && !error && filteredAndSortedClinics.length > 0 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalItems={filteredAndSortedClinics.length}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(newItemsPerPage) => {
            setItemsPerPage(newItemsPerPage);
            setCurrentPage(1);
          }}
        />
      )}

      {/* Modals - Same as before */}
      <CreateClinicModal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setEditingClinic(null);
        }}
        onSuccess={handleCreateSuccess}
        clinic={editingClinic || undefined}
      />

      {selectedClinic && (
        <>
          <AssignOwnerModal
            isOpen={isAssignOwnerOpen}
            clinicId={selectedClinic.id}
            clinicName={selectedClinic.name}
            onClose={() => setIsAssignOwnerOpen(false)}
            onSuccess={handleCreateSuccess}
          />

          <SuspendClinicModal
            isOpen={isSuspendOpen}
            clinicId={selectedClinic.id}
            clinicName={selectedClinic.name}
            onClose={() => setIsSuspendOpen(false)}
            onSuccess={handleSuspendSuccess}
          />

          <AssignPlanModal
            isOpen={isAssignPlanOpen}
            onClose={() => setIsAssignPlanOpen(false)}
            clinic={selectedClinic}
            onPlanAssigned={fetchClinics}
          />
        </>
      )}
    </>
  );
}
