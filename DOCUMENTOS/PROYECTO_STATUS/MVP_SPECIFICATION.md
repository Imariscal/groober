# 🚀 Especificación MVP - VibraLive SaaS

**Fecha:** Febrero 2026  
**Enfoque:** Lógica de negocio + aislamiento tenant mínimo  
**Restricción:** ❌ NO a 2FA, encriptación at-rest, rate limiting  
**Objetivo:** MVP funcional en 2-4 sprints  

---

## A) ALCANCE MVP vs POST-MVP

### ✅ MVP MUST (10-15 ítems)

| ID | Funcionalidad | Descripción | Prioridad |
|----|------------------------------------|---|---|
| 1  | **Auth básica (JWT)** | Login/Register. Roles simples: ClinicAdmin, Staff | P0 |
| 2  | **Clinic CRUD** | Crear clínica. Statustar: ACTIVE/SUSPENDED. | P0 |
| 3  | **Users per-clinic** | Crear, listar, desactivar usuarios dentro de clínica | P0 |
| 4  | **Clients (Owners) CRUD** | Crear dueños de mascotas. Validar unicidad por teléfono/clínica | P0 |
| 5  | **Pets CRUD** | Crear, editar, listar mascotas por cliente. Relación: Pet→Client→Clinic | P0 |
| 6  | **Appointments CRUD** | Estados: Scheduled/Confirmed/Cancelled/Completed. Filtrable por clinic | P0 |
| 7  | **Appointment status update** | Cambiar estado cita. Log en AuditLog | P0 |
| 8  | **WhatsApp Outbox mínimo** | Tabla `whatsapp_outbox` con estados: queued/sent/failed | P1 |
| 9  | **WhatsApp enqueue** | API endpoint para encolar mensajes (sin validar envío real aún) | P1 |
| 10 | **WhatsApp worker cron** | Job cada 30s que procesa cola (placeholder sin proveedor real) | P1 |
| 11 | **AuditLog crítico** | Registrar: crear clinic, crear user, cambio status cita, envío WhatsApp | P1 |
| 12 | **CurrentClinicId extractor** | Decorator/Middleware que obtiene clinic_id del JWT. Nunca del body | P0 |
| 13 | **TenantGuard básico** | Guard que valida `clinic.status != SUSPENDED` | P1 |
| 14 | **Data seeding** | Clínica + Users + Clients + Pets de prueba para development | P1 |
| 15 | **CORS + básicas** | Configurar CORS. Validación DTO mínima (email, teléfono formato) | P1 |

### 🎯 POST-MVP SHOULD (deja para después)

| ID | Funcionalidad | Razón |
|----|---------------|-------|
| A  | 2FA / MFA | Puede esperar. No es crítico para MVP. |
| B  | Rate limiting advanced | Implementar después. Para MVP bastaco CORS. |
| C  | Encryption at-rest | Overkill. Datos en PostgreSQL plain text OK para MVP. |
| D  | Field-level permissions | No. Roles simples (ClinicAdmin/Staff) suficienten. |
| E  | API key + OAuth2 | MVP solo JWT. OAuth2 para futuro. |
| F  | Whatsapp integración real (Meta/Twilio) | Usar placeholders. Integración real es tarea 2.0. |
| G  | Reminders automáticos | Nice-to-have. Postpone. |
| H  | SMS + Telegram | MVP solo WhatsApp. Expandir después. |
| I  | Webhooks terceros | No. Post-MVP. |
| J  | Dashboard analytics | MVP no. Solo CRUD. |

---

## B) MODELO DE DATOS (TypeORM Entities)

### 1. **Clinic** (Tenant root)
```typescript
// vibralive-backend/src/database/entities/clinic.entity.ts
@Entity('clinics')
@Index(['id', 'status'])  // Para filtraje rápido de activas
export class Clinic {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 20 })
  phone: string; // Teléfono de la clínica

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string;

  @Column({ type: 'varchar', length: 100, default: 'MX' })
  country: string;

  @Column({ type: 'varchar', length: 50, default: 'STARTER' })
  subscriptionPlan: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';

  @Column({
    type: 'varchar',
    length: 20,
    default: 'ACTIVE',
  })
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED';

  @Column({ type: 'timestamp', nullable: true })
  suspendedAt: Date | null;

  @Column({ type: 'uuid', nullable: true })
  suspendedBy: string | null; // User ID who suspended

  @Column({ type: 'text', nullable: true })
  suspensionReason: string | null;

  // WhatsApp credentials (opcional para MVP, obligatorio post-MVP)
  @Column({ type: 'varchar', length: 100, nullable: true })
  whatsappAccountId: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  whatsappPhoneId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => User, (user) => user.clinic)
  users: User[];

  @OneToMany(() => Client, (client) => client.clinic)
  clients: Client[];

  @OneToMany(() => Pet, (pet) => pet.clinic)
  pets: Pet[];

  @OneToMany(() => Appointment, (appt) => appt.clinic)
  appointments: Appointment[];

  @OneToMany(() => WhatsAppOutbox, (msg) => msg.clinic)
  whatsappMessages: WhatsAppOutbox[];

  @OneToMany(() => AuditLog, (log) => log.clinic)
  auditLogs: AuditLog[];
}
```

### 2. **User** (Staff/Admin per clinic)
```typescript
// Existing, pero aclarado para MVP:
@Entity('users')
@Index(['clinic_id', 'email']) // Para búsquedas rápidas por clínica
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  clinic_id: string; // ⚠️ OBLIGATORIO EN MVP. No NULL.

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 255 })
  hashedPassword: string; // bcrypt

  @Column({ type: 'varchar', length: 30 })
  role: 'CLINIC_ADMIN' | 'STAFF'; // MVP solo estos 2

  @Column({ type: 'varchar', length: 20, default: 'ACTIVE' })
  status: 'INVITED' | 'ACTIVE' | 'DEACTIVATED';

  @Column({ type: 'timestamp', nullable: true })
  lastLogin: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  deactivatedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Clinic, (clinic) => clinic.users, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'clinic_id' })
  clinic: Clinic;
}
```

