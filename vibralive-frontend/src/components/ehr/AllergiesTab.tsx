'use client';

import { MedicationAllergy, RecordAllergyDto } from '@/types/ehr';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MdAdd, MdWarning, MdDangerous, MdError } from 'react-icons/md';
import { DataTable, FormModal, useCRUD, type TableColumn, type FormField } from '@/components/ehr/shared';
import { DeleteAllergyConfirmation } from '@/components/ehr/modals/DeleteAllergyConfirmation';
import { ehrApi } from '@/api/ehr-api';
import { useState } from 'react';

interface AllergiesTabProps {
  allergies: MedicationAllergy[];
  petId: string;
  onDataUpdated: () => Promise<void>;
}

// ============================================================================
// ALLERGIES TABLE COLUMNS
// ============================================================================
const ALLERGIES_COLUMNS: TableColumn<MedicationAllergy>[] = [
  {
    key: 'medicationName',
    label: 'Medicamento/Sustancia',
    width: '200px',
  },
  {
    key: 'severity',
    label: 'Gravedad',
    width: '120px',
    render: (severity) => {
      const severityIcons: Record<string, React.ReactNode> = {
        SEVERE: <MdDangerous className="inline text-red-600 mr-1" size={18} />,
        MODERATE: <MdWarning className="inline text-amber-600 mr-1" size={18} />,
        MILD: <MdError className="inline text-blue-600 mr-1" size={18} />,
      };
      const severityLabels: Record<string, string> = {
        SEVERE: 'Severa',
        MODERATE: 'Moderada',
        MILD: 'Leve',
      };
      return (
        <span>
          {severityIcons[severity] || null}
          {severityLabels[severity] || severity}
        </span>
      );
    },
  },
  {
    key: 'reaction',
    label: 'Reacción/Síntomas',
    width: '250px',
  },
  {
    key: 'documentedDate',
    label: 'Fecha Documentada',
    width: '120px',
    render: (date) => format(new Date(date), 'd MMM yyyy', { locale: es }),
  },
];

// ============================================================================
// ALLERGIES FORM FIELDS (IMPROVED UX/UI)
// ============================================================================
// Get today's date in YYYY-MM-DD format
const getTodayDateString = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

const ALLERGIES_FORM_FIELDS: FormField[] = [
  // === Identificación ===
  {
    name: 'allergen',
    label: 'Medicamento/Sustancia *',
    type: 'text',
    required: true,
    placeholder: 'ej: Penicilina, Pollo, Mariscos',
    width: '100%',
  },
  {
    name: 'allergenCode',
    label: 'Código del Medicamento',
    type: 'text',
    placeholder: 'Código interno o SKU (opcional)',
    width: '100%',
  },
  // === Gravedad y Fecha (lado a lado) ===
  {
    name: 'severity',
    label: 'Gravedad de la Alergia *',
    type: 'select',
    required: true,
    options: [
      { value: 'MILD', label: '🟡 Leve' },
      { value: 'MODERATE', label: '🟠 Moderada' },
      { value: 'SEVERE', label: '🔴 Severa' },
    ],
    width: 'calc(50% - 8px)',
  },
  {
    name: 'discoveredDate',
    label: 'Fecha de Descubrimiento',
    type: 'date',
    defaultValue: getTodayDateString(),
    width: 'calc(50% - 8px)',
  },
  // === Síntomas y Reacciones (ancho completo) ===
  {
    name: 'symptoms',
    label: 'Reacción/Síntomas Observados *',
    type: 'textarea',
    required: true,
    placeholder: 'ej: Picazón, Urticaria, Vómito, Inflamación, Dificultad para respirar',
    width: '100%',
  },
  // === Información Adicional (ancho completo) ===
  {
    name: 'notes',
    label: 'Recomendaciones y Notas',
    type: 'textarea',
    placeholder: 'Información relevante sobre cómo manejar esta alergia y recomendaciones médicas',
    width: '100%',
  },
];

