'use client';

import { useState } from 'react';
import { Prescription, CreatePrescriptionDto } from '@/types/ehr';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MdAdd } from 'react-icons/md';
import { DataTable, FormModal, useCRUD, type TableColumn, type FormField } from '@/components/ehr/shared';
import { DeletePrescriptionConfirmation } from '@/components/ehr/modals/DeletePrescriptionConfirmation';
import { ehrApi } from '@/api/ehr-api';
import toast from 'react-hot-toast';

interface PrescriptionsTabProps {
  prescriptions: Prescription[];
  petId: string;
  medicalVisitId: string;
  currentMedicalVisitId?: string; // ✅ To determine if prescription can be edited/deleted
  onDataUpdated: () => Promise<void>;
}

// ============================================================================
// PRESCRIPTIONS TABLE COLUMNS
// ============================================================================
const FREQUENCY_LABELS: Record<string, string> = {
  ONCE_DAILY: 'Una vez al día',
  TWICE_DAILY: 'Dos veces al día',
  THREE_TIMES_DAILY: 'Tres veces al día',
  FOUR_TIMES_DAILY: 'Cuatro veces al día',
  EVERY_12_HOURS: 'Cada 12 horas',
  EVERY_8_HOURS: 'Cada 8 horas',
  AS_NEEDED: 'Según sea necesario',
};

const ROUTE_LABELS: Record<string, string> = {
  ORAL: 'Oral',
  INJECTION: 'Inyección',
  TOPICAL: 'Tópica',
  INHALATION: 'Inhalación',
  INTRAVENOUS: 'Intravenosa',
  INTRAMUSCULAR: 'Intramuscular',
};

