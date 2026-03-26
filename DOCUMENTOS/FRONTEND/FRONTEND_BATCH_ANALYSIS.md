# ANÁLISIS FRONTEND - IMPLEMENTACIÓN BATCH APPOINTMENTS

## 📊 ESTADO ACTUAL

### Componentes Existentes para Citas

**1. CreateAppointmentModal.tsx**
- ✅ Crea 1 cita para 1 mascota
- Usa AppointmentFormWithLocation internamente
- Soporta CLINIC y HOME
- Integración con pricing completa
- Timezone-aware

**2. AppointmentFormWithLocation.tsx**
- Formulario de cita individual
- CLINIC: Sin dirección, sin asignación automática
- HOME: Requiere dirección, soporta asignación manual
- Manejo de direcciones del cliente
- Estados: CLINIC/HOME con validación

**3. CompleteAppointmentModal.tsx**
- Completar/cerrar citas existentes
- Captura de personal que realizó el servicio
- Diferenciación CLINIC vs HOME

**4. PlanHomeGroomingRoutes.tsx**
- Planificar rutas para citas HOME
- Selección de fecha
- Asignación automática de estilistas

### Flujo Actual (1 Mascota = 1 Cita)

```
Cliente → Selecciona Mascota → CreateAppointmentModal 
→ AppointmentFormWithLocation 
→ Pricing Preview 
→ POST /pricing/appointments/create-with-pricing
→ Cita Creada (1)
```

---

## 🎯 CAMBIOS NECESARIOS - BATCH (Múltiples Mascotas)

### Estructura de Datos Esperada

**Entrada (Frontend)**
```typescript
{
  clientId: "uuid",
  scheduledAt: "2024-01-15",  // Misma fecha para todas
  durationMinutes: 30,         // Misma duración para todas  
  locationType: "CLINIC"|"HOME",
  addressId?: "uuid",          // Si HOME
  assignedStaffUserId?: "uuid",
  notes?: "string",
  pets: [
    {
      petId: "uuid",
      serviceIds: ["uuid1", "uuid2"],
      quantities: [1, 2],
      reason?: "string"
    },
    {
      petId: "uuid",
      serviceIds: ["uuid3"],
      quantities: [1],
      reason?: "string"
    }
  ]
}
```

**Salida (Backend)**
```typescript
{
  groupId: "uuid",
  appointments: [
    {
      appointmentId: "uuid",
      petId: "uuid",
      totalAmount: 1500,
      items: [...]
    },
    {
      appointmentId: "uuid",
      petId: "uuid",
      totalAmount: 2000,
      items: [...]
    }
  ],
  totalAmountCombined: 3500
}
```

---

## 📝 COMPONENTES A CREAR/ACTUALIZAR

### 1. **GroomingBatchAppointmentModal.tsx** (NUEVO)

**Responsabilidades:**
- Seleccionar múltiples mascotas del cliente
- Configurar parámetros comunes (fecha, duración, tipo, dirección)
- Manage lista de mascotas con servicios específicos por mascota
- Preview de precios total
- Envío al backend (POST /pricing/appointments/create-batch-with-pricing)

**Estructura:**
```typescript
interface BatchPetRow {
  petId: string;
  petName?: string;
  serviceIds: string[];
  quantities: number[];
  reason?: string;
  estimatedPrice?: number;
}

interface GroomingBatchAppointmentModalProps {
  isOpen: boolean;
  clientId: string;
  availablePets: Pet[];  // Mascotas del cliente
  onClose: () => void;
  onSuccess: (result: BatchAppointmentResponse) => void;
}
```

**Features:**
- Tabla dinámico para seleccionar mascotas
- Selector de servicios por mascota (dropdown/modal)
- Selector de cantidad de servicios
- Preview de precios por mascota y total
- Validación: Al menos 1 mascota, sin duplicados
- Botones: Cancelar, Crear Batch

**Integración:**
- Usa pricingApi para obtener precios
- Usa appointmentsApi para enviar batch
- Timezone-aware (getClinicDateKey)
- Toast notifications para success/error

---

### 2. **BatchPetServiceSelector.tsx** (NUEVO COMPONENTE REUTILIZABLE)

