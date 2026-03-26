# 🚀 VIBRALIVE MVP - ESPECIFICACIÓN E IMPLEMENTACIÓN COMPLETA
## SuperAdmin → Clínicas (Tenants) + Asignación Owner + Dashboard Global

**Fecha:** Febrero 25, 2026  
**Status:** 🟢 Listo para Implementación  
**Tiempo Estimado:** 2-3 horas  

---

## **A) ALCANCE MVP vs POST-MVP**

### MVP MUST (Sprint 1-2: 2-3 semanas)
```
✅ SuperAdmin Login (platform_users)
✅ CRUD Clínicas (create, list, get, suspend, activate)
✅ Asignar primer Owner a clínica (invitation token strategy)
✅ Dashboard global con KPIs agregados
✅ Auditoría mínima (CREATE, SUSPEND, ACTIVATE, CREATE_OWNER)
✅ Guards básicos (JWT + PlatformRole)
✅ E2E tests (10 critical paths)
```

### POST-MVP SHOULD (Sprint 3+: futuro)
```
⏳ 2FA para SuperAdmin
⏳ Rate limiting (5 req/min por IP)
⏳ Field-level encryption para datos sensibles
⏳ Secrets en vault (no en .env)
⏳ SIEM/Monitoring (PagerDuty, DataDog)
⏳ Impersonation avanzada (audit trail)
⏳ Multi-region disaster recovery
⏳ API keys para integraciones
```

---

## **B) REGLAS DE NEGOCIO (NUMERADAS)**

```
CREACIÓN Y CICLO DE VIDA DE CLÍNICAS:

R-CL-001: Unicidad de Phone
  - Cada clínica tiene teléfono único en la tabla clinics (UNIQUE CONSTRAINT)
  - Validación en servicio ANTES de INSERT
  - Error: 409 Conflict si duplicado

R-CL-002: Solo SuperAdmin crea y gestiona Clínicas
  - Endpoint POST /api/platform/clinics requiere @RequirePlatformRole('PLATFORM_SUPERADMIN')
  - Endpoint PATCH /api/platform/clinics/:id/suspend requiere role PLATFORM_SUPERADMIN
  - Endpoint PATCH /api/platform/clinics/:id/activate requiere role PLATFORM_SUPERADMIN

R-CL-003: Clínica No Puede Operar sin Owner
  - Una clínica ACTIVE requiere al menos 1 usuario con (role='owner' AND status='ACTIVE')
  - O 1 usuario con (role='owner' AND status='INVITED' AND invitation_token_expires_at > now())
  - Validación en createOwner(): Si no hay owner válido, error 400

R-CL-004: Clínica Suspendida Bloquea Acceso Tenant
  - Si clinic.status='SUSPENDED', endpoints tenant (appointments, clients, etc) retornan 403
  - Validación en TenantStatusGuard (a implementar post-MVP)

R-CL-005: Asignar Owner = Crear User con Validaciones
  - Email único en toda la tabla users (UNIQUE)
  - User creado con clinic_id = la clínica
  - Rol = 'owner'
  - Status = 'INVITED' (invitation workflow) OR 'ACTIVE' (si password temporal dado)
  - Si INVITED: invitation_token + invitation_token_expires_at (24 horas)

R-CL-006: Auditoría Mínima Obligatoria
  - Cada CREATE_CLINIC → AuditLog con { action: 'CREATE_CLINIC', ... }
  - Cada SUSPEND_CLINIC → AuditLog con { action: 'SUSPEND_CLINIC', metadata: { reason } }
  - Cada ACTIVATE_CLINIC → AuditLog
  - Cada CREATE_CLINIC_OWNER → AuditLog
  - Campos: actor_id, action, entity_type, entity_id, metadata, created_at
```

---

## **C) ENDPOINTS REST FINALES**

### Autenticación Platform
```
POST /api/platform/auth/login
  Body: { email, password }
  Response: { access_token, refresh_token, user }
```

### CRUD Clínicas
```
POST /api/platform/clinics
  Guards: AuthGuard, PlatformRoleGuard, PermissionGuard
  Role: PLATFORM_SUPERADMIN
  Body: { name, phone, city?, country?, plan?, subscription_plan?, max_*?, whatsapp_*? }
  Response: 201 Clinic

GET /api/platform/clinics
  Guards: AuthGuard, PlatformRoleGuard, PermissionGuard
  Query: limit?, offset?, status?, plan?, city?, search?
  Response: 200 { data: Clinic[], pagination }

GET /api/platform/clinics/:clinicId
  Guards: AuthGuard, PlatformRoleGuard, PermissionGuard
  Response: 200 Clinic

PATCH /api/platform/clinics/:clinicId
  Guards: AuthGuard, PlatformRoleGuard, PermissionGuard
  Role: PLATFORM_SUPERADMIN
  Body: { name?, city?, plan?, subscription_plan? }
  Response: 200 Clinic
```

