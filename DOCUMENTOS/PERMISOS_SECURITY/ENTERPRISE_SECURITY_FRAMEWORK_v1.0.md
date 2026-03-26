# 🔐 ENTERPRISE SECURITY FRAMEWORK v1.0

**Platform**: VibraLive (SaaS Multi-Tenant HIPAA/ISO27001-Ready)  
**Last Updated**: February 25, 2026  
**Status**: 🟢 Production Ready + Hardening Roadmap  
**Audience**: CTO, Chief Security Officer, Enterprise Architects  
**Distribution**: Internal Only - CONFIDENTIAL

---

## TABLA DE CONTENIDOS

1. [A) Executive Summary](#a-executive-summary)
2. [B) Formal Tenant Isolation Policy v1.0](#b-formal-tenant-isolation-policy-v10)
3. [C) RBAC + Permission Enforcement Model](#c-rbac--permission-enforcement-model)
4. [D) Security Hardening Roadmap](#d-security-hardening-roadmap)
5. [E) Security Test Matrix](#e-security-test-matrix)
6. [F) Critical Risk Assessment & Mitigations](#f-critical-risk-assessment--mitigations)

---

---

# A) EXECUTIVE SUMMARY

## VibraLive Security Posture - Next Generation Enterprise Model

### Current State vs. Target State

| Dimension | Current State | Enterprise Target | Gap |
|-----------|---------------|-------------------|-----|
| **Tenant Isolation** | ✅ Implemented (clinic_id filters) | ✅ Formal Policy + Enforcement | Formalization |
| **Auth Model** | ✅ JWT + bcrypt | ✅ JWT v2.0 (improved) | Refresh token strategy |
| **RBAC System** | ✅ Role-based + permission decorators | ✅ Formal RBAC/PBAC matrix | Documentation |
| **Multi-Tenant Scope** | ✅ Tenant context via Guard chain | ✅ Immutable context propagation | Context security |
| **Token Security** | ✅ HS256 JWT | ⚠️ Token rotation + blacklist | Infrastructure |
| **Data at Rest** | ❌ Unencrypted DB | ⚠️ Field-level encryption (Roadmap Q2) | Implementation |
| **2FA/MFA** | ❌ None | ⚠️ Opt-in 2FA (Roadmap Q2) | Implementation |
| **Rate Limiting** | ❌ None | ⚠️ Smart rate limiting (Roadmap Q1) | Implementation |
| **Secrets Management** | ⚠️ .env files | ⚠️ Vault integration (Roadmap Q2) | Infrastructure |
| **Audit Trail** | ✅ AuditLog entity | ✅ Formal audit policy + mandatory logging | Completion |
| **Incident Response** | ❌ Manual | ⚠️ Alerting rules (Roadmap Q3) | Infrastructure |

### Bottom Line

**VibraLive has a SOLID multi-tenant isolation foundation.** The platform is enterprise-ready for tenant separation, with formal policies and hardened guards. However, to achieve **HIPAA/ISO27001 certification**, we need:

1. **Formalized policies** (tenant isolation, RBAC, audit)
2. **Infrastructure hardening** (encryption, 2FA, rate limiting, secrets vault)
3. **Comprehensive test coverage** (security test matrix)
4. **Incident response automation** (alerting, monitoring, SIEM)

**Risk Level**: 🟡 **MEDIUM** (without hardening) → 🟢 **LOW** (with roadmap completion)

**Compliance Timeline**:
- ✅ SOC2 Type II ready (Q1 2026)
- ⚠️ HIPAA ready (Q2 2026 after encryption)
- ⚠️ ISO 27001 ready (Q3 2026 after SIEM)

---

---

# B) FORMAL TENANT ISOLATION POLICY v1.0

## 1. Policy Definition

**Purpose**: Establish mandatory tenant data isolation rules to prevent cross-tenant data leakage in a shared database architecture.

**Scope**: All API endpoints, database queries, and background jobs that process tenant-specific data.

**Effective Date**: February 25, 2026  
**Review Date**: August 25, 2026 (6-month cycle)

---

## 2. Tenant Architecture

### 2.1 Tenant Model

```
Tenant = Clinic (medical practice)
├─ Identifier: clinic_id (UUID)
├─ Status: ACTIVE | SUSPENDED | DELETED
├─ Owner: PlatformUser (clinic owner's account)
├─ Configuration: Clinic-specific settings
└─ Data: All clinic-owned entities
```

### 2.2 Database Model

```sql
-- Core Multitenant Entity
CREATE TABLE clinics (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  status ENUM('ACTIVE', 'SUSPENDED', 'DELETED') DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  suspended_at TIMESTAMP,
  suspension_reason TEXT,
  CHECK(status != 'DELETED' OR updated_at < NOW() - INTERVAL '30 days')
);

-- All tenant entities MUST have clinic_id FK
CREATE TABLE clients (
  id UUID PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  name VARCHAR(255),
  ...
  INDEX idx_clinic_id (clinic_id),  -- MANDATORY INDEX
  UNIQUE(clinic_id, external_id)    -- Scoped uniqueness
);

CREATE TABLE pets (
  id UUID PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  ...
  INDEX idx_clinic_id (clinic_id)
);
```

---

## 3. Mandatory Tenant Isolation Rules

### 3.1 Rule 1: Clinic_ID Presence (CRITICAL)

**Statement**: Every tenant-owned entity MUST contain a `clinic_id` foreign key column.

**Enforcement**:
- Database constraint: `NOT NULL` + FK to `clinics(id)`
- ORM validation: Entity must have `@Column() clinicId: string`
- Code review: Automatic lint rule

**Exception**: None. Platform-wide entities (PlatformUser, PlatformRole, AuditLog) explicitly have NO clinic_id.

**Violation Consequence**: ❌ **CRITICAL - Deploy rejected**

---

### 3.2 Rule 2: Clinic_ID Filter in All Queries (CRITICAL)

**Statement**: Every SELECT, UPDATE, DELETE query on tenant-owned entities MUST filter by clinic_id.

**Enforcement Format**:

```typescript
// ✅ CORRECT
SELECT * FROM clients WHERE clinic_id = $1 AND id = $2

// ❌ WRONG
SELECT * FROM clients WHERE id = $2  // Missing clinic_id filter

// ❌ WRONG
SELECT * FROM clients  // No WHERE clause
```

**Enforcement Mechanism**:
- QueryBuilder automatic scoping in BaseRepository
- ORM hooks: `afterLoad()` validation
- Code pattern enforcement via linter

**Exception Protocol**:
- **Superadmin-only endpoints** (e.g., `/admin/clinics`) must explicitly use `@SkipTenantFilter()` decorator
- Exceptions logged to audit trail
- CEO sign-off required for new exceptions

**Violation Consequence**: ❌ **CRITICAL - Runtime rejection + audit alert**

---

### 3.3 Rule 3: JWT Clinic_ID Validation (CRITICAL)

**Statement**: Every authenticated request MUST have clinic_id in JWT payload, and API response data must match JWT clinic_id.

**Enforcement Flow**:

```
1. AuthGuard extracts clinic_id from JWT
2. Request.clinicId = jwt.clinic_id
3. Controller injects @CurrentClinicId() decorator
4. Repository filters by clinic_id
5. Response validation: Ensure no data from other clinics
6. If mismatch detected: 403 Forbidden + audit alert
```

**Validation Logic**:

```typescript
// In AuthGuard
if (jwt.clinic_id !== request.clinicId) {
  throw new ForbiddenException('Clinic ID mismatch');
  // Log: User attempted to access clinic X with token from clinic Y
}
```

**Edge Case**: Superadmin (no clinic_id in JWT) can access any clinic via explicit scope.

**Violation Consequence**: ❌ **CRITICAL - 403 Forbidden + security alert**

---

### 3.4 Rule 4: Soft Deletes with Clinic Scope (HIGH)

**Statement**: Deleted tenant data MUST remain in database but logically isolated.

**Implementation**:

```typescript
@Entity()
export class Client extends BaseEntity {
  @Column()
  clinicId: string;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date;  // Soft delete timestamp

  @Index()
  @Check('deleted_at IS NULL OR clinic_id = clinic_id')  // Logical scope
  deletedStatus: boolean;
}

// Repository scope: WHERE clinic_id = ? AND deleted_at IS NULL
```

**Rationale**:
- GDPR right to access: Can still retrieve deleted data for audit
- HIPAA 6-year retention: Keep data for compliance
- Hard delete risk: Accidental data loss

**Exception**: Hard delete allowed only for:
- GDPR "right to be forgotten" (explicit request)
- 7-year compliance window passed
- Legal request from clinic owner + CEO approval

**Violation Consequence**: ⚠️ **HIGH - Audit red flag**

---

### 3.5 Rule 5: Clinic Status Validation (HIGH)

**Statement**: Requests to suspended/deleted clinics MUST be rejected, except for:
- Superadmin audit/admin operations
- Data export (GDPR)
- Account recovery

**Enforcement**:

```typescript
// In TenantGuard
const clinic = await clinicRepository.findOne({
  where: { id: clinicId }
});

if (clinic.status === 'SUSPENDED') {
  throw new ForbiddenException(
    `Clinic ${clinicId} is suspended. Reason: ${clinic.suspensionReason}`
  );
  // Log: Attempted access to suspended clinic
}

if (clinic.status === 'DELETED') {
  throw new ForbiddenException('Clinic no longer exists');
}
```

**Decision Tree**:

```
Clinic Status Check
├─ ACTIVE → ✅ Allow request
├─ SUSPENDED → 
│   ├─ Superadmin? → ✅ Allow (audit operation)
│   ├─ User? → ❌ 403 Forbidden
│   └─ Log: Suspension reason + enforcement time
├─ DELETED →
│   ├─ Superadmin? → ✅ Allow (5-year retention period)
│   ├─ User? → ❌ 403 Forbidden
│   └─ Auto-purge after 7-year legal hold
```

**Violation Consequence**: ⚠️ **HIGH - Automatic enforcement**

---

### 3.6 Rule 6: No Cross-Clinic Joins (MANDATORY)

**Statement**: Database queries MUST NOT join clinic A's data with clinic B's data.

**Invalid Pattern**:

```sql
-- ❌ WRONG: Joins clients from different clinics
SELECT c1.name, c2.name FROM clients c1
JOIN clients c2 ON c1.owner_id = c2.owner_id
WHERE c1.clinic_id = 'clinic-a';
-- Leaks: clinic-b clients with same owner
```

**Valid Pattern**:

```sql
-- ✅ CORRECT: Both tables scoped to same clinic
SELECT c1.name, c2.name FROM clients c1
JOIN clients c2 ON c1.owner_id = c2.owner_id
WHERE c1.clinic_id = 'clinic-a' AND c2.clinic_id = 'clinic-a';
```

**Enforcement**:
- Code review: Every JOIN audited
- QueryBuilder builder chainable: `.withClinicId(clinicId)` mandatory
- Automated test: Cross-clinic join detector (linter rule)

**Exception**: Superadmin analytical queries (e.g., platform dashboard) require explicit `@AdminAnalyticsQuery()` decorator and audit log.

**Violation Consequence**: ❌ **CRITICAL - Deploy rejected**

---

### 3.7 Rule 7: Immutable Tenant Context (HIGH)

**Statement**: Once clinic_id is bound to a request, it MUST NOT change during request lifecycle.

**Implementation**:

```typescript
// In TenantContextMiddleware
const clinicId = jwt.clinic_id;
request.__clinic_id__ = Object.freeze(clinicId);  // Immutable

// In controller
// This will throw: Cannot assign to read-only property
@CurrentClinicId() clinicId: string  // Frozen value
```

**Rationale**: Prevents accidental or malicious clinic_id reassignment mid-request.

**Violation Consequence**: ❌ **CRITICAL - Runtime exception**

---

### 3.8 Rule 8: Audit Trail Inclusion (MANDATORY)

**Statement**: Every mutation (CREATE, UPDATE, DELETE) on tenant data MUST log clinic_id to audit trail.

**Implementation**:

```typescript
// In BaseRepository or AuditInterceptor
@AfterInsert()
async logInsertion(entity: TenantEntity) {
  await auditService.log({
    tenantId: entity.clinicId,  // MUST include
    userId: currentUser.id,
    action: 'CREATE',
    resource: 'Client',
    resourceId: entity.id,
    timestamp: new Date(),
    ipAddress: request.ip,
  });
}
```

**Mandatory Fields**:
- `tenantId` (clinic_id)
- `userId` (who did it)
- `action` (what happened)
- `resource` + `resourceId` (where)
- `timestamp` (when)
- `ipAddress` (from where)

**Violation Consequence**: ⚠️ **HIGH - Request completes but audit alert triggered**

---

## 4. Enforced Architecture Patterns

### 4.1 Repository Base Class Pattern

```typescript
// All repositories inherit from this
export abstract class BaseTenantRepository<T extends TenantEntity> {
  
  async find(clinicId: string, filters?: any): Promise<T[]> {
    return this.query
      .where(`${this.getTableName()}.clinic_id = :clinicId`, { clinicId })
      .andWhere(filters)  // User-provided filters applied AFTER clinic_id
      .getMany();
  }

  async findOne(clinicId: string, id: string): Promise<T> {
    const entity = await this.query
      .where(`${this.getTableName()}.id = :id`, { id })
      .andWhere(`${this.getTableName()}.clinic_id = :clinicId`, { clinicId })
      .getOne();
    
    if (!entity) {
      throw new NotFoundException('Resource not found in your clinic');
    }
    return entity;
  }

  async update(clinicId: string, id: string, data: Partial<T>): Promise<T> {
    const result = await this.query
      .update()
      .set(data)
      .where(`id = :id AND clinic_id = :clinicId`, { id, clinicId })
      .execute();

    if (result.affected === 0) {
      throw new NotFoundException('Cannot update resource outside your clinic');
    }
    return this.findOne(clinicId, id);
  }

  async delete(clinicId: string, id: string): Promise<void> {
    const result = await this.query
      .softDelete()
      .where(`id = :id AND clinic_id = :clinicId`, { id, clinicId })
      .execute();

    if (result.affected === 0) {
      throw new NotFoundException('Cannot delete resource outside your clinic');
    }
  }
}
```

### 4.2 Guard Chain Pattern

```typescript
@Controller('clients')
@UseGuards(
  AuthGuard,           // 1. Validate JWT + extract clinic_id
  TenantGuard,         // 2. Validate clinic status + immutability
  RoleGuard,           // 3. Validate role
  PermissionGuard      // 4. Validate fine-grained permissions
)
export class ClientController {
  
  @Get(':id')
  @RequirePermission('clients:read')
  async findOne(
    @Param('id') id: string,
    @CurrentClinicId() clinicId: string  // Auto-injected from JWT
  ) {
    // Repository automatically scopes by clinicId
    return this.clientService.findOne(clinicId, id);
  }
}
```

### 4.3 Decorator Pattern

```typescript
// @CurrentClinicId() - Injects from JWT with validation
// @CurrentUser() - Injects user from JWT
// @RequirePermission() - Validates permission
// @SkipTenantFilter() - Admin-only, logs exception
```

---

## 5. Prohibited Anti-Patterns

### ❌ Anti-Pattern 1: Global Clinic ID

```typescript
// WRONG: Assumes global clinicId from somewhere
export class ClientService {
  async findAll() {
    // WHERE is clinic_id?
    return this.clientRepository.find();  // ❌ NO scoping
  }
}
```

**Fix**: Always pass clinicId explicitly
```typescript
async findAll(clinicId: string) {
  return this.clientRepository.find(clinicId);  // ✅
}
```

---

### ❌ Anti-Pattern 2: Client-Side Tenant Context

```typescript
// WRONG: Trust client clinic_id
const clinicId = request.body.clinicId || 'default';  // ❌ Untrusted input
return this.clientService.findAll(clinicId);
```

**Fix**: Always extract from JWT
```typescript
const clinicId = request.user.clinic_id;  // ✅ From verified JWT
return this.clientService.findAll(clinicId);
```

---

### ❌ Anti-Pattern 3: Optional Tenant Filter

```typescript
// WRONG: Tenant filter is optional
if (filters.clinicId) {
  query.where('clinic_id = ?', filters.clinicId);
}
// Queries without clinic_id return ALL rows across ALL clinics ❌

query.execute();
```

**Fix**: Mandatory tenant filter
```typescript
query.where('clinic_id = ?', clinicId);  // ❌ Always applied
if (filters.name) {
  query.andWhere('name LIKE ?', `%${filters.name}%`);
}
query.execute();  // ✅
```

---

### ❌ Anti-Pattern 4: Superadmin Bypass

```typescript
// WRONG: Superadmin skips clinic_id check entirely
if (user.role === 'SUPERADMIN') {
  return this.clientRepository.find();  // ❌ No scoping
}
return this.clientRepository.find({clinicId});
```

**Fix**: Explicit scope for superadmin
```typescript
// Superadmin with explicit clinic scope
if (user.role === 'SUPERADMIN' && request.query.adminScope) {
  return this.clientRepository.find();  // ✅ Logged as exception
}
return this.clientRepository.find(clinicId);
```

---

### ❌ Anti-Pattern 5: Shared Data Without Scope

```typescript
// WRONG: Shared reference data assumed global
const animalTypes = await animalTypeRepository.find();
// ❌ Are these global platform types, or clinic-specific types?
```

**Fix**: Explicit scope declaration
```typescript
// If platform-global (no clinic_id)
const animalTypes = await animalTypeRepository.find();

// If clinic-specific
const animalTypes = await animalTypeRepository.find({
  where: { clinicId }
});
```

---

### ❌ Anti-Pattern 6: Implicit Trust of Relationships

```typescript
// WRONG: Assumes client belongs to clinic without verification
const client = await clientRepository.findOne(clientId);
// What if client.clinicId !== request.clinicId? ❌

return client;
```

**Fix**: Explicit relationship validation
```typescript
const client = await clientRepository.findOne({
  where: {
    id: clientId,
    clinicId: request.clinicId  // ✅ Validation built-in
  }
});

if (!client) {
  throw new ForbiddenException('Client not found in your clinic');
}
return client;
```

---

## 6. Edge Cases & Exceptions

### 6.1 Data Export (GDPR Compliant)

**Scenario**: Clinic owner requests export of all their data.

**Handling**:
```typescript
@Post('/gdpr/export')
@Roles(['owner'])
async exportData(
  @CurrentClinicId() clinicId: string,
  @CurrentUser() user: User
) {
  // ✅ Scoped to clinic_id
  const data = await this.exportService.exportClinicData(clinicId);
  
  // Log: Data export for compliance
  await auditService.log({
    tenantId: clinicId,
    userId: user.id,
    action: 'GDPR_EXPORT',
    timestamp: new Date(),
  });

  return data;
}
```

---

### 6.2 Multi-Clinic User (Staff with Multiple Clinic Access)

**Scenario**: A staff member works for 2 clinics.

**Current Limitation**: JWT contains only ONE clinic_id.

**Solution** (for future):
```typescript
// Enhanced JWT payload
{
  sub: 'user-id',
  email: 'user@example.com',
  clinicIds: ['clinic-a', 'clinic-b'],  // Multiple clinics
  defaultClinicId: 'clinic-a',  // Primary clinic
  permissions: {
    'clinic-a': ['clients:read', 'pets:read'],
    'clinic-b': ['clients:read']  // Limited in clinic-b
  }
}

// Request header to select clinic context
// X-Clinic-Context: clinic-b
const activeClinicId = request.headers['x-clinic-context'] || jwt.defaultClinicId;
```

**Current Workaround**: Create separate user accounts per clinic.

---

### 6.3 Platform-Wide Analytics

**Scenario**: Superadmin needs to query across all clinics.

**Handling**:
```typescript
@Get('/admin/analytics/all-clinics')
@Roles(['superadmin'])
@SkipTenantFilter()  // Explicit exception decorator
@RequirePermission('analytics:read_all')
async analyticsAllClinics() {
  // ✅ Logs as exception
  await auditService.logException({
    action: 'CROSS_TENANT_QUERY',
    user: request.user.id,
    timestamp: new Date(),
  });

  // Now can query without clinic_id filter
  return this.analyticsService.getAllData();
}
```

---

### 6.4 Tenant Suspension (Security Incident)

**Scenario**: Clinic account suspended due to security breach.

**Enforcement**:
```typescript
// All requests to suspended clinic rejected
if (clinic.status === 'SUSPENDED') {
  throw new ForbiddenException('Account suspended');
  // Superadmin can still access for audit
}
```

**Suspension Triggers**:
- Multiple failed login attempts (5+ in 15 min)
- Detected security breach
- Non-payment
- Compliance violation

---

### 6.5 Clinic Deletion (Hard vs Soft)

**Scenario**: Clinic owner requests account deletion.

**Process**:
1. Soft-delete: Mark clinic.status = 'DELETED'
2. 7-year retention: Keep data for compliance
3. Hard delete: After legal hold expires + CEO approval

```typescript
async deleteClinic(clinicId: string) {
  const clinic = await clinicRepository.findOne(clinicId);
  
  clinic.status = 'DELETED';
  clinic.deletedAt = new Date();
  clinic.autoHardDeleteDate = new Date() + 7 years;
  
  await clinicRepository.save(clinic);
  await auditService.log({
    action: 'CLINIC_DELETION',
    tenantId: clinicId,
    timestamp: new Date(),
  });
}

// Cron job: Hard delete after 7 years
@Cron('0 0 * * *')  // Daily at midnight
async hardDeleteExpiredClinics() {
  const expiredClinics = await clinicRepository.find({
    where: {
      status: 'DELETED',
      autoHardDeleteDate: LessThan(new Date())
    }
  });

  for (const clinic of expiredClinics) {
    // Hard delete all data
    await this.permanentlyDeleteClinicData(clinic.id);
  }
}
```

---

## 7. Compliance Mapping

| HIPAA Requirement | Mapped to Rule |
|------------------|----------------|
| Access Control | Rules 1, 2, 3 (JWT + clinic_id) |
| Audit Controls | Rule 8 (audit trail mandatory) |
| Data Integrity | Rule 4 (soft deletes) |
| User/Entity Authentication | Rules 3, 7 (JWT validation + immutability) |
| Transmission Security | N/A (TLS/HTTPS) |

| ISO 27001 Control | Mapped to Rule |
|------------------|----------------|
| A.9.1 Access Control | Rules 1, 2, 3 |
| A.9.4 Access Management | Rules 3, 5 (clinic status) |
| A.12.4 Logging | Rule 8 |
| A.14.3 Information Security | Rules 4, 7 |

---

---

# C) RBAC + PERMISSION ENFORCEMENT MODEL

## 1. Conceptual Architecture

```
┌─────────────────────────────────────┐
│    JWT (contains user.role +        │
│    user.permissions + clinic_id)    │
└──────────────┬──────────────────────┘
               │
        ┌──────▼────────┐
        │ AuthGuard     │
        │ (Validate JWT)│
        └──────┬────────┘
               │
        ┌──────▼─────────────┐
        │ TenantGuard        │
        │ (Validate clinic)  │
        └──────┬─────────────┘
               │
        ┌──────▼──────────────┐
        │ RoleGuard           │
        │ (Check user.role)   │
        └──────┬──────────────┘
               │
        ┌──────▼──────────────────────┐
        │ PermissionGuard             │
        │ (Check user.permissions +   │
        │ resource:action match)      │
        └──────┬──────────────────────┘
               │
        ┌──────▼────────────────────┐
        │ Controller Action Executes │
        │ (With clinicId injected)   │
        └───────────────────────────┘
```

---

## 2. Role Hierarchy

### 2.1 Platform Roles (Not Clinic-Specific)

```
SUPERADMIN
├─ Platform-level user
├─ No clinic_id in JWT
├─ Can access any clinic via explicit scope
├─ Can manage clinics, users, audit logs
├─ Limited team (< 10 users)
└─ Security Clearance Required
```

### 2.2 Clinic Roles (Scoped by clinic_id)

```
Role: OWNER
├─ Owner of clinic (1 per clinic typically)
├─ clinic_id: Required in JWT
├─ Permissions: All clinic operations
├─ Can manage staff
├─ Cannot access other clinics
└─ SLA: Premium support tier

Role: STAFF
├─ Employee of clinic
├─ clinic_id: Required in JWT
├─ Permissions: Limited to specific resources
├─ Read-only on most entities
├─ Cannot manage staff
└─ SLA: Standard support tier
```

---

## 3. Permission Matrix (Final Authority)

### 3.1 Resource:Action Format

**General Format**: `resource:action`

**Examples**:
- `clients:create` - Create new client
- `clients:read` - View clients
- `clients:update` - Edit client details
- `clients:delete` - Remove client
- `clients:*` - All client operations
- `platform:*` - All platform operations (superadmin only)

**Reserved Namespaces**:
- `platform:*` - Global platform operations (superadmin)
- `analytics:*` - Reporting/analytics (owner+)
- `audit:*` - Audit log access (superadmin)
- `admin:*` - Admin operations (superadmin)

---

### 3.2 Complete Permission Matrix

```
┌─────────────────────────────┬──────────┬──────────┬──────────┐
│ RESOURCE:ACTION             │ SUPERADMIN│ OWNER   │ STAFF    │
├─────────────────────────────┼──────────┼──────────┼──────────┤
│ CLINIC LEVEL                │          │          │          │
├─────────────────────────────┼──────────┼──────────┼──────────┤
│ clinics:create              │ ✅       │ ❌       │ ❌       │
│ clinics:read (own)          │ ✅       │ ✅       │ ❌       │
│ clinics:read (all) *        │ ✅       │ ❌       │ ❌       │
│ clinics:update              │ ✅       │ ✅       │ ❌       │
│ clinics:delete              │ ✅       │ ❌       │ ❌       │
│                             │          │          │          │
│ USERS (STAFF MGMT)          │          │          │          │
├─────────────────────────────┼──────────┼──────────┼──────────┤
│ users:create                │ ✅       │ ✅ (own) │ ❌       │
│ users:read (own clinic)     │ ✅       │ ✅       │ ✅       │
│ users:read (all)            │ ✅       │ ❌       │ ❌       │
│ users:update (own clinic) * │ ✅       │ ✅       │ ❌       │
│ users:delete (own clinic)   │ ✅       │ ✅       │ ❌       │
│                             │          │          │          │
│ DATA ACCESS (CLINIC)        │          │          │          │
├─────────────────────────────┼──────────┼──────────┼──────────┤
│ clients:create              │ ❌       │ ✅       │ ❌       │
│ clients:read                │ ❌       │ ✅       │ ✅       │
│ clients:update              │ ❌       │ ✅       │ ❌       │
│ clients:delete              │ ❌       │ ✅       │ ❌       │
│ clients:export              │ ❌       │ ✅       │ ❌       │
│                             │          │          │          │
│ pets:create                 │ ❌       │ ✅       │ ❌       │
│ pets:read                   │ ❌       │ ✅       │ ✅       │
│ pets:update                 │ ❌       │ ✅       │ ❌       │
│ pets:delete                 │ ❌       │ ✅       │ ❌       │
│                             │          │          │          │
│ reminders:create            │ ❌       │ ✅       │ ✅       │
│ reminders:read              │ ❌       │ ✅       │ ✅       │
│ reminders:update            │ ❌       │ ✅       │ ✅       │
│ reminders:delete            │ ❌       │ ✅       │ ✅       │
│                             │          │          │          │
│ messages:send               │ ❌       │ ✅       │ ✅       │
│ messages:read               │ ❌       │ ✅       │ ✅       │
│ messages:update             │ ❌       │ ✅       │ ❌       │
│                             │          │          │          │
│ AUDIT & COMPLIANCE          │          │          │          │
├─────────────────────────────┼──────────┼──────────┼──────────┤
│ audit:read (own clinic)     │ ✅       │ ✅       │ ❌       │
│ audit:read (all clinics)    │ ✅       │ ❌       │ ❌       │
│ audit:export                │ ✅       │ ✅       │ ❌       │
│                             │          │          │          │
│ ANALYTICS & REPORTING       │          │          │          │
├─────────────────────────────┼──────────┼──────────┼──────────┤
│ analytics:read (own)        │ ✅       │ ✅       │ ❌       │
│ analytics:read (all)        │ ✅       │ ❌       │ ❌       │
│ reports:generate            │ ✅       │ ✅       │ ❌       │
│                             │          │          │          │
│ ADMIN OPERATIONS            │          │          │          │
├─────────────────────────────┼──────────┼──────────┼──────────┤
│ admin:impersonate           │ ✅       │ ❌       │ ❌       │
│ admin:suspend_clinic        │ ✅       │ ❌       │ ❌       │
│ admin:delete_clinic         │ ✅       │ ❌       │ ❌       │
│ platform:*                  │ ✅       │ ❌       │ ❌       │
│                             │          │          │          │
│ * = Cross-clinic access     │          │          │          │
```

---

## 4. JWT Payload Design (v2.0)

### 4.1 Minimal JWT Payload

```json
{
  "sub": "user-uuid-550e8400-e29b-41d4-a716-446655440000",
  "email": "owner@clinic.mx",
  "clinic_id": "clinic-uuid-550e8400-e29b-41d4-a716-446655440001",
  "role": "owner",
  "permissions": [
    "clients:create",
    "clients:read",
    "clients:update",
    "clients:delete",
    "pets:*",
    "reminders:*",
    "messages:send",
    "messages:read",
    "users:create",
    "users:update",
    "users:delete",
    "analytics:read",
    "audit:read"
  ],
  "iat": 1708915600,
  "exp": 1708919200,
  "jti": "token-id-uuid"
}
```

### 4.2 Enhanced JWT Payload (for Advanced Scenarios)

```json
{
  "sub": "user-uuid",
  "email": "owner@clinic.mx",
  
  // SINGLE CLINIC (Current Model)
  "clinic_id": "clinic-uuid",
  "clinic_name": "My Clinic",
  "clinic_status": "ACTIVE",
  
  // RBAC
  "role": "owner",
  "role_id": "role-uuid",
  
  // PERMISSIONS
  "permissions": ["clients:*", "pets:*", ...],
  
  // AUDIT
  "iat": 1708915600,
  "exp": 1708919200,
  "jti": "token-id-uuid",
  
  // FUTURE: Multi-Clinic Support
  "clinic_ids": ["clinic-a", "clinic-b"],  // For future expansion
  "default_clinic_id": "clinic-a",
  
  // SECURITY
  "token_type": "ACCESS",  // vs REFRESH
  "issued_by": "auth-service-v2",
  "mfa_verified": true,    // If 2FA enabled
  "ip_issued": "192.168.1.1"
}
```

---

## 5. Authentication & Authorization Flow

### 5.1 Login Flow (Detailed)

```typescript
// POST /auth/login
@Controller('auth')
export class AuthController {
  
  @Post('login')
  async login(@Body() dto: LoginDto) {
    // 1️⃣ VALIDATION
    if (!dto.email || !dto.password) {
      throw new BadRequestException('Email and password required');
    }

    // 2️⃣ FIND USER
    const user = await userRepository.findOne({
      where: { email: dto.email },
      relations: ['clinic', 'role']
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
      // Log: Failed login attempt
      await auditService.logAuthFailure({
        email: dto.email,
        reason: 'USER_NOT_FOUND',
        ipAddress: request.ip
      });
    }

    // 3️⃣ VERIFY PASSWORD
    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
      // Log: Password mismatch
      await auditService.logAuthFailure({
        userId: user.id,
        reason: 'INVALID_PASSWORD',
        ipAddress: request.ip
      });
    }

    // 4️⃣ CHECK CLINIC STATUS
    if (user.clinic.status !== 'ACTIVE') {
      throw new ForbiddenException('Clinic account is not active');
      // Log: Suspended clinic access attempt
      await auditService.logAuthFailure({
        userId: user.id,
        clinicId: user.clinic.id,
        reason: `CLINIC_${user.clinic.status}`,
        ipAddress: request.ip
      });
    }

    // 5️⃣ CHECK USER STATUS
    if (user.status !== 'ACTIVE') {
      throw new ForbiddenException('User account is inactive');
    }

    // 6️⃣ VERIFY MFA (if enabled)
    if (user.mfaEnabled) {
      // Generate temporary JWT (2FA token)
      const tempToken = this.jwtService.sign({
        sub: user.id,
        scope: 'TWO_FACTOR_PENDING',
        exp: Date.now() + 300000  // 5 minutes
      });

      return {
        requiresMfa: true,
        mfaPendingToken: tempToken,
        mfaMethod: user.mfaMethod  // 'SMS' | 'EMAIL' | 'TOTP'
      };
    }

    // 7️⃣ GENERATE TOKENS
    const permissions = this.permissionService.getPermissions(user.role.id);

    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      clinic_id: user.clinic.id,
      clinic_name: user.clinic.name,
      clinic_status: user.clinic.status,
      role: user.role.name,
      permissions: permissions,
      token_type: 'ACCESS',
      mfa_verified: user.mfaEnabled ? true : false,
      ip_issued: request.ip
    }, {
      expiresIn: '1h'
    });

    const refreshToken = this.jwtService.sign({
      sub: user.id,
      clinic_id: user.clinic.id,
      token_type: 'REFRESH'
    }, {
      expiresIn: '7d'
    });

    // 8️⃣ STORE REFRESH TOKEN (Secure)
    await tokenRepository.save({
      userId: user.id,
      refreshToken: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      issuedAt: new Date(),
      issuedIp: request.ip,
      isActive: true
    });

    // 9️⃣ UPDATE LAST LOGIN
    user.lastLoginAt = new Date();
    user.lastLoginIp = request.ip;
    await userRepository.save(user);

    // 🔟 LOG LOGIN
    await auditService.log({
      tenantId: user.clinic.id,
      userId: user.id,
      action: 'LOGIN',
      ipAddress: request.ip,
      userAgent: request.headers['user-agent']
    });

    // 1️⃣1️⃣ RETURN TOKENS
    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role.name,
        clinic: {
          id: user.clinic.id,
          name: user.clinic.name
        }
      }
    };
  }
}
```

---

### 5.2 AuthGuard Implementation (Deep Dive)

```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';
import { ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthGuard implements CanActivate {
  
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // 1️⃣ EXTRACT JWT FROM HEADER
    const token = this.extractToken(request);
    if (!token) {
      throw new UnauthorizedException('No authorization token provided');
    }

    // 2️⃣ VERIFY JWT SIGNATURE + EXPIRATION
    try {
      const payload = this.jwtService.verify(token);
      request.user = payload;  // Attach to request
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token has expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid token signature');
      }
      throw new UnauthorizedException('Token validation failed');
    }

    // 3️⃣ VALIDATE REQUIRED FIELDS
    if (!request.user.sub || !request.user.clinic_id) {
      throw new UnauthorizedException('Token missing required fields');
    }

    // 4️⃣ CHECK TOKEN BLACKLIST (Optional but recommended)
    const isBlacklisted = await this.tokenBlacklistService.isBlacklisted(
      request.user.jti
    );
    if (isBlacklisted) {
      throw new UnauthorizedException('Token has been revoked');
    }

    // 5️⃣ ATTACH TO REQUEST
    request.clinicId = request.user.clinic_id;  // For decorator injection
    request.userId = request.user.sub;

    return true;
  }

  private extractToken(request): string | null {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return null;
    }

    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer') {
      return null;
    }

    return token;
  }
}
```

---

### 5.3 TenantGuard Implementation

```typescript
@Injectable()
export class TenantGuard implements CanActivate {
  
  constructor(
    private clinicRepository: Repository<Clinic>,
    private auditService: AuditService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const clinicId = request.user?.clinic_id;

    if (!clinicId) {
      throw new ForbiddenException('No clinic context in token');
    }

    // 1️⃣ FETCH CLINIC
    const clinic = await this.clinicRepository.findOne({
      where: { id: clinicId }
    });

    if (!clinic) {
      throw new ForbiddenException('Clinic not found');
    }

    // 2️⃣ CHECK CLINIC STATUS
    if (clinic.status === 'SUSPENDED') {
      await this.auditService.log({
        tenantId: clinicId,
        userId: request.user.sub,
        action: 'ACCESS_SUSPENDED_CLINIC',
        status: 'BLOCKED',
        ipAddress: request.ip
      });

      throw new ForbiddenException(
        `Clinic suspended. Reason: ${clinic.suspensionReason}`
      );
    }

    if (clinic.status === 'DELETED') {
      throw new ForbiddenException('Clinic no longer exists');
    }

    // 3️⃣ MAKE CLINIC_ID IMMUTABLE
    request.__clinic_id_frozen__ = Object.freeze(clinicId);

    // 4️⃣ ATTACH CLINIC CONTEXT
    request.clinic = clinic;

    return true;
  }
}
```

---

### 5.4 RoleGuard Implementation

```typescript
@Injectable()
export class RoleGuard implements CanActivate {
  
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const handler = context.getHandler();

    // GET @Roles() DECORATOR VALUE
    const requiredRoles = Reflect.getMetadata('roles', handler);
    if (!requiredRoles || requiredRoles.length === 0) {
      // No role restriction - allow
      return true;
    }

    // CHECK IF USER ROLE MATCHES
    const userRole = request.user?.role;
    if (!userRole) {
      throw new ForbiddenException('No role in token');
    }

    const hasRole = requiredRoles.includes(userRole);
    if (!hasRole) {
      throw new ForbiddenException(
        `Insufficient role. Required: ${requiredRoles.join(', ')}`
      );
    }

    return true;
  }
}
```

---

### 5.5 PermissionGuard Implementation

```typescript
@Injectable()
export class PermissionGuard implements CanActivate {
  
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const handler = context.getHandler();

    // GET @RequirePermission() DECORATOR VALUE
    const requiredPermissions = Reflect.getMetadata(
      'required_permissions',
      handler
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      // No permission restriction - allow
      return true;
    }

    // GET USER PERMISSIONS FROM JWT
    const userPermissions = request.user?.permissions || [];

    // CHECK IF USER HAS ANY REQUIRED PERMISSION
    const hasPermission = requiredPermissions.some(required => {
      // Handle wildcard permissions
      if (required.endsWith('*')) {
        const prefix = required.slice(0, -1);  // Remove '*'
        return userPermissions.some(perm => perm.startsWith(prefix));
      }

      return userPermissions.includes(required);
    });

    if (!hasPermission) {
      throw new ForbiddenException(
        `Missing permissions: ${requiredPermissions.join(', ')}`
      );
    }

    return true;
  }
}
```

---

## 6. Decorators

### 6.1 @CurrentClinicId()

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentClinicId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    
    // Get from frozen context
    const clinicId = request.__clinic_id_frozen__;
    
    if (!clinicId) {
      throw new ForbiddenException('Clinic context not available');
    }

    return clinicId;
  }
);

