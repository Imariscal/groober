'use client';

import React, { useState } from 'react';
import { ClinicCalendarException, CreateCalendarExceptionPayload, CalendarExceptionType } from '@/types';
import { MdAdd, MdDelete, MdEdit, MdCalendarToday } from 'react-icons/md';
import Modal from './Modal';
import { DeleteCalendarExceptionConfirmation } from './DeleteCalendarExceptionConfirmation';
import toast from 'react-hot-toast';
import { useClinicTimezone } from '@/hooks/useClinicTimezone';
import { getClinicDateKey, getClinicDayRangeUtc } from '@/lib/datetime-tz';
import { format } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';
import { es } from 'date-fns/locale';

interface CalendarExceptionsTabProps {
  exceptions: ClinicCalendarException[];
  isLoading: boolean;
  onAdd: (payload: CreateCalendarExceptionPayload) => Promise<void>;
  onUpdate: (id: string, payload: Partial<ClinicCalendarException>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

interface FormData {
  date: string;
  type: CalendarExceptionType;
  startTime?: string;
  endTime?: string;
  reason?: string;
}

export function CalendarExceptionsTab({
  exceptions,
  isLoading,
  onAdd,
  onUpdate,
  onDelete,
}: CalendarExceptionsTabProps) {
  const clinicTimezone = useClinicTimezone();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<ClinicCalendarException | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    date: getClinicDateKey(new Date(), clinicTimezone),
    type: 'CLOSED',
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleOpenModal = (exception?: ClinicCalendarException) => {
    if (exception) {
      setEditingId(exception.id);
      setFormData({
        date: exception.date,
        type: exception.type,
        startTime: exception.startTime,
        endTime: exception.endTime,
        reason: exception.reason,
      });
    } else {
      setEditingId(null);
      setFormData({
        date: getClinicDateKey(new Date(), clinicTimezone),
        type: 'CLOSED',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    // Validate
    if (!formData.date) {
      toast.error('La fecha es requerida');
      return;
    }

    if (formData.type === 'SPECIAL_HOURS') {
      if (!formData.startTime || !formData.endTime) {
        toast.error('Debe especificar hora de inicio y fin');
        return;
      }
      if (formData.startTime >= formData.endTime) {
        toast.error('La hora de inicio debe ser anterior a la hora de fin');
        return;
      }
    }

    setIsSaving(true);
    try {
      if (editingId) {
        await onUpdate(editingId, formData);
        toast.success('Día festivo actualizado');
      } else {
        await onAdd(formData);
        toast.success('Día festivo agregado');
      }
      handleCloseModal();
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (exception: ClinicCalendarException) => {
    setDeleteConfirmation(exception);
  };

  const handleConfirmDelete = async (id: string) => {
    try {
      await onDelete(id);
    } catch (error: any) {
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-2xl">
      {/* List Container */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center text-white">
              <MdCalendarToday className="text-lg" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Días Festivos</h3>
              <p className="text-sm text-slate-500">Administra cierres y horarios especiales</p>
            </div>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold"
          >
            <MdAdd className="w-5 h-5" />
            Nuevo
          </button>
        </div>

        {exceptions.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <p>No hay días festivos configurados</p>
          </div>
        ) : (
          <div>
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Horario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Motivo
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {exceptions.map((exception) => {
                // Convertir dateKey (YYYY-MM-DD) a Date formateada en la zona horaria de la clínica
                const { startUtc } = getClinicDayRangeUtc(exception.date, clinicTimezone);
                const zonedDate = utcToZonedTime(startUtc, clinicTimezone);
                const formattedDate = format(zonedDate, 'EEEE, dd MMMM yyyy', { locale: es });
                
                return (
                <tr key={exception.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900 capitalize">
                    {formattedDate}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        exception.type === 'CLOSED'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {exception.type === 'CLOSED' ? 'Cerrado' : 'Horario especial'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {exception.type === 'SPECIAL_HOURS' && exception.startTime
                      ? `${exception.startTime} - ${exception.endTime}`
                      : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {exception.reason || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-right space-x-2">
                    <button
                      onClick={() => handleOpenModal(exception)}
                      className="text-primary-600 hover:text-primary-700 inline"
                    >
                      <MdEdit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(exception)}
                      className="text-red-600 hover:text-red-700 inline"
                    >
                      <MdDelete className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingId ? 'Editar día festivo' : 'Nuevo día festivo'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha *
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo *
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="CLOSED">Cerrado</option>
              <option value="SPECIAL_HOURS">Horario especial</option>
            </select>
          </div>

          {formData.type === 'SPECIAL_HOURS' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hora de inicio
                  </label>
                  <input
                    type="time"
                    name="startTime"
                    value={formData.startTime || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hora de fin
                  </label>
                  <input
                    type="time"
                    name="endTime"
                    value={formData.endTime || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Motivo (opcional)
            </label>
            <input
              type="text"
              name="reason"
              value={formData.reason || ''}
              onChange={handleInputChange}
              placeholder="p.ej. Feriado nacional"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              onClick={handleCloseModal}
              className="px-4 py-2 text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg hover:shadow-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSaving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <DeleteCalendarExceptionConfirmation
        isOpen={deleteConfirmation !== null}
        exception={deleteConfirmation}
        onClose={() => setDeleteConfirmation(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
