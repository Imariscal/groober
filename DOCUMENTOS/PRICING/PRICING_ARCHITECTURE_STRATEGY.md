# 💰 Estrategia de Arquitectura de Pricing - VibraLive SaaS

**Documento de Arquitectura Senior**  
**Objetivo:** Diseñar sistema de pricing profesional y escalable para SaaS multi-tenant  
**Horizonte:** 3 años | 1000+ clínicas

---

## 📊 PARTE 1: DIAGNÓSTICO DEL MODELO ACTUAL

### ✅ Fortalezas

```
✓ Multi-tenancy estricto: clinic_id en price_lists
✓ Flexibilidad: price_list_id nullable en clients
✓ Default support: is_default en price_lists
✓ Separación de precios: service_prices como tabla pivote
✓ No data leakage: FK relationships cierran vacíos
```

### ⚠️ Riesgos Identificados

| Riesgo | Severidad | Impacto | Estado |
|--------|-----------|--------|--------|
| **No hay congelamiento de precio** | 🔴 CRÍTICA | Auditoría, disputas, ingresos imprecisos | SIN RESOLVER |
| **Sin histórico de precios** | 🔴 CRÍTICA | No puedo rastrear cambios, imposible reporte financiero | SIN RESOLVER |
| **Sin validación de FK en service_prices** | 🟠 ALTA | Risk: cliente de clinic A accede precios de clinic B | A VERIFICAR |
| **Cambio de lista post-cita sin control** | 🟠 ALTA | Cita creada con lista X, cliente cambia a Y | SIN CONTROL |
| **Sin auditoria de precios** | 🟡 MEDIA | Compliance, trazabilidad de cambios | FUTURO |
| **Appointment sin total_amount** | 🟡 MEDIA | No puedo sumar ingresos directamente | AGREGA COMPLEJIDAD |

### 🔒 Validaciones Multi-Tenancy Actuales

```sql
-- ✓ price_lists: clinic_id garantiza aislamiento
CREATE TABLE price_lists (
  id UUID PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP,
  UNIQUE(clinic_id, name)
);

-- ✓ service_prices: clinic_id en composite key (recomendado verificar en código)
CREATE TABLE service_prices (
  id UUID PRIMARY KEY,
  clinic_id UUID NOT NULL,
  price_list_id UUID NOT NULL,
  service_id UUID NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (clinic_id) REFERENCES clinics(id),
  FOREIGN KEY (price_list_id) REFERENCES price_lists(id),
  FOREIGN KEY (service_id) REFERENCES services(id),
  UNIQUE(clinic_id, price_list_id, service_id)
);

-- ⚠️ clients: nullable, pero sin validación de que price_list pertenece a clinic
ALTER TABLE clients ADD COLUMN price_list_id UUID REFERENCES price_lists(id);
```

**RECOMENDACIÓN INMEDIATA:** Verificar que el backend valida `price_list.clinic_id == client.clinic_id` antes de asignar.

---

## 🏗️ PARTE 2: PROPUESTA DE EVOLUCIÓN MÍNIMA

### 2.1 Cambios al Esquema (Sin Romper Existente)

#### Tabla Nueva: `appointment_items`
```sql
CREATE TABLE appointment_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL,
  appointment_id UUID NOT NULL,
  service_id UUID NOT NULL,
  
  -- Precio congelado en el momento de la cita
  price_at_booking DECIMAL(10,2) NOT NULL,
  
  -- Línea de cita (1 servicio = 1 línea, pero soporta multiples)
  quantity INT DEFAULT 1,
  subtotal DECIMAL(12,2) GENERATED ALWAYS AS (price_at_booking * quantity) STORED,
  
  -- Auditoria
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES services(id),
  
  CONSTRAINT clinic_match CHECK (clinic_id = (SELECT clinic_id FROM appointments WHERE id = appointment_id))
);

CREATE INDEX idx_appointment_items_appointment ON appointment_items(appointment_id);
CREATE INDEX idx_appointment_items_clinic ON appointment_items(clinic_id);
```

