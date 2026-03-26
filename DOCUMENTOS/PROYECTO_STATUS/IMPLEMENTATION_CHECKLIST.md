# ✅ IMPLEMENTATION CHECKLIST - MVP Status

**Fecha:** 25 Febrero 2026  
**Proyecto:** VibraLive SaaS Multi-Tenant  
**Objetivo:** Avanzar rápido con lógica de negocio (NO sobre-ingeniería)

---

## 📊 ESTADO GENERAL

| Categoría | Status | % Completo | Esfuerzo Restante |
|-----------|--------|-----------|-------------------|
| **Autenticación** | ✅ DONE | 100% | 0h |
| **Clinic Management** | ✅ DONE | 100% | 0h |
| **Users (per-clinic)** | ✅ DONE | 100% | 0h |
| **Clients (Owners)** | ✅ DONE | 100% | 0h |
| **Pets** | ✅ DONE | 100% | 0h |
| **Appointments** | 🟡 TODO | 0% | **4h** |
| **WhatsApp Queue** | 🟡 TODO | 0% | **5h** |
| **Testing** | 🟡 IN-PROGRESS | 50% | **3h** |
| **Deployment** | 🟡 TODO | 0% | **2h** |
| **TOTAL** | 🟡 75% | 75% | **14-16h** |

---

## ✅ YA IMPLEMENTADO (100% - NO TOCAR)

### Auth Module ✅
- [x] JWT authentication (HS256)
- [x] Password hashing (bcrypt)
- [x] Login endpoint
- [x] Register endpoint (clinic owner)
- [x] Roles: SUPERADMIN, OWNER, STAFF (schema ready)
- [x] RBAC middleware + guards
- [x] CurrentUser decorator
- [x] Token auto-include en requests

**Archivos:**
- `src/modules/auth/` ✅
- `src/common/guards/auth.guard.ts` ✅
- `src/common/decorators/current-user.decorator.ts` ✅

---

### Clinic Module ✅
- [x] Clinic entity (with status: ACTIVE/SUSPENDED/DELETED)
- [x] Clinic CRUD endpoints
- [x] Subscription plans (STARTER, PROFESSIONAL, ENTERPRISE)
- [x] Relations: Clinic → Users, Pets, Clients, Appointments, WhatsApp

**Entities:**
- `src/database/entities/clinic.entity.ts` ✅

---

### Users Module ✅
- [x] User entity (per-clinic)
- [x] User CRUD endpoints
- [x] Roles per user: CLINIC_ADMIN, STAFF
- [x] Soft delete (deactivation)
- [x] Status: INVITED, ACTIVE, DEACTIVATED

**Entities:**
- `src/database/entities/user.entity.ts` ✅

---

### Clients Module ✅
- [x] Client entity (Owners of pets)
- [x] Client CRUD endpoints
- [x] Unique phone per clinic constraint
- [x] Relations: Client → Pets, Appointments

**Entities & Code:**
- `src/database/entities/client.entity.ts` ✅
- `src/modules/clients/` ✅

---

### Pets Module ✅
- [x] Pet entity
- [x] Pet CRUD endpoints
- [x] Relations: Pet → Client, Clinic, Appointments
- [x] AnimalType reference

**Entities & Code:**
- `src/database/entities/pet.entity.ts` ✅
- `src/modules/pets/` ✅

---

### Common Guards & Decorators ✅
- [x] CurrentClinicId decorator (extrae clinic_id del JWT)
- [x] AuthGuard (JWT validation)
- [x] PermissionGate (RBAC)
- [x] RoleGuard

**Code:**
- `src/common/decorators/` ✅
- `src/common/guards/` ✅

---

### Database Setup ✅
- [x] TypeORM configured
- [x] PostgreSQL connection
- [x] Entities mapped
- [x] Migrations system ready
- [x] Seeding infrastructure

**Archivos:**
- `src/database/data-source.ts` ✅
- `src/database/entities/` ✅

---

### Frontend (Next.js 14) ✅
- [x] Login page
- [x] Register (clinic creation)
- [x] Protected routes
- [x] Dashboard layouts
- [x] API client with JWT auto-include
- [x] Role-based nav

