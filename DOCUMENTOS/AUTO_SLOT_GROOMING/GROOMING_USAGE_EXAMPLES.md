# 🎯 EJEMPLOS DE USO - Grooming Implementation

## 1. Mostrar Libreta de Direcciones en Página de Cliente

### Opción A: Página de detalles del cliente
```typescript
// app/(platform)/clients/[clientId]/page.tsx
'use client';

import { ClientAddressBook } from '@/components/addresses';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function ClientDetailsPage() {
  const params = useParams();
  const clientId = params.clientId as string;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">Detalles del Cliente</h1>

      {/* Información básica del cliente */}
      <section className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Información</h2>
        {/* Tu contenido actual */}
      </section>

      {/* 🆕 Libreta de direcciones */}
      <section className="bg-white p-6 rounded-lg shadow-md">
        <ClientAddressBook clientId={clientId} />
      </section>

      {/* Mascotas, citas previas, etc. */}
      <section className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Mascotas</h2>
        {/* Contenido de mascotas */}
      </section>
    </div>
  );
}
```

---

## 2. Crear Cita Incluyendo Selección de Modalidad (CLINIC/HOME)

### Página de nueva cita
```typescript
// app/(platform)/appointments/new/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { appointmentsApi } from '@/lib/appointments-api';
import { CreateAppointmentPayload } from '@/types';
import { AppointmentFormWithLocation } from '@/components/addresses/AppointmentFormWithLocation';
import toast from 'react-hot-toast';

export default function NewAppointmentPage() {
  const router = useRouter();
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedPetId, setSelectedPetId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (appointmentData: CreateAppointmentPayload) => {
    if (!selectedClientId || !selectedPetId || !scheduledAt) {
      toast.error('Complete todos los campos requeridos');
      return;
    }

    setLoading(true);
    try {
      const newAppointment = await appointmentsApi.createAppointment({
        ...appointmentData,
        client_id: selectedClientId,
        pet_id: selectedPetId,
        scheduled_at: scheduledAt,
      });

      toast.success('Cita creada exitosamente');
      router.push(`/appointments/${newAppointment.id}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al crear cita',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Nueva Cita</h1>

      <form className="bg-white p-6 rounded-lg shadow-md space-y-6">
        {/* Cliente */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cliente *
          </label>
          <ClientSelector
            selectedId={selectedClientId}
            onSelect={setSelectedClientId}
          />
        </div>

        {/* Mascota */}
        {selectedClientId && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mascota *
            </label>
            <PetSelector
              clientId={selectedClientId}
              selectedId={selectedPetId}
              onSelect={setSelectedPetId}
            />
          </div>
        )}

        {/* Fecha y hora */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fecha y Hora *
          </label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 🆕 Modalidad de cita + Dirección */}
        {selectedClientId && (
          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Modalidad de Servicio
            </h2>
            <AppointmentFormWithLocation
              clientId={selectedClientId}
              onSubmit={handleSubmit}
              onCancel={() => router.back()}
              loading={loading}
            />
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={() => router.back()}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || !selectedClientId || !selectedPetId}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'Creando...' : 'Crear Cita'}
          </button>
        </div>
      </form>
    </div>
  );
}
```

---

## 3. Acceder Directamente al Store Zustand

### Ejemplo: Componente que muestra dirección default
```typescript
// components/ClientDefaultAddressCard.tsx
'use client';

import { useEffect } from 'react';
import { useClientAddressesStore } from '@/store/clientAddresses.store';

export function ClientDefaultAddressCard({
  clientId,
}: {
  clientId: string;
}) {
  const {
    addresses,
    loading,
    setSelectedClient,
    getDefaultAddress,
  } = useClientAddressesStore();

  useEffect(() => {
    setSelectedClient(clientId);
  }, [clientId, setSelectedClient]);

  const defaultAddr = getDefaultAddress();

  if (loading) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg animate-pulse">
        Cargando dirección...
      </div>
    );
  }

  if (!defaultAddr) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700">
        Este cliente aún no tiene una dirección registrada.
      </div>
    );
  }

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <h3 className="font-semibold text-blue-900 mb-2">Dirección Principal</h3>
      <p className="text-blue-700">
        {defaultAddr.label && `${defaultAddr.label} - `}
        {defaultAddr.street} #{defaultAddr.number_ext}
      </p>
      <p className="text-blue-600 text-sm">
        {defaultAddr.neighborhood}, {defaultAddr.city}
      </p>
      {defaultAddr.geocode_status === 'OK' && (
        <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
          ✓ Localizado
        </span>
      )}
      {defaultAddr.geocode_status === 'PENDING' && (
        <span className="inline-block mt-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
          ⚠ Sin geolocalizacion
        </span>
      )}
    </div>
  );
}
```

---

## 4. Editar Cita Existente (Cambiar de CLINIC a HOME)

### Página de edición
```typescript
// app/(platform)/appointments/[appointmentId]/edit/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Appointment, UpdateAppointmentPayload } from '@/types';
import { appointmentsApi } from '@/lib/appointments-api';
import { AppointmentFormWithLocation } from '@/components/addresses/AppointmentFormWithLocation';