### 3. **Client** (Owner / Dueño de mascotas)
```typescript
// Existing + ajustes MVP:
@Entity('clients')
@Unique(['clinic_id', 'phone']) // Un teléfono por clínica
@Index(['clinic_id', 'created_at']) // Para listar por clínica
export class Client {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  clinic_id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 20 })
  phone: string; // Teléfono del dueño

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  address: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Clinic, (clinic) => clinic.clients, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'clinic_id' })
  clinic: Clinic;

  @OneToMany(() => Pet, (pet) => pet.client)
  pets: Pet[];

  @OneToMany(() => Appointment, (appt) => appt.client)
  appointments: Appointment[];

  @OneToMany(() => WhatsAppOutbox, (msg) => msg.client)
  whatsappMessages: WhatsAppOutbox[];
}
```

### 4. **Pet**
```typescript
// Existing + ajustes:
@Entity('pets')
@Index(['clinic_id', 'client_id'])
@Index(['clinic_id', 'created_at'])
export class Pet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  clinic_id: string;

  @Column({ type: 'uuid' })
  client_id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'integer' })
  animal_type_id: number; // FK a AnimalType

  @Column({ type: 'varchar', length: 100, nullable: true })
  breed: string;

  @Column({ type: 'date', nullable: true })
  birth_date: string; // YYYY-MM-DD

  @Column({ type: 'varchar', length: 20, default: 'MALE' })
  gender: 'MALE' | 'FEMALE' | 'UNKNOWN';

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  weight_kg: number; // Para cálculo de dosis

  @Column({ type: 'date', nullable: true })
  next_vaccine_date: string;

  @Column({ type: 'date', nullable: true })
  next_deworming_date: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Clinic, (clinic) => clinic.pets, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'clinic_id' })
  clinic: Clinic;

  @ManyToOne(() => Client, (client) => client.pets, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @OneToMany(() => Appointment, (appt) => appt.pet)
  appointments: Appointment[];
}
```

### 5. **Appointment** ⭐ NUEVA
```typescript
// vibralive-backend/src/database/entities/appointment.entity.ts
@Entity('appointments')
@Index(['clinic_id', 'status'])
@Index(['clinic_id', 'scheduled_at'])
@Index(['clinic_id', 'created_at'])
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  clinic_id: string;

  @Column({ type: 'uuid' })
  pet_id: string;

  @Column({ type: 'uuid' })
  client_id: string;

  @Column({ type: 'timestamp' })
  scheduled_at: Date; // Fecha/hora agendada

  @Column({ type: 'varchar', length: 50, default: 'SCHEDULED' })
  status: 'SCHEDULED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

  @Column({ type: 'text', nullable: true })
  reason: string; // Motivo de la cita (ej: "Vacuna", "Revisión")

  @Column({ type: 'integer', nullable: true })
  duration_minutes: number; // Duración estimada

  @Column({ type: 'uuid', nullable: true })
  veterinarian_id: string; // User ID si asignado

  @Column({ type: 'text', nullable: true })
  notes: string; // Notas post-cita

  @Column({ type: 'timestamp', nullable: true })
  cancelled_at: Date | null;

  @Column({ type: 'uuid', nullable: true })
  cancelled_by: string | null; // User ID

  @Column({ type: 'varchar', length: 500, nullable: true })
  cancellation_reason: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Clinic, (clinic) => clinic.appointments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'clinic_id' })
  clinic: Clinic;

  @ManyToOne(() => Pet, (pet) => pet.appointments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'pet_id' })
  pet: Pet;

  @ManyToOne(() => Client, (client) => client.appointments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'client_id' })
  client: Client;
}
```

### 6. **WhatsAppOutbox** ⭐ NUEVA (Outbox Pattern)
```typescript
// vibralive-backend/src/database/entities/whatsapp-outbox.entity.ts
@Entity('whatsapp_outbox')
@Index(['clinic_id', 'status'])
@Index(['clinic_id', 'created_at'])
@Index(['idempotency_key']) // Para evitar duplicados
@Index(['retry_count', 'status']) // Para procesar reintentos
export class WhatsAppOutbox {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  clinic_id: string;

  @Column({ type: 'uuid', nullable: true })
  client_id: string | null; // Puede ser null si es mensaje genérico

  @Column({ type: 'varchar', length: 20 })
  phone_number: string; // E.164 format: +525512345678

  @Column({ type: 'text' })
  message_body: string;

  @Column({ type: 'varchar', length: 50, default: 'queued' })
  status: 'queued' | 'sent' | 'failed' | 'delivered';

  // Idempotencia
  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  idempotency_key: string | null; // UUID generado por cliente

  // Reintentos
  @Column({ type: 'integer', default: 0 })
  retry_count: number;

  @Column({ type: 'integer', default: 5 })
  max_retries: number;

  @Column({ type: 'timestamp', nullable: true })
  last_retry_at: Date | null;

  // Proveedor
  @Column({ type: 'varchar', length: 100, nullable: true })
  provider_message_id: string | null; // ID del proveedor (Twilio/Meta)

  @Column({ type: 'text', nullable: true })
  provider_error: string | null; // Último error

  @Column({ type: 'varchar', length: 50, default: 'whatsapp' })
  channel: 'whatsapp' | 'sms' | 'telegram'; // Para futuro

  @Column({ type: 'varchar', length: 50, nullable: true })
  message_type: string; // 'reminder', 'confirmation', 'notification', etc

  // Timestamps
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  sent_at: Date | null;

  // Relations
  @ManyToOne(() => Clinic, (clinic) => clinic.whatsappMessages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'clinic_id' })
  clinic: Clinic;

  @ManyToOne(() => Client, (client) => client.whatsappMessages, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'client_id' })
  client: Client | null;
}
```

### 7. **AuditLog** (CRÍTICO MVP - Minimal)
```typescript
// Existing, validar campos:
@Entity('audit_logs')
@Index(['clinic_id', 'created_at'])
@Index(['clinic_id', 'action'])
@Index(['resource_type', 'resource_id'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  clinic_id: string;

  @Column({ type: 'uuid' })
  actor_id: string; // User ID who did it

  @Column({
    type: 'varchar',
    length: 50,
  })
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'SUSPEND' | 'CONFIRM' | 'CANCEL' | 'SEND_MESSAGE';

  @Column({ type: 'varchar', length: 50 })
  resource_type: 'clinic' | 'user' | 'client' | 'pet' | 'appointment' | 'whatsapp_message';

  @Column({ type: 'uuid' })
  resource_id: string;

  @Column({ type: 'jsonb', nullable: true })
  changes: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  } | null;

  @Column({ type: 'varchar', length: 45, nullable: true })
  client_ip: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => Clinic, (clinic) => clinic.auditLogs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'clinic_id' })
  clinic: Clinic;
}
```