#### Tabla Nueva: `price_list_history` (Optional - Future Auditing)
```sql
-- Para compliance/auditoría (no es blocker ahora)
CREATE TABLE price_list_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL,
  price_list_id UUID NOT NULL,
  service_id UUID NOT NULL,
  
  old_price DECIMAL(10,2),
  new_price DECIMAL(10,2) NOT NULL,
  
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  changed_by_user_id UUID,
  reason VARCHAR(255),
  
  FOREIGN KEY (clinic_id) REFERENCES clinics(id),
  FOREIGN KEY (price_list_id) REFERENCES price_lists(id),
  FOREIGN KEY (service_id) REFERENCES services(id),
  
  INDEX (price_list_id, changed_at),
  INDEX (clinic_id, changed_at)
);
```

#### Tabla Nueva: `price_lists_audit` (Soft Status)
```sql
-- Agregar a price_lists:
ALTER TABLE price_lists ADD COLUMN (
  is_active BOOLEAN DEFAULT TRUE,           -- Soft delete / deactivate
  deactivated_at TIMESTAMP NULL,
  deactivation_reason VARCHAR(255)
);

-- Índice para queries frecuentes
CREATE INDEX idx_price_lists_active ON price_lists(clinic_id, is_active);
```

#### Extensión Mínima de `appointments`
```sql
-- Agregar a appointments (no obligatorio, para optimización):
ALTER TABLE appointments ADD COLUMN (
  total_amount DECIMAL(12,2) NULL,           -- Suma de appointment_items.subtotal
  price_lock_at TIMESTAMP DEFAULT NOW(),     -- Cuándo se congeló el precio
  price_list_id UUID NULL                    -- FK al price_list usado
);

-- Índice para auditoría / financiero
CREATE INDEX idx_appointments_total_amount ON appointments(clinic_id, created_at, total_amount);
```

### 2.2 Cambios a Entidades (NestJS/TypeORM)

```typescript
// appointment.entity.ts
@Entity('appointments')
export class Appointment {
  // ... campos existentes ...
  
  @Column({ name: 'total_amount', type: 'decimal', precision: 12, scale: 2, nullable: true })
  totalAmount?: number;

  @Column({ name: 'price_lock_at', type: 'timestamp', nullable: true })
  priceLockAt?: Date;

  @Column({ name: 'price_list_id', type: 'uuid', nullable: true })
  priceListId?: string;

  // Relación con appointment_items
  @OneToMany(() => AppointmentItem, (item) => item.appointment)
  items?: AppointmentItem[];

  // Relación con price_list usado
  @ManyToOne(() => PriceList, { nullable: true })
  @JoinColumn({ name: 'price_list_id' })
  priceList?: PriceList;
}

// NEW: appointment-item.entity.ts
@Entity('appointment_items')
export class AppointmentItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'clinic_id', type: 'uuid' })
  clinicId: string;

  @Column({ name: 'appointment_id', type: 'uuid' })
  appointmentId: string;

  @Column({ name: 'service_id', type: 'uuid' })
  serviceId: string;

  @Column({ name: 'price_at_booking', type: 'decimal', precision: 10, scale: 2 })
  priceAtBooking: number;

  @Column({ name: 'quantity', type: 'int', default: 1 })
  quantity: number;

  @Column({ name: 'subtotal', type: 'decimal', precision: 12, scale: 2, nullable: true })
  subtotal?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relaciones
  @ManyToOne(() => Appointment, (a) => a.items)
  @JoinColumn({ name: 'appointment_id' })
  appointment: Appointment;

  @ManyToOne(() => Service)
  @JoinColumn({ name: 'service_id' })
  service: Service;

  @ManyToOne(() => Clinic)
  @JoinColumn({ name: 'clinic_id' })
  clinic: Clinic;
}

// NEW: price-list-history.entity.ts (Optional para auditoría)
@Entity('price_list_history')
export class PriceListHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'clinic_id', type: 'uuid' })
  clinicId: string;

  @Column({ name: 'price_list_id', type: 'uuid' })
  priceListId: string;

  @Column({ name: 'service_id', type: 'uuid' })
  serviceId: string;

  @Column({ name: 'old_price', type: 'decimal', precision: 10, scale: 2, nullable: true })
  oldPrice?: number;

  @Column({ name: 'new_price', type: 'decimal', precision: 10, scale: 2 })
  newPrice: number;

  @CreateDateColumn({ name: 'changed_at' })
  changedAt: Date;

  @Column({ name: 'changed_by_user_id', type: 'uuid', nullable: true })
  changedByUserId?: string;

  @Column({ name: 'reason', type: 'varchar', length: 255, nullable: true })
  reason?: string;
}
```