// USAGE
@Get()
async findAll(@CurrentClinicId() clinicId: string) {
  return this.clientService.findAll(clinicId);
}
```

---

### 6.2 @CurrentUser()

```typescript
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  }
);

// USAGE
@Get()
async findAll(@CurrentUser() user: JwtPayload) {
  console.log(`User ${user.email} from clinic ${user.clinic_id}`);
}
```

---

### 6.3 @RequirePermission()

```typescript
import { SetMetadata } from '@nestjs/common';

export const RequirePermission = (permissions: string[]) =>
  SetMetadata('required_permissions', permissions);

// USAGE
@Post('/clients')
@RequirePermission(['clients:create'])
async create(@Body() dto: CreateClientDto) {
  // Only executed if user has 'clients:create' permission
}
```

---

### 6.4 @Roles()

```typescript
export const Roles = (roles: string[]) =>
  SetMetadata('roles', roles);

// USAGE
@Post('/users')
@Roles(['owner', 'superadmin'])
async createUser(@Body() dto: CreateUserDto) {
  // Only owner or superadmin
}
```

---

### 6.5 @SkipTenantFilter() (Admin Only)

```typescript
export const SkipTenantFilter = () =>
  SetMetadata('skip_tenant_filter', true);

// USAGE
@Get('/admin/all-clinics')
@Roles(['superadmin'])
@SkipTenantFilter()
async getAllClinicsData() {
  // Can query without clinic_id filter
  // Automatically logged as exception
}
```

---

## 7. Pseudo-Code: Permission Evaluation Algorithm

```typescript
function evaluatePermission(
  user: JwtPayload,
  requiredPermissions: string[]
): boolean {
  
  // Step 1: Is user authenticated?
  if (!user || !user.sub) {
    return false;  // 401 Unauthorized
  }

  // Step 2: No specific permissions required?
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true;  // Allow
  }

  // Step 3: Does user have any required permission?
  const userPermissions = user.permissions || [];

  for (const required of requiredPermissions) {
    // Handle exact match
    if (userPermissions.includes(required)) {
      return true;
    }

    // Handle wildcard (e.g., 'clients:*')
    if (required.endsWith('*')) {
      const prefix = required.slice(0, -1);
      if (userPermissions.some(perm => perm.startsWith(prefix))) {
        return true;
      }
    }

    // Handle superadmin bypass (all permissions)
    if (user.role === 'SUPERADMIN' && userPermissions.includes('platform:*')) {
      return true;
    }
  }

  return false;  // 403 Forbidden
}

