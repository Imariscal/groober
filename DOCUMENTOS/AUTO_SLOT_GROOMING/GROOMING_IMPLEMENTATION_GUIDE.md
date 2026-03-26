# 🚀 GUÍA DE INTEGRACIÓN - Grooming a Domicilio con Ruteo Futuro

## Resumen de Implementación Completada

### ✅ Backend (NestJS + TypeORM)

#### 1. **Migraciones**
- `1740650000000-CreateClientAddressesTables.ts` - Tabla `client_addresses` con UNIQUE PARTIAL INDEX
- `1740650000001-AlterAppointmentsForGrooming.ts` - Campos: `location_type`, `address_id`, `assigned_staff_user_id`, `requires_route_planning`
- `1740650000002-CreateGroomerRoutesTables.ts` - Tablas `groomer_routes` y `groomer_route_stops` (preparadas para cron futuro)

#### 2. **Entidades**
- `ClientAddress` - Una dirección del cliente con geolocalización
- `GroomerRoute` - Ruta de grooming para un día/groomer
- `GroomerRouteStop` - Parada en una ruta (cita + métricas de viaje)
- **Appointment** (extendida) - Nuevos campos para HOME y grooming

#### 3. **Módulo de Direcciones** (`/modules/addresses`)
```
addresses.module.ts        - Módulo NestJS
addresses.controller.ts    - Endpoints CRUD
addresses.service.ts       - Lógica de negocio
repositories.ts            - Queries con transacciones (1 default)
dtos.ts                    - DTOs de validación
```

#### 4. **Endpoints Disponibles**
```
GET    /clients/{clientId}/addresses             - Listar direcciones
POST   /clients/{clientId}/addresses             - Crear dirección
PUT    /clients/{clientId}/addresses/{id}        - Actualizar
DELETE /clients/{clientId}/addresses/{id}        - Eliminar
POST   /clients/{clientId}/addresses/{id}/set-default - Marcar como default
```

**Citas (Extendidas)**:
```
POST   /appointments                - Crear con location_type + address_id
PUT    /appointments/{id}           - Actualizar incluye location_type, address_id
GET    /appointments/{id}           - Retorna location_type, address, etc.
```

#### 5. **DTOs de Appointment**

```typescript
// Crear
{
  pet_id: "uuid",
  client_id: "uuid",
  scheduled_at: "2026-03-15T10:30:00Z",
  location_type: "HOME",           // CLINIC (default) | HOME
  address_id: "uuid",              // Required if HOME
  duration_minutes: 30,
  assigned_staff_user_id: "uuid"   // Optional (futuro groomer)
}

// Actualizar - todos los campos son opcionales
```

#### 6. **Validaciones Implementadas**
- ✅ Si `location_type=HOME` → `address_id` requerido
- ✅ Address debe pertenecer al mismo client + clinic (validación en transacción)
- ✅ Máximo 1 default por (clinic_id, client_id) - UNIQUE PARTIAL INDEX
- ✅ Si se borra default → selecciona otra como default automáticamente
- ✅ Backward compatible: sin `location_type` → default `CLINIC`

---

### ✅ Frontend (Next.js 14 + React + Zustand)

#### 1. **Tipos** (`/types/index.ts`)
```typescript
- ClientAddress
- CreateClientAddressPayload
- UpdateClientAddressPayload
- Appointment (nuevo)
- AppointmentLocationTypeType = 'CLINIC' | 'HOME'
```

#### 2. **API Services**

**`lib/addresses-api.ts`**
```typescript
addressesApi.getClientAddresses(clientId)
addressesApi.createAddress(clientId, payload)
addressesApi.updateAddress(clientId, addressId, payload)
addressesApi.deleteAddress(clientId, addressId)
addressesApi.setDefaultAddress(clientId, addressId)
```

**`lib/appointments-api.ts`**
```typescript
appointmentsApi.createAppointment(payload)
appointmentsApi.getAppointments(filters)
appointmentsApi.getAppointment(appointmentId)
appointmentsApi.updateAppointment(appointmentId, payload)
appointmentsApi.updateAppointmentStatus(appointmentId, status)
```

#### 3. **Zustand Store** (`store/clientAddresses.store.ts`)
```typescript
const { 
  addresses,           // ClientAddress[]
  loading,
  selectedClientId,
  setSelectedClient,
  fetchAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getDefaultAddress,
  getAddressById,
  clearAddresses
} = useClientAddressesStore();
```

#### 4. **Componentes** (`components/addresses/`)

**`ClientAddressBook.tsx`**
- Renderiza lista de direcciones del cliente
- Botón "Agregar dirección"
- Actions: Edit, Delete, Set Default
- Badges: DEFAULT, OK/PENDING, Localizado
- Modal para crear/editar

**`AddressForm.tsx`** (Reutilizable)
- Formulario completo de dirección
- Campos: label, street, number_ext, number_int, city, state, neighborhood, zip_code, references
- Botón "Buscar en mapa" → abre MapsPicker
- Muestra badges de geolocalización
- Submit valida requeridos: street, city

