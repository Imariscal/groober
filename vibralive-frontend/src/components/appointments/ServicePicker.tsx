'use client';

import { useState, useCallback, useMemo } from 'react';
import { Service, ServicePackage, PackageItem } from '@/types';
import { MdAdd, MdRemove, MdShoppingCart } from 'react-icons/md';
import { FormInput } from '@/components/FormFields';

interface ServicePickerProps {
  services: Service[];
  packages?: ServicePackage[];
  selectedServices: { [key: string]: number };
  servicePrices?: { [key: string]: number };
  onServiceAdd: (serviceId: string) => void;
  onServiceRemove: (serviceId: string) => void;
  onQuantityChange: (serviceId: string, quantity: number) => void;
  disabled?: boolean;
  viewMode?: 'expanded' | 'cards'; // 'expanded' = list view (default), 'cards' = grid view
}

export function ServicePicker({
  services,
  packages = [],
  selectedServices,
  servicePrices = {},
  onServiceAdd,
  onServiceRemove,
  onQuantityChange,
  disabled = false,
  viewMode = 'expanded', // Default to expanded view
}: ServicePickerProps) {
  const [searchInput, setSearchInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'services' | 'packages'>('services');
  const [localViewMode, setLocalViewMode] = useState<'expanded' | 'cards'>(viewMode);

  /**
   * 💰 Formatea un número como moneda con 2 decimales
   * Ej: 2023.5 -> "$2,023.50"
   */
  const formatCurrency = useCallback((amount: number): string => {
    return `$${amount.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  }, []);

  // Filter services by search
  const filteredServices = useMemo(() => {
    if (!searchInput.trim()) return services.filter(s => !selectedServices[s.id]);
    const query = searchInput.toLowerCase();
    return services.filter(
      (s) =>
        (s.name.toLowerCase().includes(query) ||
          (s.description && s.description.toLowerCase().includes(query))) &&
        !selectedServices[s.id]
    );
  }, [searchInput, services, selectedServices]);

  // Filter packages by search
  const filteredPackages = useMemo(() => {
    if (!searchInput.trim()) return packages;
    const query = searchInput.toLowerCase();
    return packages.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        (p.description && p.description.toLowerCase().includes(query))
    );
  }, [searchInput, packages]);

  const handleAddService = useCallback(
    (serviceId: string) => {
      onServiceAdd(serviceId);
      setSearchInput('');
      setIsOpen(false);
    },
    [onServiceAdd]
  );

  const handleAddPackage = useCallback(
    (pkg: ServicePackage) => {
      // Agregar cada servicio del paquete
      pkg.items.forEach((item: PackageItem) => {
        if (!selectedServices[item.serviceId]) {
          onServiceAdd(item.serviceId);
          // Si el paquete tiene cantidad > 1, actualizar la cantidad
          if (item.quantity && item.quantity > 1) {
            onQuantityChange(item.serviceId, item.quantity);
          }
        }
      });
      setSearchInput('');
      setIsOpen(false);
    },
    [selectedServices, onServiceAdd, onQuantityChange]
  );

  const selectedServicesList = useMemo(
    () =>
      Object.entries(selectedServices)
        .map(([serviceId, qty]) => ({
          service: services.find((s) => s.id === serviceId),
          qty,
        }))
        .filter((item) => item.service),
    [selectedServices, services]
  );

  return (
    <div className="space-y-4">
      {/* View Mode Selector + Tabs */}
      <div className="flex items-center justify-between gap-4">
        {/* Tabs */}
        {packages.length > 0 && (
          <div className="flex gap-2 border-b border-gray-200 flex-1">
            <button
              type="button"
              onClick={() => {
                setActiveTab('services');
                setSearchInput('');
              }}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'services'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
              disabled={disabled}
            >
              Servicios Individuales
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('packages');
                setSearchInput('');
              }}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'packages'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
              disabled={disabled}
            >
              <MdShoppingCart size={16} />
              Paquetes
            </button>
          </div>
        )}

        {/* View Mode Toggle */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setLocalViewMode('expanded')}
            disabled={disabled}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              localViewMode === 'expanded'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            title="Vista lista expandida"
          >
            📋 Lista
          </button>
          <button
            type="button"
            onClick={() => setLocalViewMode('cards')}
            disabled={disabled}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              localViewMode === 'cards'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            title="Vista tarjetas"
          >
            🎴 Cards
          </button>
        </div>
      </div>

      {/* EXPANDED VIEW: Autocomplete Input with Dropdown */}
      {localViewMode === 'expanded' && (
      <div className="relative">
        <FormInput
          type="text"
          placeholder={
            activeTab === 'services'
              ? 'Buscar servicio...'
              : 'Buscar paquete...'
          }
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onFocus={() => setIsOpen(true)}
          disabled={
            disabled ||
            (activeTab === 'services' ? services.length === 0 : packages.length === 0)
          }
          label={activeTab === 'services' ? 'Servicios *' : 'Paquetes *'}
          containerClassName="relative"
        />

        {/* Services Dropdown */}
        {isOpen && activeTab === 'services' && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-56 overflow-y-auto">
            {filteredServices.length > 0 ? (
              filteredServices.map((service) => (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => handleAddService(service.id)}
                  disabled={disabled}
                  className="w-full text-left px-4 py-3 hover:bg-primary-50 transition-colors border-b last:border-b-0 disabled:opacity-50"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{service.name}</p>
                      {service.description && (
                        <p className="text-xs text-gray-600 mt-1">{service.description}</p>
                      )}
                    </div>
                    <MdAdd className="text-primary-500 mt-1 flex-shrink-0" size={18} />
                  </div>
                </button>
              ))
            ) : (
              <div className="p-3 text-sm text-gray-500">
                {searchInput ? 'No se encontraron servicios' : 'Comienza a escribir para buscar'}
              </div>
            )}
          </div>
        )}

        {/* Packages Dropdown */}
        {isOpen && activeTab === 'packages' && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-56 overflow-y-auto">
            {filteredPackages.length > 0 ? (
              filteredPackages.map((pkg) => (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => handleAddPackage(pkg)}
                  disabled={disabled}
                  className="w-full text-left px-4 py-3 hover:bg-primary-50 transition-colors border-b last:border-b-0 disabled:opacity-50"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                        <MdShoppingCart size={16} className="text-primary-600" />
                        {pkg.name}
                      </p>
                      {pkg.description && (
                        <p className="text-xs text-gray-600 mt-1">{pkg.description}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        {pkg.items.length} servicio{pkg.items.length !== 1 ? 's' : ''}
                        {pkg.totalPrice && ` • ${formatCurrency(pkg.totalPrice)}`}
                      </p>
                    </div>
                    <MdAdd className="text-primary-500 mt-1 flex-shrink-0" size={18} />
                  </div>
                </button>
              ))
            ) : (
              <div className="p-3 text-sm text-gray-500">
                {searchInput
                  ? 'No se encontraron paquetes'
                  : 'Comienza a escribir para buscar'}
              </div>
            )}
          </div>
        )}

        {/* Click outside to close */}
        {isOpen && (
          <div
            className="fixed inset-0 z-0"
            onClick={() => setIsOpen(false)}
          />
        )}
      </div>
      )}

      {/* CARDS VIEW: Grid de tarjetas */}
      {localViewMode === 'cards' && (
        <div className="space-y-3">
          {/* Search Input */}
          <FormInput
            type="text"
            placeholder={
              activeTab === 'services'
                ? 'Buscar servicio...'
                : 'Buscar paquete...'
            }
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            disabled={disabled}
            label={activeTab === 'services' ? 'Servicios *' : 'Paquetes *'}
          />

          {/* Services Cards Grid */}
          {activeTab === 'services' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {filteredServices.length > 0 ? (
                filteredServices.map((service) => (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => handleAddService(service.id)}
                    disabled={disabled}
                    className="text-left p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all disabled:opacity-50"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">{service.name}</p>
                        {service.description && (
                          <p className="text-xs text-gray-600 mt-1">{service.description}</p>
                        )}
                      </div>
                      <MdAdd className="text-primary-500 flex-shrink-0" size={20} />
                    </div>
                  </button>
                ))
              ) : (
                <div className="col-span-full p-4 text-sm text-gray-500 text-center bg-gray-50 rounded-lg">
                  {searchInput ? 'No se encontraron servicios' : 'No hay servicios disponibles'}
                </div>
              )}
            </div>
          )}

          {/* Packages Cards Grid */}
          {activeTab === 'packages' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {filteredPackages.length > 0 ? (
                filteredPackages.map((pkg) => (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => handleAddPackage(pkg)}
                    disabled={disabled}
                    className="text-left p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all disabled:opacity-50"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                          <MdShoppingCart size={16} className="text-primary-600" />
                          {pkg.name}
                        </p>
                        {pkg.description && (
                          <p className="text-xs text-gray-600 mt-1">{pkg.description}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-2 font-medium">
                          {pkg.items.length} servicio{pkg.items.length !== 1 ? 's' : ''}
                          {pkg.totalPrice && ` • ${formatCurrency(pkg.totalPrice)}`}
                        </p>
                      </div>
                      <MdAdd className="text-primary-500 flex-shrink-0" size={20} />
                    </div>
                  </button>
                ))
              ) : (
                <div className="col-span-full p-4 text-sm text-gray-500 text-center bg-gray-50 rounded-lg">
                  {searchInput ? 'No se encontraron paquetes' : 'No hay paquetes disponibles'}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Selected Services List */}
      {selectedServicesList.length > 0 && (
        <div className="space-y-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-700">
            {selectedServicesList.length} servicio{selectedServicesList.length !== 1 ? 's' : ''} seleccionado{selectedServicesList.length !== 1 ? 's' : ''}
          </p>

          <div className="space-y-2">
            {selectedServicesList.map(({ service, qty }) => {
              const price = servicePrices[service!.id] || 0;
              const subtotal = price * qty;
              return (
                <div
                  key={service!.id}
                  className="flex items-center justify-between gap-3 p-3 bg-white rounded border border-gray-200"
                >
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between gap-2 mb-1">
                      <p className="text-sm font-medium text-gray-900">
                        {service!.name}
                      </p>
                      {servicePrices[service!.id] !== undefined && (
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-semibold">
                          {formatCurrency(price)}
                        </span>
                      )}
                    </div>
                    {servicePrices[service!.id] !== undefined && (
                      <p className="text-xs text-gray-600">
                        Subtotal: <span className="font-semibold text-primary-600">{formatCurrency(subtotal)}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Quantity Stepper */}
                  <div className="flex items-center border border-gray-300 rounded">
                    <button
                      type="button"
                      onClick={() => onQuantityChange(service!.id, qty - 1)}
                      disabled={disabled || qty <= 1}
                      className="px-2 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <MdRemove size={14} />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={qty}
                      onChange={(e) => {
                        const newQty = parseInt(e.target.value) || 1;
                        if (newQty >= 1) {
                          onQuantityChange(service!.id, newQty);
                        }
                      }}
                      disabled={disabled}
                      className="w-12 text-center text-sm border-none focus:outline-none disabled:bg-gray-100"
                    />
                    <button
                      type="button"
                      onClick={() => onQuantityChange(service!.id, qty + 1)}
                      disabled={disabled}
                      className="px-2 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <MdAdd size={14} />
                    </button>
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => onServiceRemove(service!.id)}
                    disabled={disabled}
                    className="px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                  >
                    Quitar
                  </button>
                </div>
              </div>
              );
            })}
          </div>

          {/* Total */}
          {selectedServicesList.length > 0 && (
            <div className="border-t border-gray-200 pt-3 mt-3">
              <div className="flex justify-between items-center">
                <p className="font-semibold text-gray-900">Total:</p>
                <p className="text-lg font-bold text-primary-600">
                  {formatCurrency(selectedServicesList
                    .reduce((sum, { service, qty }) => {
                      const price = servicePrices[service!.id] || 0;
                      return sum + price * qty;
                    }, 0))}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {services.length === 0 && packages.length === 0 && (
        <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded">
          No hay servicios o paquetes disponibles
        </div>
      )}
    </div>
  );
}
