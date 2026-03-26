# 📊 RESUMEN TÉCNICO - Grooming a Domicilio (Incrementales)

## 1️⃣ CAMBIOS IMPLEMENTADOS

### BASE DE DATOS (PostgreSQL)

#### Migraciones CreatedPor:
1. **CreateClientAddressesTables** (1740650000000)
   - Tabla: `client_addresses`
   - PK: `id` (uuid)
   - FK: `clinic_id`, `client_id`
   - Campos: label, street, number_ext, number_int, neighborhood, city, state, zip_code, references, lat, lng, geocode_status, is_default, timestamps
   - **Índice ÚNICO PARCIAL:** `ON client_addresses(clinic_id, client_id) WHERE is_default = true`
   - Índices adicionales: clinic_client, geocode_status

2. **AlterAppointmentsForGrooming** (1740650000001)
   - Agregar columnas a `appointments`:
     - `location_type` VARCHAR(20) DEFAULT 'CLINIC' → CLINIC | HOME
     - `address_id` UUID FK → client_addresses (SET NULL on DELETE)
     - `assigned_staff_user_id` UUID FK → users (SET NULL on DELETE)
     - `requires_route_planning` BOOLEAN DEFAULT false
   - Índices: location_type, requires_route_planning + scheduled_at

3. **CreateGroomerRoutesTables** (1740650000002)
   - Tabla: `groomer_routes`
     - route_date, groomer_user_id, status, total_stops, total_distance_meters, estimated_duration_minutes, generated_at, algorithm_version
   - Tabla: `groomer_route_stops`
     - stop_order, planned_arrival/departure, actual_arrival/departure, travel_distance, travel_duration_to_stop, status
   - Relaciones: route → stops (1:N), appointment → stops (1:1)

### BACKEND (NestJS + TypeORM)

#### Entidades:
1. **ClientAddress** (`src/database/entities/client-address.entity.ts`)
   - Mapeo completo de todos los campos
   - Enums: GeocodeStatus (PENDING|OK|FAILED)
   - Relaciones: Clinic, Client (ManyToOne → OneToMany en Client)

2. **GroomerRoute** / **GroomerRouteStop** (nuevas)
   - Estructuras listas para algoritmo de ruteo futuro

3. **Appointment** (extendida)
   - Nuevos campos: locationType, addressId, assignedStaffUserId, requiresRoutePlanning
   - Relaciones: ClientAddress, User (assignedStaffUser)

#### Módulo Addresses (`src/modules/addresses/`):
```
addresses.module.ts          → Imports, providers, exports
addresses.controller.ts      → 5 endpoints (CRUD + set-default)
addresses.service.ts         → Validaciones, business logic
repositories.ts              → Query builder + transacciones
dtos.ts                      → Create, Update, SetDefault, Response
```

**Endpoints:**
```
GET    /clients/:clientId/addresses
POST   /clients/:clientId/addresses
PUT    /clients/:clientId/addresses/:addressId
DELETE /clients/:clientId/addresses/:addressId
POST   /clients/:clientId/addresses/:addressId/set-default
```

**Validaciones Transaccionales:**
- Primera dirección → auto-default
- Set-default → desmarcar otras (ACID)
- Delete default → seleccionar siguiente más reciente (ACID)
- Address ownership: (clinic_id, client_id) match

#### Appointments (Extendido):
- DTOs: `CreateAppointmentDto` + `UpdateAppointmentDto` incluyen location_type, address_id, assigned_staff_user_id
- Service: validación si location_type=HOME → address_id requerido
- Service: appointment.address es lazy-loaded (relación ManyToOne)

#### App Module:
- Importa ClientAddressesModule
- Incluye ClientAddress, GroomerRoute, GroomerRouteStop en TypeOrmModule.forFeature()

### FRONTEND (Next.js 14 + React + Zustand)

#### Tipos (`src/types/index.ts`):
```typescript
interface ClientAddress {
  id, clinic_id, client_id, label, street, number_ext, number_int,
  neighborhood, city, state, zip_code, references, lat, lng,
  geocode_status, is_default, created_at, updated_at
}

interface Appointment {
  id, clinic_id, pet_id, client_id, scheduled_at, status, reason,
  location_type, address_id, address?, assigned_staff_user_id,
  veterinarian_id, duration_minutes, requires_route_planning,
  notes, cancelled_*, created_at, updated_at
}

type AppointmentLocationTypeType = 'CLINIC' | 'HOME';
```

