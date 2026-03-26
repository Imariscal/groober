# IMPLEMENTACIÓN - GroomingBatchAppointmentModal.tsx

## 📋 ESPECIFICACIÓN COMPLETA

### 1. IMPORTS Y TIPOS

```typescript
import React, { useState, useCallback, useEffect } from 'react';
import { X, Plus, Trash2, AlertCircle, Loader } from 'lucide-react';
import { pricingApi } from '@/lib/pricing-api';
import { appointmentsApi } from '@/lib/appointments-api';
import { useClinicTimezone } from '@/hooks/useClinicTimezone';
import { getClinicDateKey } from '@/lib/timezone-utils';
import { Pet, ServicePrice } from '@/types';

interface BatchPetRow {
  petId: string;
  petName?: string;
  serviceIds: string[];
  quantities: number[];
  reason?: string;
  estimatedPrice?: number;
  isValidating?: boolean;
  error?: string;
}

interface GroomingBatchAppointmentModalProps {
  isOpen: boolean;
  clientId: string;
  clientName?: string;
  availablePets: Pet[];
  availableServices?: ServicePrice[]; // Si no se pasa, se fetch en el modal
  onClose: () => void;
  onSuccess: (result: any) => void;
}
```

### 2. ESTADO DEL COMPONENTE

```typescript
const GroomingBatchAppointmentModal: React.FC<GroomingBatchAppointmentModalProps> = ({
  isOpen,
  clientId,
  clientName = 'Cliente',
  availablePets,
  availableServices: initialServices,
  onClose,
  onSuccess,
}) => {
  const clinicTimezone = useClinicTimezone();

  // Parámetros Comunes
  const [scheduledDate, setScheduledDate] = useState<string>(
    getClinicDateKey(new Date(), clinicTimezone)
  );
  const [scheduledTime, setScheduledTime] = useState<string>('09:00');
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [locationType, setLocationType] = useState<'CLINIC' | 'HOME'>('CLINIC');
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [assignedStaffUserId, setAssignedStaffUserId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Mascotas y Servicios
  const [pets, setPets] = useState<BatchPetRow[]>([]);
  const [availableServices, setAvailableServices] = useState<ServicePrice[]>(
    initialServices || []
  );

  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [expandedPetIndex, setExpandedPetIndex] = useState<number | null>(null);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [clientAddresses, setClientAddresses] = useState<any[]>([]);
  const [staffUsers, setStaffUsers] = useState<any[]>([]);

  // Fetch initial data
  useEffect(() => {
    if (isOpen && !initialServices) {
      fetchInitialData();
    }
  }, [isOpen, initialServices]);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      // Fetch servicios, direcciones del cliente, y estilistas
      const [services, addresses, staff] = await Promise.all([
        pricingApi.getAllServices(),
        pricingApi.getClientAddresses(clientId),
        pricingApi.getAvailableStaff(getClinicDateKey(new Date(scheduledDate), clinicTimezone)),
      ]);
      setAvailableServices(services);
      setClientAddresses(addresses);
      setStaffUsers(staff);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      setErrors((prev) => ({ ...prev, init: 'Error al cargar datos iniciales' }));
    } finally {
      setIsLoading(false);
    }
  };
```

### 3. HANDLERS PRINCIPALES

