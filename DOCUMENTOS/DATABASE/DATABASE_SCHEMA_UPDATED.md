# 📊 Database Schema - VibraLive SaaS

**Fecha de Actualización:** Marzo 10, 2026  
**Estado:** ✅ Schema actualizado con `appointmentType` field

---

## 📋 Tabla de Contenidos

1. [Overview](#overview)
2. [Entidades Principales](#entidades-principales)
3. [Entidades de Pricing](#entidades-de-pricing)
4. [Entidades de Soporte](#entidades-de-soporte)
5. [Relaciones](#relaciones)
6. [Índices](#índices)
7. [Cambios Recientes](#cambios-recientes)

---

## Overview

VibraLive utiliza **PostgreSQL** con TypeORM como ORM. El schema está organizado en los siguientes módulos:

- **Appointments**: Citas (grooming y clínica)
- **Services & Packages**: Servicios y paquetes de grooming
- **Pricing**: Listas de precios, precios de servicios
- **Clients**: Clientes y mascotas
- **Clinics**: Información de clínicas
- **Users**: Usuarios y roles

---

## 📌 Entidades Principales

### 1. **appointments** (Citas)

| Campo | Tipo | Nullable | Default | Descripción |
|-------|------|----------|---------|-------------|
| `id` | UUID | ❌ | - | Primary Key |
| `clinic_id` | UUID | ❌ | - | FK → clinics |
| `pet_id` | UUID | ❌ | - | FK → pets |
| `client_id` | UUID | ❌ | - | FK → clients |
| `scheduled_at` | timestamp tz | ❌ | - | Hora programada (UTC) |
| `status` | VARCHAR(50) | ❌ | 'SCHEDULED' | SCHEDULED, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW, UNATTENDED |
| `reason` | TEXT | ✅ | NULL | Motivo de la cita |
| `duration_minutes` | INTEGER | ✅ | NULL | Duración en minutos |
| `notes` | TEXT | ✅ | NULL | Notas internas |
| `location_type` | ENUM | ❌ | 'CLINIC' | **CLINIC** o **HOME** |
| `appointment_type` | ENUM | ❌ | 'CLINIC' | **🆕 GROOMING** o **CLINIC** |
| `address_id` | UUID | ✅ | NULL | FK → client_addresses (obligatorio si HOME) |
| `assigned_staff_user_id` | UUID | ✅ | NULL | FK → users (estilista asignado) |
| `total_amount` | NUMERIC(12,2) | ✅ | NULL | Monto total congelado |
| `price_lock_at` | timestamp tz | ✅ | NULL | Cuándo se congelaron los precios |
| `price_list_id` | UUID | ✅ | NULL | FK → price_lists (qué lista se usó) |
| `group_id` | UUID | ✅ | NULL | FK → appointment_groups (para batch) |
| `cancelled_at` | timestamp tz | ✅ | NULL | Cuándo se canceló |
| `cancellation_reason` | VARCHAR(500) | ✅ | NULL | Por qué se canceló |
| `created_at` | timestamp tz | ❌ | NOW() | Timestamp creación |
| `updated_at` | timestamp tz | ❌ | NOW() | Timestamp última actualización |

**Índices:**
```sql
CREATE INDEX idx_appointments_clinic_status ON appointments(clinic_id, status);
CREATE INDEX idx_appointments_clinic_scheduled ON appointments(clinic_id, scheduled_at);
CREATE INDEX idx_appointments_clinic_created ON appointments(clinic_id, created_at);
```

---

### 2. **appointment_items** (Ítems de Citas - Servicios/Paquetes)

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| `id` | UUID | ❌ | Primary Key |
| `clinic_id` | UUID | ❌ | FK → clinics (desnormalizado para queries rápidas) |
| `appointment_id` | UUID | ❌ | FK → appointments |
| `service_id` | UUID | ✅ | FK → services (NULL si es paquete) |
| `package_id` | UUID | ✅ | FK → service_packages (NULL si es servicio) |
| `price_at_booking` | NUMERIC(10,2) | ❌ | Precio congelado en momento de booking |
| `quantity` | INTEGER | ❌ | 1 | Cantidad (ej: 2 if dual service) |
| `subtotal` | NUMERIC(12,2) | ❌ | price_at_booking × quantity |
| `created_at` | timestamp tz | ❌ | Timestamp creación |

**Índices:**
```sql
CREATE INDEX idx_appointment_items_clinic_apt ON appointment_items(clinic_id, appointment_id);
CREATE INDEX idx_appointment_items_apt ON appointment_items(appointment_id);
CREATE INDEX idx_appointment_items_service ON appointment_items(service_id);
CREATE INDEX idx_appointment_items_package ON appointment_items(package_id);
```

---

### 3. **appointment_groups** (Grupos de Citas - Batch)

Para cuando se crean múltiples citas en el mismo slot (ej: 3 mascotas en 1 hora).

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| `id` | UUID | ❌ | Primary Key |
| `clinic_id` | UUID | ❌ | FK → clinics |
| `client_id` | UUID | ❌ | FK → clients (cliente común) |
| `scheduled_at` | timestamp tz | ❌ | Hora común |
| `location_type` | ENUM | ❌ | CLINIC o HOME |
| `address_id` | UUID | ✅ | FK → client_addresses (si HOME) |
| `notes` | TEXT | ✅ | Notas del grupo |
| `created_at` | timestamp tz | ❌ | Timestamp |
| `updated_at` | timestamp tz | ❌ | Timestamp |

---

### 4. **services** (Servicios de Grooming)

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| `id` | UUID | ❌ | Primary Key |
| `clinic_id` | UUID | ❌ | FK → clinics |
| `name` | VARCHAR | ❌ | Ej: "Baño", "Corte" |
| `description` | TEXT | ✅ | Descripción detallada |
| `category` | ENUM | ❌ | MEDICAL o GROOMING |
| `default_duration_minutes` | INTEGER | ❌ | 30 | Duración default |
| `price` | NUMERIC(10,2) | ✅ | Precio global (fallback) |
| `is_active` | BOOLEAN | ❌ | true | Activo/Inactivo |
| `created_at` | timestamp tz | ❌ | - |
| `updated_at` | timestamp tz | ❌ | - |

---

### 5. **service_packages** (Paquetes de Grooming)

Agrupa múltiples servicios (ej: "Paquete Premium" = Baño + Corte + Secado)

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| `id` | UUID | ❌ | Primary Key |
| `clinic_id` | UUID | ❌ | FK → clinics |
| `name` | VARCHAR | ❌ | Ej: "Paquete Premium" |
| `description` | TEXT | ✅ | Qué incluye |
| `is_active` | BOOLEAN | ❌ | true | Activo/Inactivo |
| `created_at` | timestamp tz | ❌ | - |
| `updated_at` | timestamp tz | ❌ | - |

---

### 6. **service_package_items** (Items de Paquetes)

Relación: Qué servicios incluye cada paquete

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| `id` | UUID | ❌ | PK |
| `clinic_id` | UUID | ❌ | FK → clinics |
| `package_id` | UUID | ❌ | FK → service_packages |
| `service_id` | UUID | ❌ | FK → services |
| `order` | INTEGER | ❌ | 1 | Orden de visualización |
| `created_at` | timestamp tz | ❌ | - |

---

## 💳 Entidades de Pricing

### 7. **price_lists** (Listas de Precios)

Cada clínica puede tener múltiples listas de precios (default, VIP, corporativo, etc.)

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| `id` | UUID | ❌ | Primary Key |
| `clinic_id` | UUID | ❌ | FK → clinics |
| `name` | VARCHAR | ❌ | Ej: "Precios Estándar", "VIP" |
| `description` | TEXT | ✅ | - |
| `is_default` | BOOLEAN | ❌ | true | Usada por defecto |
| `is_active` | BOOLEAN | ❌ | true | Activa/Inactiva |
| `created_at` | timestamp tz | ❌ | - |
| `updated_at` | timestamp tz | ❌ | - |

**Índice:** `(clinic_id, is_default)`

---

### 8. **service_prices** (Precios de Servicios)

Qué cuesta cada servicio en cada lista de precios y por tamaño de mascota.

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| `id` | UUID | ❌ | Primary Key |
| `clinic_id` | UUID | ❌ | FK → clinics |
| `price_list_id` | UUID | ❌ | FK → price_lists |
| `service_id` | UUID | ❌ | FK → services |
| `size` | VARCHAR(10) | ✅ | S, M, L, XL (mascota pequeña/mediana/grande) |
| `price` | NUMERIC(10,2) | ❌ | Precio final |
| `currency` | VARCHAR | ❌ | MXN | Moneda |
| `is_available` | BOOLEAN | ❌ | true | Disponible |
| `created_at` | timestamp tz | ❌ | - |
| `updated_at` | timestamp tz | ❌ | - |

**Índice:** `(clinic_id, price_list_id, service_id, size)` UNIQUE

---

### 9. **service_package_prices** (Precios de Paquetes)

Qué cuesta cada paquete en cada lista de precios (por tamaño de mascota).

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| `id` | UUID | ❌ | Primary Key |
| `clinic_id` | UUID | ❌ | FK → clinics |
| `price_list_id` | UUID | ❌ | FK → price_lists |
| `package_id` | UUID | ❌ | FK → service_packages |
| `size` | VARCHAR(10) | ✅ | S, M, L, XL |
| `price` | NUMERIC(10,2) | ❌ | Precio de paquete |
| `currency` | VARCHAR | ❌ | MXN | Moneda |
| `is_available` | BOOLEAN | ❌ | true | Disponible |
| `created_at` | timestamp tz | ❌ | - |
| `updated_at` | timestamp tz | ❌ | - |

**Índice:** `(clinic_id, price_list_id, package_id, size)` UNIQUE

---

## 🐕 Entidades de Clientes

### 10. **clients** (Clientes)

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| `id` | UUID | ❌ | Primary Key |
| `clinic_id` | UUID | ❌ | FK → clinics |
| `name` | VARCHAR | ❌ | Nombre del cliente |
| `phone` | VARCHAR(20) | ❌ | Teléfono (UNIQUE per clinic) |
| `email` | VARCHAR | ✅ | Email |
| `price_list_id` | UUID | ✅ | FK → price_lists (cliente VIP) |
| `whatsapp_number` | VARCHAR(20) | ✅ | WhatsApp |
| `phone_secondary` | VARCHAR(20) | ✅ | Teléfono secundario |
| `preferred_contact_method` | VARCHAR(20) | ✅ | WHATSAPP, EMAIL, PHONE |
| `preferred_contact_time_start` | TIME | ✅ | Horario preferido de contacto |
| `preferred_contact_time_end` | TIME | ✅ | - |
| `housing_type` | VARCHAR(20) | ✅ | HOUSE, APARTMENT, CONDO |
| `access_notes` | TEXT | ✅ | Cómo acceder a la casa (gate codes, etc) |
| `service_notes` | TEXT | ✅ | Notas de servicio |
| `do_not_contact` | BOOLEAN | ❌ | false | No contactar |
| `do_not_contact_reason` | TEXT | ✅ | - |
| `status` | VARCHAR(20) | ❌ | ACTIVE | ACTIVE, INACTIVE, BLOCKED |
| `created_at` | timestamp tz | ❌ | - |
| `updated_at` | timestamp tz | ❌ | - |

---

### 11. **pets** (Mascotas)

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| `id` | UUID | ❌ | Primary Key |
| `clinic_id` | UUID | ❌ | FK → clinics |
| `client_id` | UUID | ❌ | FK → clients |
| `name` | VARCHAR | ❌ | Nombre de la mascota |
| `species` | VARCHAR(20) | ❌ | DOG, CAT |
| `breed` | VARCHAR | ✅ | Raza |
| `size` | VARCHAR(10) | ✅ | **S, M, L, XL** (usado para pricing) |
| `birthday` | DATE | ✅ | Fecha de nacimiento |
| `weight` | NUMERIC(5,2) | ✅ | Peso en kg |
| `coat_type` | VARCHAR(50) | ✅ | SHORT, LONG, CURLY, etc |
| `medical_notes` | TEXT | ✅ | Alergias, condiciones, etc |
| `behavior_notes` | TEXT | ✅ | Comportamiento (tímido, agresivo, etc) |
| `is_active` | BOOLEAN | ❌ | true | Activa/Inactiva |
| `created_at` | timestamp tz | ❌ | - |
| `updated_at` | timestamp tz | ❌ | - |

---

### 12. **client_addresses** (Direcciones de Clientes)

Para servicios a domicilio (HOME appointments).

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| `id` | UUID | ❌ | Primary Key |
| `clinic_id` | UUID | ❌ | FK → clinics |
| `client_id` | UUID | ❌ | FK → clients |
| `nickname` | VARCHAR | ✅ | "Casa", "Oficina", etc |
| `street` | VARCHAR | ❌ | Calle y número |
| `neighborhood` | VARCHAR | ✅ | Barrio |
| `postal_code` | VARCHAR | ✅ | CP |
| `latitude` | NUMERIC(10,7) | ✅ | Para mapas |
| `longitude` | NUMERIC(10,7) | ✅ | Para mapas |
| `access_notes` | TEXT | ✅ | Código de acceso, etc |
| `is_active` | BOOLEAN | ❌ | true | - |
| `created_at` | timestamp tz | ❌ | - |
| `updated_at` | timestamp tz | ❌ | - |

---

## 🏥 Entidades de Soporte

### 13. **clinics** (Clínicas)

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| `id` | UUID | ❌ | Primary Key |
| `name` | VARCHAR | ❌ | Nombre de clínica |
| `timezone` | VARCHAR | ❌ | America/Mexico_City | Zona horaria |
| `is_active` | BOOLEAN | ❌ | true | - |
| `created_at` | timestamp tz | ❌ | - |
| `updated_at` | timestamp tz | ❌ | - |

---

### 14. **users** (Usuarios/Stylists)

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| `id` | UUID | ❌ | Primary Key |
| `clinic_id` | UUID | ❌ | FK → clinics |
| `email` | VARCHAR | ❌ | Email único |
| `full_name` | VARCHAR | ❌ | Nombre completo |
| `phone` | VARCHAR | ✅ | Teléfono |
| `role` | VARCHAR(20) | ❌ | ADMIN, GROOMER, STAFF |
| `is_active` | BOOLEAN | ❌ | true | - |
| `created_at` | timestamp tz | ❌ | - |
| `updated_at` | timestamp tz | ❌ | - |

---

## 🔗 Relaciones Principales

```
┌─────────────────┐
│    CLINICS      │
└────────┬────────┘
         │
    ┌────┴────┬────────────┬──────────────┐
    │         │            │              │
┌───▼──┐  ┌──▼──┐  ┌─────▼──┐  ┌───────▼────┐
│USERS │  │PRICE │  │SERVICES│  │  CLIENTS   │
│      │  │LISTS │  │        │  │            │
└──────┘  └──┬───┘  └────┬───┘  └─────┬──────┘
             │          │              │
        ┌────▼──────────▼───┐      ┌───▼──────┐
        │SERVICE_PRICES    │      │   PETS   │
        │SERVICE_PKG_PRICES│      └───┬──────┘
        └───────────────────┘          │
                                   ┌───▼────────────────┐
                                   │ APPOINTMENTS      │
                                   │                   │
                                   │ ✨ appointmentType│
                                   │    (GROOMING)     │
                                   └────┬───────────────┘
                                        │
                                   ┌────▼──────────┐
                                   │APPOINTMENT    │
                                   │ITEMS          │
                                   │               │
                                   │ (Services or  │
                                   │  Packages)    │
                                   └───────────────┘
```

---

## 📊 Índices Principales

| Tabla | Índice | Propósito |
|-------|--------|-----------|
| appointments | (clinic_id, status) | Filtrar por estado |
| appointments | (clinic_id, scheduled_at) | Buscar por fecha |
| appointment_items | (appointment_id) | Obtener ítems |
| services | (clinic_id, is_active) | Servicios activos |
| service_prices | (clinic_id, price_list_id, service_id, size) | **UNIQUE** |
| service_package_prices | (clinic_id, price_list_id, package_id, size) | **UNIQUE** |
| price_lists | (clinic_id, is_default) | Encuentra default |
| clients | (clinic_id, phone) | **UNIQUE** |
| pets | (client_id) | Mascotas de cliente |

---

## ✨ Cambios Recientes

### 🆕 Nueva Columna: `appointmentType` (Marzo 10, 2026)

**Tabla:** `appointments`  
**Tipo:** ENUM  
**Valores:** `'GROOMING'` | `'CLINIC'`  
**Default:** `'CLINIC'`  
**Nullable:** NO

**Propósito:** Distinguir entre citas de grooming y citas clínicas en la BD.

```sql
ALTER TABLE appointments 
ADD COLUMN appointment_type VARCHAR(20) 
DEFAULT 'CLINIC' 
NOT NULL;

ALTER TABLE appointments 
ADD CONSTRAINT check_appointment_type 
CHECK (appointment_type IN ('GROOMING', 'CLINIC'));
```

**Migración:** `1740650000002-AddAppointmentTypeToAppointments.ts`  
**Estado:** ✅ Ejecutada exitosamente

---

### Flujos que Usan `appointmentType`

#### 1️⃣ Crear Cita Individual (CREATE mode)
```typescript
// Frontend
await pricingApi.createAppointmentWithPricing({
  appointmentType: 'GROOMING', // ← Hardcoded en UnifiedGroomingModal
  // ... otros campos
});

// Backend DTO
class CreateAppointmentWithPricingDto {
  @IsEnum(['GROOMING', 'CLINIC'])
  appointmentType!: 'GROOMING' | 'CLINIC';
}

// Backend Service
async createAppointmentWithFrozenPrices(
  appointmentData: {
    appointmentType: 'GROOMING' | 'CLINIC';
    // ...
  }
) {
  const appointment = appointmentRepository.create({
    appointmentType: appointmentData.appointmentType,
    // ...
  });
}
```

#### 2️⃣ Crear Citas en Batch (Múltiples mascotas)
```typescript
// Frontend
await appointmentsApi.createBatchAppointmentWithPricing({
  appointmentType: 'GROOMING',
  pets: [
    { petId: 'pet1', serviceIds: [...], quantities: [...] },
    { petId: 'pet2', serviceIds: [...], quantities: [...] },
  ],
  // ...
});

// Backend GroomingBatchService
for (const petDto of validPets) {
  await this.pricingService.createAppointmentWithFrozenPrices({
    appointmentType: dto.appointmentType, // ← Propaga el tipo
    // ...
  });
}
```

---

## 🔍 Queries Útiles

### Obtener todas las citas de grooming en marzo
```sql
SELECT * FROM appointments 
WHERE appointment_type = 'GROOMING' 
  AND scheduled_at BETWEEN '2026-03-01' AND '2026-03-31'
ORDER BY scheduled_at;
```

### Comparar ingresos: Grooming vs Clínica
```sql
SELECT 
  appointment_type,
  COUNT(*) as total_appointments,
  SUM(total_amount) as total_revenue,
  AVG(total_amount) as avg_appointment_value
FROM appointments
WHERE clinic_id = 'clinic-id-here'
GROUP BY appointment_type;
```

### Encontrar citas sin precio congelado
```sql
SELECT * FROM appointments 
WHERE price_lock_at IS NULL 
  OR total_amount IS NULL;
```

### Validar datos de paquetes
```sql
SELECT 
  sp.name,
  COUNT(spi.id) as total_services,
  SUM(sv.price) as theoretical_bundle_cost
FROM service_packages sp
LEFT JOIN service_package_items spi ON sp.id = spi.package_id
LEFT JOIN services sv ON spi.service_id = sv.id
GROUP BY sp.id, sp.name
ORDER BY sp.name;
```

---

## 🚀 Próximos Pasos

1. **Ejecutar Migración** (ya completada ✅)
   ```bash
   npm run typeorm -- migration:run
   ```

2. **Crear ENUM Type en PostgreSQL:**
   ```sql
   CREATE TYPE appointment_type_enum AS ENUM ('GROOMING', 'CLINIC');
   ```

3. **Validar Datos Existentes:**
   ```sql
   -- All existing appointments default to 'CLINIC'
   SELECT COUNT(*) FROM appointments WHERE appointment_type = 'CLINIC';
   ```

4. **Testing:**
   - Crear appointment individual con `appointmentType: 'GROOMING'`
   - Crear batch appointments con múltiples mascotas
   - Verificar que precios se congelan correctamente
   - Validar que appointmentType se persiste en BD

---

## 📝 Notas Adicionales

- **Timezone:** Todas las fechas se guardan en UTC (`timestamp with time zone`)
- **Precios:** Se congelan en momento del booking (`price_lock_at`) para auditoría
- **Conversión de Moneda:** Actualmente soporta MXN, puede extenderse
- **Batch Appointments:** Capacidad de crear múltiples citas en una transacción atómica
- **Pricing Fallback:** 7-nivel fallback chain (client-specific → clinic default → global)

---

**Formato:** PostgreSQL 13+  
**ORM:** TypeORM  
**Última Sincronización:** 2026-03-10
