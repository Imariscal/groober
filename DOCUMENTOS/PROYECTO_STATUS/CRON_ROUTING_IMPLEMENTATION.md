# 🔮 ROADMAP: Cron Job de Ruteo Futuro (7:30 AM)

## 📋 PRE-REQUISITOS COMPLETADOS

✅ Tablas: `groomer_routes`, `groomer_route_stops`  
✅ Campos en `appointments`: `location_type`, `address_id`, `assigned_staff_user_id`, `requires_route_planning`  
✅ Geolocalización: `lat`, `lng` en `client_addresses`  
✅ UI: Usuarios pueden crear citas HOME con dirección georeferenciada  

---

## 🎯 QUÉ HACE EL CRON (A FUTURO)

### 1. Triggering
**Cuándo:** Todos los días a las **7:30 AM**  
**Método:** NestJS `@Cron()` decorator + `@nestjs/schedule`  

```typescript
// routes.scheduler.ts (a crear)
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class RoutesSchedulerService {
  @Cron('30 7 * * *') // 7:30 AM cada día
  async generateRoutesFor Today(): Promise<void> {
    // Lógica aquí
  }
}
```

### 2. Queries Necesarias
```typescript
// Obtener citas del día actual (SIN AÚN ASIGNAR GROOMER)
const appointmentsForToday = await appointmentsRepository.find({
  where: {
    scheduled_at: Between(startOfDay, endOfDay),
    clinic_id: clinicId,
    location_type: 'HOME',  // Solo domicilio
    requires_route_planning: true,
    assigned_staff_user_id: IsNull(),  // Sin groomer aún
  },
  relations: ['client', 'address'],
  order: {
    scheduled_at: 'ASC'
  }
});
```

### 3. Asignación a Groomers
Opción A: **Pre-asignación manual** (usuario selecciona groomer antes)
```typescript
// Agrupar citas por groomer YA asignado
const groupedByGroomer = appointmentsForToday.reduce((acc, appt) => {
  if (!appt.assigned_staff_user_id) {
    // Error: cita sin groomer
    return acc;
  }
  const key = appt.assigned_staff_user_id;
  if (!acc[key]) acc[key] = [];
  acc[key].push(appt);
  return acc;
}, {} as Record<string, Appointment[]>);
```

Opción B: **Auto-asignación por carga** (futuro)
```typescript
// Listar groomers disponibles del día
const groomers = await usersRepository.find({
  where: {
    role: 'groomer',
    status: 'ACTIVE',
    clinic_id: clinicId
  }
});

// Calcular carga actual de cada groomer
const groomerLoads = await Promise.all(
  groomers.map(async (g) => ({
    groomer: g,
    appointmentCount: await appointmentsRepository.count({
      where: {
        assigned_staff_user_id: g.id,
        scheduled_date: today
      }
    })
  }))
);

// Asignar citas al groomer con menos carga
for (const appt of appointmentsForToday) {
  const leastLoadedGroomer = groomerLoads.sort(
    (a, b) => a.appointmentCount - b.appointmentCount
  )[0];
  appt.assigned_staff_user_id = leastLoadedGroomer.groomer.id;
  groomerLoads[0].appointmentCount++;
}
```

### 4. Algoritmo de TSP (Traveling Salesman Problem)

Resolver la ruta óptima para minimizar distancia/tiempo.

#### Implementación simple: Nearest Neighbor
```typescript
interface Coordinate {
  lat: number;
  lng: number;
}

function haversineDistance(
  coord1: Coordinate,
  coord2: Coordinate
): number {
  const R = 6371; // Tierra en km
  const dLat = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const dLng = ((coord2.lng - coord1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1.lat * Math.PI) / 180) *
      Math.cos((coord2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function nearestNeighborTSP(
  appointments: Appointment[]
): Appointment[] {
  if (appointments.length === 0) return [];

  const remainingAppts = [...appointments];
  const route: Appointment[] = [];
  let current = remainingAppts.shift()!;
  route.push(current);

  while (remainingAppts.length > 0) {
    let nearest: Appointment | null = null;
    let minDistance = Infinity;

    for (const appt of remainingAppts) {
      const distance = haversineDistance(
        { lat: current.address!.lat!, lng: current.address!.lng! },
        { lat: appt.address!.lat!, lng: appt.address!.lng! }
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearest = appt;
      }
    }

    if (nearest) {
      route.push(nearest);
      current = nearest;
      remainingAppts.splice(remainingAppts.indexOf(nearest), 1);
    }
  }

  return route;
}
```