**Responsabilidades:**
- Seleccionar servicios para 1 mascota
- Configurar cantidades
- Modal o dropdown con lista de servicios

**Props:**
```typescript
interface BatchPetServiceSelectorProps {
  petId: string;
  selectedServiceIds: string[];
  selectedQuantities: number[];
  availableServices: ServicePrice[];
  onServicesChange: (serviceIds: string[], quantities: number[]) => void;
}
```

---

### 3. **BulkPricingPreview.tsx** (NUEVO COMPONENTE REUTILIZABLE)

**Responsabilidades:**
- Mostrar desglose de precios para múltiples mascotas
- Precio por mascota + total
- Mostrar servicios por mascota
- Refresh de precios en tiempo real

**Props:**
```typescript
interface BulkPricingPreviewProps {
  pets: BatchPetRow[];
  clinicTimezone: string;
  isLoading?: boolean;
  onPriceUpdate?: (prices: Record<string, number>) => void;
}
```

---

### 4. **API: pricingApi.ts** (ACTUALIZAR)

**Agregar método:**
```typescript
async createBatchAppointmentWithPricing(
  clientId: string,
  scheduledAt: string,
  durationMinutes: number,
  locationType: 'CLINIC' | 'HOME',
  addressId: string | undefined,
  pets: Array<{
    petId: string;
    serviceIds: string[];
    quantities: number[];
    reason?: string;
  }>,
  notes?: string,
): Promise<BatchAppointmentResponse>
```

---

### 5. **ClientPetSelector.tsx** (NUEVO COMPONENTE REUTILIZABLE)

**Responsabilidades:**
- Multi-select de mascotas del cliente
- Tabla con checkboxes
- Búsqueda/filtrado de mascotas

**Props:**
```typescript
interface ClientPetSelectorProps {
  clientId: string;
  selectedPetIds: string[];
  onSelectionChange: (petIds: string[]) => void;
  excludePetIds?: string[];  // Mascotas ya seleccionadas (para evitar duplicados)
  availablePets?: Pet[];      // Pasar pre-fetched o dejar que el componente fetch
}
```

---

## 🔄 FLUJO PROPUESTO (Batch)

### Entrada del Usuario

```
Cliente → Click "Crear Cita Batch" 
→ GroomingBatchAppointmentModal Opens
├─ Seleccionar Mascotas (ClientPetSelector)
├─ Configurar Parámetros Comunes
│  ├─ Fecha
│  ├─ Duración
│  ├─ Tipo (CLINIC/HOME)
│  ├─ Dirección (si HOME)
│  └─ Asignación (si CLINIC)
├─ Por cada Mascota
│  ├─ Seleccionar Servicios (BatchPetServiceSelector)
│  ├─ Configurar Cantidades
│  └─ Ver Precio Individual
├─ Preview de Precios (BulkPricingPreview)
└─ Click "Crear Citas"
   → POST /pricing/appointments/create-batch-with-pricing
   → Success: Mostrar Grupo de Citas Creadas
   → Error: Mostrar Error Específico por Mascota
```

---

## 📂 ESTRUCTURA DE ARCHIVOS NUEVA

```
src/
  components/
    appointments/
      ├── CreateAppointmentModal.tsx (✅ EXISTENTE)
      ├── GroomingBatchAppointmentModal.tsx (🆕)
      ├── index.ts (ACTUALIZAR - exportar nuevo modal)
      └── batch/
          ├── ClientPetSelector.tsx (🆕)
          ├── BatchPetServiceSelector.tsx (🆕)
          ├── BulkPricingPreview.tsx (🆕)
          └── index.ts (🆕 - exportar componentes batch)
  lib/
    ├── appointments-api.ts (ACTUALIZAR)
    ├── pricing-api.ts (ACTUALIZAR - agregar createBatchAppointmentWithPricing)
    └── batch-appointment-builder.ts (🆕 - utilidades para construir payload)
```

---

## 🔌 INTEGRACIÓN CON PÁGINAS

### Opción 1: Agregar Botón a Página de Citas