**`MapsPicker.tsx` + `MapComponent.tsx`**
- Feature flag: `NEXT_PUBLIC_MAPS_ENABLED` (env)
- Si habilitado: Leaflet + Nominatim (OpenStreetMap)
  - Búsqueda por dirección → autocomplete
  - Pin draggable en mapa
  - Click en mapa → selecciona ubicación
- Si deshabilitado: Message informativo

**`AppointmentFormWithLocation.tsx`**
- Selector CLINIC / HOME (radio buttons)
- Si HOME:
  - Dropdown de direcciones del cliente (traídas del store)
  - Default preseleccionada
  - Opción "+ Agregar nueva" → abre modal AddressForm
  - Badge mostrando dirección seleccionada
  - Warning si geocode_status=PENDING
- Si CLINIC: oculta selector de dirección

#### 5. **Modal Reutilizable** (`components/Modal.tsx`)
- Backdrop semi-transparente
- Cierra con X o al clickear fuera
- Scrollable si contenido excede viewport

---

## 🔧 INSTALACIÓN Y CONFIGURACIÓN

### Backend

#### 1. Registrar nuevas entidades
El `app.module.ts` ya importa:
```typescript
import {
  ClientAddress,
  GroomerRoute,
  GroomerRouteStop,
} from '@/database/entities';
```

Y está en `TypeOrmModule.forFeature([...])`.

#### 2. Ejecutar migraciones
```bash
cd vibralive-backend
npm run migration:run
```

Esto crea:
- `client_addresses` con UNIQUE PARTIAL INDEX
- Nuevas columnas en `appointments`
- `groomer_routes` y `groomer_route_stops`

#### 3. Verificar módulo addresses en AppModule
Ya está agregado:
```typescript
import { ClientAddressesModule } from '@/modules/addresses/addresses.module';
// ... en imports array
```

### Frontend

#### 1. Instalar dependencias (si Leaflet no está)
```bash
cd vibralive-frontend
npm install leaflet
npm install --save-dev @types/leaflet
```

#### 2. Environment variables
Crear o actualizar `.env.local`:
```env
NEXT_PUBLIC_MAPS_ENABLED=true    # o false para deshabilitar mapa
```

#### 3. Tipos ya agregados
Los tipos están en `src/types/index.ts`:
- `ClientAddress`
- `Appointment`
- `AppointmentLocationTypeType`

#### 4. Store ya creado
```typescript
// Ya existe en src/store/clientAddresses.store.ts
import { useClientAddressesStore } from '@/store/clientAddresses.store';
```

---

## 💡 CÓMO USAR EN TUS PÁGINAS

### 1. Mostrar libreta de direcciones en página de cliente

```typescript
// app/(platform)/... /[clientId]/page.tsx
'use client';

import { ClientAddressBook } from '@/components/addresses';
import { useEffect, useState } from 'react';

export default function ClientPage({ params }) {
  return (
    <div className="p-6 space-y-6">
      <h1>Detalles del Cliente</h1>
      
      {/* Libreta de direcciones */}
      <ClientAddressBook 
        clientId={params.clientId}
        onAddressSelected={(address) => {
          console.log('Dirección seleccionada:', address);
        }}
      />

      {/* ... resto del contenido */}
    </div>
  );
}
```

### 2. Agregar grooming a form de cita

```typescript
// app/(platform)/appointments/new/page.tsx
'use client';

import { AppointmentFormWithLocation } from '@/components/addresses/AppointmentFormWithLocation';
import { appointmentsApi } from '@/lib/appointments-api';

export default function NewAppointmentPage() {
  const [selectedClientId, setSelectedClientId] = useState('');

  return (
    <div className="p-6 space-y-6">
      <h1>Nueva Cita</h1>

      {/* Selector de cliente (tu actual) */}
      <ClientSelector onSelect={setSelectedClientId} />

      {/* Selector de modalidad + dirección */}
      {selectedClientId && (
        <AppointmentFormWithLocation
          clientId={selectedClientId}
          onSubmit={async (appointmentData) => {
            await appointmentsApi.createAppointment(appointmentData);
          }}
          onCancel={() => {/* ... */}}
        />
      )}
    </div>
  );
}
```

### 3. Acceder al store directamente

```typescript
'use client';

import { useClientAddressesStore } from '@/store/clientAddresses.store';

export function MyComponent({ clientId }: { clientId: string }) {
  const { 
    addresses, 
    loading,
    setSelectedClient,
    getDefaultAddress,
    addAddress 
  } = useClientAddressesStore();

  useEffect(() => {
    setSelectedClient(clientId);
  }, [clientId, setSelectedClient]);

  const defaultAddress = getDefaultAddress();

  return (
    <div>
      <p>Cliente tiene {addresses.length} direcciones</p>
      <p>Default: {defaultAddress?.label}</p>
    </div>
  );
}
```