---

## C) REGLAS DE NEGOCIO MÍNIMAS

### R1: Aislamiento Tenant (OBLIGATORIO)
- ✅ Toda entidad "clinic-own" tiene `clinic_id`
- ✅ Todas las queries filtran `WHERE clinic_id = ?`
- ✅ `clinic_id` extraído del JWT, **NUNCA** del body/query
- ✅ Guard `TenantGuard` valida `clinic.status != SUSPENDED`

### R2: Clínica
- ✅ Status debe ser ACTIVE para operar (crear users, clients, etc)
- ✅ Si SUSPENDED → todos los endpoints protegidos fallan con 403
- ✅ Fields: name, phone (único globalmente), city, subscriptionPlan, status

### R3: Usuarios por Clínica
- ✅ No permitir crear User si `clinic.status == SUSPENDED or DELETED`
- ✅ Email único globalmente (restricción DB)
- ✅ Roles MVP: `CLINIC_ADMIN` (full access), `STAFF` (read + create appointed)
- ✅ Al crear User → status = `INVITED` (si es implementación futura)
- ✅ Desactivación blanda: `status = DEACTIVATED`, `deactivatedAt` timestamp

### R4: Clientes (Owners)
- ✅ Teléfono único **por clínica** (no globalmente): `UNIQUE(clinic_id, phone)`
- ✅ Validar formato E.164 teléfono: `^\\+[1-9]\\d{1,14}$`
- ✅ Email opcional, pero si existe debe ser válido
- ✅ Campo `notes` para anotaciones del staff

### R5: Mascotas (Pets)
- ✅ Belongs to: Client → Clinic
- ✅ No puede crearse si Client está deleted
- ✅ Campos: name, breed, birth_date, weight, animal_type
- ✅ Campos opcionales para MVP: next_vaccine_date, next_deworming_date

### R6: Citas (Appointments) ⭐ NUEVA
- ✅ Status estados: → `SCHEDULED` (inicial)
  - → `CONFIRMED` (staff confirma)
  - → `CANCELLED` (staff cancela)
  - → `COMPLETED` (después de pasar `scheduled_at`)
  
- ✅ No permitir cambiar status si clinic SUSPENDED
- ✅ Cancel requiere `cancellation_reason` (audit trail)
- ✅ `scheduled_at` debe ser en futuro al crear
- ✅ Log en AuditLog cada cambio de status

### R7: WhatsApp MVP ⭐ NUEVA
- ✅ Idempotency: `idempotency_key` generado por cliente (UUID v4)
  - Si key duplicada → retornar 409 Conflict (no reenviar)
- ✅ Status flow: `queued` → `sent`/`failed`
  - retry máximo N veces (default 5)
  - esperar incremental: 1s, 2s, 4s, 8s, 16s
- ✅ Placeholder para proveedor (no integrar real en MVP)
- ✅ Log en AuditLog eventos: sent/failed después de intentos

### R8: AuditLog (Crítico solamente)
- ✅ Registrar SOLO:
  - Crear Clinic
  - Crear User
  - Cambiar status Appointment
  - Enviar WhatsApp (cada intento fallido/éxito)
- ✅ NO registrar: GET, simple UPDATE no crítico
- ✅ Campos: clinic_id, actor_id, action, resource_type, resource_id, createdAt

---

## D) ENDPOINTS REST MÍNIMOS

### 📋 MÓDULO: CLINICS

| # | Método | Ruta | Requerido | Auth | Body/Query | Response | Audit |
|---|--------|------|----------|------|-----------|----------|-------|
| C1 | POST | `/clinics` | ✅ | ❌ | `{name, phone, city?, country?}` | `{id, name, status, createdAt}` | ✅ CREATE |
| C2 | GET | `/clinics/:id` | ✅ | ✅ JWT | - | `{id, name, phone, status, subscriptionPlan, users_count}` | - |
| C3 | PATCH | `/clinics/:id/status` | ✅ | ✅ JWT (SuperAdmin) | `{status, reason?}` | `{id, status, suspendedAt}` | ✅ SUSPEND |
| C4 | GET | `/clinics` | ✅ | ✅ JWT (SuperAdmin) | `?page, ?limit` | `[{id, name, status, created}...]` | - |

**Notas:**
- C1: Crear clínica (public endpoint, para onboarding)
- C2: Ver detalles de la clínica actual (desde JWT `clinic_id`)
- C3: Suspender clínica (solo superadmin, simular con hardcoded check)
- C4: Listar clínicas (solo superadmin)

---

### 👥 MÓDULO: USERS

| # | Método | Ruta | Requerido | Auth | Body/Query | Response | Audit |
|---|--------|------|----------|------|-----------|----------|-------|
| U1 | POST | `/users` | ✅ | ✅ JWT (CLINIC_ADMIN) | `{name, email, phone?, role, password?}` | `{id, name, email, role, status}` | ✅ CREATE |
| U2 | GET | `/users` | ✅ | ✅ JWT | `?clinic_id*, ?page, ?limit` | `[{id, name, email, role, status}...]` | - |
| U3 | GET | `/users/:id` | ✅ | ✅ JWT | - | `{id, name, email, role, status, lastLogin}` | - |
| U4 | PATCH | `/users/:id` | ✅ | ✅ JWT (self or ADMIN) | `{name?, email?, phone?}` | `{id, ...updated}` | - |
| U5 | PATCH | `/users/:id/deactivate` | ✅ | ✅ JWT (CLINIC_ADMIN) | `{}` | `{id, status: DEACTIVATED}` | ✅ UPDATE |

**Notas:**
- U1: Crear user (verifica clinic.status != SUSPENDED)
- U2: Listar users de la clínica actual (clinic_id del JWT)
- U3: Ver detalles user
- U4: Editar perfil (self)
- U5: Desactivar user (soft delete)

