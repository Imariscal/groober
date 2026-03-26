'use client';

import { Vaccination, RecordVaccinationDto } from '@/types/ehr';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { MdAdd } from 'react-icons/md';
import { DataTable, FormModal, useCRUD, type TableColumn, type FormField } from '@/components/ehr/shared';
import { DeleteVaccinationConfirmation } from '@/components/ehr/modals/DeleteVaccinationConfirmation';
import { ehrApi } from '@/api/ehr-api';
import { useEffect, useState } from 'react';
import { useClinicTimezone } from '@/hooks/useClinicTimezone';
import { toUtcIsoFromClinicLocal } from '@/lib/datetime-tz';

interface VaccinationsTabProps {
  vaccinations: Vaccination[];
  overdueVaccinations: Vaccination[];
  petId: string;
  onDataUpdated: () => Promise<void>;
}

interface VaccineOption {
  id: string;
  name: string;
  boosterDays: number;
  isActive: boolean;
}

// ============================================================================
// VACCINATIONS TABLE COLUMNS
// ============================================================================
const VACCINATION_COLUMNS: TableColumn<Vaccination>[] = [
  {
    key: 'vaccineName',
    label: 'Vacuna',
    width: '180px',
  },
  {
    key: 'manufacturer',
    label: 'Fabricante',
    width: '140px',
  },
  {
    key: 'lotNumber',
    label: 'Número de Lote',
    width: '130px',
  },
  {
    key: 'vaccineBatch',
    label: 'Lote de Vacuna',
    width: '130px',
  },
  {
    key: 'administeredDate',
    label: 'Fecha de Administración',
    width: '140px',
    render: (date) => date ? format(new Date(date), 'd MMM yyyy', { locale: es }) : '-',
  },
  {
    key: 'nextDueDate',
    label: 'Próximo Refuerzos',
    width: '140px',
    render: (date) => date ? format(new Date(date), 'd MMM yyyy', { locale: es }) : '-',
  },
  {
    key: 'status',
    label: 'Estado',
    width: '100px',
    render: (status) => (
      <span
        className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
          status === 'ADMINISTERED'
            ? 'bg-green-100 text-green-800'
            : status === 'OVERDUE'
              ? 'bg-red-100 text-red-800'
              : status === 'PENDING'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-slate-100 text-slate-800'
        }`}
      >
        {status === 'ADMINISTERED' ? 'Administrada' : status === 'OVERDUE' ? 'Vencida' : status === 'PENDING' ? 'Pendiente' : 'Omitida'}
      </span>
    ),
  },
];

// ============================================================================
// VACCINATIONS FORM FIELDS (DYNAMIC)
// ============================================================================
const getVaccinationFormFields = (vaccineOptions: VaccineOption[], selectedVaccineId?: string): FormField[] => {
  const selectedVaccine = selectedVaccineId 
    ? vaccineOptions.find(v => v.id === selectedVaccineId)
    : null;

  const today = new Date().toISOString().split('T')[0];

  const baseFields: FormField[] = [
    {
      name: 'vaccineId',
      label: 'Seleccionar Vacuna',
      type: 'select',
      required: true,
      options: vaccineOptions.map(v => ({
        label: `${v.name} (Refuerzo: ${v.boosterDays}d)`,
        value: v.id
      })),
      placeholder: 'Selecciona una vacuna del catálogo',
    },
    {
      name: 'manufacturer',
      label: 'Fabricante',
      type: 'text',
      required: true,
      placeholder: 'ej: Zoetis, Merial',
    },
    {
      name: 'lotNumber',
      label: 'Número de Lote',
      type: 'text',
      required: true,
      placeholder: 'Número de lote del vial',
    },
    {
      name: 'vaccineBatch',
      label: 'Lote de Vacuna',
      type: 'text',
      required: true,
      placeholder: 'Identificador del lote',
    },
    {
      name: 'administeredDate',
      label: 'Fecha de Administración',
      type: 'date',
      required: true,
      defaultValue: today,
    },
    {
      name: 'expirationDate',
      label: 'Fecha de Expiración',
      type: 'date',
      required: true,
      placeholder: 'Obligatorio',
      min: today,
      validation: (value: any) => {
        if (!value) return null; // Required check is handled elsewhere
        const expirationDate = new Date(value);
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        if (expirationDate < todayDate) {
          return 'No puede ser menor a hoy';
        }
        return null;
      },
    },
  ];

  // Add readonly nextDueDate field if vaccine is selected
  if (selectedVaccine) {
    baseFields.push({
      name: 'nextDueDate',
      label: 'Próximo Refuerzo (Auto-calculado)',
      type: 'text',
      disabled: true,
      readonly: true,
      placeholder: `Se calculará automáticamente (+${selectedVaccine.boosterDays} días)`,
    });
  }

  baseFields.push(
    {
      name: 'adverseReactions',
      label: 'Reacciones Adversas',
      type: 'textarea',
      required: true,
      placeholder: 'Describe cualquier reacción observada',
    },
    {
      name: 'notes',
      label: 'Notas Adicionales',
      type: 'textarea',
      required: true,
      placeholder: 'Información adicional relevante',
    }
  );

  return baseFields;
};

export function VaccinationsTab({
  vaccinations,
  overdueVaccinations,
  petId,
  onDataUpdated,
}: VaccinationsTabProps) {
  // ========================================================================
  // STATE MANAGEMENT
  // ========================================================================
  const [vaccineOptions, setVaccineOptions] = useState<VaccineOption[]>([]);
  const [loadingVaccines, setLoadingVaccines] = useState(true);
  const [selectedVaccineId, setSelectedVaccineId] = useState<string | undefined>();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [vaccinationToDelete, setVaccinationToDelete] = useState<Vaccination | null>(null);

  // Load vaccines on component mount
  useEffect(() => {
    const loadVaccines = async () => {
      try {
        setLoadingVaccines(true);
        const vaccines = await ehrApi.getActiveVaccines();
        setVaccineOptions(vaccines);
      } catch (error) {
        console.error('Error loading vaccines:', error);
      } finally {
        setLoadingVaccines(false);
      }
    };

    loadVaccines();
  }, []);

  // ========================================================================
  // CRUD OPERATIONS
  // ========================================================================
  const clinicTimezone = useClinicTimezone();

  const {
    data: displayVaccinations,
    loading,
    isModalOpen,
    isEditing,
    selectedItem,
    error,
    handleNew,
    handleEdit,
    handleDelete,
    handleCloseModal,
    handleSubmit,
  } = useCRUD<Vaccination>({
    onCreate: async (formData) => {
      // nextDueDate will be auto-calculated on backend
      // Convert dates from clinic timezone to UTC ISO
      const administeredDate = formData.administeredDate 
        ? toUtcIsoFromClinicLocal(new Date(formData.administeredDate), clinicTimezone)
        : undefined;
      const expirationDate = formData.expirationDate
        ? toUtcIsoFromClinicLocal(new Date(formData.expirationDate), clinicTimezone)
        : undefined;

      const payload: any = {
        petId,
        vaccineId: formData.vaccineId,
        manufacturer: formData.manufacturer,
        lotNumber: formData.lotNumber,
        vaccineBatch: formData.vaccineBatch,
        administeredDate,
        expirationDate,
        adverseReactions: formData.adverseReactions,
        notes: formData.notes,
      };
      await ehrApi.recordVaccination(payload);
    },
    onUpdate: async (id, formData) => {
      // Convert dates from clinic timezone to UTC ISO
      const administeredDate = formData.administeredDate 
        ? toUtcIsoFromClinicLocal(new Date(formData.administeredDate), clinicTimezone)
        : undefined;
      const expirationDate = formData.expirationDate
        ? toUtcIsoFromClinicLocal(new Date(formData.expirationDate), clinicTimezone)
        : undefined;

      const payload: any = {
        vaccineId: formData.vaccineId,
        manufacturer: formData.manufacturer,
        lotNumber: formData.lotNumber,
        vaccineBatch: formData.vaccineBatch,
        administeredDate,
        expirationDate,
        adverseReactions: formData.adverseReactions,
        notes: formData.notes,
      };
      await ehrApi.updateVaccination(id, payload);
    },
    onDelete: async (id) => {
      await ehrApi.deleteVaccination(id);
    },
    onRefresh: async () => {
      await onDataUpdated();
    },
  });

  const displayData = displayVaccinations.length > 0 ? displayVaccinations : vaccinations;
  const overdue = displayData.filter((v) => overdueVaccinations.find((o) => o.id === v.id));
  const upToDate = displayData.filter((v) => !overdueVaccinations.find((o) => o.id === v.id));

  // Handle delete with confirmation modal
  const handleDeleteWithConfirmation = (vaccination: Vaccination) => {
    setVaccinationToDelete(vaccination);
    setIsDeleteModalOpen(true);
  };

  // Confirm delete from modal (bypasses handleDelete to avoid window.confirm)
  const handleConfirmDelete = async (vaccinationId: string) => {
    try {
      // Call delete directly without confirmación (modal es la confirmación)
      await ehrApi.deleteVaccination(vaccinationId);
      await onDataUpdated();
      setVaccinationToDelete(null);
      setIsDeleteModalOpen(false);
    } catch (error: any) {
      console.error('Error deleting vaccination:', error);
      throw error;
    }
  };

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-900">
            Vacunas ({vaccinations.length})
          </h3>
          <button
            onClick={() => {
              setSelectedVaccineId(undefined);
              handleNew();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
          >
            <MdAdd size={18} />
            Registrar Vacuna
          </button>
        </div>

        {/* Empty State */}
        {vaccinations.length === 0 && (
          <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-slate-500 mb-4">No hay vacunas registradas</p>
          </div>
        )}

        {/* Overdue Alert */}
        {overdue.length > 0 && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <p className="text-red-800 font-semibold">⚠️ {overdue.length} vacunas vencidas</p>
            <p className="text-red-700 text-sm mt-1">Requieren actualización inmediata</p>
          </div>
        )}

        {/* Overdue Vaccinations Table */}
        {overdue.length > 0 && (
          <div>
            <h4 className="font-semibold text-red-700 mb-3">Vacunas Vencidas</h4>
            <DataTable
              columns={VACCINATION_COLUMNS}
              data={overdue}
              onEdit={(item) => {
                setSelectedVaccineId(item.vaccineId);
                handleEdit(item);
              }}
              onDelete={(item) => handleDeleteWithConfirmation(item)}
              loading={loading}
            />
          </div>
        )}

        {/* Up to Date Vaccinations Table */}
        {upToDate.length > 0 && (
          <div>
            <h4 className="font-semibold text-green-700 mb-3">✓ Al Día ({upToDate.length})</h4>
            <DataTable
              columns={VACCINATION_COLUMNS}
              data={upToDate}
              onEdit={(item) => {
                setSelectedVaccineId(item.vaccineId);
                handleEdit(item);
              }}
              onDelete={(item) => handleDeleteWithConfirmation(item)}
              loading={loading}
            />
          </div>
        )}
      </div>

      {/* Form Modal */}
      <FormModal
        isOpen={isModalOpen}
        isEditing={isEditing}
        fields={getVaccinationFormFields(vaccineOptions, selectedVaccineId)}
        initialData={selectedItem}
        title={isEditing ? 'Editar Vacuna' : 'Registrar Vacuna'}
        onClose={() => {
          setSelectedVaccineId(undefined);
          handleCloseModal();
        }}
        onSubmit={(data) => {
          if (data.vaccineId) {
            setSelectedVaccineId(data.vaccineId);
          }
          return handleSubmit(data);
        }}
        loading={loading || loadingVaccines}
        error={error}
      />

      {/* Delete Vaccination Confirmation Modal */}
      <DeleteVaccinationConfirmation
        isOpen={isDeleteModalOpen}
        vaccination={vaccinationToDelete}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setVaccinationToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        loading={loading}
      />
    </>
  );
}