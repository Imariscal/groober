# 🏥 Módulo de Veterinarios - Referencia de API

## 📋 Resumen Ejecutivo

Se ha implementado un módulo completo de **Veterinarios** homologado al módulo de Estilistas, incluyendo:
- ✅ 4 entidades TypeORM (Veterinarian, VeterinarianAvailability, VeterinarianUnavailablePeriod, VeterinarianCapacity)
- ✅ DTOs con validación completa
- ✅ Servicio con lógica de negocio
- ✅ Controlador REST con 18 endpoints
- ✅ Módulo NestJS completamente integrado
- ✅ Permisos RBAC (role-based access control)

---

## 🗂️ Estructura del Módulo

```
src/modules/veterinarians/
├── veterinarians.controller.ts       # 18 endpoints REST
├── veterinarians.service.ts          # Lógica de negocio
├── veterinarians.dto.ts              # DTOs con validación
├── veterinarians.module.ts           # Configuración NestJS
└── src/database/entities/
    ├── veterinarian.entity.ts                    # Entidad principal
    ├── veterinarian-availability.entity.ts       # Horarios por día
    ├── veterinarian-unavailable-period.entity.ts # Períodos no disponibles
    └── veterinarian-capacity.entity.ts           # Capacidad diaria
```

---

## 🔧 Campos de la Entidad Veterinarian

| Campo | Tipo | Requerido | Descripción |
|-------|------|----------|-------------|
| `id` | UUID | ✅ | Identificador único |
| `clinicId` | UUID | ✅ | Clínica propietaria |
| `userId` | UUID | ✅ | Usuario asociado (relación 1:1) |
| `displayName` | VARCHAR(100) | ❌ | Nombre para mostrar (ej: "Dr. David") |
| `specialty` | ENUM | ✅ | GENERAL, SURGERY, CARDIOLOGY, DERMATOLOGY, ORTHOPEDICS, OPHTHALMOLOGY, DENTISTRY, OTHER |
| `isBookable` | BOOLEAN | ✅ | Puede recibir citas (default: true) |
| `calendarColor` | VARCHAR(20) | ❌ | Color hexadecimal para calendario |
| `licenseNumber` | VARCHAR(100) | ❌ | Número de cédula profesional |
| `createdAt` | TIMESTAMP | ✅ | Fecha creación (automático) |
| `updatedAt` | TIMESTAMP | ✅ | Fecha actualización (automático) |

---

## 📡 Endpoints REST (18 Total)

### ✏️ Veterinarios Principales

#### 1. Crear Veterinario
```http
POST /clinics/:clinicId/veterinarians
Permission: veterinarians:create
Content-Type: application/json

{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "displayName": "Dr. David Martínez",
  "specialty": "SURGERY",
  "isBookable": true,
  "calendarColor": "#FF5733",
  "licenseNumber": "VET-2024-001"
}
```

#### 2. Listar Veterinarios
```http
GET /clinics/:clinicId/veterinarians
GET /clinics/:clinicId/veterinarians?bookableOnly=true
Permission: veterinarians:read
```

#### 3. Obtener Veterinario Específico
```http
GET /clinics/:clinicId/veterinarians/:veterinarianId
Permission: veterinarians:read
```

#### 4. Actualizar Veterinario
```http
PUT /clinics/:clinicId/veterinarians/:veterinarianId
Permission: veterinarians:update
Content-Type: application/json

{
  "displayName": "Dr. David M.",
  "specialty": "CARDIOLOGY",
  "isBookable": false,
  "licenseNumber": "VET-2024-001-UPD"
}
```

#### 5. Eliminar Veterinario
```http
DELETE /clinics/:clinicId/veterinarians/:veterinarianId
Permission: veterinarians:delete
```

---

### 📅 Horarios de Disponibilidad (Availability)