---

### 🐕 MÓDULO: CLIENTS (Owners)

| # | Método | Ruta | Requerido | Auth | Body/Query | Response | Audit |
|---|--------|------|----------|------|-----------|----------|-------|
| CL1 | POST | `/clients` | ✅ | ✅ JWT | `{name, phone, email?, address?, notes?}` | `{id, name, phone, email, created}` | - |
| CL2 | GET | `/clients` | ✅ | ✅ JWT | `?clinic_id*, ?search, ?page` | `[{id, name, phone, pets_count}...]` | - |
| CL3 | GET | `/clients/:id` | ✅ | ✅ JWT | - | `{id, name, phone, email, address, pets: [{...}]}` | - |
| CL4 | PUT | `/clients/:id` | ✅ | ✅ JWT | `{name, phone, email?, address?}` | `{id, ...updated}` | - |
| CL5 | DELETE | `/clients/:id` | ✅ | ✅ JWT | - | `{id}` (soft delete) | - |

**Notas:**
- CL1: Crear owner (validar phone E.164, único por clinic)
- CL2: Listar clientes de la clínica (clinic_id del JWT)
- CL3: Ver detalles + mascotas
- CL4: Editar
- CL5: Eliminar (marcar soft delete)

---

### 🐾 MÓDULO: PETS

| # | Método | Ruta | Requerido | Auth | Body/Query | Response | Audit |
|---|--------|------|----------|------|-----------|----------|-------|
| P1 | POST | `/pets` | ✅ | ✅ JWT | `{client_id, name, animal_type_id, breed?, birth_date?, gender?, weight_kg?, notes?}` | `{id, name, breed, client: {name}}` | - |
| P2 | GET | `/pets` | ✅ | ✅ JWT | `?client_id*, ?clinic_id*, ?page` | `[{id, name, breed, client_id, animal_type}...]` | - |
| P3 | GET | `/pets/:id` | ✅ | ✅ JWT | - | `{id, name, breed, animal_type, appointments: [...]}` | - |
| P4 | PUT | `/pets/:id` | ✅ | ✅ JWT | `{name?, breed?, birth_date?, weight_kg?}` | `{id, ...updated}` | - |
| P5 | DELETE | `/pets/:id` | ✅ | ✅ JWT | - | `{id}` | - |

**Notas:**
- P1: Crear mascota (clinic_id obtenido del JWT)
- P2: Listar mascotas de la clínica
- P3: Ver detalles + citas relacionadas
- P4: Editar
- P5: Eliminar

---

### 📅 MÓDULO: APPOINTMENTS ⭐ NUEVA

| # | Método | Ruta | Requerido | Auth | Body/Query | Response | Audit |
|---|--------|------|----------|------|-----------|----------|-------|
| A1 | POST | `/appointments` | ✅ | ✅ JWT | `{pet_id, client_id, scheduled_at, reason?, duration_minutes?, veterinarian_id?}` | `{id, pet: {name}, status: SCHEDULED, scheduled_at}` | - |
| A2 | GET | `/appointments` | ✅ | ✅ JWT | `?clinic_id*, ?status, ?client_id, ?page, ?date_from, ?date_to` | `[{id, pet, client, status, scheduled_at}...]` | - |
| A3 | GET | `/appointments/:id` | ✅ | ✅ JWT | - | `{id, pet, client, status, scheduled_at, notes}` | - |
| A4 | PATCH | `/appointments/:id/status` | ✅ | ✅ JWT (STAFF+) | `{status: [CONFIRMED\|CANCELLED\|COMPLETED], cancellation_reason?}` | `{id, status, updated_at}` | ✅ UPDATE |
| A5 | PUT | `/appointments/:id` | ✅ | ✅ JWT | `{scheduled_at?, reason?, veterinarian_id?}` | `{id, ...updated}` | - |

**Notas:**
- A1: Crear cita (validar `scheduled_at` > now)
- A2: Listar citas filtrables por status/client/rango fechas
- A3: Ver detalles
- A4: Cambiar status → **MUST LOG** en AuditLog
- A5: Editar detalles (no status)

---

### 💬 MÓDULO: WHATSAPP ⭐ NUEVA

| # | Método | Ruta | Requerido | Auth | Body/Query | Response | Audit |
|---|--------|------|----------|------|-----------|----------|-------|
| W1 | POST | `/whatsapp/send` | ✅ | ✅ JWT | `{phone_number, message_body, client_id?, idempotency_key?, message_type?}` | `{id, status: queued, idempotency_key}` | - |
| W2 | GET | `/whatsapp/outbox` | ✅ | ✅ JWT (ADMIN) | `?clinic_id*, ?status, ?page` | `[{id, phone, status, retry_count, created_at}...]` | - |
| W3 | GET | `/whatsapp/outbox/:id` | ✅ | ✅ JWT (ADMIN) | - | `{id, phone, message_body, status, provider_message_id, provider_error}` | - |
| W4 | PATCH | `/whatsapp/outbox/:id/retry` | ✅ | ✅ JWT (ADMIN) | `{}` | `{id, status: queued, retry_count}` | - |

**Notas:**
- W1: Encolar mensaje (idempotency_key evita duplicados)
- W2: Listar outbox (solo ADMIN)
- W3: Ver detalles
- W4: Reintentar envío (reset status a queued)

---

### 🔐 MÓDULO: AUTH

| # | Método | Ruta | Requerido | Auth | Body | Response | Audit |
|---|--------|------|----------|------|------|----------|-------|
| AU1 | POST | `/auth/login` | ✅ | ❌ | `{email, password}` | `{access_token, user: {id, role, clinic_id}, clinic: {id, name}}` | - |
| AU2 | POST | `/auth/register` | ✅ | ❌ | `{clinic_name, clinic_phone, owner_name, owner_email, password}` | `{clinic: {id}, user: {id, role}}` | ✅ CREATE |
| AU3 | POST | `/auth/logout` | ✅ | ✅ JWT | `{}` | `{ok: true}` | - |

---

## E) ARQUITECTURA DE CÓDIGO (Simple y Ejecutable)

### 📁 Estructura Carpetas (NestJS Modular)

