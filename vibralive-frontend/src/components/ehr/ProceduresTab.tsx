'use client';

import React, { useState } from 'react';
import { MedicalProcedure } from '@/types/ehr';
import { MdAdd, MdEdit, MdDelete, MdClose, MdCheckCircle, MdRemoveRedEye } from 'react-icons/md';
import { ehrApi } from '@/api/ehr-api';
import { formatDate, formatDateOnly } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { useClinicTimezone } from '@/hooks/useClinicTimezone';
import { toUtcIsoFromClinicLocal, getClinicDateKey } from '@/lib/datetime-tz';

interface ProceduresTabProps {
  medicalVisitId: string;
  petId: string;
  procedures: MedicalProcedure[];
  currentMedicalVisitId?: string; // ✅ To differentiate current vs previous
  onProcedureAdd?: (procedure: MedicalProcedure) => void;
  onProcedureUpdate?: (procedure: MedicalProcedure) => void;
  onProcedureDelete?: (procedureId: string) => void;
  isReadOnly?: boolean;
}

interface CreateProcedureForm {
  procedureType: string;
  procedureName: string;
  procedureDate: string;
  veterinarianId?: string;
  durationMinutes?: number;
  anesthesiaType?: string;
  complications?: string;
  notes?: string;
}

const PROCEDURE_TYPES = [
  { value: 'SURGERY', label: '🏥 Cirugía' },
  { value: 'DENTAL', label: '🦷 Procedimiento Dental' },
  { value: 'ULTRASOUND', label: '🔊 Ultrasonido' },
  { value: 'XRAY', label: '🩻 Radiografía' },
  { value: 'BIOPSY', label: '🔬 Biopsia' },
  { value: 'CATHETER', label: '💉 Cateterismo' },
  { value: 'ENDOSCOPY', label: 'Endoscopia' },
  { value: 'OTHER', label: 'Otro' },
];

const ANESTHESIA_TYPES = [
  { value: '', label: 'Ninguna' },
  { value: 'LOCAL', label: 'Local' },
  { value: 'SEDATION', label: 'Sedación' },
  { value: 'GENERAL', label: 'General' },
  { value: 'REGIONAL', label: 'Regional' },
  { value: 'OTHER', label: 'Otra' },
];