---

## 🧮 PARTE 3: MIGRACIONES SQL

### Migración 1: `Create Appointment Items & Price Audit`

```sql
-- 1740700000000-AddAppointmentItemsAndPricingAudit.ts

-- ========== CREATE appointment_items ==========
CREATE TABLE appointment_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL,
  appointment_id UUID NOT NULL,
  service_id UUID NOT NULL,
  price_at_booking DECIMAL(10,2) NOT NULL,
  quantity INT DEFAULT 1,
  subtotal DECIMAL(12,2) GENERATED ALWAYS AS (price_at_booking * quantity) STORED,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES services(id),
  CONSTRAINT clinic_match CHECK (clinic_id = (SELECT clinic_id FROM appointments WHERE id = appointment_id))
);

CREATE INDEX idx_appointment_items_appointment 
  ON appointment_items(appointment_id);
CREATE INDEX idx_appointment_items_clinic 
  ON appointment_items(clinic_id);
CREATE INDEX idx_appointment_items_service 
  ON appointment_items(service_id);

-- ========== CREATE price_list_history ==========
CREATE TABLE price_list_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL,
  price_list_id UUID NOT NULL,
  service_id UUID NOT NULL,
  old_price DECIMAL(10,2),
  new_price DECIMAL(10,2) NOT NULL,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  changed_by_user_id UUID,
  reason VARCHAR(255),
  
  FOREIGN KEY (clinic_id) REFERENCES clinics(id),
  FOREIGN KEY (price_list_id) REFERENCES price_lists(id),
  FOREIGN KEY (service_id) REFERENCES services(id)
);

CREATE INDEX idx_price_list_history_price_list_id 
  ON price_list_history(price_list_id, changed_at);
CREATE INDEX idx_price_list_history_clinic_id 
  ON price_list_history(clinic_id, changed_at);

-- ========== EXTEND price_lists ==========
ALTER TABLE price_lists ADD COLUMN (
  is_active BOOLEAN DEFAULT TRUE,
  deactivated_at TIMESTAMP NULL,
  deactivation_reason VARCHAR(255)
);

CREATE INDEX idx_price_lists_active 
  ON price_lists(clinic_id, is_active);

-- ========== EXTEND appointments ==========
ALTER TABLE appointments ADD COLUMN (
  total_amount DECIMAL(12,2) NULL,
  price_lock_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  price_list_id UUID NULL REFERENCES price_lists(id)
);

CREATE INDEX idx_appointments_total_amount 
  ON appointments(clinic_id, created_at, total_amount);
CREATE INDEX idx_appointments_price_list_id 
  ON appointments(price_list_id);
```

### Migración 2: Garantizar Multi-Tenancy en Service Prices (Validación)

```sql
-- 1740700000001-ValidateServicePricesMultiTenancy.ts

-- Verificar que no hay discrepancias
-- (Ejecutar como validación, no es destructiva)

SELECT COUNT(*) as inconsistencies_found
FROM service_prices sp
WHERE sp.clinic_id != (
  SELECT clinic_id FROM price_lists WHERE id = sp.price_list_id
);

-- Si el resultado es > 0, hay un problema de integridad de datos
-- FIX (si es necesario):
-- DELETE FROM service_prices sp
-- WHERE sp.clinic_id != (SELECT clinic_id FROM price_lists WHERE id = sp.price_list_id);

-- Agregar constraint explícita para futuro (PostgreSQL específico)
ALTER TABLE service_prices
ADD CONSTRAINT service_prices_clinic_price_list_match
CHECK (clinic_id = (SELECT clinic_id FROM price_lists WHERE id = price_list_id));
```

---

## 🧠 PARTE 4: LÓGICA DE PRICING (Pseudocode Backend)

### 4.1 Servicio de Precios Congelados

