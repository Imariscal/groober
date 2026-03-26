# 🏗️ Stylist Availability Management - Implementación Completa

**Fecha de Implementación:** Marzo 4, 2026  
**Estado:** ✅ Completado

---

## 📋 Resumen de Cambios

Se ha implementado un sistema completo de gestión de disponibilidad de estilistas que valida:

- ✅ Horarios de trabajo por día de la semana
- ✅ Períodos de no disponibilidad (vacaciones, enfermedad, descanso)
- ✅ Capacidad máxima de citas por día
- ✅ Validación automática al asignar estilista a cita
- ✅ Endpoints para consultar estilistas disponibles

---

## 📦 Nuevas Entidades

### 1. `StylistAvailability` (Disponibilidad de Estilista)
Define horarios de trabajo por día de la semana.

**Tabla:** `stylist_availabilities`

```sql
CREATE TABLE stylist_availabilities (
  id uuid PRIMARY KEY,
  stylist_id uuid NOT NULL (FK → stylists),
  day_of_week integer (0-6, Lunes-Domingo),
  start_time time (ej: 09:00),
  end_time time (ej: 18:00),
  is_active boolean DEFAULT true,
  created_at timestamp,
  updated_at timestamp,
  UNIQUE(stylist_id, day_of_week)
);
```

**Campos:**
- `day_of_week`: 0 = Lunes, 6 = Domingo (ISO 8601)
- `start_time`, `end_time`: Formato HH:mm
- `is_active`: Si es false, el estilista no trabaja ese día

---

### 2. `StylistUnavailablePeriod` (Período No Disponible)
Define períodos en los que el estilista NO está disponible.

**Tabla:** `stylist_unavailable_periods`

```sql
CREATE TABLE stylist_unavailable_periods (
  id uuid PRIMARY KEY,
  stylist_id uuid NOT NULL (FK → stylists),
  reason enum('VACATION', 'SICK_LEAVE', 'REST_DAY', 'PERSONAL', 'OTHER'),
  start_date date,
  end_date date,
  is_all_day boolean DEFAULT true,
  start_time time (nullable, solo si no es all_day),
  end_time time (nullable, solo si no es all_day),
  notes text (opcional),
  created_at timestamp,
  updated_at timestamp
);
```

**Campos:**
- `reason`: Razón de la no disponibilidad (vacaciones, enfermedad, etc.)
- `is_all_day`: Si es todo el día o solo parcial
- `start_time`, `end_time`: Solo se usan si `is_all_day = false`

---

### 3. `StylistCapacity` (Capacidad de Estilista)
Define la capacidad máxima de citas para un día específico.

**Tabla:** `stylist_capacities`

```sql
CREATE TABLE stylist_capacities (
  id uuid PRIMARY KEY,
  stylist_id uuid NOT NULL (FK → stylists),
  date date NOT NULL,
  max_appointments integer (ej: 6),
  notes text (opcional),
  created_at timestamp,
  updated_at timestamp,
  UNIQUE(stylist_id, date)
);
```

**Uso:** Override de capacidad para días específicos (alta demanda, personal reducido, etc.)

---

## 🔧 Servicio: `StylistAvailabilityService`

Ubicación: `src/modules/stylists/services/stylist-availability.service.ts`

### Métodos Principales

#### 1. `canStylistAttendAppointment()`
Valida si un estilista PUEDE atender una cita en un horario específico.

**Validaciones (en orden):**
1. Estilista existe y está marcado como "bookable"
2. Usuario del estilista está activo
3. NO está en período de no disponibilidad
4. Cita cae dentro de horarios de trabajo
5. NO hay conflicto con otras citas
6. NO excede capacidad del día

```typescript
const result = await availabilityService.canStylistAttendAppointment(
  stylistId: string,
  appointmentStart: Date,
  appointmentEnd: Date,
  excludeAppointmentId?: string  // Para editar citas existentes
);

// Retorna:
{
  available: boolean,
  reason?: string,     // 'STYLIST_NOT_FOUND', 'STYLIST_NOT_BOOKABLE', etc.
  details?: Record<string, any>
}
```