const PRESCRIPTION_COLUMNS: TableColumn<Prescription>[] = [
  {
    key: 'medicationName',
    label: 'Medicamento',
    width: '180px',
  },
  {
    key: 'dosage',
    label: 'Dosis/Frecuencia',
    render: (dosage, row) => {
      const frequencyLabel = FREQUENCY_LABELS[row.frequency] || row.frequency;
      return `${dosage} • ${frequencyLabel}`;
    },
    width: '140px',
  },
  {
    key: 'route',
    label: 'Vía',
    width: '100px',
    render: (route) => {
      const routeLabel = ROUTE_LABELS[route] || route;
      return routeLabel;
    },
  },
  {
    key: 'durationDays',
    label: 'Duración',
    width: '100px',
    render: (durationDays) => durationDays ? `${durationDays} días` : '-',
  },
  {
    key: 'createdAt',
    label: 'Prescrita',
    width: '100px',
    render: (date) => format(new Date(date), 'd MMM', { locale: es }),
  },
  {
    key: 'status',
    label: 'Estado',
    width: '80px',
    render: (status) => (
      <span
        className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
          status === 'ACTIVE'
            ? 'bg-green-100 text-green-800'
            : status === 'COMPLETED'
              ? 'bg-slate-100 text-slate-800'
              : 'bg-red-100 text-red-800'
        }`}
      >
        {status === 'ACTIVE' ? 'Activa' : status === 'COMPLETED' ? 'Completada' : 'Cancelada'}
      </span>
    ),
  },
];

// ============================================================================
// PRESCRIPTIONS FORM FIELDS
// ============================================================================
const getFormFields = (): FormField[] => {
  const today = new Date().toISOString().split('T')[0];
  return [
  {
    name: 'medicationName',
    label: 'Medicamento',
    type: 'autocomplete',
    required: true,
    placeholder: 'Buscar o ingresar medicamento',
    autocompleteOnChange: async (value) => {
      const medications = await ehrApi.getUniqueMedications();
      return medications.filter((m) =>
        m.toLowerCase().includes(value.toLowerCase())
      );
    },
  },
  {
    name: 'dosage',
    label: 'Dosis',
    type: 'text',
    required: true,
    placeholder: 'ej: 500mg, 2ml',
  },
  {
    name: 'dosageUnit',
    label: 'Unidad',
    type: 'select',
    required: true,
    options: [
      { value: 'mg', label: 'mg (miligramos)' },
      { value: 'ml', label: 'ml (mililitros)' },
      { value: 'units', label: 'Unidades' },
      { value: 'g', label: 'g (gramos)' },
      { value: 'mcg', label: 'mcg (microgramos)' },
    ],
  },
  {
    name: 'frequency',
    label: 'Frecuencia',
    type: 'select',
    required: true,
    options: [
      { value: 'ONCE_DAILY', label: 'Una vez al día' },
      { value: 'TWICE_DAILY', label: 'Dos veces al día' },
      { value: 'THREE_TIMES_DAILY', label: 'Tres veces al día' },
      { value: 'FOUR_TIMES_DAILY', label: 'Cuatro veces al día' },
      { value: 'EVERY_12_HOURS', label: 'Cada 12 horas' },
      { value: 'EVERY_8_HOURS', label: 'Cada 8 horas' },
      { value: 'AS_NEEDED', label: 'Según sea necesario' },
    ],
  },
  {
    name: 'route',
    label: 'Vía de administración',
    type: 'select',
    required: true,
    options: [
      { value: 'ORAL', label: 'Oral' },
      { value: 'INJECTION', label: 'Inyección' },
      { value: 'TOPICAL', label: 'Tópica' },
      { value: 'INHALATION', label: 'Inhalación' },
      { value: 'INTRAVENOUS', label: 'Intravenosa' },
      { value: 'INTRAMUSCULAR', label: 'Intramuscular' },
    ],
  },
  {
    name: 'startDate',
    label: 'Fecha de inicio',
    type: 'date',
    required: true,
    defaultValue: today,
  },
  {
    name: 'durationDays',
    label: 'Duración (días)',
    type: 'number',
    required: true,
    placeholder: '7',
    defaultValue: 7,
  },
  {
    name: 'quantity',
    label: 'Cantidad a dispensar',
    type: 'number',
    required: true,
    placeholder: 'Se calcula automáticamente',
    defaultValue: 0,
  },
  {
    name: 'instructions',
    label: 'Instrucciones especiales',
    type: 'textarea',
    required: true,
    placeholder: 'ej: Tomar con comida, No mezclar con...',
  },
  {
    name: 'refillsAllowed',
    label: 'Recetas permitidas',
    type: 'number',
    placeholder: '0',
  },
  ];
};

export function PrescriptionsTab({
  prescriptions,
  petId,
  medicalVisitId,
  currentMedicalVisitId,
  onDataUpdated,
}: PrescriptionsTabProps) {
  // ========================================================================
  // STATE
  // ========================================================================
  const [mostUsedMedications, setMostUsedMedications] = useState<
    Array<{ medicationName: string; usageCount: number }>
  >([]);
  const [prescriptionToDelete, setPrescriptionToDelete] = useState<Prescription | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ========================================================================
  // HELPERS
  // ========================================================================
  const getFrequencyPerDay = (frequency: string): number => {
    switch (frequency) {
      case 'ONCE_DAILY':
        return 1;
      case 'TWICE_DAILY':
        return 2;
      case 'THREE_TIMES_DAILY':
        return 3;
      case 'FOUR_TIMES_DAILY':
        return 4;
      case 'EVERY_12_HOURS':
        return 2;
      case 'EVERY_8_HOURS':
        return 3;
      default:
        return 0;
    }
  };

  // ========================================================================
  // CRUD OPERATIONS
  // ========================================================================
  const {
    data: displayPrescriptions,
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
  } = useCRUD<Prescription>({
    onCreate: async (formData) => {
      const payload: CreatePrescriptionDto = {
        medicalVisitId,
        petId,
        ...(formData as any),
      };
      
      // Auto-calculate quantity based on durationDays × frequency
      if (formData.durationDays && formData.frequency) {
        const frequencyPerDay = getFrequencyPerDay(formData.frequency);
        if (frequencyPerDay > 0) {
          payload.quantity = formData.durationDays * frequencyPerDay;
        }
      }
      
      // Auto-calculate endDate based on startDate + durationDays
      if (formData.startDate && formData.durationDays) {
        const startDate = new Date(formData.startDate);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + formData.durationDays);
        payload.endDate = endDate.toISOString().split('T')[0];
      }
      
      await ehrApi.createPrescription(medicalVisitId, payload);
    },
    onUpdate: async (id, formData) => {
      const payload: Partial<CreatePrescriptionDto> = formData as any;
      
      // Auto-calculate quantity based on durationDays × frequency
      if (formData.durationDays && formData.frequency) {
        const frequencyPerDay = getFrequencyPerDay(formData.frequency);
        if (frequencyPerDay > 0) {
          payload.quantity = formData.durationDays * frequencyPerDay;
        }
      }
      
      // Auto-calculate endDate based on startDate + durationDays
      if (formData.startDate && formData.durationDays) {
        const startDate = new Date(formData.startDate);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + formData.durationDays);
        payload.endDate = endDate.toISOString().split('T')[0];
      }
      
      await ehrApi.updatePrescription(id, payload);
    },
    onDelete: async (id) => {
      await ehrApi.deletePrescription(id);
    },
    onRefresh: async () => {
      // Load only active prescriptions for the tab display
      const activePrescriptions = prescriptions.filter((p) => p.status === 'ACTIVE');
      // The parent component will refresh the data through onDataUpdated
      await onDataUpdated();
    },
  });

  // Use original prescriptions for initial display, CRUD hook data for edited state
  const activePrescriptions = (displayPrescriptions.length > 0 ? displayPrescriptions : prescriptions).filter(
    (p) => p.status === 'ACTIVE'
  );
  const completedPrescriptions = (displayPrescriptions.length > 0 ? displayPrescriptions : prescriptions).filter(
    (p) => p.status === 'COMPLETED'
  );

  // ========================================================================
  // HANDLERS
  // ========================================================================
  const handleOpenPrescriptionModal = async () => {
    // Load most used medications before opening modal
    const medications = await ehrApi.getMostUsedMedications(10);
    setMostUsedMedications(medications);
    handleNew();
  };

  const handleEditPrescription = async (prescription: Prescription) => {
    // ✅ Only allow editing prescriptions from current medical visit
    if (currentMedicalVisitId && prescription.medicalVisitId !== currentMedicalVisitId) {
      toast.error('No puedes editar prescripciones de citas anteriores');
      return;
    }
    
    // Load most used medications before opening edit modal
    const medications = await ehrApi.getMostUsedMedications(10);
    setMostUsedMedications(medications);
    handleEdit(prescription);
  };

  const handleDeletePrescription = (prescription: Prescription) => {
    // ✅ Only allow deleting prescriptions from current medical visit
    if (currentMedicalVisitId && prescription.medicalVisitId !== currentMedicalVisitId) {
      toast.error('No puedes eliminar prescripciones de citas anteriores');
      return;
    }
    
    // Open confirmation modal for deletion
    setPrescriptionToDelete(prescription);
  };

  const handleConfirmDelete = async (prescriptionId: string) => {
    // Eliminar directamente sin window.confirm (el modal ya es la confirmación)
    try {
      setDeleteLoading(true);
      await ehrApi.deletePrescription(prescriptionId);
      setPrescriptionToDelete(null);
      toast.success('Prescripción eliminada exitosamente');
      await onDataUpdated(); // Refresh data
    } catch (error: any) {
      console.error('Error deleting prescription:', error);
      toast.error(error.message || 'Error al eliminar prescripción');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-900">
            Prescripciones ({prescriptions.length})
          </h3>
          <button
            onClick={handleOpenPrescriptionModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
          >
            <MdAdd size={18} />
            Nueva Prescripción
          </button>
        </div>

        {/* Empty State */}
        {prescriptions.length === 0 && (
          <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-slate-500 mb-4">No hay prescripciones registradas</p>
          </div>
        )}

        {/* Active Prescriptions Table */}
        {activePrescriptions.length > 0 && (
          <DataTable
            columns={PRESCRIPTION_COLUMNS}
            data={activePrescriptions}
            onEdit={handleEditPrescription}
            onDelete={handleDeletePrescription}
            loading={loading}
          />
        )}

        {/* Completed Prescriptions Table */}
        {completedPrescriptions.length > 0 && (
          <div>
            <h4 className="font-semibold text-slate-900 mb-3 text-slate-500">
              Historial ({completedPrescriptions.length})
            </h4>
            <DataTable
              columns={PRESCRIPTION_COLUMNS}
              data={completedPrescriptions}
              onEdit={handleEditPrescription}
              onDelete={handleDeletePrescription}
              loading={loading}
            />
          </div>
        )}
      </div>

      {/* Form Modal */}
      <FormModal
        isOpen={isModalOpen}
        isEditing={isEditing}
        fields={getFormFields()}
        initialData={selectedItem}
        title={isEditing ? 'Editar Prescripción' : 'Nueva Prescripción'}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        loading={loading}
        error={error}
        sidePanel={{
          title: '📋 Medicamentos Recientes',
          items: mostUsedMedications.map((med) => ({
            name: med.medicationName,
            count: med.usageCount,
          })),
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeletePrescriptionConfirmation
        isOpen={prescriptionToDelete !== null}
        prescription={prescriptionToDelete}
        onClose={() => setPrescriptionToDelete(null)}
        onConfirm={handleConfirmDelete}
        loading={deleteLoading}
      />
    </>
  );
}