```typescript
// En appointments-list page o similar
<button onClick={() => setShowBatchModal(true)}>
  + Nueva Cita Batch (Múltiples Mascotas)
</button>

<GroomingBatchAppointmentModal
  isOpen={showBatchModal}
  clientId={selectedClientId}
  availablePets={clientPets}
  onClose={() => setShowBatchModal(false)}
  onSuccess={() => refetchAppointments()}
/>
```

### Opción 2: Desde Cliente Seleccionado

```typescript
// En client-details page
<button onClick={() => setShowBatchModal(true)}>
  Agendar Citas Batch para {client.name}
</button>

<GroomingBatchAppointmentModal
  isOpen={showBatchModal}
  clientId={client.id}
  availablePets={client.pets}
  onClose={() => setShowBatchModal(false)}
  onSuccess={() => refetchAppointments()}
/>
```

---

## ⚠️ CONSIDERACIONES IMPORTANTES

### 1. **Validaciones**
- ✅ Backend valida cada mascota
- Frontend debe:
  - Validar al menos 1 mascota
  - Validar NO duplicados de mascotas
  - Validar cada mascota tenga servicios
  - Validar fecha no en pasado
  - Validar dirección si HOME

### 2. **Timezone**
- Usar `getClinicDateKey(date, clinicTimezone)` para enviar fecha
- Usar `useClinicTimezone()` hook en modal
- Aplicar estándar de FASE 2

### 3. **Pricing**
- Calcular precios por mascota en tiempo real
- Mostrar desglose completo
- Backend retorna precios congelados

### 4. **Atomicidad (Importante)**
- Si UNA mascota falla → TODO falla (rollback en BD)
- Backend maneja en transacción
- Frontend debe mostrar error específico de qué mascota falló

### 5. **Estados de Carga**
- Loading durante validación
- Loading durante creación
- Deshabilitar botón mientras está creando
- Mostrar spinner por mascota (opcional)

---

## 🎨 DISEÑO UI RECOMENDADO

### Modal Layout

```
┌─────────────────────────────────────────┐
│  Crear Citas Batch para: Cliente XYZ   │ [X]
├─────────────────────────────────────────┤
│                                         │
│  SECCIÓN 1: PARÁMETROS COMUNES         │
│  ├─ Fecha: [2024-01-15]                │
│  ├─ Duración: [30 mins]                │
│  ├─ Tipo: [CLINIC / HOME ▼]           │
│  ├─ Dirección: [Dir. 1 ▼] (si HOME)   │
│  └─ Asignación: [Estilista ▼]         │
│                                         │
│  SECCIÓN 2: MASCOTAS Y SERVICIOS      │
│  ┌───────────────────────────┐         │
│  │ Mascota | Servicios | $ │ [+]      │
│  ├───────────────────────────┤         │
│  │ 🐕 Fido | 2 servicios| 850│ [-]    │
│  │ 🐈 Luna | 1 servicio | 600│ [-]    │
│  │ 🐇 Bugs | 1 servicio | 500│ [-]    │
│  └───────────────────────────┘         │
│                                         │
│  SECCIÓN 3: PREVIEW DE PRECIOS        │
│  ├─ Total Mascotas: 3                  │
│  ├─ Total Citas: 3                     │
│  └─ Total Monto: $1,950                │
│                                         │
│  ACCIONES                              │
│  [Cancelar] [Crear Citas ✓]           │
└─────────────────────────────────────────┘
```

---

## 📋 PUNTOS CLAVE

1. **Mantener CreateAppointmentModal intacto** - Sigue funcionando para 1 mascota
2. **Nuevo flujo batch completamente separado** - GroomingBatchAppointmentModal
3. **Reutilizar componentes** - Selector de servicios, preview de precios
4. **Validaciones backend primero** - Frontend previene obvios, backend valida todo
5. **Timezone-aware** - Aplicar FASE 2 estándar en todos lados
6. **Transacción atómica** - Si falla 1 mascota → todo falla

---

## ✅ PRÓXIMO PASO

Implementar en este orden:
1. GroomingBatchAppointmentModal.tsx
2. ClientPetSelector.tsx
3. BatchPetServiceSelector.tsx  
4. BulkPricingPreview.tsx
5. Actualizar pricingApi.ts
6. Actualizar appointments/index.ts para exportar nuevo modal
7. Integración en página (cliente o citas)
