'use client';

import { useState, useEffect, useRef } from 'react';
import { MdClose, MdKeyboardArrowDown } from 'react-icons/md';
import { FiCopy } from 'react-icons/fi';
import { Service, ServicePrice, PetSize } from '@/types';
import { servicesApi } from '@/api/services-api';
import { priceListsApi } from '@/api/price-lists-api';
import { serviceSizePriceApi } from '@/api/service-size-price-api';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

interface ServicePriceModalProps {
  isOpen: boolean;
  priceListId: string;
  existingServiceIds: Set<string>;
  servicePrice?: ServicePrice | null; // If provided, it's edit mode; if null, it's add mode
  onClose: () => void;
  onSuccess: () => void;
}

interface SizePrices {
  XS: number;
  S: number;
  M: number;
  L: number;
  XL: number;
}

interface FormErrors {
  service?: string;
  price?: string;
  [key: string]: string | undefined;
}

const PET_SIZES: PetSize[] = ['XS', 'S', 'M', 'L', 'XL'];
const SIZE_LABELS: Record<PetSize, string> = {
  'XS': 'Extra Pequeño (XS)',
  'S': 'Pequeño (S)',
  'M': 'Mediano (M)',
  'L': 'Grande (L)',
  'XL': 'Extra Grande (XL)',
};

