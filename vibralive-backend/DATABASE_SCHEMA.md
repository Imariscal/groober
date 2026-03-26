# VibraLive Database Schema Documentation

**Última actualización:** Febrero 25, 2026

---

## 📋 Tabla de Contenidos

1. [Descripción General](#descripción-general)
2. [Entidades del Sistema](#entidades-del-sistema)
3. [Relaciones Entre Entidades](#relaciones-entre-entidades)
4. [Índices y Optimizaciones](#índices-y-optimizaciones)
5. [Constraints y Validaciones](#constraints-y-validaciones)
6. [Diagrama ER](#diagrama-er)

---

## 🎯 Descripción General

VibraLive utiliza **PostgreSQL** como base de datos relacional con **TypeORM** como ORM. La arquitectura está diseñada para soportar un sistema **multi-tenant** donde cada clínica veterinaria es un tenant independiente.

### Base de Datos Principal
- **Base de datos:** vibralive (PostgreSQL 14+)
- **ORM:** TypeORM con decoradores
- **Estrategia de Nombres:** snake_case en BD, camelCase en TypeScript
- **Tablas:** 12 entidades principales + tablas de relaciones

### Características Principales
- ✅ Multi-tenancy con isolación por clinic_id
- ✅ Auditoría de cambios (AuditLog)
- ✅ Soft deletes (deleted_at) donde aplica
- ✅ Timestamps automáticos (created_at, updated_at)
- ✅ UUID primarias para escalabilidad
- ✅ Índices optimizados para queries frecuentes

---

## 📊 Entidades del Sistema

### 1. **PLATFORM_USERS** - Usuarios de la Plataforma

Usuarios administrativos del sistema (Superadmin, Soporte, Finanzas).

#### Tabla: `platform_users`

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| `id` | UUID | ❌ | PK - ID único |
| `email` | VARCHAR(255) | ❌ | Email único para login |
| `full_name` | VARCHAR(255) | ❌ | Nombre completo |
| `password_hash` | VARCHAR(255) | ❌ | Hash SHA-256 de contraseña |
| `status` | VARCHAR(50) | ❌ | INVITED \| ACTIVE \| DEACTIVATED \| SUSPENDED |
| `impersonating_clinic_id` | UUID | ✅ | FK - Clínica siendo impersonada |
| `impersonating_user_id` | UUID | ✅ | FK - Usuario siendo impersonado |
| `created_at` | TIMESTAMP | ❌ | Fecha de creación (auto) |
| `updated_at` | TIMESTAMP | ❌ | Fecha de actualización (auto) |
| `last_login_at` | TIMESTAMP | ✅ | Último login |
| `deactivated_at` | TIMESTAMP | ✅ | Fecha de desactivación |
| `invitation_token` | UUID | ✅ | Token para invitación |
| `invitation_token_expires_at` | TIMESTAMP | ✅ | Expiración de token de invitación |
| `password_reset_token` | UUID | ✅ | Token para reset |
| `password_reset_token_expires_at` | TIMESTAMP | ✅ | Expiración de token reset |

**Índices:**
- `email` - Búsqueda rápida por email

**Relaciones:**
- `platform_roles` (M:M) - Roles asignados al usuario

---

### 2. **PLATFORM_ROLES** - Roles del Sistema

Roles administrativos del sistema (superadmin, soporte, finanzas).

#### Tabla: `platform_roles`

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| `id` | UUID | ❌ | PK - ID único |
| `key` | VARCHAR(50) | ❌ | Clave única (PLATFORM_SUPERADMIN, etc) |
| `name` | VARCHAR(100) | ❌ | Nombre legible |
| `description` | TEXT | ❌ | Descripción detallada |
| `permissions` | TEXT[] | ❌ | Array de permisos JSON |
| `is_active` | BOOLEAN | ❌ | ¿Está activo? |
| `is_immutable` | BOOLEAN | ❌ | ¿Protegido del sistema? |
| `created_at` | TIMESTAMP | ❌ | Fecha de creación (auto) |

**Relaciones:**
- `platform_users` (M:M) - Usuarios con este rol

---

### 3. **CLINICS** - Clínicas Veterinarias

Representa una clínica veterinaria (tenant) en el sistema.

#### Tabla: `clinics`

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| `id` | UUID | ❌ | PK - ID único |
| `name` | VARCHAR(255) | ❌ | Nombre de la clínica |
| `phone` | VARCHAR(20) | ❌ | Teléfono único |
| `city` | VARCHAR(100) | ✅ | Ciudad |
| `country` | VARCHAR(100) | ❌ | País (default: MX) |
| `whatsapp_account_id` | VARCHAR(100) | ✅ | ID de cuenta WhatsApp Business |
| `whatsapp_phone_id` | VARCHAR(100) | ✅ | ID de número WhatsApp |
| `subscription_plan` | VARCHAR(50) | ❌ | Plan comercial (starter, professional, enterprise) |
| `status` | VARCHAR(50) | ❌ | ACTIVE \| SUSPENDED \| DELETED |
| `suspended_at` | TIMESTAMP | ✅ | Cuándo fue suspendida |
| `suspended_by` | UUID | ✅ | Quién suspendió |
| `suspension_reason` | TEXT | ✅ | Motivo de la suspensión |
| `plan` | VARCHAR(50) | ❌ | Plan de precios |
| `max_staff_users` | INTEGER | ❌ | Máximo de usuarios staff (default: 100) |
| `max_clients` | INTEGER | ❌ | Máximo de clientes (default: 1000) |
| `max_pets` | INTEGER | ❌ | Máximo de mascotas (default: 5000) |
| `active_staff_count` | INTEGER | ❌ | Contador de staff activos (default: 0) |
| `active_clients_count` | INTEGER | ❌ | Contador de clientes activos (default: 0) |
| `active_pets_count` | INTEGER | ❌ | Contador de mascotas activas (default: 0) |
| `stats_updated_at` | TIMESTAMP | ✅ | Última actualización de stats |
| `created_at` | TIMESTAMP | ❌ | Fecha de creación (auto) |
| `updated_at` | TIMESTAMP | ❌ | Fecha de actualización (auto) |

**Constraints:**
- UNIQUE(`phone`) - Cada clínica tiene teléfono único
- STATUS CHECK - Solo valores permitidos

**Relaciones:**
- `clients` (1:M) - Clientes de la clínica
- `pets` (1:M) - Mascotas de la clínica
- `appointments` (1:M) - Citas de la clínica
- `users` (1:M) - Usuarios/staff de la clínica
- `animal_types` (1:M) - Tipos de animales de la clínica
- `reminders` (1:M) - Recordatorios de la clínica
- `message_logs` (1:M) - Logs de mensajes
- `whatsapp_outbox` (1:M) - Mensajes WhatsApp

---

### 4. **USERS** - Usuarios de Clínica

Usuarios locales de una clínica (owner, staff).

#### Tabla: `users`

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| `id` | UUID | ❌ | PK - ID único |
| `clinic_id` | UUID | ✅ | FK - Clínica a la que pertenece |
| `name` | VARCHAR(255) | ❌ | Nombre del usuario |
| `email` | VARCHAR(255) | ❌ | Email único |
| `phone` | VARCHAR(20) | ✅ | Teléfono optional |
| `hashed_password` | VARCHAR(255) | ❌ | Contraseña hasheada (bcrypt) |
| `role` | VARCHAR(50) | ❌ | superadmin \| owner \| staff (default: staff) |
| `status` | VARCHAR(50) | ❌ | INVITED \| ACTIVE \| DEACTIVATED (default: ACTIVE) |
| `last_login` | TIMESTAMP | ✅ | Fecha del último login |
| `deactivated_at` | TIMESTAMP | ✅ | Cuándo fue deactivado |
| `deactivated_by` | UUID | ✅ | Quién lo desactivó |
| `invitation_token` | UUID | ✅ | Token para aceptar invitación |
| `invitation_token_expires_at` | TIMESTAMP | ✅ | Expiración del token |
| `password_reset_token` | UUID | ✅ | Token para reset de contraseña |
| `password_reset_token_expires_at` | TIMESTAMP | ✅ | Expiración del token reset |
| `created_at` | TIMESTAMP | ❌ | Fecha de creación (auto) |
| `updated_at` | TIMESTAMP | ❌ | Fecha de actualización (auto) |

**Constraints:**
- UNIQUE(`email`) - Email único en el sistema

**Relaciones:**
- `clinic` (M:1) - Clínica a la que pertenece

---

### 5. **CLIENTS** - Clientes (Dueños de Mascotas)

Dueños de mascotas / clientes de la clínica.

#### Tabla: `clients`

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| `id` | UUID | ❌ | PK - ID único |
| `clinic_id` | UUID | ❌ | FK - Clínica del cliente |
| `name` | VARCHAR(255) | ❌ | Nombre completo |
| `phone` | VARCHAR(20) | ❌ | Teléfono |
| `email` | VARCHAR(255) | ✅ | Email (opcional) |
| `address` | VARCHAR(500) | ✅ | Domicilio |
| `notes` | TEXT | ✅ | Notas adicionales |
| `created_at` | TIMESTAMP | ❌ | Fecha de creación (auto) |
| `updated_at` | TIMESTAMP | ❌ | Fecha de actualización (auto) |

**Constraints:**
- UNIQUE(`clinic_id`, `phone`) - Teléfono único por clínica
- FK(`clinic_id`) → clinics(id) ON DELETE CASCADE

**Relaciones:**
- `clinic` (M:1) - La clínica
- `pets` (1:M) - Mascotas del cliente
- `appointments` (1:M) - Citas del cliente
- `reminders` (1:M) - Recordatorios del cliente
- `message_logs` (1:M) - Mensajes del cliente
- `whatsapp_outbox` (1:M) - Mensajes WhatsApp

---

### 6. **PETS** - Mascotas

Mascotas registradas en el sistema.

#### Tabla: `pets`

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| `id` | UUID | ❌ | PK - ID único |
| `clinic_id` | UUID | ❌ | FK - Clínica |
| `client_id` | UUID | ❌ | FK - Dueño |
| `name` | VARCHAR(255) | ❌ | Nombre de la mascota |
| `animal_type_id` | INTEGER | ❌ | FK - Tipo de animal |
| `breed` | VARCHAR(100) | ✅ | Raza |
| `birth_date` | DATE | ✅ | Fecha de nacimiento |
| `next_vaccine_date` | DATE | ✅ | Próxima vacuna |
| `next_deworming_date` | DATE | ✅ | Próximo desparasitante |
| `notes` | TEXT | ✅ | Notas |
| `created_at` | TIMESTAMP | ❌ | Fecha de creación (auto) |
| `updated_at` | TIMESTAMP | ❌ | Fecha de actualización (auto) |

**Constraints:**
- FK(`clinic_id`) → clinics(id) ON DELETE CASCADE
- FK(`client_id`) → clients(id) ON DELETE CASCADE
- FK(`animal_type_id`) → animal_types(id) ON DELETE RESTRICT

**Relaciones:**
- `clinic` (M:1) - Clínica
- `client` (M:1) - Dueño
- `animalType` (M:1) - Tipo de animal
- `appointments` (1:M) - Citas de la mascota
- `reminders` (1:M) - Recordatorios

---

### 7. **ANIMAL_TYPES** - Tipos de Animales

Catálogo de tipos de animales (Perro, Gato, Loro, etc).

#### Tabla: `animal_types`

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| `id` | INTEGER | ❌ | PK - ID autoincrementado |
| `clinic_id` | UUID | ❌ | FK - Clínica propietaria |
| `name` | VARCHAR(100) | ❌ | Nombre del tipo (Perro, Gato...) |
| `created_at` | TIMESTAMP | ❌ | Fecha de creación (auto) |
| `updated_at` | TIMESTAMP | ❌ | Fecha de actualización (auto) |

**Constraints:**
- UNIQUE(`clinic_id`, `name`) - Nombre único por clínica
- FK(`clinic_id`) → clinics(id) ON DELETE CASCADE

**Relaciones:**
- `clinic` (M:1) - Clínica

---

### 8. **APPOINTMENTS** - Citas Veterinarias

Citas/consultas programadas.

#### Tabla: `appointments`

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| `id` | UUID | ❌ | PK - ID único |
| `clinic_id` | UUID | ❌ | FK - Clínica |
| `pet_id` | UUID | ❌ | FK - Mascota |
| `client_id` | UUID | ❌ | FK - Dueño |
| `scheduled_at` | TIMESTAMP | ❌ | Cuándo está programada |
| `status` | VARCHAR(50) | ❌ | SCHEDULED \| CONFIRMED \| CANCELLED \| COMPLETED (default: SCHEDULED) |
| `reason` | TEXT | ✅ | Motivo de la cita |
| `duration_minutes` | INTEGER | ✅ | Duración estimada |
| `veterinarian_id` | UUID | ✅ | Veterinario asignado |
| `notes` | TEXT | ✅ | Notas de la cita |
| `cancelled_at` | TIMESTAMP | ✅ | Cuándo fue cancelada |
| `cancelled_by` | UUID | ✅ | Quién canceló |
| `cancellation_reason` | VARCHAR(500) | ✅ | Motivo de cancelación |
| `created_at` | TIMESTAMP | ❌ | Fecha de creación (auto) |
| `updated_at` | TIMESTAMP | ❌ | Fecha de actualización (auto) |

**Índices:**
- INDEX(`clinic_id`, `status`)
- INDEX(`clinic_id`, `scheduled_at`)
- INDEX(`clinic_id`, `created_at`)

**Constraints:**
- FK(`clinic_id`) → clinics(id) ON DELETE CASCADE
- FK(`pet_id`) → pets(id) ON DELETE CASCADE
- FK(`client_id`) → clients(id) ON DELETE CASCADE

**Relaciones:**
- `clinic` (M:1)
- `pet` (M:1)
- `client` (M:1)

---

### 9. **REMINDERS** - Recordatorios

Recordatorios automáticos para vacunas, desparasitantes, etc.

#### Tabla: `reminders`

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| `id` | UUID | ❌ | PK - ID único |
| `clinic_id` | UUID | ❌ | FK - Clínica |
| `pet_id` | UUID | ❌ | FK - Mascota |
| `client_id` | UUID | ❌ | FK - Cliente/Dueño |
| `reminder_type` | VARCHAR(50) | ❌ | vaccine \| deworming |
| `reminder_stage` | VARCHAR(50) | ❌ | day7 \| day1 \| followup24h |
| `scheduled_date` | DATE | ❌ | Fecha planeada |
| `status` | VARCHAR(50) | ❌ | pending \| sent \| confirmed \| cancelled \| failed (default: pending) |
| `message_id` | VARCHAR(255) | ✅ | wamid de Meta (WhatsApp) |
| `confirmed_at` | TIMESTAMP | ✅ | Cuándo fue confirmado |
| `failed_reason` | VARCHAR(500) | ✅ | Motivo de fallo |
| `attempt_count` | INTEGER | ❌ | Cantidad de intentos (default: 0) |
| `last_attempt_at` | TIMESTAMP | ✅ | Último intento |
| `created_at` | TIMESTAMP | ❌ | Fecha de creación (auto) |
| `updated_at` | TIMESTAMP | ❌ | Fecha de actualización (auto) |

**Índices:**
- INDEX(`clinic_id`, `status`)
- INDEX(`clinic_id`, `scheduled_date`, `status`) WHERE status IN ('pending', 'sent')
- INDEX(`pet_id`)
- INDEX(`client_id`)

**Constraints:**
- FK(`clinic_id`) → clinics(id) ON DELETE CASCADE
- FK(`pet_id`) → pets(id) ON DELETE CASCADE
- FK(`client_id`) → clients(id) ON DELETE CASCADE

**Relaciones:**
- `clinic` (M:1)
- `pet` (M:1)
- `client` (M:1)
- `message_logs` (1:M)

---

### 10. **MESSAGE_LOGS** - Logs de Mensajes

Registro de todos los mensajes enviados/recibidos (WhatsApp, SMS, etc).

#### Tabla: `message_logs`

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| `id` | UUID | ❌ | PK - ID único |
| `clinic_id` | UUID | ❌ | FK - Clínica |
| `reminder_id` | UUID | ✅ | FK - Recordatorio relacionado |
| `client_id` | UUID | ❌ | FK - Cliente que recibió/envió |
| `direction` | VARCHAR(20) | ❌ | outbound \| inbound |
| `message_type` | VARCHAR(50) | ❌ | reminder \| confirmation \| followup \| user_message |
| `phone_number` | VARCHAR(20) | ❌ | Teléfono |
| `message_body` | TEXT | ❌ | Contenido del mensaje |
| `whatsapp_message_id` | VARCHAR(255) | ✅ | wamid de Meta |
| `status` | VARCHAR(50) | ❌ | delivered \| read \| failed \| cancelled (default: delivered) |
| `error_code` | VARCHAR(50) | ✅ | Código de error si falló |
| `error_message` | VARCHAR(500) | ✅ | Descripción del error |
| `created_at` | TIMESTAMP | ❌ | Fecha de creación (auto) |

**Índices:**
- INDEX(`clinic_id`)
- INDEX(`reminder_id`)
- INDEX(`client_id`)
- INDEX(`direction`, `status`)
- INDEX(`whatsapp_message_id`)
- INDEX(`clinic_id`, `whatsapp_message_id`) WHERE direction = 'inbound'

**Constraints:**
- FK(`clinic_id`) → clinics(id) ON DELETE CASCADE
- FK(`client_id`) → clients(id) ON DELETE CASCADE
- FK(`reminder_id`) → reminders(id) ON DELETE SET NULL

**Relaciones:**
- `clinic` (M:1)
- `reminder` (M:1)
- `client` (M:1)

---

### 11. **WHATSAPP_OUTBOX** - Cola de Mensajes WhatsApp

Tabla de outbox para mensajes a enviar con reintentos automáticos.

#### Tabla: `whatsapp_outbox`

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| `id` | UUID | ❌ | PK - ID único |
| `clinic_id` | UUID | ❌ | FK - Clínica |
| `client_id` | UUID | ✅ | FK - Cliente (nullable) |
| `phone_number` | VARCHAR(20) | ❌ | Número destino |
| `message_body` | TEXT | ❌ | Contenido del mensaje |
| `status` | VARCHAR(50) | ❌ | queued \| sent \| failed \| delivered (default: queued) |
| `idempotency_key` | VARCHAR(255) | ✅ | Clave para idempotencia |
| `retry_count` | INTEGER | ❌ | Intentos realizados (default: 0) |
| `max_retries` | INTEGER | ❌ | Máximo de intentos (default: 5) |
| `last_retry_at` | TIMESTAMP | ✅ | Último intento |
| `provider_message_id` | VARCHAR(100) | ✅ | ID de Meta |
| `provider_error` | TEXT | ✅ | Error de Meta si ocurrió |
| `channel` | VARCHAR(50) | ❌ | whatsapp \| sms \| telegram (default: whatsapp) |
| `message_type` | VARCHAR(50) | ✅ | appointment_reminder \| confirmation \| custom |
| `sent_at` | TIMESTAMP | ✅ | Cuándo fue enviado |
| `created_at` | TIMESTAMP | ❌ | Fecha de creación (auto) |
| `updated_at` | TIMESTAMP | ❌ | Fecha de actualización (auto) |

**Índices:**
- INDEX(`clinic_id`, `status`)
- INDEX(`clinic_id`, `created_at`)
- UNIQUE INDEX(`idempotency_key`)
- INDEX(`retry_count`, `status`)

**Constraints:**
- FK(`clinic_id`) → clinics(id) ON DELETE CASCADE
- FK(`client_id`) → clients(id) ON DELETE SET NULL
- UNIQUE(`idempotency_key`)

**Relaciones:**
- `clinic` (M:1)
- `client` (M:1, nullable)

---

### 12. **AUDIT_LOGS** - Logs de Auditoría

Registro de todas las acciones administrativas en el sistema.

#### Tabla: `audit_logs`

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| `id` | UUID | ❌ | PK - ID único |
| `actor_id` | UUID | ❌ | FK - Usuario que realizó la acción |
| `action` | VARCHAR(50) | ❌ | CREATE \| READ \| UPDATE \| DELETE \| SUSPEND \| ACTIVATE \| INVITE \| RESET_PASSWORD \| IMPERSONATE \| IMPERSONATE_END |
| `resource_type` | VARCHAR(50) | ❌ | clinic \| platform_user \| clinic_user \| role |
| `resource_id` | UUID | ❌ | ID del recurso afectado |
| `clinic_id` | UUID | ✅ | FK - Clínica (contexto) |
| `changes` | JSONB | ✅ | Cambios: {before: {}, after: {}} |
| `created_at` | TIMESTAMP | ❌ | Fecha de creación (auto) |

**Índices:**
- INDEX(`actor_id`)
- INDEX(`resource_type`)
- INDEX(`action`)
- INDEX(`created_at`)
- INDEX(`clinic_id`)

**Constraints:**
- FK(`actor_id`) → platform_users(id) ON DELETE RESTRICT

**Relaciones:**
- `actor` (M:1) - Usuario que realizó la acción

---

## 🔗 Relaciones Entre Entidades

### Diagrama de Relaciones Simplificado

```
┌─────────────────────────────────────────────────────────────────┐
│                     PLATFORM (Global)                           │
├─────────────────────────────────────────────────────────────────┤
│  PlatformUsers ──M:M── PlatformRoles                            │
│  AuditLogs ──M:1── PlatformUsers (actor)                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │
┌─────────────────────────────────────────────────────────────────┐
│                    MULTI-TENANT (Por Clínica)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Clinic ──1:M── Users                                           │
│       ├──1:M── Clients                                          │
│       │        ├──1:M── Pets                                    │
│       │        │        ├──1:M── Appointments                   │
│       │        │        └──1:M── Reminders                      │
│       │        ├──1:M── Appointments                            │
│       │        ├──1:M── Reminders                               │
│       │        └──1:M── WhatsAppOutbox                          │
│       ├──1:M── AnimalTypes                                      │
│       ├──1:M── Appointments                                     │
│       ├──1:M── Reminders                                        │
│       ├──1:M── MessageLogs                                      │
│       └──1:M── WhatsAppOutbox                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Detalle de Relaciones

#### Relación: Clinic → Clients
- **Tipo:** One-to-Many (1:M)
- **Cardinality:** Una clínica tiene N clientes
- **Foreign Key:** `clients.clinic_id`
- **On Delete:** CASCADE - Eliminar clínica elimina sus clientes

#### Relación: Clinic → Pets
- **Tipo:** One-to-Many (1:M)
- **Cardinality:** Una clínica tiene N mascotas
- **Foreign Key:** `pets.clinic_id`
- **On Delete:** CASCADE

#### Relación: Clinic → Appointments
- **Tipo:** One-to-Many (1:M)
- **Cardinality:** Una clínica tiene N citas
- **Foreign Key:** `appointments.clinic_id`
- **On Delete:** CASCADE

#### Relación: Clinic → Users
- **Tipo:** One-to-Many (1:M)
- **Cardinality:** Una clínica tiene N usuarios
- **Foreign Key:** `users.clinic_id`
- **On Delete:** CASCADE

#### Relación: Clinic → Reminders
- **Tipo:** One-to-Many (1:M)
- **Cardinality:** Una clínica tiene N recordatorios
- **Foreign Key:** `reminders.clinic_id`
- **On Delete:** CASCADE

#### Relación: Clinic → MessageLogs
- **Tipo:** One-to-Many (1:M)
- **Cardinality:** Una clínica registra N mensajes
- **Foreign Key:** `message_logs.clinic_id`
- **On Delete:** CASCADE

#### Relación: Clinic → WhatsAppOutbox
- **Tipo:** One-to-Many (1:M)
- **Cardinality:** Una clínica envía N mensajes WhatsApp
- **Foreign Key:** `whatsapp_outbox.clinic_id`
- **On Delete:** CASCADE

#### Relación: Clinic → AnimalTypes
- **Tipo:** One-to-Many (1:M)
- **Cardinality:** Una clínica configura N tipos de animales
- **Foreign Key:** `animal_types.clinic_id`
- **On Delete:** CASCADE

#### Relación: Client → Pets
- **Tipo:** One-to-Many (1:M)
- **Cardinality:** Un cliente tiene N mascotas
- **Foreign Key:** `pets.client_id`
- **On Delete:** CASCADE

#### Relación: Client → Appointments
- **Tipo:** One-to-Many (1:M)
- **Cardinality:** Un cliente tiene N citas
- **Foreign Key:** `appointments.client_id`
- **On Delete:** CASCADE

#### Relación: Client → Reminders
- **Tipo:** One-to-Many (1:M)
- **Cardinality:** Un cliente recibe N recordatorios
- **Foreign Key:** `reminders.client_id`
- **On Delete:** CASCADE

#### Relación: Client → MessageLogs
- **Tipo:** One-to-Many (1:M)
- **Cardinality:** Un cliente genera N logs de mensajes
- **Foreign Key:** `message_logs.client_id`
- **On Delete:** CASCADE

#### Relación: Client → WhatsAppOutbox
- **Tipo:** One-to-Many (1:M)
- **Cardinality:** Un cliente recibe N mensajes WhatsApp
- **Foreign Key:** `whatsapp_outbox.client_id`
- **On Delete:** SET NULL (cliente puede borrarse, mensaje sigue)

#### Relación: Pet → Appointments
- **Tipo:** One-to-Many (1:M)
- **Cardinality:** Una mascota tiene N citas
- **Foreign Key:** `appointments.pet_id`
- **On Delete:** CASCADE

#### Relación: Pet → AnimalType
- **Tipo:** Many-to-One (M:1)
- **Cardinality:** N mascotas del mismo tipo
- **Foreign Key:** `pets.animal_type_id`
- **On Delete:** RESTRICT (no puedes eliminar tipo si hay mascotas)

#### Relación: Pet → Reminders
- **Tipo:** One-to-Many (1:M)
- **Cardinality:** Una mascota recibe N recordatorios
- **Foreign Key:** `reminders.pet_id`
- **On Delete:** CASCADE

#### Relación: Reminder → MessageLogs
- **Tipo:** One-to-Many (1:M)
- **Cardinality:** Un recordatorio genera N logs
- **Foreign Key:** `message_logs.reminder_id`
- **On Delete:** SET NULL

#### Relación: PlatformUser → PlatformRoles (M:M)
- **Tipo:** Many-to-Many (M:M)
- **Tabla Join:** `platform_user_roles`
- **Cardinality:** Un usuario tiene N roles, un rol tiene N usuarios

#### Relación: PlatformUser → AuditLogs
- **Tipo:** One-to-Many (1:M)
- **Cardinality:** Un admin realiza N auditorías
- **Foreign Key:** `audit_logs.actor_id`

---

## 🚀 Índices y Optimizaciones

### Índices por Tabla

#### appointments
```sql
-- Para queries frecuentes por clínica y estado
CREATE INDEX idx_appointments_clinic_status 
ON appointments(clinic_id, status);

-- Para queries por fecha
CREATE INDEX idx_appointments_clinic_scheduled_at 
ON appointments(clinic_id, scheduled_at);

-- Para cleanup de citas antiguas
CREATE INDEX idx_appointments_clinic_created_at 
ON appointments(clinic_id, created_at);
```

#### whatsapp_outbox
```sql
-- Para procesar mensajes pendientes
CREATE INDEX idx_whatsapp_clinic_status 
ON whatsapp_outbox(clinic_id, status);

-- Para reintentos por fecha
CREATE INDEX idx_whatsapp_clinic_created_at 
ON whatsapp_outbox(clinic_id, created_at);

-- Para idempotencia
CREATE UNIQUE INDEX idx_whatsapp_idempotency_key 
ON whatsapp_outbox(idempotency_key);

-- Para reintentos automáticos
CREATE INDEX idx_whatsapp_retry_status 
ON whatsapp_outbox(retry_count, status);
```

#### reminders
```sql
-- Para procesar recordatorios
CREATE INDEX idx_reminders_clinic_status 
ON reminders(clinic_id, status);

-- Para obtener recordatorios por fecha
CREATE INDEX idx_reminders_clinic_scheduled_date_status 
ON reminders(clinic_id, scheduled_date, status) 
WHERE status IN ('pending', 'sent');

-- Para buscar por mascota
CREATE INDEX idx_reminders_pet_id 
ON reminders(pet_id);

-- Para búsquedas por cliente
CREATE INDEX idx_reminders_client_id 
ON reminders(client_id);
```

#### message_logs
```sql
-- Para auditoría por clínica
CREATE INDEX idx_message_logs_clinic_id 
ON message_logs(clinic_id);

-- Para vincular con recordatorios
CREATE INDEX idx_message_logs_reminder_id 
ON message_logs(reminder_id);

-- Para auditoría de cliente
CREATE INDEX idx_message_logs_client_id 
ON message_logs(client_id);

-- Para búsquedas de estado
CREATE INDEX idx_message_logs_direction_status 
ON message_logs(direction, status);

-- Para tracking de Meta
CREATE INDEX idx_message_logs_whatsapp_message_id 
ON message_logs(whatsapp_message_id);

-- Para reportes de inbound
CREATE INDEX idx_message_logs_clinic_wamid_inbound 
ON message_logs(clinic_id, whatsapp_message_id) 
WHERE direction = 'inbound';
```

#### platform_users
```sql
-- Para login rápido
CREATE INDEX idx_platform_users_email 
ON platform_users(email);
```

#### audit_logs
```sql
-- Para auditoría de usuario
CREATE INDEX idx_audit_logs_actor_id 
ON audit_logs(actor_id);

-- Para búsquedas de acción
CREATE INDEX idx_audit_logs_resource_type 
ON audit_logs(resource_type);

-- Para reportes de acción
CREATE INDEX idx_audit_logs_action 
ON audit_logs(action);

-- Para auditoría timeline
CREATE INDEX idx_audit_logs_created_at 
ON audit_logs(created_at);

-- Para auditoría por clínica
CREATE INDEX idx_audit_logs_clinic_id 
ON audit_logs(clinic_id);
```

#### clients
```sql
-- Para validar unicidad
CREATE UNIQUE INDEX idx_clients_clinic_phone 
ON clients(clinic_id, phone);
```

#### animal_types
```sql
-- Para validar unicidad
CREATE UNIQUE INDEX idx_animal_types_clinic_name 
ON animal_types(clinic_id, name);
```

---

## ✅ Constraints y Validaciones

### Constraints por Tabla

#### PLATFORM_USERS
- **UNIQUE:** `email`
- **CHECK:** `status IN ('INVITED', 'ACTIVE', 'DEACTIVATED', 'SUSPENDED')`

#### CLINICS
- **UNIQUE:** `phone`
- **CHECK:** `status IN ('ACTIVE', 'SUSPENDED', 'DELETED')`
- **CHECK:** `plan IN ('STARTER', 'PROFESSIONAL', 'ENTERPRISE')`

#### USERS
- **UNIQUE:** `email`
- **FOREIGN KEY:** `clinic_id` → clinics(id)
- **CHECK:** `role IN ('superadmin', 'owner', 'staff')`
- **CHECK:** `status IN ('INVITED', 'ACTIVE', 'DEACTIVATED')`

#### CLIENTS
- **UNIQUE:** `(clinic_id, phone)` - Un cliente por teléfono en cada clínica
- **FOREIGN KEY:** `clinic_id` → clinics(id) [CASCADE]

#### PETS
- **FOREIGN KEY:** `clinic_id` → clinics(id) [CASCADE]
- **FOREIGN KEY:** `client_id` → clients(id) [CASCADE]
- **FOREIGN KEY:** `animal_type_id` → animal_types(id) [RESTRICT]

#### ANIMAL_TYPES
- **UNIQUE:** `(clinic_id, name)`
- **FOREIGN KEY:** `clinic_id` → clinics(id) [CASCADE]

#### APPOINTMENTS
- **FOREIGN KEY:** `clinic_id` → clinics(id) [CASCADE]
- **FOREIGN KEY:** `pet_id` → pets(id) [CASCADE]
- **FOREIGN KEY:** `client_id` → clients(id) [CASCADE]
- **CHECK:** `status IN ('SCHEDULED', 'CONFIRMED', 'CANCELLED', 'COMPLETED')`

#### REMINDERS
- **FOREIGN KEY:** `clinic_id` → clinics(id) [CASCADE]
- **FOREIGN KEY:** `pet_id` → pets(id) [CASCADE]
- **FOREIGN KEY:** `client_id` → clients(id) [CASCADE]
- **CHECK:** `reminder_type IN ('vaccine', 'deworming')`
- **CHECK:** `reminder_stage IN ('day7', 'day1', 'followup24h')`
- **CHECK:** `status IN ('pending', 'sent', 'confirmed', 'cancelled', 'failed')`

#### MESSAGE_LOGS
- **FOREIGN KEY:** `clinic_id` → clinics(id) [CASCADE]
- **FOREIGN KEY:** `reminder_id` → reminders(id) [SET NULL]
- **FOREIGN KEY:** `client_id` → clients(id) [CASCADE]
- **CHECK:** `direction IN ('outbound', 'inbound')`
- **CHECK:** `message_type IN ('reminder', 'confirmation', 'followup', 'user_message')`
- **CHECK:** `status IN ('delivered', 'read', 'failed', 'cancelled')`

#### WHATSAPP_OUTBOX
- **UNIQUE:** `idempotency_key`
- **FOREIGN KEY:** `clinic_id` → clinics(id) [CASCADE]
- **FOREIGN KEY:** `client_id` → clients(id) [SET NULL]
- **CHECK:** `status IN ('queued', 'sent', 'failed', 'delivered')`
- **CHECK:** `channel IN ('whatsapp', 'sms', 'telegram')`

#### AUDIT_LOGS
- **FOREIGN KEY:** `actor_id` → platform_users(id) [RESTRICT]
- **CHECK:** `action IN ('CREATE', 'READ', 'UPDATE', 'DELETE', 'SUSPEND', 'ACTIVATE', 'INVITE', 'RESET_PASSWORD', 'IMPERSONATE', 'IMPERSONATE_END')`
- **CHECK:** `resource_type IN ('clinic', 'platform_user', 'clinic_user', 'role')`

---

## 📈 Diagram ER (Entity Relationship)

```
                    SISTEMA GLOBAL
        ┌──────────────────────────────────┐
        │      PLATFORM_USERS              │
        ├──────────────────────────────────┤
        │ PK id (UUID)                     │
        │ email (UNIQUE)                   │
        │ full_name                        │
        │ password_hash                    │
        │ status (INVITED|ACTIVE|...)      │
        │ ... (invitation tokens, etc)     │
        └──────────────────────────────────┘
                      │
                      │ M:M
                      ▼
        ┌──────────────────────────────────┐
        │     PLATFORM_ROLES               │
        ├──────────────────────────────────┤
        │ PK id (UUID)                     │
        │ key (UNIQUE)                     │
        │ name                             │
        │ description                      │
        │ permissions (TEXT[])             │
        │ is_active                        │
        │ is_immutable                     │
        └──────────────────────────────────┘

        ┌──────────────────────────────────┐
        │      AUDIT_LOGS                  │
        ├──────────────────────────────────┤
        │ PK id (UUID)                     │
        │ FK actor_id → PLATFORM_USERS     │
        │ action                           │
        │ resource_type                    │
        │ resource_id (UUID)               │
        │ clinic_id (nullable)             │
        │ changes (JSONB)                  │
        │ created_at                       │
        └──────────────────────────────────┘


                  MULTI-TENANT (POR CLÍNICA)
        ┌──────────────────────────────────┐
        │         CLINICS                  │
        ├──────────────────────────────────┤
        │ PK id (UUID)                     │
        │ name                             │
        │ phone (UNIQUE)                   │
        │ city                             │
        │ country (MX)                     │
        │ whatsapp_account_id              │
        │ whatsapp_phone_id                │
        │ subscription_plan                │
        │ status (ACTIVE|SUSPENDED|DELETE) │
        │ plan (STARTER|PROF|ENTERPRISE)   │
        │ max_staff_users, max_clients...  │
        │ active_*_count (counters)        │
        │ created_at, updated_at           │
        └──────────────────────────────────┘
              │         │        │
         1:M  │    1:M  │   1:M  │
            │         │        │
    ┌────────────┐ ┌────────────┐ ┌────────────┐
    │   USERS    │ │  CLIENTS   │ │   PETS     │
    ├────────────┤ ├────────────┤ ├────────────┤
    │ PK id      │ │ PK id      │ │ PK id      │
    │ FK clinic  │ │ FK clinic  │ │ FK clinic  │
    │ name       │ │ name       │ │ name       │
    │ email ✓    │ │ phone ✓    │ │ FK client  │
    │ phone      │ │ email      │ │ animal_typ │
    │ hashed_pwd │ │ address    │ │ breed      │
    │ role       │ │ notes      │ │ birth_date │
    │ status     │ │ created_at │ │ vaccine_dt │
    │ ...tokens  │ │ updated_at │ │ deworming_ │
    └────────────┘ └────────────┘ │ notes      │
                            │      │ created_at │
                            │      │ updated_at │
              ┌─────────────┴──────┴────────────┤
              │ M:1                             │
              ▼                                 │ 1:M
    ┌──────────────────┐                       │
    │  ANIMAL_TYPES    │                       │
    ├──────────────────┤                       │
    │ PK id (INT)      │                       │
    │ FK clinic        │                       │
    │ name ✓ per clinic│                       │
    │ created_at       │                       │
    │ updated_at       │                       │
    └──────────────────┘                       │
                                              │
         ┌────────────────────────────────────┤
         │ 1:M                                │
         ▼                                    │
    ┌──────────────────┐              ┌─────────────────────┐
    │  APPOINTMENTS    │              │    REMINDERS        │
    ├──────────────────┤              ├─────────────────────┤
    │ PK id            │              │ PK id               │
    │ FK clinic        │              │ FK clinic           │
    │ FK pet           │◄─────┐       │ FK pet              │
    │ FK client        │      │ M:1   │ FK client           │
    │ scheduled_at     │      │       │ reminder_type       │
    │ status           │      │       │ reminder_stage      │
    │ reason           │      │       │ scheduled_date      │
    │ duration_minutes │      │       │ status              │
    │ vet_id           │      └───────┤ message_id (wamid)  │
    │ notes            │              │ confirmed_at        │
    │ cancelled_at     │              │ attempt_count       │
    │ cancelled_by     │              │ created_at          │
    │ created_at       │              │ updated_at          │
    │ updated_at       │              └─────────────────────┘
    └──────────────────┘                       │
                                             1:M
                                               │
                        ┌──────────────────────┴──────────────────┐
                        │                                        │
                 ┌──────────────────┐           ┌─────────────────────────┐
                 │  MESSAGE_LOGS    │           │  WHATSAPP_OUTBOX        │
                 ├──────────────────┤           ├─────────────────────────┤
                 │ PK id            │           │ PK id                   │
                 │ FK clinic        │           │ FK clinic               │
                 │ FK reminder      │           │ FK client (nullable)    │
                 │ FK client        │           │ phone_number            │
                 │ direction        │           │ message_body            │
                 │ message_type     │           │ status                  │
                 │ phone_number     │           │ idempotency_key ✓       │
                 │ message_body     │           │ retry_count             │
                 │ whatsapp_msg_id ✓           │ max_retries             │
                 │ status           │           │ last_retry_at           │
                 │ error_code       │           │ provider_message_id     │
                 │ error_message    │           │ provider_error          │
                 │ created_at       │           │ channel                 │
                 └──────────────────┘           │ message_type            │
                                               │ sent_at                 │
                                               │ created_at              │
                                               │ updated_at              │
                                               └─────────────────────────┘

Legend:
═══════
✓ = UNIQUE constraint
FK = Foreign Key
PK = Primary Key
M:1 = Many to One
1:M = One to Many
M:M = Many to Many
```

---

## 📝 Migraciones

### Archivos de Migración

#### 1708720800000-CreatePlatformTables.ts
- Crear tabla `platform_roles`
- Crear tabla `platform_users`
- Crear tabla `platform_user_roles` (join M:M)
- Crear tabla `audit_logs`
- Crear tabla `clinics`
- Crear tabla `users`
- Crear tabla `animal_types`

#### 1740466800000-CreateAppointmentAndWhatsApp.ts
- Crear tabla `clients`
- Crear tabla `pets`
- Crear tabla `appointments`
- Crear tabla `reminders`
- Crear tabla `message_logs`
- Crear tabla `whatsapp_outbox`

### Comando para Ejecutar Migraciones
```bash
npm run migration:run
npm run seed  # Para datos de prueba
```

---

## 🔐 Seguridad y Multi-Tenancy

### Principios de Multi-Tenancy

1. **Isolación por clinic_id**
   - Cada query en datos de clínica debe filtrar por `clinic_id`
   - Guards validan que el usuario_id pueda acceder a clinic_id
   - Nunca acceder a clinic_id del JWT sin validación

2. **Eliminación en Cascada (CASCADE)**
   - Eliminar clínica → elimina clientes, mascotas, citas, recordatorios
   - Preserva auditoría (audit_logs no se eliminan)

3. **Soft Deletes (donde aplica)**
   - Algunos recursos implementan `deleted_at` (creado durante seeding)
   - Queries deben verificar `deleted_at IS NULL`

4. **Tokens de Seguridad**
   - `invitation_token` - Para invitar usuarios
   - `password_reset_token` - Para reset seguro
   - Ambos expiran (invitation_token_expires_at, password_reset_token_expires_at)

---

## 📊 Estadísticas de Datos Esperados

(Post-seeding de prueba)

| Tabla | Registros | Propósito |
|-------|-----------|----------|
| platform_roles | 3 | Superadmin, Support, Finance |
| platform_users | 1 | admin@vibralive.test |
| clinics | 1 | Clínica de prueba |
| users | 2 | Owner + Staff |
| clients | 2 | Clientes de prueba |
| animal_types | 8 | Tipos de animales (Perro, Gato, etc) |
| pets | 2 | Mascotas asociadas |
| appointments | 0-N | Generadas en tests |
| reminders | 0-N | Creadas automáticamente |
| message_logs | 0-N | Logs de mensajes enviados |
| whatsapp_outbox | 0-N | Cola de mensajes pendientes |
| audit_logs | 0-N | Cambios administrativos |

---

## 🚀 Optimizaciones y Best Practices

### Queries Recomendadas

#### 1. Obtener Citas Pendientes de una Clínica
```typescript
const appointments = await appointmentRepo.find({
  where: {
    clinicId: clinic.id,
    status: 'SCHEDULED',
    scheduledAt: Between(yesterday, tomorrow)
  },
  relations: ['pet', 'client'],
  order: { scheduledAt: 'ASC' }
});
```

#### 2. Obtener Mensajes Pendientes de Envío
```typescript
const pending = await whatsappRepo.find({
  where: {
    clinicId: clinic.id,
    status: 'queued',
    retryCount: LessThan(5)
  },
  order: { createdAt: 'ASC' },
  take: 100
});
```

#### 3. Auditoría de Acciones
```typescript
const logs = await auditRepo.find({
  where: {
    clinicId: clinic.id,
    action: 'SUSPEND'
  },
  order: { createdAt: 'DESC' },
  take: 50
});
```

### Índices Críticos para Performance

1. **WhatsApp Processing** 
   - `whatsapp_outbox(clinic_id, status)` - Obtener pendientes rápidamente
   - `whatsapp_outbox(idempotency_key)` - Validar unicidad

2. **Recordatorios Automáticos**
   - `reminders(clinic_id, scheduled_date, status)` - Procesar dailys

3. **Auditoría**
   - `audit_logs(clinic_id, created_at)` - Reportes timeline

4. **Lookups**
   - `clients(clinic_id, phone)` - Validación de duplicados
   - `animal_types(clinic_id, name)` - Validación de tipos

---

## 🔍 Monitoreo y Mantenimiento

### Queries de Mantenimiento

#### Limpiar Mensajes Enviados Hace >90 días
```sql
DELETE FROM message_logs 
WHERE created_at < NOW() - INTERVAL '90 days' 
  AND status = 'delivered';
```

#### Consolidar Reintentos Fallidos
```sql
UPDATE whatsapp_outbox 
SET status = 'failed' 
WHERE retry_count >= max_retries 
  AND status = 'queued';
```

#### Estadísticas por Clínica
```sql
SELECT 
  c.id, c.name, 
  COUNT(DISTINCT cl.id) as clients,
  COUNT(DISTINCT p.id) as pets,
  COUNT(a.id) as appointments
FROM clinics c

LEFT JOIN clients cl ON c.id = cl.clinic_id
LEFT JOIN pets p ON c.id = p.clinic_id
LEFT JOIN appointments a ON c.id = a.clinic_id
GROUP BY c.id, c.name;
```

---

## 📚 Referencias

- [TypeORM Documentation](https://typeorm.io/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Database Design Patterns](https://en.wikipedia.org/wiki/Database_design)

---

**Documento actualizado:** Febrero 25, 2026  
**Versión:** 1.0  
**Estado:** Documentación Completa ✅