```typescript
// pricing.service.ts
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class PricingService {
  constructor(
    @InjectRepository(Client) private clientRepo: Repository<Client>,
    @InjectRepository(PriceList) private priceListRepo: Repository<PriceList>,
    @InjectRepository(ServicePrice) private servicePriceRepo: Repository<ServicePrice>,
    @InjectRepository(AppointmentItem) private appointmentItemRepo: Repository<AppointmentItem>,
  ) {}

  /**
   * 📌 CORE FUNCTION: Determinar qué price_list usar para un cliente
   * 
   * Lógica de precedencia:
   * 1. Si client.price_list_id está asignado y activa → usar esa
   * 2. Si no → buscar price_list default de la clínica
   * 3. Si no hay default → error (clínica debe tener lista default)
   */
  async resolvePriceListForClient(
    clinicId: string,
    clientId: string,
  ): Promise<PriceList> {
    // Step 1: Obtener cliente y su price_list_id
    const client = await this.clientRepo.findOne({
      where: { id: clientId, clinic_id: clinicId },
      relations: ['priceList'],
    });

    if (!client) {
      throw new BadRequestException('Cliente no encontrado o no pertenece a clínica');
    }

    // Step 2: Si client tiene price_list asignado y está activo
    if (client.priceListId) {
      const clientPriceList = await this.priceListRepo.findOne({
        where: {
          id: client.priceListId,
          clinic_id: clinicId,
          is_active: true,
        },
      });

      if (clientPriceList) {
        return clientPriceList; // ✅ Usar la del cliente
      }

      // ⚠️ La lista del cliente fue desactivada
      console.warn(
        `PriceList ${client.priceListId} de cliente ${clientId} está desactivada. Fallback a default.`
      );
    }

    // Step 3: Buscar default de la clínica
    const defaultPriceList = await this.priceListRepo.findOne({
      where: {
        clinic_id: clinicId,
        is_default: true,
        is_active: true,
      },
    });

    if (!defaultPriceList) {
      throw new InternalServerErrorException(
        'Clínica sin price_list default activo. Contactar soporte.'
      );
    }

    return defaultPriceList;
  }

  /**
   * 💰 Obtener precio congelado para un servicio en un momento específico
   * 
   * Retorna el precio exacto que se debe guardar en appointment_items
   */
  async getPriceAtBooking(
    clinicId: string,
    priceListId: string,
    serviceId: string,
  ): Promise<number> {
    const servicePrice = await this.servicePriceRepo.findOne({
      where: {
        clinic_id: clinicId,
        price_list_id: priceListId,
        service_id: serviceId,
      },
    });

    if (!servicePrice) {
      throw new BadRequestException(
        `Servicio ${serviceId} no tiene precio en lista ${priceListId}`
      );
    }

    return servicePrice.price;
  }

  /**
   * 🎫 Crear cita CON precios congelados
   * 
   * Este es el punto de entrada cuando se crea una cita
   * SIEMPRE guarda appointment_items con price_at_booking
   */
  async createAppointmentWithFrozenPrices(
    clinicId: string,
    clientId: string,
    serviceIds: string[],
    appointmentData: CreateAppointmentDto,
  ): Promise<Appointment> {
    // 1️⃣ Resolver qué price_list usar
    const priceList = await this.resolvePriceListForClient(clinicId, clientId);

    // 2️⃣ Para cada servicio, obtener precio congelado
    const appointmentItems: AppointmentItem[] = [];
    let totalAmount = 0;

    for (const serviceId of serviceIds) {
      const priceAtBooking = await this.getPriceAtBooking(
        clinicId,
        priceList.id,
        serviceId,
      );

      const item = new AppointmentItem();
      item.clinicId = clinicId;
      item.serviceId = serviceId;
      item.priceAtBooking = priceAtBooking;
      item.quantity = 1; // O del request si es variable
      item.subtotal = priceAtBooking * item.quantity; // Se calcula automático en BD

      appointmentItems.push(item);
      totalAmount += item.subtotal;
    }

    // 3️⃣ Crear AppointmentEntity
    const appointment = new Appointment();
    appointment.clinicId = clinicId;
    appointment.clientId = clientId;
    appointment.scheduledAt = appointmentData.scheduled_at;
    appointment.priceListId = priceList.id; // Guardar referencia a la lista usada
    appointment.priceLockAt = new Date(); // Timestamp de congelamiento
    appointment.totalAmount = totalAmount; // Total calculado

    // 4️⃣ Guardar
    const savedAppointment = await appointmentRepo.save(appointment);

    // 5️⃣ Guardar items con precios congelados
    const itemsToSave = appointmentItems.map((item) => ({
      ...item,
      appointment_id: savedAppointment.id,
    }));
    await this.appointmentItemRepo.save(itemsToSave);

    return savedAppointment;
  }

  /**
   * 📊 Calcular total de cita a partir de appointment_items
   * 
   * Usada para mostrar en UI sin recalcular dinámicamente
   */
  async getAppointmentTotal(appointmentId: string): Promise<number> {
    const items = await this.appointmentItemRepo.find({
      where: { appointment_id: appointmentId },
    });

    return items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
  }

  /**
   * 🔍 Validación: Client cambió de price_list post-cita
   * 
   * Mostrar en UI: "Créado con lista X, cliente ahora tiene lista Y"
   */
  async checkPriceListMismatch(appointmentId: string): Promise<{
    mismatch: boolean;
    usedAt: string;
    currentAt: string;
  }> {
    const appointment = await appointmentRepo.findOne(appointmentId);
    const client = await this.clientRepo.findOne(appointment.clientId);

    return {
      mismatch: appointment.priceListId !== client.priceListId,
      usedAt: appointment.priceList?.name || 'DEFAULT',
      currentAt: client.priceList?.name || 'DEFAULT',
    };
  }
}
```

