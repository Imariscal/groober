# VibraLive Database Schema

## Tabla: `clinics`
Almacena las clínicas registradas en el sistema.

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Identificador único |
| name | VARCHAR(255) | NOT NULL | Nombre de la clínica |
| phone | VARCHAR(20) | UNIQUE, NOT NULL | Teléfono de la clínica |
| city | VARCHAR(100) | NULLABLE | Ciudad donde se ubica |
| country | VARCHAR(100) | DEFAULT 'MX' | País (por defecto México) |
| whatsapp_account_id | VARCHAR(100) | NULLABLE | ID de cuenta WhatsApp Business |
| whatsapp_phone_id | VARCHAR(100) | NULLABLE | ID de teléfono WhatsApp |
| subscription_plan | VARCHAR(50) | DEFAULT 'starter' | Plan de suscripción |
| status | VARCHAR(50) | DEFAULT 'ACTIVE' | Estado (ACTIVE, SUSPENDED, etc.) |
| plan | VARCHAR(50) | DEFAULT 'STARTER' | Tipo de plan |
| max_staff_users | INTEGER | DEFAULT 100 | Máximo de usuarios staff |
| max_clients | INTEGER | DEFAULT 1000 | Máximo de clientes |
| max_pets | INTEGER | DEFAULT 5000 | Máximo de mascotas |
| active_staff_count | INTEGER | DEFAULT 0 | Contador de staff activos |
| active_clients_count | INTEGER | DEFAULT 0 | Contador de clientes activos |
| active_pets_count | INTEGER | DEFAULT 0 | Contador de mascotas activas |
| email_responsable | VARCHAR(255) | NULLABLE | Email del responsable |
| city | VARCHAR(100) | NOT NULL | Ciudad (requerida) |
| suspended_at | TIMESTAMP | NULLABLE | Fecha de suspensión |
| suspended_by | UUID | NULLABLE | Usuario que suspendió |
| suspension_reason | TEXT | NULLABLE | Motivo de suspensión |
| stats_updated_at | TIMESTAMP | NULLABLE | Última actualización de estadísticas |
| subscription_plan_id | UUID | NULLABLE FK | Referencia a subscription_plans |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Fecha de creación |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Fecha de última actualización |

---

## Tabla: `users`
Usuarios de cada clínica.

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Identificador único |
| clinic_id | UUID | FK → clinics.id (CASCADE) | Clínica a la que pertenece |
| name | VARCHAR(255) | NOT NULL | Nombre del usuario |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Email único |
| phone | VARCHAR(20) | NULLABLE | Teléfono |
| hashed_password | VARCHAR(255) | NOT NULL | Contraseña hasheada |
| role | VARCHAR(50) | DEFAULT 'staff' | Rol (admin, staff, etc.) |
| status | VARCHAR(50) | DEFAULT 'ACTIVE' | Estado del usuario |
| deactivated_at | TIMESTAMP | NULLABLE | Fecha de desactivación |
| deactivated_by | UUID | NULLABLE | Usuario que desactivó |
| invitation_token | UUID | NULLABLE | Token de invitación |
| invitation_token_expires_at | TIMESTAMP | NULLABLE | Expiración del token |
| password_reset_token | UUID | NULLABLE | Token de reset de contraseña |
| password_reset_token_expires_at | TIMESTAMP | NULLABLE | Expiración del token reset |
| last_login | TIMESTAMP | NULLABLE | Último login |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Fecha de creación |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Fecha de última actualización |

---

## Tabla: `clients`
Clientes (propietarios de mascotas) de cada clínica.

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Identificador único |
| clinic_id | UUID | FK → clinics.id (CASCADE) | Clínica a la que pertenece |
| name | VARCHAR(255) | NOT NULL | Nombre del cliente |
| phone | VARCHAR(20) | NOT NULL | Teléfono |
| email | VARCHAR(255) | NULLABLE | Email |
| price_list_id | UUID | NULLABLE FK → price_lists.id | Lista de precios asignada |
| address | VARCHAR(500) | NULLABLE | Dirección |
| notes | TEXT | NULLABLE | Notas adicionales |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Fecha de creación |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Fecha de última actualización |

