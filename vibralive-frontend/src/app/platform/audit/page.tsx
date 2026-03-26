'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/dashboard/page-header/PageHeader';
import { MdDownload, MdSearch, MdCheck, MdClose, MdFilterList } from 'react-icons/md';
import { useClinicTimezone } from '@/hooks/useClinicTimezone';
import { utcToZonedTime, formatInTimeZone } from 'date-fns-tz';
import toast from 'react-hot-toast';

interface AuditLogEntry {
  id: string;
  actorId: string;
  actorName: string;
  actorType: 'platform_user' | 'clinic_user';
  action: string;
  entityType: string;
  entityId: string;
  status: 'SUCCESS' | 'FAILURE';
  errorMessage?: string;
  createdAt: string;
}

// Mock data - TODO: Fetch from API
const mockLogs: AuditLogEntry[] = [
  {
    id: '1',
    actorId: 'user1',
    actorName: 'Admin Principal',
    actorType: 'platform_user',
    action: 'CREATE',
    entityType: 'Clinic',
    entityId: 'clinic-123',
    status: 'SUCCESS',
    createdAt: '2025-02-25T14:30:00Z',
  },
  {
    id: '2',
    actorId: 'user2',
    actorName: 'Dr. García',
    actorType: 'clinic_user',
    action: 'UPDATE',
    entityType: 'Appointment',
    entityId: 'apt-456',
    status: 'SUCCESS',
    createdAt: '2025-02-25T13:15:00Z',
  },
  {
    id: '3',
    actorId: 'user1',
    actorName: 'Admin Principal',
    actorType: 'platform_user',
    action: 'DELETE',
    entityType: 'User',
    entityId: 'user-789',
    status: 'FAILURE',
    errorMessage: 'Usuario tiene clínicas asociadas',
    createdAt: '2025-02-25T12:00:00Z',
  },
  {
    id: '4',
    actorId: 'user3',
    actorName: 'Secretaria',
    actorType: 'clinic_user',
    action: 'CREATE',
    entityType: 'Client',
    entityId: 'client-101',
    status: 'SUCCESS',
    createdAt: '2025-02-25T11:45:00Z',
  },
  {
    id: '5',
    actorId: 'user1',
    actorName: 'Admin Principal',
    actorType: 'platform_user',
    action: 'SUSPEND',
    entityType: 'Clinic',
    entityId: 'clinic-202',
    status: 'SUCCESS',
    createdAt: '2025-02-25T10:20:00Z',
  },
];

const actionColors: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-800',
  UPDATE: 'bg-blue-100 text-blue-800',
  DELETE: 'bg-red-100 text-red-800',
  SUSPEND: 'bg-orange-100 text-orange-800',
  ACTIVATE: 'bg-green-100 text-green-800',
};

export default function AuditPage() {
  const clinicTimezone = useClinicTimezone();
  
  const [logs, setLogs] = useState<AuditLogEntry[]>(mockLogs);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'SUCCESS' | 'FAILURE'>('all');
  const [actionTypeFilter, setActionTypeFilter] = useState<'all' | string>('all');

  // Get unique action types
  const actionTypes = useMemo(() => {
    return ['all', ...new Set(logs.map(log => log.action))];
  }, [logs]);

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchSearch = 
        log.actorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entityType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entityId.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchStatus = statusFilter === 'all' || log.status === statusFilter;
      const matchAction = actionTypeFilter === 'all' || log.action === actionTypeFilter;

      return matchSearch && matchStatus && matchAction;
    });
  }, [logs, searchTerm, statusFilter, actionTypeFilter]);

  const handleExport = () => {
    const csv = [
      ['ID', 'Actor', 'Acción', 'Entidad', 'Estado', 'Fecha'],
      ...filteredLogs.map(log => [
        log.id,
        log.actorName,
        log.action,
        `${log.entityType}#${log.entityId}`,
        log.status,
        formatInTimeZone(new Date(log.createdAt), clinicTimezone, 'yyyy-MM-dd HH:mm:ss'),
      ]),
    ]
    ]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const link = document.createElement('a');
    link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
    link.download = `auditoría-${formatInTimeZone(new Date(), clinicTimezone, 'yyyy-MM-dd')}.csv`;
    link.click();
    toast.success('Auditoría exportada');
  };

  const pageHeader = {
    title: 'Auditoría',
    subtitle: 'Registro de todas las acciones realizadas en la plataforma',
    breadcrumbs: [
      { label: 'Plataforma', href: '/platform/dashboard' },
      { label: 'Auditoría' },
    ],
    primaryAction: {
      label: 'Exportar',
      onClick: handleExport,
      icon: <MdDownload />,
    },
  };

  return (
    <>
      <PageHeader {...pageHeader} />
      {/* Filters Bar */}
      <div className="mb-6 space-y-4">
        {/* Search */}
        <div className="flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-2.5">
          <MdSearch className="text-slate-400 w-5 h-5 flex-shrink-0" />
          <input
            type="text"
            placeholder="Buscar por usuario, acción, entidad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 border-none text-sm focus:outline-none focus:ring-0"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700">Estado:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">Todos</option>
              <option value="SUCCESS">Éxito</option>
              <option value="FAILURE">Error</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700">Acción:</span>
            <select
              value={actionTypeFilter}
              onChange={(e) => setActionTypeFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {actionTypes.map(action => (
                <option key={action} value={action}>
                  {action === 'all' ? 'Todas' : action}
                </option>
              ))}
            </select>
          </div>

          <div className="ml-auto text-sm text-slate-600">
            Mostrando <span className="font-semibold">{filteredLogs.length}</span> de{' '}
            <span className="font-semibold">{logs.length}</span> registros
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-6 py-3 text-left font-semibold text-slate-900">Usuario</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-900">Acción</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-900">Entidad</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-900">Estado</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-900">Fecha & Hora</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-900">Detalles</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No hay registros que coincidan con los filtros
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-200 hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-slate-900">{log.actorName}</p>
                        <p className="text-xs text-slate-500">{log.actorType === 'platform_user' ? 'Admin' : 'Clínica'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${actionColors[log.action] || 'bg-gray-100 text-gray-800'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-slate-900">{log.entityType}</p>
                        <p className="text-xs text-slate-500">{log.entityId}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {log.status === 'SUCCESS' ? (
                          <>
                            <MdCheck className="w-5 h-5 text-green-600" />
                            <span className="text-green-700 font-medium">Éxito</span>
                          </>
                        ) : (
                          <>
                            <MdClose className="w-5 h-5 text-red-600" />
                            <span className="text-red-700 font-medium">Error</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      {formatInTimeZone(new Date(log.createdAt), clinicTimezone, 'dd/MM/yyyy HH:mm:ss')}
                    </td>
                    <td className="px-6 py-4">
                      {log.errorMessage && (
                        <button
                          className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                          title={log.errorMessage}
                        >
                          Ver error
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