### 4.2 Lógica en AppointmentsService

```typescript
// BEFORE: Cálculo dinámico (ANTIGUO)
async getAppointmentPrice(appointment: Appointment): Promise<number> {
  // ❌ Problema: Si precio cambió, esto es DIFERENTE a cuando se creó
  const servicePrice = await this.servicePriceRepo.findOne({
    where: {
      clinic_id: appointment.clinic_id,
      price_list_id: appointment.client.price_list_id,
      service_id: appointment.service_id,
    },
  });
  return servicePrice.price;
}

// AFTER: Lectura de precios congelados (NUEVO)
async getAppointmentTotal(appointmentId: string): Promise<number> {
  // ✅ Garantizado: Es el precio que el cliente vio cuando agendó
  return this.pricingService.getAppointmentTotal(appointmentId);
}

// INTEGRATION: Al crear cita, usar PricingService
async createAppointment(
  clinicId: string,
  dto: CreateAppointmentDto,
): Promise<Appointment> {
  // ✅ Usar servicio de pricing congelado
  return this.pricingService.createAppointmentWithFrozenPrices(
    clinicId,
    dto.client_id,
    dto.service_ids || [dto.service_id], // Support múltiples servicios future-proof
    dto,
  );
}
```

### 4.3 Edge Cases Handling

```typescript
/**
 * ⚠️ EDGE CASE 1: Precio se elimina después de crear cita
 * 
 * Solución: appointment_items.price_at_booking es inmutable
 * No hay re-cálculo. Histórico intacto para auditoría.
 */
// Si necesitas mostrar "precio antigua":
async getPriceHistoryForAppointment(appointmentId: string) {
  const items = await this.appointmentItemRepo.find({
    where: { appointment_id: appointmentId },
  });
  return items.map((item) => ({
    service: item.service.name,
    price_at_booking: item.price_at_booking, // ✅ Inmutable
    quantity: item.quantity,
  }));
}

/**
 * ⚠️ EDGE CASE 2: PriceList se desactiva
 * 
 * Solución: appointment_items NO depende de price_lists.is_active
 * Solo punto de consulta es si `price_lists.is_active = false`
 * mostrar warning en UI: "Lista desactivada, mantener para histórico"
 */
async checkPriceListStatus(priceListId: string) {
  const priceList = await this.priceListRepo.findOne(priceListId);
  return {
    is_active: priceList.is_active,
    deactivated_at: priceList.deactivated_at,
    reason: priceList.deactivation_reason,
  };
}

/**
 * ⚠️ EDGE CASE 3: Cliente cambió de lista DESPUÉS de agendar
 * 
 * Solución: appointment.price_list_id inmutable. Pero mostrar:
 */
async getAppointmentPricingContext(appointmentId: string) {
  const appt = await appointmentRepo.findOne(appointmentId, {
    relations: ['client', 'priceList'],
  });

  return {
    appointment_id: appt.id,
    price_list_used: {
      id: appt.price_list_id,
      name: appt.priceList?.name,
      locked_at: appt.price_lock_at,
    },
    current_client_price_list: {
      id: appt.client.price_list_id,
      name: appt.client.priceList?.name,
    },
    mismatch: appt.price_list_id !== appt.client.price_list_id,
    items: await this.appointmentItemRepo.find({
      where: { appointment_id: appt.id },
    }),
  };
}
```

