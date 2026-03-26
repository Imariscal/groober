# VibraLive Database Schema 🗄️

**Última actualización:** Marzo 1, 2026  
**Estado:** Activo y en Producción ✅

---

## 📋 Tabla de Contenidos

1. [Descripción General](#descripción-general)
2. [Entidades del Sistema](#entidades-del-sistema)
3. [Relaciones Entre Entidades](#relaciones-entre-entidades)
4. [Índices y Optimizaciones](#índices-y-optimizaciones)
5. [Diagrama ER](#diagrama-er)

---

## 🎯 Descripción General

VibraLive utiliza **PostgreSQL** como base de datos relacional con **TypeORM** como ORM. La arquitectura está diseñada para soportar un sistema **multi-tenant** donde cada clínica veterinaria es un tenant independiente.

### Base de Datos Principal
- **Base de datos:** `vibralive` (PostgreSQL 14+)
- **ORM:** TypeORM con decoradores
- **Estrategia de Nombres:** `snake_case` en BD, `camelCase` en TypeScript
- **Tablas:** 15 entidades principales

### Características Principales
- ✅ Multi-tenancy con isolación por `clinic_id`
- ✅ Auditoría de cambios con Actor tracking
- ✅ Timestamps automáticos (`created_at`, `updated_at`)
- ✅ UUID primarias para escalabilidad
- ✅ Índices optimizados para queries frecuentes
- ✅ Support para herencia de precios (Default & Custom)

---

## 📊 Entidades del Sistema

### 1. PLATFORM_USERS - Usuarios de la Plataforma

Usuarios administrativos del sistema (Superadmin, Soporte, Finanzas).

```
Tabla: platform_users

┌─────────────────────────────────────────────────────────┐
│ id (UUID, PK)                                          │
│ email (VARCHAR, UNIQUE)                                │
│ full_name (VARCHAR)                                    │
│ password_hash (VARCHAR)                                │
│ status (INVITED|ACTIVE|DEACTIVATED|SUSPENDED)          │
│ impersonating_clinic_id (UUID, FK, nullable)           │
│ impersonating_user_id (UUID, FK, nullable)             │
│ created_at (TIMESTAMP)                                 │
│ updated_at (TIMESTAMP)                                 │
│ last_login_at (TIMESTAMP, nullable)                    │
│ deactivated_at (TIMESTAMP, nullable)                   │
│ invitation_token (UUID, nullable, UNIQUE)              │
│ invitation_token_expires_at (TIMESTAMP, nullable)      │
│ password_reset_token (UUID, nullable, UNIQUE)          │
│ password_reset_token_expires_at (TIMESTAMP, nullable)  │
└─────────────────────────────────────────────────────────┘

Índices:
- email (UNIQUE)
- invitation_token (UNIQUE)

Relaciones:
- M:M platform_roles (a través de platform_user_roles)
- 1:M audit_logs (como actor)
```

---

### 2. PLATFORM_ROLES - Roles del Sistema

Roles administrativos reutilizables (superadmin, support, finance).

```
Tabla: platform_roles

┌─────────────────────────────────────────┐
│ id (UUID, PK)                          │
│ key (VARCHAR, UNIQUE)                  │
│ name (VARCHAR)                         │
│ description (TEXT)                     │
│ permissions (TEXT[])                   │
│ is_active (BOOLEAN)                    │
│ is_immutable (BOOLEAN)                 │
│ created_at (TIMESTAMP)                 │
└─────────────────────────────────────────┘

Índices:
- key (UNIQUE)
- is_active

Relaciones:
- M:M platform_users
```

---

### 3. CLINICS - Clínicas Veterinarias

Representa una clínica veterinaria (tenant principal).

```
Tabla: clinics

┌────────────────────────────────────────────────────┐
│ id (UUID, PK)                                     │
│ name (VARCHAR)                                    │
│ phone (VARCHAR, UNIQUE)                           │
│ city (VARCHAR, nullable)                          │
│ country (VARCHAR, default: MX)                    │
│ responsable (VARCHAR) ← Persona responsable       │
│ whatsapp_account_id (VARCHAR, nullable)           │
│ whatsapp_phone_id (VARCHAR, nullable)             │
│ subscription_plan (STARTER|PROFESSIONAL|ENTERPRISE)
│ status (ACTIVE|SUSPENDED|DELETED)                │
│ suspended_at (TIMESTAMP, nullable)                │
│ suspended_by (UUID, FK, nullable)                 │
│ suspension_reason (TEXT, nullable)                │
│ plan (VARCHAR)                                    │
│ max_staff_users (INTEGER, default: 100)          │
│ max_clients (INTEGER, default: 1000)             │
│ max_pets (INTEGER, default: 5000)                │
│ active_staff_count (INTEGER)                     │
│ active_clients_count (INTEGER)                   │
│ active_pets_count (INTEGER)                      │
│ stats_updated_at (TIMESTAMP, nullable)            │
│ created_at (TIMESTAMP)                           │
│ updated_at (TIMESTAMP)                           │
└────────────────────────────────────────────────────┘

Constraints:
- UNIQUE(phone)
- NOT NULL(name, phone, responsable, country, subscription_plan, status, plan)

Índices:
- phone (UNIQUE)
- status

Relaciones (1:M):
- users
- clients
- pets
- appointments
- reminders
- message_logs
- whatsapp_outbox
- animal_types
- price_lists ← Nueva entidad para pricing
- services
- audit_logs (contexto)
```

---

### 4. USERS - Usuarios de Clínica

Usuarios locales de una clínica (owner, staff, etc).

```
Tabla: users

┌────────────────────────────────────────────────────┐
│ id (UUID, PK)                                     │
│ clinic_id (UUID, FK)                              │
│ name (VARCHAR)                                    │
│ email (VARCHAR, UNIQUE)                           │
│ phone (VARCHAR, nullable)                         │
│ hashed_password (VARCHAR)                         │
│ role (superadmin|owner|staff, default: staff)     │
│ status (INVITED|ACTIVE|DEACTIVATED)               │
│ last_login (TIMESTAMP, nullable)                  │
│ deactivated_at (TIMESTAMP, nullable)              │
│ deactivated_by (UUID, FK, nullable)               │
│ invitation_token (UUID, nullable, UNIQUE)         │
│ invitation_token_expires_at (TIMESTAMP, nullable) │
│ password_reset_token (UUID, nullable, UNIQUE)     │
│ password_reset_token_expires_at (TIMESTAMP, nullable)
│ created_at (TIMESTAMP)                           │
│ updated_at (TIMESTAMP)                           │
└────────────────────────────────────────────────────┘

Constraints:
- UNIQUE(email)
- FK clinic_id → clinics(id) [CASCADE]
- NOT NULL(clinic_id, name, email, hashed_password, role, status)

Índices:
- email (UNIQUE)
- clinic_id
- status

Relaciones (M:1):
- clinic
```

---

### 5. CLIENTS - Clientes (Dueños de Mascotas)

Dueños de mascotas / clientes de la clínica.

```
Tabla: clients

┌────────────────────────────────────────────────────┐
│ id (UUID, PK)                                     │
│ clinic_id (UUID, FK)                              │
│ name (VARCHAR)                                    │
│ phone (VARCHAR)                                   │
│ email (VARCHAR, nullable)                         │
│ address (VARCHAR, nullable)                       │
│ notes (TEXT, nullable)                            │
│ price_list_id (UUID, FK, nullable) ← CAP: Asigna│
│ created_at (TIMESTAMP)                           │
│ updated_at (TIMESTAMP)                           │
└────────────────────────────────────────────────────┘

Constraints:
- UNIQUE(clinic_id, phone)
- FK clinic_id → clinics(id) [CASCADE]
- FK price_list_id → price_lists(id) [SET NULL]
- NOT NULL(clinic_id, name, phone)

Índices:
- clinic_id, phone (UNIQUE)
- clinic_id
- price_list_id

Relaciones (1:M):
- pets
- appointments
- reminders
- message_logs
- whatsapp_outbox

Relaciones (M:1):
- clinic
- price_list ← Nueva relación
```

---

### 6. PETS - Mascotas

Mascotas registradas en el sistema.

```
Tabla: pets

┌────────────────────────────────────────────┐
│ id (UUID, PK)                              │
│ clinic_id (UUID, FK)                       │
│ client_id (UUID, FK)                       │
│ name (VARCHAR)                             │
│ animal_type_id (INTEGER, FK)               │
│ breed (VARCHAR, nullable)                  │
│ birth_date (DATE, nullable)                │
│ next_vaccine_date (DATE, nullable)         │
│ next_deworming_date (DATE, nullable)       │
│ notes (TEXT, nullable)                     │
│ created_at (TIMESTAMP)                     │
│ updated_at (TIMESTAMP)                     │
└────────────────────────────────────────────┘

Constraints:
- FK clinic_id → clinics(id) [CASCADE]
- FK client_id → clients(id) [CASCADE]
- FK animal_type_id → animal_types(id) [RESTRICT]
- NOT NULL(clinic_id, client_id, name, animal_type_id)

Índices:
- clinic_id, client_id
- animal_type_id

Relaciones (1:M):
- appointments
- reminders

Relaciones (M:1):
- clinic
- client
- animalType
```

---

### 7. ANIMAL_TYPES - Tipos de Animales

Catálogo de tipos de animales (Perro, Gato, Loro, etc).

```
Tabla: animal_types

┌────────────────────────────────────────────┐
│ id (INTEGER, PK, AUTO_INCREMENT)          │
│ clinic_id (UUID, FK)                       │
│ name (VARCHAR)                             │
│ created_at (TIMESTAMP)                     │
│ updated_at (TIMESTAMP)                     │
└────────────────────────────────────────────┘

Constraints:
- UNIQUE(clinic_id, name)
- FK clinic_id → clinics(id) [CASCADE]
- NOT NULL(clinic_id, name)

Índices:
- clinic_id, name (UNIQUE)

Relaciones (M:1):
- clinic
```

---

### 8. APPOINTMENTS - Citas Veterinarias

Citas/consultas programadas.

```
Tabla: appointments

┌────────────────────────────────────────────┐
│ id (UUID, PK)                              │
│ clinic_id (UUID, FK)                       │
│ pet_id (UUID, FK)                          │
│ client_id (UUID, FK)                       │
│ scheduled_at (TIMESTAMP)                   │
│ status (SCHEDULED|CONFIRMED|CANCELLED|... )
│ reason (TEXT, nullable)                    │
│ duration_minutes (INTEGER, nullable)       │
│ veterinarian_id (UUID, FK, nullable)       │
│ notes (TEXT, nullable)                     │
│ cancelled_at (TIMESTAMP, nullable)         │
│ cancelled_by (UUID, FK, nullable)          │
│ cancellation_reason (VARCHAR, nullable)    │
│ created_at (TIMESTAMP)                     │
│ updated_at (TIMESTAMP)                     │
└────────────────────────────────────────────┘

Constraints:
- FK clinic_id → clinics(id) [CASCADE]
- FK pet_id → pets(id) [CASCADE]
- FK client_id → clients(id) [CASCADE]
- FK veterinarian_id → users(id) [SET NULL] (nullable)

Índices:
- clinic_id, status
- clinic_id, scheduled_at
- clinic_id, created_at

Relaciones (M:1):
- clinic
- pet
- client
```

---

### 9. SERVICES - Servicios / Productos

Servicios ofrecidos por la clínica (vacunas, consultas, etc).

```
Tabla: services

┌────────────────────────────────────────────┐
│ id (UUID, PK)                              │
│ clinic_id (UUID, FK)                       │
│ name (VARCHAR)                             │
│ description (TEXT, nullable)               │
│ type (SERVICE|PRODUCT) ← Tipo de servicio │
│ is_active (BOOLEAN)                        │
│ created_at (TIMESTAMP)                     │
│ updated_at (TIMESTAMP)                     │
└────────────────────────────────────────────┘

Constraints:
- FK clinic_id → clinics(id) [CASCADE]
- UNIQUE(clinic_id, name)
- NOT NULL(clinic_id, name, type, is_active)

Índices:
- clinic_id
- clinic_id, is_active

Relaciones (M:1):
- clinic

Relaciones (1:M):
- service_prices (precios de este servicio)
```

---

### 10. PRICE_LISTS - Listas de Precios

Diferentes listas de precios que puede tener una clínica.

```
Tabla: price_lists

┌────────────────────────────────────────────┐
│ id (UUID, PK)                              │
│ clinic_id (UUID, FK)                       │
│ name (VARCHAR)                             │
│ description (TEXT, nullable)               │
│ is_default (BOOLEAN) ← Marca default      │
│ is_active (BOOLEAN)                        │
│ created_at (TIMESTAMP)                     │
│ updated_at (TIMESTAMP)                     │
└────────────────────────────────────────────┘

Constraints:
- FK clinic_id → clinics(id) [CASCADE]
- UNIQUE(clinic_id, is_default, is_active) WHERE is_default=true AND is_active=true
  → Solo una lista default activa por clínica
- NOT NULL(clinic_id, name, is_default, is_active)

Índices:
- clinic_id
- clinic_id, is_default WHERE is_active=true (para obtener default rápido)
- is_active

Relaciones (M:1):
- clinic

Relaciones (1:M):
- service_prices (precios enlazados en esta lista)
- clients (clientes asignados a esta lista)

GARANTÍA DEL SISTEMA:
- SIEMPRE existe una lista con is_default=true e is_active=true
- Se crea automáticamente en ensureDefaultPriceListExists()
- Se asigna automáticamente a nuevos clientes
- Se añaden nuevos servicios automáticamente
```

---

### 11. SERVICE_PRICES - Precios de Servicios

Precios de servicios en listas de precios (tabla de cruce).

```
Tabla: service_prices

┌─────────────────────────────────────────────────┐
│ id (UUID, PK)                                  │
│ price_list_id (UUID, FK)                       │
│ service_id (UUID, FK)                          │
│ price (DECIMAL(10,2))                          │
│ currency (VARCHAR, default: MXN)               │
│ is_available (BOOLEAN)                         │
│ created_at (TIMESTAMP)                         │
│ updated_at (TIMESTAMP)                         │
└─────────────────────────────────────────────────┘

Constraints:
- FK price_list_id → price_lists(id) [CASCADE]
- FK service_id → services(id) [CASCADE]
- UNIQUE(price_list_id, service_id)
- NOT NULL(price_list_id, service_id, price, currency, is_available)

Índices:
- price_list_id, service_id (UNIQUE)
- price_list_id
- service_id

Relaciones (M:1):
- price_list
- service
```

---

### 12. REMINDERS - Recordatorios

Recordatorios automáticos para vacunas, desparasitantes, etc.

```
Tabla: reminders

┌────────────────────────────────────────────┐
│ id (UUID, PK)                              │
│ clinic_id (UUID, FK)                       │
│ pet_id (UUID, FK)                          │
│ client_id (UUID, FK)                       │
│ reminder_type (vaccine|deworming)          │
│ reminder_stage (day7|day1|followup24h)     │
│ scheduled_date (DATE)                      │
│ status (pending|sent|confirmed|cancelled.. )
│ message_id (VARCHAR, nullable)             │
│ confirmed_at (TIMESTAMP, nullable)         │
│ failed_reason (VARCHAR, nullable)          │
│ attempt_count (INTEGER)                    │
│ last_attempt_at (TIMESTAMP, nullable)      │
│ created_at (TIMESTAMP)                     │
│ updated_at (TIMESTAMP)                     │
└────────────────────────────────────────────┘

Constraints:
- FK clinic_id → clinics(id) [CASCADE]
- FK pet_id → pets(id) [CASCADE]
- FK client_id → clients(id) [CASCADE]
- NOT NULL(clinic_id, pet_id, client_id, reminder_type, reminder_stage, scheduled_date, status)

Índices:
- clinic_id, status
- clinic_id, scheduled_date, status WHERE status IN ('pending', 'sent')
- pet_id
- client_id

Relaciones (1:M):
- message_logs

Relaciones (M:1):
- clinic
- pet
- client
```

---

### 13. MESSAGE_LOGS - Logs de Mensajes

Registro de todos los mensajes enviados/recibidos.

```
Tabla: message_logs

┌────────────────────────────────────────────┐
│ id (UUID, PK)                              │
│ clinic_id (UUID, FK)                       │
│ reminder_id (UUID, FK, nullable)           │
│ client_id (UUID, FK)                       │
│ direction (outbound|inbound)               │
│ message_type (reminder|confirmation|...)   │
│ phone_number (VARCHAR)                     │
│ message_body (TEXT)                        │
│ whatsapp_message_id (VARCHAR, nullable)    │
│ status (delivered|read|failed|cancelled)   │
│ error_code (VARCHAR, nullable)             │
│ error_message (VARCHAR, nullable)          │
│ created_at (TIMESTAMP)                     │
└────────────────────────────────────────────┘

Constraints:
- FK clinic_id → clinics(id) [CASCADE]
- FK reminder_id → reminders(id) [SET NULL]
- FK client_id → clients(id) [CASCADE]
- NOT NULL(clinic_id, client_id, direction, message_type, phone_number, message_body, status)

Índices:
- clinic_id
- reminder_id
- client_id
- direction, status
- whatsapp_message_id

Relaciones (M:1):
- clinic
- reminder (nullable)
- client
```

---

### 14. WHATSAPP_OUTBOX - Cola de Mensajes WhatsApp

Tabla de outbox para mensajes a enviar con reintentos automáticos.

```
Tabla: whatsapp_outbox

┌────────────────────────────────────────────┐
│ id (UUID, PK)                              │
│ clinic_id (UUID, FK)                       │
│ client_id (UUID, FK, nullable)             │
│ phone_number (VARCHAR)                     │
│ message_body (TEXT)                        │
│ status (queued|sent|failed|delivered)      │
│ idempotency_key (VARCHAR, UNIQUE)          │
│ retry_count (INTEGER)                      │
│ max_retries (INTEGER)                      │
│ last_retry_at (TIMESTAMP, nullable)        │
│ provider_message_id (VARCHAR, nullable)    │
│ provider_error (TEXT, nullable)            │
│ channel (whatsapp|sms|telegram)            │
│ message_type (appointment_reminder|...)    │
│ sent_at (TIMESTAMP, nullable)              │
│ created_at (TIMESTAMP)                     │
│ updated_at (TIMESTAMP)                     │
└────────────────────────────────────────────┘

Constraints:
- FK clinic_id → clinics(id) [CASCADE]
- FK client_id → clients(id) [SET NULL]
- UNIQUE(idempotency_key)
- NOT NULL(clinic_id, phone_number, message_body, status, channel)

Índices:
- clinic_id, status
- clinic_id, created_at
- idempotency_key (UNIQUE)
- retry_count, status

Relaciones (M:1):
- clinic
- client (nullable)
```

---

### 15. AUDIT_LOGS - Logs de Auditoría

Registro de todas las acciones administrativas.

```
Tabla: audit_logs

┌────────────────────────────────────────────┐
│ id (UUID, PK)                              │
│ actor_id (UUID, FK)                        │
│ action (CREATE|UPDATE|DELETE|SUSPEND|...)  │
│ resource_type (clinic|user|service|...)    │
│ resource_id (UUID)                         │
│ clinic_id (UUID, FK, nullable)             │
│ actor_type (PLATFORM_USER|CLINIC_USER)     │
│ changes (JSONB, nullable)                  │
│ created_at (TIMESTAMP)                     │
└────────────────────────────────────────────┘

Constraints:
- FK actor_id → platform_users(id) [RESTRICT]
- NOT NULL(actor_id, action, resource_type, resource_id, actor_type)

Índices:
- actor_id
- resource_type
- action
- created_at
- clinic_id

Relaciones (M:1):
- platform_user (como actor)
```

---

## 🔗 Relaciones Entre Entidades

### Diagrama Simplificado

```
PLATFORM GLOBAL
───────────────
PlatformUsers ──M:M── PlatformRoles
    │
    └── M:1 AuditLogs (como actor)


MULTI-TENANT (POR CLÍNICA)
──────────────────────────
         Clinic (main tenant)
            │
            ├── 1:M ──→ Users
            ├── 1:M ──→ Clients
            │           │
            │           └── 1:M ──→ Pets
            │               │
            │               └── 1:M ──→ Appointments
            │
            ├── 1:M ──→ Services
            │           │
            │           └── 1:M ──→ ServicePrices
            │                       │
            │                       └── M:1 ──→ PriceLists
            │
            ├── 1:M ──→ PriceLists ← Lista Default garantizada
            │           │
            │           └── 1:M ──→ ServicePrices
            │
            ├── 1:M ──→ AnimalTypes
            ├── 1:M ──→ Appointments
            ├── 1:M ──→ Reminders
            ├── 1:M ──→ MessageLogs
            └── 1:M ──→ WhatsappOutbox
```

### Principales Caminos de Relación

**Flujo de Precios:**
```
Service(name="Baño") 
    → ServicePrice(price=500, currency=MXN)
        → PriceList(name="Default", isDefault=true)
            → Client(name="Juan Pérez")
                → Appointment(status=SCHEDULED)
```

**Flujo de Recordatorios:**
```
Clinic 
    → Client 
        → Pet 
            → Reminder(type=vaccine)
                → MessageLog(status=delivered)
                    → WhatsappOutbox(status=sent)
```

---

## 🚀 Índices y Optimizaciones

### Índices Críticos para Performance

#### 1. Appointments
```sql
CREATE INDEX idx_appointments_clinic_status 
  ON appointments(clinic_id, status);

CREATE INDEX idx_appointments_clinic_scheduled_at 
  ON appointments(clinic_id, scheduled_at);

CREATE INDEX idx_appointments_clinic_created_at 
  ON appointments(clinic_id, created_at);
```

#### 2. WhatsApp Outbox
```sql
CREATE INDEX idx_whatsapp_clinic_status 
  ON whatsapp_outbox(clinic_id, status);

CREATE INDEX idx_whatsapp_clinic_created_at 
  ON whatsapp_outbox(clinic_id, created_at);

CREATE UNIQUE INDEX idx_whatsapp_idempotency_key 
  ON whatsapp_outbox(idempotency_key);

CREATE INDEX idx_whatsapp_retry_status 
  ON whatsapp_outbox(retry_count, status);
```

#### 3. Reminders
```sql
CREATE INDEX idx_reminders_clinic_status 
  ON reminders(clinic_id, status);

CREATE INDEX idx_reminders_clinic_scheduled_date_status 
  ON reminders(clinic_id, scheduled_date, status) 
  WHERE status IN ('pending', 'sent');

CREATE INDEX idx_reminders_pet_id 
  ON reminders(pet_id);

CREATE INDEX idx_reminders_client_id 
  ON reminders(client_id);
```

#### 4. Message Logs
```sql
CREATE INDEX idx_message_logs_clinic_id 
  ON message_logs(clinic_id);

CREATE INDEX idx_message_logs_reminder_id 
  ON message_logs(reminder_id);

CREATE INDEX idx_message_logs_client_id 
  ON message_logs(client_id);

CREATE INDEX idx_message_logs_direction_status 
  ON message_logs(direction, status);

CREATE UNIQUE INDEX idx_message_logs_whatsapp_message_id 
  ON message_logs(whatsapp_message_id);
```

#### 5. Price Lists (NEW)
```sql
CREATE INDEX idx_price_lists_clinic_id 
  ON price_lists(clinic_id);

CREATE UNIQUE INDEX idx_price_lists_clinic_default_active 
  ON price_lists(clinic_id, is_default, is_active) 
  WHERE is_default=true AND is_active=true;

CREATE INDEX idx_price_lists_is_active 
  ON price_lists(is_active);
```

#### 6. Service Prices (NEW)
```sql
CREATE UNIQUE INDEX idx_service_prices_price_list_service 
  ON service_prices(price_list_id, service_id);

CREATE INDEX idx_service_prices_price_list_id 
  ON service_prices(price_list_id);

CREATE INDEX idx_service_prices_service_id 
  ON service_prices(service_id);
```

#### 7. Services (NEW)
```sql
CREATE INDEX idx_services_clinic_id 
  ON services(clinic_id);

CREATE UNIQUE INDEX idx_services_clinic_name 
  ON services(clinic_id, name);

CREATE INDEX idx_services_clinic_is_active 
  ON services(clinic_id, is_active);
```

#### 8. Clients
```sql
CREATE UNIQUE INDEX idx_clients_clinic_phone 
  ON clients(clinic_id, phone);

CREATE INDEX idx_clients_clinic_id 
  ON clients(clinic_id);

CREATE INDEX idx_clients_price_list_id 
  ON clients(price_list_id);
```

#### 9. Users
```sql
CREATE INDEX idx_users_clinic_id 
  ON users(clinic_id);

CREATE UNIQUE INDEX idx_users_email 
  ON users(email);

CREATE INDEX idx_users_clinic_status 
  ON users(clinic_id, status);
```

#### 10. Platform Users
```sql
CREATE UNIQUE INDEX idx_platform_users_email 
  ON platform_users(email);

CREATE INDEX idx_platform_users_status 
  ON platform_users(status);
```

#### 11. Audit Logs
```sql
CREATE INDEX idx_audit_logs_actor_id 
  ON audit_logs(actor_id);

CREATE INDEX idx_audit_logs_resource_type 
  ON audit_logs(resource_type);

CREATE INDEX idx_audit_logs_resource_type_action 
  ON audit_logs(resource_type, action);

CREATE INDEX idx_audit_logs_created_at 
  ON audit_logs(created_at);

CREATE INDEX idx_audit_logs_clinic_id 
  ON audit_logs(clinic_id);
```

---

## 📊 Cardinalidades

| Relación | Tipo | Descripción |
|----------|------|-------------|
| Clinic → Users | 1:M | Una clínica tiene muchos usuarios |
| Clinic → Clients | 1:M | Una clínica tiene muchos clientes |
| Clinic → Pets | 1:M | Una clínica registra muchas mascotas |
| Clinic → Services | 1:M | Una clínica ofrece muchos servicios |
| Clinic → PriceLists | 1:M | Una clínica tiene múltiples listas de precios |
| Client → Pets | 1:M | Un cliente tiene múltiples mascotas |
| Client → Appointments | 1:M | Un cliente tiene múltiples citas |
| Client → PriceList | M:1 | Muchos clientes pueden usar la misma lista |
| Pet → Appointments | 1:M | Una mascota tiene múltiples citas |
| Pet → AnimalType | M:1 | Múltiples mascotas del mismo tipo |
| Service → ServicePrice | 1:M | Un servicio tiene precios en múltiples listas |
| PriceList → ServicePrice | 1:M | Una lista contiene múltiples precios |
| PriceList → Clients | 1:M | Una lista es asignada a múltiples clientes |
| Reminder → MessageLog | 1:M | Un recordatorio genera múltiples logs |
| PlatformUser → PlatformRole | M:M | Usuarios con múltiples roles |
| PlatformUser → AuditLog | 1:M | Un usuario genera múltiples logs |

---

## 💾 Ejemplo de Datos

### Clinic Seed
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Clínica Veterinaria San Rafael",
  "phone": "+5255123456789",
  "city": "Mexico City",
  "country": "MX",
  "responsable": "Dr. Carlos López",
  "subscription_plan": "PROFESSIONAL",
  "status": "ACTIVE",
  "plan": "PROFESSIONAL"
}
```

### Price List Seed (Default - Guaranteed)
```json
{
  "id": "650e8400-e29b-41d4-a716-446655440001",
  "clinic_id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Default Price List",
  "description": "Lista de precios por defecto",
  "is_default": true,
  "is_active": true
}
```

### Service Seed
```json
{
  "id": "750e8400-e29b-41d4-a716-446655440001",
  "clinic_id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Baño y Corte",
  "description": "Baño completo con corte de uñas",
  "type": "SERVICE",
  "is_active": true
}
```

### Service Price Seed
```json
{
  "id": "850e8400-e29b-41d4-a716-446655440001",
  "price_list_id": "650e8400-e29b-41d4-a716-446655440001",
  "service_id": "750e8400-e29b-41d4-a716-446655440001",
  "price": 500.00,
  "currency": "MXN",
  "is_available": true
}
```

### Client with Price List
```json
{
  "id": "950e8400-e29b-41d4-a716-446655440001",
  "clinic_id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Juan Pérez García",
  "phone": "+525551234567",
  "email": "juan@email.com",
  "address": "Calle Principal 123, CDMX",
  "price_list_id": "650e8400-e29b-41d4-a716-446655440001"
}
```

---

## 🔐 Garantías del Sistema

### Garantía de Lista de Precios Default

**Punto Crítico:** Siempre existe una lista de precios default activa

La clase `PriceListsService` implementa:

```typescript
async ensureDefaultPriceListExists(clinicId: string): Promise<PriceList> {
  // 1. Buscar lista default activa
  let priceList = await this.priceListRepo.findOne({
    where: { 
      clinicId, 
      isDefault: true, 
      isActive: true 
    }
  });
  
  // 2. Si no existe, crear automáticamente
  if (!priceList) {
    priceList = this.priceListRepo.create({
      clinicId,
      name: 'Default Price List',
      isDefault: true,
      isActive: true,
    });
    priceList = await this.priceListRepo.save(priceList);
  }
  
  // 3. Nunca retorna null, garantizado
  return priceList;
}
```

**Comportamientos que dependen de esta garantía:**

1. **Creación de Cliente**
   - Al crear un cliente sin `price_list_id`, se asigna automáticamente la default
   - Función: `ClientsService.createClient()`

2. **Creación de Servicio**
   - Al crear un nuevo servicio, se añade automáticamente a la lista default
   - Función: `ServicesService.createService()`

3. **Seed de Base de Datos**
   - Script `ensure-default-price-lists.seed.ts` crea default para todas las clínicas existentes
   - Añade todos los servicios existentes a la default

---

## 🔍 Consultas Comunes

### Obtener Cliente con su Lista de Precios
```typescript
const client = await clientRepo.findOne({
  where: { id: clientId, clinicId },
  relations: ['priceList', 'priceList.servicePrices']
});

// client.priceList = {
//   id: '650e8400...',
//   name: 'Default Price List',
//   isDefault: true,
//   servicePrices: [
//     { serviceId: '750e8400...', price: 500 }
//   ]
// }
```

### Obtener Servicios con Precios de una Lista
```typescript
const servicePrices = await servicePriceRepo.find({
  where: { priceListId: client.priceList.id },
  relations: ['service'],
  order: { 'service.name': 'ASC' }
});

// servicePrices = [
//   { 
//     service: { name: 'Baño y Corte', ... },
//     price: 500,
//     currency: 'MXN'
//   }
// ]
```

### Obtener Lista Default de una Clínica
```typescript
const defaultList = await priceListRepo.findOne({
  where: { 
    clinicId, 
    isDefault: true, 
    isActive: true 
  }
});
```

### Obtener Todas las Listas Activas
```typescript
const lists = await priceListRepo.find({
  where: { 
    clinicId, 
    isActive: true 
  },
  order: { 
    isDefault: 'DESC', // Default primero
    name: 'ASC' 
  }
});
```

---

## 📈 Estadísticas de Tablas (Post-Seed)

| Tabla | Registros | Propósito |
|-------|-----------|----------|
| platform_users | 1 | Admin global |
| platform_roles | 3 | Superadmin, Support, Finance |
| clinics | 1 | Clínica de prueba |
| users | 2 | Owner + Staff |
| clients | 2 | Clientes de prueba |
| animal_types | 8 | Tipos de animales |
| pets | 2 | Mascotas asociadas |
| services | 10+ | Servicios básicos |
| price_lists | 1+ | Al menos 1 default |
| service_prices | 10+ | Precios de servicios |
| appointments | 0-N | Generadas en tests |
| reminders | 0-N | Creadas automáticamente |
| message_logs | 0-N | Logs de mensajes |
| whatsapp_outbox | 0-N | Mensajes pendientes |
| audit_logs | 0-N | Cambios administrativos |

---

## 🔧 Mantenimiento

### Limpiar Registros Antiguos
```sql
-- Eliminar MessageLogs de hace >90 días
DELETE FROM message_logs 
WHERE created_at < NOW() - INTERVAL '90 days' 
  AND status = 'delivered';

-- Eliminar WhatsappOutbox fallidos de hace >30 días
DELETE FROM whatsapp_outbox 
WHERE created_at < NOW() - INTERVAL '30 days' 
  AND status = 'failed';
```

### Reparar Contadores
```sql
-- Actualizar counters de clínica
UPDATE clinics 
SET active_staff_count = (
  SELECT COUNT(*) FROM users 
  WHERE clinic_id = clinics.id AND status = 'ACTIVE'
),
active_clients_count = (
  SELECT COUNT(*) FROM clients 
  WHERE clinic_id = clinics.id
),
active_pets_count = (
  SELECT COUNT(*) FROM pets 
  WHERE clinic_id = clinics.id
)
WHERE status = 'ACTIVE';
```

---

## 📞 Soporte

Para modificaciones al schema:
1. Crear migración en `/src/database/migrations/`
2. Ejecutar `npm run migration:run`
3. Actualizar esta documentación
4. Notificar al equipo

---

**Última actualización:** Marzo 1, 2026 ✅  
**Versión:** 2.0 (Nueva: Módulo de Precios)  
**Estado:** Producción