**Unique Constraint:** (clinic_id, phone)

---

## Tabla: `animal_types`
Tipos de animales (especies) permitidas en la clínica.

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Identificador único |
| clinic_id | UUID | FK → clinics.id (CASCADE) | Clínica |
| name | VARCHAR(100) | NOT NULL | Nombre del tipo (Perro, Gato, etc.) |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Fecha de creación |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Fecha de última actualización |

---

## Tabla: `pets`
Mascotas registradas en la clínica.

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Identificador único |
| clinic_id | UUID | FK → clinics.id (CASCADE) | Clínica |
| client_id | UUID | FK → clients.id (CASCADE) | Cliente propietario |
| name | VARCHAR(255) | NOT NULL | Nombre de la mascota |
| species | VARCHAR(50) | NOT NULL | Especie (Perro, Gato, etc.) |
| breed | VARCHAR(100) | NULLABLE | Raza |
| date_of_birth | DATE | NULLABLE | Fecha de nacimiento |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Fecha de creación |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Fecha de última actualización |

---

## Tabla: `reminders`
Recordatorios programados para clientes.

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Identificador único |
| clinic_id | UUID | FK → clinics.id (CASCADE) | Clínica |
| client_id | UUID | FK → clients.id (CASCADE) | Cliente |
| message | TEXT | NOT NULL | Contenido del recordatorio |
| scheduled_at | TIMESTAMP | NOT NULL | Fecha/hora de envío |
| status | VARCHAR(50) | DEFAULT 'PENDING' | Estado (PENDING, SENT, FAILED, etc.) |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Fecha de creación |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Fecha de última actualización |

---

## Tabla: `message_logs`
Log de mensajes enviados a clientes.

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Identificador único |
| clinic_id | UUID | FK → clinics.id (CASCADE) | Clínica |
| client_id | UUID | FK → clients.id (CASCADE) | Cliente |
| message | TEXT | NOT NULL | Contenido del mensaje |
| status | VARCHAR(50) | DEFAULT 'SENT' | Estado de envío |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Fecha de creación |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Fecha de última actualización |

---

## Tabla: `whatsapp_outbox`
Mensajes de WhatsApp pendientes por enviar.

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Identificador único |
| clinic_id | UUID | FK → clinics.id | Clínica |
| client_id | UUID | FK → clients.id | Cliente destino |
| message | TEXT | NOT NULL | Contenido del mensaje |
| status | VARCHAR(50) | DEFAULT 'PENDING' | Estado del mensaje |
| phone | VARCHAR(20) | NOT NULL | Número de teléfono |
| retry_count | INTEGER | DEFAULT 0 | Intentos de envío |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Fecha de creación |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Fecha de última actualización |

---

## Tabla: `appointments`
Citas programadas en la clínica.

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Identificador único |
| clinic_id | UUID | FK → clinics.id | Clínica |
| client_id | UUID | FK → clients.id | Cliente |
| pet_id | UUID | NULLABLE FK → pets.id | Mascota (opcional) |
| appointment_date | TIMESTAMP | NOT NULL | Fecha y hora de la cita |
| status | VARCHAR(50) | DEFAULT 'SCHEDULED' | Estado (SCHEDULED, COMPLETED, CANCELLED) |
| notes | TEXT | NULLABLE | Notas de la cita |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Fecha de creación |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Fecha de última actualización |

---

## Tabla: `platform_roles`
Roles disponibles en la plataforma (multi-tenancy).

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Identificador único |
| key | VARCHAR(50) | UNIQUE, NOT NULL | Clave del rol (admin, user, etc.) |
| name | VARCHAR(100) | NOT NULL | Nombre descriptivo |
| description | TEXT | NOT NULL | Descripción del rol |
| permissions | TEXT[] | NOT NULL | Array de permisos |
| is_active | BOOLEAN | DEFAULT true | Si el rol está activo |
| is_immutable | BOOLEAN | DEFAULT false | Si no puede ser modificado |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Fecha de creación |

---