#### Alternativa: Librería externa
```bash
npm install @tsp-solver/tsp-solver
# o
npm install or-tools
```

```typescript
import { TSPSolver } from '@tsp-solver/tsp-solver';

// Crear matriz de distancias
const distances = appointments.map((a1) =>
  appointments.map((a2) =>
    haversineDistance(
      { lat: a1.address!.lat!, lng: a1.address!.lng! },
      { lat: a2.address!.lat!, lng: a2.address!.lng! }
    )
  )
);

const solver = new TSPSolver(distances);
const optimizedRoute = solver.solve(); // Retorna índices
const optimizedAppointments = optimizedRoute.map((idx) => appointments[idx]);
```

### 5. Crear GroomerRoute + GroomerRouteStop

```typescript
async function generateResultForGroomer(
  groomer: User,
  appointmentsForGroomer: Appointment[]
): Promise<void> {
  // Resolver ruta
  const optimizedRoute = nearestNeighborTSP(appointmentsForGroomer);

  // Crear ruta
  const route = await groomerRoutesRepository.create({
    clinic_id: clinicId,
    route_date: today,
    groomer_user_id: groomer.id,
    status: 'GENERATED',
    total_stops: optimizedRoute.length,
    algorithm_version: 'v1.0-nearest-neighbor',
    generated_at: new Date(),
  });

  // Calcular tiempos
  let currentTime = new Date(appointmentsForGroomer[0].scheduled_at);
  let totalDistance = 0;

  for (let i = 0; i < optimizedRoute.length; i++) {
    const appt = optimizedRoute[i];
    const nextAppt = optimizedRoute[i + 1];

    // Distancia al following stop
    let distanceToNext = 0;
    if (nextAppt) {
      distanceToNext = haversineDistance(
        { lat: appt.address!.lat!, lng: appt.address!.lng! },
        { lat: nextAppt.address!.lat!, lng: nextAppt.address!.lng! }
      );
    }

    totalDistance += distanceToNext;

    // Crear Stop
    const plannedDeparture = new Date(
      currentTime.getTime() + (appt.duration_minutes || 30) * 60000
    );

    await groomerRouteStopsRepository.create({
      route_id: route.id,
      appointment_id: appt.id,
      stop_order: i,
      planned_arrival_time: currentTime,
      planned_departure_time: plannedDeparture,
      travel_distance_to_stop_meters: distanceToNext * 1000, // km a metros
      travel_duration_to_stop_minutes: Math.ceil((distanceToNext / 50) * 60), // Asumiendo 50 km/h
    });

    // Actualizar appointment
    await appointmentsRepository.update(appt.id, {
      assigned_staff_user_id: groomer.id,
    });

    // Tiempo para siguiente parada
    currentTime = new Date(
      plannedDeparture.getTime() +
        (Math.ceil((distanceToNext / 50) * 60) || 10) * 60000
    );
  }

  // Actualizar totales de ruta
  await groomerRoutesRepository.update(route.id, {
    total_distance_meters: Math.round(totalDistance * 1000),
    estimated_duration_minutes: Math.ceil(
      (currentTime.getTime() - appointmentsForGroomer[0].scheduled_at.getTime()) /
        60000
    ),
  });
}
```

### 6. Error Handling & Notifications

```typescript
async generateRoutesForToday(): Promise<void> {
  try {
    const clinics = await clinicsRepository.find();

    for (const clinic of clinics) {
      try {
        const appointmentsForToday = await this.getAppointmentsForToday(clinic.id);

        // Validaciones
        if (appointmentsForToday.some((a) => !a.address?.lat || !a.address?.lng)) {
          // Log warning: algunas citas sin geolocalizar
          this.logger.warn(
            `Clinic ${clinic.id}: Some appointments lack coordinates`
          );
        }

        // Agrupar y resolver rutas
        const groupedByGroomer = this.groupAppointmentsByGroomer(
          appointmentsForToday
        );

        for (const [groomerId, appointments] of Object.entries(
          groupedByGroomer
        )) {
          const groomer = await usersRepository.findOne(groomerId);
          if (!groomer) continue;

          await this.generateRouteForGroomer(clinic.id, groomer, appointments);

          // Notificación al groomer (email/WhatsApp)
          await this.notifyGroomerOfRoute(groomer, appointments.length);
        }
      } catch (error) {
        this.logger.error(
          `Error generating routes for clinic ${clinic.id}:`,
          error
        );
        // Continuar con próxima clínica
      }
    }
  } catch (error) {
    this.logger.error('Error in scheduled route generation:', error);
    // Send alert to admin
  }
}

private async notifyGroomerOfRoute(
  groomer: User,
  stopCount: number
): Promise<void> {
  // Enviar WhatsApp o email
  // "Tienes X paradas asignadas para hoy. Accede al dashboard: <link>"
}
```

