# Tablas Relacionadas a Appointments

Este documento describe la estructura de la tabla `appointments` y todas las tablas que se relacionan con ella.

## 📋 Tabla Principal: appointments

### Descripción
Almacena las citas/consultas programadas en la clínica veterinaria.

### Columnas

| Columna | Tipo | Nullable | Descripción |
|---------|------|----------|-------------|
| `id` | UUID | ❌ | ID único de la cita (PK) |
| `clinic_id` | UUID | ❌ | ID de la clínica (FK) |
| `pet_id` | UUID | ❌ | ID de la mascota (FK) |
| `client_id` | UUID | ❌ | ID del cliente (FK) |
| `scheduled_at` | TIMESTAMP | ❌ | Fecha y hora programada |
| `status` | VARCHAR(50) | ❌ | Estado: SCHEDULED, CONFIRMED, CANCELLED, COMPLETED |
| `reason` | TEXT | ✅ | Motivo de la cita |
| `duration_minutes` | INTEGER | ✅ | Duración estimada en minutos |
| `veterinarian_id` | UUID | ✅ | ID del veterinario asignado |
| `notes` | TEXT | ✅ | Notas adicionales |
| `cancelled_at` | TIMESTAMP | ✅ | Fecha de cancelación |
| `cancelled_by` | UUID | ✅ | ID del usuario que canceló |
| `cancellation_reason` | VARCHAR(500) | ✅ | Motivo de cancelación |
| `location_type` | VARCHAR(20) | ❌ | Tipo de ubicación: CLINIC o HOME |
| `address_id` | UUID | ✅ | ID de dirección (FK, para HOME) |
| `assigned_staff_user_id` | UUID | ✅ | ID del personal asignado (FK) |
| `requires_route_planning` | BOOLEAN | ❌ | Si requiere planeación de ruta |
| `total_amount` | NUMERIC(12,2) | ✅ | Monto total de la cita |
| `price_lock_at` | TIMESTAMP | ✅ | Fecha de bloqueo de precio |
| `price_list_id` | UUID | ✅ | ID de lista de precios (FK) |
| `created_at` | TIMESTAMP | ❌ | Fecha de creación |
| `updated_at` | TIMESTAMP | ❌ | Fecha de actualización |

### Índices
```sql
CREATE INDEX idx_appointments_clinic_status ON appointments(clinic_id, status);
CREATE INDEX idx_appointments_clinic_scheduled ON appointments(clinic_id, scheduled_at);
CREATE INDEX idx_appointments_clinic_created ON appointments(clinic_id, created_at);
```

### Relaciones
- **Clinic** (1:N) - Cada cita pertenece a una clínica
- **Pet** (1:N) - Cada cita es para una mascota específica
- **Client** (1:N) - Cada cita es de un cliente específico
- **ClientAddress** (1:N, nullable) - La dirección donde se realiza la cita (si es HOME)
- **User** (1:N, nullable) - Personal asignado a la cita
- **PriceList** (1:N, nullable) - Lista de precios vigente al momento de la cita
- **AppointmentItem** (1:N) - Items/servicios de la cita

---

## 🏥 Tabla: clinics

### Descripción
Almacena información de las clínicas veterinarias.

### Relación con Appointments
- **Relación**: 1 Clínica → N Citas
- **Campo FK**: `clinic_id` en appointments referencia `id` en clinics
- **Comportamiento**: ON DELETE CASCADE

### Columnas Relevantes
| Columna | Descripción |
|---------|------------|
| `id` | ID único de la clínica |
| `name` | Nombre de la clínica |
| `email` | Email de la clínica |
| `phone` | Teléfono |
| `address` | Dirección |

---

## 🐾 Tabla: pets

### Descripción
Almacena información de las mascotas registradas.

### Relación con Appointments
- **Relación**: 1 Mascota → N Citas
- **Campo FK**: `pet_id` en appointments referencia `id` en pets
- **Comportamiento**: ON DELETE CASCADE

### Columnas Relevantes
| Columna | Descripción |
|---------|------------|
| `id` | ID único de la mascota |
| `clinic_id` | ID de la clínica |
| `client_id` | ID del dueño |
| `name` | Nombre de la mascota |
| `species` | Especie (Perro, Gato, etc.) |
| `breed` | Raza |
| `date_of_birth` | Fecha de nacimiento |