```
vibralive-backend/src/
├── common/
│   ├── decorators/
│   │   ├── current-clinic.decorator.ts  ⭐ NUEVA
│   │   ├── current-user.decorator.ts
│   │   ├── index.ts
│   │   └── ...
│   ├── guards/
│   │   ├── tenant.guard.ts  ⭐ NUEVA
│   │   ├── auth.guard.ts
│   │   └── ...
│   ├── filters/
│   │   ├── validation-exception.filter.ts
│   │   └── ...
│   └── middleware/
│       ├── clinic-id.middleware.ts  ⭐ NUEVA
│       └── ...
│
├── modules/
│   ├── appointments/  ⭐ NUEVA MÓDULO
│   │   ├── appointments.controller.ts
│   │   ├── appointments.service.ts
│   │   ├── appointments.module.ts
│   │   ├── dtos/
│   │   │   ├── create-appointment.dto.ts
│   │   │   ├── update-appointment.dto.ts
│   │   │   ├── update-status.dto.ts
│   │   │   └── index.ts
│   │   └── repositories/
│   │       └── appointments.repository.ts
│   │
│   ├── whatsapp/  ⭐ NUEVA MÓDULO
│   │   ├── whatsapp.controller.ts
│   │   ├── whatsapp.service.ts (enqueue)
│   │   ├── whatsapp-worker.service.ts (procesador)
│   │   ├── whatsapp.module.ts
│   │   ├── dtos/
│   │   │   ├── send-message.dto.ts
│   │   │   └── index.ts
│   │   └── repositories/
│   │       └── whatsapp-outbox.repository.ts
│   │
│   ├── clients/
│   │   ├── clients.controller.ts
│   │   ├── clients.service.ts
│   │   ├── clients.module.ts
│   │   ├── dtos/
│   │   │   └── ...
│   │   └── repositories/
│   │       └── clients.repository.ts
│   │
│   ├── pets/
│   │   ├── pets.controller.ts
│   │   ├── pets.service.ts
│   │   ├── pets.module.ts
│   │   ├── dtos/
│   │   │   └── ...
│   │   └── repositories/
│   │       └── pets.repository.ts
│   │
│   ├── clinics/
│   │   ├── clinics.controller.ts
│   │   ├── clinics.service.ts
│   │   ├── clinics.module.ts
│   │   └── ...
│   │
│   ├── users/
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── users.module.ts
│   │   └── ...
│   │
│   └── auth/
│       ├── auth.controller.ts
│       ├── auth.service.ts
│       ├── auth.module.ts
│       └── ...
│
├── database/
│   ├── entities/
│   │   ├── appointment.entity.ts  ⭐ NUEVA
│   │   ├── whatsapp-outbox.entity.ts  ⭐ NUEVA
│   │   ├── ...existing...
│   │   └── index.ts
│   ├── migrations/
│   │   └── ...
│   ├── seeds/
│   │   └── ...
│   └── data-source.ts
│
├── app.module.ts
└── main.ts
```

---

### 🔑 Patrones Clave

#### 1️⃣ **CurrentClinicId Decorator** (Extrae clinic_id del JWT)
```typescript
// src/common/decorators/current-clinic.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentClinicId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    // clinic_id viene del JWT decodificado
    return request.user?.clinic_id;
  },
);

// En controller:
@Get()
@UseGuards(AuthGuard('jwt'), TenantGuard)
async findAll(@CurrentClinicId() clinicId: string) {
  return this.clientsService.findByClinic(clinicId);
}
```

#### 2️⃣ **TenantGuard** (Valida clinic.status != SUSPENDED)
```typescript
// src/common/guards/tenant.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { getRepository } from 'typeorm';
import { Clinic } from '../../database/entities/clinic.entity';

@Injectable()
export class TenantGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const clinicId = request.user?.clinic_id;

    if (!clinicId) throw new ForbiddenException('No clinic_id in token');

    const clinic = await getRepository(Clinic).findOne({
      where: { id: clinicId },
    });

    if (!clinic || clinic.status !== 'ACTIVE') {
      throw new ForbiddenException('Clinic is suspended or inactive');
    }

    request.clinic = clinic;
    return true;
  }
}
```

#### 3️⃣ **Repository Pattern con Tenant Scoping**
```typescript
// src/modules/clients/repositories/clients.repository.ts
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Client } from '../../../database/entities/client.entity';

@Injectable()
export class ClientsRepository {
  constructor(
    @InjectRepository(Client)
    private readonly repo: Repository<Client>,
  ) {}

  async findByClinic(clinicId: string, page: number = 1, limit: number = 20) {
    return this.repo.find({
      where: { clinic_id: clinicId },
      skip: (page - 1) * limit,
      take: limit,
      order: { created_at: 'DESC' },
    });
  }

  async findByClinicAndId(clinicId: string, clientId: string) {
    return this.repo.findOne({
      where: { clinic_id: clinicId, id: clientId },
      relations: ['pets'],
    });
  }

  async createForClinic(clinicId: string, data: any) {
    return this.repo.save({
      ...data,
      clinic_id: clinicId,
    });
  }
}
```

#### 4️⃣ **Service con Auditoría**
```typescript
// src/modules/appointments/appointments.service.ts
import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { AppointmentsRepository } from './repositories/appointments.repository';
import { AuditLogService } from '../audit-log/audit-log.service'; // Asumiendo módulo
import { UpdateStatusDto } from './dtos/update-status.dto';

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly appointmentsRepo: AppointmentsRepository,
    private readonly auditLog: AuditLogService,
  ) {}

  async findByClinic(clinicId: string, filters: any) {
    return this.appointmentsRepo.findByClinic(clinicId, filters);
  }

  async updateStatus(
    clinicId: string,
    appointmentId: string,
    dto: UpdateStatusDto,
    userId: string,
  ) {
    const appointment = await this.appointmentsRepo.findByClinicAndId(
      clinicId,
      appointmentId,
    );

    if (!appointment) {
      throw new ForbiddenException('Appointment not found in clinic');
    }

    const oldStatus = appointment.status;
    appointment.status = dto.status;
    
    if (dto.status === 'CANCELLED') {
      appointment.cancelled_at = new Date();
      appointment.cancelled_by = userId;
      appointment.cancellation_reason = dto.cancellation_reason;
    }

    const updated = await this.appointmentsRepo.save(appointment);

    // ⭐ AuditLog CRÍTICO
    await this.auditLog.create({
      clinic_id: clinicId,
      actor_id: userId,
      action: 'UPDATE',
      resource_type: 'appointment',
      resource_id: appointmentId,
      changes: {
        before: { status: oldStatus },
        after: { status: dto.status },
      },
    });

    return updated;
  }
}
```

