'use client';

import { useState, useEffect } from 'react';
import { MdClose } from 'react-icons/md';
import { FiCopy } from 'react-icons/fi';
import { servicesApi } from '@/api/services-api';
import { serviceSizePriceApi } from '@/api/service-size-price-api';
import { priceListsApi } from '@/api/price-lists-api';
import { Service, CreateServicePayload } from '@/types';
import toast from 'react-hot-toast';

interface CreateServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  service?: Service;
  defaultCategory?: 'GROOMING' | 'MEDICAL';
}

interface FormErrors {
  name?: string;
  price?: string;
  category?: string;
  defaultDurationMinutes?: string;
  [key: string]: string | undefined;
}

type PetSize = 'XS' | 'S' | 'M' | 'L' | 'XL';

const PET_SIZES: PetSize[] = ['XS', 'S', 'M', 'L', 'XL'];
const SIZE_LABELS: Record<PetSize, string> = {
  'XS': 'Extra Pequeño (XS)',
  'S': 'Pequeño (S)',
  'M': 'Mediano (M)',
  'L': 'Grande (L)',
  'XL': 'Extra Grande (XL)',
};

export function CreateServiceModal({
  isOpen,
  onClose,
  onSuccess,
  service,
  defaultCategory,
}: CreateServiceModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [sizePrices, setSizePrices] = useState<Record<PetSize, number>>({
    'XS': 0,
    'S': 0,
    'M': 0,
    'L': 0,
    'XL': 0,
  });
  const [sizeDurations, setSizeDurations] = useState<Record<PetSize, number>>({
    'XS': 30,
    'S': 30,
    'M': 30,
    'L': 30,
    'XL': 30,
  });
  const [formData, setFormData] = useState<Partial<CreateServicePayload>>({
    name: '',
    description: '',
    category: defaultCategory || 'GROOMING',
    defaultDurationMinutes: 30,
    price: 0,
  });
  const [errors, setErrors] = useState<FormErrors>({});

  // Reset form when modal opens/closes
  useEffect(() => {
    const loadFormData = async () => {
      if (isOpen) {
        if (service) {
          console.log('Editing service:', service);
          
          setFormData({
            name: service.name || '',
            description: service.description || '',
            category: defaultCategory || service.category || 'GROOMING',
            defaultDurationMinutes: service.defaultDurationMinutes || 30,
            price: service.price || 0,
          });
          
          // Load existing size prices
          try {
            const prices = await serviceSizePriceApi.getSizePrices(service.id);
            if (prices && prices.length > 0) {
              const priceMap: Record<PetSize, number> = {
                'XS': 0,
                'S': 0,
                'M': 0,
                'L': 0,
                'XL': 0,
              };
              const durationMap: Record<PetSize, number> = {
                'XS': service.defaultDurationMinutes || 30,
                'S': service.defaultDurationMinutes || 30,
                'M': service.defaultDurationMinutes || 30,
                'L': service.defaultDurationMinutes || 30,
                'XL': service.defaultDurationMinutes || 30,
              };
              prices.forEach((p: any) => {
                // Handle both snake_case and camelCase field names for compatibility
                const size = (p.pet_size || p.petSize || p.size) as PetSize;
                const price = Number(p.price || 0);
                
                priceMap[size] = price;
                
                // Load duration if available - check multiple field names
                const duration = p.duration_minutes || p.durationMinutes || undefined;
                if (duration) {
                  durationMap[size] = Number(duration);
                }
                
                console.log(`[CreateServiceModal] Loaded size price:`, { size, price, duration });
              });
              setSizePrices(priceMap);
              setSizeDurations(durationMap);
            } else {
              // If no size prices exist, use the service price/duration as default
              setSizePrices({
                'XS': service.price || 0,
                'S': service.price || 0,
                'M': service.price || 0,
                'L': service.price || 0,
                'XL': service.price || 0,
              });
              setSizeDurations({
                'XS': service.defaultDurationMinutes || 30,
                'S': service.defaultDurationMinutes || 30,
                'M': service.defaultDurationMinutes || 30,
                'L': service.defaultDurationMinutes || 30,
                'XL': service.defaultDurationMinutes || 30,
              });
            }
          } catch (error) {
            console.log('No size prices found, using service price/duration:', service.price, service.defaultDurationMinutes);
            setSizePrices({
              'XS': service.price || 0,
              'S': service.price || 0,
              'M': service.price || 0,
              'L': service.price || 0,
              'XL': service.price || 0,
            });
            setSizeDurations({
              'XS': service.defaultDurationMinutes || 30,
              'S': service.defaultDurationMinutes || 30,
              'M': service.defaultDurationMinutes || 30,
              'L': service.defaultDurationMinutes || 30,
              'XL': service.defaultDurationMinutes || 30,
            });
          }
          
          console.log('Form data set with price:', service.price);
        } else {
          setFormData({
            name: '',
            description: '',
            category: 'GROOMING',
            defaultDurationMinutes: 30,
            price: 0,
          });
          setSizePrices({
            'XS': 0,
            'S': 0,
            'M': 0,
            'L': 0,
            'XL': 0,
          });
          setSizeDurations({
            'XS': 30,
            'S': 30,
            'M': 30,
            'L': 30,
            'XL': 30,
          });
        }
        setErrors({});
      }
    };

    loadFormData();
  }, [isOpen, service]);

  // Validations
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.category) {
      newErrors.category = 'La categoría es requerida';
    }

    if (!formData.defaultDurationMinutes || formData.defaultDurationMinutes < 1) {
      newErrors.defaultDurationMinutes = 'La duración debe ser mayor a 0 minutos';
    } else if (!Number.isInteger(formData.defaultDurationMinutes)) {
      newErrors.defaultDurationMinutes = 'La duración debe ser un número entero';
    }

    if (!formData.price || formData.price < 0) {
      newErrors.price = 'El precio es requerido y debe ser >= 0';
    } else if (!/^\d+(\.\d{0,2})?$/.test(formData.price.toString())) {
      newErrors.price = 'El precio debe tener máximo 2 decimales';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      let serviceId = service?.id;
      
      if (service) {
        // Edit mode
        await servicesApi.updateService(service.id, {
          name: formData.name,
          description: formData.description,
          category: formData.category,
          defaultDurationMinutes: formData.defaultDurationMinutes,
          price: formData.price,
        });

        toast.success('Servicio actualizado');
      } else {
        // Create mode
        const result = await servicesApi.createService({
          name: formData.name!,
          description: formData.description,
          category: formData.category!,
          defaultDurationMinutes: formData.defaultDurationMinutes,
          price: formData.price ?? 0,
        });
        serviceId = result?.id || result?.data?.id;
        toast.success('Servicio creado');
      }

      // Save size prices if any are set
      if (serviceId && Object.values(sizePrices).some(price => price > 0)) {
        // In edit mode, we should update ALL sizes that were originally loaded
        // In create mode, we only update sizes with price > 0
        const sizesToProcess = service ? PET_SIZES : PET_SIZES.filter(size => sizePrices[size] > 0);
        
        const pricesToCreate = sizesToProcess
          .map(size => ({
            petSize: size,
            price: sizePrices[size],
            currency: 'MXN',
            durationMinutes: sizeDurations[size],
          }));

        if (pricesToCreate.length > 0) {
          console.log('[DEBUG] Saving size prices:', pricesToCreate);
          
          try {
            await serviceSizePriceApi.batchCreateSizePrices(serviceId, pricesToCreate);
            toast.success('Precios y duraciones por tamaño guardados');
          } catch (error) {
            // If API error, still continue with form submission
            console.error('[CreateServiceModal] Error saving size prices:', error);
            toast.error('Error al guardar precios por tamaño, pero el servicio fue actualizado');
          }
        }
      }

      // Log durations for debugging (will be used when API is updated)
      if (Object.values(sizeDurations).some(d => d > 0)) {
        console.log('[DEBUG] Service durations by size:', sizeDurations);
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al procesar el servicio');
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col transform transition-all duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 via-primary-600 to-primary-700 px-6 py-5 flex items-center justify-between border-b border-primary-600 shadow-sm rounded-t-xl flex-shrink-0">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white">
                {service ? 'Editar Servicio' : 'Nuevo Servicio'}
              </h2>
              <p className="text-primary-100 text-sm mt-1">
                {service ? 'Actualiza los datos del servicio' : 'Completa los datos para crear un nuevo servicio'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition duration-200 flex-shrink-0"
            >
              <MdClose className="w-6 h-6" />
            </button>
          </div>

          {/* Form Body - Scrollable */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-5">
              {/* Información Básica */}
              <div className="border border-gray-200 rounded-lg p-4 bg-white">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-1 h-6 bg-primary-600 rounded"></div>
                  <h3 className="text-sm font-semibold text-gray-900">Información Básica</h3>
                </div>
                <div className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                        errors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Ej: Baño"
                      disabled={isLoading}
                    />
                    {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name}</p>}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción
                    </label>
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Ej: Servicio de baño y aseo"
                      rows={3}
                      disabled={isLoading}
                    />
                  </div>

                  {/* Category and Duration Row */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Category */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Categoría * {defaultCategory && <span className="text-xs text-blue-600">(Bloqueada)</span>}
                      </label>
                      <select
                        value={formData.category || defaultCategory || 'GROOMING'}
                        onChange={(e) => !defaultCategory && setFormData({ ...formData, category: e.target.value as 'MEDICAL' | 'GROOMING' })}
                        disabled={isLoading || !!defaultCategory}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                          errors.category ? 'border-red-500' : 'border-gray-300'
                        } ${defaultCategory ? 'bg-gray-100 opacity-60 cursor-not-allowed' : ''}`}
                      >
                        <option value="GROOMING">Grooming</option>
                        <option value="MEDICAL">Médico</option>
                      </select>
                      {errors.category && <p className="text-red-600 text-xs mt-1">{errors.category}</p>}
                      {defaultCategory && <p className="text-blue-600 text-xs mt-1">La categoría está determinada por la ruta de acceso</p>}
                    </div>

                    {/* Duration */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Duración (min) *
                      </label>
                      <input
                        type="number"
                        value={formData.defaultDurationMinutes || ''}
                        onChange={(e) => setFormData({ ...formData, defaultDurationMinutes: parseInt(e.target.value) || 30 })}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                          errors.defaultDurationMinutes ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="30"
                        min="1"
                        step="1"
                        disabled={isLoading}
                      />
                      {errors.defaultDurationMinutes && <p className="text-red-600 text-xs mt-1">{errors.defaultDurationMinutes}</p>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Precios */}
              <div className="border border-gray-200 rounded-lg p-4 bg-white">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-1 h-6 bg-primary-600 rounded"></div>
                  <h3 className="text-sm font-semibold text-gray-900">Precios</h3>
                </div>
                <div className="space-y-4">
                  {/* Default Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Precio Liste DEFAULT ($) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price || 0}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                        errors.price ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="0.00"
                      disabled={isLoading}
                    />
                    {errors.price && <p className="text-red-600 text-xs mt-1">{errors.price}</p>}
                  </div>

                  {/* Size-based Pricing */}
                  {formData.category === 'GROOMING' && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-700">Precios por Tamaño de Mascota</h4>
                        <button
                          type="button"
                          onClick={() => {
                            const firstPrice = sizePrices[PET_SIZES[0]] || formData.price || 0;
                            if (firstPrice > 0) {
                              const newPrices = { ...sizePrices };
                              PET_SIZES.forEach(size => {
                                newPrices[size] = firstPrice;
                              });
                              setSizePrices(newPrices);
                              toast.success('Precio aplicado a todos los tamaños');
                            } else {
                              toast.error('Ingresa un precio primero');
                            }
                          }}
                          className="flex items-center gap-1 text-xs bg-primary-100 hover:bg-primary-200 text-primary-700 px-2 py-1 rounded transition"
                          disabled={isLoading}
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
                              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                              placeholder="0.00"
                              disabled={isLoading}
                            />
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Estos precios se mostrarán automáticamente al agendar citas según el tamaño de la mascota.
                      </p>
                    </div>
                  )}

                  {/* Size-based Duration */}
                  {formData.category === 'GROOMING' && (
                    <div className="border-t pt-4 mt-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-700">Duraciones por Tamaño de Mascota</h4>
                        <button
                          type="button"
                          onClick={() => {
                            const defaultDuration = formData.defaultDurationMinutes || 30;
                            const newDurations = { ...sizeDurations };
                            PET_SIZES.forEach(size => {
                              newDurations[size] = defaultDuration;
                            });
                            setSizeDurations(newDurations);
                            toast.success('Duración aplicada a todos los tamaños');
                          }}
                          className="flex items-center gap-1 text-xs bg-primary-100 hover:bg-primary-200 text-primary-700 px-2 py-1 rounded transition"
                          disabled={isLoading}
                        >
                          <FiCopy className="w-3 h-3" />
                          Copiar del general
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-lg">
                        {PET_SIZES.map((size) => (
                          <div key={`duration-${size}`}>
                            <label className="block text-xs font-medium text-gray-600 mb-1.5">
                              {SIZE_LABELS[size]}
                            </label>
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="5"
                                max="480"
                                step="5"
                                value={sizeDurations[size] || 30}
                                onChange={(e) => {
                                  setSizeDurations({
                                    ...sizeDurations,
                                    [size]: parseInt(e.target.value) || 30,
                                  });
                                }}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="30"
                                disabled={isLoading}
                              />
                              <span className="text-xs text-gray-500 whitespace-nowrap">min</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        La duración varía según el tamaño de la mascota. Esto afecta el tiempo de la cita en el calendario.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </form>

          {/* Footer - Fixed */}
          <div className="flex gap-3 p-6 border-t border-gray-200 bg-white rounded-b-xl flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition disabled:opacity-50"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-4 py-2.5 bg-primary-600 text-white hover:bg-primary-700 rounded-lg font-medium transition disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Guardando...' : service ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}