---

## 🎨 PARTE 5: AJUSTES EN UI (Next.js 14)

### 5.1 Cliente Detail Page - Sección de Precios

```typescript
// app/clients/[clientId]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Client } from '@/types';
import { clientsApi } from '@/lib/clients-api';

export default function ClientDetailPage({ params }: { params: { clientId: string } }) {
  const [client, setClient] = useState<Client | null>(null);
  const [selectedPriceListId, setSelectedPriceListId] = useState<string>('');
  const [priceLists, setPriceLists] = useState<any[]>([]);
  const [isEditingPriceList, setIsEditingPriceList] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadClient = async () => {
      try {
        const data = await clientsApi.getClient(params.clientId);
        setClient(data);
        setSelectedPriceListId(data.price_list_id || '');

        // Cargar price_lists de la clínica
        const lists = await pricingApi.getPriceListsForClinic();
        setPriceLists(lists);
      } catch (error) {
        console.error('Error loading client:', error);
      }
    };

    loadClient();
  }, [params.clientId]);

  const handleSavePriceList = async () => {
    if (!client) return;

    setIsSaving(true);
    try {
      await clientsApi.updateClient(client.id, {
        price_list_id: selectedPriceListId || null, // null = usar default
      });
      setClient({ ...client, price_list_id: selectedPriceListId });
      setIsEditingPriceList(false);
      toast.success('Lista de precios actualizada');
    } catch (error) {
      toast.error('Error al actualizar lista de precios');
    } finally {
      setIsSaving(false);
    }
  };

  const currentPriceList = priceLists.find((p) => p.id === selectedPriceListId);
  const defaultPriceList = priceLists.find((p) => p.is_default);
  const displayList = currentPriceList || defaultPriceList;

  return (
    <div className="space-y-8">
      {/* ... otros campos del cliente ... */}

      {/* 💰 SECCIÓN LISTA DE PRECIOS */}
      <section className="border-t pt-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Lista de Precios</h3>
          {!isEditingPriceList && (
            <button
              onClick={() => setIsEditingPriceList(true)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Cambiar
            </button>
          )}
        </div>

        {!isEditingPriceList ? (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Lista Asignada:</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">
                    {displayList?.name || 'No especificada'}
                  </span>
                  {!selectedPriceListId && (
                    <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                      Default
                    </span>
                  )}
                </div>
              </div>
              {selectedPriceListId && selectedPriceListId !== defaultPriceList?.id && (
                <div className="text-sm text-gray-600">
                  Default: <span className="font-medium">{defaultPriceList?.name}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seleccionar Lista de Precios
              </label>
              <select
                value={selectedPriceListId}
                onChange={(e) => setSelectedPriceListId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">
                  Default ({defaultPriceList?.name})
                </option>
                {priceLists
                  .filter((p) => p.is_active)
                  .map((list) => (
                    <option key={list.id} value={list.id}>
                      {list.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Preview de cambio */}
            {selectedPriceListId && selectedPriceListId !== client?.price_list_id && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                ℹ️ Este cambio afectará las nuevas citas. Las citas existentes mantienen su precio original.
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedPriceListId(client?.price_list_id || '');
                  setIsEditingPriceList(false);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSavePriceList}
                disabled={isSaving}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
```

### 5.2 Appointment Create - Mostrar Precios