**Archivos:**
- `src/app/(auth)/` ✅
- `src/app/(protected)/` ✅
- `src/app/dashboard/` ✅

---

### AuditLog Entity ✅
- [x] AuditLog entity (mínimo)
- [x] Índices por clinic_id, action, created_at
- [x] Actions: CREATE, UPDATE, DELETE, SUSPEND, etc.

**Entity:**
- `src/database/entities/audit-log.entity.ts` ✅

---

## 🟡 POR IMPLEMENTAR (Restante MVP)

### 1️⃣ APPOINTMENT MODULE (Priority: P0)

**Entity** 🟡
- [ ] Create `src/database/entities/appointment.entity.ts`
  - Fields: id, clinic_id, pet_id, client_id, scheduled_at, status, reason, duration_minutes, veterinarian_id, notes, cancelled_at, cancelled_by, cancellation_reason, created_at, updated_at
  - Indices: (clinic_id, status), (clinic_id, scheduled_at), (clinic_id, created_at)
  - Relations: Clinic, Pet, Client (OneToMany/ManyToOne)

**Migration** 🟡
- [ ] Generate migration: `npm run typeorm migration:generate -- -n CreateAppointmentTable`
- [ ] Ensure indices created

**Module Structure** 🟡
```
src/modules/appointments/
├── dtos/
│   ├── create-appointment.dto.ts
│   ├── update-appointment.dto.ts
│   ├── update-status.dto.ts
│   └── index.ts
├── repositories/
│   └── appointments.repository.ts
├── appointments.controller.ts
├── appointments.service.ts
├── appointments.module.ts
└── (test file)
```

**DTOs** 🟡
- [ ] CreateAppointmentDto (pet_id, client_id, scheduled_at, reason?, duration_minutes?, veterinarian_id?)
- [ ] UpdateAppointmentDto (all optional except status)
- [ ] UpdateStatusDto (status, cancellation_reason?)
- [ ] Validations: scheduled_at must be future, status enum, phone format if applicable

**Repository** 🟡
- [ ] findByClinic(clinicId, filters)
- [ ] findByClinicAndId(clinicId, appointmentId)
- [ ] create(data)
- [ ] save(appointment)

**Service** 🟡
- [ ] create(clinicId, dto)
- [ ] findByClinic(clinicId, filters)
- [ ] findOne(clinicId, appointmentId)
- [ ] update(clinicId, appointmentId, dto)
- [ ] updateStatus(clinicId, appointmentId, dto, userId) → **LOG AUDIT**

**Controller** 🟡
- [ ] POST /appointments (CreateAppointmentDto)
- [ ] GET /appointments (con filters: status, client_id, page, limit)
- [ ] GET /appointments/:id
- [ ] PUT /appointments/:id (UpdateAppointmentDto)
- [ ] PATCH /appointments/:id/status (UpdateStatusDto) → **GUARD: TenantGuard**

**Guards & Decorators** 🟡
- [ ] Use AuthGuard('jwt'), TenantGuard en todos endpoints
- [ ] Use @CurrentClinicId() en todos endpoints

**Integration** 🟡
- [ ] Register AppointmentsModule en AppModule
- [ ] Add Appointment to TypeORM imports
- [ ] Add Appointment relations en Clinic, Pet, Client entities

**Testing** 🟡
- [ ] T5: CRUD flow (create, read, update)
- [ ] T7: Status update + AuditLog
- [ ] T1: Cross-tenant isolation

---

### 2️⃣ WHATSAPP MODULE (Priority: P1)

**Entity** 🟡
- [ ] Create `src/database/entities/whatsapp-outbox.entity.ts`
  - Fields: id, clinic_id, client_id, phone_number, message_body, status (queued/sent/failed/delivered), idempotency_key (unique), retry_count, max_retries, last_retry_at, provider_message_id, provider_error, channel (whatsapp), message_type, sent_at, created_at, updated_at
  - Indices: (clinic_id, status), (clinic_id, created_at), (idempotency_key), (retry_count, status)
  - Relations: Clinic, Client (ManyToOne)