export function ProceduresTab({
  medicalVisitId,
  petId,
  procedures,
  currentMedicalVisitId,
  onProcedureAdd,
  onProcedureUpdate,
  onProcedureDelete,
  isReadOnly = false,
}: ProceduresTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProcedure, setEditingProcedure] = useState<MedicalProcedure | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [procedureToDelete, setProcedureToDelete] = useState<MedicalProcedure | null>(null);
  const [viewOnlyItem, setViewOnlyItem] = useState<MedicalProcedure | null>(null);
  
  const clinicTimezone = useClinicTimezone();

  // Check if this is a new visit (no saved medical visit yet)
  const isNewVisit = !currentMedicalVisitId;

  const [formData, setFormData] = useState<CreateProcedureForm>({
    procedureType: 'SURGERY',
    procedureName: '',
    procedureDate: new Date().toISOString().split('T')[0],
    durationMinutes: undefined,
    anesthesiaType: undefined,
  });

  const resetForm = () => {
    setFormData({
      procedureType: 'SURGERY',
      procedureName: '',
      procedureDate: getClinicDateKey(new Date(), clinicTimezone),
      durationMinutes: undefined,
      anesthesiaType: undefined,
    });
  };

  const handleOpenModal = (procedure?: MedicalProcedure) => {
    if (procedure) {
      setEditingProcedure(procedure);
      setFormData({
        procedureType: procedure.procedureType || 'SURGERY',
        procedureName: procedure.procedureName || '',
        procedureDate: getClinicDateKey(procedure.procedureDate, clinicTimezone),
        durationMinutes: procedure.durationMinutes,
        anesthesiaType: procedure.anesthesiaType,
        complications: procedure.complications || '',
        notes: procedure.notes || '',
      });
    } else {
      setEditingProcedure(null);
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProcedure(null);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.procedureName.trim()) {
      toast.error('El nombre del procedimiento es requerido');
      return;
    }

    setIsLoading(true);
    try {
      const procedureDate = toUtcIsoFromClinicLocal(new Date(formData.procedureDate), clinicTimezone);
      
      const payload = {
        procedureType: formData.procedureType,
        procedureName: formData.procedureName.trim(),
        procedureDate,
        durationMinutes: formData.durationMinutes || undefined,
        anesthesiaType: formData.anesthesiaType || undefined,
        complications: formData.complications?.trim() || undefined,
        notes: formData.notes?.trim() || undefined,
      };

      if (editingProcedure) {
        const updated = await ehrApi.updateProcedure(editingProcedure.id, payload);
        onProcedureUpdate?.(updated);
        toast.success('Procedimiento actualizado');
      } else {
        const created = await ehrApi.createProcedure(medicalVisitId, payload);
        onProcedureAdd?.(created);
        toast.success('Procedimiento registrado');
      }
      handleCloseModal();
    } catch (error: any) {
      toast.error(error?.message || 'Error al guardar procedimiento');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (procedureId: string) => {
    setIsLoading(true);
    try {
      await ehrApi.deleteProcedure(procedureId);
      onProcedureDelete?.(procedureId);
      toast.success('Procedimiento eliminado');
      setIsDeleteModalOpen(false);
      setProcedureToDelete(null);
    } catch (error: any) {
      toast.error(error?.message || 'Error al eliminar procedimiento');
    } finally {
      setIsLoading(false);
    }
  };

  const getProcedureTypeLabel = (type: string) => {
    return PROCEDURE_TYPES.find((t) => t.value === type)?.label || type;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-900">Procedimientos</h3>
        {!isReadOnly && (
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            <MdAdd size={20} />
            Registrar Procedimiento
          </button>
        )}
      </div>

      {/* List */}
      {procedures.length === 0 ? (
        <div className="text-center py-8 bg-slate-50 rounded-lg">
          <p className="text-slate-500">No hay procedimientos registrados</p>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-700">
            <div className="col-span-4">Procedimiento</div>
            <div className="col-span-2">Tipo</div>
            <div className="col-span-2">Fecha</div>
            <div className="col-span-2">Anestesia</div>
            <div className="col-span-2 text-right">Acciones</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-slate-200">
            {procedures.map((procedure) => (
              <div key={procedure.id} className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-slate-50 transition text-sm">
                <div className="col-span-4">
                  <p className="font-medium text-slate-900">{procedure.procedureName}</p>
                  {procedure.complications && (
                    <p className="text-xs text-red-600 mt-1">⚠️ Complicaciones</p>
                  )}
                </div>

                <div className="col-span-2">
                  <p className="text-slate-600">{getProcedureTypeLabel(procedure.procedureType).split(' ')[1]}</p>
                </div>

                <div className="col-span-2">
                  <p className="text-slate-600">{formatDateOnly(procedure.procedureDate)}</p>
                </div>

                <div className="col-span-2">
                  <p className="text-slate-600">{procedure.anesthesiaType ? procedure.anesthesiaType : '-'}</p>
                  {procedure.durationMinutes && (
                    <p className="text-xs text-slate-500">{procedure.durationMinutes} min</p>
                  )}
                </div>

                <div className="col-span-2 flex justify-end gap-2">
                  {(() => {
                    const isCurrent = currentMedicalVisitId && procedure.medicalVisitId === currentMedicalVisitId;
                    const hasPreviousVisit = procedure.medicalVisitId && !isCurrent;
                    
                    if (isCurrent) {
                      return (
                        <>
                          <button
                            onClick={() => handleOpenModal(procedure)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                            title="Editar"
                          >
                            <MdEdit size={18} />
                          </button>
                          <button
                            onClick={() => {
                              setProcedureToDelete(procedure);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                            title="Eliminar"
                          >
                            <MdDelete size={18} />
                          </button>
                        </>
                      );
                    } else if (hasPreviousVisit) {
                      return (
                        <button
                          onClick={() => setViewOnlyItem(procedure)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded transition"
                          title="Ver detalles"
                        >
                          <MdRemoveRedEye size={18} />
                        </button>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={handleCloseModal} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
              {/* Header */}
              <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-primary-600 to-primary-700">
                <h2 className="text-lg font-bold text-white">
                  {editingProcedure ? 'Editar Procedimiento' : 'Registrar Procedimiento'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-white hover:bg-white/20 p-1 rounded transition disabled:opacity-50"
                  disabled={isLoading}
                >
                  <MdClose size={24} />
                </button>
              </div>

              {/* Content */}
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Procedimiento *</label>
                  <select
                    value={formData.procedureType}
                    onChange={(e) => setFormData((prev) => ({ ...prev, procedureType: e.target.value }))}
                    disabled={isLoading}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {PROCEDURE_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Procedimiento *</label>
                  <input
                    type="text"
                    value={formData.procedureName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, procedureName: e.target.value }))}
                    placeholder="Ej: Esterilización, Limpieza dental"
                    disabled={isLoading}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>



                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Fecha del Procedimiento</label>
                    <input
                      type="date"
                      value={formData.procedureDate}
                      onChange={(e) => setFormData((prev) => ({ ...prev, procedureDate: e.target.value }))}
                      disabled={isLoading}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Duración (minutos)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.durationMinutes || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, durationMinutes: e.target.value ? parseInt(e.target.value) : undefined }))}
                      placeholder="Ej: 45"
                      disabled={isLoading}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Anestesia</label>
                  <select
                    value={formData.anesthesiaType || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, anesthesiaType: e.target.value || undefined }))}
                    disabled={isLoading}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {ANESTHESIA_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Complicaciones</label>
                  <textarea
                    value={formData.complications || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, complications: e.target.value }))}
                    placeholder="Describa cualquier complicación..."
                    rows={2}
                    disabled={isLoading}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Notas</label>
                  <textarea
                    value={formData.notes || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                    placeholder="Instrucciones de recuperación, detalles adicionales..."
                    rows={3}
                    disabled={isLoading}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  />
                </div>
              </form>

              {/* Footer */}
              <div className="flex gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 transition disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 font-medium"
                >
                  {isLoading ? 'Guardando...' : editingProcedure ? 'Actualizar' : 'Registrar'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && procedureToDelete && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setIsDeleteModalOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-sm w-full">
              {/* Header */}
              <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-red-600 to-red-700">
                <h2 className="text-lg font-bold text-white">Eliminar Procedimiento</h2>
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={isLoading}
                  className="text-white hover:bg-white/20 p-1 rounded transition disabled:opacity-50"
                >
                  <MdClose size={24} />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <p className="text-slate-700">¿Está seguro de que desea eliminar este procedimiento?</p>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-sm text-slate-600">
                    <strong>Procedimiento:</strong> {procedureToDelete.procedureName}
                  </p>
                  <p className="text-xs text-slate-500 mt-2">
                    <strong>Tipo:</strong> {getProcedureTypeLabel(procedureToDelete.procedureType)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    <strong>Fecha:</strong> {formatDate(procedureToDelete.procedureDate)}
                  </p>
                </div>
                <p className="text-xs text-red-600">⚠️ Esta acción no se puede deshacer</p>
              </div>

              {/* Footer */}
              <div className="flex gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 transition disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDelete(procedureToDelete.id)}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 font-medium"
                >
                  {isLoading ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Read-Only Modal for Previous Visit Items */}
      {viewOnlyItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">Detalle (Cita Anterior)</h2>
              <button
                onClick={() => setViewOnlyItem(null)}
                className="text-slate-500 hover:text-slate-700 transition"
              >
                <MdClose size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Procedure Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">Nombre del Procedimiento</label>
                  <p className="text-slate-900 font-medium">{viewOnlyItem.procedureName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">Tipo</label>
                  <p className="text-slate-900">{getProcedureTypeLabel(viewOnlyItem.procedureType)}</p>
                </div>
              </div>

              {/* Date & Duration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">Fecha del Procedimiento</label>
                  <p className="text-slate-900">
                    {format(new Date(viewOnlyItem.procedureDate), 'PPP', { locale: es })}
                  </p>
                </div>
                {viewOnlyItem.durationMinutes && (
                  <div>
                    <label className="block text-sm font-medium text-slate-500 mb-1">Duración</label>
                    <p className="text-slate-900">{viewOnlyItem.durationMinutes} minutos</p>
                  </div>
                )}
              </div>

              {/* Anesthesia & Veterinarian */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">Anestesia</label>
                  <p className="text-slate-900">{viewOnlyItem.anesthesiaType || 'Ninguna'}</p>
                </div>
                {viewOnlyItem.performedByVeterinarianId && (
                  <div>
                    <label className="block text-sm font-medium text-slate-500 mb-1">Realizado por</label>
                    <p className="text-slate-900 font-mono text-sm">{viewOnlyItem.performedByVeterinarianId}</p>
                  </div>
                )}
              </div>

              {/* Complications */}
              {viewOnlyItem.complications && (
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">Complicaciones</label>
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <p className="text-red-800">{viewOnlyItem.complications}</p>
                  </div>
                </div>
              )}

              {/* Notes */}
              {viewOnlyItem.notes && (
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">Notas</label>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <p className="text-slate-900 whitespace-pre-wrap">{viewOnlyItem.notes}</p>
                  </div>
                </div>
              )}

              {/* Information Message */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  ℹ️ Este procedimiento es de una cita anterior. Solo puedes verlo, no editar ni eliminar.
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
    </div>
  );
}