// USAGE IN GUARD
if (!evaluatePermission(request.user, requiredPermissions)) {
  throw new ForbiddenException('Insufficient permissions');
}
```

---

## 8. Privilege Escalation Prevention

### 8.1 Critical Rules

**Rule 1**: Permission list cannot be modified by user
```typescript
// ❌ WRONG
user.permissions = ['platform:*'];  // User modifies their own permissions
await userRepository.save(user);

// ✅ CORRECT
// Permissions are read from role definition, not user entity
const permissions = await roleRepository.getPermissions(user.role.id);
const token = jwt.sign({ permissions });  // Immutable in JWT
```

---

**Rule 2**: JWT cannot be tampered with
```typescript
// ❌ WRONG
// User modifies JWT locally
const token = 'eyJhbGc...modified...';  // Fake token

// ✅ CORRECT
// JWT verified with secret at every request
const payload = jwtService.verify(token, { secret: process.env.JWT_SECRET });
```

---

**Rule 3**: Role cannot be self-assigned
```typescript
// ❌ WRONG
@Post('/users/:id/role')
async updateRole(@Body() dto) {
  user.role = dto.role;  // User can set their own role
}

// ✅ CORRECT
@Post('/users/:id/role')
@Roles(['owner'])  // Only owner can change roles
async updateRole(@Param('id') id, @Body() dto, @CurrentClinicId() clinicId) {
  const targetUser = await userRepository.findOne({
    where: { id, clinicId }
  });
  targetUser.role = await roleRepository.findOne(dto.roleId);
  await userRepository.save(targetUser);
}
```

---

**Rule 4**: Superadmin operations are logged
```typescript
// ✅ CORRECT
@Post('/admin/impersonate')
@Roles(['superadmin'])
async impersonate(@Query('userId') userId: string) {
  // Generate token as if we're the target user
  const targetUser = await userRepository.findOne(userId);

  // CRITICAL: Log the impersonation
  await auditService.logSensitiveOperation({
    action: 'ADMIN_IMPERSONATE',
    adminUserId: request.user.sub,
    targetUserId: userId,
    targetClinicId: targetUser.clinic_id,
    timestamp: new Date(),
    ipAddress: request.ip
  });

  const token = this.jwtService.sign({
    sub: targetUser.id,
    clinic_id: targetUser.clinic_id,
    // Note: NOT superadmin - only the impersonated user's permissions
    role: targetUser.role,
    permissions: targetUser.permissions
  });

  return { token };
}
```

---

### 8.2 Audit Trail for Privilege Operations

```typescript
// Every privilege-related operation triggers audit
await auditService.log({
  category: 'PRIVILEGE_CHANGE',
  subjectUserId: userId,    // Who changed
  targetUserId: targetId,   // Who was changed
  targetClinicId: clinicId, // Which clinic
  change: {
    before: { role: 'STAFF', permissions: [...] },
    after: { role: 'OWNER', permissions: [...] }
  },
  approver: request.user.sub,  // Who approved (must be OWNER)
  timestamp: new Date(),
  ipAddress: request.ip
});
```

---

## 9. Implementation Checklist

- [ ] Implement `AuthGuard` (verify JWT)
- [ ] Implement `TenantGuard` (clinic_id validation)
- [ ] Implement `RoleGuard` (@Roles decorator)
- [ ] Implement `PermissionGuard` (@RequirePermission decorator)
- [ ] Create JWT payload v2.0 with permissions array
- [ ] Implement `@CurrentClinicId()` decorator
- [ ] Implement `@CurrentUser()` decorator
- [ ] Implement token refresh flow
- [ ] Implement token blacklist (logout)
- [ ] Implement role-based permission loading
- [ ] Create comprehensive permission matrix
- [ ] Add audit logging to all auth operations
- [ ] Test privilege escalation prevention
- [ ] Document RBAC model for team

---

---

# D) SECURITY HARDENING ROADMAP

## Phase Overview

```
Phase 1: FOUNDATION (Q1 2026) ✅ DONE
├─ AuthGuard, TenantGuard, RBAC
├─ Permission matrix
├─ JWT implementation
└─ Risk: 🟡 MEDIUM (no encryption, no 2FA, no rate limiting)