export function AllergiesTab({
  allergies,
  petId,
  onDataUpdated,
}: AllergiesTabProps) {
  // ========================================================================
  // CRUD OPERATIONS
  // ========================================================================
  const {
    data: displayAllergies,
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
  } = useCRUD<MedicationAllergy>({
    onCreate: async (formData) => {
      // Map form fields to API fields
      const payload: RecordAllergyDto = {
        petId,
        medicationName: formData.allergen,
        medicationId: formData.allergenCode || undefined,
        severity: formData.severity,
        // Convert symptoms array to reaction string
        reaction: Array.isArray(formData.symptoms)
          ? formData.symptoms.join(', ')
          : (formData.symptoms || ''),
        notes: formData.notes,
        // Note: discoveredDate is not part of the backend DTO
      };
      await ehrApi.recordAllergy(payload);
    },
    onUpdate: async (id, formData) => {
      // Map form fields to API fields
      const payload = {
        medicationName: formData.allergen,
        medicationId: formData.allergenCode || undefined,
        severity: formData.severity,
        // Convert symptoms array to reaction string
        reaction: Array.isArray(formData.symptoms)
          ? formData.symptoms.join(', ')
          : (formData.symptoms || ''),
        notes: formData.notes,
      };
      await ehrApi.updateAllergy(id, payload);
    },
    onDelete: async (id) => {
      await ehrApi.deleteAllergy(id);
    },
    onRefresh: async () => {
      await onDataUpdated();
    },
  });

  const displayData = displayAllergies.length > 0 ? displayAllergies : allergies;

  // Delete confirmation modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [allergyToDelete, setAllergyToDelete] = useState<MedicationAllergy | null>(null);

  // Handle delete with confirmation modal
  const handleDeleteWithConfirmation = (allergy: MedicationAllergy) => {
    setAllergyToDelete(allergy);
    setIsDeleteModalOpen(true);
  };

  // Confirm delete from modal
  const handleConfirmDelete = async (allergyId: string) => {
    try {
      await ehrApi.deleteAllergy(allergyId);
      await onDataUpdated();
      setAllergyToDelete(null);
      setIsDeleteModalOpen(false);
    } catch (error: any) {
      console.error('Error deleting allergy:', error);
      throw error;
    }
  };
  const handleEditWithMapping = (allergy: MedicationAllergy) => {
    const mappedAllergy = {
      ...allergy,
      allergen: allergy.medicationName,
      allergenCode: allergy.medicationId,
      severity: allergy.severity,
      symptoms: allergy.reaction,
      discoveredDate: allergy.documentedDate,
      notes: allergy.notes,
    };
    handleEdit(mappedAllergy as any);
  };

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-900">
            Alergias ({allergies.length})
          </h3>
          <button
            onClick={handleNew}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
          >
            <MdAdd size={18} />
            Registrar Alergia
          </button>
        </div>

        {/* Empty State */}
        {allergies.length === 0 && (
          <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-slate-500 mb-2">✓ Sin alergias reportadas</p>
            <p className="text-xs text-slate-400">Si se detecta una alergia, regístrala aquí</p>
          </div>
        )}

        {/* Allergies Table */}
        {displayData.length > 0 && (
          <DataTable
            columns={ALLERGIES_COLUMNS}
            data={displayData}
            onEdit={handleEditWithMapping}
            onDelete={handleDeleteWithConfirmation}
            loading={loading}
          />
        )}
      </div>

      {/* Form Modal */}
      <FormModal
        isOpen={isModalOpen}
        isEditing={isEditing}
        fields={ALLERGIES_FORM_FIELDS}
        initialData={selectedItem}
        title={isEditing ? 'Editar Alergia' : 'Registrar Alergia'}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        loading={loading}
        error={error}
      />

      {/* Delete Allergy Confirmation Modal */}
      <DeleteAllergyConfirmation
        isOpen={isDeleteModalOpen}
        allergy={allergyToDelete}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setAllergyToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        loading={loading}
      />
    </>
  );
}