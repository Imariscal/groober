'use client';

import React, { useState, useEffect } from 'react';
import { MdClose, MdCalendarToday, MdPets } from 'react-icons/md';

interface PreventiveCareEvent {
  id: string;
  petName: string;
  clientName: string;
  eventType: string;
  dueDate: string;
  status: 'UPCOMING' | 'OVERDUE';
  daysUntilDue?: number;
}

interface EditPreventiveCareModalProps {
  isOpen: boolean;
  event: PreventiveCareEvent | null;
  onClose: () => void;
  onSuccess: (event: PreventiveCareEvent) => void;
}

const EVENT_TYPES = ['Vacunación', 'Desparasitación', 'Chequeo', 'Limpieza Dental', 'Examen de Sangre'];

export const EditPreventiveCareModal: React.FC<EditPreventiveCareModalProps> = ({
  isOpen,
  event,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    petName: '',
    clientName: '',
    eventType: '',
    dueDate: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen && event) {
      setFormData({
        petName: event.petName,
        clientName: event.clientName,
        eventType: event.eventType,
        dueDate: event.dueDate,
      });
    }
  }, [isOpen, event]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.petName.trim()) newErrors.petName = 'Nombre de mascota requerido';
    if (!formData.clientName.trim()) newErrors.clientName = 'Nombre de cliente requerido';
    if (!formData.eventType) newErrors.eventType = 'Tipo de evento requerido';
    if (!formData.dueDate) newErrors.dueDate = 'Fecha de vencimiento requerida';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !event) return;

    const dueDate = new Date(formData.dueDate);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const daysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const status = daysUntilDue < 0 ? 'OVERDUE' : 'UPCOMING';

    const updatedEvent: PreventiveCareEvent = {
      ...event,
      petName: formData.petName,
      clientName: formData.clientName,
      eventType: formData.eventType,
      dueDate: formData.dueDate,
      status,
      daysUntilDue: Math.abs(daysUntilDue),
    };

    onSuccess(updatedEvent);
    onClose();
  };

  if (!isOpen || !event) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-primary-600 via-primary-600 to-primary-700 px-6 py-4 text-white flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <MdPets className="w-6 h-6" />
            <div>
              <h2 className="text-lg font-bold">Editar Evento Preventivo</h2>
              <p className="text-xs text-primary-100">Actualiza los detalles del evento</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-primary-500 rounded-lg transition">
            <MdClose className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Pet Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Nombre de Mascota</label>
            <input
              type="text"
              value={formData.petName}
              onChange={(e) => setFormData({ ...formData, petName: e.target.value })}
              className={`w-full px-4 py-2 rounded-lg border-2 transition focus:outline-none ${
                errors.petName ? 'border-critical-500 bg-critical-50' : 'border-slate-200 focus:border-primary-500'
              }`}
            />
            {errors.petName && <p className="text-xs text-critical-600 mt-1">{errors.petName}</p>}
          </div>

          {/* Client Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Nombre del Cliente</label>
            <input
              type="text"
              value={formData.clientName}
              onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
              className={`w-full px-4 py-2 rounded-lg border-2 transition focus:outline-none ${
                errors.clientName ? 'border-critical-500 bg-critical-50' : 'border-slate-200 focus:border-primary-500'
              }`}
            />
            {errors.clientName && <p className="text-xs text-critical-600 mt-1">{errors.clientName}</p>}
          </div>

          {/* Event Type */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Tipo de Evento</label>
            <select
              value={formData.eventType}
              onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
              className={`w-full px-4 py-2 rounded-lg border-2 transition focus:outline-none ${
                errors.eventType ? 'border-critical-500 bg-critical-50' : 'border-slate-200 focus:border-primary-500'
              }`}
            >
              <option value="">Seleccionar tipo</option>
              {EVENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            {errors.eventType && <p className="text-xs text-critical-600 mt-1">{errors.eventType}</p>}
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
              <MdCalendarToday className="w-4 h-4" />
              Fecha de Vencimiento
            </label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className={`w-full px-4 py-2 rounded-lg border-2 transition focus:outline-none ${
                errors.dueDate ? 'border-critical-500 bg-critical-50' : 'border-slate-200 focus:border-primary-500'
              }`}
            />
            {errors.dueDate && <p className="text-xs text-critical-600 mt-1">{errors.dueDate}</p>}
          </div>
        </form>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-slate-200">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition"
          >
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
};