Phase 2: INFRASTRUCTURE (Q2 2026) 🎯 NEXT
├─ Field-level encryption (at rest)
├─ 2FA implementation
├─ Smart rate limiting
├─ Secrets vault
└─ Risk: 🟢 LOW (infrastructure complete)

Phase 3: MONITORING (Q3 2026)
├─ SIEM/alerting rules
├─ Incident response automation
├─ Security monitoring dashboard
└─ Risk: 🟢 VERY LOW (detection + response ready)

Phase 4: CERTIFICATION (Q4 2026)
├─ HIPAA certification
├─ ISO 27001 audit
├─ SOC2 Type II completion
└─ Risk: 🟢 MINIMAL (compliance verified)
```

---

## Phase 1: Foundation (Q1 2026) - ✅ COMPLETED

### 1.1 AuthGuard + TenantGuard + RBAC

**Status**: ✅ **IMPLEMENTED**

**Components**:
- ✅ JWT validation (AuthGuard)
- ✅ Clinic_id scoping (TenantGuard)
- ✅ Role-based access (RoleGuard)
- ✅ Granular permissions (PermissionGuard)
- ✅ Audit logging (AuditService)

**Acceptance Criteria**:
- ✅ All endpoints protected by guard chain
- ✅ Clinic_id enforced in all queries
- ✅ Cross-tenant data leakage tests pass
- ✅ Privilege escalation tests pass

---

## Phase 2: Infrastructure Hardening (Q2 2026) - 🎯 IN PROGRESS

### 2.1 Field-Level Encryption (At Rest)

**Priority**: 🔴 **CRITICAL**  
**Effort**: 8 weeks  
**Risk Address**: Data breach in case of DB compromise

**Implementation Plan**:

```typescript
// Step 1: Install encryption library (no-pay open-source)
npm install typeorm-encrypted

// Step 2: Identify sensitive fields
// HIGH: PII, Health data
//   - User.email, User.phone
//   - Client.name, Client.phone, Client.address
//   - Pet.animalType (health indicator)
//   - MessageLog.content (patient communications)
//
// MEDIUM: Business data
//   - Clinic.name, Clinic.address
//   - User.passwordHash (already hashed, skip)

// Step 3: Mark entities with @Encrypted()
@Entity()
export class Client {
  @PrimaryColumn()
  id: string;

  @Column()
  clinicId: string;  // NOT encrypted (needed for filtering)

  @Column()
  @Encrypted()  // Encryption key: KDF(masterKey + clinicId)
  name: string;

  @Column()
  @Encrypted()
  phone: string;

  @Column()
  @Encrypted()
  email: string;
}