export default function EditAppointmentPage({
  params,
}: {
  params: { appointmentId: string };
}) {
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        const data = await appointmentsApi.getAppointment(
          params.appointmentId,
        );
        setAppointment(data);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointment();
  }, [params.appointmentId]);

  if (loading) return <div>Cargando...</div>;
  if (!appointment) return <div>Cita no encontrada</div>;

  const handleSubmit = async (updates: UpdateAppointmentPayload) => {
    try {
      await appointmentsApi.updateAppointment(appointment.id, updates);
      // Toast, redirect, etc.
    } catch (error) {
      console.error('Error updating appointment:', error);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Editar Cita
      </h1>

      {appointment && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          {/* Información actual */}
          <div className="mb-6 pb-6 border-b">
            <p>
              <strong>Cliente:</strong> {appointment.client?.name}
            </p>
            <p>
              <strong>Mascota:</strong> {appointment.pet?.name}
            </p>
            <p>
              <strong>Modalidad actual:</strong> {appointment.location_type}
            </p>
          </div>

          {/* Formulario de actualización */}
          <AppointmentFormWithLocation
            appointment={appointment}
            clientId={appointment.client_id}
            onSubmit={handleSubmit}
            onCancel={() => {
              /* navegar atrás */
            }}
          />
        </div>
      )}
    </div>
  );
}
```

---

## 5. Listar Citas Filtradas por Modalidad (CLINIC vs HOME)

### Dashboard o listado
```typescript
// components/AppointmentsTable.tsx
'use client';

import { useEffect, useState } from 'react';
import { Appointment } from '@/types';
import { appointmentsApi } from '@/lib/appointments-api';

