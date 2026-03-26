'use client';

import React, { useCallback, useState } from 'react';
import {
  FiChevronDown,
  FiClock,
  FiAlertCircle,
  FiPhone,
  FiMessageSquare,
  FiFilter,
  FiChevronRight,
  FiRefreshCw,
  FiSearch,
} from 'react-icons/fi';
import { MdMessage } from 'react-icons/md';
import { useNotificationStore, type NotificationFilters } from '@/store/notificationStore';
import NotificationFiltersPanel from './NotificationFiltersPanel';
import NotificationDetailDrawer from './NotificationDetailDrawer';
import NotificationQueue from './NotificationQueue';
import NotificationErrors from './NotificationErrors';
import { format } from 'date-fns';

export default function NotificationsPage() {
  const {
    notifications,
    queue,
    errors,
    activeTab,
    page,
    totalPages,
    isLoading,
    total,
    setActiveTab,
    setPage,
    fetchNotifications,
    fetchQueue,
    fetchErrors,
    fetchNotificationDetail,
    selectedNotification,
  } = useNotificationStore();

  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [filters, setFilters] = useState<NotificationFilters>({
    page: 1,
    limit: 20,
  });

  // Load data on tab change
  React.useEffect(() => {
    if (activeTab === 'history') {
      fetchNotifications(filters);
    } else if (activeTab === 'queue') {
      fetchQueue();
    } else if (activeTab === 'errors') {
      fetchErrors();
    }
  }, [activeTab]);

  const handleFilterChange = useCallback((newFilters: NotificationFilters) => {
    setFilters({ ...newFilters, page: 1 });
    fetchNotifications({ ...newFilters, page: 1 });
  }, [fetchNotifications]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchNotifications({ ...filters, page: newPage });
  };

  const handleRefresh = useCallback(() => {
    if (activeTab === 'history') {
      fetchNotifications(filters);
    } else if (activeTab === 'queue') {
      fetchQueue();
    } else if (activeTab === 'errors') {
      fetchErrors();
    }
  }, [activeTab, filters, fetchNotifications, fetchQueue, fetchErrors]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'read':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'sent':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getDirectionIcon = (direction: string) => {
    return direction === 'inbound' ? (
      <FiChevronDown className="w-4 h-4 text-blue-500" />
    ) : (
      <FiChevronRight className="w-4 h-4 text-green-500" />
    );
  };

  const stats = {
    total,
    queue: queue.length,
    errors: errors.length,
  };

  return (
    <div className="min-h-screen bg-slate-50 -m-6 lg:-m-4">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <MdMessage className="text-blue-600 text-3xl" />
              Notificaciones WhatsApp
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Monitoreo y observabilidad de mensajería WhatsApp
            </p>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            title="Actualizar"
          >
            <FiRefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Stats Bar */}
        <div className="flex flex-wrap gap-3 mt-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-sm">
            <FiClock className="text-slate-500" />
            <span className="text-slate-600">Total:</span>
            <span className="font-semibold">{stats.total}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-50 rounded-lg text-sm">
            <FiMessageSquare className="text-yellow-600" />
            <span className="text-yellow-700">En Cola:</span>
            <span className="font-semibold text-yellow-700">{stats.queue}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 rounded-lg text-sm">
            <FiAlertCircle className="text-red-600" />
            <span className="text-red-700">Errores:</span>
            <span className="font-semibold text-red-700">{stats.errors}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="flex gap-6">
          {/* Left Panel - Filters */}
          <div className="flex-shrink-0 w-80">
            <div className="space-y-4 w-80">
              {/* Search */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2">
                  <FiSearch className="text-slate-400 w-4 h-4 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Buscar notificación..."
                    className="flex-1 border-none focus:outline-none focus:ring-0 text-sm cursor-not-allowed"
                    disabled
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FiFilter className="text-slate-500" />
                  <span className="text-sm font-medium text-slate-700">Filtros</span>
                </div>
                <NotificationFiltersPanel onApply={handleFilterChange} />
              </div>
            </div>
          </div>

          {/* Right Panel - Content */}
          <div className="flex-1">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              {/* Tab Navigation */}
              <div className="px-6 py-4 border-b border-slate-200">
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={() => setActiveTab('history')}
                    className={`py-2 px-4 font-medium text-sm rounded-t-lg transition ${
                      activeTab === 'history'
                        ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center space-x-2 whitespace-nowrap">
                      <FiClock className="w-4 h-4" />
                      <span>Historial</span>
                      {total > 0 && (
                        <span className="ml-2 bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs font-medium">
                          {total}
                        </span>
                      )}
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab('queue')}
                    className={`py-2 px-4 font-medium text-sm rounded-t-lg transition ${
                      activeTab === 'queue'
                        ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center space-x-2 whitespace-nowrap">
                      <FiMessageSquare className="w-4 h-4" />
                      <span>Cola</span>
                      {queue.length > 0 && (
                        <span className="ml-2 bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-xs font-medium">
                          {queue.length}
                        </span>
                      )}
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab('errors')}
                    className={`py-2 px-4 font-medium text-sm rounded-t-lg transition ${
                      activeTab === 'errors'
                        ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center space-x-2 whitespace-nowrap">
                      <FiAlertCircle className="w-4 h-4" />
                      <span>Errores</span>
                      {errors.length > 0 && (
                        <span className="ml-2 bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-medium">
                          {errors.length}
                        </span>
                      )}
                    </div>
                  </button>
                </div>
              </div>

              {/* Content Area */}
              {activeTab === 'history' && (
                <div>
                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                            Fecha/Hora
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                            Dir.
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                            Cliente
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                            Teléfono
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                            Tipo
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                            Mensaje
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                            Estado
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {isLoading ? (
                          <tr>
                            <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                              <div className="inline-flex items-center gap-2">
                                <div className="animate-spin">
                                  <FiRefreshCw className="w-5 h-5" />
                                </div>
                                <span>Cargando...</span>
                              </div>
                            </td>
                          </tr>
                        ) : notifications.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                              <div className="inline-flex items-center gap-2">
                                <FiMessageSquare className="w-5 h-5" />
                                <span>Sin notificaciones</span>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          notifications.map((notification) => (
                            <tr
                              key={notification.id}
                              className={`hover:bg-slate-50 cursor-pointer transition ${
                                selectedRowId === notification.id ? 'bg-blue-50' : ''
                              }`}
                              onClick={() => {
                                setSelectedRowId(notification.id);
                                fetchNotificationDetail(notification.id);
                              }}
                            >
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                {format(new Date(notification.dateTime), 'dd/MM/yyyy HH:mm')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {getDirectionIcon(notification.direction)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                {notification.clientName}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                <div className="flex items-center space-x-2">
                                  <FiPhone className="w-4 h-4 text-slate-400" />
                                  <span>{notification.phoneNumber}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                {notification.messageType}
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-900 max-w-xs truncate">
                                {notification.messagePreview}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(notification.status)}`}>
                                  {notification.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <button className="text-blue-600 hover:text-blue-900 font-medium hover:underline">
                                  Ver
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-center gap-2">
                      <button
                        onClick={() => handlePageChange(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className="px-3 py-1 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                      >
                        Anterior
                      </button>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const startPage = Math.max(1, page - 2);
                        return startPage + i;
                      }).map((p) => (
                        <button
                          key={p}
                          onClick={() => handlePageChange(p)}
                          className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                            p === page
                              ? 'bg-blue-600 text-white'
                              : 'border border-slate-300 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                      <button
                        onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                        disabled={page === totalPages}
                        className="px-3 py-1 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                      >
                        Siguiente
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Queue Tab */}
              {activeTab === 'queue' && <NotificationQueue items={queue} />}

              {/* Errors Tab */}
              {activeTab === 'errors' && <NotificationErrors items={errors} />}
            </div>
          </div>
        </div>
      </div>

      {/* Detail Drawer */}
      {selectedNotification && (
        <NotificationDetailDrawer
          notification={selectedNotification}
          onClose={() => {
            setSelectedRowId(null);
          }}
        />
      )}
    </div>
  );
}