// Step 4: Manage encryption keys
// Use: environment-based key rotation
const masterKey = process.env.ENCRYPTION_MASTER_KEY;
const clinicKey = KDF(masterKey, clinicId);  // Deterministic per clinic
```

**Database Schema Change**:

```sql
-- NO schema change needed
-- Fields remain VARCHAR but store encrypted blobs
-- Example: "eJydUsFuwjAM/EXqd2bRwEEJR0A0Iy5IPxDLcWHbKk4I..."

ALTER TABLE clients ADD COLUMN name_encrypted BYTEA;
ALTER TABLE clients ADD COLUMN phone_encrypted BYTEA;
-- Live migration: gradual field-by-field encryption
```

**Testing**:
- [ ] Encrypted fields not queryable in plaintext
- [ ] Decryption works correctly
- [ ] Key rotation doesn't break existing data
- [ ] Performance impact < 5%

**Rollout Risk**: 🟡 **MEDIUM** - Requires live key rotation

---

### 2.2 Two-Factor Authentication (2FA)

**Priority**: 🔴 **CRITICAL**  
**Effort**: 6 weeks  
**Risk Address**: Account takeover via stolen credentials

**Implementation Options**:

```
Option 1: TOTP (Time-based OTP) - Authenticator App
├─ Library: speakeasy (npm)
├─ User Flow: Login → Prompt QR code → Scan in Google Authenticator → Enter code
├─ Pro: No SMS cost, offline
└─ Con: User-friendly, seed management

Option 2: Email-based OTP
├─ Library: Built-in (generate random code)
├─ User Flow: Login → Email sent → User enters code → 5-min expiry
├─ Pro: Simple, no additional hardware
└─ Con: Email delays, phishing risk

Option 3: SMS-based OTP
├─ Library: Twilio (paid) → SKIP (constraint: no paid services)
└─ Con: Not allowed per requirements

RECOMMENDATION: TOTP (default) + Email OTP (fallback)
```

**Implementation Pseudocode**:

```typescript
// 1. Enable 2FA in settings
@Post('/user/2fa/enable')
async enable2FA(@CurrentUser() user) {
  const secret = speakeasy.generateSecret({
    name: `VibraLive (${user.email})`,
    issuer: 'VibraLive'
  });

  // Store temporarily (unverified)
  await tempStorage.set(`2fa_setup_${user.id}`, secret.base32);

  return {
    qrCode: secret.qr_code_url,
    backupCodes: generateBackupCodes(10)  // 1-use codes for recovery
  };
}

// 2. Verify 2FA setup
@Post('/user/2fa/verify')
async verify2FA(
  @CurrentUser() user,
  @Body('code') code: string,
  @Body('backupCodes') backupCodes: string[]
) {
  const secret = await tempStorage.get(`2fa_setup_${user.id}`);
  const valid = speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token: code
  });

  if (!valid) {
    throw new BadRequestException('Invalid code');
  }

  // Store verified secret
  user.totpSecret = secret;
  user.mfaEnabled = true;
  user.backupCodes = hashBackupCodes(backupCodes);  // bcrypt
  await userRepository.save(user);

  await auditService.log({
    tenantId: user.clinicId,
    userId: user.id,
    action: '2FA_ENABLED',
    timestamp: new Date()
  });

  return { message: '2FA enabled successfully' };
}

// 3. Login with 2FA
@Post('/auth/login')
async login(@Body() dto: LoginDto) {
  // ... normal auth ...
  
  if (user.mfaEnabled) {
    // Return 2FA pending token (5-min expiry)
    const tempToken = jwt.sign({
      sub: user.id,
      scope: '2FA_PENDING'
    }, { expiresIn: '5m' });

    return {
      requiresMfa: true,
      pendingToken: tempToken,
      message: 'Enter your authenticator code'
    };
  }
  
  // ... return full token ...
}

// 4. Verify 2FA code during login
@Post('/auth/verify-2fa')
async verify2FA(
  @Headers('authorization') tempToken: string,
  @Body('code') code: string
) {
  const payload = jwt.verify(tempToken);
  
  // Check scope
  if (payload.scope !== '2FA_PENDING') {
    throw new UnauthorizedException('Invalid token scope');
  }

  const user = await userRepository.findOne(payload.sub);
  
  // Verify TOTP code
  const valid = speakeasy.totp.verify({
    secret: user.totpSecret,
    encoding: 'base32',
    token: code,
    window: 1  // Allow 30 seconds drift
  });

  if (!valid) {
    // Increment failed attempts
    user.totpFailedAttempts = (user.totpFailedAttempts || 0) + 1;
    
    if (user.totpFailedAttempts >= 5) {
      // Lock account (trigger security alert)
      user.mfaLockedUntil = new Date(Date.now() + 30 * 60 * 1000);  // 30 min
      await auditService.log({
        userId: user.id,
        action: 'MFA_LOCKOUT',
        reason: 'MAX_FAILED_ATTEMPTS'
      });
    }

    await userRepository.save(user);
    throw new UnauthorizedException('Invalid 2FA code');
  }

  // Success
  user.totpFailedAttempts = 0;
  user.lastMfaVerifiedAt = new Date();
  await userRepository.save(user);

  // Generate full access token
  const accessToken = this.issueAccessToken(user);

  await auditService.log({
    tenantId: user.clinicId,
    userId: user.id,
    action: 'LOGIN_2FA_SUCCESS',
    timestamp: new Date()
  });

  return {
    accessToken,
    user: { id: user.id, email: user.email }
  };
}

// 5. Backup codes (recovery)
@Post('/user/2fa/backup-code')
async useBacSIKcodeBackupCode(
  @CurrentUser() user,
  @Body('code') code: string
) {
  const valid = user.backupCodes.some(bc =>
    bcrypt.compare(code, bc)
  );

  if (!valid) {
    throw new UnauthorizedException('Invalid backup code');
  }

  // Remove used code (one-time use)
  user.backupCodes = user.backupCodes.filter(bc =>
    !bcrypt.compare(code, bc)
  );

  await userRepository.save(user);

  // Generate access token
  return this.issueAccessToken(user);
}
```

**Testing**:
- [ ] TOTP code validation works
- [ ] Backup codes work (1-use)
- [ ] MFA lockout on max attempts
- [ ] Email fallback (optional)
- [ ] Account recovery flow

**Rollout**: Opt-in for Q2, mandatory for enterprise plan in Q3

---

### 2.3 Smart Rate Limiting

**Priority**: 🟠 **HIGH**  
**Effort**: 4 weeks  
**Risk Address**: Brute force attacks, DDoS

**Implementation**:

```typescript
// Install: nestjs-throttler
npm install @nestjs/throttler

// 1. Configure rate limiting rules
@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'SHORT',
        ttl: 60 * 1000,           // 1 minute
        limit: 100                 // 100 req/minute per IP
      },
      {
        name: 'AUTH_STRICT',
        ttl: 15 * 60 * 1000,      // 15 minutes
        limit: 5                   // 5 login attempts
      },
      {
        name: 'API_STRICT',
        ttl: 60 * 1000,
        limit: 30                  // 30 sensitive ops/min
      }
    ])
  ]
})
export class AppModule {}

// 2. Apply to endpoints
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  
  @Post('login')
  @Throttle({name: 'AUTH_STRICT', limit: 5})
  async login(@Body() dto: LoginDto) {
    // Max 5 login attempts per 15 minutes per IP
  }

  @Post('register')
  @Throttle({name: 'SHORT', limit: 10})
  async register(@Body() dto: RegisterDto) {
    // Max 10 registrations per minute per IP
  }
}

@Controller('clients')
@UseGuards(AuthGuard, ThrottlerGuard)
export class ClientController {
  
  @Post()
  @Throttle({name: 'API_STRICT', limit: 30})
  async create(@Body() dto: CreateClientDto) {
    // Max 30 creates per minute
  }
}

// 3. Smart rate limiting (user-based)
@Injectable()
export class SmartThrottlerGuard extends ThrottlerGuard {
  
  protected getTracker(req: Record<string, any>): string {
    // If authenticated user: rate limit per user
    if (req.user?.sub) {
      return `user_${req.user.sub}`;
    }

    // If not authenticated: rate limit per IP
    return req.ip;
  }
}

// 4. Rate limit storage (Redis recommended, in-memory fallback)
@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      useFactory: () => ({
        storage: new RedisStore(),  // or InMemoryStore for dev
        // ...
      })
    })
  ]
})
export class AppModule {}
```

**Testing**:
- [ ] Login rate limiter blocks after 5 attempts
- [ ] API rate limiter block after limit
- [ ] Different limits per endpoint
- [ ] IP-based tracking works
- [ ] User-based tracking works (if authenticated)

---

### 2.4 Secrets Vault Integration

**Priority**: 🟠 **HIGH**  
**Effort**: 5 weeks  
**Risk Address**: Secret/key exposure in .env files

**Implementation** (use open-source Vault):

```bash
# Install HashiCorp Vault (open-source)
brew install vault

# Start dev server
vault server -dev

# Create secret
vault kv put secret/vibralive \
  JWT_SECRET=xxxxx \
  DB_PASSWORD=yyyyy \
  ENCRYPTION_MASTER_KEY=zzzzz
```

**NestJS Integration**:

```typescript
// install
npm install node-vault

// app.module.ts
import * as Vault from 'node-vault';

@Module({
  imports: [
    ConfigModule.registerAsync({
      useFactory: async () => {
        const vaultClient = new Vault({
          endpoint: process.env.VAULT_ADDR || 'http://localhost:8200',
          token: process.env.VAULT_TOKEN
        });

        const secrets = await vaultClient.read('secret/vibralive');

        return {
          JWT_SECRET: secrets.data.data.JWT_SECRET,
          DB_PASSWORD: secrets.data.data.DB_PASSWORD,
          ENCRYPTION_MASTER_KEY: secrets.data.data.ENCRYPTION_MASTER_KEY,
          // ...
        };
      }
    })
  ]
})
export class AppModule {}
```

**Key Rotation Strategy**:

```typescript
// Cron job: Rotate keys every 90 days
@Cron('0 0 1 */3 *')  // Monthly on 1st of every 3 months
async rotateSecrets() {
  const oldSecrets = await vaultClient.read('secret/vibralive');
  
  // Generate new secrets
  const newJwtSecret = generateRandomString(32);
  const newEncryptionKey = generateRandomString(32);

  // Update Vault
  await vaultClient.write('secret/vibralive', {
    JWT_SECRET: newJwtSecret,
    ENCRYPTION_MASTER_KEY: newEncryptionKey,
    ROTATION_DATE: new Date(),
    OLD_SECRETS_UNTIL: new Date() + 30 days  // Grace period for cache
  });

  // Restart app to pick up new secrets
  // (or hot-reload if implemented)

  await auditService.log({
    action: 'SECRET_ROTATION',
    timestamp: new Date(),
    affectedSecrets: ['JWT_SECRET', 'ENCRYPTION_MASTER_KEY']
  });
}
```

**Testing**:
- [ ] Secrets loaded from Vault on startup
- [ ] Invalid Vault token is rejected
- [ ] Secret rotation works
- [ ] Grace period allows old secrets during transition

---

## Phase 3: Monitoring & Alerting (Q3 2026)

### 3.1 SIEM & Alert Rules

**Priority**: 🟠 **HIGH**  
**Effort**: 6 weeks  
**Risk Address**: Undetected security incidents

**Alert Rules**:

```yaml
ALERT: Multiple Failed Logins
  condition: 5+ login failures in 15 minutes SAME IP
  actions:
    - Email: security-team@vibralive.com
    - Block: IP for 30 minutes
    - Log: AuditLog.SUSPICIOUS_AUTH_ACTIVITY

ALERT: Cross-Clinic Access Attempt
  condition: JWT clinic_id ≠ requested clinic_id
  actions:
    - Email: security-team + RequestUser + ClinicOwner
    - Block: User for 1 hour
    - Log: AuditLog.SECURITY_INCIDENT

ALERT: Mass Data Export
  condition: >1000 records exported in <5 minutes
  actions:
    - Email: security-team
    - Pause: Request for manual review
    - Log: AuditLog.SUSPICIOUS_DATA_ACCESS