## Tabla: `platform_users`
Super usuarios de la plataforma (administradores multi-tenancy).

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Identificador único |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Email único |
| full_name | VARCHAR(255) | NOT NULL | Nombre completo |
| password_hash | VARCHAR(255) | NOT NULL | Contraseña hasheada |
| status | VARCHAR(50) | DEFAULT 'ACTIVE' | Estado (ACTIVE, DEACTIVATED) |
| impersonating_clinic_id | UUID | NULLABLE FK → clinics.id | Clínica en impersonación |
| impersonating_user_id | UUID | NULLABLE FK → users.id | Usuario en impersonación |
| invitation_token | UUID | NULLABLE | Token de invitación |
| invitation_token_expires_at | TIMESTAMP | NULLABLE | Expiración del token |
| password_reset_token | UUID | NULLABLE | Token de reset |
| password_reset_token_expires_at | TIMESTAMP | NULLABLE | Expiración del token reset |
| last_login_at | TIMESTAMP | NULLABLE | Última conexión |
| deactivated_at | TIMESTAMP | NULLABLE | Fecha de desactivación |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Fecha de creación |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Fecha de última actualización |

**Index:** (email)

---

## Tabla: `platform_user_roles`
Relación Many-to-Many entre platform_users y platform_roles.

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| user_id | UUID | PRIMARY KEY, FK → platform_users.id (CASCADE) | Usuario |
| role_id | UUID | PRIMARY KEY, FK → platform_roles.id (CASCADE) | Rol |

---

## Tabla: `audit_logs`
Log de auditoría de todas las acciones en el sistema.

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Identificador único |
| actor_id | UUID | FK → platform_users.id (SET NULL) | Usuario que realizó la acción |
| action | VARCHAR(50) | NOT NULL | Tipo de acción (CREATE, UPDATE, DELETE) |
| resource_type | VARCHAR(50) | NOT NULL | Tipo de recurso afectado |
| resource_id | UUID | NULLABLE | ID del recurso |
| entity_type | VARCHAR(50) | NULLABLE | Tipo de entidad (para auditoría más específica) |
| entity_id | UUID | NULLABLE | ID de la entidad |
| clinic_id | UUID | NULLABLE FK → clinics.id | Clínica relacionada |
| actor_type | VARCHAR(50) | NULLABLE | Tipo de actor (PLATFORM_USER, CLINIC_USER, SYSTEM) |
| changes | JSONB | NULLABLE | Cambios realizados en formato JSON |
| metadata | JSONB | NULLABLE | Metadata adicional |
| impersonation_context | JSONB | NULLABLE | Contexto si hay impersonación |
| client_ip | VARCHAR(45) | NULLABLE | IP del cliente |
| user_agent | TEXT | NULLABLE | User Agent del navegador |
| status | VARCHAR(20) | DEFAULT 'SUCCESS' | Estado de la acción |
| error_message | TEXT | NULLABLE | Mensaje de error si falló |
| duration_ms | INTEGER | NULLABLE | Duración de la operación en ms |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Fecha de creación |

**Indexes:**
- (actor_id)
- (resource_type)
- (action)
- (created_at)
- (clinic_id)

---

## Tabla: `subscription_plans`
Planes de suscripción disponibles.

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Identificador único |
| code | VARCHAR(50) | UNIQUE, NOT NULL | Código del plan (STARTER, PRO, etc.) |
| name | VARCHAR(100) | NOT NULL | Nombre del plan |
| description | TEXT | NULLABLE | Descripción |
| price | DECIMAL(10,2) | DEFAULT 0 | Precio del plan |
| currency | VARCHAR(10) | DEFAULT 'MXN' | Moneda |
| billing_period | VARCHAR(20) | DEFAULT 'monthly' | Período de facturación |
| max_staff_users | INTEGER | DEFAULT 5 | Máximo de usuarios staff |
| max_clients | INTEGER | DEFAULT 100 | Máximo de clientes |
| max_pets | INTEGER | DEFAULT 200 | Máximo de mascotas |
| features | JSONB | DEFAULT '[]' | Features incluidas en JSON |
| status | VARCHAR(20) | DEFAULT 'active' | Estado del plan |
| sort_order | INTEGER | DEFAULT 0 | Orden de visualización |
| is_popular | BOOLEAN | DEFAULT false | Marcado como popular |
| created_at | TIMESTAMP | DEFAULT NOW() | Fecha de creación |
| updated_at | TIMESTAMP | DEFAULT NOW() | Fecha de última actualización |