#### 6. Crear Horario
```http
POST /clinics/:clinicId/veterinarians/:veterinarianId/availabilities
Permission: veterinarians:update
Content-Type: application/json

{
  "day_of_week": 0,        // 0=Monday, 6=Sunday
  "start_time": "09:00",   // HH:mm
  "end_time": "17:00",     // HH:mm
  "is_active": true
}
```

#### 7. Listar Horarios
```http
GET /clinics/:clinicId/veterinarians/:veterinarianId/availabilities
Permission: veterinarians:read
```

#### 8. Actualizar Horario
```http
PUT /clinics/:clinicId/veterinarians/:veterinarianId/availabilities/:availabilityId
Permission: veterinarians:update
Content-Type: application/json

{
  "start_time": "08:30",
  "end_time": "17:30",
  "is_active": true
}
```

#### 9. Eliminar Horario
```http
DELETE /clinics/:clinicId/veterinarians/:veterinarianId/availabilities/:availabilityId
Permission: veterinarians:update
```

---

### 🚫 Períodos No Disponibles (Unavailable Periods)

#### 10. Crear Período No Disponible
```http
POST /clinics/:clinicId/veterinarians/:veterinarianId/unavailable-periods
Permission: veterinarians:update
Content-Type: application/json

{
  "reason": "VACATION",           // VACATION, SICK_LEAVE, REST_DAY, PERSONAL, OTHER
  "start_date": "2024-06-15",     // YYYY-MM-DD
  "end_date": "2024-06-30",       // YYYY-MM-DD
  "is_all_day": true,
  "notes": "Vacaciones verano"
}
```

#### 11. Listar Períodos No Disponibles
```http
GET /clinics/:clinicId/veterinarians/:veterinarianId/unavailable-periods
Permission: veterinarians:read
```

#### 12. Actualizar Período
```http
PUT /clinics/:clinicId/veterinarians/:veterinarianId/unavailable-periods/:periodId
Permission: veterinarians:update
Content-Type: application/json

{
  "reason": "SICK_LEAVE",
  "end_date": "2024-06-28",
  "notes": "Actualizado"
}
```

#### 13. Eliminar Período
```http
DELETE /clinics/:clinicId/veterinarians/:veterinarianId/unavailable-periods/:periodId
Permission: veterinarians:update
```

---

### 📊 Capacidad Diaria (Capacity)

#### 14. Crear Capacidad
```http
POST /clinics/:clinicId/veterinarians/:veterinarianId/capacities
Permission: veterinarians:update
Content-Type: application/json

{
  "date": "2024-06-15",           // YYYY-MM-DD
  "max_appointments": 8,          // Máximo de citas ese día
  "notes": "Alta demanda prevista"
}
```

#### 15. Listar Capacidades
```http
GET /clinics/:clinicId/veterinarians/:veterinarianId/capacities
Permission: veterinarians:read
```

#### 16. Actualizar Capacidad
```http
PUT /clinics/:clinicId/veterinarians/:veterinarianId/capacities/:capacityId
Permission: veterinarians:update
Content-Type: application/json

{
  "max_appointments": 10,
  "notes": "Personal adicional contratado"
}
```

#### 17. Eliminar Capacidad
```http
DELETE /clinics/:clinicId/veterinarians/:veterinarianId/capacities/:capacityId
Permission: veterinarians:update
```

---

## 🔐 Permisos Requeridos

El módulo usa los siguientes permisos RBAC (debe crearlos en la BD):

| Permiso | Descripción |
|---------|-------------|
| `veterinarians:create` | Crear veterinarios |
| `veterinarians:read` | Ver veterinarios y sus horarios |
| `veterinarians:update` | Actualizar veterinarios y horarios |
| `veterinarians:delete` | Eliminar veterinarios |

---

## 📝 DTOs Principales

### Crear Veterinario
```typescript
class CreateVeterinarianDto {
  userId: string;                    // Required
  displayName?: string;              // Optional, max 100 chars
  specialty?: VeterinarianSpecialty; // Optional, default: GENERAL
  isBookable?: boolean;              // Optional, default: true
  calendarColor?: string;            // Optional, hex color
  licenseNumber?: string;            // Optional, max 100 chars
}
```