**Migration** 🟡
- [ ] Generate migration: `npm run typeorm migration:generate -- -n CreateWhatsAppOutboxTable`

**Module Structure** 🟡
```
src/modules/whatsapp/
├── dtos/
│   ├── send-message.dto.ts
│   └── index.ts
├── repositories/
│   └── whatsapp-outbox.repository.ts
├── whatsapp.controller.ts
├── whatsapp.service.ts (enqueue)
├── whatsapp-worker.service.ts (cron processor)
├── whatsapp.module.ts
└── (test file)
```

**DTOs** 🟡
- [ ] SendMessageDto (phone_number, message_body, client_id?, idempotency_key?, message_type?)
- [ ] Validations: phone E.164 format, message length 1-4096, uuid fields

**Repository** 🟡
- [ ] create(data)
  - [ ] findByIdempotencyKey(key) → Check idempotency
- [ ] findQueued(limit) → WHERE status='queued' AND retry_count < max_retries
- [ ] findByClinic(clinicId, filters) → Paging
- [ ] findById(messageId)
- [ ] save(message)

**Service (Enqueue)** 🟡
- [ ] enqueueMessage(clinicId, dto, userId)
  - [ ] Check idempotency → 409 Conflict if exists
  - [ ] Create WhatsAppOutbox with status='queued'
  - [ ] Log en AuditLog (action: CREATE)
  - [ ] Return 202 Accepted (id, status, idempotency_key)
- [ ] findByClinic(clinicId, filters)
- [ ] findOne(messageId)
- [ ] retryMessage(messageId) → Reset retry_count, status=queued

**Controller** 🟡
- [ ] POST /whatsapp/send (SendMessageDto) → @HttpCode(202) **RETURN ACCEPTED**
- [ ] GET /whatsapp/outbox (con filters: status, page, limit)
- [ ] GET /whatsapp/outbox/:id
- [ ] PATCH /whatsapp/outbox/:id/retry

**Worker Service (Cron)** 🟡
- [ ] @Cron(CronExpression.EVERY_30_SECONDS) processQueue()
  - [ ] Find queued messages (max retry < 5)
  - [ ] For each message:
    - [ ] Call sendViaProvider() → PLACEHOLDER (simular 90% success)
    - [ ] Update status: sent/failed
    - [ ] Increment retry_count si falla
    - [ ] Update sent_at timestamp
    - [ ] Log en AuditLog (action: SEND_MESSAGE)
  - [ ] Handle errors gracefully (catch, log, continue)

**Provider Placeholder** 🟡
- [ ] sendViaProvider(message) → Promise<boolean>
  - [ ] TODO: Integración real con Twilio/Meta (post-MVP)
  - [ ] For MVP: Mock (90% success rate)
  - [ ] Return: true = sent, false = failed

**Retry Logic** 🟡
- [ ] max_retries = 5 (configurable)
- [ ] Backoff exponencial: don't implement delays yet (MVP)
- [ ] After max retries: status = 'failed'

**Integration** 🟡
- [ ] Register WhatsAppModule en AppModule
- [ ] Add WhatsAppOutbox to TypeORM imports
- [ ] **CRITICAL:** Import ScheduleModule en AppModule para @Cron
- [ ] Add WhatsAppOutbox relations en Clinic, Client entities

**Testing** 🟡
- [ ] T8: Idempotency (enqueue 2x same key → 409)
- [ ] T9: Worker processes queue
- [ ] T3: Clinic SUSPENDED blocks WhatsApp endpoints

---

### 3️⃣ MIGRATIONS & DATABASE (Priority: P0)

**Migrations** 🟡
- [ ] Generate CreateAppointmentTable migration
- [ ] Generate CreateWhatsAppOutboxTable migration
- [ ] Verify migrations have proper indices
- [ ] Run locally: `npm run typeorm migration:run`
- [ ] Validate: check `\d appointments` en psql

