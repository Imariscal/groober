'use client';

import { useState } from 'react';
import { MdEdit, MdDone, MdMoreVert, MdPerson, MdPause, MdPhone, MdEmail, MdLocationOn } from 'react-icons/md';


interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  city?: string;
  country?: string;
  responsable?: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  plan?: string;
  createdAt?: string;
}

interface ClientsTableProps {
  clients: Client[];
  isLoading?: boolean;
  onView?: (client: Client) => void;
  onEdit?: (client: Client) => void;
  onSuspend?: (client: Client) => void;
  onAssignOwner?: (client: Client) => void;
}

export function ClientsTable({ clients, isLoading = false, onView, onEdit, onSuspend, onAssignOwner }: ClientsTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const statusConfig = {
    ACTIVE: {
      bg: 'bg-green-50',
      badge: 'bg-green-100 text-green-700',
      label: 'Activo',
      icon: '🟢',
    },
    SUSPENDED: {
      bg: 'bg-red-50',
      badge: 'bg-red-100 text-red-700',
      label: 'Suspendido',
      icon: '🔴',
    },
    DELETED: {
      bg: 'bg-gray-50',
      badge: 'bg-gray-100 text-gray-700',
      label: 'Eliminado',
      icon: '⚫',
    },
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className="text-center py-16">
        <MdPerson className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg font-medium">No hay clientes registrados</p>
        <p className="text-gray-400 text-sm mt-1">Agrega un nuevo cliente para comenzar</p>
      </div>
    );
  }

  // Estadísticas
  const totalActive = clients.filter((c) => c.status === 'ACTIVE').length;
  const totalSuspended = clients.filter((c) => c.status === 'SUSPENDED').length;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Total Clientes</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">{clients.length}</p>
            </div>
            <MdPerson className="w-10 h-10 text-blue-400" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Activos</p>
              <p className="text-2xl font-bold text-green-900 mt-1">{totalActive}</p>
            </div>
            <span className="text-3xl">🟢</span>
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-600 text-sm font-medium">Suspendidos</p>
              <p className="text-2xl font-bold text-red-900 mt-1">{totalSuspended}</p>
            </div>
            <span className="text-3xl">🔴</span>
          </div>
        </div>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {clients.map((client) => (
          (() => {
            const config = statusConfig[client.status || 'ACTIVE'];
            return (
              <div
                key={client.id}
                className={`${config.bg} border-2 border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all duration-300 hover:border-blue-300`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-lg line-clamp-1">
                        {client.name}
                      </h3>
                      <p className="text-xs text-gray-500">
                        ID: {client.id.slice(0, 8)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${config.badge}`}>
                    <span>{config.icon}</span>
                    {config.label}
                  </span>
                  <div className="relative">
                    <button
                      onClick={() => setExpandedId(expandedId === client.id ? null : client.id)}
                      className="p-2 text-gray-600 hover:bg-white rounded-lg transition-colors"
                    >
                      <MdMoreVert className="w-5 h-5" />
                    </button>
                    {expandedId === client.id && (
                      <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-xl z-10">
                        <button
                          onClick={() => {
                            onView?.(client);
                            setExpandedId(null);
                          }}
                          className="w-full px-4 py-3 text-left text-blue-600 hover:bg-blue-50 transition flex items-center gap-3 text-sm font-medium border-b border-gray-100"
                        >
                          <MdPerson className="w-4 h-4" /> Ver
                        </button>
                        <button
                          onClick={() => {
                            onEdit?.(client);
                            setExpandedId(null);
                          }}
                          className="w-full px-4 py-3 text-left text-yellow-600 hover:bg-yellow-50 transition flex items-center gap-3 text-sm font-medium border-b border-gray-100"
                        >
                          <MdEdit className="w-4 h-4" /> Editar
                        </button>
                        <button
                          onClick={() => {
                            onSuspend?.(client);
                            setExpandedId(null);
                          }}
                          className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 transition flex items-center gap-3 text-sm font-medium"
                        >
                          <MdPause className="w-4 h-4" /> Suspender
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {/* Info Grid */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <MdPhone className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <span className="text-gray-700 font-medium">{client.phone}</span>
                </div>
                {client.email && (
                  <div className="flex items-center gap-3 text-sm">
                    <MdEmail className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-gray-600 truncate">{client.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm">
                  <MdLocationOn className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <span className="text-gray-700 font-medium">
                    {client.city || 'Sin ciudad'}{' '}
                    {client.country && (
                      <span className="text-gray-500">({client.country})</span>
                    )}
                  </span>
                </div>
                {client.responsable && (
                  <div className="flex items-center gap-3 text-sm pt-2 border-t border-gray-300">
                    <MdPerson className="w-5 h-5 text-purple-600 flex-shrink-0" />
                    <span className="text-gray-700">{client.responsable}</span>
                  </div>
                )}
              </div>
              {/* Footer */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-300">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Plan: {client.plan || 'N/A'}
                </span>
                {client.status === 'ACTIVE' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onAssignOwner?.(client)}
                      title="Asignar Admin"
                      className="p-2 text-blue-600 hover:bg-blue-200 rounded-lg transition"
                    >
                      <MdPerson className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => onEdit?.(client)}
                      title="Editar"
                      className="p-2 text-yellow-600 hover:bg-yellow-200 rounded-lg transition"
                    >
                      <MdEdit className="w-5 h-5" />
                    </button>
                  </div>
                )}
                </div>
              </div>
            );
          })()
        ))}
      </div>
    </div>
  );
}