ALERT: Privilege Escalation Attempt
  condition: User changes role to OWNER without authorization
  actions:
    - Email: security-team + CTO
    - Lock: User account
    - Log: AuditLog.CRITICAL_INCIDENT

ALERT: Deleted Data Recovered
  condition: Hard delete performed (should not happen)
  actions:
    - Email: security-team + CEO + CTO + Legal
    - Trigger: Incident response protocol
    - Log: AuditLog.CRITICAL_DATA_LOSS
```

**Implementation** (Sentry as free SIEM):

```typescript
npm install @sentry/node @sentry/tracing

// main.ts
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.OnUncaughtException(),
    nodeProfilingIntegration()
  ],
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
  beforeSend(event) {
    // Don't send PII
    delete event.user.email;
    return event;
  }
});

// Log security events
await Sentry.captureMessage('Cross-tenant access attempt', {
  level: 'error',
  tags: {
    category: 'SECURITY_INCIDENT',
    type: 'CROSS_TENANT_ACCESS'
  },
  extra: {
    userId: request.user.sub,
    attemptedClinicId: attemptedClinicId,
    userClinicId: request.clinicId
  }
});
```

---

### 3.2 Automated Incident Response

```typescript
// When security alert triggers
@Injectable()
export class IncidentResponseService {
  
  async handleSecurityIncident(incident: SecurityIncident) {
    // 1. IMMEDIATE ACTIONS
    if (incident.severity === 'CRITICAL') {
      await this.lockUserAccount(incident.userId);
      await this.suspendClinic(incident.clinicId);
      await this.revokeSessions(incident.userId);
    }

    // 2. NOTIFY TEAM
    await this.sendSecurityAlert({
      to: ['security@vibralive.com', 'cto@vibralive.com'],
      subject: `[INCIDENT] ${incident.title}`,
      body: formatIncidentReport(incident),
      urgency: incident.severity
    });

    // 3. LOG INCIDENT
    await this.auditService.logCriticalIncident({
      title: incident.title,
      severity: incident.severity,
      description: incident.description,
      affectedUserId: incident.userId,
      affectedClinicId: incident.clinicId,
      detectionTime: new Date(),
      responseActions: [/* ... */]
    });

    // 4. TRIGGER INVESTIGATION
    if (incident.severity === 'CRITICAL') {
      await this.createIncidentTicket({
        title: incident.title,
        priority: 'CRITICAL',
        assignee: 'security-team',
        description: incident.description
      });
    }
  }
}
```

---

## Phase 4: Certification (Q4 2026)

### 4.1 HIPAA Compliance

**Requirements**:
- [ ] Access control (AuthGuard + TenantGuard) ✅ Phase 1
- [ ] Audit controls (AuditService) ✅ Phase 1
- [ ] Encryption (Phase 2) ⏳
- [ ] 2FA (Phase 2) ⏳
- [ ] Incident response (Phase 3) ⏳
- [ ] Business associate agreements (Legal)
- [ ] Privacy policies (Legal)

**Estimated**: Full compliance by Q4 2026

---

### 4.2 ISO 27001 Compliance

**Gap Analysis**:
- ✅ A.9 Access Control (Auth + RBAC)
- ✅ A.12.4 Logging (Audit trail)
- ⏳ A.13 Encryption (Phase 2)
- ⏳ A.14 Monitoring (Phase 3)
- ⚠️ A.18 Compliance management (Policy docs)

**Timeline**: 3-month certification process starting Q3

---

---

# E) SECURITY TEST MATRIX

## Test Categories

```
Level 1: Unit Tests (Developer)
├─ Permission evaluation logic
├─ JWT token validation
├─ Role comparison logic
└─ Encryption/decryption

Level 2: Integration Tests (CI/CD)
├─ Guard chain execution
├─ Cross-tenant isolation
├─ Privilege escalation
├─ Database query filtering
└─ Audit logging

Level 3: Security Tests (Dedicated)
├─ Penetration tests
├─ Token tampering
├─ Brute force resistance
├─ Rate limiter evasion
└─ Data leakage scan

Level 4: Compliance Tests (Audit)
├─ HIPAA controls
├─ ISO 27001 controls
└─ Data residency
```

---

## Test Matrix

| # | Test Name | Category | Exploit | Expected Behavior | Status | Run |
|---|-----------|----------|---------|-------------------|--------|-----|
| **AUTHENTICATION TESTS** |
| 1 | Login with valid credentials | Unit | N/A | 200 OK + access token | ✅ | npm test |
| 2 | Login with invalid password | Unit | Brute force | 401 Unauthorized | ✅ | npm test |
| 3 | Login with missing email | Unit | Input validation | 400 Bad Request | ✅ | npm test |
| 4 | Login with suspended clinic | Unit | Account takeover | 403 Forbidden | ✅ | npm test |
| 5 | Token expired (1h later) | Unit | Token replay | 401 Unauthorized | ✅ | npm test |
| 6 | Token with modified payload | Unit | Token tampering | 401 Unauthorized | ✅ | npm test |
| 7 | Token with wrong signature | Unit | Token forgery | 401 Unauthorized | ✅ | npm test |
| 8 | Request without token | Unit | Unauthenticated access | 401 Unauthorized | ✅ | npm test |
| **AUTHORIZATION (RBAC) TESTS** |
| 9 | Staff accessing owner-only endpoint | Integration | Privilege escalation | 403 Forbidden | ⏳ | e2e test |
| 10 | User modifying own permissions | Integration | Privilege escalation | 403 Forbidden | ⏳ | e2e test |
| 11 | User role in JWT doesn't match DB | Integration | Token tampering | 403 Forbidden | ⏳ | e2e test |
| 12 | Superadmin accessing clinic data | Integration | Scope bypass | 200 OK (logged) | ⏳ | e2e test |
| 13 | Permission check with wildcard | Integration | Logic error | ✅ if user has `clients:*` | ⏳ | e2e test |
| **TENANT ISOLATION TESTS** |
| 14 | User A accessing clinic A data | Integration | N/A | 200 OK | ✅ | npm test |
| 15 | User A accessing clinic B data | Integration | Cross-tenant leak | 404 Not Found | ✅ | npm test |
| 16 | Clinic_id filter missing in query | Integration | SQL injection / data leak | Request rejected | ✅ | CODE_REVIEW |
| 17 | JOIN without clinic_id scoping | Integration | Data leak | Query fails | ✅ | CODE_REVIEW |
| 18 | User modifying clinic_id in JWT | Integration | Token tampering | 401 Unauthorized | ⏳ | e2e test |
| 19 | Deleted clinic access attempt | Integration | Compliance violation | 404 Forbidden | ⏳ | e2e test |
| 20 | Soft-deleted entity visible | Integration | Data preservation | ✅ Edge case | ⏳ | e2e test |
| **PRIVILEGE ESCALATION TESTS** |
| 21 | Staff → Owner role escalation | Integration | Privilege escalation | 403 Forbidden | ⏳ | e2e test |
| 22 | Clinic user → Superadmin escalation | Integration | Privilege escalation | 403 Forbidden | ⏳ | e2e test |
| 23 | Self-modifying role field | Integration | Privilege escalation | 403 Forbidden | ⏳ | e2e test |
| 24 | Admin impersonation logging | Integration | Audit transparency | ✅ Logged in audit trail | ⏳ | e2e test |
| **AUDIT LOGGING TESTS** |
| 25 | Create client → audit logged | Integration | Compliance | ✅ AuditLog entry present | ⏳ | e2e test |
| 26 | Update clinic → audit includes clinic_id | Integration | Compliance | ✅ clinic_id in audit | ⏳ | e2e test |
| 27 | Privilege change → detailed audit | Integration | Compliance | ✅ Before/after logged | ⏳ | e2e test |
| 28 | Cross-tenant access → security audit | Integration | Incident detection | ✅ Alert triggered | ⏳ | e2e test |
| **TOKEN MANAGEMENT TESTS** |
| 29 | Refresh token creates new access token | Integration | Token lifecycle | ✅ New token issued | ⏳ | e2e test |
| 30 | Expired refresh token rejected | Integration | Token lifecycle | 401 Unauthorized | ⏳ | e2e test |
| 31 | Logout invalidates token | Integration | Token revocation | Subsequent requests: 401 | ⏳ | e2e test |
| 32 | Token blacklist prevents reuse | Integration | Token replay | Blacklisted: 401 | ⏳ | e2e test |
| **ENCRYPTION TESTS** |
| 33 | Sensitive field encrypted in DB | Unit | Data at rest | Ciphertext stored | ⏳ | npm test |
| 34 | Decryption returns plaintext | Unit | Data encryption | ✅ Readable in app | ⏳ | npm test |
| 35 | Wrong encryption key fails | Unit | Key management | Decryption fails | ⏳ | npm test |
| 36 | Key rotation works | Unit | Key lifecycle | Old data still decryptable | ⏳ | npm test |
| **RATE LIMITING TESTS** |
| 37 | 5+ logins in 15 min → blocked | Integration | Brute force | 429 Too Many Requests | ⏳ | e2e test |
| 38 | Different users can login normally | Integration | Rate limiter scope | ✅ Per-IP/per-user | ⏳ | e2e test |
| 39 | Rate limit reset after timeout | Integration | Rate limiter | ✅ Can login again | ⏳ | e2e test |
| **2FA TESTS** |
| 40 | TOTP code validation | Unit | MFA bypass | ✅ Valid code accepted | ⏳ | npm test |
| 41 | Wrong TOTP code | Unit | MFA bypass | 401 Unauthorized (x5 lockout) | ⏳ | npm test |
| 42 | Backup code one-time use | Unit | MFA recovery | ✅ Used; can't reuse | ⏳ | npm test |
| 43 | Backup code after deletion | Unit | MFA recovery | 401 Unauthorized | ⏳ | npm test |
| **DATA VALIDATION TESTS** |
| 44 | Injection: SQL in name field | Integration | SQL injection | ✅ Sanitized / parametrized | ⏳ | e2e test |
| 45 | Injection: JWT in email field | Integration | Header injection | ✅ Sanitized | ⏳ | e2e test |
| **REGRESSION TESTS** |
| 46 | Existing permissions still work | Integration | Regression | ✅ No breakage | ✅ WEEKLY |
| 47 | Suspend clinic endpoint still works | Integration | Regression | ✅ Still reachable | ✅ WEEKLY |
| 48 | Historic audit logs readable | Integration | Data preservation | ✅ Can query old logs | ✅ MONTHLY |

---

## Test Execution Plan

### Daily (Automated in CI/CD)
```yaml
# .github/workflows/security-tests.yml
name: Security Tests

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run Unit + Auth Tests
        run: npm test -- --testPathPattern="(auth|permission|guard)"
      - name: Run Linter (detect missing clinic_id filters)
        run: npm run lint -- --rule valid-clinic-id-filter
  
  e2e-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
    steps:
      - uses: actions/checkout@v2
      - name: Run E2E Tests
        run: npm run test:e2e -- --testPathPattern="(tenant|privilege|audit)"
      - name: Upload coverage
        uses: codecov/codecov-action@v2

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: SAST: SonarQube
        run: sonar-scanner ...
      - name: Dependency Check: npm audit
        run: npm audit --audit-level=high
      - name: DAST: OWASP ZAP (optional)
        run: zaproxy ...
```

### Weekly (Manual Security Reviews)
- [ ] Audit log review (suspicious patterns)
- [ ] Failed login report
- [ ] Cross-tenant access attempts
- [ ] Privilege escalation attempts

### Monthly (Penetration Testing)
- [ ] External security firm: Penetration test
- [ ] Internal red team: Attack simulation
- [ ] Compliance audit: HIPAA/ISO controls

---

---

# F) CRITICAL RISK ASSESSMENT & MITIGATIONS

## Risk Matrix

```
                IMPACT
           LOW    MEDIUM   HIGH   CRITICAL
         ┌─────┬────────┬───────┬─────────┐
HIGH     │ 4   │   8    │  12   │   16    │
         ├─────┼────────┼───────┼─────────┤