```typescript
// components/AppointmentForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { CreateAppointmentDto } from '@/types';

export function AppointmentForm({ clientId, onSubmit }: Props) {
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [pricingInfo, setPricingInfo] = useState<{
    items: Array<{ service_id: string; price: number; name: string }>;
    total: number;
    price_list: string;
    locked_at: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  // Cuando selecciona servicios, obtener precios
  const handleServiceSelect = async (serviceIds: string[]) => {
    setSelectedServiceIds(serviceIds);

    if (serviceIds.length === 0) {
      setPricingInfo(null);
      return;
    }

    try {
      const pricing = await pricingApi.calculateAppointmentPricing(clientId, serviceIds);
      setPricingInfo(pricing);
    } catch (error) {
      console.error('Error calculating pricing:', error);
      toast.error('Error al calcular precios');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pricingInfo) {
      toast.error('Selecciona al menos un servicio');
      return;
    }

    setLoading(true);
    try {
      const appointment = await appointmentApi.createAppointment({
        client_id: clientId,
        service_ids: selectedServiceIds,
        scheduled_at: new Date(), // Del formulario
      });

      toast.success('Cita creada exitosamente');
      onSubmit(appointment);
    } catch (error) {
      toast.error('Error al crear cita');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Selector de servicios */}
      <ServiceMultiSelect
        onSelect={handleServiceSelect}
        selectedIds={selectedServiceIds}
      />

      {/* 💰 Información de Precios */}
      {pricingInfo && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
          <h4 className="font-semibold text-blue-900">Desglose de Precios</h4>

          <div className="space-y-2">
            {pricingInfo.items.map((item) => (
              <div key={item.service_id} className="flex justify-between text-sm">
                <span className="text-gray-700">{item.name}</span>
                <span className="font-medium text-gray-900">
                  ${item.price.toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-blue-200 pt-2 flex justify-between">
            <span className="font-semibold text-blue-900">Total:</span>
            <span className="text-lg font-bold text-blue-900">
              ${pricingInfo.total.toFixed(2)}
            </span>
          </div>

          <div className="text-xs text-blue-700 pt-2">
            Lista: <strong>{pricingInfo.price_list}</strong> |
            Congelado: {new Date(pricingInfo.locked_at).toLocaleString()}
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={!pricingInfo || loading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Creando cita...' : 'Crear Cita'}
      </button>
    </form>
  );
}
```

### 5.3 API Wrapper - Nuevos Métodos

```typescript
// lib/pricing-api.ts
export const pricingApi = {
  /**
   * Obtener todas las listas de precios activas de la clínica
   */
  async getPriceListsForClinic(): Promise<PriceList[]> {
    const res = await apiClient.get('/pricing/price-lists');
    return res.data;
  },

  /**
   * Calcular precios congelados para una cita ANTES de crearla
   * Retorna desglose por servicio + total
   */
  async calculateAppointmentPricing(
    clientId: string,
    serviceIds: string[],
  ): Promise<{
    items: Array<{ service_id: string; price: number; name: string }>;
    total: number;
    price_list: string;
    price_list_id: string;
    locked_at: string;
  }> {
    const res = await apiClient.post('/pricing/calculate', {
      client_id: clientId,
      service_ids: serviceIds,
    });
    return res.data;
  },

  /**
   * Obtener contexto de precios de una cita creada
   */
  async getAppointmentPricingContext(appointmentId: string): Promise<any> {
    const res = await apiClient.get(`/appointments/${appointmentId}/pricing`);
    return res.data;
  },
};
```

---

## 📈 PARTE 6: PLAN EVOLUTIVO A 3 AÑOS

### Año 1 (Q2 2026): Infraestructura Base

```
✅ Congelamiento de precios en citas
✅ appointment_items con price_at_booking
✅ Multi-price-lists por clínica
✅ UI para asignar precio_list a cliente
✅ Auditoría básica en price_list_history
✅ Validación multi-tenancy estricta
```

### Año 2 (Q4 2026 - Q4 2027): Reportes & Membership

```
📊 Reportes de ingresos por:
   - Período de tiempo
   - Servicio
   - Cliente
   - Price List

💳 Membership/Suscripciones:
   - Descuentos por miembro
   - Planes con servicios incluidos
   - Precio diferenciado

📱 Mobile app con precios sincronizados
   (grooming móvil con precios congelados)
```

### Año 3+ (2027+): Sistema Contable Completo

