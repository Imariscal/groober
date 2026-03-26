'use client';

import { useEffect, useState, useMemo } from 'react';
import { MdArrowBack, MdEdit, MdRefresh, MdHistory, MdAdd, MdDelete } from 'react-icons/md';
import { FiSearch } from 'react-icons/fi';
import { useRouter, useParams } from 'next/navigation';
import { priceListsApi } from '@/api/price-lists-api';
import { servicesApi } from '@/api/services-api';
import { PriceList, ServicePrice, Service, ServicePriceHistory, ServicePackagePrice } from '@/types';
import { ServicePriceModal } from '@/components/ServicePriceModal';
import { AddPackageToPriceListModal } from '@/components/AddPackageToPriceListModal';
import { useClinicTimezone } from '@/hooks/useClinicTimezone';
import { formatInClinicTz } from '@/lib/datetime-tz';
import toast from 'react-hot-toast';

type CategoryFilter = 'all' | 'GROOMING' | 'MEDICAL';
type AvailabilityFilter = 'all' | 'available' | 'unavailable';

export default function ClinicPriceListDetailPage() {
  const router = useRouter();
  const params = useParams();
  const priceListId = params.id as string;
  const clinicTimezone = useClinicTimezone();

  // Data state
  const [priceList, setPriceList] = useState<PriceList | null>(null);
  const [servicePrices, setServicePrices] = useState<ServicePrice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>('all');

  // Modal state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState<ServicePrice | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [priceHistory, setPriceHistory] = useState<ServicePriceHistory[]>([]);
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [deleteConfirmService, setDeleteConfirmService] = useState<ServicePrice | null>(null);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  // Fetch data
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [list, prices] = await Promise.all([
        priceListsApi.getPriceList(priceListId),
        priceListsApi.getServicePrices(priceListId),
      ]);

      if (!list) {
        setError('Lista de precios no encontrada');
        return;
      }

      setPriceList(list);
      setServicePrices(prices);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Error al cargar los datos');
      toast.error('Error al cargar los datos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (priceListId) {
      fetchData();
    }
  }, [priceListId]);

  // Filtered services
  const filteredServices = useMemo(() => {
    let filtered = servicePrices;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((sp) => sp.serviceName?.toLowerCase().includes(term));
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((sp) => sp.service?.category === categoryFilter);
    }

    // Availability filter
    if (availabilityFilter === 'available') {
      filtered = filtered.filter((sp) => sp.isAvailable);
    } else if (availabilityFilter === 'unavailable') {
      filtered = filtered.filter((sp) => !sp.isAvailable);
    }

    return filtered;
  }, [servicePrices, searchTerm, categoryFilter, availabilityFilter]);

  // Handlers
  const handleEditPrice = (servicePrice: ServicePrice) => {
    setEditingPrice(servicePrice);
    setIsEditOpen(true);
  };

  const handleEditSuccess = () => {
    fetchData();
    setIsEditOpen(false);
    setEditingPrice(null);
  };

  const handleViewHistory = async (servicePrice: ServicePrice) => {
    try {
      const history = await priceListsApi.getServicePriceHistory(
        priceListId,
        servicePrice.serviceId,
        20
      );
      setPriceHistory(history);
      setHistoryOpen(true);
    } catch (error) {
      console.error('Error fetching history:', error);
      toast.error('Error al cargar el historial');
    }
  };

  const handleDeleteService = (servicePrice: ServicePrice) => {
    setDeleteConfirmService(servicePrice);
  };

  const handleConfirmDeleteService = async () => {
    if (!deleteConfirmService) return;

    setIsDeleteLoading(true);
    try {
      await priceListsApi.removeServiceFromPriceList(priceListId, deleteConfirmService.serviceId);
      toast.success('Servicio eliminado de la lista');
      setDeleteConfirmService(null);
      fetchData();
    } catch (error: any) {
      console.error('Error deleting service:', error);
      if (error.response?.data?.message?.includes('default')) {
        toast.error('No se pueden eliminar servicios de la lista predeterminada');
      } else {
        toast.error('Error al eliminar el servicio');
      }
    } finally {
      setIsDeleteLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-slate-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <button
            onClick={() => router.push('/clinic/price-lists')}
            className="flex items-center gap-2 mb-6 px-4 py-2 text-slate-700 hover:bg-slate-200 rounded-lg transition"
          >
            <MdArrowBack className="w-5 h-5" />
            Volver
          </button>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 -m-6 lg:-m-4">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => router.push('/clinic/price-lists')}
            className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <MdArrowBack className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{priceList?.name}</h1>
            <p className="text-sm text-slate-500 mt-1">
              Gestiona los precios de los servicios en esta lista
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Refresh Button */}
            <button
              onClick={fetchData}
              disabled={isLoading}
              className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition disabled:opacity-50"
              title="Actualizar"
            >
              <MdRefresh className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            {/* Badges */}
            <div className="flex items-center gap-2">
              {priceList?.isDefault && (
                <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                  ⭐ Predeterminada
                </span>
              )}
              {priceList?.isActive ? (
                <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                  ✓ Activa
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 bg-slate-100 text-slate-700 text-xs rounded-full font-medium">
                  Inactiva
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="flex flex-wrap gap-3 mt-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-sm">
            <span className="text-slate-600">Total:</span>
            <span className="font-semibold">{servicePrices.length}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-sm">
            <span className="text-slate-600">Disponibles:</span>
            <span className="font-semibold">{servicePrices.filter(s => s.isAvailable).length}</span>
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
                  placeholder="Buscar servicio..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 border-none focus:outline-none focus:ring-0 text-sm"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <label className="text-sm font-medium text-slate-700 block mb-3 text-left">
                Categoría
              </label>
              <div className="space-y-2">
                {[
                  { value: 'all', label: 'Todas' },
                  { value: 'GROOMING', label: 'Grooming' },
                  { value: 'MEDICAL', label: 'Médico' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setCategoryFilter(option.value as CategoryFilter)}
                    className={`w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                      categoryFilter === option.value
                        ? 'bg-blue-100 text-blue-700 border border-blue-300'
                        : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Availability Filter */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <label className="text-sm font-medium text-slate-700 block mb-3 text-left">
                Disponibilidad
              </label>
              <div className="space-y-2">
                {[
                  { value: 'all', label: 'Todos' },
                  { value: 'available', label: 'Disponibles' },
                  { value: 'unavailable', label: 'No disponibles' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setAvailabilityFilter(option.value as AvailabilityFilter)}
                    className={`w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                      availabilityFilter === option.value
                        ? 'bg-blue-100 text-blue-700 border border-blue-300'
                        : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel - Table */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <p className="text-sm text-slate-600">
                  {filteredServices.length} servicio{filteredServices.length !== 1 ? 's' : ''} encontrado{filteredServices.length !== 1 ? 's' : ''}
                </p>
                <button
                  onClick={() => setIsAddServiceOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  <MdAdd className="w-5 h-5" />
                  Agregar Servicio
                </button>
              </div>

              {/* Table */}
              {filteredServices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <p className="text-slate-500">No hay servicios que mostrar</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Servicio</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Precio</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Moneda</th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-slate-700 uppercase">Disponible</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Última Actualización</th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-slate-700 uppercase">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredServices.map((sp) => (
                        <tr key={sp.id} className="hover:bg-slate-50 transition">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div>
                                <p className="text-sm font-semibold text-slate-900">{sp.serviceName}</p>
                                {sp.service?.category && (
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 ${
                                    sp.service.category === 'GROOMING'
                                      ? 'bg-purple-100 text-purple-700'
                                      : 'bg-red-100 text-red-700'
                                  }`}>
                                    {sp.service.category === 'GROOMING' ? 'Grooming' : 'Médico'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {sp.service?.category === 'GROOMING' ? (
                              <span className="text-xs text-slate-500 font-medium">Por tamaño</span>
                            ) : (
                              <span className="text-sm font-semibold text-slate-900">
                                ${Number(sp.price).toFixed(2)}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-slate-600">{sp.currency || 'MXN'}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                              sp.isAvailable
                                ? 'bg-green-100 text-green-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {sp.isAvailable ? '✓ Sí' : '✗ No'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {formatInClinicTz(new Date(sp.updatedAt), 'dd MMM yyyy HH:mm', clinicTimezone)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleEditPrice(sp)}
                                className="p-1.5 text-slate-600 hover:bg-blue-100 hover:text-blue-600 rounded transition"
                                title={sp.service?.category === 'GROOMING' ? 'Editar precios por tamaño' : 'Editar precio'}
                              >
                                <MdEdit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleViewHistory(sp)}
                                className="p-1.5 text-slate-600 hover:bg-purple-100 hover:text-purple-600 rounded transition"
                                title="Ver historial"
                              >
                                <MdHistory className="w-4 h-4" />
                              </button>
                              {!priceList?.isDefault && (
                                <button
                                  onClick={() => handleDeleteService(sp)}
                                  className="p-1.5 text-slate-600 hover:bg-red-100 hover:text-red-600 rounded transition"
                                  title="Eliminar servicio"
                                >
                                  <MdDelete className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal - Service Price (Add or Edit) */}
      <ServicePriceModal
        isOpen={isAddServiceOpen || isEditOpen}
        priceListId={priceListId}
        existingServiceIds={new Set(servicePrices.map((sp) => sp.serviceId))}
        servicePrice={editingPrice}
        onClose={() => {
          setIsAddServiceOpen(false);
          setIsEditOpen(false);
          setEditingPrice(null);
        }}
        onSuccess={() => {
          setIsAddServiceOpen(false);
          setIsEditOpen(false);
          setEditingPrice(null);
          fetchData();
        }}
      />

      {/* Modal - History */}
      {historyOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 sticky top-0 bg-white">
              <h2 className="text-base font-semibold text-gray-900">Historial de Cambios</h2>
              <button
                onClick={() => setHistoryOpen(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              {priceHistory.length === 0 ? (
                <p className="text-gray-600 text-center py-6 text-sm">No hay cambios registrados</p>
              ) : (
                <div className="space-y-3">
                  {priceHistory.map((record) => (
                    <div key={record.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-start justify-between mb-1">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            ${Number(record.oldPrice || 0).toFixed(2)} → ${Number(record.newPrice).toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500">Por: {record.changedBy}</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          {formatInClinicTz(new Date(record.changed_at), 'dd MMM yyyy HH:mm', clinicTimezone)}
                        </p>
                      </div>
                      {record.reason && (
                        <p className="text-sm text-gray-700">Razón: {record.reason}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
