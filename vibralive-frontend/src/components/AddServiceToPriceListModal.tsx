'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MdClose, MdKeyboardArrowDown } from 'react-icons/md';
import { Service, ServicePrice } from '@/types';
import { servicesApi } from '@/api/services-api';
import { priceListsApi } from '@/api/price-lists-api';
import toast from 'react-hot-toast';

interface AddServiceToPriceListModalProps {
  isOpen: boolean;
  priceListId: string;
  existingServiceIds: Set<string>;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddServiceToPriceListModal({
  isOpen,
  priceListId,
  existingServiceIds,
  onClose,
  onSuccess,
}: AddServiceToPriceListModalProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [price, setPrice] = useState<number>(0);
  const [currency, setCurrency] = useState<string>('MXN');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const availableServices = services.filter((s) => !existingServiceIds.has(s.id));

  const filteredServices = availableServices.filter((service) =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (isOpen && services.length === 0) {
      fetchServices();
    }
  }, [isOpen]);

  // Reset highlighted index when filtered services change
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

  const loadDefaultPrice = async (service: Service): Promise<number> => {
    try {
      console.log('[AddServiceModal] Loading default price for service:', service.id);
      
      const defaultPriceList = await priceListsApi.getDefaultPriceList();
      console.log('[AddServiceModal] Default price list:', defaultPriceList);
      
      if (!defaultPriceList) {
        console.log('[AddServiceModal] No default price list found, using service default price:', service.price);
        return service.price || 0;
      }

      const prices = await priceListsApi.getServicePrices(defaultPriceList.id, service.id);
      console.log('[AddServiceModal] Fetched prices:', prices);
      
      if (prices && prices.length > 0) {
        console.log('[AddServiceModal] Found price in default list:', prices[0].price);
        return prices[0].price;
      }
      
      console.log('[AddServiceModal] No prices found in default list, using service default price:', service.price);
      return service.price || 0;
    } catch (error) {
      console.error('[AddServiceModal] Error loading default price:', error);
      toast.error('Error al cargar el precio default');
      return service.price || 0;
    }
  };

  const handleAddService = async () => {
    if (!selectedService || price < 0) {
      toast.error('Por favor selecciona un servicio y un precio válido');
      return;
    }

    setIsLoading(true);
    try {
      await priceListsApi.updateServicePrice(priceListId, selectedService.id, {
        price,
        currency,
        is_available: true,
      });

      toast.success('Servicio agregado a la lista');
      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Error adding service:', error);
      toast.error('Error al agregar servicio');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectService = async (service: Service) => {
    setSelectedService(service);
    setSelectedServiceId(service.id);
    setSearchQuery(service.name);
    setShowDropdown(false);
    
    // Load default price from the default price list, or use service.price as fallback
    setIsLoadingPrice(true);
    const defaultPrice = await loadDefaultPrice(service);
    setPrice(defaultPrice);
    setIsLoadingPrice(false);
  };

  const handleClose = () => {
    setSelectedService(null);
    setSelectedServiceId('');
    setSearchQuery('');
    setShowDropdown(false);
    setPrice(0);
    setCurrency('MXN');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 via-primary-600 to-primary-700 text-white p-4 rounded-t-lg flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Agregar Servicio</h2>
            <p className="text-primary-100 text-xs">Agrega un servicio a esta lista de precios</p>
          </div>
          <button
            onClick={handleClose}
            className="text-white hover:bg-blue-700/50 p-1 rounded transition"
          >
            <MdClose size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Service Autocomplete */}
          <div ref={dropdownRef} className="relative">
            <label className="block text-xs font-medium text-gray-700 mb-1 uppercase tracking-wide">
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
                  if (availableServices.length === 0 && !isFetching) {
                    fetchServices();
                  }
                }}
                placeholder={isFetching ? 'Cargando servicios...' : 'Busca o selecciona un servicio...'}
                disabled={isFetching}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 text-sm pr-8"
                autoComplete="off"
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
                        : selectedService?.id === service.id
                        ? 'bg-blue-100 text-blue-700'
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

            {showDropdown && filteredServices.length === 0 && !isFetching && availableServices.length === 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 p-3 text-sm text-gray-500">
                No hay servicios disponibles para agregar
              </div>
            )}

            {showDropdown && searchQuery && filteredServices.length === 0 && availableServices.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 p-3 text-sm text-gray-500">
                No se encontraron servicios con "{searchQuery}"
              </div>
            )}

            {!showDropdown && availableServices.length === 0 && !isFetching && (
              <p className="text-xs text-amber-600 mt-1">⚠️ Todos los servicios ya están en esta lista</p>
            )}
          </div>

          {/* Price Input */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1 uppercase tracking-wide">
              Precio * {isLoadingPrice && '(Cargando...)'}
            </label>
            <div className="relative">
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                step="0.01"
                min="0"
                placeholder={isLoadingPrice ? 'Cargando precio...' : 'Ingresa el precio'}
                disabled={isLoadingPrice}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              {isLoadingPrice && (
                <div className="absolute right-3 top-2.5">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500"></div>
                </div>
              )}
            </div>
            {selectedService && !isLoadingPrice && price > 0 && (
              <p className="text-xs text-green-600 mt-1">✓ Precio cargado de lista default</p>
            )}
            {selectedService && !isLoadingPrice && price === 0 && (
              <p className="text-xs text-amber-600 mt-1">⚠️ No hay precio en lista default. Ingresa uno.</p>
            )}
          </div>

          {/* Currency Select */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1 uppercase tracking-wide">
              Moneda
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            >
              <option value="MXN">MXN (Peso Mexicano)</option>
              <option value="USD">USD (Dólar)</option>
              <option value="EUR">EUR (Euro)</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1 px-3 py-2 border-2 border-gray-300 text-gray-700 font-medium text-sm rounded-lg hover:bg-gray-100 transition disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleAddService}
            disabled={isLoading || !selectedService || availableServices.length === 0}
            className="flex-1 px-3 py-2 bg-blue-600 text-white font-medium text-sm rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {isLoading ? 'Agregando...' : 'Agregar'}
          </button>
        </div>
      </div>
    </div>
  );
}