#### 5️⃣ **WhatsApp Service (Enqueue)**
```typescript
// src/modules/whatsapp/whatsapp.service.ts
import { Injectable, ConflictException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { WhatsAppOutboxRepository } from './repositories/whatsapp-outbox.repository';
import { AuditLogService } from '../audit-log/audit-log.service';
import { SendMessageDto } from './dtos/send-message.dto';

@Injectable()
export class WhatsAppService {
  constructor(
    private readonly outboxRepo: WhatsAppOutboxRepository,
    private readonly auditLog: AuditLogService,
  ) {}

  async enqueueMessage(
    clinicId: string,
    dto: SendMessageDto,
    userId: string,
  ) {
    // Idempotencia
    const existingKey = await this.outboxRepo.findByIdempotencyKey(
      dto.idempotency_key,
    );
    if (existingKey) {
      throw new ConflictException('Message already queued with this key');
    }

    // Crear registro
    const message = await this.outboxRepo.create({
      clinic_id: clinicId,
      phone_number: dto.phone_number,
      message_body: dto.message_body,
      client_id: dto.client_id,
      idempotency_key: dto.idempotency_key || uuidv4(),
      message_type: dto.message_type || 'notification',
      status: 'queued',
      retry_count: 0,
      max_retries: 5,
    });

    // Log
    await this.auditLog.create({
      clinic_id: clinicId,
      actor_id: userId,
      action: 'CREATE',
      resource_type: 'whatsapp_message',
      resource_id: message.id,
    });

    return { id: message.id, status: 'queued', idempotency_key: message.idempotency_key };
  }
}
```

#### 6️⃣ **WhatsApp Worker (Cron Job)**
```typescript
// src/modules/whatsapp/whatsapp-worker.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WhatsAppOutboxRepository } from './repositories/whatsapp-outbox.repository';

@Injectable()
export class WhatsAppWorkerService {
  private readonly logger = new Logger(WhatsAppWorkerService.name);

  constructor(
    private readonly outboxRepo: WhatsAppOutboxRepository,
    private readonly auditLog: AuditLogService,
  ) {}

  // Ejecutar cada 30 segundos
  @Cron(CronExpression.EVERY_30_SECONDS)
  async processQueue() {
    this.logger.debug('Processing WhatsApp outbox...');

    // Buscar mensajes queued con retry_count < max_retries
    const messages = await this.outboxRepo.findQueued();

    for (const msg of messages) {
      try {
        // ⭐ PLACEHOLDER: integración real con Twilio/Meta aquí
        const success = await this.sendWithProvider(msg);

        if (success) {
          msg.status = 'sent';
          msg.sent_at = new Date();
          msg.provider_message_id = 'MOCK_ID_' + Date.now(); // Simular
        } else {
          msg.retry_count++;
          if (msg.retry_count >= msg.max_retries) {
            msg.status = 'failed';
          } else {
            msg.last_retry_at = new Date();
            // status sigue en "queued"
          }
        }

        await this.outboxRepo.save(msg);

        // Log del resultado
        await this.auditLog.create({
          clinic_id: msg.clinic_id,
          actor_id: 'SYSTEM',
          action: 'SEND_MESSAGE',
          resource_type: 'whatsapp_message',
          resource_id: msg.id,
          changes: {
            after: { status: msg.status, provider_message_id: msg.provider_message_id },
          },
        });
      } catch (error) {
        this.logger.error(`Error processing message ${msg.id}:`, error);
        msg.retry_count++;
        msg.provider_error = error.message;
        await this.outboxRepo.save(msg);
      }
    }
  }

  private async sendWithProvider(message: WhatsAppOutbox): Promise<boolean> {
    // PLACEHOLDER: Integración real aquí
    // Por ahora, simular que funciona el 80% de las veces
    return Math.random() > 0.2;
  }
}
```

---

### 🏗️ Module Boilerplate (Appointments)

```typescript
// src/modules/appointments/appointments.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentsController } from './appointments.controller.ts';
import { AppointmentsService } from './appointments.service';
import { AppointmentsRepository } from './repositories/appointments.repository';
import { Appointment } from '../../database/entities/appointment.entity';
import { AuditLogModule } from '../audit-log/audit-log.module'; // Asumiendo

@Module({
  imports: [TypeOrmModule.forFeature([Appointment]), AuditLogModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, AppointmentsRepository],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
```

```typescript
// src/modules/appointments/appointments.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentClinicId } from '../../common/decorators/current-clinic.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dtos/create-appointment.dto';
import { UpdateStatusDto } from './dtos/update-status.dto';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), TenantGuard)
  async create(
    @CurrentClinicId() clinicId: string,
    @Body() dto: CreateAppointmentDto,
  ) {
    return this.appointmentsService.create(clinicId, dto);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), TenantGuard)
  async findAll(
    @CurrentClinicId() clinicId: string,
    @Query() filters: any,
  ) {
    return this.appointmentsService.findByClinic(clinicId, filters);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), TenantGuard)
  async findOne(
    @CurrentClinicId() clinicId: string,
    @Param('id') appointmentId: string,
  ) {
    return this.appointmentsService.findByClinicAndId(clinicId, appointmentId);
  }

  @Patch(':id/status')
  @UseGuards(AuthGuard('jwt'), TenantGuard)
  async updateStatus(
    @CurrentClinicId() clinicId: string,
    @Param('id') appointmentId: string,
    @Body() dto: UpdateStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.appointmentsService.updateStatus(
      clinicId,
      appointmentId,
      dto,
      user.id,
    );
  }
}
```

---

## F) WHATSAPP MVP (Outbox Pattern)

### 📊 Diagrama Flujo

