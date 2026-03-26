'use client';

import React from 'react';
import { MdEdit, MdDelete } from 'react-icons/md';

interface PreventiveCareEvent {
  id: string;
  petName: string;
  clientName: string;
  eventType: string;
  dueDate: string;
  status: 'UPCOMING' | 'OVERDUE';
  daysUntilDue?: number;
}

interface PreventiveCareTableProps {
  events: PreventiveCareEvent[];
  onEdit: (event: PreventiveCareEvent) => void;
  onDelete: (event: PreventiveCareEvent) => void;
}

export const PreventiveCareTable: React.FC<PreventiveCareTableProps> = ({
  events,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left font-semibold text-gray-700 uppercase text-xs tracking-wide">Mascota</th>
            <th className="px-6 py-3 text-left font-semibold text-gray-700 uppercase text-xs tracking-wide">Cliente</th>
            <th className="px-6 py-3 text-left font-semibold text-gray-700 uppercase text-xs tracking-wide">Evento</th>
            <th className="px-6 py-3 text-left font-semibold text-gray-700 uppercase text-xs tracking-wide">Fecha</th>
            <th className="px-6 py-3 text-left font-semibold text-gray-700 uppercase text-xs tracking-wide">Estado</th>
            <th className="px-6 py-3 text-right font-semibold text-gray-700 uppercase text-xs tracking-wide">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => {
            const isOverdue = event.status === 'OVERDUE';
            const statusColor = isOverdue ? 'critical' : 'success';
            const hoverBg = isOverdue ? 'hover:bg-critical-50/30' : 'hover:bg-success-50/30';
            const borderLeft = isOverdue ? 'border-l-critical-600' : 'border-l-success-600';

            return (
              <tr key={event.id} className={`border-l-4 ${borderLeft} ${hoverBg} transition group`}>
                <td className="px-6 py-4 font-semibold text-slate-900">{event.petName}</td>
                <td className="px-6 py-4 text-slate-700">{event.clientName}</td>
                <td className="px-6 py-4 text-slate-700">{event.eventType}</td>
                <td className="px-6 py-4 text-slate-700">{new Date(event.dueDate).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-${statusColor}-100 text-${statusColor}-700`}
                  >
                    {isOverdue ? '⚠ Vencido' : '✓ Próximo'}
                  </span>
                </td>
                <td className="px-6 py-4 flex items-center justify-end gap-2">
                  <button
                    onClick={() => onEdit(event)}
                    className="opacity-0 group-hover:opacity-100 transition p-2 hover:bg-primary-100 text-primary-600 rounded-lg"
                  >
                    <MdEdit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(event)}
                    className="opacity-0 group-hover:opacity-100 transition p-2 hover:bg-critical-100 text-critical-600 rounded-lg"
                  >
                    <MdDelete className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