export function ServicePriceModal({
  isOpen,
  priceListId,
  existingServiceIds,
  servicePrice,
  onClose,
  onSuccess,
}: ServicePriceModalProps) {
  const isEditMode = !!servicePrice;
  
  // Data fetching
  const [services, setServices] = useState<Service[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  // Add Mode: Service selection
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Determine if current service is GROOMING (works in both add and edit modes)
  const currentService = isEditMode ? servicePrice?.service : selectedService;
  const isGrooming = currentService?.category === 'GROOMING';

  // Form data
  const [formData, setFormData] = useState<{
    price: number;
    currency: string;
    is_available: boolean;
  }>({
    price: 0,
    currency: 'MXN',
    is_available: true,
  });

  const [defaultPrice, setDefaultPrice] = useState<number>(0);
  const [sizePrices, setSizePrices] = useState<SizePrices>({
    XS: 0,
    S: 0,
    M: 0,
    L: 0,
    XL: 0,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSizePrices, setIsLoadingSizePrices] = useState(false);

  const availableServices = services.filter((s) => !existingServiceIds.has(s.id));
  const filteredServices = availableServices.filter((service) =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  // Reset highlighted index when filtered services change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [searchQuery]);

  // Handle keyboard navigation
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

  // Fetch services for dropdown
  const fetchServices = async () => {
    setIsFetching(true);
    try {
      const data = await servicesApi.getServices();
      setServices(data);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('Error al cargar servicios');
    } finally {
      setIsFetching(false);
    }
  };

  // Load default price from default price list
  const loadDefaultPrice = async (service: Service): Promise<number> => {
    try {
      const defaultPriceList = await priceListsApi.getDefaultPriceList();
      if (!defaultPriceList) {
        return 0;
      }
      const prices = await priceListsApi.getServicePrices(defaultPriceList.id, service.id);
      if (prices && prices.length > 0) {
        return prices[0].price;
      }
      return 0;
    } catch (error) {
      console.error('Error loading default price:', error);
      return 0;
    }
  };

  // Load size prices for grooming services
  const loadSizePrices = async (serviceId: string, fallbackPrice: number, listId?: string) => {
    setIsLoadingSizePrices(true);
    try {
      let prices: any[] = [];
      
      // If we have a price list ID (editing in price list), load from price-list-specific endpoint
      if (listId) {
        try {
          const url = `/api/price-lists/${listId}/services/${serviceId}/size-prices`;
          console.log(`[loadSizePrices] Fetching from: ${url}`);
          const response = await api.get(url);
          console.log(`[loadSizePrices] Raw response:`, response);
          
          // Response structure: axios auto-extracts response.data, so:
          // Backend returns: { success: true, data: [...] }
          // response.data is already the extracted object: { success: true, data: [...] }
          const pricesData = response.data?.data || response.data;
          prices = Array.isArray(pricesData) ? pricesData : (pricesData?.data || []);
          
          console.log(`[loadSizePrices] Loaded ${prices.length} price-list-specific prices from ${listId}:`, prices);
          
          // Only use these prices if we actually got some data
          if (prices.length > 0) {
            const priceMap: SizePrices = {
              XS: 0,
              S: 0,
              M: 0,
              L: 0,
              XL: 0,
            };
            prices.forEach((p: any) => {
              const size = p.pet_size || p.petSize;
              priceMap[size as PetSize] = p.price;
            });
            console.log('[loadSizePrices] Setting price-list-specific prices:', priceMap);
            setSizePrices(priceMap);
            return; // Successfully loaded list-specific prices
          }
        } catch (error) {
          console.log('[loadSizePrices] Failed to load price-list-specific prices:', error);
          // No list-specific prices found, will try global prices next
        }
      }
      
      // Fall back to global size prices (if list-specific didn't work or listId not provided)
      console.log('[loadSizePrices] Loading global prices for serviceId:', serviceId);
      prices = await serviceSizePriceApi.getSizePrices(serviceId);
      
      if (prices && prices.length > 0) {
        const priceMap: SizePrices = {
          XS: 0,
          S: 0,
          M: 0,
          L: 0,
          XL: 0,
        };
        prices.forEach((p: any) => {
          const size = p.pet_size || p.petSize;
          priceMap[size as PetSize] = p.price;
        });
        console.log('[loadSizePrices] Setting global prices:', priceMap);
        setSizePrices(priceMap);
      } else {
        console.log('[loadSizePrices] No prices found, using fallback:', fallbackPrice);
        setSizePrices({
          XS: fallbackPrice,
          S: fallbackPrice,
          M: fallbackPrice,
          L: fallbackPrice,
          XL: fallbackPrice,
        });
      }
    } catch (error) {
      console.error('[loadSizePrices] Unexpected error:', error);
      setSizePrices({
        XS: fallbackPrice,
        S: fallbackPrice,
        M: fallbackPrice,
        L: fallbackPrice,
        XL: fallbackPrice,
      });
    } finally {
      setIsLoadingSizePrices(false);
    }
  };

  // Initialize form based on mode
  useEffect(() => {
    const loadFormData = async () => {
      if (!isOpen) return;

      if (isEditMode && servicePrice) {
        // Edit mode: load service price data
        const service = servicePrice.service || null;
        setSelectedService(service);
        setSearchQuery(service?.name || '');
        setFormData({
          price: servicePrice.price,
          currency: servicePrice.currency || 'MXN',
          is_available: servicePrice.isAvailable,
        });
        setDefaultPrice(servicePrice.price);

        // If grooming, load size prices from price list
        if (service?.category === 'GROOMING') {
          console.log(`[useEffect] Loading size prices for service ${servicePrice.serviceId} in list ${priceListId}`);
          await loadSizePrices(servicePrice.serviceId, servicePrice.price, priceListId);
        }
      } else {
        // Add mode: reset form
        setSelectedService(null);
        setSearchQuery('');
        setFormData({
          price: 0,
          currency: 'MXN',
          is_available: true,
        });
        setSizePrices({
          XS: 0,
          S: 0,
          M: 0,
          L: 0,
          XL: 0,
        });
        setDefaultPrice(0);
      }

      setErrors({});
    };

    loadFormData();
  }, [isOpen, servicePrice, isEditMode, priceListId]);


  // Handle service selection
  const handleSelectService = async (service: Service) => {
    setSelectedService(service);
    setSearchQuery(service.name);
    setShowDropdown(false);

    // Load default price
    const price = await loadDefaultPrice(service);
    setFormData((prev) => ({ ...prev, price }));
    setDefaultPrice(price);

    // If grooming, load size prices
    if (service.category === 'GROOMING') {
      await loadSizePrices(service.id, price);
    } else {
      setSizePrices({
        XS: 0,
        S: 0,
        M: 0,
        L: 0,
        XL: 0,
      });
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!isEditMode && !selectedService) {
      newErrors.service = 'Selecciona un servicio';
    }

    if (isGrooming) {
      // Validate all size prices
      PET_SIZES.forEach((size) => {
        const price = sizePrices[size];
        if (!price || price < 0) {
          newErrors[size] = `Precio ${size} es requerido`;
        } else if (!/^\d+(\.\d{0,2})?$/.test(price.toString())) {
          newErrors[size] = `Máximo 2 decimales`;
        }
      });
    } else {
      // Validate single price
      if (!formData.price || formData.price < 0) {
        newErrors.price = 'El precio es requerido y debe ser >= 0';
      } else if (!/^\d+(\.\d{0,2})?$/.test(formData.price.toString())) {
        newErrors.price = 'Máximo 2 decimales';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Apply default price to all sizes
  const handleApplyToAll = () => {
    if (!defaultPrice || defaultPrice < 0) {
      toast.error('Ingresa un precio válido');
      return;
    }
    setSizePrices({
      XS: defaultPrice,
      S: defaultPrice,
      M: defaultPrice,
      L: defaultPrice,
      XL: defaultPrice,
    });
    toast.success('Precio aplicado a todos los tamaños');
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const currentService = selectedService || servicePrice?.service;
      if (!currentService) {
        toast.error('Error: servicio no seleccionado');
        return;
      }

      if (isGrooming) {
        // Update size prices for grooming services
        // Use price-list-specific endpoints to store prices per list
        const sizes: PetSize[] = ['XS', 'S', 'M', 'L', 'XL'];
        console.log(`[handleSubmit] Updating ${sizes.length} size prices for service ${currentService.id} in list ${priceListId}`);
        
        await Promise.all(
          sizes.map((size) =>
            // Call new price-list-specific endpoint
            api.patch(
              `/api/price-lists/${priceListId}/services/${currentService.id}/size-prices/${size}`,
              {
                price: sizePrices[size],
                currency: formData.currency || 'MXN',
              }
            ).then((response) => {
              console.log(`[handleSubmit] Successfully updated price for size ${size}:`, response.data);
              return response;
            }).catch((error) => {
              console.error(`Error updating size price for ${size}:`, error);
              throw error;
            })
          )
        );

        // Also update the price list entry
        await priceListsApi.updateServicePrice(priceListId, currentService.id, {
          price: defaultPrice,
          currency: formData.currency,
          is_available: formData.is_available,
        });

        // Update local state to reflect changes immediately
        const updatedSizePrices: SizePrices = { ...sizePrices };
        setSizePrices(updatedSizePrices);
        console.log('[handleSubmit] Size prices updated successfully, local state updated:', updatedSizePrices);

        toast.success('Precios por tamaño actualizados');
      } else {
        // Single price for medical services
        await priceListsApi.updateServicePrice(
          priceListId,
          currentService.id,
          formData
        );
        toast.success(isEditMode ? 'Precio actualizado' : 'Servicio agregado');
      }

      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al procesar el servicio');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle close
  const handleClose = () => {
    setSelectedService(null);
    setSearchQuery('');
    setShowDropdown(false);
    setFormData({
      price: 0,
      currency: 'MXN',
      is_available: true,
    });
    setSizePrices({
      XS: 0,
      S: 0,
      M: 0,
      L: 0,
      XL: 0,
    });
    setDefaultPrice(0);
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col transform transition-all">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 via-primary-600 to-primary-700 px-6 py-5 flex items-center justify-between border-b border-primary-600 rounded-t-xl flex-shrink-0">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white">
                {isEditMode ? 'Editar Precio del Servicio' : 'Agregar Servicio'}
              </h2>
              <p className="text-primary-100 text-sm mt-1">
                {isEditMode 
                  ? 'Actualiza el precio y configuración del servicio' 
                  : 'Agrega un servicio a esta lista de precios'}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition flex-shrink-0"
            >
              <MdClose className="w-6 h-6" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-5">
              {/* Service Selection (only in add mode) */}
              {!isEditMode && (
                <div className="border border-gray-200 rounded-lg p-4 bg-white">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-1 h-6 bg-primary-600 rounded"></div>
                    <h3 className="text-sm font-semibold text-gray-900">Seleccionar Servicio</h3>
                  </div>

                  {/* Service Autocomplete */}
                  <div ref={dropdownRef} className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Servicio *
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
                        onFocus={() => {
                          setShowDropdown(true);
                          if (services.length === 0 && !isFetching) {
                            fetchServices();
                          }
                        }}
                        placeholder={isFetching ? 'Cargando servicios...' : 'Busca o selecciona un servicio...'}
                        disabled={isFetching}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                          errors.service ? 'border-red-500' : 'border-gray-300'
                        }`}
                        autoComplete="off"
                      />
                      <div className="absolute right-2 top-2 pointer-events-none text-gray-400">
                        <MdKeyboardArrowDown size={20} />
                      </div>
                    </div>

                    {/* Error */}
                    {errors.service && <p className="text-red-600 text-xs mt-1">{errors.service}</p>}

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
                                : selectedService?.id === service.id
                                ? 'bg-primary-100 text-primary-700'
                                : 'hover:bg-primary-50 text-gray-700'
                            }`}
                          >
                            <div className="font-medium text-sm">{service.name}</div>
                            <div className={`text-xs ${
                              highlightedIndex === index ? 'text-primary-100' : 'text-gray-500'
                            }`}>
                              {service.category === 'GROOMING' ? '🐩 Grooming' : '⚕️ Médico'}
                              {service.description && ` • ${service.description}`}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* No results message */}
                    {showDropdown && filteredServices.length === 0 && !isFetching && availableServices.length === 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 p-3 text-sm text-gray-500">
                        ❌ Todos los servicios ya están en esta lista
                      </div>
                    )}

                    {showDropdown && searchQuery && filteredServices.length === 0 && availableServices.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 p-3 text-sm text-gray-500">
                        No se encontraron servicios con "{searchQuery}"
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Pricing Section (show when service is selected or in edit mode) */}
              {(selectedService || isEditMode) && (
                <div className="border border-gray-200 rounded-lg p-4 bg-white">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-1 h-6 bg-primary-600 rounded"></div>
                    <h3 className="text-sm font-semibold text-gray-900">Precios</h3>
                  </div>

                  <div className="space-y-4">
                    {/* Default Price */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Precio Predeterminado ($) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={defaultPrice || ''}
                        onChange={(e) => setDefaultPrice(parseFloat(e.target.value) || 0)}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                          errors.price ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="0.00"
                        disabled={isLoading || isLoadingSizePrices}
                      />
                      {errors.price && <p className="text-red-600 text-xs mt-1">{errors.price}</p>}
                    </div>

                    {/* Size-based Pricing (only for GROOMING) */}
                    {isGrooming && (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-medium text-gray-700">Precios por Tamaño de Mascota</h4>
                          <button
                            type="button"
                            onClick={handleApplyToAll}
                            className="flex items-center gap-1 text-xs bg-primary-100 hover:bg-primary-200 text-primary-700 px-3 py-1.5 rounded transition"
                            disabled={isLoading || isLoadingSizePrices}
                          >
                            <FiCopy className="w-3 h-3" />
                            Aplicar a todos
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-lg">
                          {PET_SIZES.map((size) => (
                            <div key={size}>
                              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                {SIZE_LABELS[size]}
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={sizePrices[size] || ''}
                                onChange={(e) => {
                                  setSizePrices({
                                    ...sizePrices,
                                    [size]: parseFloat(e.target.value) || 0,
                                  });
                                }}
                                className={`w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                                  errors[size] ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="0.00"
                                disabled={isLoading || isLoadingSizePrices}
                              />
                              {errors[size] && <p className="text-red-600 text-xs mt-1">{errors[size]}</p>}
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Estos precios se mostrarán automáticamente al agendar citas según el tamaño de la mascota.
                        </p>
                      </div>
                    )}

                    {/* Currency and Availability (only for Medical or edit mode) */}
                    {!isGrooming && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Moneda
                          </label>
                          <select
                            value={formData.currency}
                            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            disabled={isLoading}
                          >
                            <option value="MXN">MXN (Peso Mexicano)</option>
                            <option value="USD">USD (Dólar)</option>
                            <option value="EUR">EUR (Euro)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Disponibilidad
                          </label>
                          <select
                            value={formData.is_available ? 'available' : 'unavailable'}
                            onChange={(e) => setFormData({ ...formData, is_available: e.target.value === 'available' })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            disabled={isLoading}
                          >
                            <option value="available">Disponible</option>
                            <option value="unavailable">No Disponible</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {isGrooming && isEditMode && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Disponibilidad
                        </label>
                        <select
                          value={formData.is_available ? 'available' : 'unavailable'}
                          onChange={(e) => setFormData({ ...formData, is_available: e.target.value === 'available' })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          disabled={isLoading}
                        >
                          <option value="available">Disponible</option>
                          <option value="unavailable">No Disponible</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </form>

          {/* Footer */}
          <div className="flex gap-3 p-6 border-t border-gray-200 bg-white rounded-b-xl flex-shrink-0">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2.5 text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition disabled:opacity-50"
              disabled={isLoading || isLoadingSizePrices}
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-4 py-2.5 bg-primary-600 text-white hover:bg-primary-700 rounded-lg font-medium transition disabled:opacity-50"
              disabled={isLoading || isLoadingSizePrices || (!isEditMode && !selectedService)}
            >
              {isLoading ? 'Guardando...' : isEditMode ? 'Actualizar' : 'Agregar'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