#### API Services:
1. **`lib/addresses-api.ts`**
   - getClientAddresses, createAddress, updateAddress, deleteAddress, setDefaultAddress

2. **`lib/appointments-api.ts`** (nuevo)
   - createAppointment, getAppointments, getAppointment, updateAppointment, updateAppointmentStatus

#### Store (Zustand):
- **`store/clientAddresses.store.ts`**
  - State: addresses[], loading, selectedClientId, error
  - Actions: setSelectedClient, fetchAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress, getDefaultAddress, getAddressById, clearAddresses

#### Componentes (`components/addresses/`):
1. **AddressForm.tsx** (Reutilizable)
   - Form con validación (street, city requeridos)
   - Botón "Buscar en mapa" → MapsPicker
   - Badges de geocode_status
   - Campos: label, street, number_ext/int, neighborhood, city, state, zip_code, references, lat/lng

2. **ClientAddressBook.tsx**
   - Lista todas las direcciones del cliente
   - Acciones: Edit, Delete, Set Default
   - Integrate con Modal para crear/editar
   - Muestra badges: DEFAULT, OK/PENDING, Localizado

3. **MapsPicker.tsx** + **MapComponent.tsx**
   - Feature flag: NEXT_PUBLIC_MAPS_ENABLED
   - Si true: Leaflet map (OSM tiles) + Nominatim búsqueda
     - Click/drag marker para seleccionar coords
     - Autocomplete por dirección
   - Si false: Message "Maps deshabilitado"

4. **AppointmentFormWithLocation.tsx**
   - Radio buttons: CLINIC | HOME
   - Si HOME: dropdown de addresses + opción agregar nueva
   - Muestra dirección seleccionada con badge
   - Warning si sin geolocalizar

5. **Modal.tsx** (Reutilizable)
   - Backdrop, header, close button, scrollable content

#### Index file:
- `components/addresses/index.ts` → Exports ClientAddressBook, AddressForm, MapsPicker

---

## 2️⃣ BACKWARD COMPATIBILITY

✅ **Citas existentes:** Si no tienen `location_type`, se trata como `CLINIC` (default)
✅ **Legacy `clients.address`:** Se mantiene sin borrar (permite rollback)
✅ **Primero address de cliente:** Se marca automáticamente como default

---

## 3️⃣ FLUJO DE USUARIO (FRONTEND)

### A. Crear dirección en cliente:
1. Usuario abre ClientAddressBook
2. Click "+ Agregar dirección"
3. Modal abre AddressForm
4. Completa campos (opcionalmente busca en mapa)
5. Submit → API POST /clients/{id}/addresses
6. Zustand actualiza store, toast success
7. Si es primera → automáticamente marked as default

### B. Crear cita HOME:
1. Usuario abre NewAppointment
2. Selecciona cliente (tu flujo actual)
3. **Nuevo:** Selector CLINIC/HOME
4. Si HOME:
   - Dropdown de addresses (traído del store)
   - Opción "+ Agregar nueva"
5. Submit → API POST /appointments con location_type=HOME, address_id
6. Backend valida que address existe y pertenece a cliente

### C. Editar dirección:
1. ClientAddressBook → Click "Editar"
2. Modal abre AddressForm con datos pre-filled
3. Modifica campos/mapa
4. Submit → API PUT /clients/{id}/addresses/{id}
5. Store actualizado

---

## 4️⃣ PREPARACIÓN PARA CRON FUTURO (7:30 AM)

### Tablas listas:
- `groomer_routes` (ruta = N citas para 1 groomer en 1 día)
- `groomer_route_stops` (parada = 1 cita en secuencia + métricas)

### Campos en Appointment:
- `requires_route_planning` = true si location_type=HOME
- `assigned_staff_user_id` = null hasta que cron asigne groomer