```
┌─────────────────┐
│  Cliente API    │
│  (POST /send)   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│ 1. Validar Idempotency Key      │
│ 2. Crear WhatsAppOutbox(queued) │
│ 3. Log en AuditLog              │
│ 4. Responder 202 Accepted       │
└────────┬────────────────────────┘
         │
         ▼
    ┌─────────────────┐
    │  WhatsApp DB    │
    │  (outbox table) │
    └─────────────────┘
         │
         │ (Poller Cron cada 30s)
         │
         ▼
┌─────────────────────────────────┐
│ WhatsAppWorkerService           │
│ 1. Buscar status=queued         │
│ 2. Llamar provider (Twilio/Meta)│  ⭐ PLACEHOLDER
│ 3. Actualizar status            │
│ 4. Log resultado                │
└─────────────────────────────────┘
         │
         ├─ SENT? ──────────────────┐
         │                          │
         ├─ FAILED + reinyo? ───┐   │
         │                      │   │
         └─ FAILED + max retry  │   │
                                │   │
                            YES / NO
                                │   │
                                ▼   ▼
                         ┌──────────┐
                         │   DB     │
                         │ updated  │
                         └──────────┘
```

### 📝 DTOs Mínimos

```typescript
// src/modules/whatsapp/dtos/send-message.dto.ts
import { IsPhoneNumber, IsNotEmpty, IsOptional, IsUUID, Length } from 'class-validator';

export class SendMessageDto {
  @IsPhoneNumber('MX') // O tu país
  phone_number: string; // E.164: +525512345678

  @IsNotEmpty()
  @Length(1, 4096)
  message_body: string;

  @IsOptional()
  @IsUUID()
  client_id?: string; // Referencia al cliente

  @IsOptional()
  idempotency_key?: string; // UUID opcional. Si no, generar server-side

  @IsOptional()
  message_type?: string; // 'reminder', 'confirmation', etc
}
```

### ⚙️ Configuración (app.module.ts)

```typescript
// Asegúrate que ScheduleModule esté importado
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(), // ⭐ CRÍTICO para @Cron
    // ... otros imports
    WhatsAppModule,
  ],
})
export class AppModule {}
```

### 🔄 Retry Strategy (Backoff exponencial MIN)

```typescript
// Dentro WhatsAppWorkerService:
const RETRY_DELAYS = [1000, 2000, 4000, 8000, 16000]; // ms

async getRetryDelay(retryCount: number): Promise<number> {
  return RETRY_DELAYS[Math.min(retryCount, RETRY_DELAYS.length - 1)];
}

// Usar en worker si queremos delays
setTimeout(() => processNext(), await this.getRetryDelay(msg.retry_count));
```

---

## G) CHECKLIST DE PRUEBAS MÍNIMAS (10 Tests)

### 🧪 Unit + Integration Tests

```typescript
// tests/appointments.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Appointments (e2e)', () => {
  let app: INestApplication;
  let clinicId: string;
  let userId: string;
  let clientId: string;
  let petId: string;
  let appointmentId: string;
  let jwtToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Setup: crear clínica, usuario, cliente, mascota
    // (simplified aquí)
    clinicId = 'test-clinic-uuid';
    userId = 'test-user-uuid';
    clientId = 'test-client-uuid';
    petId = 'test-pet-uuid';
    jwtToken = 'eyJhbGc...test'; // Mock JWT
  });

  // ✅ TEST 1: Cross-tenant isolation - no ver cita de otra clínica
  it('T1: Should NOT retrieve appointment from different clinic', async () => {
    const otherClinicId = 'other-clinic-uuid';
    const response = await request(app.getHttpServer())
      .get(`/appointments/${appointmentId}`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .set('X-Clinic-ID', otherClinicId); // Simular JWT con otra clínica

    expect(response.status).toBe(403); // Forbidden
  });

  // ✅ TEST 2: Cross-tenant isolation - no crear cita con petId de otra clínica
  it('T2: Should NOT create appointment with pet from different clinic', async () => {
    const response = await request(app.getHttpServer())
      .post('/appointments')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({
        pet_id: 'foreign-pet-uuid',
        client_id: clientId,
        scheduled_at: new Date(Date.now() + 86400000).toISOString(),
        reason: 'Test',
      });

    expect(response.status).toBe(403);
  });

  // ✅ TEST 3: Clinic SUSPENDED - endpoints fallan con 403
  it('T3: Should reject all operations if clinic is SUSPENDED', async () => {
    // Asumir que suspendemos la clínica
    await suspendClinic(clinicId);

    const response = await request(app.getHttpServer())
      .get('/appointments')
      .set('Authorization', `Bearer ${jwtToken}`);

    expect(response.status).toBe(403); // TenantGuard rechaza
  });

  // ✅ TEST 4: Clinic INACTIVE - crear usuario falla
  it('T4: Should NOT create user if clinic is not ACTIVE', async () => {
    await suspendClinic(clinicId);

    const response = await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'New User',
        email: 'newuser@test.com',
        role: 'STAFF',
        password: 'Password123!',
      });

    expect(response.status).toBe(403);
  });

  // ✅ TEST 5: CRUD Clients - crear, leer, actualizar
  it('T5: Should create, read and update client', async () => {
    // Create
    const createRes = await request(app.getHttpServer())
      .post('/clients')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({
        name: 'Juan Pérez',
        phone: '+5215512345678',
        email: 'juan@example.com',
        address: 'Calle 1, México DF',
      });
    expect(createRes.status).toBe(201);
    const newClientId = createRes.body.id;

    // Read
    const readRes = await request(app.getHttpServer())
      .get(`/clients/${newClientId}`)
      .set('Authorization', `Bearer ${jwtToken}`);
    expect(readRes.status).toBe(200);
    expect(readRes.body.name).toBe('Juan Pérez');

    // Update
    const updateRes = await request(app.getHttpServer())
      .put(`/clients/${newClientId}`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({ address: 'Calle 2, México DF' });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.address).toBe('Calle 2, México DF');
  });

  // ✅ TEST 6: CRUD Pets - crear, leer
  it('T6: Should create and read pet', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/pets')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({
        client_id: clientId,
        name: 'Fluffy',
        animal_type_id: 1, // gato
        breed: 'Persa',
        birth_date: '2020-01-15',
        gender: 'FEMALE',
      });
    expect(createRes.status).toBe(201);

    const newPetId = createRes.body.id;
    const readRes = await request(app.getHttpServer())
      .get(`/pets/${newPetId}`)
      .set('Authorization', `Bearer ${jwtToken}`);
    expect(readRes.status).toBe(200);
    expect(readRes.body.name).toBe('Fluffy');
  });

  // ✅ TEST 7: CRUD Appointments - crear, cambiar status
  it('T7: Should create appointment and update status', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/appointments')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({
        pet_id: petId,
        client_id: clientId,
        scheduled_at: new Date(Date.now() + 86400000).toISOString(),
        reason: 'Vacunación',
        duration_minutes: 30,
      });
    expect(createRes.status).toBe(201);
    expect(createRes.body.status).toBe('SCHEDULED');
    const newAppointmentId = createRes.body.id;

    // Update status
    const updateRes = await request(app.getHttpServer())
      .patch(`/appointments/${newAppointmentId}/status`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({ status: 'CONFIRMED' });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.status).toBe('CONFIRMED');

    // Verify AuditLog created
    const logs = await getAuditLogsByResource('appointment', newAppointmentId);
    expect(logs.length).toBeGreaterThan(0);
  });

  // ✅ TEST 8: WhatsApp Enqueue - idemponencia
  it('T8: Should enqueue WhatsApp with idempotency', async () => {
    const idempotencyKey = 'unique-key-' + Date.now();

    const res1 = await request(app.getHttpServer())
      .post('/whatsapp/send')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({
        phone_number: '+5215512345678',
        message_body: 'Test message',
        client_id: clientId,
        idempotency_key: idempotencyKey,
      });
    expect(res1.status).toBe(202); // Accepted

    // Enviar idéntico
    const res2 = await request(app.getHttpServer())
      .post('/whatsapp/send')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({
        phone_number: '+5215512345678',
        message_body: 'Test message',
        client_id: clientId,
        idempotency_key: idempotencyKey,
      });
    expect(res2.status).toBe(409); // Conflict - no duplicar
  });

  // ✅ TEST 9: WhatsApp Worker - procesa cola
  it('T9: Should process WhatsApp outbox queue', async () => {
    // Encolar mensaje
    const enqueueRes = await request(app.getHttpServer())
      .post('/whatsapp/send')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({
        phone_number: '+5215512345678',
        message_body: 'Reminder: appointment tomorrow',
        message_type: 'reminder',
      });
    expect(enqueueRes.status).toBe(202);

    // Esperar a que cron procese (en test, trigger manualmente)
    await triggerWhatsAppWorker();

    // Verificar status cambió
    const outboxRes = await request(app.getHttpServer())
      .get('/whatsapp/outbox')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(outboxRes.status).toBe(200);
    const processedMsg = outboxRes.body.find(
      (m) => m.id === enqueueRes.body.id,
    );
    expect(['sent', 'failed']).toContain(processedMsg.status);
  });

  // ✅ TEST 10: Audit Log for critical actions
  it('T10: Should create AuditLog for critical actions', async () => {
    // Crear clínica
    const createRes = await request(app.getHttpServer())
      .post('/clinics')
      .send({
        name: 'Nueva Clínica',
        phone: '+5215567890123',
        city: 'CDMX',
      });
    const newClinicId = createRes.body.id;

    // Verificar AuditLog
    const logs = await getAuditLogsByResource('clinic', newClinicId);
    expect(logs.length).toBe(1);
    expect(logs[0].action).toBe('CREATE');
  });

  afterAll(async () => {
    await app.close();
  });
});
```