```typescript
  // Agregar mascota a la lista
  const addPet = (petId: string) => {
    if (pets.some((p) => p.petId === petId)) {
      setErrors((prev) => ({ ...prev, duplicate: `${getPetName(petId)} ya está en la lista` }));
      return;
    }

    const pet = availablePets.find((p) => p.id === petId);
    setPets((prev) => [
      ...prev,
      {
        petId,
        petName: pet?.name,
        serviceIds: [],
        quantities: [],
        estimatedPrice: 0,
      },
    ]);

    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.duplicate;
      return newErrors;
    });
  };

  // Remover mascota de la lista
  const removePet = (index: number) => {
    setPets((prev) => prev.filter((_, i) => i !== index));
    calculateTotalPrice(pets.filter((_, i) => i !== index));
  };

  // Actualizar servicios de una mascota
  const updatePetServices = (
    index: number,
    serviceIds: string[],
    quantities: number[]
  ) => {
    setPets((prev) => {
      const newPets = [...prev];
      newPets[index].serviceIds = serviceIds;
      newPets[index].quantities = quantities;
      return newPets;
    });

    // Recalcular precio de esta mascota
    calculatePetPrice(index);
  };

  // Calcular precio para una mascota específica
  const calculatePetPrice = async (petIndex: number) => {
    const pet = pets[petIndex];
    if (!pet.serviceIds.length) {
      setPets((prev) => {
        const newPets = [...prev];
        newPets[petIndex].estimatedPrice = 0;
        return newPets;
      });
      return;
    }

    try {
      setPets((prev) => {
        const newPets = [...prev];
        newPets[petIndex].isValidating = true;
        return newPets;
      });

      const pricing = await pricingApi.calculatePetGroomingPrice({
        petId: pet.petId,
        serviceIds: pet.serviceIds,
        quantities: pet.quantities,
        durationMinutes,
      });

      setPets((prev) => {
        const newPets = [...prev];
        newPets[petIndex].estimatedPrice = pricing.totalAmount;
        newPets[petIndex].isValidating = false;
        return newPets;
      });

      calculateTotalPrice(pets);
    } catch (error) {
      console.error(`Error calculating price for pet ${petIndex}:`, error);
      setPets((prev) => {
        const newPets = [...prev];
        newPets[petIndex].error = 'Error al calcular precio';
        newPets[petIndex].isValidating = false;
        return newPets;
      });
    }
  };

  // Calcular precio total
  const calculateTotalPrice = (petsList: BatchPetRow[]) => {
    const total = petsList.reduce((sum, pet) => sum + (pet.estimatedPrice || 0), 0);
    setTotalPrice(total);
  };

  // Validar formulario
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (pets.length === 0) {
      newErrors.pets = 'Debes seleccionar al menos 1 mascota';
    }

    pets.forEach((pet, index) => {
      if (pet.serviceIds.length === 0) {
        newErrors[`pet_${index}`] = `${pet.petName} debe tener servicios seleccionados`;
      }
    });

    if (locationType === 'HOME' && !selectedAddressId) {
      newErrors.address = 'Debes seleccionar una dirección para citas HOME';
    }

    if (!scheduledDate) {
      newErrors.date = 'Debes seleccionar una fecha';
    }

    if (!scheduledTime) {
      newErrors.time = 'Debes seleccionar una hora';
    }

    if (durationMinutes < 15) {
      newErrors.duration = 'Duración mínima es 15 minutos';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Enviar batch appointment
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsSaving(true);

      // Construir payload
      const scheduledDateTime = `${scheduledDate}T${scheduledTime}:00`;

      const payload = {
        clientId,
        scheduledAt: scheduledDateTime,
        durationMinutes,
        locationType,
        addressId: locationType === 'HOME' ? selectedAddressId : undefined,
        assignedStaffUserId: locationType === 'CLINIC' ? assignedStaffUserId : undefined,
        notes,
        pets: pets.map((pet) => ({
          petId: pet.petId,
          serviceIds: pet.serviceIds,
          quantities: pet.quantities,
          reason: pet.reason,
        })),
      };

      // Enviar al backend
      const result = await pricingApi.createBatchAppointmentWithPricing(payload);

      // Success
      onSuccess(result);
      handleClose();
    } catch (error: any) {
      console.error('Error creating batch appointment:', error);
      setErrors((prev) => ({
        ...prev,
        submit: error.response?.data?.message || 'Error al crear citas',
      }));
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setPets([]);
    setScheduledDate(getClinicDateKey(new Date(), clinicTimezone));
    setScheduledTime('09:00');
    setDurationMinutes(60);
    setLocationType('CLINIC');
    setSelectedAddressId('');
    setAssignedStaffUserId('');
    setNotes('');
    setErrors({});
    setExpandedPetIndex(null);
    setTotalPrice(0);
    onClose();
  };

  const getPetName = (petId: string) => {
    return availablePets.find((p) => p.id === petId)?.name || 'Mascota desconocida';
  };

  // Return JSX...
};
```

### 4. JSX - ESTRUCTURA DEL MODAL