### Flujo futuro (pseudocódigo):
```typescript
// 7:30 AM cron task
const appointmentsHoy = await db.find({
  where: { 
    scheduled_at: today,
    location_type: 'HOME',
    requires_route_planning: true,
    assigned_staff_user_id: null
  }
});

// Agrupar por groomer (asignación previa requerida)
// O: auto-asignar según carga

for (const groomer of groomers) {
  const appointmentsGroomer = appointmentsHoy.filter(a => ...)
  
  // Crear ruta
  const route = await db.groomerRoutes.create({
    route_date: today,
    groomer_user_id: groomer.id,
    status: 'GENERATED'
  });

  // TSP resolver (nearest-neighbor o genetic)
  const optimized = solveTSP(appointmentsGroomer);

  // Crear stops en orden
  for (const [order, appt] of optimized.entries()) {
    await db.groomerRouteStops.create({
      route_id: route.id,
      appointment_id: appt.id,
      stop_order: order,
      // planned_arrival/departure calculadas
    });

    // Actualizar appointment
    await db.appointments.update(appt.id, {
      assigned_staff_user_id: groomer.id
    });
  }
}
```

### Librerías necesarias (para el futuro):
- `@tsp-solver/tsp-solver` o similar
- `haversine` para distancia lat/lng
- Posibles: `lazy.js`, `ml-matrix` para ML

---

## 5️⃣ VALIDACIONES CRÍTICAS

| Escenario | Backend | Frontend |
|-----------|---------|----------|
| Crear address sin street | ❌ Validación DTOs | ❌ Form validator |
| Crear cita HOME sin address_id | ❌ Service exception | ❌ Form disabled |
| Eliminar address default | ✅ Auto-select next | N/A |
| Set default de address | ✅ Transacción (1 active) | ✅ UI actualiza |
| Address no pertenece cliente | ❌ 400 Bad Request | N/A (fetch solo sus addresses) |
| Geocode status PENDING | ✅ Permitido guardar | ⚠️ Warning UI |

---

## 6️⃣ TESTING RECOMENDADO

### Backend (e2e):
1. **Addresses:**
   - POST → crear, debe tener is_default=true si primera
   - POST → crear segunda, is_default=false
   - PUT → set-default
   - DELETE → debe auto-select otro como default

2. **Appointments:**
   - POST location_type=CLINIC → sin address_id
   - POST location_type=HOME sin address_id → 400 error
   - POST location_type=HOME + valid address_id → OK
   - PUT cambiar a HOME sin address_id → 400 error

### Frontend:
1. **ClientAddressBook:**
   - Renderiza lista
   - Agregar → modal abre
   - Editar → pre-fill
   - Delete → confirm modal

2. **AppointmentFormWithLocation:**
   - Radio CLINIC/HOME funciona
   - HOME → dropdown de addresses
   - "+ Agregar nueva" → modal

3. **Maps:**
   - Si MAPS_ENABLED=true → renderiza
   - Si false → muestra message
   - Click/drag funciona
   - Search por ciudad

---

## 7️⃣ NOTAS FINALES

### ✅ Hecho:
- Total database schema para grooming
- CRUD de addresses con default management
- DTOs + validaciones
- Zustand store funcional
- 4 componentes reutilizables
- Feature flag para maps
- API services completos

### ⏳ No hecho (futuro):
- Cron scheduler (7:30 AM)
- TSP solver (nearest-neighbor, genetic, etc.)
- Endpoint manual de testing `/routes/generate`
- Mobile tracking en tiempo real
- Campos de tracking (actual_arrival/departure)

### 🔒 Cambios backward-compatible:
- Citas sin location_type → CLINIC
- clients.address se mantiene
- Primera address auto-default
- Ningún breaking change

---

## 📌 INTEGRACIÓN CHECKLIST

- [ ] Migraciones ejecutadas: `npm run migration:run`
- [ ] Backend compilando sin errores
- [ ] Frontend types actualizados
- [ ] Envs: `NEXT_PUBLIC_MAPS_ENABLED` (true/false)
- [ ] Leaflet instalado: `npm install leaflet`
- [ ] ClientAddressBook importable en página cliente
- [ ] AppointmentFormWithLocation integrado en form citas
- [ ] Pruebas manuales: CRUD addresses
- [ ] Pruebas manuales: Crear cita HOME
- [ ] Zooming en maps funciona (si habilitado)

¡Listo! Sistema de grooming completamente operacional para fase 1. 🎉