```
📖 Contabilidad:
   - Ingresos realizados vs proyectados
   - Costo de servicios
   - Márgenes por servicio
   - Forecast de ingresos

🎟️ Promociones:
   - Coupons con código
   - Descuentos temporales
   - Bundle de servicios

💰 POS Completo:
   - Procesar pagos en cita (Stripe, MercadoPago)
   - Facturación electrónica
   - Recibos/comprobantes

📦 Inventario:
   - Costo de productos usados por servicio
   - Margen neto por cita
```

### Arquitectura Evolutiva - Diagrama

```
2026 Q2          2026 Q4        2027 Q2         2027 Q4+
│                │              │               │
├─ Pricing v1    │              │               │
│  (congelado)   │              │               │
│                │              │               │
├─ appointment_  │              │               │
│  items         │              │               │
│                ├─ Reportes    │               │
│                │ Financieros  │               │
│                │              ├─ Membership   │
│                │              │  & Discounts  │
│                │              │               ├─ POS v1
│                │              │               │ (Stripe)
│                │              │               │
│                │              │               ├─ Auditoría
│                │              │               │ Completa
│                │              │               │
│                │              │               ├─ Reportazgo
│                │              │               │ Financiero
└────────────────┴──────────────┴───────────────┴────────
        ↓               ↓               ↓             ↓
      100+ cl         500+ cl        2000+ cl      5000+ cl
```

---

## 🔒 PARTE 7: CONSIDERACIONES DE MULTI-TENANCY

### Validaciones Críticas

```typescript
// middleware/tenant-pricing.guard.ts
// Garantizar que ninguna query de precios escape del clinic_id

async validatePricingTenant(
  clinicId: string,
  priceListId: string,
  servicePriceId: string,
): Promise<boolean> {
  // Verificar que priceList pertenece a clinic
  const priceList = await db.priceList.findOne({
    where: { id: priceListId, clinic_id: clinicId },
  });

  if (!priceList) {
    throw new ForbiddenException('Price list no pertenece a esta clínica');
  }

  // Verificar que servicePrice pertenece a clinic + priceList
  const servicePrice = await db.servicePrice.findOne({
    where: {
      id: servicePriceId,
      clinic_id: clinicId,
      price_list_id: priceListId,
    },
  });

  if (!servicePrice) {
    throw new ForbiddenException('Service price no pertenece a esta clínica/lista');
  }

  return true;
}
```

### Index Optimization para Multi-Tenancy

```sql
-- Queries frecuentes por clínica
CREATE INDEX idx_service_prices_clinic_list 
  ON service_prices(clinic_id, price_list_id);

CREATE INDEX idx_appointment_items_clinic_appt 
  ON appointment_items(clinic_id, appointment_id);

CREATE INDEX idx_price_lists_clinic_active 
  ON price_lists(clinic_id, is_active);

CREATE INDEX idx_appointments_clinic_total 
  ON appointments(clinic_id, total_amount);
```

---

## ✨ RESUMEN EJECUTIVO

| Aspecto | Status | Esfuerzo | Riesgo |
|--------|--------|----------|--------|
| **Congelamiento precios** | ✅ Implementar Q2 2026 | 5-8 días dev | Bajo (isolated change) |
| **Multi-price-lists** | ✅ Ya existe, mejorar UI | 2-3 días dev | Bajo |
| **Auditoria** | 🟡 V1 básico, mejorar Later | 3-5 días | Bajo |
| **Reportes financieros** | 📅 Q4 2026 | 10-15 días | Medio (agregación) |
| **Membership** | 📅 Q4 2026 | 15-20 días | Medio-Alto |
| **POS Completo** | 📅 Q2 2027 | 30+ días | Alto (payment gw) |

### Recomendaciones Inmediatas

1. **⚠️ VALIDAR:** Backend valida que `client.price_list_id` pertenece a `client.clinic_id`
2. **🎯 IMPLEMENTAR:** appointment_items + congelamiento de precios
3. **📊 PLANIFICAR:** Reportes financieros para Q4 2026
4. **🔒 DOCUMENTAR:** Políticas de edge cases (cliente cambia de lista, lista desactivada, etc.)

---

**Documento preparado por:** Senior Software Architect  
**Última revisión:** 01/03/2026  
**Versión:** 1.0 - Ready for Implementation