---

## 🗺️ MAPS: OPCIÓN Y CONFIGURACIÓN

### Opción A: Leaflet + Nominatim (Implementado)
✅ **Ventajas:**
- Open source / Free
- Sin API key
- Buen desempeño local
- Búsqueda por Nominatim funcional

❌ **Desventajas:**
- Tiles OSM pueden ser lentos en algunas regiones
- Nominatim tiene rate limiting (1 req/seg)

### Opción B: Google Maps (No implementado)
✅ Ventajas: Mejor UX, geocoding más preciso
❌ Desventajas: Requiere API key, costo ($), setup adicional

### Activar/Desactivar en ENV

```env
# Leaflet activo
NEXT_PUBLIC_MAPS_ENABLED=true

# Sin mapa (solo entrada manual)
NEXT_PUBLIC_MAPS_ENABLED=false
```

Si `false`: MapsPicker muestra un mensaje y permite entrada manual.

---

## 🔜 PRÓXIMOS PASOS: CRON PARA RUTEO A LAS 7:30 AM

### Archivos preparados (pero sin implementación)

1. **Tablas listas:**
   - `groomer_routes` - Rutas generadas
   - `groomer_route_stops` - Paradas en la ruta

2. **Campos en Appointment:**
   - `requires_route_planning` = true para HOME
   - `assigned_staff_user_id` = groomer (nullable, se llena al crear ruta)

3. **Modelo de datos:**
   - Cada cita HOME del día → un "stop" en una ruta
   - Cada groomer → una ruta por día
   - Algoritmo: nearest-neighbor, genetic, etc.

### Para implementar cron (FUTURO)

#### Backend:
1. Crear servicio `GroomerRoutingService`
2. Crear task NestJS con `@Cron('30 7 * * *')` (7:30 AM)
3. Query: todas citas HOME del día con `requires_route_planning=true` y `assigned_staff_user_id=null`
4. Agrupar por groomer
5. Calcular ruta optimal (TSP)
6. Crear registros en `groomer_routes` y `groomer_route_stops`
7. Actualizar `appointment.assigned_staff_user_id`

#### Frontend:
1. Dashboard groomer: ver ruta del día
2. Mapa: ver paradas en orden
3. Mobile: tracking en tiempo real

#### Librerías sugeridas:
- `@tsp-solver/tsp-solver` - Solver de TSP
- `haversine` - Distancia entre coords
- `@nestjs/schedule` - Ya instalado

---

## 📋 CHECKLIST DE VALIDACIÓN

### Backend
- [ ] Migraciones ejecutadas sin errores
- [ ] Tablas creadas en PostgreSQL
- [ ] UNIQUE PARTIAL INDEX en `client_addresses`
- [ ] Endpoints CRUD de direcciones funcionan
- [ ] Address validation en appointments
- [ ] Default management transaccional
- [ ] Backward compat: citas sin location_type → CLINIC

### Frontend
- [ ] Types compilables
- [ ] Store Zustand funciona
- [ ] API services retornan datos
- [ ] ClientAddressBook renderiza
- [ ] AddressForm válida
- [ ] MapsPicker toggle con env var
- [ ] AppointmentFormWithLocation integrable

### Integración
- [ ] Página cliente muestra libreta
- [ ] Crear cita con CLINIC funciona
- [ ] Crear cita con HOME + dirección funciona
- [ ] Edit dirección actualiza
- [ ] Delete dirección + auto-default funciona
- [ ] Warnings si geocode_status=PENDING

---

## 🚨 NOTAS IMPORTANTES

1. **Backward Compatibility:**
   - Citas sin `location_type` → automáticamente `CLINIC`
   - `clients.address` legacy mantiene (no se borra)
   - Primera dirección de cliente → auto-default

2. **Transaccionalidad:**
   - Set-default usa transacción para evitar race conditions
   - Delete default auto-selecciona otra (misma transacción)

3. **Geocoding:**
   - `geocode_status=PENDING` → sin lat/lng, cita usable pero sin ruteo
   - Warning visual en UI si sin geolocalizacion

4. **Feature Flag Maps:**
   - Si `NEXT_PUBLIC_MAPS_ENABLED=false`
   - MapsPicker muestra aviso y permite entrada manual
   - Fallback total: lat/lng quedan null

5. **No Implementado (por ahora):**
   - Cron para generar rutas a las 7:30 AM
   - Tracking en tiempo real
   - Notificaciones a cliente
   - Reoptimización dinámico de rutas

---

## 📞 Soporte Técnico

Si algo no funciona:

1. Verifica que migraciones ejecutaron: `SELECT * FROM client_addresses;`
2. Revisa que `NEXT_PUBLIC_MAPS_ENABLED` está en env
3. Compila TypeScript: `npm run build`
4. Logs en backend: `npm run start:dev` muestra errores
5. DevTools en navegador: Network tab para errores API

¡Listo! Tu sistema de grooming a domicilio está preparado. 🚀