---

## 👤 Tabla: clients

### Descripción
Almacena información de los clientes (dueños de mascotas).

### Relación con Appointments
- **Relación**: 1 Cliente → N Citas
- **Campo FK**: `client_id` en appointments referencia `id` en clients
- **Comportamiento**: ON DELETE CASCADE

### Columnas Relevantes
| Columna | Descripción |
|---------|------------|
| `id` | ID único del cliente |
| `clinic_id` | ID de la clínica |
| `first_name` | Nombre |
| `last_name` | Apellido |
| `email` | Email |
| `phone` | Teléfono |
| `document_type` | Tipo de documento |
| `document_number` | Número de documento |

---

## 📍 Tabla: client_addresses

### Descripción
Almacena direcciones de domicilio de los clientes.

### Relación con Appointments
- **Relación**: 1 Dirección → N Citas (opcional)
- **Campo FK**: `address_id` en appointments referencia `id` en client_addresses
- **Comportamiento**: ON DELETE SET NULL (opcional)
- **Casos de uso**: Cuando `location_type` = 'HOME'

### Columnas Relevantes
| Columna | Descripción |
|---------|------------|
| `id` | ID único del domicilio |
| `clinic_id` | ID de la clínica |
| `client_id` | ID del cliente |
| `street` | Calle |
| `city` | Ciudad |
| `state` | Estado/Provincia |
| `zip_code` | Código postal |
| `latitude` | Latitud (para mapeo) |
| `longitude` | Longitud (para mapeo) |

---

## 👨‍⚕️ Tabla: users

### Descripción
Almacena información de usuarios (personal de la clínica).

### Relación con Appointments
- **Relación**: 1 Usuario → N Citas asignadas (opcional)
- **Campo FK**: `assigned_staff_user_id` en appointments referencia `id` en users
- **Comportamiento**: ON DELETE SET NULL (opcional)
- **Casos de uso**: Personal responsable de ejecutar la cita

### Columnas Relevantes
| Columna | Descripción |
|---------|------------|
| `id` | ID único del usuario |
| `clinic_id` | ID de la clínica |
| `email` | Email |
| `first_name` | Nombre |
| `last_name` | Apellido |
| `role` | Rol (VETERINARIAN, GROOMER, ASSISTANT, etc.) |

---

## 💰 Tabla: price_lists

### Descripción
Almacena listas de precios de servicios.

### Relación con Appointments
- **Relación**: 1 Lista de Precios → N Citas (opcional)
- **Campo FK**: `price_list_id` en appointments referencia `id` en price_lists
- **Comportamiento**: ON DELETE SET NULL (opcional)
- **Casos de uso**: Referencia a los precios vigentes al momento de agendar

### Columnas Relevantes
| Columna | Descripción |
|---------|------------|
| `id` | ID único de la lista |
| `clinic_id` | ID de la clínica |
| `name` | Nombre de la lista |
| `description` | Descripción |
| `is_default` | Si es la lista por defecto |
| `is_active` | Si está activa |

---

## 📋 Tabla: appointment_items

### Descripción
Almacena los servicios y/o paquetes incluidos en cada cita.

### Relación con Appointments
- **Relación**: 1 Cita → N Items
- **Campo FK**: `appointment_id` en appointment_items referencia `id` en appointments
- **Comportamiento**: ON DELETE CASCADE

### Columnas

| Columna | Tipo | Nullable | Descripción |
|---------|------|----------|-------------|
| `id` | UUID | ❌ | ID único del item |
| `clinic_id` | UUID | ❌ | ID de la clínica |
| `appointment_id` | UUID | ❌ | ID de la cita (FK) |
| `service_id` | UUID | ✅ | ID del servicio (FK, nullable) |
| `package_id` | UUID | ✅ | ID del paquete (FK, nullable) |
| `price_at_booking` | NUMERIC(10,2) | ❌ | Precio al momento de la cita |
| `quantity` | INTEGER | ❌ | Cantidad |
| `subtotal` | NUMERIC(12,2) | ✅ | Subtotal (precio × cantidad) |
| `created_at` | TIMESTAMP | ❌ | Fecha de creación |