export function AppointmentsTable() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filterType, setFilterType] = useState<'CLINIC' | 'HOME' | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const filters =
          filterType === 'ALL' ? {} : { location_type: filterType };
        const data = await appointmentsApi.getAppointments(filters);
        setAppointments(data.data);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [filterType]);

  return (
    <div className="space-y-4">
      {/* Filtro */}
      <div className="flex gap-2">
        {(['ALL', 'CLINIC', 'HOME'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-4 py-2 rounded-md transition ${
              filterType === type
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {type === 'CLINIC' ? '🏥 Clínica' : type === 'HOME' ? '🏠 Domicilio' : '📅 Todas'}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left">Cliente</th>
            <th className="border p-2 text-left">Mascota</th>
            <th className="border p-2 text-left">Modalidad</th>
            <th className="border p-2 text-left">Dirección</th>
            <th className="border p-2 text-left">Fecha</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map((appt) => (
            <tr key={appt.id} className="hover:bg-gray-50">
              <td className="border p-2">{appt.client?.name}</td>
              <td className="border p-2">{appt.pet?.name}</td>
              <td className="border p-2">
                {appt.location_type === 'CLINIC' ? '🏥 Clínica' : '🏠 Domicilio'}
              </td>
              <td className="border p-2">
                {appt.location_type === 'HOME' && appt.address
                  ? `${appt.address.street}, ${appt.address.city}`
                  : '-'}
              </td>
              <td className="border p-2">
                {new Date(appt.scheduled_at).toLocaleDateString('es-MX')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {appointments.length === 0 && (
        <p className="text-center text-gray-500 py-4">
          No hay citas encontradas
        </p>
      )}
    </div>
  );
}
```

---

## 6. Validación de Dirección con Warning (Sin Geolocalizar)

### Componente reutilizable
```typescript
// components/AddressWarningBadge.tsx
import { ClientAddress } from '@/types';

export function AddressWarningBadge({
  address,
  showDetails = false,
}: {
  address: ClientAddress;
  showDetails?: boolean;
}) {
  const isPending = address.geocode_status === 'PENDING';
  const isFailed = address.geocode_status === 'FAILED';

  if (!isPending && !isFailed) {
    return null;
  }

  return (
    <div
      className={`mt-3 p-3 rounded-md border ${
        isPending
          ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
          : 'bg-red-50 border-red-200 text-red-700'
      }`}
    >
      <p className="font-semibold">
        {isPending ? '⚠️ Ubicación Pendiente' : '❌ Falló la Geolocalización'}
      </p>
      {showDetails && (
        <p className="text-sm mt-1">
          {isPending
            ? 'Esta dirección se puede usar pero sin ruteo automático. Agregue coordenadas manualmente.'
            : 'Intente actualizar la dirección para geolocalizar.'}
        </p>
      )}
    </div>
  );
}

// Usage:
export function MyComponent() {
  const address: ClientAddress = {...};
  return (
    <div>
      <p>{address.street}</p>
      <AddressWarningBadge address={address} showDetails={true} />
    </div>
  );
}
```

---

## 7. Feature Flag Maps - Componente Condicional

### .env.local
```env
NEXT_PUBLIC_MAPS_ENABLED=true    # Habilitar mapas
# o
NEXT_PUBLIC_MAPS_ENABLED=false   # Deshabiitar mapas (fallback manual)
```

### Componente con fallback
```typescript
// components/AddressInputWithOptionalMap.tsx
import { MapsPicker } from '@/components/addresses/MapsPicker';

const MAPS_ENABLED = process.env.NEXT_PUBLIC_MAPS_ENABLED === 'true';

export function AddressInputWithOptionalMap() {
  const [lat, setLat] = useState<number | undefined>();
  const [lng, setLng] = useState<number | undefined>();

  return (
    <div className="space-y-3">
      <input type="text" placeholder="Dirección" />

      {MAPS_ENABLED ? (
        <MapsPicker
          onCoordinatesSelected={(newLat, newLng) => {
            setLat(newLat);
            setLng(newLng);
          }}
          initialLat={lat}
          initialLng={lng}
        />
      ) : (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
          💡 Maps está deshabilitado. Ingrese lat/lng manualmente si lo desea.
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <input
          type="number"
          placeholder="Lat"
          value={lat || ''}
          onChange={(e) => setLat(e.target.value ? parseFloat(e.target.value) : undefined)}
          step="0.00001"
        />
        <input
          type="number"
          placeholder="Lng"
          value={lng || ''}
          onChange={(e) => setLng(e.target.value ? parseFloat(e.target.value) : undefined)}
          step="0.00001"
        />
      </div>
    </div>
  );
}
```

---

## 8. Testing - Crear Dirección y Cita Relacionada

### Test E2E (Cypress/Playwright)
```typescript
// e2e/grooming.spec.ts
describe('Grooming Home Service', () => {
  it('should create address and appointment', async () => {
    // Login
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'owner@vibralive.test');
    await page.fill('input[name="password"]', 'Admin@123456');
    await page.click('button:has-text("Ingresar")');

    // Navegar a cliente
    await page.goto('/clients/client-id-123');

    // Agregar dirección
    await page.click('text=+ Agregar dirección');
    await page.fill('input[name="street"]', 'Avenida Reforestación');
    await page.fill('input[name="city"]', 'CDMX');
    // ... llenar más campos
    await page.click('button:has-text("Guardar")');
    await expect(page.locator('text=Dirección agregada')).toBeVisible();

    // Crear cita HOME
    await page.goto('/appointments/new');
    await page.selectOption('select[name="client"]', 'client-id-123');
    await page.selectOption('select[name="pet"]', 'pet-id-456');
    
    // Seleccionar HOME
    await page.click('label:has-text("A domicilio")');
    
    // Seleccionar dirección
    await page.selectOption('select[name="address"]', 'address-id-xyz');
    
    // Submit
    await page.click('button:has-text("Crear Cita")');
    
    // Verify
    await expect(page.locator('text=Cita creada exitosamente')).toBeVisible();
  });
});
```

---

## 9. Componente de Groomer Dashboard (Futuro)

```typescript
// components/GroomerDashboard.tsx (PREPARADO para futuro)
import { useEffect, useState } from 'react';

interface GroomerRouteWithStops {
  id: string;
  route_date: string;
  total_stops: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  stops: Array<{
    appointment_id: string;
    address: ClientAddress;
    stop_order: number;
    planned_arrival: string;
  }>;
}

export function GroomerDashboard({ groomerId }: { groomerId: string }) {
  const [todayRoute, setTodayRoute] = useState<GroomerRouteWithStops | null>(
    null,
  );
  const [currentStop, setCurrentStop] = useState(0);

  // Cuando cron genere rutas, esto mostrará:
  // - Lista de paradas para hoy
  // - Mapa con ruta optimizada
  // - Tiempos estimados
  // - Botones: Llegué, Terminé, etc.

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Mi Ruta del Hoy</h1>

      {todayRoute ? (
        <div className="space-y-6">
          {/* Mapa de ruta */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            {/* TODO: Renderizar mapa con paradas en orden */}
            <p className="text-gray-600">
              Total paradas: {todayRoute.total_stops}
            </p>
          </div>

          {/* Lista de paradas */}
          <div className="space-y-3">
            {todayRoute.stops.map((stop) => (
              <div
                key={stop.appointment_id}
                className={`p-4 rounded-lg border ${
                  stop.stop_order === currentStop
                    ? 'bg-blue-50 border-blue-400'
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">
                      Parada {stop.stop_order + 1}
                    </p>
                    <p>{stop.address.street}</p>
                    <p className="text-sm text-gray-600">
                      Llegar: {new Date(stop.planned_arrival).toLocaleTimeString()}
                    </p>
                  </div>
                  {stop.stop_order === currentStop && (
                    <div className="flex gap-2">
                      <button className="px-4 py-2 bg-green-600 text-white rounded">
                        ✓ Completar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-center text-gray-500 py-8">
          No hay ruta asignada para hoy
        </p>
      )}
    </div>
  );
}
```

---

Estos ejemplos cubren los casos de uso principales. Adapta según tu arquitectura actual. 🚀
