'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { FiFilter, FiSearch, FiRefreshCw, FiAlertCircle, FiDollarSign } from 'react-icons/fi';
import { MdAdd } from 'react-icons/md';
import toast from 'react-hot-toast';
import { PermissionGateRoute } from '@/components/PermissionGateRoute';
import { PermissionGate } from '@/components/PermissionGate';
import { usePermissions } from '@/hooks/usePermissions';
import { CreateSaleModal } from '@/components/CreateSaleModal';
import { ViewAppointmentDetailsModal, CompleteAppointmentModal, CancelAppointmentModal, AppointmentContextMenu, UnifiedGroomingModal } from '@/components/appointments';
import { appointmentsApi } from '@/lib/appointments-api';
import { createSaleFromAppointment } from '@/lib/pos-api';
import { formatCurrency } from '@/lib/currency';

interface Appointment {
  id: string;
  status: string;
  scheduled_at: string;
  pet: { 
    id: string; 
    name: string;
    species?: string;
    breed?: string;
    size?: string;
    sex?: string;
  };
  client: { 
    id: string; 
    name: string; 
    phone?: string;
    email?: string;
    address?: string;
  };
  location_type: string;
  service_type: string;
  paid?: boolean;
  payment_date?: string | null;
  saleId?: string | null;
  appointmentItems?: Array<{
    id: string;
    serviceId: string;
    priceAtBooking: number;
    quantity: number;
    subtotal: number;
    service?: {
      id: string;
      name: string;
    };
  }>;
}

type SortOption = 'date-desc' | 'date-asc' | 'total-desc' | 'total-asc' | 'client-asc';
type StatusFilter = 'all' | 'scheduled' | 'in_progress' | 'completed' | 'late';
type PaymentFilter = 'all' | 'paid' | 'unpaid';

export default function PendingSalesPage() {
  return (
    <PermissionGateRoute permissions={['pos:sales:create']}>
      <PendingSalesContent />
    </PermissionGateRoute>
  );
}