### 📋 Test Summary

| ID  | Nombre | Cobertura |
|-----|--------|-----------|
| T1  | Cross-tenant isolation (GET) | Aislamiento |
| T2  | Cross-tenant isolation (CREATE) | Aislamiento |
| T3  | Clinic SUSPENDED blocks ops | Tenant inactive |
| T4  | Cannot create user if clinic inactive | Tenant inactive |
| T5  | CRUD Clients end-to-end | Data operations |
| T6  | CRUD Pets end-to-end | Data operations |
| T7  | CRUD Appointments + status change | Data operations + Audit |
| T8  | WhatsApp idempotency | Async messaging |
| T9  | WhatsApp worker processes queue | Async messaging |
| T10 | AuditLog for critical actions | Audit trail |

---

## 📝 RESUMEN EJECUTIVO

### ✅ Completado en MVP

- [x] Auth JWT básico (ya existe)
- [x] Clinic CRUD + status
- [x] User per-clinic CRUD
- [x] Client (Owner) CRUD con unicidad por clínica
- [x] Pet CRUD
- [ ] **Appointment CRUD** ← **A IMPLEMENTAR**
- [ ] **WhatsApp Outbox Enqueue** ← **A IMPLEMENTAR**
- [ ] **WhatsApp Worker Cron** ← **A IMPLEMENTAR**
- [x] AuditLog mínimo
- [x] TenantGuard + CurrentClinicId decorator
- [x] Validación DTO + Exception filter

### 🚀 Próximos Pasos Inmediatos

1. **Crear Appointment entity + module** (es el más crítico)
2. **Crear WhatsApp entity + module** (enqueue + worker)
3. **Implementar endpoints** (30 min x módulo)
4. **Tests** (con seeding local)
5. **Deploy a staging**

### 💰 Esfuerzo Estimado

| Tarea | Horas | Prioridad |
|-------|-------|-----------|
| Appointments (entity + service + endpoints) | 4 | P0 |
| WhatsApp (entity + enqueue + worker) | 5 | P1 |
| Tests e2e (10 tests) | 3 | P1 |
| Seeding mejorado | 2 | P1 |
| Deployment | 2 | P1 |
| **TOTAL** | **16 horas** | - |

---

## 📚 Referencias

- **JWT Claims:** `clinic_id, user_id, role, exp`
- **GuardsUsados:** `AuthGuard('jwt')`, `TenantGuard`
- **Indexes recomendados:** `(clinic_id, status)`, `(clinic_id, created_at)`, `(idempotency_key)`
- **Timeouts:** Worker cron 30s, JWT exp 1 hora, refresh token 7 días (post-MVP)

---

**Documento versión:** 1.0  
**Última actualización:** Febrero 2026  
**Estado:** ✅ Listo para implementación
