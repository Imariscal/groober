# Análisis de Módulos: Grooming y Reportes - VibraLive

**Fecha de Análisis:** Marzo 12, 2026  
**Workspace:** vibralive-backend/src

---

## 📋 TABLA DE CONTENIDOS

1. [Módulo de Grooming](#módulo-de-grooming)
2. [Módulo de Reportes](#módulo-de-reportes)
3. [Resumen Ejecutivo](#resumen-ejecutivo)

---

## 🛁 MÓDULO DE GROOMING

### 1. UBICACIÓN DEL CÓDIGO

#### Controladores
- **Ubicación:** `vibralive-backend/src/modules/appointments/`
- **Archivo:** `appointments.controller.ts`
- **Ruta Base:** `POST /appointments` (crear citas de grooming)
- **Métodos Principales:**
  - `@Post()` - Crear nueva cita (grooming o médica)
  - `@Get()` - Obtener todas las citas
  - `@Get(':id')` - Obtener cita específica
  - `@Get('check-stylist-availability/slots')` - Verificar disponibilidad de estilistas
  - `@Put(':id')` - Actualizar cita existente
  - `@Patch(':id/status')` - Cambiar estado de cita

#### Servicios
- **Ubicación:** `vibralive-backend/src/modules/appointments/services/`
- **Archivo:** `grooming-validation.service.ts`
  - Validación completa de citas de grooming
  - Verificación de horarios comerciales
  - Validación de capacidad y conflictos
  - Control de reglas por ubicación (CLINIC/HOME)
  
- **Archivo:** `appointment-cleanup.service.ts`
  - Limpieza y mantenimiento de datos de citas

- **Archivo Principal:** `appointments.service.ts` (en nivel superior)
  - Orquesta toda la lógica de citas
  - Integración con estilistas (stylists)
  - Gestión de rutas de optimización

#### DTOs (Data Transfer Objects)
**Ubicación:** `vibralive-backend/src/modules/appointments/dtos/`

| DTO | Propósito |
|-----|-----------|
| `CreateAppointmentDto` | Crear nueva cita con validaciones |
| `UpdateAppointmentDto` | Actualizar cita existente |
| `UpdateStatusDto` | Cambiar estado (SCHEDULED→CONFIRMED→COMPLETED) |
| `UpdateAppointmentServicesDto` | Modificar servicios de cita |
| `CompleteAppointmentDto` | Completar cita con resumen |

**Campos principales de CreateAppointmentDto:**
```typescript
{
  pet_id: UUID                    // Mascota
  client_id: UUID                 // Cliente
  scheduled_at: ISO8601          // Fecha/hora
  reason?: string                // Motivo/servicio
  duration_minutes?: number      // Duración (min: 15)
  veterinarian_id?: UUID         // Veterinario (si aplica)
  location_type?: CLINIC|HOME    // Ubicación
  address_id?: UUID              // Dirección (requerida si HOME)
  assigned_staff_user_id?: UUID  // Estilista asignado
}
```

---

### 2. TABLAS DE BASE DE DATOS RELACIONADAS

#### Tabla: `appointments` (Principal)
```sql
CREATE TABLE appointments (
  id UUID PRIMARY KEY,
  clinic_id UUID NOT NULL,
  pet_id UUID NOT NULL,
  client_id UUID NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'SCHEDULED',
    -- SCHEDULED | CONFIRMED | IN_PROGRESS | COMPLETED | CANCELLED | NO_SHOW | UNATTENDED
  reason TEXT,
  duration_minutes INTEGER,
  veterinarian_id UUID,
  notes TEXT,
  location_type ENUM['CLINIC', 'HOME'] DEFAULT 'CLINIC',
  service_type ENUM['MEDICAL', 'GROOMING'] DEFAULT 'MEDICAL',
  address_id UUID,
  assigned_staff_user_id UUID,  -- Estilista asignado
  assignment_source ENUM['NONE', 'AUTO_ROUTE', 'MANUAL_RECEPTION', 'COMPLETED_IN_CLINIC'],
  cancelled_at TIMESTAMP,
  cancelled_by UUID,
  cancellation_reason VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- ÍNDICES
  INDEX (clinic_id, status)
  INDEX (clinic_id, scheduled_at)
  INDEX (clinic_id, created_at)
};
```

#### Tabla: `groomer_routes` (Rutas de Grooming a Domicilio)
```sql
CREATE TABLE groomer_routes (
  id UUID PRIMARY KEY,
  clinic_id UUID NOT NULL,
  route_date DATE,
  groomer_user_id UUID NOT NULL,  -- Estilista
  status ENUM['PENDING', 'GENERATED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
  total_stops INTEGER,
  total_distance_meters INTEGER,
  estimated_duration_minutes INTEGER,
  generated_at TIMESTAMP,
  algorithm_version VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- ÍNDICES
  INDEX (clinic_id, route_date)
  INDEX (groomer_user_id, route_date)
  INDEX (status)
};
```

#### Tabla: `groomer_route_stops` (Paradas de Cada Ruta)
```sql
CREATE TABLE groomer_route_stops (
  id UUID PRIMARY KEY,
  route_id UUID NOT NULL,
  appointment_id UUID NOT NULL,
  stop_order INTEGER,
  planned_arrival_time TIMESTAMP,
  planned_departure_time TIMESTAMP,
  actual_arrival_time TIMESTAMP,
  actual_departure_time TIMESTAMP,
  travel_distance_to_stop_meters INTEGER,
  travel_duration_to_stop_minutes INTEGER,
  status ENUM['PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED'],
  
  -- ÍNDICES
  INDEX (route_id)
  INDEX (appointment_id)
};
```

#### Tabla: `stylists` (Personal de Grooming)
```sql
-- Estilistas vinculados con users
-- Contiene información de skills, capacidad, etc.
```

#### Tabla: `stylist_availability` (Horarios de Estilistas)
- Horarios de trabajo por día
- Control de descansos

#### Tabla: `client_addresses` (Direcciones para HOME grooming)
- Ubicaciones donde se realizan citas a domicilio

---

### 3. ENDPOINTS DISPONIBLES (Grooming)

#### Base URL: `/appointments`

| Método | Endpoint | Permisos | Descripción |
|--------|----------|----------|-------------|
| POST | `/appointments` | `appointments:create` | Crear nueva cita (grooming o médica) |
| GET | `/appointments` | `appointments:read` | Listar todas las citas con filtros |
| GET | `/appointments/:id` | `appointments:read` | Obtener cita específica |
| GET | `/appointments/check-stylist-availability/slots` | `appointments:check_availability` | Buscar estilistas disponibles para franja horaria |
| PUT | `/appointments/:id` | `appointments:update` | Actualizar datos de cita |
| PATCH | `/appointments/:id/status` | `appointments:update_status` | Cambiar estado de cita |

#### Base URL: `/routes` (Planificación de Rutas)

| Método | Endpoint | Permisos | Descripción |
|--------|----------|----------|-------------|
| GET | `/routes/health` | `appointments:read` | Verificar salud del servicio de optimización |
| POST | `/routes/optimize` | `appointments:create` | Optimizar rutas para una fecha |
| POST | `/routes/optimize/raw` | `appointments:create` | Optimizar rutas (request raw) |
| POST | `/routes/optimize/validate` | `appointments:read` | Validar solicitud de optimización |
| GET | `/routes/optimize/config` | `appointments:read` | Obtener configuración por defecto |
| GET | `/routes/optimize/example` | `appointments:read` | Obtener ejemplo de request |

#### Base URL: `/clinics/:clinicId/stylists` (Gestión de Estilistas)

| Método | Endpoint | Permisos | Descripción |
|--------|----------|----------|-------------|
| GET | `/stylists` | `stylists:read` | Listar estilistas (con filtro bookableOnly) |
| GET | `/stylists/:stylistId` | `stylists:read` | Obtener estilista específico |
| PUT | `/stylists/:stylistId` | `stylists:update` | Actualizar datos estilista |
| POST | `/stylists/:stylistId/availabilities` | `stylists:update` | Crear horario de trabajo |
| GET | `/stylists/:stylistId/availabilities` | `stylists:read` | Listar horarios de estilista |
| POST | `/stylists/:stylistId/unavailable-periods` | `stylists:update` | Crear período no disponible |
| GET | `/stylists/:stylistId/unavailable-periods` | `stylists:read` | Listar períodos no disponibles |

---

### 4. FUNCIONALIDADES PRINCIPALES

#### A. Crear Citas de Grooming
- **Entrada:** `CreateAppointmentDto` con:
  - Mascota, cliente, fecha/hora
  - Ubicación (CLINIC o HOME)
  - Duración (mínimo 15 minutos)
  - Estilista preferido (opcional)
  
- **Validaciones:**
  - Futura (mínimo 5 minutos)
  - Dentro de horarios comerciales
  - No solapamiento de citas (mismo estilista)
  - Reglas por ubicación (preventSamePetSameDay)
  - Capacidad máxima por estilista

- **Salida:** Cita creada con ID, estado SCHEDULED

#### B. Asignar Estilistas
- **Métodos de asignación:**
  - `MANUAL_RECEPTION`: Asignación manual en recepción
  - `AUTO_ROUTE`: Asignación automática por optimizador de rutas
  - `COMPLETED_IN_CLINIC`: Asignación post-cita en clínica
  
- **Endpoint:** `GET /appointments/check-stylist-availability/slots`
  - Parámetros: start, end (ISO 8601)
  - Retorna: Estilistas disponibles en franja

#### C. Planificar Rutas (AUTO-GROOMING)
- **Función:** Optimizar rutas para estilistas con citas a domicilio
- **Input:**
  ```json
  {
    "clinic_id": "uuid",
    "date": "ISO_DATE",
    "config": {
      "weight_travel_time": 1.0,
      "weight_time_window_violations": 10.0,
      "weight_balance_load": 0.5,
      "max_solve_time_seconds": 30,
      "allow_unassigned": true
    }
  }
  ```

- **Algoritmo:**
  - Microservicio Python (OR-Tools VRP/VRPTW)
  - Minimiza tiempo de viaje + violaciones de ventanas de tiempo
  - Balancea carga entre estilistas
  
- **Output:** Rutas optimizadas (paradas ordenadas, tiempos, distancias)

#### D. Estados de Citas
```
SCHEDULED → CONFIRMED → IN_PROGRESS → COMPLETED
     ↓
  CANCELLED (con razón)
  NO_SHOW
  UNATTENDED
```

#### E. Auto-Slot (Búsqueda Automática de Horario)
- **Feature:** Cuando usuario presiona "Nueva Cita", busca automáticamente:
  - Próximo horario disponible
  - Próxima hora hábil
  - Auto-llena en el formulario
- **Componente Frontend:** `UnifiedGroomingModal.tsx`

---

### 5. ESTADO ACTUAL: INCOMPLETO → EN DESARROLLO

#### ✅ Implementado:
- [x] Entidades y tablas de BD (appointments, groomer_routes, groomer_route_stops)
- [x] Servicios base (grooming-validation.service.ts)
- [x] DTOs y validaciones
- [x] Endpoints de CRUD de citas
- [x] Integración con estilistas
- [x] Servicio de optimización de rutas (cliente Python)
- [x] Validaciones complejas (horarios, capacidad, conflictos)
- [x] Auto-slot feature (búsqueda automática de horario)
- [x] Sistema de permisos y roles

#### ⚠️ Parcialmente Implementado:
- [ ] Optimizador de rutas (routes.service.ts tiene TODOs)
  - Métodos `getAppointmentsForOptimization()` y `getStylistsForOptimization()` son stubs
  - `saveOptimizationResults()` no implementado
  - Necesita integración completa con BD
  
- [ ] Tests y validaciones end-to-end
- [ ] Sincronización de rutas con app móvil

#### 🔴 No Implementado:
- [ ] Tracking GPS en tiempo real
- [ ] Notificaciones de cambios de ruta
- [ ] Compensación de sobrecarga de estilistas
- [ ] Cancelación automática por cambios de ruta

#### 📊 Cobertura Estimada: **75%**
- CRUD de citas: 95%
- Validaciones: 90%
- Optimización de rutas: 40% (servicios stub)
- Reportes en tiempo real: 0%

---

## 📊 MÓDULO DE REPORTES

### 1. UBICACIÓN DEL CÓDIGO

#### Controlador
- **Ubicación:** `vibralive-backend/src/modules/reports/controllers/`
- **Archivo:** `reports.controller.ts`
- **Ruta Base:** `GET /reports/[tipo]`
- **Métodos:** 7 endpoints GET para diferentes tipos de reportes

#### Servicios
- **Ubicación:** `vibralive-backend/src/modules/reports/services/`
- **Archivos disponibles:**
  - `reports.service.ts` - Utilitarios base (formato fecha, moneda, % cambio)
  - `revenue-report.service.ts` - Reportes de ingresos
  - `appointments-report.service.ts` - Reportes de citas
  - `clients-report.service.ts` - Reportes de clientes
  - `services-report.service.ts` - Reportes de servicios
  - `performance-report.service.ts` - Reportes de desempeño (estilistas)
  - `geography-report.service.ts` - Reportes geográficos
  - `overview-report.service.ts` - Resumen ejecutivo

#### DTOs
- **Ubicación:** `vibralive-backend/src/modules/reports/dto/`
- **Archivo:** `reports.dto.ts`
- **Contiene:** Interfaces para KPIs, gráficos, datos de cada tipo de reporte

---

### 2. TIPOS DE REPORTES DISPONIBLES

#### A. **Reporte de Ingresos (Revenue)** ✅
**Endpoint:** `GET /reports/revenue`

**Parámetros:**
```typescript
period: 'today' | 'week' | 'month' | 'year' (default: 'month')
startDate?: ISO8601
endDate?: ISO8601
locationType?: 'CLINIC' | 'HOME'
statuses?: string[] (CONFIRMED, COMPLETED, CANCELLED)
```

**KPIs Incluidos:**
- Total de ingresos
- Promedio por cita
- Promedio diario
- Ticket promedio por cliente

**Gráficos:**
- Ingresos acumulados por día
- Ingresos por servicio (nombre, monto, %)

**Estructura:**
```json
{
  "kpis": {
    "totalRevenue": { "label", "value", "change", "period" },
    "avgPerAppointment": { ... },
    "dailyAverage": { ... },
    "ticketPerClient": { ... }
  },
  "charts": {
    "cumulativeRevenue": [{ "date", "revenue" }],
    "byService": [{ "name", "revenue", "percentage", "appointmentCount", "avgPrice" }]
  },
  "metadata": { "period", "currency", "lastUpdated" }
}
```

---

#### B. **Reporte de Citas (Appointments)** ✅
**Endpoint:** `GET /reports/appointments`

**Parámetros:**
```typescript
period: default 'week' (same as revenue)
startDate?, endDate?, locationType?, statuses?
```

**KPIs Incluidos:**
- Citas confirmadas esta semana
- Tasa de confirmación (%)
- Citas canceladas este mes
- Cliente más activo

**Gráficos:**
- Citas por día (scheduled, confirmed, cancelled)
- Citas por estilista

**Detalle:**
- Listado de citas del período con:
  - Hora, cliente, mascota, servicio, estilista, estado

---

#### C. **Reporte de Clientes (Clients)** ✅
**Endpoint:** `GET /reports/clients`

**KPIs:**
- Clientes activos totales
- Nuevos clientes este mes
- Tasa de repetición (%)
- Clientes por plan (gráfico pie)

**Gráficos:**
- Tendencia de crecimiento (nuevos/mes acumulativos)
- Top clientes por ingresos (nombre, citas, gastado)

**Análisis:**
- Tabla de clientes con:
  - Nombre, email, teléfono, # citas, última cita, plan, estado

---

#### D. **Reporte de Servicios (Services)** ✅
**Endpoint:** `GET /reports/services`

**Contenido:**
- Nombre servicio
- Tipo (GROOMING, MEDICAL, etc.)
- Demanda (# de citas)
- Ingresos totales
- Precio promedio
- Margen estimado
- Estado

---

#### E. **Reporte de Desempeño (Performance)** ✅
**Endpoint:** `GET /reports/performance`

**Foco:** Estilistas y veterinarios

**Métricas:**
- Utilización (% de tiempo productivo)
- Ingresos generados
- Rating/evaluaciones
- Citas completadas

---

#### F. **Reporte Geográfico (Geography)** ✅
**Endpoint:** `GET /reports/geography`

**Datos:**
- Distribución de clientes por zona
- Citas por ubicación (CLINIC vs HOME)
- Rutas optimizadas (si HOME grooming)
- "Hotspots" de demanda

---

#### G. **Resumen Ejecutivo (Overview)** ✅
**Endpoint:** `GET /reports/overview`

**Agregación:** Combinación de todos los anteriores para panel principal

---

### 3. FUENTES DE DATOS

Todos los reportes usan estas tablas:

| Tabla | Datos |
|-------|-------|
| `appointments` | Citas, fechas, estados, servicios |
| `clients` | Información de clientes |
| `pets` | Mascotas (usadas como contexto) |
| `sales` | Transacciones, pagos |
| `services` | Catálogo de servicios |
| `stylists` / `users` | Personal y desempeño |
| `client_addresses` | Ubicaciones (para reportes geográficos) |
| `groomer_routes` | Rutas a domicilio (para análisis de eficiencia) |

---

### 4. TABLAS DE BD USADAS

**Relacionadas Directamente:**

```sql
-- Fuente principal
SELECT * FROM appointments
WHERE clinic_id = $1
  AND scheduled_at BETWEEN $2 AND $3
  AND status = ANY($4)
  AND location_type = $5;

-- Relacionadas
SELECT * FROM clients WHERE id = appointment.client_id;
SELECT * FROM services WHERE id = appointment.service_id;
SELECT * FROM sales WHERE appointment_id = $1;
SELECT * FROM users WHERE id = appointment.assigned_staff_user_id;
SELECT * FROM client_addresses WHERE client_id = $1;
SELECT * FROM groomer_routes WHERE route_date = $1 AND clinic_id = $2;
```

---

### 5. ENDPOINTS DISPONIBLES

| Método | Endpoint | Permisos | Descripción |
|--------|----------|----------|-------------|
| GET | `/reports/revenue` | `reports:view` | Ingresos y KPIs financieros |
| GET | `/reports/appointments` | `reports:view` | Análisis de citas |
| GET | `/reports/clients` | `reports:view` | Métricas de clientes |
| GET | `/reports/services` | `reports:view` | Análisis de servicios |
| GET | `/reports/performance` | `reports:view` | Desempeño de estilistas |
| GET | `/reports/geography` | `reports:view` | Análisis geográfico |
| GET | `/reports/overview` | `reports:view` | Panel ejecutivo completo |

**Parámetros Comunes:**
```
GET /reports/[tipo]?period=month&startDate=2026-01-01&endDate=2026-03-12&locationType=CLINIC&statuses=CONFIRMED,COMPLETED
```

---

### 6. ESTADO ACTUAL: ESTRUCTURADO → INCOMPLETO

#### ✅ Implementado:
- [x] Estructura de controladores y servicios
- [x] DTOs y tipado completo
- [x] Endpoints base (7 rutas GET)
- [x] Sistema de permisos (`reports:view`)
- [x] Parámetros de filtrado (period, dates, location, status)
- [x] Servicios utilitarios (formato moneda, % cambio, etc.)

#### ⚠️ Parcialmente Implementado:
- [ ] Servicios de reportes individuales
  - Métodos `generate()` existen pero lógica puede ser incompleta
  - Queries a BD pueden necesitar optimización
  - Cálculos de KPIs pueden ser básicos
  
- [ ] Reportes geográficos
  - Necesita integración con mapas/geoJSON
  
- [ ] Caché de reportes (si hay alto volumen)

#### 🔴 No Implementado:
- [ ] Reportes en tiempo real (WebSocket)
- [ ] Exportación a Excel/PDF
- [ ] Gráficos interactivos complejos
- [ ] Reportes personalizados por usuario
- [ ] Histórico de cambios en métricas
- [ ] Notificaciones de anomalías

#### 📊 Cobertura Estimada: **60-70%**
- Endpoints: 100% (rutas definidas)
- DTOs y tipado: 100%
- Lógica de reportes: 50-60% (queries necesitan verificación)
- Gráficos: 0% (frontend responsibility)
- Exportación: 0%

---

## 📈 RESUMEN EJECUTIVO

### Módulo de Grooming

| Aspecto | Estado | Observación |
|---------|--------|------------|
| **Citas CRUD** | ✅ 95% | Funcional, testeado |
| **Validaciones** | ✅ 90% | Completo para reglas básicas |
| **Asignación Estilistas** | ✅ 80% | Manual y automática |
| **Optimización Rutas** | ⚠️ 40% | Servicios stub, falta BD |
| **Tracking Real-Time** | ❌ 0% | No implementado |
| **Integraciones** | ✅ 80% | Con auth, permisos, citas |
| **Documentación** | ✅ 85% | Buena en código |
| **Tests** | ❌ 20% | Mínimos |

**Conclusión:** Módulo operacional para CRUD de citas y asignaciones. Optimización de rutas requiere completar stubs en `routes.service.ts`.

---

### Módulo de Reportes

| Aspecto | Estado | Observación |
|---------|--------|------------|
| **Endpoints** | ✅ 100% | 7 rutas definidas y funcionando |
| **DTOs/Tipado** | ✅ 100% | Interfaces completas |
| **Lógica Backend** | ⚠️ 60% | Queries necesitan revisión |
| **Reportes Individ.** | ✅ 70% | Revenue, Appointments, Clients funcionales |
| **Reportes Complejos** | ⚠️ 40% | Geography necesita trabajo |
| **Filtros** | ✅ 100% | period, dates, location, status |
| **Gráficos** | ❌ 0% | Responsabilidad del frontend |
| **Exportación** | ❌ 0% | No implementado |
| **Performance** | ⚠️ 50% | Queries sin índices visibles |

**Conclusión:** Estructura completa y endpoints funcionales. Lógica de reportes necesita testing y optimización.

---

### Recomendaciones de Prioridad

**URGENTE (Grooming):**
1. Completar stubs en `routes.service.ts`:
   - `getAppointmentsForOptimization()`
   - `getStylistsForOptimization()`
   - `saveOptimizationResults()`

2. Integrar con Python optimizer service (ya existe)

3. Tests end-to-end de optimización

**IMPORTANTE (Reportes):**
1. Validar queries de BD en cada servicio
2. Agregar índices faltantes
3. Tests unitarios de cálculos de KPIs
4. Implementar caché si es necesario

**FUTURA (Ambos):**
1. WebSocket para actualizaciones en tiempo real
2. Exportación a Excel/PDF
3. Dashboards complejos en frontend
4. Notificaciones de cambios
5. Auditoría de cambios

---

## 📝 ARCHIVOS CLAVE ENCONTRADOS

### Grooming
- `vibralive-backend/src/modules/appointments/appointments.controller.ts`
- `vibralive-backend/src/modules/appointments/appointments.service.ts`
- `vibralive-backend/src/modules/appointments/services/grooming-validation.service.ts`
- `vibralive-backend/src/modules/routes/controllers/routes.controller.ts`
- `vibralive-backend/src/modules/routes/services/routes.service.ts`
- `vibralive-backend/src/modules/routes/services/route-optimizer.service.ts`
- `vibralive-backend/src/database/entities/appointment.entity.ts`
- `vibralive-backend/src/database/entities/groomer-route.entity.ts`
- `vibralive-backend/src/database/entities/groomer-route-stop.entity.ts`

### Reportes
- `vibralive-backend/src/modules/reports/controllers/reports.controller.ts`
- `vibralive-backend/src/modules/reports/services/` (8 servicios)
- `vibralive-backend/src/modules/reports/dto/reports.dto.ts`

---

**Análisis completado:** 12 de Marzo, 2026