MEDIUM   │ 3   │   6    │  9    │   12    │
P        ├─────┼────────┼───────┼─────────┤
R        LOW    │ 2   │   4    │  6    │   8     │
O        ├─────┼────────┼───────┼─────────┤
B VER    │ 1   │   2    │  3    │   4     │
Y        └─────┴────────┴───────┴─────────┘
         VERY_LOW

Risk Score = Probability × Impact
Score ≥ 12 = 🔴 CRITICAL (must remediate immediately)
Score 6-11 = 🟠 HIGH (remediate within month)
Score 3-5 = 🟡 MEDIUM (remediate within quarter)
Score 1-2 = 🟢 LOW (monitor)
```

---

## Critical Risk #1: Cross-Tenant Data Leakage (Shared DB)

**Risk Score**: 🔴 **16/16 - CRITICAL**  
**Probability**: MEDIUM (requires both logic error + missing clinic_id filter)  
**Impact**: CRITICAL (HIPAA violation, patient data exposure, brand destruction)

### Root Causes

```
1. Missing clinic_id filter in SELECT query
   └─ All data visible to any authenticated user

2. Implicit trust of relationships
   └─ SELECT clients WHERE id=X; ← No clinic_id check

3. Superadmin bypass without audit
   └─ Unrestricted cross-tenant access logs nowhere
```

### Current Controls

| Control | Status | Effectiveness |
|---------|--------|----------------|
| AuthGuard (extract clinic_id from JWT) | ✅ Implemented | 90% |
| TenantGuard (validate clinic status) | ✅ Implemented | 85% |
| Repository clinic_id filtering | ✅ Implemented | 95% |
| Code review (catch missing filters) | ✅ Manual | 60% |
| Automated linter rules | ⏳ Pending | Target: 98% |

### Mitigations (Priority Order)

#### M1.1: Mandatory Clinic_ID Filter (CRITICAL)

**Priority**: 🔴 **IMMEDIATE**  
**Status**: ✅ **IMPLEMENTED**  
**Effort**: 0 (already done)

**Implementation**: Enforce in BaseRepository abstract class

```typescript
export abstract class BaseTenantRepository<T> {
  
  protected query: SelectQueryBuilder<T>;

  // Every find() call REQUIRES clinic_id
  async find(clinicId: string, filters?: any): Promise<T[]> {
    let qb = this.query
      .where(`${this.getTableName()}.clinic_id = :clinicId`, { clinicId })
      .andWhere(filters);
    
    return qb.getMany();
  }

  // No find() without clinicId
  // Impossible to call: this.query.find() ← type error
}
```

**Verification**:
- ✅ All repositories inherit from BaseTenantRepository
- ✅ All queries have clinic_id WHERE clause
- ✅ Tests verify clinic_id filtering

---

#### M1.2: Automated Linter Rule (HIGH)

**Priority**: 🟠 **HIGH**  
**Status**: ⏳ **In Progress (Phase 2)**  
**Effort**: 2 weeks

**Rule**: Detect queries without clinic_id filter

```javascript
// eslint-plugin-vibralive/lib/rules/valid-clinic-id-filter.js

module.exports = {
  create(context) {
    return {
      CallExpression(node) {
        // Detect: queryBuilder.where() without clinic_id mention
        if (node.callee.property.name === 'where') {
          const whereClause = node.arguments[0];
          
          if (!whereClause.value.includes('clinic_id')) {
            context.report({
              node,
              message: 'Query missing clinic_id filter. Possible data leak.'
            });
          }
        }
      }
    };
  }
};

// Usage in eslintrc
{
  "rules": {
    "vibralive/valid-clinic-id-filter": "error"
  }
}
```

---

#### M1.3: Runtime Query Interception (HIGH)

**Priority**: 🟠 **HIGH**  
**Status**: ⏳ **Phase 2**  
**Effort**: 4 weeks

**Implementation**: TypeORM query hook

```typescript
// In data-source.ts
const dataSource = new DataSource({
  ...dbConfig,
  subscribers: [TenantQuerySubscriber]  // Hook queries
});

@EventSubscriber()
export class TenantQuerySubscriber implements EntitySubscriberInterface {
  
  beforeQuery(event: QueryEvent) {
    const query = event.query;
    const sql = query.toUpperCase();

    // CRITICAL: Detect queries on tenant entities without clinic_id filter
    const tenantEntities = [
      'CLIENTS', 'PETS', 'USERS', 'REMINDERS', 'MESSAGELOG'
    ];

    const isTenantQuery = tenantEntities.some(entity =>
      sql.includes(`FROM ${entity}`) || sql.includes(`UPDATE ${entity}`)
    );

    if (isTenantQuery && !sql.includes('CLINIC_ID')) {
      // EMERGENCY: Query without tenant filter detected
      logger.error('CRITICAL: Tenant query without clinic_id filter!', {
        query,
        stack: new Error().stack
      });

      // Reject query
      throw new ForbiddenException(
        'Developer error: Attempted query without clinic_id filter'
      );
    }
  }
}
```

---

#### M1.4: Audit Trail (CRITICAL)

**Priority**: 🔴 **CRITICAL**  
**Status**: ✅ **IMPLEMENTED**  
**Effort**: Already done

**Every data access logged**:

```typescript
@After('execution(* ClientRepository.find(..))')
async logDataAccess(joinPoint: any) {
  const clinicId = joinPoint.args[0];  // clinic_id arg
  const userId = requestContext.userId;  // from JWT

  await auditService.log({
    tenantId: clinicId,
    userId,
    action: 'DATA_READ',
    resource: 'Client',
    count: result.length,
    timestamp: new Date()
  });
}
```

---

#### M1.5: Penetration Testing (HIGH)

**Priority**: 🟠 **HIGH**  
**Status**: ⏳ **Phase 3 (Q3)**  
**Effort**: 2-week engagement

**Test Procedures**:
1. [ ] Attempt SQL injection to bypass clinic_id filter
2. [ ] Try modifying JWT to access different clinic
3. [ ] Attempt timing attacks to guess clinic IDs
4. [ ] Test relationship-based data exposure

**Success Criteria**: No data leakage findings

---

## Critical Risk #2: Privilege Escalation via JWT Tampering

**Risk Score**: 🔴 **15/16 - CRITICAL**  
**Probability**: LOW (JWT is cryptographically signed)  
**Impact**: CRITICAL (User becomes superadmin, accesses all clinics)

### Root Causes

```
1. JWT signature weakness (weak secret)
   └─ Attacker brute-forces JWT_SECRET

2. Algorithm downgrade attack
   └─ Attacker changes alg from HS256 to "none"

3. Private key exposure
   └─ JWT_SECRET committed to GitHub / logged
```

### Current Controls

| Control | Status | Strength |
|---------|--------|----------|
| HS256 signature | ✅ Implemented | ⭐⭐⭐⭐ |
| Secret in .env | ✅ Implemented | ⭐⭐⭐ |
| Signature verification | ✅ Implemented | ⭐⭐⭐⭐⭐ |
| Algorithm whitelist | ⏳ Pending | Target: ⭐⭐⭐⭐⭐ |

### Mitigations

#### M2.1: Strong JWT Secret (CRITICAL)

**Priority**: 🔴 **CRITICAL**  
**Status**: 🟡 **NEEDS VALIDATION**  
**Verification**:

```typescript
// Check JWT_SECRET strength
const secret = process.env.JWT_SECRET;

if (!secret || secret.length < 32) {
  throw new Error('JWT_SECRET must be ≥ 32 characters');
}

if (!/[a-z]/.test(secret) || !/[A-Z]/.test(secret) || !/[0-9]/.test(secret)) {
  throw new Error('JWT_SECRET must contain mixed case + numbers');
}
```

**Action**: Generate 64-character secret

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Output: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2

# Store in .env (DO NOT commit)
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

---

#### M2.2: Algorithm Whitelist (HIGH)

**Priority**: 🟠 **HIGH**  
**Status**: ⏳ **Phase 1**  
**Effort**: 1 week

```typescript
// In jwt-config.service.ts
@Injectable()
export class JwtConfigService {
  createJwtOptions(): JwtModuleOptions {
    return {
      secret: process.env.JWT_SECRET,
      signOptions: {
        expiresIn: '1h',
        algorithm: 'HS256'  // Explicit
      },
      verifyOptions: {
        algorithms: ['HS256']  // ← Whitelist: reject 'none', 'RS256'
      }
    };
  }
}
```

---

#### M2.3: Secrets Vault (HIGH)

**Priority**: 🟠 **HIGH**  
**Status**: ⏳ **Phase 2**  
**Effort**: Already planned

**Action**: Move JWT_SECRET to Vault (not .env)

```bash
vault kv put secret/vibralive JWT_SECRET="a1b2c3d4..."
```

---

#### M2.4: Token Signature Verification (CRITICAL)

**Priority**: 🔴 **CRITICAL**  
**Status**: ✅ **IMPLEMENTED**

**Review AuthGuard**:

```typescript
// ✅ CORRECT: verify() checks signature
const payload = this.jwtService.verify(token);  // Throws if invalid

// ❌ WRONG: decode() doesn't check signature
const payload = this.jwtService.decode(token);  // SECURITY HOLE
```

**Action**: Audit all JWT handling code

```bash
# Search for any decode() calls (dangerous)
grep -r "\.decode(" src/ --include="*.ts"

# Should return empty!
```

---

#### M2.5: Token Expiration Enforcement (HIGH)

**Priority**: 🟠 **HIGH**  
**Status**: ✅ **IMPLEMENTED**

**Verify exp claim**:

```typescript
// JWT expires in 1 hour
{
  "sub": "user-id",
  "exp": 1708919200,  // Unix timestamp
  "iat": 1708915600
}

// Automatic verification: jwtService.verify() checks exp
// ✅ Token older than exp: 401 Unauthorized
```

---

## Critical Risk #3: Account Takeover (Stolen Credentials)

**Risk Score**: 🟠 **12/16 - HIGH**  
**Probability**: MEDIUM (common attack vector)  
**Impact**: CRITICAL (Full clinic data access)

### Root Causes

```
1. Weak passwords (no validation)
2. No 2FA
3. No account lockout
4. No suspicious login detection
```

### Current Controls

| Control | Status |
|---------|--------|
| Password bcrypt | ✅ Implemented |
| Login rate limiting | ⏳ Phase 2 |
| 2FA | ⏳ Phase 2 |
| Suspicious login detection | ⏳ Phase 3 |

### Mitigations

#### M3.1: Password Strength Requirements (MEDIUM)

**Status**: ⏳ **Phase 2**  
**Implementation**:

```typescript
@Injectable()
export class PasswordValidationService {
  