### Status Management
```
PATCH /api/platform/clinics/:clinicId/suspend
  Guards: AuthGuard, PlatformRoleGuard, PermissionGuard
  Role: PLATFORM_SUPERADMIN
  Body: { reason: string }
  Response: 200 Clinic (status='SUSPENDED')

PATCH /api/platform/clinics/:clinicId/activate
  Guards: AuthGuard, PlatformRoleGuard, PermissionGuard
  Role: PLATFORM_SUPERADMIN
  Body: {}
  Response: 200 Clinic (status='ACTIVE')
```

### Clinic Owner Onboarding
```
POST /api/platform/clinics/:clinicId/owner
  Guards: AuthGuard, PlatformRoleGuard, PermissionGuard
  Role: PLATFORM_SUPERADMIN
  Body: { name, email, phone? }
  Response: 201 { 
    id, clinic_id, name, email, role, status, 
    invitation_token, invitation_expires_at,
    message
  }
  
  Strategy: INVITATION
  - Usuario creado con status='INVITED'
  - Genera invitation_token (UUID)
  - Token expira en 24 horas
  - Owner debe aceptar invitación y establecer password
```

### Dashboard Global
```
GET /api/platform/dashboard
  Guards: AuthGuard, PlatformRoleGuard, PermissionGuard
  Permission: platform:dashboard
  Response: 200 {
    timestamp: ISO string,
    kpis: {
      total_clinics: number,
      active_clinics: number,
      suspended_clinics: number,
      statistics: {
        total_active_staff: number,
        total_active_clients: number,
        total_active_pets: number
      }
    },
    recent_clinics: Clinic[]
  }
```

---

## **D) ESTRUCTURA DE ARCHIVOS A CREAR/EDITAR**

### Entities (Verificar)
```
✅ src/database/entities/clinic.entity.ts
✅ src/database/entities/user.entity.ts
✅ src/database/entities/platform-user.entity.ts
✅ src/database/entities/platform-role.entity.ts
✅ src/database/entities/audit-log.entity.ts
```

### DTOs (Crear)
```
🆕 src/modules/platform/dtos/create-clinic.dto.ts
🆕 src/modules/platform/dtos/update-clinic.dto.ts
🆕 src/modules/platform/dtos/suspend-clinic.dto.ts
🆕 src/modules/platform/dtos/create-clinic-owner.dto.ts
🆕 src/modules/platform/dtos/index.ts
```

### Guards (Crear/Verificar)
```
🆕 src/common/guards/platform-role.guard.ts
✅ src/common/guards/permission.guard.ts (verificar)
```

### Decorators (Crear/Verificar)
```
🆕 src/common/decorators/require-platform-role.decorator.ts
🆕 src/common/decorators/current-user.decorator.ts
✅ src/common/decorators/require-permission.decorator.ts
🆕 src/common/decorators/index.ts
```

### Services (Crear/Editar)
```
🆕 src/modules/audit/audit.service.ts
🆕 src/modules/audit/audit.module.ts
✏️  src/modules/platform/platform-clinics.service.ts (agregar createClinicOwner + KPIs)
🆕 src/modules/platform/platform-dashboard.service.ts
```

### Controllers (Crear/Editar)
```
✏️  src/modules/platform/platform-clinics.controller.ts
🆕 src/modules/platform/platform-dashboard.controller.ts
```

### Modules (Editar)
```
✏️  src/modules/platform/platform.module.ts
```

### Tests (Crear)
```
🆕 test/e2e/utils/test-helpers.ts
🆕 test/e2e/platform-clinics.e2e-spec.ts
🆕 test/e2e/platform-dashboard.e2e-spec.ts
```

---

## **E) PASOS DE IMPLEMENTACIÓN (EN ORDEN)**

### PASO 1: Entidades (5 min)
- [ ] Verificar `clinic.entity.ts` - debe tener índices y relaciones
- [ ] Verificar `user.entity.ts` - clinic_id FK, role enum
- [ ] Verificar `platform-user.entity.ts` - relación con roles
- [ ] Verificar `platform-role.entity.ts` - permissions array
- [ ] Crear/completar `audit-log.entity.ts`

### PASO 2: Guards y Decorators (15 min)
- [ ] Crear `PlatformRoleGuard`
- [ ] Verificar `PermissionGuard`
- [ ] Crear `RequirePlatformRole` decorator
- [ ] Crear `CurrentUser` decorator
- [ ] Verificar `RequirePermission` decorator
- [ ] Actualizar `index.ts` en decorators