### Relaciones
- **Clinic** (1:N) - Clínica donde se registra el item
- **Appointment** (1:N) - Cita a la que pertenece el item
- **Service** (1:N, nullable) - Servicio incluido
- **ServicePackage** (1:N, nullable) - Paquete incluido

---

## 🔧 Tabla: services

### Descripción
Almacena el catálogo de servicios disponibles.

### Relación con Appointments (indirecta)
- A través de **AppointmentItem**
- Campo FK en appointment_items: `service_id` → `id` en services
- Comportamiento: Restricción normal

### Columnas Relevantes
| Columna | Descripción |
|---------|------------|
| `id` | ID único del servicio |
| `clinic_id` | ID de la clínica |
| `name` | Nombre del servicio |
| `category` | Categoría (GROOMING, MEDICAL, etc.) |
| `description` | Descripción |

---

## 📦 Tabla: service_packages

### Descripción
Almacena paquetes de servicios (múltiples servicios agrupados).

### Relación con Appointments (indirecta)
- A través de **AppointmentItem**
- Campo FK en appointment_items: `package_id` → `id` en service_packages
- Comportamiento: Restricción normal

### Columnas Relevantes
| Columna | Descripción |
|---------|------------|
| `id` | ID único del paquete |
| `clinic_id` | ID de la clínica |
| `name` | Nombre del paquete |
| `description` | Descripción |
| `total_price` | Precio total del paquete |
| `currency` | Moneda |
| `is_active` | Si está disponible |

---

## 📊 Diagrama de Relaciones

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                    APPOINTMENTS (Central)                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
           │                    │                │                │
           ▼                    ▼                ▼                ▼
        CLINICS              PETS            CLIENTS        CLIENT_ADDRESSES
           │                    │                │                │
           │                    │                │                │
           └──────────────────────────────────────┴────────────────┘
                                │
                      ┌─────────┴────────┐
                      ▼                  ▼
                   USERS          PRICE_LISTS
                   (assigned)     (at booking)
                      │                  │
                      └──────┬───────────┘
                             │
                    ┌────────▼────────┐
                    │ APPOINTMENT_    │
                    │ ITEMS           │
                    └────────┬────────┘
                             │
                      ┌──────┴──────┐
                      ▼             ▼
                  SERVICES    SERVICE_PACKAGES
```

---

## 🔍 Consultas Útiles

### Obtener todas las citas de un cliente con sus detalles
```sql
SELECT 
  a.id,
  a.scheduled_at,
  a.status,
  c.first_name,
  c.last_name,
  p.name as pet_name,
  cl.name as clinic_name,
  a.total_amount
FROM appointments a
JOIN clients c ON a.client_id = c.id
JOIN pets p ON a.pet_id = p.id
JOIN clinics cl ON a.clinic_id = cl.id
WHERE c.id = 'client_uuid'
ORDER BY a.scheduled_at DESC;
```

### Obtener items (servicios/paquetes) de una cita
```sql
SELECT 
  ai.id,
  COALESCE(s.name, sp.name) as item_name,
  ai.price_at_booking,
  ai.quantity,
  ai.subtotal
FROM appointment_items ai
LEFT JOIN services s ON ai.service_id = s.id
LEFT JOIN service_packages sp ON ai.package_id = sp.id
WHERE ai.appointment_id = 'appointment_uuid';
```

### Obtener citas por estado en una clínica
```sql
SELECT 
  status,
  COUNT(*) as total
FROM appointments
WHERE clinic_id = 'clinic_uuid'
  AND scheduled_at >= NOW() - INTERVAL '30 days'
GROUP BY status;
```

---

## 📝 Notas Importantes

1. **Eliminación en cascada**: Si se elimina una clínica, se eliminan todas sus citas y items de cita
2. **Precios reservados**: El campo `price_lock_at` indica cuándo se congelaron los precios (para auditoría)
3. **Dirección flexible**: Las citas pueden ser en clínica o en domicilio del cliente
4. **Asignación de personal**: Opcional, permite rastrear quién ejecutó cada cita
5. **Items de cita**: Pueden contener servicios individuales O paquetes, nunca ambos en el mismo item

