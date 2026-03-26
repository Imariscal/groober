'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/dashboard/page-header/PageHeader';
import { MdDelete, MdSend, MdSchedule, MdSearch, MdAdd } from 'react-icons/md';
import { useClinicTimezone } from '@/hooks/useClinicTimezone';
import { utcToZonedTime, formatInTimeZone } from 'date-fns-tz';
import toast from 'react-hot-toast';

interface ClinicalReminder {
  id: string;
  clinicId: string;
  clinicName: string;
  reminderType: 'adeudo' | 'vencimiento' | 'otro';
  description: string;
  amount?: number;
  dueDate: string;
  status: 'pending' | 'sent' | 'confirmed';
  sentAt?: string;
  createdAt: string;
}

// Mock data - TODO: Fetch from API
const mockReminders: ClinicalReminder[] = [
  {
    id: '1',
    clinicId: 'clinic-1',
    clinicName: 'Clínica Veterinaria VibraTest',
    reminderType: 'adeudo',
    description: 'Pago pendiente de suscripción',
    amount: 299,
    dueDate: '2025-03-01',
    status: 'pending',
    createdAt: '2025-02-25',
  },
  {
    id: '2',
    clinicId: 'clinic-2',
    clinicName: 'Ignacio Mariscal',
    reminderType: 'vencimiento',
    description: 'Licencia de software vence próximamente',
    dueDate: '2025-03-15',
    status: 'sent',
    sentAt: '2025-02-24T10:30:00Z',
    createdAt: '2025-02-24',
  },
  {
    id: '3',
    clinicId: 'clinic-3',
    clinicName: 'Clínica Premium',
    reminderType: 'adeudo',
    description: 'Cuota mensual pendiente',
    amount: 999,
    dueDate: '2025-02-28',
    status: 'confirmed',
    sentAt: '2025-02-20T14:00:00Z',
    createdAt: '2025-02-20',
  },
  {
    id: '4',
    clinicId: 'clinic-4',
    clinicName: 'Veterinaria Central',
    reminderType: 'otro',
    description: 'Actualización de datos de contacto requerida',
    dueDate: '2025-03-10',
    status: 'pending',
    createdAt: '2025-02-25',
  },
];

const reminderTypeLabels: Record<string, string> = {
  adeudo: '💰 Adeudo',
  vencimiento: '⏰ Vencimiento',
  otro: '📋 Otro',
};

const reminderTypeColors: Record<string, string> = {
  adeudo: 'bg-red-100 text-red-800',
  vencimiento: 'bg-orange-100 text-orange-800',
  otro: 'bg-blue-100 text-blue-800',
};

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendiente', color: 'bg-gray-100 text-gray-800' },
  sent: { label: 'Enviado', color: 'bg-blue-100 text-blue-800' },
  confirmed: { label: 'Confirmado', color: 'bg-green-100 text-green-800' },
};

export default function RemindersPage() {
  const clinicTimezone = useClinicTimezone();
  
  const [reminders, setReminders] = useState<ClinicalReminder[]>(mockReminders);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Get unique types
  const reminderTypes = useMemo(() => {
    return ['all', ...new Set(reminders.map(r => r.reminderType))];
  }, [reminders]);

  // Filter reminders
  const filteredReminders = useMemo(() => {
    return reminders.filter(reminder => {
      const matchSearch = 
        reminder.clinicName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reminder.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = filterType === 'all' || reminder.reminderType === filterType;
      const matchStatus = filterStatus === 'all' || reminder.status === filterStatus;
      return matchSearch && matchType && matchStatus;
    });
  }, [reminders, searchTerm, filterType, filterStatus]);

  const handleSendReminder = (reminderId: string) => {
    setReminders(reminders.map(r => 
      r.id === reminderId 
        ? { ...r, status: 'sent', sentAt: new Date().toISOString() }
        : r
    ));
    toast.success('Recordatorio enviado a la clínica');
  };

  const handleDeleteReminder = (reminderId: string) => {
    setReminders(reminders.filter(r => r.id !== reminderId));
    toast.success('Recordatorio eliminado');
  };

  // Stats
  const stats = {
    total: reminders.length,
    pending: reminders.filter(r => r.status === 'pending').length,
    sent: reminders.filter(r => r.status === 'sent').length,
  };

  const pageHeader = {
    title: 'Recordatorios a Clínicas',
    subtitle: 'Gestiona recordatorios de adeudos y cuentas por vencer',
    breadcrumbs: [
      { label: 'Plataforma', href: '/platform/dashboard' },
      { label: 'Recordatorios' },
    ],
    primaryAction: {
      label: 'Nuevo Recordatorio',
      onClick: () => setShowCreateModal(true),
      icon: <MdAdd />,
    },
  };

  return (
    <>
      <PageHeader {...pageHeader} />
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <p className="text-sm text-slate-600 mb-1">Total</p>
          <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <p className="text-sm text-slate-600 mb-1">Pendientes</p>
          <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <p className="text-sm text-slate-600 mb-1">Enviados</p>
          <p className="text-2xl font-bold text-blue-600">{stats.sent}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por clínica o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="flex gap-3 flex-wrap">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {reminderTypes.map(type => (
              <option key={type} value={type}>
                {type === 'all' ? 'Todos los tipos' : reminderTypeLabels[type]}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">Todos los estados</option>
            <option value="pending">Pendiente</option>
            <option value="sent">Enviado</option>
            <option value="confirmed">Confirmado</option>
          </select>

          <div className="ml-auto text-sm text-slate-600">
            Mostrando <span className="font-semibold">{filteredReminders.length}</span> de{' '}
            <span className="font-semibold">{reminders.length}</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-6 py-3 text-left font-semibold text-slate-900">Clínica</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-900">Tipo</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-900">Descripción</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-900">Monto</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-900">Vencimiento</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-900">Estado</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-900">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredReminders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    No hay recordatorios que coincidan con los filtros
                  </td>
                </tr>
              ) : (
                filteredReminders.map((reminder) => (
                  <tr key={reminder.id} className="border-b border-slate-200 hover:bg-slate-50 transition">
                    <td className="px-6 py-4 font-medium text-slate-900">{reminder.clinicName}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${reminderTypeColors[reminder.reminderType]}`}>
                        {reminderTypeLabels[reminder.reminderType]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-700">{reminder.description}</td>
                    <td className="px-6 py-4">
                      {reminder.amount ? (
                        <span className="font-semibold text-slate-900">${reminder.amount}</span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {formatInTimeZone(new Date(reminder.dueDate), clinicTimezone, 'dd/MM/yyyy')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusLabels[reminder.status].color}`}>
                        {statusLabels[reminder.status].label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {reminder.status === 'pending' && (
                          <button
                            onClick={() => handleSendReminder(reminder.id)}
                            className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                            title="Enviar"
                          >
                            <MdSend className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteReminder(reminder.id)}
                          className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"
                          title="Eliminar"
                        >
                          <MdDelete className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* TODO: Implement create/edit reminder modal */}
    </>
  );
}
