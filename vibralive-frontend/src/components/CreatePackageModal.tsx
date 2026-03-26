'use client';

import { useState, useEffect, useRef } from 'react';
import { MdClose, MdAdd, MdDelete, MdKeyboardArrowDown } from 'react-icons/md';
import { packagesApi } from '@/api/packages-api';
import { servicesApi } from '@/api/services-api';
import { ServicePackage, Service, PackageItem, CreateServicePackagePayload } from '@/types';
import toast from 'react-hot-toast';

interface CreatePackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  pkg?: ServicePackage;
}

interface FormErrors {
  name?: string;
  items?: string;
}

export function CreatePackageModal({
  isOpen,
  onClose,
  onSuccess,
  pkg,
}: CreatePackageModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [formData, setFormData] = useState<Partial<CreateServicePackagePayload>>({
    name: '',
    description: '',
    items: [],
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch services on mount
  useEffect(() => {
    if (isOpen) {
      const loadServices = async () => {
        try {
          const fetchedServices = await servicesApi.getServices();
          setServices(fetchedServices);
        } catch (error) {
          console.error('Error fetching services:', error);
          toast.error('Error al cargar servicios');
        }
      };

      loadServices();
    }
  }, [isOpen]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (pkg) {
        setFormData({
          name: pkg.name || '',
          description: pkg.description || '',
          items: pkg.items || [],
        });
      } else {
        setFormData({
          name: '',
          description: '',
          items: [],
        });
      }
      setErrors({});
      setSelectedServiceId('');
      setSelectedQuantity(1);
      setSearchQuery('');
      setShowDropdown(false);
      setHighlightedIndex(-1);
    }
  }, [isOpen, pkg]);

  // Reset highlighted index when search query changes
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [searchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  // Get available services (not already added)
  const availableServices = services.filter(s => !formData.items?.some(item => item.serviceId === s.id));

  // Filter services based on search query
  const filteredServices = availableServices.filter(service =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle keyboard navigation in autocomplete
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setShowDropdown(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredServices.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredServices.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredServices[highlightedIndex]) {
          handleSelectService(filteredServices[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowDropdown(false);
        break;
    }
  };

  const handleSelectService = (service: Service) => {
    setSelectedServiceId(service.id);
    setSearchQuery(service.name);
    setShowDropdown(false);
  };

  // Validations
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.items || formData.items.length === 0) {
      newErrors.items = 'Debes agregar al menos un servicio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle add service to items
  const handleAddService = () => {
    if (!selectedServiceId) {
      toast.error('Selecciona un servicio');
      return;
    }

    const service = services.find(s => s.id === selectedServiceId);
    if (!service) {
      toast.error('Servicio no encontrado');
      return;
    }

    // Check if service already added
    if (formData.items?.some(item => item.serviceId === selectedServiceId)) {
      toast.error('Este servicio ya está agregado al paquete');
      return;
    }

    const newItem: PackageItem = {
      serviceId: selectedServiceId,
      serviceName: service.name,
      quantity: selectedQuantity,
    };

    setFormData({
      ...formData,
      items: [...(formData.items || []), newItem],
    });

    setSelectedServiceId('');
    setSelectedQuantity(1);
    setSearchQuery('');
    setShowDropdown(false);
    setHighlightedIndex(-1);
    toast.success('Servicio agregado al paquete');
  };

  // Handle remove service from items
  const handleRemoveService = (serviceId: string) => {
    setFormData({
      ...formData,
      items: formData.items?.filter(item => item.serviceId !== serviceId) || [],
    });
  };

  // Handle update quantity
  const handleUpdateQuantity = (serviceId: string, quantity: number) => {
    if (quantity < 1) return;

    setFormData({
      ...formData,
      items: formData.items?.map(item =>
        item.serviceId === serviceId ? { ...item, quantity } : item
      ) || [],
    });
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      if (pkg) {
        // Edit mode
        await packagesApi.updatePackage(pkg.id, {
          name: formData.name,
          description: formData.description,
          items: formData.items,
        });

        toast.success('Paquete actualizado');
      } else {
        // Create mode
        await packagesApi.createPackage({
          name: formData.name!,
          description: formData.description,
          items: formData.items || [],
        });
        toast.success('Paquete creado');
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al procesar el paquete');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full transform transition-all duration-300 my-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 via-primary-600 to-primary-700 px-6 py-4 flex items-center justify-between border-b border-primary-600 shadow-sm z-10">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white">
                {pkg ? 'Editar Paquete' : 'Nuevo Paquete'}
              </h2>
              <p className="text-primary-100 text-sm mt-1">
                {pkg ? 'Actualiza los datos del paquete' : 'Completa los datos para crear un nuevo paquete'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition duration-200"
            >
              <MdClose className="w-6 h-6" />
            </button>
          </div>

          {/* Form Container */}
          <div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ej: Paquete Baño + Corte"
                disabled={isLoading}
              />
              {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Ej: Un paquete completo de aseo"
                rows={2}
              />
            </div>

            {/* Servicios Incluidos Section */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Servicios Incluidos *</h3>

              {/* Service Selector */}
              <div className="space-y-2 mb-4">
                <div className="flex gap-2 items-end">
                  <div className="flex-1 relative" ref={dropdownRef}>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Servicio
                    </label>
                    <div className="relative">
                      <input
                        ref={inputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setShowDropdown(true);
                        }}
                        onKeyDown={handleKeyDown}
                        onFocus={() => setShowDropdown(true)}
                        placeholder={services.length === 0 ? 'Cargando servicios...' : 'Busca o selecciona un servicio...'}
                        disabled={isLoading || services.length === 0}
                        autoComplete="off"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm disabled:bg-gray-100 pr-8"
                      />
                      <div className="absolute right-2 top-2 pointer-events-none text-gray-400">
                        <MdKeyboardArrowDown size={20} />
                      </div>
                    </div>

                    {/* Dropdown */}
                    {showDropdown && filteredServices.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                        {filteredServices.map((service, index) => (
                          <button
                            key={service.id}
                            type="button"
                            onClick={() => handleSelectService(service)}
                            onMouseEnter={() => setHighlightedIndex(index)}
                            className={`w-full text-left px-3 py-2.5 transition border-b border-gray-100 last:border-0 ${
                              highlightedIndex === index
                                ? 'bg-primary-600 text-white'
                                : 'hover:bg-blue-50 text-gray-700'
                            }`}
                          >
                            <div className="font-medium text-sm">{service.name}</div>
                            {service.description && (
                              <div className={`text-xs ${
                                highlightedIndex === index ? 'text-blue-100' : 'text-gray-500'
                              }`}>
                                {service.description}
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}

                    {showDropdown && searchQuery && filteredServices.length === 0 && availableServices.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 p-3 text-sm text-gray-500">
                        No se encontraron servicios con "{searchQuery}"
                      </div>
                    )}

                    {availableServices.length === 0 && !searchQuery && (
                      <p className="text-xs text-amber-600 mt-1">⚠️ Todos los servicios ya están agregados</p>
                    )}
                  </div>

                  <div className="w-20">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Cantidad
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="99"
                      value={selectedQuantity}
                      onChange={(e) => setSelectedQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                      disabled={isLoading}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddService}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 text-sm font-medium disabled:opacity-50"
                    disabled={isLoading || !selectedServiceId}
                  >
                    <MdAdd size={16} />
                    Agregar
                  </button>
                </div>
              </div>

              {/* Items List */}
              {formData.items && formData.items.length > 0 ? (
                <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
                  {formData.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-3 bg-white p-2 rounded border border-gray-200"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{item.serviceName}</p>
                        <p className="text-xs text-gray-600">{item.serviceId.slice(0, 8)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max="99"
                          value={item.quantity}
                          onChange={(e) => handleUpdateQuantity(item.serviceId, parseInt(e.target.value) || 1)}
                          className="w-12 px-2 py-1 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary-500"
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveService(item.serviceId)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                          disabled={isLoading}
                        >
                          <MdDelete size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-sm text-gray-500">
                  No hay servicios agregados
                </div>
              )}
              {errors.items && <p className="text-red-600 text-xs mt-2">{errors.items}</p>}
            </div>

            {/* Buttons */}
            <div className="flex gap-2 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                disabled={isLoading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? 'Guardando...' : 'Guardar Paquete'}
              </button>
            </div>
          </form>
          {/* End Form Container */}
          </div>
        </div>
      </div>
    </>
  );
}