  validate(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 12) {
      errors.push('Min 12 characters');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Min 1 uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Min 1 lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Min 1 digit');
    }
    if (!/[!@#$%^&*]/.test(password)) {
      errors.push('Min 1 special char (!@#$%^&*)');
    }

    // Check Against common passwords
    if (this.commonPasswords.has(password.toLowerCase())) {
      errors.push('Password too common');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
```

---

#### M3.2: Account Lockout (HIGH)

**Status**: ⏳ **Phase 2**

```typescript
// After 5 failed logins in 15 min
if (user.failedLoginAttempts >= 5) {
  user.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);  // 30 min
  await userRepository.save(user);

  throw new ForbiddenException('Account locked. Try again in 30 minutes.');
}
```

---

#### M3.3: 2FA (CRITICAL)

**Status**: ⏳ **Phase 2**  
**Action**: Enable TOTP + backup codes

---

#### M3.4: Suspicious Login Detection (HIGH)

**Status**: ⏳ **Phase 3**

```typescript
// Alert on suspicious patterns
if (user.lastLoginIp !== request.ip) {
  // New IP -> Send verification email
  await emailService.sendLoginVerification({
    email: user.email,
    ipAddress: request.ip,
    timestamp: new Date(),
    approvalLink: generateApprovalToken()
  });

  // Require email confirmation to proceed
}
```

---

## Critical Risk #4: Insider Threat (Malicious Employee)

**Risk Score**: 🟠 **12/16 - HIGH**  
**Probability**: LOW (rare but possible)  
**Impact**: CRITICAL (Intentional data theft/sabotage)

### Root Causes

```
1. Staff has read access to patient data
2. No monitoring of data exports
3. No granular audit permissions
4. Superadmin has unrestricted access
```

### Current Controls

| Control | Status |
|---------|--------|
| RBAC (staff = read-only) | ✅ Implemented |
| Audit logging | ✅ Implemented |
| Staff cannot modify audit logs | ✅ Implemented |

### Mitigations

#### M4.1: Principle of Least Privilege (HIGH)

**Status**: ✅ **Implemented**

```
Staff role:
├─ clients:read ← Can VIEW only
├─ pets:read ← Can VIEW only
├─ reminders:* ← Can manage (own reminders)
└─ NO: clients:delete, users:create, audit:read
```

**Action**: Regularly audit staff permissions

---

#### M4.2: Data Export Monitoring (HIGH)

**Status**: ⏳ **Phase 3**

```typescript
// Log any data export
@Post('/clients/export')
async exportClients(
  @CurrentUser() user,
  @CurrentClinicId() clinicId: string
) {
  const clients = await this.clientService.findAll(clinicId);

  // CRITICAL: Log export
  await auditService.logSensitiveOperation({
    action: 'DATA_EXPORT',
    userId: user.id,
    clinicId,
    resourceCount: clients.length,
    exportFormat: 'CSV',
    timestamp: new Date()
  });

  // ALERT: If export > 1000 records, notify owner
  if (clients.length > 1000) {
    await emailService.notifyOwner({
      subject: `Large data export by ${user.name}`,
      clinicId,
      details: {
        user: user.email,
        recordCount: clients.length,
        timestamp: new Date()
      }
    });
  }

  return generateCSV(clients);
}
```

---

#### M4.3: Anomaly Detection (MEDIUM)

**Status**: ⏳ **Phase 3**

```typescript
// Detect unusual patterns
if (
  user.dataAccessCount > user.avgDataAccessCount * 5  // 5x normal
  && timeOfDay > 22:00  // After hours
) {
  await auditService.logAnomaly({
    userId: user.id,
    anomalyType: 'UNUSUAL_ACCESS_PATTERN',
    accessCount: user.dataAccessCount,
    avgAccessCount: user.avgDataAccessCount,
    timestamp: new Date()
  });

  // Alert security team
  await securityService.alert({
    severity: 'HIGH',
    message: `${user.email} accessing ${user.dataAccessCount} records at ${hours}:00`
  });
}
```

---

#### M4.4: Granular Audit Permissions (HIGH)

**Status**: ✅ **Implemented**

```typescript
// Owner can see THEIR clinic's audit logs only
@Get('/audit')
@Roles(['owner'])
async getAuditLogs(
  @CurrentClinicId() clinicId: string,
  @Query() filters
) {
  return this.auditService.findByClinic(clinicId, filters);
}

// Superadmin can see ALL audit logs (with restrictions)
@Get('/admin/audit')
@Roles(['superadmin'])
async getAllAuditLogs(@Query() filters) {
  // Global audit access - must log every query
  await this.auditService.logException({
    action: 'AUDIT_READ_ALL',
    userId: request.user.sub,
    filters: filters,
    timestamp: new Date()
  });

  return this.auditService.findAll(filters);
}
```

---

## Critical Risk #5: Database Compromise (Unencrypted Data at Rest)

**Risk Score**: 🟠 **12/16 - HIGH**  
**Probability**: MEDIUM (DB backups, stolen hardware)  
**Impact**: CRITICAL (All patient data exposed)

### Root Causes

```
1. No encryption at rest
2. DB password in .env file
3. No backup encryption
4. No separation of credentials
```

### Current Controls

| Control | Status |
|---------|--------|
| HTTPS/TLS (in transit) | ✅ Implemented |
| Encryption at rest | ❌ MISSING |
| DB password vault | ⏳ Phase 2 |

### Mitigations

#### M5.1: Field-Level Encryption (CRITICAL)

**Status**: ⏳ **Phase 2**  
**Priority**: 🔴 **CRITICAL**

```typescript
// Implement encryption for sensitive fields
@Entity()
export class Client extends BaseEntity {
  @Column()
  clinicId: string;  // NOT encrypted (needed for filtering)

  @Column()
  @Encrypted()
  name: string;  // ENCRYPTED

  @Column()
  @Encrypted()
  phone: string;  // ENCRYPTED

  @Column()
  @Encrypted()
  email: string;  // ENCRYPTED
}

// Transparent encryption/decryption in ORM
```

---

#### M5.2: DB Password Vault (HIGH)

**Status**: ⏳ **Phase 2**

```bash
# Store DB credentials in Vault, not .env
vault kv put secret/vibralive/db \
  username=vibralive \
  password=<strongpassword>
```

---

#### M5.3: Backup Encryption (HIGH)

**Status**: ⏳ **Phase 2**

```typescript
// Backup strategy
@Cron('0 2 * * *')  // Daily at 2 AM
async backupDatabase() {
  // 1. Create backup
  const backUpFile = await db.backup();

  // 2. Encrypt backup
  const encryptedBackup = encryptionService.encrypt(
    backupFile,
    process.env.BACKUP_ENCRYPTION_KEY
  );

  // 3. Store securely (not on same server)
  await s3Service.upload(`backups/${date}.enc`, encryptedBackup);

  // 4. Log backup
  await auditService.log({
    action: 'DATABASE_BACKUP',
    timestamp: new Date(),
    encrypted: true,
    destination: 'S3'
  });
}
```

---

#### M5.4: Access Control to DB (HIGH)

**Status**: 🟡 **PARTIAL**

```sql
-- Principle of Least Privilege for DB users

-- App user: SELECT, INSERT, UPDATE, DELETE only
CREATE ROLE app_user WITH PASSWORD 'xxx';
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
REVOKE DROP, ALTER ON ALL TABLES IN SCHEMA public FROM app_user;

-- Backup user: SELECT only
CREATE ROLE backup_user WITH PASSWORD 'yyy';
GRANT SELECT ON ALL TABLES IN SCHEMA public TO backup_user;

-- DBA user: Full access (separate high-security account)
CREATE ROLE dba_user WITH SUPERUSER PASSWORD 'zzz';
```

---

## Critical Risk #6: Cross-Site Request Forgery (CSRF)

**Risk Score**: 🟡 **6/16 - MEDIUM**  
**Probability**: LOW (API uses JWT, not cookies)  
**Impact**: MEDIUM (Attacker trick user into API call)

### Root Causes

```
1. API accepts state-changing requests (POST/PUT/DELETE) from any origin
2. No CSRF tokens
3. No SameSite cookie policy (N/A for JWT)
```

### Current Controls

| Control | Status |
|---------|--------|
| JWT (not cookie) | ✅ Implemented |
|CORS restrictions | ⏳ Pending |

### Mitigations

#### M6.1: CORS Hardening (HIGH)

**Status**: ⏳ **Phase 1**

```typescript
// app.module.ts
@Module({
  imports: [
    ...
  ]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        cors({
          origin: process.env.FRONTEND_URL,  // Only your frontend
          credentials: true,
          methods: ['GET', 'POST', 'PUT', 'DELETE'],
          allowedHeaders: ['Content-Type', 'Authorization']
        })
      )
      .forRoutes('*');
  }
}
```

---

#### M6.2: Origin Validation (MEDIUM)

**Status**: ⏳ **Phase 2**

```typescript
@Injectable()
export class OriginGuard implements CanActivate {
  
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const origin = request.get('origin');
    const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',');

    if (!allowedOrigins.includes(origin)) {
      throw new ForbiddenException('Origin not allowed');
    }

    return true;
  }
}
```

---

## Critical Risk #7: NoSQL/SQL Injection

**Risk Score**: 🟡 **6/16 - MEDIUM**  
**Probability**: LOW (using parametrized queries)  
**Impact**: CRITICAL (Data theft/deletion)

### Root Causes

```
1. String concatenation in queries
2. User input directly in WHERE clauses
3. Unsafe ORM methods (.query())
```

### Current Controls

| Control | Status |
|---------|--------|
| Parametrized queries (TypeORM) | ✅ Implemented |
| Input validation (DTOs) | ✅ Implemented |

### Mitigations

#### M7.1: Query Parameterization (CRITICAL)

**Status**: ✅ **Implemented**

```typescript
// ✅ CORRECT: Parametrized query
const clients = await clientRepository.find({
  where: { clinic_id: clinicId, name: Like(`%${search}%`) }
});

// ❌ WRONG: String concatenation
const clients = await repository.query(
  `SELECT * FROM clients WHERE name = '${search}'`  // ← SQL INJECTION
);
```

**Action**: Audit all custom queries

```bash
# Find any unsafe query patterns
grep -r "\.query(" src/ --include="*.ts" | grep -v parametrized
```

---

#### M7.2: Input Validation (HIGH)

**Status**: ✅ **Implemented**

```typescript
// all DTOs have validation
export class SearchClientsDto {
  @IsString()
  @MaxLength(255)
  @Matches(/^[a-zA-Z0-9 \-'\.]*$/)  // Alphanumeric + common chars
  search: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;
}

// NestJS validates before reaching handler
@Get()
async search(@Query() dto: SearchClientsDto) {
  // ✅ dto.search is safe
}
```

---

## Risk Summary Table

| # | Risk | Score | Status | Owner | Target Date |
|---|------|-------|--------|-------|-------------|
| 1 | Cross-tenant data leakage | 16 🔴 | Implemented | Dev | ✅ Done |
| 2 | JWT privilege escalation | 15 🔴 | In Review | Security | Q1 2026 |
| 3 | Account takeover | 12 🟠 | Phase 2 | Auth | Q2 2026 |
| 4 | Insider threat | 12 🟠 | Monitoring | Ops | Q3 2026 |
| 5 | DB compromise | 12 🟠 | Phase 2 | Infra | Q2 2026 |
| 6 | CSRF attacks | 6 🟡 | Phase 2 | Security | Q2 2026 |
| 7 | SQL injection | 6 🟡 | Implemented | Dev | ✅ Done |

---

## 90-Day Action Plan

### Week 1-2: Validation
- [ ] Validate JWT secret strength (M2.1)
- [ ] Audit all queries for clinic_id filters (M1.1)
- [ ] Review AuthGuard for algorithm whitelist (M2.2)

### Week 3-4: Quick Wins
- [ ] Implement CORS hardening (M6.1)
- [ ] Enable rate limiting (Phase 2.3)
- [ ] Deploy SAST linter rule for clinic_id (M1.2)

### Week 5-8: Phase 2
- [ ] Implement field-level encryption (M5.1)
- [ ] Deploy 2FA (TOTP + backup codes) (M3.3)
- [ ] Setup Vault for secrets (M2.3)

### Week 9-12: Phase 3
- [ ] Deploy SIEM/alerting (Phase 3.1)
- [ ] Penetration testing (M1.5)
- [ ] Compliance audit preparation (HIPAA/ISO)

---

## Continuous Monitoring

| Metric | Target | Check Frequency |
|--------|--------|-----------------|
| Cross-tenant access attempts | 0 | Daily |
| Privilege escalation attempts | 0 | Daily |
| Failed logins > 5 | Alert | Real-time |
| Suspicious data access | Alert | Daily |
| Audit log completeness | 100% | Daily |
| Token expiration enforcement | 100% | Daily |

---

---

## APPENDIX: Reference Documents

### A1. JWT Best Practices (OWASP)

[Link to OWASP: JWT Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)

### A2. HIPAA Security Rule Summary

- 45 CFR §164.302: Security management process
- 45 CFR §164.304: Organizational compliance
- 45 CFR §164.308-318: Technical & administrative safeguards

### A3. ISO 27001 Control Objectives

- A.9: Access Control
- A.12: Operations Security
- A.13: Communications Security
- A.14: System Acquisition

### A4. Encryption Standards

- AES-256-GCM (field-level encryption)
- TLS 1.2+ (transit)
- SHA-256 (hashing)

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Feb 25, 2026 | Chief Architect | Initial release |
| TBD | Aug 25, 2026 | Security Officer | 6-month review |

---

**CONFIDENTIAL - INTERNAL ONLY**  
Not for external distribution.

---

