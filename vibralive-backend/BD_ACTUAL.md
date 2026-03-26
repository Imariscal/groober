# Estado Actual de la Base de Datos VibraLive

**Fecha de consulta:** 26 de febrero de 2026

---

## Descripción General

- **Motor:** PostgreSQL
- **ORM:** TypeORM
- **Multi-tenant:** Cada clínica es un tenant independiente
- **Tablas principales:**
  - platform_users
  - platform_roles
  - clinics
  - users
  - clients
  - pets
  - animal_types
  - appointments
  - reminders
  - message_logs
  - whatsapp_outbox
  - audit_logs

---

## Entidades y Campos

### PLATFORM_USERS
- id (UUID, PK)
- email (único)
- full_name
- password_hash
- status (INVITED | ACTIVE | DEACTIVATED | SUSPENDED)
- impersonating_clinic_id
- impersonating_user_id
- created_at, updated_at, last_login_at, deactivated_at
- invitation_token, invitation_token_expires_at
- password_reset_token, password_reset_token_expires_at

### PLATFORM_ROLES
- id (UUID, PK)
- key (único)
- name
- description
- permissions (array)
- is_active, is_immutable
- created_at

### CLINICS
- id (UUID, PK)
- name
- phone (único)
- city, country
- whatsapp_account_id, whatsapp_phone_id
- subscription_plan, plan
- status (ACTIVE | SUSPENDED | DELETED)
- max_staff_users, max_clients, max_pets
- active_staff_count, active_clients_count, active_pets_count
- stats_updated_at
- created_at, updated_at

### USERS
- id (UUID, PK)
- clinic_id (FK)
- name
- email (único)
- phone
- hashed_password
- role (superadmin | owner | staff)
- status (INVITED | ACTIVE | DEACTIVATED)
- last_login, deactivated_at, deactivated_by
- invitation_token, invitation_token_expires_at
- password_reset_token, password_reset_token_expires_at
- created_at, updated_at

### CLIENTS
- id (UUID, PK)
- clinic_id (FK)
- name
- phone (único por clínica)
- email
- address
- notes
- created_at, updated_at

### PETS
- id (UUID, PK)
- clinic_id (FK)
- client_id (FK)
- name
- animal_type_id (FK)
- breed
- birth_date
- next_vaccine_date
- next_deworming_date
- notes
- created_at, updated_at

### ANIMAL_TYPES
- id (INT, PK)
- clinic_id (FK)
- name (único por clínica)
- created_at, updated_at

### APPOINTMENTS
- id (UUID, PK)
- clinic_id (FK)
- pet_id (FK)
- client_id (FK)
- scheduled_at
- status (SCHEDULED | CONFIRMED | CANCELLED | COMPLETED)
- reason
- duration_minutes
- veterinarian_id
- notes
- cancelled_at, cancelled_by, cancellation_reason
- created_at, updated_at

### REMINDERS
- id (UUID, PK)
- clinic_id (FK)
- pet_id (FK)
- client_id (FK)
- reminder_type (vaccine | deworming)
- reminder_stage (day7 | day1 | followup24h)
- scheduled_date
- status (pending | sent | confirmed | cancelled | failed)
- message_id
- confirmed_at
- failed_reason
- attempt_count
- last_attempt_at
- created_at, updated_at

### MESSAGE_LOGS
- id (UUID, PK)
- clinic_id (FK)
- reminder_id (FK)
- client_id (FK)
- direction (outbound | inbound)
- message_type (reminder | confirmation | followup | user_message)
- phone_number
- message_body
- whatsapp_message_id
- status (delivered | read | failed | cancelled)
- error_code, error_message
- created_at

### WHATSAPP_OUTBOX
- id (UUID, PK)
- clinic_id (FK)
- client_id (FK, nullable)
- phone_number
- message_body
- status (queued | sent | failed | delivered)
- idempotency_key (único)
- retry_count, max_retries, last_retry_at
- provider_message_id, provider_error
- channel (whatsapp | sms | telegram)
- message_type
- sent_at
- created_at, updated_at

### AUDIT_LOGS
- id (UUID, PK)
- actor_id (FK)
- action (CREATE | READ | UPDATE | DELETE | SUSPEND | ACTIVATE | INVITE | RESET_PASSWORD | IMPERSONATE | IMPERSONATE_END)
- resource_type (clinic | platform_user | clinic_user | role)
- resource_id (UUID)
- clinic_id (nullable)
- changes (JSONB)
- created_at

---

## Relaciones Clave
- Clinic → Users, Clients, Pets, Appointments, Reminders, MessageLogs, WhatsAppOutbox, AnimalTypes
- Client → Pets, Appointments, Reminders, MessageLogs, WhatsAppOutbox
- Pet → Appointments, AnimalType, Reminders
- Reminder → MessageLogs
- PlatformUser → PlatformRoles (M:M)
- PlatformUser → AuditLogs

---

## Índices y Constraints
- UNIQUE: email, phone, idempotency_key, clinic_id+name, clinic_id+phone
- FOREIGN KEY: clinic_id, client_id, pet_id, actor_id, animal_type_id, reminder_id
- CHECK: status, role, plan, reminder_type, reminder_stage, direction, message_type, channel

---

## Diagrama Simplificado

```
PLATFORM_USERS ──M:M── PLATFORM_ROLES
AUDIT_LOGS ──M:1── PLATFORM_USERS

CLINICS ──1:M── USERS, CLIENTS, PETS, APPOINTMENTS, REMINDERS, MESSAGE_LOGS, WHATSAPP_OUTBOX, ANIMAL_TYPES
CLIENTS ──1:M── PETS, APPOINTMENTS, REMINDERS, MESSAGE_LOGS, WHATSAPP_OUTBOX
PETS ──1:M── APPOINTMENTS, REMINDERS
REMINDERS ──1:M── MESSAGE_LOGS
```

---

**Para detalles completos, ver `DATABASE_SCHEMA.md`**
