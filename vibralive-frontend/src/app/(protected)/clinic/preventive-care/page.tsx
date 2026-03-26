'use client';

import React, { useState, useMemo } from 'react';
import { MdAdd, MdCalendarToday } from 'react-icons/md';
import { FiFilter, FiSearch, FiAlertCircle, FiRefreshCw } from 'react-icons/fi';
import { CreatePreventiveCareModal } from '@/components/CreatePreventiveCareModal';
import { EditPreventiveCareModal } from '@/components/EditPreventiveCareModal';
import { DeletePreventiveCareConfirmation } from '@/components/DeletePreventiveCareConfirmation';
import { PreventiveCareCard } from '@/components/platform/PreventiveCareCard';
import { PreventiveCareTable } from '@/components/platform/PreventiveCareTable';
import toast from 'react-hot-toast';

interface PreventiveCareEvent {
  id: string;
  petName: string;
  clientName: string;
  eventType: string;
  dueDate: string;
  status: 'UPCOMING' | 'OVERDUE';
  daysUntilDue?: number;
}

type ViewMode = 'cards' | 'table';

export default function PreventiveCarePageV2() {
  // ==================== STATE ====================
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [isLoading, setIsLoading] = useState(false);

  // Modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<PreventiveCareEvent | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deletingEvent, setDeletingEvent] = useState<PreventiveCareEvent | null>(null);

  // Mock data
  const [events, setEvents] = useState<PreventiveCareEvent[]>([
    { id: '1', petName: 'Max', clientName: 'Juan García', eventType: 'Vacunación', dueDate: '2026-03-17', status: 'UPCOMING', daysUntilDue: 7 },
    { id: '2', petName: 'Luna', clientName: 'María López', eventType: 'Desparasitación', dueDate: '2026-03-13', status: 'UPCOMING', daysUntilDue: 3 },
    { id: '3', petName: 'Charlie', clientName: 'Carlos Martínez', eventType: 'Chequeo', dueDate: '2026-03-05', status: 'OVERDUE', daysUntilDue: 5 },
    { id: '4', petName: 'Bella', clientName: 'Ana Rodríguez', eventType: 'Limpieza Dental', dueDate: '2026-03-20', status: 'UPCOMING', daysUntilDue: 10 },
  ]);

  // ==================== HANDLERS ====================
  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success('Eventos actualizados');
    } catch (error) {
      toast.error('Error al actualizar eventos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateEvent = (newEvent: PreventiveCareEvent) => {
    setEvents([...events, newEvent]);
    toast.success('Evento creado exitosamente');
  };

  const handleEditEvent = (updatedEvent: PreventiveCareEvent) => {
    setEvents(events.map(e => e.id === updatedEvent.id ? updatedEvent : e));
    toast.success('Evento actualizado exitosamente');
  };

  const handleDeleteEvent = (event: PreventiveCareEvent) => {
    setDeletingEvent(event);
  };

  const handleConfirmDelete = () => {
    if (deletingEvent) {
      setEvents(events.filter(e => e.id !== deletingEvent.id));
      setDeletingEvent(null);
      toast.success('Evento eliminado');
    }
  };

  // ==================== FILTERING ====================
  const filteredEvents = useMemo(() => {
    let filtered = events;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(e =>
        e.petName.toLowerCase().includes(term) ||
        e.clientName.toLowerCase().includes(term) ||
        e.eventType.toLowerCase().includes(term)
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(e => e.status.toLowerCase() === filterStatus.toLowerCase());
    }

    return filtered;
  }, [events, searchTerm, filterStatus]);

  // ==================== STATISTICS ====================
  const stats = useMemo(() => {
    return {
      total: events.length,
      upcoming: events.filter(e => e.status === 'UPCOMING').length,
      overdue: events.filter(e => e.status === 'OVERDUE').length,
    };
  }, [events]);

  // ==================== RENDER ====================
  return (
    <div className="min-h-screen bg-slate-50 -m-6 lg:-m-4">
      
      {/* MODALES */}
      <CreatePreventiveCareModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateEvent}
      />
      <EditPreventiveCareModal
        isOpen={isEditModalOpen}
        event={editingEvent}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingEvent(null);
        }}
        onSuccess={handleEditEvent}
      />
      <DeletePreventiveCareConfirmation
        isOpen={!!deletingEvent}
        event={deletingEvent}
        onClose={() => setDeletingEvent(null)}
        onSuccess={handleConfirmDelete}
      />

      {/* HEADER */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <MdCalendarToday className="text-primary-600 text-3xl" />
              Gestión de Prevención
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Administra eventos preventivos de mascotas
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition disabled:opacity-50"
              title="Actualizar"
            >
              <FiRefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            {/* New Event Button */}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition"
            >
              <MdAdd className="w-5 h-5" />
              <span className="hidden sm:inline">Nuevo Evento</span>
            </button>
          </div>
        </div>

        {/* STATS BAR */}
        <div className="flex flex-wrap gap-3 mt-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-sm">
            <FiSearch className="text-slate-500" />
            <span className="text-slate-600">Total:</span>
            <span className="font-semibold">{stats.total}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-success-50 rounded-lg text-sm">
            <span className="text-success-600">✓</span>
            <span className="text-success-700">Próximos:</span>
            <span className="font-semibold text-success-700">{stats.upcoming}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-critical-50 rounded-lg text-sm">
            <span className="text-critical-600">⚠</span>
            <span className="text-critical-700">Vencidos:</span>
            <span className="font-semibold text-critical-700">{stats.overdue}</span>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* LEFT PANEL - FILTERS */}
          <div className="lg:col-span-1 space-y-4">
            
            {/* Search */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2">
                <FiSearch className="text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar mascota/cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 border-none outline-none text-sm bg-transparent"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <FiFilter className="text-slate-500" />
                <span className="text-sm font-medium text-slate-700">Estado</span>
              </div>
              <div className="space-y-2">
                {['all', 'UPCOMING', 'OVERDUE'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${
                      filterStatus === status
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {status === 'all' ? 'Todos' : status === 'UPCOMING' ? 'Próximos' : 'Vencidos'}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT PANEL - CONTENT */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              
              {/* VIEW TOGGLE */}
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <p className="text-sm text-slate-600">
                  {filteredEvents.length} eventos encontrados
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`p-2 rounded-lg transition ${
                      viewMode === 'cards'
                        ? 'bg-primary-100 text-primary-600'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                    title="Vista de tarjetas"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4z" />
                      <path d="M3 10a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-2 rounded-lg transition ${
                      viewMode === 'table'
                        ? 'bg-primary-100 text-primary-600'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                    title="Vista de tabla"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* CONTENT */}
              <div className="p-6">
                {filteredEvents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <FiAlertCircle className="w-12 h-12 text-slate-300 mb-3" />
                    <p className="text-slate-500">No hay eventos que mostrar</p>
                  </div>
                ) : viewMode === 'cards' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filteredEvents.map((event) => (
                      <PreventiveCareCard
                        key={event.id}
                        event={event}
                        onEdit={(e) => {
                          setEditingEvent(e);
                          setIsEditModalOpen(true);
                        }}
                        onDelete={handleDeleteEvent}
                      />
                    ))}
                  </div>
                ) : (
                  <PreventiveCareTable
                    events={filteredEvents}
                    onEdit={(e) => {
                      setEditingEvent(e);
                      setIsEditModalOpen(true);
                    }}
                    onDelete={handleDeleteEvent}
                  />
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