### Respuesta Veterinario
```typescript
class VeterinarianListResponseDto {
  id: string;
  userId: string;
  displayName: string | null;
  specialty: VeterinarianSpecialty;
  isBookable: boolean;
  calendarColor: string | null;
  licenseNumber: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    status: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 🗄️ Integraciones de Base de Datos

### Nuevas Tablas
```sql
-- Veterinarios principales
CREATE TABLE veterinarians (
  id UUID PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id),
  display_name VARCHAR(100),
  specialty VARCHAR(50) NOT NULL,
  is_bookable BOOLEAN DEFAULT true,
  calendar_color VARCHAR(20),
  license_number VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Horarios de disponibilidad
CREATE TABLE veterinarian_availabilities (
  id UUID PRIMARY KEY,
  veterinarian_id UUID NOT NULL REFERENCES veterinarians(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
  UNIQUE(veterinarian_id, day_of_week)
);

-- Períodos no disponibles
CREATE TABLE veterinarian_unavailable_periods (
  id UUID PRIMARY KEY,
  veterinarian_id UUID NOT NULL REFERENCES veterinarians(id) ON DELETE CASCADE,
  reason VARCHAR(50) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_all_day BOOLEAN DEFAULT true,
  start_time TIME,
  end_time TIME,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Capacidad diaria
CREATE TABLE veterinarian_capacities (
  id UUID PRIMARY KEY,
  veterinarian_id UUID NOT NULL REFERENCES veterinarians(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  max_appointments INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
  UNIQUE(veterinarian_id, date)
);
```

### Índices
```sql
CREATE INDEX idx_veterinarians_clinic ON veterinarians(clinic_id);
CREATE INDEX idx_veterinarians_user ON veterinarians(user_id);
CREATE INDEX idx_veterinarian_availability_vet ON veterinarian_availabilities(veterinarian_id);
CREATE INDEX idx_veterinarian_availability_dayofweek ON veterinarian_availabilities(veterinarian_id, day_of_week);
CREATE INDEX idx_veterinarian_unavailable_vet ON veterinarian_unavailable_periods(veterinarian_id);
CREATE INDEX idx_veterinarian_unavailable_dates ON veterinarian_unavailable_periods(veterinarian_id, start_date, end_date);
CREATE INDEX idx_veterinarian_capacity_vet ON veterinarian_capacities(veterinarian_id);
CREATE INDEX idx_veterinarian_capacity_date ON veterinarian_capacities(veterinarian_id, date);
```

---

## 🚀 Próximos Pasos

1. **Crear permisos en la BD** (veterinarians:create/read/update/delete)
2. **Generar migración TypeORM** para crear las tablas
3. **Crear servicio de disponibilidad** (VeterinarianAvailabilityService) - similar a StylistAvailabilityService
4. **Integrar con módulo de Appointments** para verificar disponibilidad
5. **Frontend**: Crear página de gestión de veterinarios (`/clinic/veterinarians`)

---

## 📦 Archivos Creados

```
✅ src/database/entities/veterinarian.entity.ts
✅ src/database/entities/veterinarian-availability.entity.ts
✅ src/database/entities/veterinarian-unavailable-period.entity.ts
✅ src/database/entities/veterinarian-capacity.entity.ts
✅ src/modules/veterinarians/veterinarians.dto.ts
✅ src/modules/veterinarians/veterinarians.service.ts
✅ src/modules/veterinarians/veterinarians.controller.ts
✅ src/modules/veterinarians/veterinarians.module.ts
✅ Updated: src/database/entities/index.ts
✅ Updated: src/app.module.ts
```

---

## ✅ Validación

- ✅ Comprobación de tipos TypeScript: **SIN ERRORES**
- ✅ DTOs con validación de entrada
- ✅ Guardias de autenticación y permisos
- ✅ Manejo de errores (NotFoundException, BadRequestException)
- ✅ Estructura consistente con módulo de Stylists
