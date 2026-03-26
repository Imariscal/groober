# 🚀 Implementación: Cálculo Automático de Duración en Citas Grooming

**Fecha:** 12 Marzo 2026  
**Versión:** 1.0  
**Estado:** En Desarrollo

---

## 📋 Índice

1. [Estructura de Datos](#estructura-de-datos)
2. [Backend - Funciones de Cálculo](#backend---funciones-de-cálculo)
3. [Frontend - Actualización del Modal](#frontend---actualización-del-modal)
4. [Componentes a Crear/Modificar](#componentes-a-crear-modificar)
5. [Pasos de Implementación](#pasos-de-implementación)
6. [Testing](#testing)

---

## 🏗️ Estructura de Datos

### **1. TypeScript Interfaces**

```typescript
// === ARCHIVO: src/types/grooming.types.ts ===

/**
 * Información de cálculo de duración para citas grooming
 */
export interface DurationCalculation {
  // Detalle de cálculo
  servicesTotal: number;           // Suma bruta de servicios
  comboReduction: number;          // Minutos reducidos por combos
  calculatedDuration: number;      // Después de aplicar combos
  roundedDuration: number;         // Redondeado a slot estándar
  
  // Desglose por servicio
  breakdown: ServiceDurationBreakdown[];
  
  // Metadatos
  appliedCombos: string[];         // ["baño_corte"] si aplica
  slot: DurationSlot;              // Slot final utilizado
}

export interface ServiceDurationBreakdown {
  serviceId: string;
  serviceName: string;
  duration: number;                // Duración en minutos
  petSize: string;                 // Tamaño mascota utilizado
}

export interface DurationSlot {
  minutes: number;
  label: string;                   // "30 min", "1 hora", "1h 15min", etc.
  hours: number;
  mins: number;
}

/**
 * Estructura para formulario de cita grooming
 */
export interface CreateGroomingAppointmentForm {
  petId: string;
  serviceIds: string[];
  
  // Duración
  durationInfo: DurationCalculation | null;
  finalDuration: number;           // Lo que se va a guardar
  isPersonalized: boolean;         // ¿Usuario modificó? 
  
  // Fecha/Hora
  scheduledAt: Date;
  startTime: string;               // HH:mm
  
  // Opcional
  stylistId?: string;
  notes?: string;
}

/**
 * Slots disponibles en el sistema
 */
export const DURATION_SLOTS: DurationSlot[] = [
  { minutes: 30, label: "30 minutos", hours: 0, mins: 30 },
  { minutes: 45, label: "45 minutos", hours: 0, mins: 45 },
  { minutes: 60, label: "1 hora", hours: 1, mins: 0 },
  { minutes: 75, label: "1 hora 15 min", hours: 1, mins: 15 },
  { minutes: 90, label: "1 hora 30 min", hours: 1, mins: 30 },
  { minutes: 105, label: "1 hora 45 min", hours: 1, mins: 45 },
  { minutes: 120, label: "2 horas", hours: 2, mins: 0 },
  { minutes: 135, label: "2 horas 15 min", hours: 2, mins: 15 },
  { minutes: 150, label: "2 horas 30 min", hours: 2, mins: 30 },
  { minutes: 165, label: "2 horas 45 min", hours: 2, mins: 45 },
  { minutes: 180, label: "3 horas", hours: 3, mins: 0 },
  { minutes: 240, label: "4 horas", hours: 4, mins: 0 },
  { minutes: 300, label: "5 horas", hours: 5, mins: 0 },
  { minutes: 360, label: "6 horas", hours: 6, mins: 0 },
  { minutes: 420, label: "7 horas", hours: 7, mins: 0 },
  { minutes: 480, label: "8 horas", hours: 8, mins: 0 },
];
```

---

## 🔧 Backend - Funciones de Cálculo

### **1. Archivo: grooming-duration.utils.ts**

```typescript
// === ARCHIVO: src/modules/appointments/utils/grooming-duration.utils.ts ===

import { 
  DURATION_SLOTS, 
  DurationSlot, 
  DurationCalculation,
  ServiceDurationBreakdown
} from './grooming.types';

/**
 * Encuentra el slot de duración más cercano
 * @param minutes Minutos a redondear
 * @returns Slot más cercano
 */
export function findNearestSlot(minutes: number): DurationSlot {
  // Límites
  if (minutes < 30) {
    return DURATION_SLOTS[0]; // 30 min mínimo
  }
  if (minutes > 480) {
    return DURATION_SLOTS[DURATION_SLOTS.length - 1]; // 480 max
  }
  
  // Buscar slot más cercano
  let closestSlot = DURATION_SLOTS[0];
  let minDifference = Math.abs(minutes - closestSlot.minutes);
  
  for (const slot of DURATION_SLOTS) {
    const difference = Math.abs(minutes - slot.minutes);
    
    // Si la diferencia es igual, preferir ARRIBA (slot más grande)
    if (difference < minDifference) {
      closestSlot = slot;
      minDifference = difference;
    } else if (difference === minDifference && slot.minutes > closestSlot.minutes) {
      closestSlot = slot;
    }
  }
  
  return closestSlot;
}

/**
 * Convierte minutos a formato legible (ejemplo: "1h 30min")
 */
export function formatMinutesToHuman(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) {
    return `${mins} min`;
  }
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}min`;
}

/**
 * Aplica reglas de combos (reducciones de tiempo)
 */
export function applyComboReductions(serviceNames: string[]): {
  reduction: number;
  appliedCombos: string[];
} {
  let totalReduction = 0;
  const appliedCombos: string[] = [];
  
  // Regla 1: Baño + Corte = -10 min
  if (serviceNames.includes('Baño') && serviceNames.includes('Corte')) {
    totalReduction += 10;
    appliedCombos.push('baño_corte');
  }
  
  // NOTA: Agregar más combos aquí si aplica
  // Ejemplo:
  // if (serviceNames.includes('Baño') && serviceNames.includes('Baño Anti-garrapatas')) {
  //   totalReduction += 5;
  //   appliedCombos.push('baño_antiparásitos');
  // }
  
  return { reduction: totalReduction, appliedCombos };
}
```

### **2. Archivo: grooming.service.ts (SERVICIO PRINCIPAL)**

```typescript
// === ARCHIVO: src/modules/appointments/services/grooming.service.ts ===

import { Injectable } from '@nestjs/common';
import { DurationCalculation, CreateGroomingAppointmentForm } from '../types/grooming.types';
import {
  findNearestSlot,
  formatMinutesToHuman,
  applyComboReductions,
} from '../utils/grooming-duration.utils';

@Injectable()
export class GroomingService {
  
  constructor(
    private readonly petsService: PetsService,
    private readonly servicesService: ServicesService,
    private readonly serviceSizePriceService: ServiceSizePriceService,
  ) {}

  /**
   * Calcula la duración total de una cita grooming
   * @param petId ID de la mascota
   * @param serviceIds IDs de los servicios seleccionados
   * @returns Objeto con detalles del cálculo
   */
  async calculateGroomingDuration(
    petId: string,
    serviceIds: string[]
  ): Promise<DurationCalculation> {
    
    // Validaciones
    if (!petId || !serviceIds || serviceIds.length === 0) {
      throw new BadRequestException('petId y serviceIds son requeridos');
    }

    // 1. Obtener mascota y servicios
    const pet = await this.petsService.findOne(petId);
    if (!pet) {
      throw new NotFoundException(`Mascota no encontrada: ${petId}`);
    }

    const services = await Promise.all(
      serviceIds.map(id => this.servicesService.findOne(id))
    );

    const petSize = pet.size || 'M'; // Default MEDIUM

    // 2. Calcular duración de cada servicio
    let servicesTotal = 0;
    const breakdown: ServiceDurationBreakdown[] = [];

    for (const service of services) {
      // Buscar duración size-specific en serviceSizePrices
      const sizePrice = await this.serviceSizePriceService.findByServiceAndSize(
        service.id,
        petSize
      );

      let duration = sizePrice?.durationMinutes;

      // Fallback
      if (!duration) {
        duration = service.defaultDurationMinutes || 30;
      }

      breakdown.push({
        serviceId: service.id,
        serviceName: service.name,
        duration: duration,
        petSize: petSize,
      });

      servicesTotal += duration;
    }

    // 3. Aplicar reducciones por combos
    const serviceNames = breakdown.map(b => b.serviceName);
    const { reduction: comboReduction, appliedCombos } = applyComboReductions(serviceNames);
    
    const calculatedDuration = servicesTotal - comboReduction;

    // 4. Redondear a slot
    const slot = findNearestSlot(calculatedDuration);

    // 5. Retornar resultado
    return {
      servicesTotal,
      comboReduction,
      calculatedDuration,
      roundedDuration: slot.minutes,
      breakdown,
      appliedCombos,
      slot,
    };
  }

  /**
   * Obtiene información de duración para la UI
   */
  async getGroomingDurationInfo(
    petId: string,
    serviceIds: string[]
  ): Promise<{
    calculation: DurationCalculation;
    display: {
      breakdownText: string;
      totalText: string;
      slotLabel: string;
    };
  }> {
    const calculation = await this.calculateGroomingDuration(petId, serviceIds);

    // Generar textos para la UI
    const breakdownLines = calculation.breakdown.map(
      item => `${item.serviceName}: ${item.duration} min`
    );

    const breakdownText = breakdownLines.join('\n');
    const totalText = `${calculation.servicesTotal} min → -${calculation.comboReduction} min = ${calculation.calculatedDuration} min`;
    const slotLabel = `${calculation.slot.label}`;

    return {
      calculation,
      display: {
        breakdownText,
        totalText,
        slotLabel,
      },
    };
  }
}
```

### **3. Archivo: appointments.controller.ts (ENDPOINT)**

```typescript
// === ARCHIVO: src/modules/appointments/appointments.controller.ts ===

@Post('grooming/calculate-duration')
@Auth()
async calculateGroomingDuration(
  @Body() dto: CalculateGroomingDurationDto
) {
  return await this.groomingService.getGroomingDurationInfo(
    dto.petId,
    dto.serviceIds
  );
}

// DTO:
export class CalculateGroomingDurationDto {
  @IsString()
  @IsNotEmpty()
  petId: string;

  @IsArray()
  @IsNotEmpty()
  @ArrayMinSize(1)
  serviceIds: string[];
}
```

---

## 💻 Frontend - Actualización del Modal

### **1. Hook: useGroomingDuration.ts**

```typescript
// === ARCHIVO: src/hooks/useGroomingDuration.ts ===

import { useState, useCallback, useEffect } from 'react';
import { appointmentsApi } from '../api/appointments.api';
import { DurationCalculation } from '../types/grooming.types';

export function useGroomingDuration() {
  const [durationInfo, setDurationInfo] = useState<DurationCalculation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateDuration = useCallback(
    async (petId: string, serviceIds: string[]) => {
      if (!petId || serviceIds.length === 0) {
        setDurationInfo(null);
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await appointmentsApi.calculateGroomingDuration({
          petId,
          serviceIds,
        });

        setDurationInfo(response.calculation);
        return response.calculation;
      } catch (err) {
        setError(err.message);
        console.error('Error calculando duración:', err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    durationInfo,
    isLoading,
    error,
    calculateDuration,
  };
}
```

### **2. Componente: DurationBreakdownCard.tsx**

```typescript
// === ARCHIVO: src/components/appointments/DurationBreakdownCard.tsx ===

import React from 'react';
import { Clock } from 'react-icons/fi';
import { DurationCalculation } from '../../types/grooming.types';

interface DurationBreakdownCardProps {
  durationInfo: DurationCalculation;
  className?: string;
}

export function DurationBreakdownCard({
  durationInfo,
  className = '',
}: DurationBreakdownCardProps) {
  
  if (!durationInfo) return null;

  const { breakdown, servicesTotal, comboReduction, slot } = durationInfo;

  return (
    <div className={`rounded-lg bg-blue-50 border border-blue-200 p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-gray-900 text-lg">
          Duración Calculada
        </h3>
      </div>

      {/* Breakdown */}
      <div className="bg-white rounded p-3 mb-3 space-y-1">
        {breakdown.map((item, idx) => (
          <div key={idx} className="flex justify-between text-sm">
            <span className="text-gray-700">{item.serviceName}</span>
            <span className="font-medium text-gray-900">{item.duration} min</span>
          </div>
        ))}
        
        {/* Subtotal */}
        <div className="border-t pt-2 mt-2 flex justify-between text-sm font-medium">
          <span className="text-gray-700">Subtotal</span>
          <span className="text-gray-900">{servicesTotal} min</span>
        </div>

        {/* Combo reduction */}
        {comboReduction > 0 && (
          <div className="flex justify-between text-sm text-green-700">
            <span>Combo (eficiencia)</span>
            <span>-{comboReduction} min</span>
          </div>
        )}

        {/* Total Calculated */}
        <div className="border-t pt-2 mt-2 flex justify-between text-sm font-bold">
          <span className="text-gray-900">Total Calculado</span>
          <span className="text-blue-600">
            {servicesTotal - comboReduction} min
          </span>
        </div>
      </div>

      {/* Final Slot */}
      <div className="bg-blue-100 rounded p-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">
            Duración Final (Redondeada)
          </span>
          <span className="text-lg font-bold text-blue-600">
            {slot.label}
          </span>
        </div>
        <p className="text-xs text-gray-600 mt-1">
          ℹ️ Se redondea al slot más cercano para optimizar calendar availability
        </p>
      </div>
    </div>
  );
}
```

### **3. Modal: CreateGroomingAppointmentModal.tsx (ACTUALIZADO)**

```typescript
// === ARCHIVO: src/components/appointments/CreateGroomingAppointmentModal.tsx ===

import React, { useState, useEffect } from 'react';
import { useGroomingDuration } from '../../hooks/useGroomingDuration';
import { DurationBreakdownCard } from './DurationBreakdownCard';
import { CreateGroomingAppointmentForm } from '../../types/grooming.types';

export function CreateGroomingAppointmentModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState<CreateGroomingAppointmentForm>({
    petId: '',
    serviceIds: [],
    durationInfo: null,
    finalDuration: 0,
    isPersonalized: false,
    scheduledAt: new Date(),
    startTime: '10:00',
  });

  const { durationInfo, isLoading, calculateDuration } = useGroomingDuration();

  // Recalcular duración cuando cambien servicios o mascota
  useEffect(() => {
    if (formData.petId && formData.serviceIds.length > 0) {
      calculateDuration(formData.petId, formData.serviceIds).then(result => {
        if (result) {
          setFormData(prev => ({
            ...prev,
            durationInfo: result,
            finalDuration: result.roundedDuration,
            isPersonalized: false,
          }));
        }
      });
    }
  }, [formData.petId, formData.serviceIds]);

  const handleServiceToggle = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      serviceIds: prev.serviceIds.includes(serviceId)
        ? prev.serviceIds.filter(id => id !== serviceId)
        : [...prev.serviceIds, serviceId],
    }));
  };

  const handlePersonalizeDuration = () => {
    setFormData(prev => ({
      ...prev,
      isPersonalized: !prev.isPersonalized,
    }));
  };

  const handleResetDuration = () => {
    if (durationInfo) {
      setFormData(prev => ({
        ...prev,
        finalDuration: durationInfo.roundedDuration,
        isPersonalized: false,
      }));
    }
  };

  const handleSubmit = async () => {
    // Validar
    if (!formData.petId || formData.serviceIds.length === 0) {
      toast.error('Selecciona mascota y servicios');
      return;
    }

    try {
      // Guardar cita con finalDuration
      await appointmentsApi.createGroomingAppointment({
        petId: formData.petId,
        serviceIds: formData.serviceIds,
        durationMinutes: formData.finalDuration,
        scheduledAt: formData.scheduledAt,
        isPersonalized: formData.isPersonalized,
      });

      toast.success('Cita creada correctamente');
      onSuccess();
    } catch (err) {
      toast.error('Error creando cita: ' + err.message);
    }
  };

  return (
    <div className="modal-content space-y-6">
      {/* === MASCOTA === */}
      <div>
        <label className="block font-semibold mb-2">Mascota</label>
        <select
          value={formData.petId}
          onChange={e => setFormData(prev => ({ ...prev, petId: e.target.value }))}
          className="w-full px-3 py-2 border rounded"
        >
          <option value="">Selecciona mascota</option>
          {/* Load pets */}
        </select>
      </div>

      {/* === SERVICIOS === */}
      <div>
        <label className="block font-semibold mb-2">Servicios</label>
        <div className="space-y-2">
          {/* Render services with checkboxes */}
          {services.map(service => (
            <label key={service.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.serviceIds.includes(service.id)}
                onChange={() => handleServiceToggle(service.id)}
                className="w-4 h-4"
              />
              <span>{service.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* === DURACIÓN CALCULADA === */}
      {durationInfo && (
        <>
          <DurationBreakdownCard durationInfo={durationInfo} />

          {/* MOSTRAR DURACIÓN REDONDEADA */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-gray-900">Duración Final</h3>
              <span className="text-2xl font-bold text-green-600">
                {durationInfo.slot.label}
              </span>
            </div>

            {!formData.isPersonalized ? (
              <button
                onClick={handlePersonalizeDuration}
                className="text-sm text-blue-600 hover:underline"
              >
                ✏️ Personalizar duración
              </button>
            ) : (
              <div className="space-y-2">
                <input
                  type="number"
                  value={formData.finalDuration}
                  onChange={e => setFormData(prev => ({
                    ...prev,
                    finalDuration: Number(e.target.value),
                  }))}
                  min="30"
                  max="480"
                  step="5"
                  className="w-full px-3 py-2 border rounded"
                />
                <button
                  onClick={handleResetDuration}
                  className="text-sm text-gray-600 hover:underline"
                >
                  ⟲ Usar duración automática
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* === FECHA/HORA === */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-semibold mb-2">Fecha</label>
          <input
            type="date"
            value={formData.scheduledAt.toISOString().split('T')[0]}
            onChange={e => setFormData(prev => ({
              ...prev,
              scheduledAt: new Date(e.target.value),
            }))}
            className="w-full px-3 py-2 border rounded"
          />
        </div>
        <div>
          <label className="block font-semibold mb-2">Hora</label>
          <input
            type="time"
            value={formData.startTime}
            onChange={e => setFormData(prev => ({
              ...prev,
              startTime: e.target.value,
            }))}
            className="w-full px-3 py-2 border rounded"
          />
        </div>
      </div>

      {/* === BOTONES === */}
      <div className="flex gap-2 justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={!formData.petId || formData.serviceIds.length === 0 || isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Calculando...' : 'Crear Cita'}
        </button>
      </div>
    </div>
  );
}
```

---

## 📁 Componentes a Crear/Modificar

### **Archivos NUEVOS:**

```
src/
├── types/
│   └── grooming.types.ts                    ✨ CREAR
├── modules/appointments/
│   ├── utils/
│   │   └── grooming-duration.utils.ts       ✨ CREAR
│   ├── services/
│   │   └── grooming.service.ts              ✨ CREAR
├── hooks/
│   └── useGroomingDuration.ts               ✨ CREAR
└── components/appointments/
    └── DurationBreakdownCard.tsx            ✨ CREAR
```

### **Archivos A MODIFICAR:**

```
src/
├── modules/appointments/
│   ├── appointments.controller.ts           ✏️ Agregar endpoint
│   └── appointments.module.ts               ✏️ Importar GroomingService
├── api/
│   └── appointments.api.ts                  ✏️ Agregar método calculateGroomingDuration
└── components/appointments/
    └── CreateGroomingAppointmentModal.tsx   ✏️ Usar hook y componentes nuevos
```

---

## 🚀 Pasos de Implementación

### **Paso 1: Backend - Definir tipos**
```bash
1. Crear: src/types/grooming.types.ts
   └─ Copiar interfaces de DURATION_SLOTS y DurationCalculation
```

### **Paso 2: Backend - Utilities**
```bash
2. Crear: src/modules/appointments/utils/grooming-duration.utils.ts
   └─ Copiar funciones: findNearestSlot, formatMinutesToHuman, applyComboReductions
```

### **Paso 3: Backend - Servicio Principal**
```bash
3. Crear: src/modules/appointments/services/grooming.service.ts
   └─ Copiar clase GroomingService con calculateGroomingDuration()
   └─ Asegurar inyección de dependencias (PetsService, ServicesService, etc.)
```

### **Paso 4: Backend - Endpoint**
```bash
4. Modificar: src/modules/appointments/appointments.controller.ts
   └─ Agregar POST /appointments/grooming/calculate-duration
   └─ Inyectar GroomingService
```

### **Paso 5: Backend - Módulo**
```bash
5. Modificar: src/modules/appointments/appointments.module.ts
   └─ Agregar GroomingService a providers
```

### **Paso 6: Frontend - API Client**
```bash
6. Modificar: src/api/appointments.api.ts
   └─ Agregar método:
      calculateGroomingDuration(dto: { petId, serviceIds })
```

### **Paso 7: Frontend - Hook**
```bash
7. Crear: src/hooks/useGroomingDuration.ts
   └─ Copiar hook useGroomingDuration
   └─ Asegurar manejo de errores con try/catch
```

### **Paso 8: Frontend - Componente DurationBreakdownCard**
```bash
8. Crear: src/components/appointments/DurationBreakdownCard.tsx
   └─ Copiar componente DurationBreakdownCard
```

### **Paso 9: Frontend - Modal Principal**
```bash
9. Modificar: src/components/appointments/CreateGroomingAppointmentModal.tsx
   └─ Importar useGroomingDuration
   └─ Agregar lógica de recálculo dinámico
   └─ Reemplazar dropdown de duración por DurationBreakdownCard
   └─ Agregar botón "Personalizar" (opcional)
```

### **Paso 10: Testing**
```bash
10. Crear tests unitarios para:
    ├─ findNearestSlot()
    ├─ applyComboReductions()
    ├─ GroomingService.calculateGroomingDuration()
    └─ CreateGroomingAppointmentModal (integración)
```

---

## ✅ Testing

### **1. Unit Tests - Utilidades**

```typescript
// === grooming-duration.utils.spec.ts ===

describe('findNearestSlot', () => {
  it('debería retornar 30 min si es menor', () => {
    expect(findNearestSlot(20).minutes).toBe(30);
  });

  it('debería retornar 45 min si es exacto', () => {
    expect(findNearestSlot(45).minutes).toBe(45);
  });

  it('debería redondear 55 a 60', () => {
    expect(findNearestSlot(55).minutes).toBe(60);
  });

  it('debería redondear 68 a 75', () => {
    expect(findNearestSlot(68).minutes).toBe(75);
  });

  it('debería retornar 480 si es mayor', () => {
    expect(findNearestSlot(500).minutes).toBe(480);
  });
});

describe('applyComboReductions', () => {
  it('debería aplicar reducción de 10 min para Baño+Corte', () => {
    const result = applyComboReductions(['Baño', 'Corte', 'Uñas']);
    expect(result.reduction).toBe(10);
    expect(result.appliedCombos).toContain('baño_corte');
  });

  it('no debería reducir si solo Baño', () => {
    const result = applyComboReductions(['Baño', 'Uñas']);
    expect(result.reduction).toBe(0);
  });
});
```

### **2. Integration Tests - Servicio**

```typescript
// === grooming.service.spec.ts ===

describe('GroomingService.calculateGroomingDuration', () => {
  it('caso típico: Baño pequeño + Corte + Uñas', async () => {
    const result = await groomingService.calculateGroomingDuration(
      'pet-123',
      ['service-baño-pequeno', 'service-corte', 'service-unas']
    );

    expect(result.servicesTotal).toBe(68); // 20 + 40 + 8
    expect(result.comboReduction).toBe(10);
    expect(result.calculatedDuration).toBe(58);
    expect(result.roundedDuration).toBe(60); // SLOT más cercano
    expect(result.slot.label).toBe('1 hora');
  });

  it('debería usar tamaño default si mascota no tiene', async () => {
    const result = await groomingService.calculateGroomingDuration(
      'pet-sin-tamaño',
      ['service-baño']
    );

    expect(result.breakdown[0].petSize).toBe('M'); // Default
  });

  it('debería fallar si petId no existe', async () => {
    await expect(
      groomingService.calculateGroomingDuration('pet-inexistente', ['service-1'])
    ).rejects.toThrow();
  });
});
```

### **3. E2E Test - Modal**

```typescript
// === CreateGroomingAppointmentModal.e2e.spec.ts ===

describe('CreateGroomingAppointmentModal - E2E', () => {
  it('debería calcular duración automática al seleccionar servicios', async () => {
    // 1. Abrir modal
    // 2. Seleccionar mascota "Perro L"
    // 3. Seleccionar servicios: Baño, Corte, Uñas
    // 4. Verificar que se muestra desglose
    // 5. Verificar que duración es 102 min (después de combos)
    // 6. Verificar que se redondea a 105 min (slot más cercano)

    expect(screen.getByText('1 hora 45 min')).toBeInTheDocument();
  });

  it('debería recalcular al agregar/quitar servicios', async () => {
    // 1. Seleccionar Baño + Corte = 102 min → 105
    // 2. Agregar Uñas → debería recalcular a 60 min
    // 3. Quitar Corte → debería recalcular
  });

  it('debería permitir personalizar duración', async () => {
    // 1. Mostrar duración automática 105 min
    // 2. Clic en "Personalizar"
    // 3. Cambiar a 120 min
    // 4. Guardar y verificar que se usa 120 min
  });
});
```

### **4. Checklist de Testing Manual**

```
CASOS DE PRUEBA:
□ Baño pequeño único (20 min) → redondea a 30 min
□ Baño + Corte (60 min) → se aplica combo -10 → 50 min → redondea a 45
□ Baño L + Corte + Uñas (112 min) → -10 → 102 min → redondea a 105 min
□ Servicio sin duración definida → usa default 30 min
□ Mascota sin tamaño → usa default 'M'
□ Personalizar duración → guardar valor custom
□ Cambiar servicios → recalcular automático
□ Cambiar mascota → recalcular con nuevo tamaño
□ Error de API → mostrar mensaje claro
□ Validación: mín 30 min, máx 480 min
```

---

## 📊 Comparativa de Cambios

| Aspecto | ANTES | DESPUÉS |
|---------|-------|---------|
| **Selección de duración** | Dropdown manual | ✅ Automático |
| **Visibilidad** | Usuario confundido | ✅ Desglose claro |
| **Cambios dinámicos** | No recalcula | ✅ Recalcula al instante |
| **Redondeamiento** | Manual/inconsistente | ✅ Automático a slots |
| **Combos** | Ignorados | ✅ Aplicados automáticamente |
| **Errores** | Muchos (manual) | ✅ Validados automáticamente |

---

## 📝 Notas Importantes

1. **Orden de implementación es crítico**: Backend → API → Frontend
2. **Asegurar inyección de dependencias** en GroomingService
3. **Testear cada paso** antes de continuar
4. **Validar que serviceSizePrices se está guardando** correctamente
5. **En caso de error de API**, el frontend debe tener fallback a defaultDurationMinutes

---

## 🔄 Pendientes Post-Implementación

- [ ] Migración BD para agregar `durationMinutes` a `service_size_prices`
- [ ] Seed de datos con duración correcta por tamaño
- [ ] Testing en ambiente de staging
- [ ] Documentación de usuario
- [ ] Capacitación del equipo

