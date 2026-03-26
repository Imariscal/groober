'use client';

import { useState, useEffect } from 'react';
import { MdClose } from 'react-icons/md';
import { FiCopy } from 'react-icons/fi';
import { priceListsApi } from '@/api/price-lists-api';
import { serviceSizePriceApi } from '@/api/service-size-price-api';
import { ServicePrice, UpdateServicePricePayload, PetSize } from '@/types';
import toast from 'react-hot-toast';

interface EditServicePriceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  priceListId?: string;
  servicePrice?: ServicePrice;
}

interface FormErrors {
  price?: string;
  defaultPrice?: string;
  [key: string]: string | undefined;
}

interface SizePrices {
  XS: number;
  S: number;
  M: number;
  L: number;
  XL: number;
}

export function EditServicePriceModal({
  isOpen,
  onClose,
  onSuccess,
  priceListId,
  servicePrice,
}: EditServicePriceModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSizePrices, setIsLoadingSizePrices] = useState(false);
  
  const isGrooming = servicePrice?.service?.category === 'GROOMING';
  
  const [formData, setFormData] = useState<UpdateServicePricePayload>({
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

  // Load price list data when modal opens
  useEffect(() => {
    const loadData = async () => {
      if (!isOpen || !servicePrice) return;

      // For GROOMING services, load size prices
      if (isGrooming) {
        setIsLoadingSizePrices(true);
        try {
          const prices = await serviceSizePriceApi.getSizePrices(servicePrice.serviceId);
          if (prices && prices.length > 0) {
            const priceMap: SizePrices = {
              XS: 0,
              S: 0,
              M: 0,
              L: 0,
              XL: 0,
            };
            prices.forEach((p) => {
              priceMap[p.size as PetSize] = Number(p.price);
            });
            setSizePrices(priceMap);
            setDefaultPrice(Number(servicePrice.price));
          } else {
            // Initialize with service price if no size prices yet
            setSizePrices({
              XS: Number(servicePrice.price),
              S: Number(servicePrice.price),
              M: Number(servicePrice.price),
              L: Number(servicePrice.price),
              XL: Number(servicePrice.price),
            });
            setDefaultPrice(Number(servicePrice.price));
          }
        } catch (err) {
          console.error('Error loading size prices:', err);
          // Fall back to service price
          setSizePrices({
            XS: Number(servicePrice.price),
            S: Number(servicePrice.price),
            M: Number(servicePrice.price),
            L: Number(servicePrice.price),
            XL: Number(servicePrice.price),
          });
          setDefaultPrice(Number(servicePrice.price));
        } finally {
          setIsLoadingSizePrices(false);
        }
      }

      // Set form data
      setFormData({
        price: servicePrice.price,
        currency: servicePrice.currency || 'MXN',
        is_available: servicePrice.isAvailable,
      });
      setErrors({});
    };

    loadData();
  }, [isOpen, servicePrice, isGrooming]);

  // Validations
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (isGrooming) {
      // For grooming, validate all size prices
      const sizes: PetSize[] = ['XS', 'S', 'M', 'L', 'XL'];
      sizes.forEach((size) => {
        const price = sizePrices[size];
        if (!price || price < 0) {
          newErrors[size] = `Precio ${size} es requerido y debe ser >= 0`;
        } else if (!/^\d+(\.\d{0,2})?$/.test(price.toString())) {
          newErrors[size] = `Precio ${size} debe tener máximo 2 decimales`;
        }
      });
    } else {
      // For medical, validate single price
      if (!formData.price || formData.price < 0) {
        newErrors.price = 'El precio es requerido y debe ser >= 0';
      } else if (!/^\d+(\.\d{0,2})?$/.test(formData.price.toString())) {
        newErrors.price = 'El precio debe tener máximo 2 decimales';
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

    if (!validateForm() || !priceListId || !servicePrice) return;

    setIsLoading(true);
    try {
      if (isGrooming) {
        // Update size prices for grooming services
        const sizes: PetSize[] = ['XS', 'S', 'M', 'L', 'XL'];
        await Promise.all(
          sizes.map((size) =>
            serviceSizePriceApi.updateSizePrice(servicePrice.serviceId, size, {
              price: sizePrices[size],
              currency: formData.currency || 'MXN',
            })
          )
        );
        toast.success('Precios por tamaño actualizados');
      } else {
        // Update single price for medical services
        await priceListsApi.updateServicePrice(
          priceListId,
          servicePrice.serviceId,
          formData
        );
        toast.success('Precio actualizado');
      }
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al actualizar el precio');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !servicePrice) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col transform transition-all duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between border-b border-blue-700 shadow-sm">
            <div className="flex-1">
              <h2 className="text-lg font-bold text-white">Editar Precio</h2>
              <p className="text-blue-100 text-sm mt-1">{servicePrice.serviceName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition duration-200"
            >
              <MdClose className="w-6 h-6" />
            </button>
          </div>

          {/* Form Body - Scrollable */}
          <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6">
            {isGrooming && isLoadingSizePrices ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : isGrooming ? (
              // GROOMING: Show price by size
              <div className="space-y-6">
                {/* Precio Base Section */}
                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                  <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wide flex items-center gap-2">
                    <div className="w-1 h-4 bg-blue-600 rounded-full" />
                    Precio Base
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                        Precio Predeterminado ($)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={defaultPrice || 0}
                          onChange={(e) => setDefaultPrice(parseFloat(e.target.value) || 0)}
                          className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            errors.defaultPrice ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="0.00"
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={handleApplyToAll}
                          disabled={isLoading || !defaultPrice}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                        >
                          <FiCopy className="w-4 h-4" />
                          <span className="hidden sm:inline">Aplicar a todos</span>
                        </button>
                      </div>
                      {errors.defaultPrice && <p className="text-red-600 text-xs mt-1">{errors.defaultPrice}</p>}
                    </div>
                  </div>
                </div>

                {/* Precios por Tamaño Section */}
                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                  <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wide flex items-center gap-2">
                    <div className="w-1 h-4 bg-blue-600 rounded-full" />
                    Precios por Tamaño
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {(['XS', 'S', 'M', 'L', 'XL'] as PetSize[]).map((size) => (
                      <div key={size}>
                        <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                          Tamaño {size} ($)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={sizePrices[size] || 0}
                          onChange={(e) => setSizePrices({ ...sizePrices, [size]: parseFloat(e.target.value) || 0 })}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            errors[size] ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="0.00"
                          disabled={isLoading}
                        />
                        {errors[size] && <p className="text-red-600 text-xs mt-1">{errors[size]}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              // MEDICAL: Show single price
              <div className="space-y-6">
                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                  <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wide flex items-center gap-2">
                    <div className="w-1 h-4 bg-blue-600 rounded-full" />
                    Información de Precio
                  </h3>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                      Precio ($) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price || 0}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.price ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="0.00"
                      disabled={isLoading}
                    />
                    {errors.price && <p className="text-red-600 text-xs mt-1">{errors.price}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Currency & Availability Section */}
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 mt-6">
              <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wide flex items-center gap-2">
                <div className="w-1 h-4 bg-blue-600 rounded-full" />
                Configuración
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                    Moneda
                  </label>
                  <select
                    value={formData.currency || 'MXN'}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                  >
                    <option value="MXN">Pesos (MXN)</option>
                    <option value="USD">Dólares (USD)</option>
                    <option value="EUR">Euros (EUR)</option>
                  </select>
                </div>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_available || false}
                    onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                    className="w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                  />
                  <span className="text-sm font-medium text-gray-700">Disponible</span>
                </label>
              </div>
            </div>
          </form>

          {/* Footer - Fixed */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium disabled:opacity-50"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition font-medium disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar'
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}



