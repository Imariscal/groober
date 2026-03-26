'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MdClose, MdKeyboardArrowDown, MdLocalPharmacy, MdSpa } from 'react-icons/md';
import { ServicePackage } from '@/types';
import { packagesApi } from '@/api/packages-api';
import { priceListsApi } from '@/api/price-lists-api';
import toast from 'react-hot-toast';

interface AddPackageToPriceListModalProps {
  isOpen: boolean;
  priceListId: string;
  existingPackageIds: Set<string>;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddPackageToPriceListModal({
  isOpen,
  priceListId,
  existingPackageIds,
  onClose,
  onSuccess,
}: AddPackageToPriceListModalProps) {
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [selectedPackage, setSelectedPackage] = useState<ServicePackage | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [price, setPrice] = useState<number>(0);
  const [currency, setCurrency] = useState<string>('MXN');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isLoadingPackageDetails, setIsLoadingPackageDetails] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const availablePackages = packages.filter((p) => !existingPackageIds.has(p.id));

  const filteredPackages = availablePackages.filter((pkg) =>
    pkg.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (isOpen && packages.length === 0) {
      fetchPackages();
    }
  }, [isOpen]);

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

  const fetchPackages = async () => {
    setIsFetching(true);
    try {
      const data = await packagesApi.getPackages();
      setPackages(data);
    } catch (error) {
      console.error('Error fetching packages:', error);
      toast.error('Error al cargar paquetes');
    } finally {
      setIsFetching(false);
    }
  };

  const handleAddPackage = async () => {
    if (!selectedPackage || price < 0) {
      toast.error('Por favor selecciona un paquete y un precio válido');
      return;
    }

    setIsLoading(true);
    try {
      await priceListsApi.updatePackagePrice(priceListId, selectedPackage.id, {
        price,
        currency,
        is_available: true,
      });

      toast.success('Paquete agregado a la lista');
      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Error adding package:', error);
      toast.error('Error al agregar paquete');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPackage = async (pkg: ServicePackage) => {
    setSelectedPackage(pkg);
    setSelectedPackageId(pkg.id);
    setSearchQuery(pkg.name);
    setShowDropdown(false);

    // Load full package details to show items and total price
    setIsLoadingPackageDetails(true);
    try {
      const fullPackage = await packagesApi.getPackage(pkg.id);
      if (fullPackage) {
        setSelectedPackage(fullPackage);
        // Set price to totalPrice if available, otherwise 0
        setPrice(fullPackage.totalPrice || 0);
        if (fullPackage.currency) {
          setCurrency(fullPackage.currency);
        }
      }
    } catch (error) {
      console.error('Error loading package details:', error);
      toast.error('Error al cargar detalles del paquete');
    } finally {
      setIsLoadingPackageDetails(false);
    }
  };

  const handleClose = () => {
    setSelectedPackage(null);
    setSelectedPackageId('');
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
        <div className="bg-gradient-to-r from-emerald-600 via-emerald-600 to-emerald-700 text-white p-4 rounded-t-lg flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Agregar Paquete</h2>
            <p className="text-emerald-100 text-xs">Agrega un paquete a esta lista de precios</p>
          </div>
          <button
            onClick={handleClose}
            className="text-white hover:bg-emerald-700/50 p-1 rounded transition"
          >
            <MdClose size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Package Autocomplete */}
          <div ref={dropdownRef} className="relative">
            <label className="block text-xs font-medium text-gray-700 mb-1 uppercase tracking-wide">
              Paquete *
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => {
                  setShowDropdown(true);
                  if (availablePackages.length === 0 && !isFetching) {
                    fetchPackages();
                  }
                }}
                placeholder={isFetching ? 'Cargando paquetes...' : 'Busca un paquete...'}
                disabled={isFetching}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-100 text-sm pr-8"
              />
              <div className="absolute right-2 top-2 pointer-events-none text-gray-400">
                <MdKeyboardArrowDown size={20} />
              </div>
            </div>

            {/* Dropdown */}
            {showDropdown && filteredPackages.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                {filteredPackages.map((pkg) => (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => handleSelectPackage(pkg)}
                    className={`w-full text-left px-3 py-2.5 hover:bg-emerald-50 transition border-b border-gray-100 last:border-0 ${
                      selectedPackage?.id === pkg.id
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'text-gray-700'
                    }`}
                  >
                    <div className="font-medium text-sm">{pkg.name}</div>
                    {pkg.description && (
                      <div className="text-xs text-gray-500 line-clamp-2">{pkg.description}</div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {showDropdown && filteredPackages.length === 0 && !isFetching && availablePackages.length === 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 p-3 text-sm text-gray-500">
                No hay paquetes disponibles para agregar
              </div>
            )}

            {showDropdown && searchQuery && filteredPackages.length === 0 && availablePackages.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 p-3 text-sm text-gray-500">
                No se encontraron paquetes con "{searchQuery}"
              </div>
            )}

            {!showDropdown && availablePackages.length === 0 && !isFetching && (
              <p className="text-xs text-amber-600 mt-1">⚠️ Todos los paquetes ya están en esta lista</p>
            )}
          </div>

          {/* Package Details - Services in Package */}
          {selectedPackage && (
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              {isLoadingPackageDetails ? (
                <div className="text-center py-2">
                  <p className="text-xs text-emerald-600">Cargando detalles...</p>
                </div>
              ) : selectedPackage.items && selectedPackage.items.length > 0 ? (
                <div>
                  <h4 className="text-xs font-bold text-emerald-700 uppercase mb-2">Servicios en el Paquete</h4>
                  <div className="space-y-1.5">
                    {selectedPackage.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-start justify-between p-2 bg-white rounded border border-emerald-100"
                      >
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-700">{item.serviceName || 'Servicio'}</p>
                          {item.quantity > 1 && (
                            <p className="text-xs text-gray-500">Cantidad: {item.quantity}</p>
                          )}
                        </div>
                        {item.price !== undefined && (
                          <p className="text-xs font-semibold text-emerald-700 text-right ml-2">
                            ${item.price.toFixed(2)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                  {selectedPackage.totalPrice !== undefined && (
                    <div className="mt-2 pt-2 border-t border-emerald-200">
                      <div className="flex justify-between items-center">
                        <p className="text-xs font-bold text-emerald-700">PRECIO TOTAL</p>
                        <p className="text-sm font-black text-emerald-700">
                          ${selectedPackage.totalPrice.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-gray-500 text-center py-2">No hay servicios en este paquete</p>
              )}
            </div>
          )}

          {/* Price Input */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1 uppercase tracking-wide">
              Precio *
              {selectedPackage?.totalPrice !== undefined && (
                <span className="text-emerald-600 font-normal">
                  {' '}(Calculado: ${selectedPackage.totalPrice.toFixed(2)})
                </span>
              )}
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
              step="0.01"
              min="0"
              placeholder="Ingresa el precio"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Currency Select */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1 uppercase tracking-wide">
              Moneda
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
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
            onClick={handleAddPackage}
            disabled={isLoading || !selectedPackage || availablePackages.length === 0}
            className="flex-1 px-3 py-2 bg-emerald-600 text-white font-medium text-sm rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
          >
            {isLoading ? 'Agregando...' : 'Agregar'}
          </button>
        </div>
      </div>
    </div>
  );
}