---

#### 2. `getAvailableStylists()`
Retorna lista de estilistas disponibles para un timeslot.

```typescript
const slots = await availabilityService.getAvailableStylists(
  clinicId: string,
  appointmentStart: Date,
  appointmentEnd: Date
);

// Retorna:
[
  {
    stylistId: string,
    stylistName: string,
    available: true,
    conflicts?: undefined
  },
  // Solo estilistas "available: true"
]
```

---

#### 3. `getActiveStylists()`
Retorna estilistas que NO están de vacaciones hoy.

```typescript
const active = await availabilityService.getActiveStylists(clinicId: string);

// Retorna: Stylist[]
// Filtrados por:
// - isBookable = true
// - user.status = 'ACTIVE'
// - NO en período unavailable hoy
```

---

## 🌐 Nuevos Endpoints

### STYLISTS - Disponibilidad

#### POST `/clinics/:clinicId/stylists/:stylistId/availabilities`
Crear horario de trabajo

```json
{
  "day_of_week": 0,
  "start_time": "09:00",
  "end_time": "18:00",
  "is_active": true
}
```

---

#### GET `/clinics/:clinicId/stylists/:stylistId/availabilities`
Listar horarios

---

#### PUT `/clinics/:clinicId/stylists/:stylistId/availabilities/:availabilityId`
Actualizar horario

```json
{
  "start_time": "10:00",
  "end_time": "17:00"
}
```

---

#### DELETE `/clinics/:clinicId/stylists/:stylistId/availabilities/:availabilityId`
Eliminar horario

---

### STYLISTS - Período No Disponible

#### POST `/clinics/:clinicId/stylists/:stylistId/unavailable-periods`
Crear período de no disponibilidad

```json
{
  "reason": "VACATION",
  "start_date": "2026-03-10",
  "end_date": "2026-03-20",
  "is_all_day": true,
  "notes": "Vacaciones de primavera"
}
```

O parcial (horario específico):

```json
{
  "reason": "REST_DAY",
  "start_date": "2026-03-15",
  "end_date": "2026-03-15",
  "is_all_day": false,
  "start_time": "14:00",
  "end_time": "18:00",
  "notes": "Descanso por la tarde"
}
```

---

#### GET `/clinics/:clinicId/stylists/:stylistId/unavailable-periods`
Listar períodos

---

#### PUT `/clinics/:clinicId/stylists/:stylistId/unavailable-periods/:periodId`
Actualizar período

---

#### DELETE `/clinics/:clinicId/stylists/:stylistId/unavailable-periods/:periodId`
Eliminar período

---

### STYLISTS - Capacidad

#### POST `/clinics/:clinicId/stylists/:stylistId/capacities`
Crear capacidad específica para un día

```json
{
  "date": "2026-03-15",
  "max_appointments": 4,
  "notes": "Personal reducido"
}
```

---

#### GET `/clinics/:clinicId/stylists/:stylistId/capacities`
Listar capacidades

---

#### PUT `/clinics/:clinicId/stylists/:stylistId/capacities/:capacityId`
Actualizar capacidad

---

#### DELETE `/clinics/:clinicId/stylists/:stylistId/capacities/:capacityId`
Eliminar capacidad

---

### STYLISTS - Validación en Tiempo Real

#### POST `/clinics/:clinicId/stylists/:stylistId/check-availability`
Verificar si un estilista está disponible para un horario

```json
{
  "appointment_start": "2026-03-15T10:00:00Z",
  "appointment_end": "2026-03-15T10:30:00Z",
  "exclude_appointment_id": "uuid" // opcional, para editar citas
}
```

**Respuesta:**
```json
{
  "available": true,
  "reason": null,
  "details": null
}
```