**Database Verification** 🟡
- [ ] Verify clinic_id NOT NULL en all tables
- [ ] Verify unique constraints: (clinic_id, phone) para clients
- [ ] Verify indices created: (clinic_id, status), (clinic_id, created_at)
- [ ] Test query performance (no seq scans)

---

### 4️⃣ AUDIT LOG INTEGRATION (Priority: P1)

**Service** 🟡 (Asumiendo que existe partial)
- [ ] Create/Verify `src/modules/audit-log/audit-log.service.ts`
  - [ ] create(dto) → Save to AuditLog table
  - [ ] Fields: clinic_id, actor_id, action, resource_type, resource_id, changes, client_ip

**Module** 🟡
- [ ] Create `src/modules/audit-log/audit-log.module.ts`
- [ ] Export service para inyectar en otros módulos

**Integration Points** 🟡
- [ ] AppointmentsService.updateStatus() → Call auditLog.create()
- [ ] WhatsAppService.enqueueMessage() → Call auditLog.create()
- [ ] WhatsAppWorkerService.processQueue() → Call auditLog.create() on success/failure

**Actions to Log** 🟡
- [ ] CREATE clinic
- [ ] CREATE user
- [ ] UPDATE appointment status → CRITICAL
- [ ] SEND_MESSAGE (whatsapp) → CRITICAL
- [ ] DELETE client, pet (optional)

---

### 5️⃣ TESTING (Priority: P1)

**Test Framework** 🟡
- [ ] Ensure @nestjs/testing, jest, supertest installed
- [ ] Create `tests/` directory if not exists

**E2E Tests** 🟡 (Mínimo 10)
- [ ] **T1:** Cross-tenant isolation (GET appointment from other clinic → 403)
- [ ] **T2:** Cross-tenant isolation (CREATE appointment with pet from other clinic → 403)
- [ ] **T3:** Clinic SUSPENDED blocks all operations (GET appointments → 403)
- [ ] **T4:** Cannot create user if clinic not ACTIVE (POST users → 403)
- [ ] **T5:** CRUD Clients (create, read, update flow)
- [ ] **T6:** CRUD Pets (create, read flow)
- [ ] **T7:** CRUD Appointments + status change (create, update status, verify AuditLog)
- [ ] **T8:** WhatsApp idempotency (enqueue 2x same key → 409)
- [ ] **T9:** WhatsApp worker processes queue (enqueue → wait 35s → check status changed)
- [ ] **T10:** AuditLog for critical actions (create clinic, update appointment)

**Test File** 🟡
- [ ] Create `tests/appointments.e2e-spec.ts`
- [ ] Create `tests/whatsapp.e2e-spec.ts`
- [ ] Crear seeding helpers

**Run Tests** 🟡
```bash
npm run test:e2e
npm run test:e2e -- --coverage
```

---

### 6️⃣ SEEDING & FIXTURES (Priority: P1)

**Seed Data** 🟡
- [ ] Update `src/database/seeds/seed.ts`
- [ ] Add appointment fixtures (3-5 scheduled appointments)
- [ ] Add WhatsApp message fixtures (2-3 queued messages)
- [ ] Run seed on application startup (dev only)

**Dev Command** 🟡
```bash
npm run seed
```

---

### 7️⃣ DOCUMENTATION (Priority: P2)

**Already Created** ✅
- [x] MVP_SPECIFICATION.md (Entregables A-G)
- [x] ACTION_PLAN.md (Ejecución step-by-step)
- [x] QUICK_REFERENCE.md (Endpoints & cURL examples)

**Pending** 🟡
- [ ] Update README.md con instrucciones deployment
- [ ] Create API_DOCS.md (OpenAPI / Swagger si es necesario)
- [ ] Video demo en Loom (optional)

---

## 🚀 DEPLOYMENT CHECKLIST (Priority: P2)

### Pre-Deploy 🟡
- [ ] Build sin errores: `npm run build`
- [ ] All tests passing: `npm run test:e2e`
- [ ] Linting OK: `npm run lint`
- [ ] No console.log left
- [ ] Env vars configured (.env.production)