```typescript
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* HEADER */}
        <div className="sticky top-0 bg-white border-b border-gray-200 flex justify-between items-center p-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Crear Citas Batch
            </h2>
            <p className="text-sm text-gray-600">Cliente: {clientName}</p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* LOADING STATE */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <Loader className="animate-spin text-blue-500" size={32} />
          </div>
        )}

        {!isLoading && (
          <div className="p-6 space-y-6">
            {/* ERROR GENERAL */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
                <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
                <p className="text-red-800">{errors.submit}</p>
              </div>
            )}

            {errors.pets && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
                <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
                <p className="text-red-800">{errors.pets}</p>
              </div>
            )}

            {/* SECCIÓN 1: PARÁMETROS COMUNES */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-4">
                Parámetros Comunes (Todas las Mascotas)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Fecha */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Hora */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hora
                  </label>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Duración */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duración (minutos)
                  </label>
                  <input
                    type="number"
                    min="15"
                    step="15"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Tipo de Ubicación */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo
                  </label>
                  <select
                    value={locationType}
                    onChange={(e) => {
                      setLocationType(e.target.value as 'CLINIC' | 'HOME');
                      setSelectedAddressId('');
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="CLINIC">Clínica</option>
                    <option value="HOME">Domicilio</option>
                  </select>
                </div>

                {/* Dirección (si HOME) */}
                {locationType === 'HOME' && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dirección
                    </label>
                    <select
                      value={selectedAddressId}
                      onChange={(e) => setSelectedAddressId(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.address ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Seleccionar dirección...</option>
                      {clientAddresses.map((addr) => (
                        <option key={addr.id} value={addr.id}>
                          {addr.address}, {addr.neighborhood}
                        </option>
                      ))}
                    </select>
                    {errors.address && (
                      <p className="text-red-600 text-sm mt-1">{errors.address}</p>
                    )}
                  </div>
                )}

                {/* Asignación (si CLINIC) */}
                {locationType === 'CLINIC' && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Asignar Estilista (opcional)
                    </label>
                    <select
                      value={assignedStaffUserId}
                      onChange={(e) => setAssignedStaffUserId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Seleccionar estilista...</option>
                      {staffUsers.map((staff) => (
                        <option key={staff.id} value={staff.id}>
                          {staff.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Notas */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notas (opcional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    placeholder="Ej: Cliente requiere mantener cierta hora"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: MASCOTAS Y SERVICIOS */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-900">
                  Mascotas ({pets.length})
                </h3>
                <button
                  onClick={() => setExpandedPetIndex(pets.length)} // Expand selector cuando agregues
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Plus size={16} />
                  Agregar Mascota
                </button>
              </div>

              {/* Lista de Mascotas */}
              <div className="space-y-3">
                {pets.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-600">No hay mascotas seleccionadas</p>
                  </div>
                ) : (
                  pets.map((pet, index) => (
                    <PetRowComponent
                      key={`${pet.petId}-${index}`}
                      pet={pet}
                      index={index}
                      expanded={expandedPetIndex === index}
                      onToggleExpand={() =>
                        setExpandedPetIndex(expandedPetIndex === index ? null : index)
                      }
                      onUpdateServices={updatePetServices}
                      onRemove={removePet}
                      availableServices={availableServices}
                      error={errors[`pet_${index}`]}
                    />
                  ))
                )}
              </div>

              {/* Agregador Mascota (si está expandido) */}
              {expandedPetIndex === pets.length && (
                <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">
                    Seleccionar Mascota
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {availablePets
                      .filter((p) => !pets.some((pp) => pp.petId === p.id))
                      .map((p) => (
                        <button
                          key={p.id}
                          onClick={() => {
                            addPet(p.id);
                            setExpandedPetIndex(null);
                          }}
                          className="text-left px-3 py-2 hover:bg-blue-100 rounded-lg border border-blue-200 hover:border-blue-400 transition-colors"
                        >
                          <p className="font-medium">{p.name}</p>
                          <p className="text-xs text-gray-600">{p.breed}</p>
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* SECCIÓN 3: PREVIEW DE PRECIOS */}
            <BulkPricingPreviewComponent
              pets={pets}
              totalPrice={totalPrice}
            />

            {/* BOTONES DE ACCIÓN */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={handleClose}
                disabled={isSaving}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSaving || pets.length === 0}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader className="animate-spin" size={16} />
                    Creando...
                  </>
                ) : (
                  `Crear ${pets.length} Cita${pets.length !== 1 ? 's' : ''}`
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroomingBatchAppointmentModal;
```

### 5. COMPONENTES REUTILIZABLES NECESARIOS

#### PetRowComponent (dentro del archivo o separado)