function PendingSalesContent() {
  const { has } = usePermissions();
  
  // State Management
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [locationFilter, setLocationFilter] = useState<'all' | 'CLINIC' | 'HOME'>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('all');

  // Processing
  const [processingAppointmentId, setProcessingAppointmentId] = useState<string | null>(null);
  const [paidAppointmentId, setPaidAppointmentId] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modals
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [appointmentToComplete, setAppointmentToComplete] = useState<Appointment | null>(null);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ appointment: Appointment; position: { x: number; y: number } } | null>(null);

  // Fetch appointments
  const fetchAppointments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await appointmentsApi.getAppointments();
      let allAppointments = Array.isArray(response) ? response : response?.data || [];

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Filter ONLY citas sin pagar (pending collection)
      // - GROOMING type
      // - NOT CANCELLED and NOT NO_SHOW
      // - UNPAID (paid = false)
      // - Date <= today
      const filteredAppointments = allAppointments.filter((apt) => {
        // Must be GROOMING type
        if (apt.service_type !== 'GROOMING') return false;

        // Exclude CANCELLED and NO_SHOW
        if (['CANCELLED', 'NO_SHOW'].includes(apt.status)) return false;

        // MUST be unpaid
        if (apt.paid !== false) return false;

        // Only appointments from today or earlier (not future)
        const appointmentDate = new Date(apt.scheduled_at);
        appointmentDate.setHours(0, 0, 0, 0);
        if (appointmentDate > today) return false;

        return true;
      });

      setAppointments(filteredAppointments);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar las citas';
      setError(message);
      console.error('Error fetching appointments:', err);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Helper function to determine service status
  const getAppointmentStatusType = (appointment: Appointment): string => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const appointmentDate = new Date(appointment.scheduled_at);
    appointmentDate.setHours(0, 0, 0, 0);

    if (appointment.status === 'COMPLETED') {
      return 'completed';
    } else if (appointmentDate < today && appointment.status !== 'COMPLETED') {
      return 'late'; // Rezagada
    } else if (appointment.status === 'IN_PROGRESS') {
      return 'in_progress';
    } else {
      return 'scheduled';
    }
  };

  // Filter & Sort Logic
  const filteredAndSortedAppointments = useMemo(() => {
    let filtered = appointments.filter((apt) => {
      const matchesSearch =
        apt.pet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.client.name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesLocation =
        locationFilter === 'all' || apt.location_type === locationFilter;

      // Apply status filter
      const appointmentStatusType = getAppointmentStatusType(apt);
      const matchesStatus =
        statusFilter === 'all' || appointmentStatusType === statusFilter;

      // Apply payment filter
      const matchesPayment =
        paymentFilter === 'all' ||
        (paymentFilter === 'unpaid' && !apt.paid) ||
        (paymentFilter === 'paid' && apt.paid);

      return matchesSearch && matchesLocation && matchesStatus && matchesPayment;
    });

    // Sort
    filtered.sort((a, b) => {
      const totalA = a.appointmentItems?.reduce((sum, item) => sum + item.subtotal, 0) || 0;
      const totalB = b.appointmentItems?.reduce((sum, item) => sum + item.subtotal, 0) || 0;

      switch (sortBy) {
        case 'date-desc':
          return new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime();
        case 'date-asc':
          return new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime();
        case 'total-desc':
          return totalB - totalA;
        case 'total-asc':
          return totalA - totalB;
        case 'client-asc':
          return a.client.name.localeCompare(b.client.name);
        default:
          return 0;
      }
    });

    return filtered;
  }, [appointments, searchTerm, sortBy, locationFilter, statusFilter, paymentFilter, getAppointmentStatusType]);

  // Pagination
  const totalPages = useMemo(() => {
    return Math.ceil(filteredAndSortedAppointments.length / itemsPerPage);
  }, [filteredAndSortedAppointments.length, itemsPerPage]);

  const paginatedAppointments = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedAppointments.slice(startIndex, endIndex);
  }, [filteredAndSortedAppointments, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy, locationFilter, statusFilter, paymentFilter]);

  // Stats - Desglose de lo que se renderiza en la tabla (filteredAndSortedAppointments)
  const stats = useMemo(() => {
    // Helper para obtener estatus tipo
    const getStatusTypeForStats = (apt: Appointment): string => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const appointmentDate = new Date(apt.scheduled_at);
      appointmentDate.setHours(0, 0, 0, 0);

      if (apt.status === 'COMPLETED') {
        return 'completed';
      } else if (appointmentDate < today && apt.status !== 'COMPLETED') {
        return 'late';
      } else if (apt.status === 'IN_PROGRESS') {
        return 'in_progress';
      } else {
        return 'scheduled';
      }
    };

    // Desglose por ubicación y estatus DESDE LO QUE SE RENDERIZA
    const clinicByStatus = {
      scheduled: { count: 0, amount: 0 },
      in_progress: { count: 0, amount: 0 },
      completed: { count: 0, amount: 0 },
      late: { count: 0, amount: 0 },
    };
    
    const homeByStatus = {
      scheduled: { count: 0, amount: 0 },
      in_progress: { count: 0, amount: 0 },
      completed: { count: 0, amount: 0 },
      late: { count: 0, amount: 0 },
    };

    let globalTotal = 0;
    let globalAmount = 0;

    // Procesar LO QUE SE RENDERIZA EN LA TABLA
    filteredAndSortedAppointments.forEach(apt => {
      const statusType = getStatusTypeForStats(apt);
      const subtotal = apt.appointmentItems?.reduce((s, item) => s + item.subtotal, 0) || 0;
      
      globalTotal++;
      globalAmount += subtotal;

      if (apt.location_type === 'CLINIC') {
        clinicByStatus[statusType as keyof typeof clinicByStatus].count++;
        clinicByStatus[statusType as keyof typeof clinicByStatus].amount += subtotal;
      } else if (apt.location_type === 'HOME') {
        homeByStatus[statusType as keyof typeof homeByStatus].count++;
        homeByStatus[statusType as keyof typeof homeByStatus].amount += subtotal;
      }
    });

    const clinicTotalCount = Object.values(clinicByStatus).reduce((sum, s) => sum + s.count, 0);
    const clinicTotalAmount = Object.values(clinicByStatus).reduce((sum, s) => sum + s.amount, 0);
    const homeTotalCount = Object.values(homeByStatus).reduce((sum, s) => sum + s.count, 0);
    const homeTotalAmount = Object.values(homeByStatus).reduce((sum, s) => sum + s.amount, 0);
    
    return {
      globalTotal,
      globalAmount,
      clinicTotalCount,
      clinicTotalAmount,
      clinicByStatus,
      homeTotalCount,
      homeTotalAmount,
      homeByStatus,
    };
  }, [filteredAndSortedAppointments]);

  const handleCreateSale = async (appointmentId: string) => {
    setProcessingAppointmentId(appointmentId);
    try {
      const response = await createSaleFromAppointment(appointmentId);
      if (response) {
        const newSaleId = response.id;
        
        // Update local state with saleId
        setAppointments((prev) =>
          prev.map((apt) =>
            apt.id === appointmentId
              ? { ...apt, saleId: newSaleId }
              : apt
          )
        );
        
        toast.success('Venta creada exitosamente');
        setSelectedSaleId(newSaleId);
        setIsCreateModalOpen(true);
      }
    } catch (error: any) {
      console.error('Error creating sale:', error);
      
      // Si la venta ya existe, intentar abrirla
      if (error.message?.includes('already exists')) {
        // Try to find saleId from existing appointment
        const apt = appointments.find((a) => a.id === appointmentId);
        if (apt?.saleId) {
          setSelectedSaleId(apt.saleId);
          setIsCreateModalOpen(true);
        }
        toast.success('Esta cita ya tiene una venta creada');
      } else {
        toast.error(error.message || 'Error al crear la venta');
      }
    } finally {
      setProcessingAppointmentId(null);
    }
  };

  const handlePayButtonClick = async (appointment: Appointment) => {
    setProcessingAppointmentId(appointment.id);
    try {
      if (appointment.saleId) {
        // Si ya existe venta, abrirla directamente
        setSelectedSaleId(appointment.saleId);
        setIsCreateModalOpen(true);
        toast.success('Abriendo venta...');
      } else {
        // Si no existe venta, crearla y actualizar localmente
        const response = await createSaleFromAppointment(appointment.id);
        if (response) {
          const newSaleId = response.id;
          
          // Update local state with saleId for this appointment
          setAppointments((prev) =>
            prev.map((apt) =>
              apt.id === appointment.id
                ? { ...apt, saleId: newSaleId }
                : apt
            )
          );
          
          setSelectedSaleId(newSaleId);
          setIsCreateModalOpen(true);
          toast.success('Venta creada exitosamente');
        }
      }
    } catch (error: any) {
      console.error('Error:', error);
      
      // Si la venta ya existe, intentar abrirla
      if (error.message?.includes('already exists')) {
        toast.info('La venta ya existe para esta cita');
        // Aquí el backend debería retornar el saleId en el error
      } else {
        toast.error(error.message || 'Error al procesar la venta');
      }
    } finally {
      setProcessingAppointmentId(null);
    }
  };

  if (!isLoading && error) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 -m-6 lg:-m-4">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <FiDollarSign className="text-emerald-600 text-3xl" />
              Por Cobrar
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Citas completadas listas para facturar
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchAppointments}
              disabled={isLoading}
              className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              title="Actualizar"
            >
              <FiRefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Stats Bar - Números del contenido visible */}
        <div className="flex flex-wrap gap-3 mt-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-sm">
            <FiSearch className="text-slate-500" />
            <span className="text-slate-600">Mostrando:</span>
            <span className="font-semibold">{stats.globalTotal}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Panel - Filters */}
          <div className="lg:col-span-1 space-y-4">
            {/* Search */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2">
                <FiSearch className="text-slate-400 w-4 h-4 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Buscar cita..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 border-none focus:outline-none focus:ring-0 text-sm"
                />
              </div>
            </div>

            {/* Location Filter */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <FiFilter className="text-slate-500" />
                <span className="text-sm font-medium text-slate-700">Ubicación</span>
              </div>
              <div className="space-y-2">
                {(['all', 'CLINIC', 'HOME'] as const).map((location) => (
                  <button
                    key={location}
                    onClick={() => setLocationFilter(location)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${
                      locationFilter === location
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {location === 'all' ? 'Todas' : location === 'CLINIC' ? 'Clínica' : 'A Domicilio'}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <FiFilter className="text-slate-500" />
                <span className="text-sm font-medium text-slate-700">Estado</span>
              </div>
              <div className="space-y-2">
                {([
                  { value: 'all' as StatusFilter, label: 'Todos' },
                  { value: 'scheduled' as StatusFilter, label: 'Programado' },
                  { value: 'in_progress' as StatusFilter, label: 'En Progreso' },
                  { value: 'completed' as StatusFilter, label: 'Completado' },
                  { value: 'late' as StatusFilter, label: 'Rezagado' },
                ] as const).map((status) => (
                  <button
                    key={status.value}
                    onClick={() => setStatusFilter(status.value)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${
                      statusFilter === status.value
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Filter */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <FiFilter className="text-slate-500" />
                <span className="text-sm font-medium text-slate-700">Pago</span>
              </div>
              <div className="space-y-2">
                {([
                  { value: 'all' as PaymentFilter, label: 'Todos' },
                  { value: 'unpaid' as PaymentFilter, label: 'No Pagados' },
                  { value: 'paid' as PaymentFilter, label: 'Pagados' },
                ] as const).map((payment) => (
                  <button
                    key={payment.value}
                    onClick={() => setPaymentFilter(payment.value)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${
                      paymentFilter === payment.value
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {payment.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <label className="text-sm font-medium text-slate-700 block mb-2">
                Ordenar por
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="date-desc">Más recientes</option>
                <option value="date-asc">Más antiguos</option>
                <option value="total-desc">Monto mayor</option>
                <option value="total-asc">Monto menor</option>
                <option value="client-asc">Cliente (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Right Panel - Table */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-200">
                <p className="text-sm text-slate-600">
                  {stats.filteredTotal} de {stats.globalTotal} citas encontradas
                </p>
              </div>

              {/* Content */}
              <div className="overflow-x-auto">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 px-6">
                    <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
                    <p className="text-slate-500">Cargando citas...</p>
                  </div>
                ) : filteredAndSortedAppointments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-6">
                    <FiAlertCircle className="w-12 h-12 text-slate-300 mb-3" />
                    <p className="text-slate-500">No hay citas que mostrar</p>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50/80 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-2.5 text-left font-medium text-gray-600 text-xs uppercase tracking-wide">
                          Fecha
                        </th>
                        <th className="px-4 py-2.5 text-left font-medium text-gray-600 text-xs uppercase tracking-wide">
                          Mascota
                        </th>
                        <th className="px-4 py-2.5 text-left font-medium text-gray-600 text-xs uppercase tracking-wide">
                          Cliente
                        </th>
                        <th className="px-4 py-2.5 text-left font-medium text-gray-600 text-xs uppercase tracking-wide">
                          Ubicación
                        </th>
                        <th className="px-4 py-2.5 text-left font-medium text-gray-600 text-xs uppercase tracking-wide">
                          Estado
                        </th>
                        <th className="px-4 py-2.5 text-left font-medium text-gray-600 text-xs uppercase tracking-wide">
                          Servicios
                        </th>
                        <th className="px-4 py-2.5 text-right font-medium text-gray-600 text-xs uppercase tracking-wide">
                          Total
                        </th>
                        <th className="px-4 py-2.5 text-center font-medium text-gray-600 text-xs uppercase tracking-wide">
                          Pagado
                        </th>
                        <th className="px-4 py-2.5 text-center font-medium text-gray-600 text-xs uppercase tracking-wide">
                          Fecha Pago
                        </th>
                        <th className="px-4 py-2.5 text-center font-medium text-gray-600 text-xs uppercase tracking-wide">
                          Venta
                        </th>
                        <th className="px-4 py-2.5 text-center font-medium text-gray-600 text-xs uppercase tracking-wide w-12">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {paginatedAppointments.map((appointment) => {
                        const total = appointment.appointmentItems?.reduce(
                          (sum, item) => sum + item.subtotal,
                          0
                        ) || 0;
                        
                        // Pet icon based on species (CAT or DOG from enum)
                        const petIcon = appointment.pet.species === 'CAT' ? '🐱' : '🐕';

                        return (
                          <tr key={appointment.id} className="hover:bg-slate-50 transition">
                            <td className="px-4 py-3 text-sm">
                              <div className="font-medium text-slate-900">
                                {new Date(appointment.scheduled_at).toLocaleDateString('es-MX')}
                              </div>
                              <div className="text-xs text-slate-500">
                                {new Date(appointment.scheduled_at).toLocaleTimeString('es-MX', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                            </td>
                            {/* Pet Column - Clickable */}
                            <td className="px-4 py-3 text-sm">
                              <button
                                onClick={() => {
                                  setSelectedAppointment(appointment);
                                  setIsDetailsModalOpen(true);
                                }}
                                className="hover:underline text-left group"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">{petIcon}</span>
                                  <div>
                                    <p className="font-semibold text-slate-900 group-hover:text-blue-600">
                                      {appointment.pet.name}
                                    </p>
                                    <div className="text-xs text-slate-500 space-y-0.5">
                                      {appointment.pet.breed && (
                                        <p>{appointment.pet.breed}{appointment.pet.size && ` • ${appointment.pet.size}`}</p>
                                      )}
                                      {appointment.pet.sex && (
                                        <p>{
                                          appointment.pet.sex === 'MALE' ? '♂ Macho' : 
                                          appointment.pet.sex === 'FEMALE' ? '♀ Hembra' : 
                                          'Sexo desconocido'
                                        }</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </button>
                            </td>
                            {/* Client Column */}
                            <td className="px-4 py-3 text-sm">
                              <div className="space-y-1">
                                <p className="font-medium text-slate-900">{appointment.client.name}</p>
                                {appointment.client.phone && (
                                  <p className="text-xs text-slate-600">📱 {appointment.client.phone}</p>
                                )}
                                {appointment.client.email && (
                                  <p className="text-xs text-slate-600">📧 {appointment.client.email}</p>
                                )}
                                {appointment.location_type === 'HOME' && appointment.client.address && (
                                  <p className="text-xs text-slate-600">📍 {appointment.client.address}</p>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
                                appointment.location_type === 'CLINIC'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-orange-100 text-orange-700'
                              }`}>
                                {appointment.location_type === 'CLINIC' ? 'Clínica' : 'A Domicilio'}
                              </span>
                            </td>
                            {/* Status Column */}
                            <td className="px-4 py-3 text-sm">
                              {(() => {
                                const statusType = getAppointmentStatusType(appointment);
                                const statusConfig: Record<string, { label: string; color: string }> = {
                                  scheduled: { label: 'Programado', color: 'bg-slate-100 text-slate-700' },
                                  in_progress: { label: 'En Progreso', color: 'bg-blue-100 text-blue-700' },
                                  completed: { label: 'Completado', color: 'bg-emerald-100 text-emerald-700' },
                                  late: { label: 'Rezagado', color: 'bg-red-100 text-red-700' },
                                };
                                const config = statusConfig[statusType];
                                return (
                                  <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
                                    {config.label}
                                  </span>
                                );
                              })()}
                            </td>
                            {/* Services Column */}
                            <td className="px-4 py-3 text-sm">
                              <div className="space-y-1">
                                <p className="font-medium text-slate-900">
                                  {appointment.appointmentItems?.length || 0} servicio{appointment.appointmentItems?.length !== 1 ? 's' : ''}
                                </p>
                                {appointment.appointmentItems && appointment.appointmentItems.length > 0 && (
                                  <div className="space-y-0.5">
                                    {appointment.appointmentItems.slice(0, 2).map((item) => (
                                      <p key={item.id} className="text-xs text-slate-600">
                                        • {item.service?.name || `Servicio ${item.serviceId.slice(0, 8)}`}
                                      </p>
                                    ))}
                                    {appointment.appointmentItems.length > 2 && (
                                      <p className="text-xs text-slate-500">
                                        + {appointment.appointmentItems.length - 2} más
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold text-right text-slate-900">
                              {formatCurrency(total)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
                                appointment.paid 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {appointment.paid ? 'Pagado' : 'No Pagado'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-500 text-center">
                              {appointment.payment_date 
                                ? new Date(appointment.payment_date).toLocaleDateString('es-MX')
                                : '—'
                              }
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePayButtonClick(appointment);
                                }}
                                disabled={processingAppointmentId === appointment.id}
                                className={`px-3 py-1.5 text-xs font-medium rounded transition ${
                                  appointment.saleId
                                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                              >
                                {appointment.saleId ? '👁️ Ver venta' : '💳 Pagar'}
                              </button>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  setContextMenu({
                                    appointment,
                                    position: { x: rect.left, y: rect.bottom },
                                  });
                                }}
                                className="px-2 py-1 text-slate-600 hover:bg-slate-200 rounded transition"
                                title="Ver opciones"
                              >
                                ⋮
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Pagination */}
              {filteredAndSortedAppointments.length > itemsPerPage && (
                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div className="text-sm text-slate-600">
                    Página {currentPage} de {totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      Anterior
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sale Modal */}
      {isCreateModalOpen && selectedSaleId && (
        <CreateSaleModal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            setSelectedSaleId(null);
          }}
          saleId={selectedSaleId}
          isGroomingSale={true}
          onSuccess={() => {
            // Find the appointment that was paid
            const paidAppointment = appointments.find(
              (apt) => apt.saleId === selectedSaleId
            );
            
            // Close modal
            setIsCreateModalOpen(false);
            setSelectedSaleId(null);
            
            // Remove the paid appointment from list immediately (optimistic update)
            if (paidAppointment) {
              setAppointments((prev) =>
                prev.filter((apt) => apt.id !== paidAppointment.id)
              );
              setPaidAppointmentId(paidAppointment.id);
            }
            
            // Refresh list to validate with server
            fetchAppointments();
          }}
        />
      )}

      {/* Appointment Details Modal */}
      {selectedAppointment && (
        <ViewAppointmentDetailsModal
          isOpen={isDetailsModalOpen}
          appointment={selectedAppointment}
          onClose={() => {
            setIsDetailsModalOpen(false);
            setSelectedAppointment(null);
          }}
        />
      )}

      {/* Modal - Completar Cita */}
      <CompleteAppointmentModal
        isOpen={completeModalOpen}
        appointment={appointmentToComplete}
        onClose={() => {
          setCompleteModalOpen(false);
          setAppointmentToComplete(null);
        }}
        onSuccess={(completed: Appointment) => {
          toast.success('Cita completada exitosamente');
          setCompleteModalOpen(false);
          setAppointmentToComplete(null);
          fetchAppointments();
        }}
      />

      {/* Modal - Editar Cita */}
      <UnifiedGroomingModal
        isOpen={editModalOpen}
        scheduledAt={editingAppointment?.scheduled_at ? new Date(editingAppointment.scheduled_at) : null}
        onClose={() => {
          setEditModalOpen(false);
          setEditingAppointment(null);
        }}
        onSuccess={async () => {
          setEditModalOpen(false);
          setEditingAppointment(null);
          fetchAppointments();
        }}
        editingAppointment={editingAppointment || undefined}
        serviceType="GROOMING"
      />

      {/* Modal - Cancelar Cita */}
      <CancelAppointmentModal
        isOpen={cancelModalOpen}
        appointment={appointmentToCancel}
        onClose={() => {
          setCancelModalOpen(false);
          setAppointmentToCancel(null);
        }}
        onSuccess={(cancelled: Appointment) => {
          toast.success('Cita cancelada exitosamente');
          setCancelModalOpen(false);
          setAppointmentToCancel(null);
          fetchAppointments();
        }}
      />

      {/* Context Menu - Opciones de Cita */}
      <AppointmentContextMenu
        isOpen={!!contextMenu}
        appointment={contextMenu?.appointment || null}
        position={contextMenu?.position || null}
        onClose={() => setContextMenu(null)}
        onViewDetails={(apt) => {
          setSelectedAppointment(apt);
          setIsDetailsModalOpen(true);
          setContextMenu(null);
        }}
        onAssignStylist={(apt) => {
          // Not applicable for "Por Cobrar" - staff already assigned
          toast.info('Esta funcionalidad no es aplicable aquí');
          setContextMenu(null);
        }}
        onEdit={(apt) => {
          setEditingAppointment(apt);
          setEditModalOpen(true);
          setContextMenu(null);
        }}
        onStartAppointment={(apt) => {
          // Not applicable for "Por Cobrar" - citas already started/completed
          toast.info('Esta funcionalidad no es aplicable aquí');
          setContextMenu(null);
        }}
        onComplete={(apt) => {
          setAppointmentToComplete(apt);
          setCompleteModalOpen(true);
          setContextMenu(null);
        }}
        onReschedule={(apt) => {
          // Not applicable for "Por Cobrar"
          toast.info('Para reprogramar, vaya a la sección de Citas');
          setContextMenu(null);
        }}
        onCancel={(apt) => {
          setAppointmentToCancel(apt);
          setCancelModalOpen(true);
          setContextMenu(null);
        }}
        onMarkNoShow={(apt) => {
          // Not applicable for "Por Cobrar"
          toast.info('Para marcar como no asistió, vaya a la sección de Citas');
          setContextMenu(null);
        }}
      />
    </div>
  );
}
