'use client';

import React, { useState } from 'react';
import { MdAdd, MdEdit, MdDelete, MdClose, MdRemoveRedEye } from 'react-icons/md';
import { ehrApi } from '@/api/ehr-api';
import { formatDateOnly } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useClinicTimezone } from '@/hooks/useClinicTimezone';
import { toUtcIsoFromClinicLocal, getClinicDateKey } from '@/lib/datetime-tz';
import toast from 'react-hot-toast';

interface FollowUpNote {
  id: string;
  medicalVisitId: string;
  clinicId: string;
  petId: string;
  noteDate: Date | string;
  noteContent: string;
  statusUpdate?: string;
  writtenBy: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface FollowUpNotesTabProps {
  medicalVisitId: string;
  petId: string;
  currentMedicalVisitId?: string; // ✅ To differentiate current vs previous
  initialFollowUpRequired?: boolean;
  initialFollowUpDate?: Date | string;
  notes?: FollowUpNote[];
  onFollowUpUpdate?: (data: any) => void;
  isReadOnly?: boolean;
}

interface CreateFollowUpForm {
  noteContent: string;
  statusUpdate?: string;
  noteDate?: string;
}

const STATUS_OPTIONS = [
  { value: 'OPEN', label: 'Abierto', color: 'bg-blue-100 text-blue-800' },
  { value: 'COMPLETED', label: 'Completado', color: 'bg-green-100 text-green-800' },
  { value: 'ARCHIVED', label: 'Archivado', color: 'bg-slate-100 text-slate-800' },
];

export function FollowUpNotesTab({
  medicalVisitId,
  petId,
  currentMedicalVisitId,
  initialFollowUpRequired,
  initialFollowUpDate,
  notes = [],
  onFollowUpUpdate,
  isReadOnly = false,
}: FollowUpNotesTabProps) {
  const clinicTimezone = useClinicTimezone();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<FollowUpNote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<FollowUpNote | null>(null);
  const [viewOnlyItem, setViewOnlyItem] = useState<FollowUpNote | null>(null);

  // Check if this is a new visit (no saved medical visit yet)
  const isNewVisit = !currentMedicalVisitId;

  const [formData, setFormData] = useState<CreateFollowUpForm>({
    noteContent: '',
    statusUpdate: 'OPEN',
    noteDate: getClinicDateKey(new Date(), clinicTimezone),
  });

  const handleOpenModal = (note?: FollowUpNote) => {
    if (note) {
      setEditingNote(note);
      setFormData({
        noteContent: note.noteContent || '',
        statusUpdate: note.statusUpdate || 'OPEN',
        noteDate: note.noteDate ? getClinicDateKey(new Date(note.noteDate), clinicTimezone) : undefined,
      });
    } else {
      setEditingNote(null);
      setFormData({
        noteContent: '',
        statusUpdate: 'OPEN',
        noteDate: getClinicDateKey(new Date(), clinicTimezone),
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingNote(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.noteContent.trim()) {
      toast.error('La nota es requerida');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        noteContent: formData.noteContent.trim(),
        statusUpdate: formData.statusUpdate,
        noteDate: formData.noteDate ? toUtcIsoFromClinicLocal(new Date(formData.noteDate), clinicTimezone) : undefined,
      };

      if (editingNote) {
        // UPDATE
        await ehrApi.updateFollowUpNote(editingNote.id, payload);
        toast.success('Nota de seguimiento actualizada');
      } else {
        // CREATE
        await ehrApi.createFollowUpNote(medicalVisitId, payload);
        toast.success('Nota de seguimiento creada');
      }
      onFollowUpUpdate?.(medicalVisitId);
      handleCloseModal();
    } catch (error: any) {
      toast.error(error?.message || 'Error al guardar nota');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (noteId: string) => {
    setIsLoading(true);
    try {
      await ehrApi.deleteFollowUpNote(noteId);
      toast.success('Nota de seguimiento eliminada');
      onFollowUpUpdate?.(medicalVisitId);
      setIsDeleteModalOpen(false);
      setNoteToDelete(null);
    } catch (error: any) {
      toast.error(error?.message || 'Error al eliminar nota');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string | undefined) => {
    return STATUS_OPTIONS.find((s) => s.value === status)?.color || 'bg-slate-100 text-slate-800';
  };

  const getStatusLabel = (status: string | undefined) => {
    return STATUS_OPTIONS.find((s) => s.value === status)?.label || status || '-';
  };

  // Sort notes by creation date (newest first)
  const sortedNotes = [...notes].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-900">Notas de Seguimiento</h3>
        {!isReadOnly && (
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            <MdAdd size={20} />
            Agregar Nota
          </button>
        )}
      </div>

      {/* Initial Follow-up Alert */}
      {initialFollowUpRequired && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            ⚠️ <strong>Seguimiento requerido</strong>
            {initialFollowUpDate && ` - Próxima cita: ${formatDateOnly(initialFollowUpDate)}`}
          </p>
        </div>
      )}

      {/* Table */}
      {notes.length > 0 ? (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-700">
            <div className="col-span-5">Contenido</div>
            <div className="col-span-2">Fecha</div>
            <div className="col-span-2">Estado</div>
            <div className="col-span-3 text-right">Acciones</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-slate-200">
            {sortedNotes.map((note) => (
              <div key={note.id} className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-slate-50 transition text-sm">
                <div className="col-span-5">
                  <p className="text-slate-900 line-clamp-2">{note.noteContent}</p>
                </div>

                <div className="col-span-2">
                  <p className="text-slate-600">
                    {note.noteDate ? formatDateOnly(note.noteDate) : '-'}
                  </p>
                </div>

                <div className="col-span-2">
                  <span className={`inline-block text-xs font-semibold px-2 py-1 rounded ${getStatusColor(note.statusUpdate)}`}>
                    {getStatusLabel(note.statusUpdate)}
                  </span>
                </div>

                <div className="col-span-3 flex justify-end gap-2">
                  {(() => {
                    const isCurrent = currentMedicalVisitId && note.medicalVisitId === currentMedicalVisitId;
                    const hasPreviousVisit = note.medicalVisitId && !isCurrent;

                    if (isCurrent && !isReadOnly) {
                      return (
                        <>
                          <button
                            onClick={() => handleOpenModal(note)}
                            className="p-1.5 hover:bg-blue-50 text-blue-600 rounded transition"
                            title="Editar"
                          >
                            <MdEdit size={18} />
                          </button>
                          <button
                            onClick={() => {
                              setNoteToDelete(note);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-1.5 hover:bg-red-50 text-red-600 rounded transition"
                            title="Eliminar"
                          >
                            <MdDelete size={18} />
                          </button>
                        </>
                      );
                    } else if (hasPreviousVisit) {
                      return (
                        <button
                          onClick={() => setViewOnlyItem(note)}
                          className="p-1.5 hover:bg-gray-100 text-gray-600 rounded transition"
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
      ) : (
        <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
          <p className="text-slate-500">No hay notas de seguimiento</p>
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
                  {editingNote ? 'Editar Nota de Seguimiento' : 'Nueva Nota de Seguimiento'}
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
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nota *</label>
                  <textarea
                    value={formData.noteContent}
                    onChange={(e) => setFormData((prev) => ({ ...prev, noteContent: e.target.value }))}
                    placeholder="Escriba la nota de seguimiento..."
                    rows={5}
                    disabled={isLoading}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Fecha de la Nota
                    </label>
                    <input
                      type="date"
                      value={formData.noteDate || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, noteDate: e.target.value }))}
                      disabled={isLoading}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
                    <select
                      value={formData.statusUpdate}
                      onChange={(e) => setFormData((prev) => ({ ...prev, statusUpdate: e.target.value as any }))}
                      disabled={isLoading}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>
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
                  {isLoading ? 'Guardando...' : editingNote ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && noteToDelete && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setIsDeleteModalOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-sm w-full">
              {/* Header */}
              <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-red-600 to-red-700">
                <h2 className="text-lg font-bold text-white">Eliminar Nota de Seguimiento</h2>
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
                <p className="text-slate-700">¿Está seguro de que desea eliminar esta nota de seguimiento?</p>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-sm text-slate-600">
                    <strong>Contenido:</strong> {noteToDelete.noteContent.substring(0, 100)}...
                  </p>
                  <p className="text-xs text-slate-500 mt-2">
                    <strong>Estado:</strong> {getStatusLabel(noteToDelete.statusUpdate)}
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
                  onClick={() => handleDelete(noteToDelete.id)}
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
              <h2 className="text-xl font-semibold text-slate-900">Nota de Seguimiento (Cita Anterior)</h2>
              <button
                onClick={() => setViewOnlyItem(null)}
                className="text-slate-500 hover:text-slate-700 transition"
              >
                <MdClose size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-2">Contenido</label>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <p className="text-slate-900 whitespace-pre-wrap">{viewOnlyItem.noteContent}</p>
                </div>
              </div>

              {/* Date & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">Fecha</label>
                  <p className="text-slate-900">
                    {viewOnlyItem.noteDate
                      ? format(new Date(viewOnlyItem.noteDate), 'PPP', { locale: es })
                      : '-'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">Estado</label>
                  <span
                    className={`inline-block text-xs font-semibold px-3 py-1 rounded ${getStatusColor(viewOnlyItem.statusUpdate)}`}
                  >
                    {getStatusLabel(viewOnlyItem.statusUpdate)}
                  </span>
                </div>
              </div>

              {/* Written By & Timestamps */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">Escrito por</label>
                  <p className="text-slate-900 font-mono text-sm">{viewOnlyItem.writtenBy}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">Fecha de Creación</label>
                  <p className="text-slate-900">
                    {format(new Date(viewOnlyItem.createdAt), 'PPP p', { locale: es })}
                  </p>
                </div>
              </div>

              {/* Information Message */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  ℹ️ Esta nota es de una cita anterior. Solo puedes verla, no editar ni eliminar.
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