O si NO está disponible:
```json
{
  "available": false,
  "reason": "SCHEDULE_CONFLICT",
  "details": {
    "stylistId": "uuid"
  }
}
```

---

#### POST `/clinics/:clinicId/stylists/check-availability-multi`
Obtener estilistas disponibles para un timeslot

```json
{
  "appointment_start": "2026-03-15T10:00:00Z",
  "appointment_end": "2026-03-15T10:30:00Z"
}
```

**Respuesta:**
```json
[
  {
    "stylist_id": "uuid",
    "stylist_name": "María García",
    "available": true,
    "conflicts": null
  },
  {
    "stylist_id": "uuid",
    "stylist_name": "Juan López",
    "available": false,
    "conflicts": ["SCHEDULE_CONFLICT"]
  }
]
```

---

#### GET `/clinics/:clinicId/stylists/active-list/all`
Obtener estilistas activos (NO de vacaciones)

---

### APPOINTMENTS - Estilistas Disponibles

#### GET `/appointments/check-stylist-availability/slots?start=...&end=...`
Obtener estilistas disponibles para crear una cita en un horario

**Query Parameters:**
- `start`: ISO 8601 datetime (ej: `2026-03-15T10:00:00Z`)
- `end`: ISO 8601 datetime (ej: `2026-03-15T10:30:00Z`)

**Respuesta:**
```json
{
  "appointment_start": "2026-03-15T10:00:00Z",
  "appointment_end": "2026-03-15T10:30:00Z",
  "available_stylists": [
    {
      "stylist_id": "uuid",
      "stylist_name": "María García",
      "available": true
    }
  ],
  "unavailable_stylists": [...],
  "total_available": 1,
  "total_unavailable": 3
}
```

---

## 🚀 Validación al Crear Cita

Cuando se crea una cita con `assigned_staff_user_id` (para citas a domicilio):

```typescript
POST /appointments
{
  "pet_id": "uuid",
  "client_id": "uuid",
  "scheduled_at": "2026-03-15T10:00:00Z",
  "duration_minutes": 30,
  "location_type": "HOME",
  "address_id": "uuid",
  "assigned_staff_user_id": "uuid"  // 🚀 SE VALIDA DISPONIBILIDAD
}
```

**Validaciones realizadas:**
1. Estilista existe
2. Usuario está asignado a la clínica
3. ⭐ **NUEVA: Estilista está disponible en ese horario**
4. ⭐ **NUEVA: No tiene conflictos con otras citas**
5. ⭐ **NUEVA: No está de vacaciones**
6. ⭐ **NUEVA: Tiene capacidad disponible ese día**

Si la validación falla, se retorna `BadRequestException` con razón específica:

```json
{
  "statusCode": 400,
  "message": "El estilista no está disponible: SCHEDULE_CONFLICT. Detalles: {...}",
  "error": "Bad Request"
}
```

---

## 📱 Flujo de UI Recomendado

### Crear Cita - Step 1: Seleccionar Fecha/Hora

```
Usuario selecciona:
- Fecha
- Hora inicio - Hora fin
- Duración
```

### Crear Cita - Step 2: Consultar Estilistas Disponibles

```typescript
// Frontend llama a:
GET /appointments/check-stylist-availability/slots?start=...&end=...

// Recibe lista de estilistas disponibles
// UI solo muestra estilistas con "available: true"
```

### Crear Cita - Step 3: Seleccionar Estilista

```
Dropdown/Radio con solo estilistas disponibles
```

### Crear Cita - Step 4: Crear Cita

```typescript
// Backend valida 2da vez por seguridad
POST /appointments {
  assigned_staff_user_id: seleccionado
}

// Si alguien más asignó ese estilista en los últimos segundos
// el backend rechazará la cita (SCHEDULE_CONFLICT)
```

---

## 🔄 Gestión de Disponibilidad por Estilista

### Setup Inicial (después de crear estilista)

