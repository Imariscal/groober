'use client';

import { DiagnosticOrder, CreateDiagnosticOrderDto, TestType } from '@/types/ehr';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MdAdd, MdClose, MdEdit, MdDelete, MdRemoveRedEye } from 'react-icons/md';
import { DataTable, FormModal, useCRUD, type TableColumn, type FormField } from '@/components/ehr/shared';
import { ehrApi } from '@/api/ehr-api';
import { useClinicTimezone } from '@/hooks/useClinicTimezone';
import { formatInTimeZone } from 'date-fns-tz';
import toast from 'react-hot-toast';
import { useState } from 'react';

interface DiagnosticsTabProps {
  diagnosticOrders: DiagnosticOrder[];
  petId: string;
  medicalVisitId: string;
  currentMedicalVisitId?: string; // ✅ To differentiate current vs previous
  onDataUpdated: () => Promise<void>;
}

// ============================================================================
// DIAGNOSTICS TABLE COLUMNS
// ============================================================================
const TEST_TYPE_LABELS: Record<string, string> = {
  BLOOD_TEST: 'Análisis de Sangre',
  URINE_TEST: 'Análisis de Orina',
  FECAL_TEST: 'Análisis de Heces',
  XRAY: 'Radiografía',
  ULTRASOUND: 'Ultrasonido',
  ECG: 'Electrocardiograma',
  ENDOSCOPY: 'Endoscopia',
};

const DIAGNOSTICS_COLUMNS: TableColumn<DiagnosticOrder>[] = [
  {
    key: 'testType',
    label: 'Tipo de Prueba',
    width: '180px',
    render: (testType) => TEST_TYPE_LABELS[testType] || testType,
  },
  {
    key: 'description',
    label: 'Descripción',
    width: '200px',
  },
  {
    key: 'status',
    label: 'Estado',
    width: '140px',
    render: (status) => {
      const statusColors: Record<string, string> = {
        PENDING: 'bg-yellow-100 text-yellow-800',
        SAMPLE_COLLECTED: 'bg-blue-100 text-blue-800',
        IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
        COMPLETED: 'bg-green-100 text-green-800',
        CANCELLED: 'bg-red-100 text-red-800',
      };
      const statusLabels: Record<string, string> = {
        PENDING: 'Pendiente',
        SAMPLE_COLLECTED: 'Muestra Recolectada',
        IN_PROGRESS: 'En Procesamiento',
        COMPLETED: 'Completada',
        CANCELLED: 'Cancelada',
      };
      return (
        <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
          {statusLabels[status] || status}
        </span>
      );
    },
  },
  {
    key: 'createdAt',
    label: 'Fecha de Orden',
    width: '120px',
    render: (date) => format(new Date(date), 'd MMM yyyy', { locale: es }),
  },
];

// ============================================================================
// DIAGNOSTICS FORM FIELDS
// ============================================================================
const TEST_TYPE_OPTIONS = [
  { value: 'BLOOD_TEST', label: 'Análisis de Sangre' },
  { value: 'URINE_TEST', label: 'Análisis de Orina' },
  { value: 'FECAL_TEST', label: 'Análisis de Heces' },
  { value: 'XRAY', label: 'Radiografía' },
  { value: 'ULTRASOUND', label: 'Ultrasonido' },
  { value: 'ECG', label: 'Electrocardiograma' },
  { value: 'ENDOSCOPY', label: 'Endoscopia' },
];

const DIAGNOSTICS_FORM_FIELDS: FormField[] = [
  {
    name: 'testType',
    label: 'Tipo de Prueba',
    type: 'select',
    required: true,
    options: TEST_TYPE_OPTIONS,
    placeholder: 'Selecciona el tipo de prueba diagnóstica',
  },
  {
    name: 'testName',
    label: 'Nombre/Descripción de la Prueba',
    type: 'text',
    required: true,
    placeholder: 'ej: Hemograma completo, Ultrasonido abdominal',
  },
  {
    name: 'reason',
    label: 'Motivo de la Orden',
    type: 'textarea',
    required: true,
    placeholder: 'Describe por qué se ordena esta prueba diagnóstica',
  },
  {
    name: 'dueDate',
    label: 'Fecha de Vencimiento/Límite',
    type: 'date',
    required: true,
  },
  {
    name: 'testCode',
    label: 'Código de la Prueba (Opcional)',
    type: 'text',
    placeholder: 'Código o referencia interna',
  },
  {
    name: 'description',
    label: 'Descripción Adicional (Opcional)',
    type: 'textarea',
    placeholder: 'Detalles adicionales de la prueba diagnóstica',
  },
  {
    name: 'priority',
    label: 'Prioridad',
    type: 'select',
    options: [
      { value: 'ROUTINE', label: 'Rutinaria' },
      { value: 'URGENT', label: 'Urgente' },
    ],
    placeholder: 'Selecciona la prioridad',
  },
];

