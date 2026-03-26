'use client';

import React from 'react';
import { Appointment } from '@/types';
import { MdAccessTime, MdPerson, MdPets } from 'react-icons/md';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface UpcomingAppointmentsProps {
  todayAppointments: Appointment[];
  tomorrowAppointments: Appointment[];
}

export const UpcomingAppointments: React.FC<UpcomingAppointmentsProps> = ({
  todayAppointments,
  tomorrowAppointments,
}) => {
  const allAppointments = [
    ...todayAppointments.map((apt) => ({ ...apt, section: 'today' as const })),
    ...tomorrowAppointments.map((apt) => ({ ...apt, section: 'tomorrow' as const })),
  ];

  if (allAppointments.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Próximas Citas</h3>
        <p className="text-center text-slate-500 py-8">No hay citas programadas para hoy o mañana</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 flex flex-col max-h-96">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Próximas Citas (Hoy y Mañana)</h3>

      <div className="flex-1 overflow-y-auto">
        {todayAppointments.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-slate-700 mb-3 pb-2 border-b border-slate-200 sticky top-0 bg-white">
              📅 Hoy
            </h4>
            <div className="space-y-3">
              {todayAppointments.map((apt) => (
                <AppointmentRow key={apt.id} appointment={apt} />
              ))}
            </div>
          </div>
        )}

        {tomorrowAppointments.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-3 pb-2 border-b border-slate-200 sticky top-0 bg-white">
              📅 Mañana
            </h4>
            <div className="space-y-3">
              {tomorrowAppointments.map((apt) => (
                <AppointmentRow key={apt.id} appointment={apt} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const AppointmentRow: React.FC<{ appointment: Appointment }> = ({ appointment }) => {
  // Soportar tanto formato de Appointment type como formato del reporte
  const time = (appointment as any).time || '-';
  const clientName = (appointment as any).clientName || 'Cliente';
  const petName = (appointment as any).petName || 'Mascota';
  const status = ((appointment as any).status || 'SCHEDULED') as 'SCHEDULED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'IN_PROGRESS' | 'NO_SHOW' | 'UNATTENDED';

  const statusColor = {
    SCHEDULED: 'bg-blue-100 text-blue-800',
    CONFIRMED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
    COMPLETED: 'bg-slate-100 text-slate-800',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
    NO_SHOW: 'bg-orange-100 text-orange-800',
    UNATTENDED: 'bg-red-100 text-red-800',
  }[status];

  const statusLabel = {
    SCHEDULED: 'Programada',
    CONFIRMED: 'Confirmada',
    CANCELLED: 'Cancelada',
    COMPLETED: 'Completada',
    IN_PROGRESS: 'En progreso',
    NO_SHOW: 'No asistió',
    UNATTENDED: 'Sin atender',
  }[status];

  return (
    <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition">
      <div className="flex-shrink-0 flex items-center text-slate-400">
        <MdAccessTime className="w-5 h-5" />
      </div>
      <div className="flex-grow min-w-0">
        <div className="flex items-center gap-3 mb-2">
          <span className="font-semibold text-slate-900">{time}</span>
          <span className={`text-xs font-medium px-2 py-1 rounded ${statusColor}`}>{statusLabel}</span>
        </div>
        <div className="text-sm text-slate-600 space-y-1">
          <div className="flex items-center gap-2">
            <MdPerson className="w-4 h-4" />
            <span>{clientName}</span>
          </div>
          <div className="flex items-center gap-2">
            <MdPets className="w-4 h-4" />
            <span>{petName}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