---

## 🛠️ PASOS PARA IMPLEMENTAR

### Fase 1: Preparación
- [ ] Instalar `@tsp-solver/tsp-solver` o implementar nearest-neighbor
- [ ] Instalar `haversine` para cálculos de distancia
- [ ] Crear servicio `GroomerRoutingService`
- [ ] Crear entidad `RoutesScheduler` (o inline en servicio)

### Fase 2: Desarrollo
- [ ] Implementar TSP resolver
- [ ] Implementar cron job con `@Cron('30 7 * * *')`
- [ ] Implementar queries de citas del día
- [ ] Implementar lógica de asignación (pre o auto)
- [ ] Implementar creación de routes + stops
- [ ] Implementar error handling y logs
- [ ] Tests E2E

### Fase 3: Notificaciones
- [ ] Notificar a groomer (WhatsApp con detalles)
- [ ] Dashboard para groomer ver ruta
- [ ] Mapa interactivo con paradas
- [ ] Botones: Llegué, Terminé, Cancelar

### Fase 4: Tracking (Futuro)
- [ ] GPS en vivo del groomer
- [ ] Actualizar `actual_arrival_time` y `actual_departure_time`
- [ ] Notificar cliente cuando groomer sale para su dirección
- [ ] Reoptimizar ruta si es necesario (problema: todos orders cambian)

---

## 🧪 TESTING DE CRON

```typescript
// test/routes.scheduler.spec.ts
describe('RoutesScheduler', () => {
  it('should generate routes at 7:30 AM', async () => {
    // Mock @Cron para no esperar timing real
    const scheduleModule = await Test.createTestingModule({
      providers: [
        RoutesSchedulerService,
        AppointmentsRepository,
        GroomerRoutesRepository,
        // ...
      ],
    }).compile();

    const scheduler = scheduleModule.get(RoutesSchedulerService);

    // Insertar citas HOME para hoy
    // ...

    // Llamar manualmente (simulando 7:30 AM)
    await scheduler.generateRoutesForToday();

    // Verificar que routes + stops fueron creados
    const routes = await groomerRoutesRepository.find({
      where: { route_date: today },
    });

    expect(routes).toHaveLength(2); // 2 groomers
    expect(routes[0].total_stops).toBe(3);
  });
});
```

---

## 📊 ENDPOINT MANUAL (OPCIONAL - PARA TESTING)

```typescript
// appointments.controller.ts
@Post('/routes/generate-manual')
@UseGuards(AuthGuard('jwt'))
async generateRoutesManually(
  @CurrentClinicId() clinicId: string
) {
  // Solo admin/owner
  return this.routesScheduler.generateRoutesForToday(clinicId);
}
```

---

## 📈 MÉTRICAS A TRACKEAR

```typescript
interface RouteMetrics {
  total_routes_generated: number;
  total_stops: number;
  avg_stops_per_route: number;
  avg_distance_km: number;
  avg_duration_minutes: number;
  appointments_without_coordinates: number;
  generation_time_seconds: number;
}
```

---

## 🎯 CONFIGURACIÓN

```env
# .env
GROOMING_ROUTE_CRON_SCHEDULE=30 7 * * *    # 7:30 AM
GROOMING_ROUTING_ALGORITHM=nearest-neighbor # o: genetic, simulated-annealing
GROOMING_ASSUMED_SPEED_KMH=50               # Para calcular tiempos
GROOMING_ENABLE_NOTIFICATIONS=true          # Notificar groomers
```

---

## 🚀 NOTAS FINALES

- El cron **NO genera rutas automáticamente** hasta que se implemente este servicio
- Mientras tanto: CRUD de addresses + citas HOME funciona perfectamente
- Cuando se implemente cron: automáticamente poblará `groomer_routes` y `groomer_route_stops`
- El resto del sistema (UI, validaciones, almacenamiento) **YA ESTÁ LISTO**

---

**Próxima fase:** Cuando tengas tiempo/recursos, retoma este documento e implementa el scheduler. 🚀