// ============================================================================
// CUSTOM TABLE WITH CONDITIONAL ACTION BUTTONS
// ============================================================================
interface DiagnosticsTableProps {
  diagnostics: DiagnosticOrder[];
  currentMedicalVisitId: string | undefined;
  onView: (item: DiagnosticOrder) => void;
  onEdit: (item: DiagnosticOrder) => void;
  onDelete: (item: DiagnosticOrder) => void;
  loading?: boolean;
}

function DiagnosticsTableWithStatus({
  diagnostics,
  currentMedicalVisitId,
  onView,
  onEdit,
  onDelete,
  loading,
}: DiagnosticsTableProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (diagnostics.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">No hay registros</p>
      </div>
    );
  }

  const isFromCurrentVisit = (diagnostic: DiagnosticOrder): boolean => {
    if (!currentMedicalVisitId) return false;
    return diagnostic.medicalVisitId === currentMedicalVisitId;
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
              Tipo de Prueba
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
              Descripción
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
              Estado
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
              Fecha de Creación
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900 w-24">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {diagnostics.map((diagnostic) => {
            const isCurrent = isFromCurrentVisit(diagnostic);
            const hasPreviousVisit = diagnostic.medicalVisitId && !isCurrent;

            return (
              <tr key={diagnostic.id} className="hover:bg-slate-50 transition">
                <td className="px-4 py-3 text-sm text-slate-700">
                  {diagnostic.testType} {diagnostic.testCode ? `(${diagnostic.testCode})` : ''}
                </td>
                <td className="px-4 py-3 text-sm text-slate-700">
                  {diagnostic.description || '-'}
                </td>
                <td className="px-4 py-3 text-sm">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      diagnostic.status === 'PENDING'
                        ? 'bg-yellow-100 text-yellow-800'
                        : diagnostic.status === 'COMPLETED'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {diagnostic.status === 'PENDING'
                      ? 'Pendiente'
                      : diagnostic.status === 'COMPLETED'
                      ? 'Completado'
                      : diagnostic.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-slate-700">
                  {format(new Date(diagnostic.createdAt), 'PPP', { locale: es })}
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex gap-2">
                    {/* Conditional Buttons */}
                    {isCurrent ? (
                      <>
                        {/* Current Visit: Edit and Delete buttons */}
                        <button
                          onClick={() => onEdit(diagnostic)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
                          title="Editar"
                        >
                          <MdEdit size={18} />
                        </button>
                        <button
                          onClick={() => onDelete(diagnostic)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                          title="Eliminar"
                        >
                          <MdDelete size={18} />
                        </button>
                      </>
                    ) : hasPreviousVisit ? (
                      <>
                        {/* Previous Visit: View only button */}
                        <button
                          onClick={() => onView(diagnostic)}
                          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition"
                          title="Ver detalles"
                        >
                          <MdRemoveRedEye size={18} />
                        </button>
                      </>
                    ) : null}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function DiagnosticsTab({
  diagnosticOrders,
  petId,
  medicalVisitId,
  currentMedicalVisitId,
  onDataUpdated,
}: DiagnosticsTabProps) {
  // ========================================================================
  // CLINIC TIMEZONE
  // ========================================================================
  const clinicTimezone = useClinicTimezone();

  // Helper function to get today's date in YYYY-MM-DD format using clinic timezone
  const getTodayDateStringWithTimezone = () => {
    return formatInTimeZone(new Date(), clinicTimezone, 'yyyy-MM-dd');
  };

  // ========================================================================
  // CRUD OPERATIONS
  // ========================================================================
  const {
    data: displayDiagnostics,
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
  } = useCRUD<DiagnosticOrder>({
    onCreate: async (formData) => {
      const payload: CreateDiagnosticOrderDto = {
        petId,
        testType: formData.testType as TestType,
        testName: formData.testName,
        reason: formData.reason,
        dueDate: formData.dueDate || getTodayDateStringWithTimezone(),
        // Optional fields
        ...(formData.testCode && { testCode: formData.testCode }),
        ...(formData.description && { description: formData.description }),
        ...(formData.priority && { priority: formData.priority as 'ROUTINE' | 'URGENT' }),
      };
      await ehrApi.createDiagnosticOrder(payload, medicalVisitId);
    },
    onUpdate: async (id, formData) => {
      const payload: Partial<CreateDiagnosticOrderDto> = {
        // Only send fields that can be updated
        ...(formData.testType && { testType: formData.testType as TestType }),
        ...(formData.testName && { testName: formData.testName }),
        ...(formData.reason && { reason: formData.reason }),
        ...(formData.dueDate && { dueDate: formData.dueDate }),
        ...(formData.testCode && { testCode: formData.testCode }),
        ...(formData.description && { description: formData.description }),
        ...(formData.priority && { priority: formData.priority as 'ROUTINE' | 'URGENT' }),
      };
      await ehrApi.updateDiagnosticOrder(id, payload);
    },
    onDelete: async (id) => {
      await ehrApi.deleteDiagnosticOrder(id);
    },
    onRefresh: async () => {
      await onDataUpdated();
    },
  });

  // ========================================================================
  // READ-ONLY MODAL STATE FOR PREVIOUS VISIT ITEMS
  // ========================================================================
  const [viewOnlyItem, setViewOnlyItem] = useState<DiagnosticOrder | null>(null);

  const displayData = displayDiagnostics.length > 0 ? displayDiagnostics : diagnosticOrders;
  const pending = displayData.filter((d) => d.status !== 'COMPLETED' && d.status !== 'CANCELLED');
  const completed = displayData.filter((d) => d.status === 'COMPLETED' || d.status === 'CANCELLED');

  // ========================================================================
  // HANDLERS WITH PROTECTION FOR PREVIOUS VISITS
  // ========================================================================
  const handleEditDiagnostic = (diagnostic: DiagnosticOrder) => {
    // ✅ Check if from current visit
    if (!currentMedicalVisitId || diagnostic.medicalVisitId !== currentMedicalVisitId) {
      // Previous visit → Show read-only modal
      setViewOnlyItem(diagnostic);
      return;
    }
    // Current visit → Allow editing
    handleEdit(diagnostic);
  };

  const handleDeleteDiagnostic = (diagnostic: DiagnosticOrder) => {
    // For previous visits, edit handler already opens read-only modal
    // This prevents accidental deletes
    if (!currentMedicalVisitId || diagnostic.medicalVisitId !== currentMedicalVisitId) {
      toast.error('No puedes eliminar estudios de citas anteriores');
      return;
    }
    handleDelete(diagnostic);
  };

  // Check if this is a new visit (no saved medical visit yet)
  const isNewVisit = !currentMedicalVisitId;

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-900">
            Órdenes Diagnósticas ({diagnosticOrders.length})
          </h3>
          <button
            onClick={handleNew}
            disabled={isNewVisit}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition ${
              isNewVisit
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
            title={isNewVisit ? 'Guarda la visita médica primero antes de agregar órdenes' : 'Crear nueva orden diagnóstica'}
          >
            <MdAdd size={18} />
            Nueva Orden
          </button>
        </div>

        {/* Info for New Visits */}
        {isNewVisit && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              💡 Guarda los signos vitales y la información médica primero para agregar órdenes diagnósticas.
            </p>
          </div>
        )}

        {/* Empty State */}
        {diagnosticOrders.length === 0 && (
          <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-slate-500 mb-4">No hay órdenes diagnósticas</p>
          </div>
        )}

        {/* Pending Orders Table */}
        {pending.length > 0 && (
          <div>
                       <DiagnosticsTableWithStatus
              diagnostics={pending}
              currentMedicalVisitId={currentMedicalVisitId}
              onView={(item) => setViewOnlyItem(item)}
              onEdit={handleEditDiagnostic}
              onDelete={handleDeleteDiagnostic}
              loading={loading}
            />
          </div>
        )}

        {/* Completed Orders Table */}
        {completed.length > 0 && (
          <div>
            <h4 className="font-semibold text-slate-500 mb-3">Historial ({completed.length})</h4>
            <DiagnosticsTableWithStatus
              diagnostics={completed}
              currentMedicalVisitId={currentMedicalVisitId}
              onView={(item) => setViewOnlyItem(item)}
              onEdit={handleEditDiagnostic}
              onDelete={handleDeleteDiagnostic}
              loading={loading}
            />
          </div>
        )}
      </div>

      {/* Form Modal */}
      <FormModal
        isOpen={isModalOpen}
        isEditing={isEditing}
        fields={DIAGNOSTICS_FORM_FIELDS}
        initialData={selectedItem}
        title={isEditing ? 'Editar Orden Diagnóstica' : 'Nueva Orden Diagnóstica'}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        loading={loading}
        error={error}
      />

      {/* Read-Only Modal for Previous Visit Items */}
      {viewOnlyItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">Detalle de Orden (Cita Anterior)</h2>
              <button
                onClick={() => setViewOnlyItem(null)}
                className="text-slate-500 hover:text-slate-700 transition"
              >
                <MdClose size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Test Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">Tipo de Prueba</label>
                  <p className="text-slate-900 font-medium">{viewOnlyItem.testType}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">Estado</label>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        viewOnlyItem.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-800'
                          : viewOnlyItem.status === 'COMPLETED'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {viewOnlyItem.status === 'PENDING'
                        ? 'Pendiente'
                        : viewOnlyItem.status === 'COMPLETED'
                        ? 'Completado'
                        : viewOnlyItem.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Code and Description */}
              <div className="grid grid-cols-2 gap-4">
                {viewOnlyItem.testCode && (
                  <div>
                    <label className="block text-sm font-medium text-slate-500 mb-1">Código de Prueba</label>
                    <p className="text-slate-900 font-mono text-sm">{viewOnlyItem.testCode}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">Prioridad</label>
                  <p className="text-slate-900">{viewOnlyItem.priority === 'URGENT' ? '🔴 Urgente' : '🟢 Rutinaria'}</p>
                </div>
              </div>

              {/* Description */}
              {viewOnlyItem.description && (
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">Descripción</label>
                  <p className="text-slate-900">{viewOnlyItem.description}</p>
                </div>
              )}

              {/* Sample Collection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">Muestra Recolectada</label>
                  <p className="text-slate-900">{viewOnlyItem.sampleCollected ? '✅ Sí' : '❌ No'}</p>
                </div>
                {viewOnlyItem.sampleCollectedDate && (
                  <div>
                    <label className="block text-sm font-medium text-slate-500 mb-1">Fecha de Recolección</label>
                    <p className="text-slate-900">
                      {format(new Date(viewOnlyItem.sampleCollectedDate), 'PPP p', { locale: es })}
                    </p>
                  </div>
                )}
              </div>

              {/* Results */}
              {viewOnlyItem.resultsSummary && (
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">Resumen de Resultados</label>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <p className="text-slate-900 whitespace-pre-wrap">{viewOnlyItem.resultsSummary}</p>
                  </div>
                </div>
              )}

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">Fecha de Creación</label>
                  <p className="text-slate-900">
                    {format(new Date(viewOnlyItem.createdAt), 'PPP p', { locale: es })}
                  </p>
                </div>
                {viewOnlyItem.completedDate && (
                  <div>
                    <label className="block text-sm font-medium text-slate-500 mb-1">Fecha de Finalización</label>
                    <p className="text-slate-900">
                      {format(new Date(viewOnlyItem.completedDate), 'PPP p', { locale: es })}
                    </p>
                  </div>
                )}
              </div>

              {/* Information Message */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  ℹ️ Esta orden es de una cita anterior. Solo puedes verla, no editar ni eliminar.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() => setViewOnlyItem(null)}
                className="px-4 py-2 bg-slate-200 text-slate-900 rounded-lg hover:bg-slate-300 transition font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}