### Database 🟡
- [ ] Backup DB (production)
- [ ] Run migrations: `npm run typeorm migration:run -- -d dist/src/database/data-source.js`
- [ ] Verify migrations applied
- [ ] Seed staging data

### Docker/K8s (if applicable) 🟡
- [ ] Build image: `docker build -t vibralive-backend:latest .`
- [ ] Push to registry
- [ ] Deploy: `docker-compose up -d` o kubectl apply

### Health Checks 🟡
- [ ] POST /auth/login → 200
- [ ] GET /appointments → 200 (with valid JWT)
- [ ] POST /whatsapp/send → 202
- [ ] Monitor logs for errors

---

## 📋 QUICK IMPLEMENTATION ORDER

```
SPRINT 0 (30 min): Entities + Migrations
  1. Create appointment.entity.ts
  2. Create whatsapp-outbox.entity.ts
  3. Generate migrations
  4. Run migrations locally

SPRINT 1 (3 hours): Appointments Module
  1. Create DTOs
  2. Create Repository
  3. Create Service
  4. Create Controller
  5. Register in AppModule
  6. Test locally: POST /appointments

SPRINT 2 (3 hours): WhatsApp Module
  1. Create DTOs
  2. Create Repository
  3. Create WhatsApp Service (Enqueue)
  4. Create WorkerService (@Cron)
  5. Create Controller
  6. Register in AppModule
  7. Test: POST /whatsapp/send → worker processes

SPRINT 3 (2 hours): Testing
  1. Write 10 E2E tests
  2. Run test suite
  3. Fix failures
  4. Check coverage

SPRINT 4 (1 hour): Seeding
  1. Update seed.ts with appointments + messages
  2. Test seeding locally

SPRINT 5 (1 hour): Deploy
  1. Build
  2. Run migrations (staging)
  3. Smoke tests
  4. Go live (or stage)
```

---

## ⚠️ CRITICAL REMINDERS

### Security (Minimal MVP)
- ✅ `clinic_id` **ALWAYS** from JWT, **NEVER** from body/query
- ✅ `TenantGuard` en TODOS endpoints protegidos
- ✅ Validación DTO en inputs
- ✅ SQL injection prevention (QueryBuilder)

### Data Integrity
- ✅ Índices en (clinic_id, status), (clinic_id, created_at)
- ✅ Unique constraints: idempotency_key (WhatsApp), (clinic_id, phone) (Clients)
- ✅ Foreign keys: clinic_id NOT NULL

### Performance
- ⚠️ Append indices cuando necesites
- ⚠️ AVOID N+1 queries (use relations en QueryBuilder)
- ⚠️ Pagination en GETs

### Audit Trail
- 📋 Log: CREATE clinic, CREATE user, UPDATE appointment status, SEND_MESSAGE
- 📋 Fields: clinic_id, actor_id, action, resource_type, resource_id, changes, timestamp

---

## 📞 SUPPORT & REFERENCES

**Especificación completa:** MVP_SPECIFICATION.md  
**Código paso-a-paso:** ACTION_PLAN.md  
**cURL ejemplos rápidos:** QUICK_REFERENCE.md  
**Patrón en código:** Ver clients/, pets/ modules (ya implementados)

---

## ✅ FINAL CHECKLIST (Pre-Merge)

- [ ] Entities creadas (Appointment, WhatsAppOutbox)
- [ ] Migrations generadas y testeadas
- [ ] Modules creados (appointments, whatsapp)
- [ ] Controllers con endpoints correctos
- [ ] Services con lógica de negocio
- [ ] Repositories con scoping por clinic_id
- [ ] Guards: AuthGuard + TenantGuard en todos endpoints
- [ ] DTOs con validación completa
- [ ] AuditLog integrado
- [ ] Tests pasan (10+ E2E)
- [ ] Build sin errores
- [ ] No console.log
- [ ] Documentación actualizada
- [ ] Ready para deploy

---

**Status:** 🟡 Ready to start implementation (75% complete)  
**Estimated time:** 14-16 hours  
**Start date:** Now!  
**Target completion:** 3-4 days (depending on team size)