---

## Tabla: `services`
Servicios ofrecidos por cada clínica.

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Identificador único |
| clinic_id | UUID | NOT NULL, FK → clinics.id | Clínica |
| name | VARCHAR | NOT NULL | Nombre del servicio |
| category | VARCHAR | NOT NULL | Categoría del servicio |
| default_duration_minutes | INTEGER | DEFAULT 30 | Duración por defecto |
| is_active | BOOLEAN | DEFAULT true | Si está activo |
| created_at | TIMESTAMP | DEFAULT NOW() | Fecha de creación |
| updated_at | TIMESTAMP | DEFAULT NOW() | Fecha de última actualización |

**Index:** (clinic_id, is_active)

---

## Tabla: `price_lists`
Listas de precios por clínica.

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Identificador único |
| clinic_id | UUID | NOT NULL, FK → clinics.id | Clínica |
| name | VARCHAR | NOT NULL | Nombre de la lista |
| is_default | BOOLEAN | DEFAULT true | Si es la lista por defecto |
| is_active | BOOLEAN | DEFAULT true | Si está activa |
| created_at | TIMESTAMP | DEFAULT NOW() | Fecha de creación |
| updated_at | TIMESTAMP | DEFAULT NOW() | Fecha de última actualización |

**Index:** (clinic_id, is_default)

---

## Tabla: `service_prices`
Precios de servicios en cada lista de precios.

| Columna | Tipo | Constraints | Descripción |
|---------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Identificador único |
| clinic_id | UUID | NOT NULL, FK → clinics.id | Clínica |
| price_list_id | UUID | NOT NULL, FK → price_lists.id | Lista de precios |
| service_id | UUID | NOT NULL, FK → services.id | Servicio |
| price | NUMERIC | NOT NULL | Precio |
| created_at | TIMESTAMP | DEFAULT NOW() | Fecha de creación |
| updated_at | TIMESTAMP | DEFAULT NOW() | Fecha de última actualización |

**Index:** (clinic_id, price_list_id, service_id)

**Unique Constraint:** (clinic_id, price_list_id, service_id)

---

## Diagrama de Relaciones

```
clinics (1) ──────── (n) users
         ├─────────── (n) clients
         ├─────────── (n) animal_types
         ├─────────── (n) pets
         ├─────────── (n) reminders
         ├─────────── (n) message_logs
         ├─────────── (n) whatsapp_outbox
         ├─────────── (n) appointments
         ├─────────── (n) services
         ├─────────── (n) price_lists
         └─────────── (n) subscription_plans

clients (1) ────────── (n) pets
        ├───────────── (n) reminders
        ├───────────── (n) message_logs
        ├───────────── (n) whatsapp_outbox
        └───────────── (n) appointments

pets (1) ────────────── (n) appointments

price_lists (1) ─────── (n) service_prices
                ├────── (n) clients (price_list_id)

services (1) ────────── (n) service_prices

platform_users (n) ──── (n) platform_roles (via platform_user_roles)

audit_logs ←── platform_users (actor_id)
```

---

## Propiedades Multi-Tenancy

Todas las tablas operacionales tienen una columna `clinic_id` para aislamiento de datos:
- ✅ users
- ✅ clients
- ✅ animal_types
- ✅ pets
- ✅ reminders
- ✅ message_logs
- ✅ whatsapp_outbox
- ✅ appointments (implícito via clients)
- ✅ services
- ✅ price_lists
- ✅ service_prices
- ✅ audit_logs

Las tablas de plataforma NO filtran por clinic_id:
- ❌ platform_users (administradores globales)
- ❌ platform_roles (roles globales)
- ❌ platform_user_roles
- ❌ audit_logs (registra todas las acciones)