```typescript
// 1. Definir horarios de trabajo
POST /clinics/:clinicId/stylists/:stylistId/availabilities
{
  "day_of_week": 0,  // Lunes
  "start_time": "09:00",
  "end_time": "18:00",
  "is_active": true
}
// Repetir para cada día de trabajo (0-6)

// 2. Definir períodos de vacaciones/descanso
POST /clinics/:clinicId/stylists/:stylistId/unavailable-periods
{
  "reason": "VACATION",
  "start_date": "2026-06-01",
  "end_date": "2026-06-15"
}

// 3. (Opcional) Override de capacidad para días específicos
POST /clinics/:clinicId/stylists/:stylistId/capacities
{
  "date": "2026-03-15",
  "max_appointments": 4
}
```

---

## 📊 Casos de Uso

### Caso 1: Estilista de Vacaciones
```
- Crear unavailable-period: VACATION del 1-15 Marzo
- getAvailableStylists() NO retorna ese estilista en esas fechas
- intenta hacer: POST /appointments con assigned_staff_user_id → RECHAZADA
```

### Caso 2: Estilista Sobreagendado
```
- Capacidad maxAppointments: 6 por día
- Día ya tiene 6 citas
- Intenta crear 7ª cita → '? CAPACITY_EXCEEDED → RECHAZADA
```

### Caso 3: Estilista Fuera de Horario
```
- Horarios: Lunes-Viernes 09:00-18:00
- Intenta agendar: Sábado 16:00 → OUTSIDE_WORK_HOURS → RECHAZADA
```

### Caso 4: Conflict con Otra Cita
```
- Estilista tiene cita: 10:00-10:30
- Intenta crear: 10:15-10:45 → SCHEDULE_CONFLICT → RECHAZADA
```

---

## 🗄️ Migración

Se ha creado migración:
**`1772900000000-CreateStylistAvailabilityTables.ts`**

Ejecutar:
```bash
cd vibralive-backend
npm run typeorm migration:run
```

---

## 📝 Próximos Pasos (Recomendados)

### Phase 2: Dashboard Estilista
- [ ] Crear panel donde estilista gestiona su propia disponibilidad
- [ ] Visualizar calendario con citas agendadas
- [ ] Solicitar vacaciones
- [ ] Ver capacidad del día

### Phase 3: Notificaciones
- [ ] Alerta si estilista va a estar de vacaciones próximamente
- [ ] Notificar cambios en capacidad
- [ ] Recordatorios de citas

### Phase 4: Analytics
- [ ] Utilización por estilista
- [ ] Picos de demanda
- [ ] Eficiencia de horarios

---

## ✅ Testing Checklist

- [ ] Crear disponibilidades para estilista
- [ ] Listar disponibilidades
- [ ] Crear periodo de vacaciones
- [ ] Verificar que no aparece en `getActiveStylists()`
- [ ] Intentar agendar cita con ese estilista → RECHAZADA
- [ ] Crear cita sin estilista asignado
- [ ] Consultar estilistas disponibles para un horario
- [ ] Crear cita asignando estilista disponible → ACEPTADA
- [ ] Crear cita asignando estilista NO disponible → RECHAZADA
- [ ] Validar conflictos de horarios

---

## 📞 Notas de Arquitectura

**Validación en Dos Niveles:**
1. **Nivel DTO:** Decoradores de validación (class-validator)
2. **Nivel Servicio:** Lógica de negocio (StylistAvailabilityService)

**Separación de Responsabilidades:**
- `StylistsService`: CRUD de estilistas y su configuración
- `StylistAvailabilityService`: VALIDACIÓN de disponibilidad
- `AppointmentsService: CREACIÓN de citas con validación integrada

**Índices en BD:**
- `(stylist_id, day_of_week)` UNIQUE
- `(stylist_id, start_date, end_date)` para queries eficientes
- `(stylist_id, date)` UNIQUE para capacidades

---

**Implementado por:** Arquitecto de Software  
**Última actualización:** Marzo 4, 2026