### PASO 3: DTOs (10 min)
- [ ] Crear `CreateClinicDto`
- [ ] Crear `UpdateClinicDto`
- [ ] Crear `SuspendClinicDto`
- [ ] Crear `CreateClinicOwnerDto`
- [ ] Crear `dtos/index.ts`

### PASO 4: Servicios (30 min)
- [ ] Crear `AuditService`
- [ ] Crear `AuditModule`
- [ ] Actualizar `PlatformClinicsService` (agregar createClinicOwner + getDashboardKPIs)
- [ ] Crear `PlatformDashboardService`

### PASO 5: Controllers (20 min)
- [ ] Actualizar `PlatformClinicsController` (agregar endpoint /owner)
- [ ] Crear `PlatformDashboardController`

### PASO 6: Módulos (5 min)
- [ ] Actualizar `PlatformModule` (imports + exports)

### PASO 7: Tests E2E (45 min)
- [ ] Crear `test-helpers.ts`
- [ ] Crear `platform-clinics.e2e-spec.ts` (10 tests)
- [ ] Crear `platform-dashboard.e2e-spec.ts`

### PASO 8: Verificación (30 min)
- [ ] Ejecutar: `npm run test:e2e`
- [ ] Ejecutar: `npm run start:dev`
- [ ] Verificar logs en consola
- [ ] Probar endpoints con Postman/Insomnia

---

## **F) COMANDOS PARA EJECUTAR**

```bash
# Verificar código (TypeScript)
npm run typeorm schema:sync

# Ejecutar tests E2E
npm run test:e2e

# Iniciar servidor en desarrollo
npm run start:dev

# Ver logs de auditoría
psql vibralive -c "SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 20;"
```

---

## **G) DOCUMENTACIÓN DE REFERENCIA**

- **Reglas de Negocio:** Sección B arriba
- **Endpoints:** Sección C arriba
- **Código Completo:** Ver archivo separado `MVP_IMPLEMENTATION_CODE.md`
- **Seguridad:** `SECURITY_AND_MULTITENANT.md` (multitenant isolation)
- **APIs Documentadas:** `SERVICES_AND_APIS.md`

---

## **H) VALIDACIÓN POST-IMPLEMENTACIÓN**

### Tests Mínimos Requeridos
```
✅ Superadmin puede crear clínica
✅ Duplicado phone retorna 409
✅ List clinics retorna clínicas creadas
✅ Suspend clinic cambia status + escribe audit
✅ Activate clinic cambia status + escribe audit
✅ Create clinic owner genera invitation token
✅ No puede crear owner para clínica inexistente (404)
✅ No puede acceder sin token (401)
✅ No puede acceder sin SUPERADMIN role (403)
✅ Dashboard retorna KPIs correctos
```

### Queries de Verificación (SQL)
```sql
-- Ver clínicas creadas
SELECT id, name, phone, status, created_at FROM clinics;

-- Ver usuarios (owners) verificados
SELECT id, clinic_id, email, role, status, created_at FROM users WHERE role = 'owner';

-- Ver audit logs
SELECT actor_id, action, entity_type, entity_id, created_at FROM audit_logs 
ORDER BY created_at DESC LIMIT 20;

-- Ver KPIs agregados
SELECT 
  COUNT(*) as total_clinics,
  SUM(CASE WHEN status='ACTIVE' THEN 1 ELSE 0 END) as active,
  SUM(CASE WHEN status='SUSPENDED' THEN 1 ELSE 0 END) as suspended,
  SUM(active_staff_count) as total_staff,
  SUM(active_clients_count) as total_clients,
  SUM(active_pets_count) as total_pets
FROM clinics;
```

---

## **I) NOTAS IMPORTANTES**

1. **Multi-Tenant Aislamiento:**
   - Clinic table `id` es el tenant_id
   - Users siempre tienen `clinic_id` (excepto platform_users)
   - Queries SIEMPRE filtran por clinic_id derivado del JWT

2. **Estrategia de Onboarding Owner:**
   - MVP usa INVITATION strategy (no password directo)
   - Owner recibe email con link + invitation_token
   - Token válido 24 horas
   - Al aceptar, owner establece su password (endpoint a implementar post-MVP)

3. **Auditoría:**
   - Mínimo viable: solo "critical actions"
   - CREATE_CLINIC, SUSPEND_CLINIC, ACTIVATE_CLINIC, CREATE_CLINIC_OWNER
   - Permite compliance básico (HIPAA, GDPR)

4. **Próximas Fases:**
   - Fase 2: Tenant endpoints (clinics staff, clients, pets, citas)
   - Fase 3: WhatsApp integration
   - Fase 4: Reporting + Analytics

---

**Última Actualización:** Febrero 25, 2026