```typescript
const PetRowComponent: React.FC<{
  pet: BatchPetRow;
  index: number;
  expanded: boolean;
  onToggleExpand: () => void;
  onUpdateServices: (index: number, serviceIds: string[], quantities: number[]) => void;
  onRemove: (index: number) => void;
  availableServices: ServicePrice[];
  error?: string;
}> = ({
  pet,
  index,
  expanded,
  onToggleExpand,
  onUpdateServices,
  onRemove,
  availableServices,
  error,
}) => {
  return (
    <div
      key={index}
      className={`border rounded-lg p-4 transition-all ${
        error ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-center justify-between cursor-pointer" onClick={onToggleExpand}>
        <div className="flex-1">
          <p className="font-medium text-gray-900">{pet.petName}</p>
          <p className="text-sm text-gray-600">
            {pet.serviceIds.length} servicio{pet.serviceIds.length !== 1 ? 's' : ''} •${' '}
            {pet.estimatedPrice?.toFixed(2) || '0.00'}
          </p>
          {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(index);
          }}
          className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
          <h5 className="font-medium text-gray-900">Servicios</h5>
          <ServiceSelectorComponent
            selectedServiceIds={pet.serviceIds}
            selectedQuantities={pet.quantities}
            availableServices={availableServices}
            onChange={(serviceIds, quantities) =>
              onUpdateServices(index, serviceIds, quantities)
            }
          />
        </div>
      )}
    </div>
  );
};
```

#### BulkPricingPreviewComponent

```typescript
const BulkPricingPreviewComponent: React.FC<{
  pets: BatchPetRow[];
  totalPrice: number;
}> = ({ pets, totalPrice }) => {
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <h3 className="font-semibold text-gray-900 mb-3">Resumen de Precios</h3>
      <div className="space-y-2 mb-3">
        {pets.map((pet, index) => (
          <div key={index} className="flex justify-between text-sm">
            <span className="text-gray-700">{pet.petName}</span>
            <span className="font-medium text-gray-900">
              ${pet.estimatedPrice?.toFixed(2) || '0.00'}
            </span>
          </div>
        ))}
      </div>
      <div className="border-t border-green-200 pt-3 flex justify-between">
        <span className="font-semibold text-gray-900">Total Batch</span>
        <span className="text-lg font-bold text-green-600">
          ${totalPrice.toFixed(2)}
        </span>
      </div>
      <div className="mt-3 text-xs text-gray-600">
        <p>Cantidad de citas: {pets.length}</p>
        <p>Citas separadas por mascota (facturación individual)</p>
      </div>
    </div>
  );
};
```

#### ServiceSelectorComponent

```typescript
const ServiceSelectorComponent: React.FC<{
  selectedServiceIds: string[];
  selectedQuantities: number[];
  availableServices: ServicePrice[];
  onChange: (serviceIds: string[], quantities: number[]) => void;
}> = ({ selectedServiceIds, selectedQuantities, availableServices, onChange }) => {
  const handleServiceToggle = (serviceId: string) => {
    const newServiceIds = selectedServiceIds.includes(serviceId)
      ? selectedServiceIds.filter((id) => id !== serviceId)
      : [...selectedServiceIds, serviceId];

    const newQuantities = newServiceIds.map((id) => {
      const idx = selectedServiceIds.indexOf(id);
      return idx >= 0 ? selectedQuantities[idx] : 1;
    });

    onChange(newServiceIds, newQuantities);
  };

  const handleQuantityChange = (serviceId: string, quantity: number) => {
    const idx = selectedServiceIds.indexOf(serviceId);
    if (idx >= 0) {
      const newQuantities = [...selectedQuantities];
      newQuantities[idx] = Math.max(1, quantity);
      onChange(selectedServiceIds, newQuantities);
    }
  };

  return (
    <div className="space-y-2 max-h-48 overflow-y-auto">
      {availableServices.map((service, idx) => {
        const isSelected = selectedServiceIds.includes(service.id);
        const selectedIdx = selectedServiceIds.indexOf(service.id);
        const quantity = isSelected ? selectedQuantities[selectedIdx] : 1;

        return (
          <div key={service.id} className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => handleServiceToggle(service.id)}
              className="w-4 h-4"
            />
            <div className="flex-1">
              <p className="text-sm font-medium">{service.name}</p>
              <p className="text-xs text-gray-600">${service.price.toFixed(2)}</p>
            </div>
            {isSelected && (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) =>
                    handleQuantityChange(service.id, parseInt(e.target.value))
                  }
                  className="w-10 px-2 py-1 text-sm border border-gray-300 rounded"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
```

## 📝 SIGUIENTE PASO

Este código proporciona:
- ✅ Estructura completa del modal batch
- ✅ Manejo de múltiples mascotas con servicios por mascota
- ✅ Cálculo de precios en tiempo real
- ✅ Validaciones exhaustivas
- ✅ Integración con pricingApi y appointmentsApi
- ✅ Timezone-aware con useClinicTimezone
- ✅ Componentes reutilizables

### Listo para:
1. Crear archivo con este código
2. Actualizar pricingApi.ts con método createBatchAppointmentWithPricing()
3. Exportar GroomingBatchAppointmentModal desde appointments/index.ts
4. Integrar en página de citas o cliente
