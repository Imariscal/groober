# ESPECIFICACIÓN TÉCNICA - PLATFORM ADMIN PANEL

**Versión:** 1.0  
**Fecha:** Febrero 24, 2026  
**Autor:** CTO / Product Architecture  
**Estado:** Especificación de Producción  

---

## 📋 TABLA DE CONTENIDOS

1. [Visión Ejecutiva](#visión-ejecutiva)
2. [Arquitectura RBAC](#arquitectura-rbac)
3. [Modelo de Datos](#modelo-de-datos)
4. [Especificación de UI/UX](#especificación-de-uiux)
5. [Endpoints REST](#endpoints-rest)
6. [Recomendaciones Técnicas Frontend](#recomendaciones-técnicas-frontend)
7. [Consideraciones de Seguridad](#consideraciones-de-seguridad)
8. [Roadmap de Implementación](#roadmap-de-implementación)

---

## 🎯 VISIÓN EJECUTIVA

### Propósito
El Platform Admin Panel es la consola de control centralizada para el equipo interno de VibraLive. Permite:
- Gestión del ciclo completo de tenants (creación, suspensión, eliminación)
- Control de acceso granular basado en roles
- Monitoreo de métricas y auditoría
- Gestión de suscripciones y límites operacionales

### Users y Casos de Uso
| Usuario | Responsabilidades |
|---------|------------------|
| **Platform SuperAdmin** | Acceso total: crear clínicas, usuarios, ver auditoría global, manejar planes |
| **Platform Support** | Asistencia: crear usuarios, resetear password, suspender, NO crear clínicas |
| **Platform Finance** | Consulta: ver planes, métricas de facturación, auditoría (read-only) |

### Scope MVP
- ✅ CRUD clínicas + estado activo/suspendido
- ✅ CRUD usuarios con invitaciones por email (magic link)
- ✅ Roles y permisos clínicos (clinic_owner, clinic_staff)
- ✅ Auditoría de acciones
- ✅ Métricas básicas por clínica
- ❌ Manejo de planes/billing (MVP+)

---

## 🔐 ARQUITECTURA RBAC

### 1. Modelo de Tres Capas

```
┌─────────────────────────────────────────────┐
│      PLATAFORMA (Global)                    │
│  Roles: SuperAdmin, Support, Finance        │
│  Scope: Toda la plataforma                  │
└─────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────┐
│      CLÍNICA (Tenant)                       │
│  Roles: Owner, Staff, Manager               │
│  Scope: Solo su clínica                     │
└─────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────┐
│      RECURSO (Entity)                       │
│  Granularidad: Usuarios, Clientes, Mascotas│
└─────────────────────────────────────────────┘
```

### 2. Roles de Plataforma (Platform Level)

#### 2.1 PLATFORM_SUPERADMIN
```
Descripción: Control total de la plataforma
Permisos:
  - clinics:create
  - clinics:read
  - clinics:update
  - clinics:delete
  - clinics:suspend
  - clinics:activate
  
  - users:create (plataforma)
  - users:read
  - users:update
  - users:invite
  - users:reset_password
  - users:impersonate
  - users:deactivate
  
  - audit_logs:read
  - audit_logs:export
  
  - plans:read
  - plans:update
  
  - permissions:read
  - permissions:manage
  
Restricciones:
  - No puede eliminar su propia cuenta
  - Impersonation se registra en auditoría
```

#### 2.2 PLATFORM_SUPPORT
```
Descripción: Soporte y asistencia a clínicas
Permisos:
  - clinics:read
  - clinics:suspend (solo request, aprueba SuperAdmin)
  - clinics:activate
  
  - users:read (en contexto de clínica)
  - users:create (en contexto de clínica)
  - users:invite
  - users:reset_password
  - users:deactivate
  
  - audit_logs:read (filtrado a sus tickets)
  
Restricciones:
  - No puede ver otras clínicas
  - No puede impersonate
  - No puede cambiar planes
```

#### 2.3 PLATFORM_FINANCE
```
Descripción: Consulta y reportería financiera
Permisos:
  - clinics:read (read-only)
  - plans:read
  - audit_logs:read (read-only)
  - reports:read
  
Restricciones:
  - Solo lectura
  - No puede crear ni modificar nada
```

### 3. Roles de Clínica (Clinic Level)

**Nota:** Estos roles existen en la clínica y son gestionados por clinic_owner o platform_superadmin.

#### 3.1 CLINIC_OWNER
```
Descripción: Dueño/Administrador de la clínica
Permisos:
  - clinic_users:create
  - clinic_users:read
  - clinic_users:update (roles, deactivate)
  - clinic_users:delete
  - clinic_users:invite
  
  - clinic_settings:read
  - clinic_settings:update
  
  - clinic_audit_logs:read
  
  - clinic_clients:read
  - clinic_pets:read
  - clinic_reminders:read
  
Restricciones:
  - Solo en su clínica
  - No puede impersonate
  - No puede cambiar su propio rol
```

#### 3.2 CLINIC_STAFF
```
Descripción: Personal operativo de la clínica
Permisos:
  - clinic_clients:create
  - clinic_clients:read
  - clinic_clients:update
  - clinic_clients:delete
  
  - clinic_pets:create
  - clinic_pets:read
  - clinic_pets:update
  - clinic_pets:delete
  
  - clinic_reminders:read
  - clinic_reminders:create (solo si flag habilitado)
  
Restricciones:
  - No puede tocar usuarios
  - No puede ver settings
  - No puede ver auditoría
```

#### 3.3 CLINIC_MANAGER (Opcional MVP+)
```
Descripción: Gerente con permisos extendidos
Permisos:
  - Todos los de CLINIC_STAFF
  + clinic_users:read
  + clinic_reminders:manage
  + clinic_audit_logs:read
```

### 4. Matriz de Permisos Granulares

```
┌────────────────────────────────────────────────────────────┐
│ RECURSO: clinics                                           │
├────────────────────┬──────────┬─────────┬─────────┬────────┤
│ Acción             │ SuperAd  │ Support │ Finance │ Owner  │
├────────────────────┼──────────┼─────────┼─────────┼────────┤
│ clinics:list       │    ✓     │    ✓    │    ✓    │   -    │
│ clinics:create     │    ✓     │    ✕    │    ✕    │   -    │
│ clinics:read       │    ✓     │    ✓    │    ✓    │   -    │
│ clinics:update     │    ✓     │    ✕    │    ✕    │   -    │
│ clinics:delete     │    ✓     │    ✕    │    ✕    │   -    │
│ clinics:suspend    │    ✓     │  request│    ✕    │   -    │
│ clinics:activate   │    ✓     │    ✓    │    ✕    │   -    │
└────────────────────┴──────────┴─────────┴─────────┴────────┘

┌────────────────────────────────────────────────────────────┐
│ RECURSO: platform_users                                    │
├────────────────────┬──────────┬─────────┬─────────┬────────┤
│ Acción             │ SuperAd  │ Support │ Finance │ Owner  │
├────────────────────┼──────────┼─────────┼─────────┼────────┤
│ users:list         │    ✓     │    ✓    │    ✕    │   -    │
│ users:create       │    ✓     │    ✓    │    ✕    │   -    │
│ users:read         │    ✓     │    ✓    │    ✕    │   -    │
│ users:update       │    ✓     │    ✓    │    ✕    │   -    │
│ users:delete       │    ✓     │    ✕    │    ✕    │   -    │
│ users:invite       │    ✓     │    ✓    │    ✕    │   -    │
│ users:impersonate  │    ✓     │    ✕    │    ✕    │   -    │
└────────────────────┴──────────┴─────────┴─────────┴────────┘
```

### 5. Estrategia de Implementación en NestJS

#### 5.1 Guards Recomendados

```typescript
// 1. AuthGuard (JWT válido) - Global
@UseGuards(AuthGuard)

// 2. PlatformRoleGuard (verifica rol de plataforma)
@UseGuards(PlatformRoleGuard)
@RequirePlatformRole('PLATFORM_SUPERADMIN', 'PLATFORM_SUPPORT')

// 3. PermissionGuard (verificar permiso específico)
@UseGuards(PermissionGuard)
@RequirePermission('clinics:create', 'clinics:update')

// 4. TenantGuard (verificar acceso al tenant)
@UseGuards(TenantGuard)

// 5. ImpersonationGuard (si está en modo impersonate, verifica auditoría)
@UseGuards(ImpersonationGuard)
```

#### 5.2 Almacenamiento de Permisos

**Opción A: Hardcoded (Recomendado MVP)**
- Roles y permisos definidos en código
- Fast queries
- Menor complejidad

**Opción B: Base de Datos**
- Roles y permisos en tabla
- Modificable en runtime
- Mejor para MVP+ con customización

**Para MVP:** Opción A + Base de datos para asignación de roles a usuarios.

#### 5.3 Estructura de Datos en JWT

```json
{
  "sub": "user-id-uuid",
  "email": "admin@vibralive.test",
  "platform_role": "PLATFORM_SUPERADMIN",
  "clinic_id": null,
  "clinic_role": null,
  "permissions": ["clinics:create", "clinics:read", ...],
  "impersonating": false,
  "original_user_id": null,
  "iat": 1708828314,
  "exp": 1708914714
}
```

#### 5.4 Tabla de Estructura Entity para Roles

```typescript
// platform_roles.entity.ts
@Entity('platform_roles')
export class PlatformRole {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ unique: true })
  key: string; // PLATFORM_SUPERADMIN, PLATFORM_SUPPORT, etc.

  @Column()
  name: string;

  @Column()
  description: string;

  @Column('simple-array')
  permissions: string[]; // ['clinics:create', 'clinics:read', ...]

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @ManyToMany(() => PlatformUser, u => u.platform_roles)
  platform_users: PlatformUser[];
}

// platform_users.entity.ts
@Entity('platform_users')
export class PlatformUser {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  email: string;

  @Column()
  full_name: string;

  @Column()
  password_hash: string;

  @Column({ default: 'INVITED' }) // INVITED, ACTIVE, DEACTIVATED
  status: string;

  @ManyToMany(() => PlatformRole, r => r.platform_users)
  @JoinTable({
    name: 'platform_user_roles',
    joinColumn: { name: 'user_id' },
    inverseJoinColumn: { name: 'role_id' }
  })
  platform_roles: PlatformRole[];

  @Column({ nullable: true })
  impersonating_clinic_id: string; // Null si no está impersonando

  @Column({ nullable: true })
  impersonating_user_id: string; // Quién es esta persona en realidad

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()> vibralive-api@0.1.0 build
> nest build

src/database/migrations/1708720800000-CreatePlatformTables.ts:168:9 - error TS2353: Object literal may only specify known properties, and 'primaryKeyConstraint' does not exist in type 'TableOptions'.

168         primaryKeyConstraint: {
            ~~~~~~~~~~~~~~~~~~~~
src/database/seeds/seed.ts:37:11 - error TS2451: Cannot redeclare block-scoped variable 'userRepository'.

37     const userRepository = AppDataSource.getRepository(User);
             ~~~~~~~~~~~~~~
src/database/seeds/seed.ts:44:41 - error TS2769: No overload matches this call.
  Overload 1 of 3, '(entityLikeArray: DeepPartial<User>[]): User[]', gave the following error.
    Object literal may only specify known properties, and 'clinic_id' does not exist in type 'DeepPartial<User>[]'.
  Overload 2 of 3, '(entityLike: DeepPartial<User>): User', gave the following error.
    Type '"active"' is not assignable to type 'DeepPartial<"ACTIVE" | "INVITED" | "DEACTIVATED"> | undefined'. Did you mean '"ACTIVE"'?

44       const superAdmin = userRepository.create({
                                           ~~~~~~

  src/database/entities/user.entity.ts:42:3
    42   status!: 'INVITED' | 'ACTIVE' | 'DEACTIVATED';
         ~~~~~~
    The expected type comes from property 'status' which is declared here on type 'DeepPartial<User>'
src/database/seeds/seed.ts:67:33 - error TS2769: No overload matches this call.
  Overload 1 of 3, '(entityLikeArray: DeepPartial<Clinic>[]): Clinic[]', gave the following error.
    Object literal may only specify known properties, and 'name' does not exist in type 'DeepPartial<Clinic>[]'.
  Overload 2 of 3, '(entityLike: DeepPartial<Clinic>): Clinic', gave the following error.
    Type '"active"' is not assignable to type 'DeepPartial<"ACTIVE" | "SUSPENDED" | "DELETED"> | undefined'. Did you mean '"ACTIVE"'?

67       clinic = clinicRepository.create({
                                   ~~~~~~

  src/database/entities/clinic.entity.ts:49:3
    49   status!: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
         ~~~~~~
    The expected type comes from property 'status' which is declared here on type 'DeepPartial<Clinic>'
src/database/seeds/seed.ts:109:11 - error TS2451: Cannot redeclare block-scoped variable 'userRepository'.      

109     const userRepository = AppDataSource.getRepository(User);
              ~~~~~~~~~~~~~~
src/database/seeds/seed.ts:120:34 - error TS2769: No overload matches this call.
  Overload 1 of 3, '(entityLikeArray: DeepPartial<User>[]): User[]', gave the following error.
    Object literal may only specify known properties, and 'clinic_id' does not exist in type 'DeepPartial<User>[]'.
  Overload 2 of 3, '(entityLike: DeepPartial<User>): User', gave the following error.
    Type '"active"' is not assignable to type 'DeepPartial<"ACTIVE" | "INVITED" | "DEACTIVATED"> | undefined'. Did you mean '"ACTIVE"'?

120       ownerUser = userRepository.create({
                                     ~~~~~~

  src/database/entities/user.entity.ts:42:3
    42   status!: 'INVITED' | 'ACTIVE' | 'DEACTIVATED';
         ~~~~~~
    The expected type comes from property 'status' which is declared here on type 'DeepPartial<User>'
src/database/seeds/seed.ts:146:40 - error TS2769: No overload matches this call.
  Overload 1 of 3, '(entityLikeArray: DeepPartial<User>[]): User[]', gave the following error.
    Object literal may only specify known properties, and 'clinic_id' does not exist in type 'DeepPartial<User>[]'.
  Overload 2 of 3, '(entityLike: DeepPartial<User>): User', gave the following error.
    Type '"active"' is not assignable to type 'DeepPartial<"ACTIVE" | "INVITED" | "DEACTIVATED"> | undefined'. Did you mean '"ACTIVE"'?

146       const staffUser = userRepository.create({
                                           ~~~~~~

  src/database/entities/user.entity.ts:42:3
    42   status!: 'INVITED' | 'ACTIVE' | 'DEACTIVATED';
         ~~~~~~
    The expected type comes from property 'status' which is declared here on type 'DeepPartial<User>'
src/modules/auth/auth.service.ts:38:9 - error TS2367: This comparison appears to be unintentional because the types '"ACTIVE" | "INVITED" | "DEACTIVATED"' and '"active"' have no overlap.

38     if (user.status !== 'active') {
           ~~~~~~~~~~~~~~~~~~~~~~~~
src/modules/auth/auth.service.ts:56:42 - error TS2769: No overload matches this call.
  Overload 1 of 3, '(entityLikeArray: DeepPartial<Clinic>[]): Clinic[]', gave the following error.
    Object literal may only specify known properties, and 'name' does not exist in type 'DeepPartial<Clinic>[]'.
  Overload 2 of 3, '(entityLike: DeepPartial<Clinic>): Clinic', gave the following error.
    Type '"active"' is not assignable to type 'DeepPartial<"ACTIVE" | "SUSPENDED" | "DELETED"> | undefined'. Did you mean '"ACTIVE"'?

56     const clinic = this.clinicRepository.create({
                                            ~~~~~~

  src/database/entities/clinic.entity.ts:49:3
    49   status!: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
         ~~~~~~
    The expected type comes from property 'status' which is declared here on type 'DeepPartial<Clinic>'
src/modules/auth/auth.service.ts:69:38 - error TS2769: No overload matches this call.
  Overload 1 of 3, '(entityLikeArray: DeepPartial<User>[]): User[]', gave the following error.
    Object literal may only specify known properties, and 'clinic_id' does not exist in type 'DeepPartial<User>[]'.
  Overload 2 of 3, '(entityLike: DeepPartial<User>): User', gave the following error.
    Type '"active"' is not assignable to type 'DeepPartial<"ACTIVE" | "INVITED" | "DEACTIVATED"> | undefined'. Did you mean '"ACTIVE"'?

69     const user = this.userRepository.create({
                                        ~~~~~~

  src/database/entities/user.entity.ts:42:3
    42   status!: 'INVITED' | 'ACTIVE' | 'DEACTIVATED';
         ~~~~~~
    The expected type comes from property 'status' which is declared here on type 'DeepPartial<User>'
src/modules/auth/auth.service.ts:70:30 - error TS2339: Property 'id' does not exist on type 'Clinic[]'.

70       clinic_id: savedClinic.id,
                                ~~
src/modules/auth/auth.service.ts:79:15 - error TS2339: Property 'clinic' does not exist on type 'User[]'.       

79     savedUser.clinic = savedClinic;
                 ~~~~~~
src/modules/auth/auth.service.ts:81:32 - error TS2345: Argument of type 'User[]' is not assignable to parameter of type 'User'.
  Type 'User[]' is missing the following properties from type 'User': id, clinic_id, name, email, and 13 more.  

81     return this.generateTokens(savedUser);
                                  ~~~~~~~~~
src/modules/auth/auth.service.ts:118:9 - error TS2322: Type 'string | null' is not assignable to type 'string'. 
  Type 'null' is not assignable to type 'string'.

118         clinic_id: user.clinic_id,
            ~~~~~~~~~

  src/modules/auth/dtos/auth.dto.ts:77:5
    77     clinic_id: string;
           ~~~~~~~~~
    The expected type comes from property 'clinic_id' which is declared here on type '{ id: string; clinic_id: string; email: string; name: string; role: string; }'
src/modules/platform/platform-clinics.service.ts:93:42 - error TS2769: No overload matches this call.
  Overload 1 of 3, '(entityLikeArray: DeepPartial<Clinic>[]): Clinic[]', gave the following error.
    Object literal may only specify known properties, and 'name' does not exist in type 'DeepPartial<Clinic>[]'.
  Overload 2 of 3, '(entityLike: DeepPartial<Clinic>): Clinic', gave the following error.
    Type 'string' is not assignable to type 'DeepPartial<"STARTER" | "PROFESSIONAL" | "ENTERPRISE"> | undefined'.

93     const clinic = this.clinicRepository.create({
                                            ~~~~~~

  src/database/entities/clinic.entity.ts:61:3
    61   plan!: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
         ~~~~
    The expected type comes from property 'plan' which is declared here on type 'DeepPartial<Clinic>'
src/modules/platform/platform-clinics.service.ts:109:32 - error TS2339: Property 'id' does not exist on type 'Clinic[]'.

109       resource_id: savedClinic.id,
                                   ~~

Found 16 error(s).

  updated_at: Date;

  @Column({ nullable: true })
  last_login_at: Date;
}
```

---

## 📊 MODELO DE DATOS

### 1. Diagrama Entidades (Platform Admin)

```
┌─────────────────────────────────┐
│    platform_users               │
│ ─────────────────────────────── │
│ id (PK, UUID)                   │
│ email UNIQUE                    │
│ full_name                       │
│ password_hash                   │
│ status (INVITED|ACTIVE|...)     │
│ impersonating_clinic_id         │──┐
│ impersonating_user_id           │  │ (Auditoría de impersonation)
│ last_login_at                   │  │
│ created_at, updated_at          │  │
└─────────────────────────────────┘  │
        │                            │
        ├──(M:M)──────┐              │
        │             │              │
    ┌───┘      ┌──────▼──────────┐   │
    │          │ platform_roles  │   │
    │          │ ────────────── │   │
    │          │ id (PK, UUID)   │   │
    │          │ key (UNIQUE)    │   │
    │          │ name            │   │
    │          │ description     │   │
    │          │ permissions[]   │   │
    │          │ is_active       │   │
    │          └─────────────────┘   │
    │                                 │
    │                                 │
┌───┴──────────────────────────────────┴─────┐
│        audit_logs                         │
│ ─────────────────────────────────────── │
│ id (PK, UUID)                           │
│ actor_id (FK → platform_users)      ◄───┘
│ action (VERB: CREATE, UPDATE, DELETE) │
│ resource_type (NOUN: clinic, user)    │
│ resource_id                            │
│ changes (JSON: before/after)           │
│ impersonation_context (JSON)           │
│ client_ip                              │
│ user_agent                             │
│ status (SUCCESS, FAILED)               │
│ error_message (si falló)               │
│ created_at                             │
└────────────────────────────────────────┘


      RELACIÓN CON CLINICS (Existente)
┌──────────────────┐
│    clinics       │
│ ────────────── │
│ id (PK, UUID)    │
│ name             │
│ city             │
│ status           │◄──── (Auditado en audit_logs)
│ created_at,      │
│ updated_at       │
└──────────────────┘
```

### 2. Definiciones de Entidades Detalladas

#### 2.1 PLATFORM_USERS (Nueva)

```typescript
@Entity('platform_users')
export class PlatformUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  full_name: string;

  @Column()
  password_hash: string;

  @Column({
    type: 'enum',
    enum: ['INVITED', 'ACTIVE', 'DEACTIVATED', 'SUSPENDED'],
    default: 'INVITED'
  })
  status: PlatformUserStatus;

  // Para impersonation
  @Column({ type: 'uuid', nullable: true })
  impersonating_clinic_id: string | null;

  @Column({ type: 'uuid', nullable: true })
  impersonating_user_id: string | null; // ref a clinic_user

  // Tracking
  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  last_login_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  deactivated_at: Date | null;

  // Relaciones
  @ManyToMany(() => PlatformRole, role => role.platform_users, {
    eager: true,
    cascade: true
  })
  @JoinTable({
    name: 'platform_user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' }
  })
  platform_roles: PlatformRole[];

  @OneToMany(() => AuditLog, log => log.actor)
  audit_logs: AuditLog[];
}
```

#### 2.2 PLATFORM_ROLES (Nueva)

```typescript
@Entity('platform_roles')
export class PlatformRole {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 50 })
  key: string; // PLATFORM_SUPERADMIN, PLATFORM_SUPPORT, PLATFORM_FINANCE

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'simple-array' })
  permissions: string[];

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @Column({ default: false })
  is_immutable: boolean; // Protege roles del sistema

  @ManyToMany(() => PlatformUser, user => user.platform_roles, {
    lazy: true
  })
  platform_users: PlatformUser[];
}
```

#### 2.3 AUDIT_LOGS (Nueva/Extendida)

```typescript
@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  actor_id: string; // usuario que realizó la acción

  @ManyToOne(() => PlatformUser, user => user.audit_logs)
  @JoinColumn({ name: 'actor_id' })
  actor: PlatformUser;

  @Column({
    type: 'enum',
    enum: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'SUSPEND', 'ACTIVATE', 
           'INVITE', 'RESET_PASSWORD', 'IMPERSONATE', 'IMPERSONATE_END']
  })
  action: AuditAction;

  @Column() // 'clinic', 'platform_user', 'clinic_user', 'role'
  resource_type: string;

  @Column({ type: 'uuid' })
  resource_id: string;

  // Contexto de la clínica (si aplica)
  @Column({ type: 'uuid', nullable: true })
  clinic_id: string | null;

  // Cambios realizados
  @Column({ type: 'json', nullable: true })
  changes: {
    before: Record<string, any>;
    after: Record<string, any>;
  } | null;

  // Contexto de impersonation
  @Column({ type: 'json', nullable: true })
  impersonation_context: {
    impersonating_as_clinic_id: string;
    impersonating_as_user_id: string;
    original_platform_user_id: string;
  } | null;

  // Información técnica
  @Column({ type: 'varchar', length: 45 })
  client_ip: string;

  @Column({ type: 'text', nullable: true })
  user_agent: string;

  @Column({
    type: 'enum',
    enum: ['SUCCESS', 'FAILED', 'PARTIAL'],
    default: 'SUCCESS'
  })
  status: AuditStatus;

  @Column({ type: 'text', nullable: true })
  error_message: string | null;

  @Column({ type: 'integer', nullable: true })
  duration_ms: number | null; // Duración de la operación

  // Timestamp
  @CreateDateColumn()
  created_at: Date;

  // Índices para querys frecuentes
  @Index()
  @Column({ type: 'uuid' })
  actor_id: string;

  @Index()
  @Column()
  resource_type: string;

  @Index()
  @Column()
  action: string;

  @Index()
  @Column()
  created_at: Date;
}
```

#### 2.4 Extensiones a Entidades Existentes

**CLINICS (Existente - Agregar campos)**

```typescript
@Entity('clinics')
export class Clinic {
  // Campos existentes...
  
  // Agregar:
  @Column({
    type: 'enum',
    enum: ['ACTIVE', 'SUSPENDED', 'DELETED'],
    default: 'ACTIVE'
  })
  status: ClinicStatus;

  @Column({ type: 'timestamp', nullable: true })
  suspended_at: Date | null;

  @Column({ type: 'uuid', nullable: true })
  suspended_by: string | null; // FK → platform_users

  @Column({ type: 'text', nullable: true })
  suspension_reason: string | null;

  // Plan/límites (MVP+)
  @Column({ default: 'STARTER' })
  plan: string; // STARTER, PROFESSIONAL, ENTERPRISE

  @Column({ type: 'integer', default: 100 })
  max_staff_users: number;

  @Column({ type: 'integer', default: 1000 })
  max_clients: number;

  @Column({ type: 'integer', default: 5000 })
  max_pets: number;

  // Stats snapshot (actualizado cada 24h)
  @Column({ type: 'integer', default: 0 })
  active_staff_count: number;

  @Column({ type: 'integer', default: 0 })
  active_clients_count: number;

  @Column({ type: 'integer', default: 0 })
  active_pets_count: number;

  @Column({ type: 'timestamp', nullable: true })
  stats_updated_at: Date | null;
}
```

**USERS (Existente - Agregar campos)**

```typescript
@Entity('users') // clinic_users
export class User {
  // Campos existentes...

  @Column({
    type: 'enum',
    enum: ['INVITED', 'ACTIVE', 'DEACTIVATED'],
    default: 'INVITED'
  })
  status: UserStatus; // Agregar si no existe

  @Column({ type: 'timestamp', nullable: true })
  last_login_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  deactivated_at: Date | null;

  @Column({ type: 'uuid', nullable: true })
  deactivated_by: string | null; // FK → platform_users

  // Magic link para invitación
  @Column({ type: 'uuid', nullable: true })
  invitation_token: string | null;

  @Column({ type: 'timestamp', nullable: true })
  invitation_token_expires_at: Date | null;

  // Reset password link
  @Column({ type: 'uuid', nullable: true })
  password_reset_token: string | null;

  @Column({ type: 'timestamp', nullable: true })
  password_reset_token_expires_at: Date | null;
}
```

### 3. Migraciones Necesarias

```sql
-- 1. Create platform_roles table
CREATE TABLE platform_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  permissions TEXT[] NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_immutable BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create platform_users table
CREATE TABLE platform_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'INVITED',
  impersonating_clinic_id UUID,
  impersonating_user_id UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP,
  deactivated_at TIMESTAMP
);

-- 3. Create platform_user_roles junction table
CREATE TABLE platform_user_roles (
  user_id UUID NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES platform_roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

-- 4. Create audit_logs table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID NOT NULL REFERENCES platform_users(id),
  action VARCHAR(50) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID NOT NULL,
  clinic_id UUID,
  changes JSONB,
  impersonation_context JSONB,
  client_ip VARCHAR(45),
  user_agent TEXT,
  status VARCHAR(20) DEFAULT 'SUCCESS',
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (clinic_id) REFERENCES clinics(id)
);

-- 5. Create indexes for audit_logs
CREATE INDEX idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_clinic_id ON audit_logs(clinic_id);

-- 6. Alter existing tables
ALTER TABLE clinics ADD COLUMN status VARCHAR(50) DEFAULT 'ACTIVE';
ALTER TABLE clinics ADD COLUMN suspended_at TIMESTAMP;
ALTER TABLE clinics ADD COLUMN suspended_by UUID REFERENCES platform_users(id);
ALTER TABLE clinics ADD COLUMN suspension_reason TEXT;
ALTER TABLE clinics ADD COLUMN plan VARCHAR(50) DEFAULT 'STARTER';
ALTER TABLE clinics ADD COLUMN max_staff_users INTEGER DEFAULT 100;
ALTER TABLE clinics ADD COLUMN max_clients INTEGER DEFAULT 1000;
ALTER TABLE clinics ADD COLUMN max_pets INTEGER DEFAULT 5000;
ALTER TABLE clinics ADD COLUMN active_staff_count INTEGER DEFAULT 0;
ALTER TABLE clinics ADD COLUMN active_clients_count INTEGER DEFAULT 0;
ALTER TABLE clinics ADD COLUMN active_pets_count INTEGER DEFAULT 0;
ALTER TABLE clinics ADD COLUMN stats_updated_at TIMESTAMP;

ALTER TABLE users ADD COLUMN status VARCHAR(50) DEFAULT 'ACTIVE';
ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP;
ALTER TABLE users ADD COLUMN deactivated_at TIMESTAMP;
ALTER TABLE users ADD COLUMN deactivated_by UUID REFERENCES platform_users(id);
ALTER TABLE users ADD COLUMN invitation_token UUID;
ALTER TABLE users ADD COLUMN invitation_token_expires_at TIMESTAMP;
ALTER TABLE users ADD COLUMN password_reset_token UUID;
ALTER TABLE users ADD COLUMN password_reset_token_expires_at TIMESTAMP;
```

### 4. Seed Data (Roles por defecto)

```typescript
// database/seeds/platform-roles.seed.ts
export const platformRolesSeed = [
  {
    key: 'PLATFORM_SUPERADMIN',
    name: 'Platform SuperAdmin',
    description: 'Control total de la plataforma',
    permissions: [
      'clinics:create',
      'clinics:read',
      'clinics:update',
      'clinics:delete',
      'clinics:suspend',
      'clinics:activate',
      'users:create',
      'users:read',
      'users:update',
      'users:delete',
      'users:invite',
      'users:reset_password',
      'users:impersonate',
      'users:deactivate',
      'audit_logs:read',
      'audit_logs:export',
      'plans:read',
      'plans:update',
      'permissions:read',
      'permissions:manage'
    ],
    is_immutable: true
  },
  {
    key: 'PLATFORM_SUPPORT',
    name: 'Platform Support',
    description: 'Soporte y asistencia a clínicas',
    permissions: [
      'clinics:read',
      'clinics:activate',
      'users:read',
      'users:create',
      'users:invite',
      'users:reset_password',
      'users:deactivate',
      'audit_logs:read'
    ],
    is_immutable: true
  },
  {
    key: 'PLATFORM_FINANCE',
    name: 'Platform Finance',
    description: 'Reportería financiera (solo lectura)',
    permissions: [
      'clinics:read',
      'plans:read',
      'audit_logs:read',
      'reports:read'
    ],
    is_immutable: true
  }
];
```

---

## 🎨 ESPECIFICACIÓN DE UI/UX

### 1. Arquitectura General del Layout

```
┌─────────────────────────────────────────────────────────┐
│                    TOPBAR                               │
│  Logo    Search    Notifications    User Menu           │
├─────────┬───────────────────────────────────────────────┤
│         │                                               │
│ SIDEBAR │          MAIN CONTENT AREA                   │
│         │                                               │
│  Nav    │  Breadcrumb > Título                         │
│  Items  │  ────────────────────────────────────────   │
│         │  Content (con máx 1200px)                    │
│         │                                               │
│         │                                               │
│         │                                               │
└─────────┴───────────────────────────────────────────────┘
```

### 2. SIDEBAR NAVIGATION

**Estructura jerárquica:**

```
Platform Admin
├── Dashboard
│   └── Métricas globales
├── Clínicas
│   ├── Lista de clínicas
│   └── Crear clínica
├── Usuarios Plataforma
│   ├── Gestión de usuarios
│   └── Roles y permisos
├── Auditoría
│   └── Logs de auditoría
├── Reportes (MVP+)
│   └── Reportería financiera
└── Configuración
    ├── Planes
    └── Configuración global
```

**Diseño:**

- Ancho: 260px (sin colapsar en MVP)
- Colores: Dark mode profesional (#1a1a1a), texto #e0e0e0
- Hover: Highlight sutil (#2d2d2d)
- Active: Indicador visual izq (accent color)
- Font: Sans-serif, 14px
- Iconos: Lucide React

**Comportamiento:**

```
Topbar:
┌─────────────────────────────────────────┐
│ [≡] Logo   [Search...]   [🔔] 👤 [▼]  │
└─────────────────────────────────────────┘

Sidebar expandido:
┌───────────────┐
│ ► Dashboard   │
│ • Clínicas    │
│ • Usuarios    │
│ • Auditoría   │
└───────────────┘

Sidebar colapsado (opcional MVP+):
┌─┐
│▬│ Dashboard
│●│ Clínicas
│▬│ Usuarios
│▬│ Auditoría
└─┘
```

### 3. PANTALLA A: LISTA DE CLÍNICAS

#### 3.1 Layout

```
┌─────────────────────────────────────────────────────────┐
│ Breadcrumb: Platform Admin > Clínicas                   │
├─────────────────────────────────────────────────────────┤
│ Clínicas                           [+ Crear Clínica]    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ [Estado: ▼ TODAS]  [Plan: ▼ TODOS]  [Fecha: ▼ TODAS]  │
│ [🔍 Buscar clínica...]                    [Limpiar]    │
│                                                          │
│ Resultados: 24 clínicas                    Página 1 de 3│
│                                                          │
│ ┌────────────────────────────────────────────────────┐ │
│ │ Nombre    │ Ciudad   │ Plan      │ Estado  │ #Users│ │
│ ├────────────────────────────────────────────────────┤ │
│ │ Mascota   │ CDMX     │ Starter   │ Activo  │  3   │ │
│ │ Veterinar │ Monterey │ Prof.     │ Suspd. │  5   │ │
│ │ PetCare   │ Gdl      │ Enterprise│ Activo  │  12  │ │
│ │ ...       │ ...      │ ...       │ ...     │ ...  │ │
│ └────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌──────────────────────────────────────────────────┐  │
│ │ Acción (columna derecha)                        │  │
│ ├──────────────────────────────────────────────────┤  │
│ │ [Ver Detalle]  [⋮]                            │  │
│ │               └─ Editar                        │  │
│ │               └─ Suspender                     │  │
│ │               └─ Activar                       │  │
│ │               └─ Eliminar (SuperAdmin)        │  │
│ │               └─ Ver Auditoría                 │  │
│ └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

#### 3.2 Especificación de Tabla

| Columna | Tipo | Ancho | Comportamiento |
|---------|------|-------|---|
| **Nombre** | string | 200px | Link a detalle, truncable con tooltip |
| **Ciudad** | string | 120px | Badge con color |
| **Plan** | enum | 120px | Badge (Starter=blue, Prof=green, Ent=purple) |
| **Estado** | enum | 100px | Badge (Activo=green, Suspendido=red) |
| **#Usuarios** | int | 80px | Cuenta activos, link a gestor de usuarios |
| **Fecha Alta** | date | 120px | Formato: 23/02/2026 |
| **Acciones** | buttons | 150px | Ver detalle, menú ⋮ |

**Filtros (Sidebar izq o Collapse arriba):**

```
Estado:
  ○ Todas
  ○ Activas
  ○ Suspendidas
  ○ Eliminadas

Plan:
  ○ Todos
  ○ Starter
  ○ Professional
  ○ Enterprise

Fecha:
  ○ Todas
  ○ Últimos 7 días
  ○ Último mes
  ○ Últimos 3 meses
  [Desde] [Hasta]

Búsqueda:
  [Nombre, ciudad, email...]
```

**Paginación:**

- Por defecto: 20 por página
- Opciones: 10, 20, 50, 100
- Bottom: "Página 1 de 10 | < / 1,2,3...10 / >"

**Loading State:**

```
┌────────────────────────────────────────┐
│ ⟳ Cargando clínicas...                 │
└────────────────────────────────────────┘
```

**Empty State:**

```
┌────────────────────────────────────────┐
│         🏥                             │
│                                        │
│   No hay clínicas registradas          │
│                                        │
│   [+ Crear Primera Clínica]           │
└────────────────────────────────────────┘
```

#### 3.3 Acciones en Fila

**Menú Acciones (⋮ button):**

```
┌──────────────────────────┐
│ Ver Detalle       [→]    │
├──────────────────────────┤
│ Editar            [✎]    │
├──────────────────────────┤
│ Gestor de Usuarios        │
├──────────────────────────┤
│ Ver Auditoría     [📋]    │
├──────────────────────────┤
│ Suspender         [⏸]    │ (si Activa)
│ ─ o ─                     │
│ Activar           [▶]     │ (si Suspendida)
├──────────────────────────┤
│ Eliminar (Peligro) [🗑]   │ (SuperAdmin only)
└──────────────────────────┘
```

**Confirmación de acciones peligrosas:**

```
┌──────────────────────────────────────┐
│ ⚠️  Suspender Clínica                │
│                                      │
│ Estás a punto de suspender:          │
│ "Mascota Veterinaria"                │
│                                      │
│ Los usuarios no podrán acceder.      │
│ Razón: [Comentario opcional]         │
│                                      │
│       [Cancelar]  [Suspender]       │
└──────────────────────────────────────┘
```

**Toast Success:**

```
✓ Clínica "Mascota Veterinaria" suspendida [✕]
```

---

### 4. PANTALLA B: CREAR CLÍNICA (MODAL WIZARD 2 PASOS)

#### 4.1 Paso 1: Datos de Clínica

```
┌──────────────────────────────────────────────────┐
│ Crear Nueva Clínica                       [✕]   │
├──────────────────────────────────────────────────┤
│                                                  │
│ Paso 1 de 2: Información de Clínica             │
│                                                  │
│ [●────────○─────]  (progress bar)               │
│                                                  │
│ Nombre de clínica *                             │
│ [________________________________]               │
│ Máx 100 caracteres. Ej: "Mascota Monterrey"    │
│                                                  │
│ Ciudad *                                        │
│ [▼ Seleccionar ciudad...]                      │
│ ├─ CDMX                                         │
│ ├─ Guadalajara                                  │
│ ├─ Monterrey                                    │
│ ├─ Cancún                                       │
│ └─ Otra: [__________]                          │
│                                                  │
│ Email de contacto *                             │
│ [_______________________________@__.___]          │
│                                                  │
│ Teléfono (opcional)                             │
│ [+52 (__) ____-____]                           │
│                                                  │
│ Estado *                                        │
│ ○ Activa (default)                             │
│ ○ Por definir (owner activará después)         │
│                                                  │
│ Plan *                                          │
│ ○ Starter (100 usuarios, 1000 clientes)       │
│ ○ Professional                                  │
│ ○ Enterprise                                    │
│                                                  │
│                 [◀ Atrás]  [Siguiente ▶]       │
└──────────────────────────────────────────────────┘
```

**Validaciones inline:**

- Nombre: Required, 3-100 chars, sin caracteres especiales
- Ciudad: Required, dropdown o texto libre
- Email: Required, formato válido, único en sistema
- Teléfono: Formato opcional +52 (XX) XXXX-XXXX
- Plan: Required

**Estados de campo:**

```
✓ Válido (checkmark verde)    [____✓____]
✗ Error (mensaje rojo)         [____✗____]
⚠ Warning (texto naranja)      [____⚠____]
```

#### 4.2 Paso 2: Crear Owner + Invitación

```
┌──────────────────────────────────────────────────┐
│ Crear Nueva Clínica                       [✕]   │
├──────────────────────────────────────────────────┤
│                                                  │
│ Paso 2 de 2: Crear Usuario Owner                │
│                                                  │
│ [────────●───────]  (progress bar)              │
│                                                  │
│ Nombre completo del Owner *                     │
│ [________________________________]               │
│                                                  │
│ Email del Owner *                               │
│ [___________________________@___.___]            │
│ Usaremos este email para enviar invitación     │
│                                                  │
│ Rol *                                           │
│ ○ Owner (Administrador de clínica)             │
│ (No editable - rol automático)                 │
│                                                  │
│ Invitar también a Staff? (opcional)             │
│ ☐ Sí, agregar usuarios adicionales             │
│                                                  │
│ Si sí:                                         │
│ ┌─────────────────────────────────────┐        │
│ │ Staff 1                             │        │
│ │ Email: [____________@___.___]      │        │
│ │ Rol: [Veterinario ▼]               │        │
│ │                           [✕]      │        │
│ └─────────────────────────────────────┘        │
│ [+ Agregar otro Staff]                        │
│                                                  │
│ Notas internas (opcional)                       │
│ [_________________________________]              │
│ Máx 500 caracteres. Visible solo para admins   │
│                                                  │
│ Notificar al owner de su cuenta                │
│ ☑ Enviar email de invitación con magic link    │
│ (Recomendado)                                  │
│                                                  │
│             [◀ Atrás]  [Crear Clínica]        │
│                                                  │
│ (Botón deshabilitado si hay errores)           │
└──────────────────────────────────────────────────┘
```

**Comportamiento de "Agregar más Staff":**

- Max 5 en este wizard (el resto se agrega después)
- Validación en tiempo real de emails duplicados
- [✕] elimina la fila

**Loading al crear:**

```
┌──────────────────────────────────────┐
│ Creando clínica y enviando invitación│
│ ⟳                                     │
└──────────────────────────────────────┘
```

**Success Redirect:**

```
┌──────────────────────────────────────────────────┐
│ ✓ Clínica creada exitosamente                   │
│                                                  │
│ Clínica: Mascota Veterinaria                   │
│ Owner: juan@email.com                          │
│ Invitación enviada a: ...                      │
│                                                  │
│ [▶ Ver Clínica]  [Cerrar]                     │
└──────────────────────────────────────────────────┘
```

---

### 5. PANTALLA C: DETALLE DE CLÍNICA (MULTI-TAB)

#### 5.1 Vista General (Tab: Overview)

```
┌────────────────────────────────────────────────────────┐
│ Breadcrumb: Platform Admin > Clínicas > Mascota...    │
├────────────────────────────────────────────────────────┤
│ Mascota Veterinaria                  [Editar] [⋮]     │
│ [Activa] • Starter • CDMX • Alta: 23/02/2026         │
├────────────────────────────────────────────────────────┤
│ [Overview] [Usuarios] [Auditoría] [Settings]         │
├────────────────────────────────────────────────────────┤
│                                                        │
│ >>> KPIs (Grid 4 columnas)                            │
│ ┌──────────────┐ ┌──────────────┐ ┌────────┐ ┌──────┐│
│ │ 12          │ │ 248         │ │ 1,204  │ │ 94%  ││
│ │ Usuarios    │ │ Clientes    │ │ Mascotas│ │Activo││
│ └──────────────┘ └──────────────┘ └────────┘ └──────┘│
│                                                        │
│ Estado actual                                        │
│ ┌──────────────────────────────────────────┐         │
│ │ Estado: Activa                           │         │
│ │ Suspendidad por: -                       │         │
│ │ Fecha de suspensión: -                   │         │
│ │                                          │         │
│ │ [Suspender]  [Cambiar Plan]              │         │
│ └──────────────────────────────────────────┘         │
│                                                        │
│ Información de contacto                              │
│ ┌──────────────────────────────────────────┐         │
│ │ Email: contact@mascota.com               │         │
│ │ Teléfono: +52 (55) 1234-5678             │         │
│ │ Ciudad: CDMX                             │         │
│ │ Fecha creación: 23/02/2026               │         │
│ │ Última actividad: 24/02/2026 15:30       │         │
│ └──────────────────────────────────────────┘         │
│                                                        │
│ Plan actual (Starter)                                │
│ ┌──────────────────────────────────────────┐         │
│ │ Usuarios permitidos: 100 / 12 usado      │         │
│ │ [████░░░░░░░░░░░░] 12%                  │         │
│ │                                          │         │
│ │ Clientes permitidos: 1000 / 248 usado    │         │
│ │ [██░░░░░░░░░░░░░░░] 25%                 │         │
│ │                                          │         │
│ │ Mascotas permitidas: 5000 / 1204 usado   │         │
│ │ [█░░░░░░░░░░░░░░░░] 24%                 │         │
│ │                                          │         │
│ │ [Upgrade Plan]                           │         │
│ └──────────────────────────────────────────┘         │
└────────────────────────────────────────────────────────┘
```

#### 5.2 Tab: Usuarios (Clinic Users)

```
┌────────────────────────────────────────────────────────┐
│ [Overview] [Usuarios] [Auditoría] [Settings]         │
├────────────────────────────────────────────────────────┤
│ Usuarios de Mascota Veterinaria    [+ Invitar Usuario]│
│                                                        │
│ [🔍 Buscar usuario...] [Estado: ▼ TODOS]             │
│                                                        │
│ ┌────────────────────────────────────────────────┐   │
│ │ Nombre │ Email      │ Rol    │ Estado  │ Acciones│
│ ├────────────────────────────────────────────────┤   │
│ │ Juan   │ juan@...   │ Owner  │ Activo  │ [⋮]     │
│ │ María  │ maria@...  │ Staff  │ Activo  │ [⋮]     │
│ │ Carla  │ carla@...  │ Staff  │ Invitado│ [⋮]     │
│ │ ...    │ ...        │ ...    │ ...     │ ...     │
│ └────────────────────────────────────────────────┘   │
│                                                        │
│ Menú usuario:                                         │
│ ┌────────────────────────────────┐                   │
│ │ Impersonate (VER como este user)│                   │
│ ├────────────────────────────────┤                   │
│ │ Cambiar Rol                    │                   │
│ ├────────────────────────────────┤                   │
│ │ Reenviar Invitación (si no...)│                   │
│ ├────────────────────────────────┤                   │
│ │ Reset Password (magic link)    │                   │
│ ├────────────────────────────────┤                   │
│ │ Deactivar Usuario              │                   │
│ ├────────────────────────────────┤                   │
│ │ Forzar Logout (en sesión)       │                   │
│ └────────────────────────────────┘                   │
└────────────────────────────────────────────────────────┘
```

#### 5.3 Tab: Auditoría

```
┌────────────────────────────────────────────────────────┐
│ [Overview] [Usuarios] [Auditoría] [Settings]         │
├────────────────────────────────────────────────────────┤
│ Auditoría de Mascota Veterinaria                      │
│                                                        │
│ Filtrar:                                             │
│ [Acción: ▼ TODAS] [Recurso: ▼ TODOS] [Desde] [Hasta]│
│ [Buscar...]                                          │
│                                                        │
│ ┌────────────────────────────────────────────────┐   │
│ │ Fecha    │ Actor    │ Acción  │ Recurso │ Statu│
│ ├────────────────────────────────────────────────┤   │
│ │ 24/02    │ admin@.. │ CREATE  │ Usuario │ ✓    │
│ │ 23/02    │ admin@.. │ SUSPEND │ Clínica │ ✓    │
│ │ 22/02    │ support@ │ INVITE  │ Usuario │ ✓    │
│ └────────────────────────────────────────────────┘   │
│                                                        │
│ Click en fila → Detalles:                            │
│ ┌────────────────────────────────────────────────┐   │
│ │ Acción: CREATE                                │   │
│ │ Recurso: Usuario (ID: xyz)                    │   │
│ │ Actor: admin@vibralive.test                   │   │
│ │ Timestamp: 24/02/2026 14:30:15                │   │
│ │ IP: 192.168.1.100                             │   │
│ │ Cambios:                                       │   │
│ │   email: (new) carla@clinic.com               │   │
│ │   role: (new) CLINIC_STAFF                    │   │
│ │   status: (new) INVITED                       │   │
│ └────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────┘
```

#### 5.4 Tab: Settings

```
┌────────────────────────────────────────────────────────┐
│ [Overview] [Usuarios] [Auditoría] [Settings]         │
├────────────────────────────────────────────────────────┤
│ Configuración de Mascota Veterinaria                  │
│                                                        │
│ Información de Clínica                                │
│ ┌────────────────────────────────────────────────┐   │
│ │ Nombre:        [Mascota Veterinaria_____]      │   │
│ │ Ciudad:        [CDMX ▼]                        │   │
│ │ Email:         [contact@mascota.com_____]     │   │
│ │ Teléfono:      [+52 (55) 1234-5678____]       │   │
│ │                                                │   │
│ │ [Guardar cambios]                              │   │
│ └────────────────────────────────────────────────┘   │
│                                                        │
│ Tipo de Animales                                      │
│ ┌────────────────────────────────────────────────┐   │
│ │ ☑ Perros                                       │   │
│ │ ☑ Gatos                                        │   │
│ │ ☐ Aves                                         │   │
│ │ ☐ Reptiles                                     │   │
│ │                                                │   │
│ │ [Guardar cambios]                              │   │
│ └────────────────────────────────────────────────┘   │
│                                                        │
│ Integraciones WhatsApp                                │
│ ┌────────────────────────────────────────────────┐   │
│ │ Estado: ☑ Activo                               │   │
│ │                                                │   │
│ │ Número WhatsApp Business: +52 (55) XXXX-XXXX  │   │
│ │ Token: [***visible only to owner***]          │   │
│ │                                                │   │
│ │ [Test Send]  [Regenerate Token]               │   │
│ └────────────────────────────────────────────────┘   │
│                                                        │
│ Peligro - Zona Roja                                  │
│ ┌────────────────────────────────────────────────┐   │
│ │ Suspender Clínica                              │   │
│ │ [Suspender]                                    │   │
│ │                                                │   │
│ │ Eliminar Clínica (Irreversible)               │   │
│ │ [Eliminar]                                     │   │
│ └────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────┘
```

---

### 6. PANTALLA D: MODAL INVITAR / CREAR USUARIO

#### Contexto: Se abre desde "Usuarios" > "+ Invitar Usuario"

```
┌──────────────────────────────────┐
│ Invitar Usuario a Clínica        │ [✕]
├──────────────────────────────────┤
│                                  │
│ Clínica: Mascota Veterinaria    │
│                                  │
│ Email del Usuario *              │
│ [_____________________@___.___]   │
│ Enviará invitación a este email  │
│                                  │
│ Nombre Completo *                │
│ [________________________]         │
│                                  │
│ Rol *                            │
│ ○ Clinic Owner                  │
│ ○ Clinic Staff                  │
│ ○ Clinic Manager                │
│                                  │
│ Mensaje personalizado (opcional) │
│ [_____________________________]   │
│ Máx 200 caracteres              │
│                                  │
│ Notificar por Email              │
│ ☑ Enviar invitación con magic link│
│                                  │
│           [Cancelar]  [Invitar]  │
└──────────────────────────────────┘
```

---

### 7. MODALES Y CONFIRMACIONES

#### A. Suspender Clínica

```
┌────────────────────────────────────────┐
│ ⚠️  Confirmar Suspensión                │
├────────────────────────────────────────┤
│                                        │
│ Estás a punto de SUSPENDER:           │
│ "Mascota Veterinaria"                 │
│                                        │
│ Consecuencias:                        │
│ • Todos los usuarios serán deslogeados│
│ • No podrán acceder a su panel       │
│ • Los recordatorios automáticos se    │
│   pausarán                            │
│ • Los datos se mantendrán intactos   │
│                                        │
│ Razón de suspensión (obligatorio):    │
│ [___________________________]          │
│                                        │
│        [Cancelar]  [Suspender]        │
└────────────────────────────────────────┘
```

#### B. Deactivar Usuario

```
┌────────────────────────────────────────┐
│ Deactivar Usuario                      │
├────────────────────────────────────────┤
│                                        │
│ Estás a punto de deactivar:           │
│ "María López" (maria@clinic.com)      │
│                                        │
│ • Se le revocará el acceso            │
│ • Su sesión se cerrará                │
│ • Puede ser reactivado después        │
│                                        │
│ Motivo (opcional):                    │
│ [___________________________]          │
│                                        │
│        [Cancelar]  [Desactivar]       │
└────────────────────────────────────────┘
```

#### C. Reset Password

```
┌────────────────────────────────────────┐
│ Reset Password                         │
├────────────────────────────────────────┤
│                                        │
│ Usuario: "María López"                │
│ Email: maria@clinic.com               │
│                                        │
│ Se enviará un magic link válido por   │
│ 24 horas. El usuario podrá establecer │
│ su nueva contraseña.                  │
│                                        │
│ ☑ Notificar al usuario por email      │
│                                        │
│        [Cancelar]  [Enviar Link]      │
└────────────────────────────────────────┘
```

#### D. Impersonate User

```
┌────────────────────────────────────────┐
│ ⚠️  Modo Impersonation                  │
├────────────────────────────────────────┤
│                                        │
│ Estás a punto de entrar como:        │
│ "Juan Pérez" (juan@clinic.com)       │
│ Clínica: Mascota Veterinaria         │
│                                        │
│ • Verás exactamente lo que él ve      │
│ • Tus acciones se registrarán como   │
│   suyas en auditoría                  │
│ • Hay un timeout de 1 hora            │
│ • Puedes salir del modo en cualquier  │
│   momento                             │
│                                        │
│ ☑ Entiendo                             │
│                                        │
│        [Cancelar]  [Impersonate]      │
└────────────────────────────────────────┘

(Después de click) → Redirecciona a panel de usuario
Con BANNER en topbar: "👤 Impersonating: Juan Pérez [Salir]"
```

---

### 8. TOAST NOTIFICATIONS

**Ubicación:** Top-right fija

```
Success:
┌────────────────────────────┐
│ ✓ Clínica creada           │ [✕]
│   Mascota Veterinaria      │
└────────────────────────────┘

Error:
┌────────────────────────────┐
│ ✗ Error al suspender       │ [✕]
│   Email duplicado          │
└────────────────────────────┘

Warning:
┌────────────────────────────┐
│ ⚠ Usuario ya existe        │ [✕]
│ Se envió invitación nueva  │
└────────────────────────────┘

Info:
┌────────────────────────────┐
│ ℹ Invitación reenviada     │ [✕]
│ a carla@clinic.com         │
└────────────────────────────┘
```

**Comportamiento:**
- Auto-dismiss: 5-8 segundos
- Closeable: [✕] button
- Stack max 3 toasts
- Sonido opcional (muted by default)

---

### 9. TABLA COMPARATIVA: DESKTOP vs MOBILE

| Aspecto | Desktop | Mobile |
|---------|---------|--------|
| **Sidebar** | Visible (260px) | Hamburger menu |
| **Tabla** | Todas columnas | Scrollable, 3-4 cols principales |
| **Modal** | 500px ancho | 100vw con padding |
| **Botones** | Lado derecho | Stack vertical o minimal icons |
| **Filtros** | Expandible | Bottomsheet o modal |
| **Breadcrumb** | Siempre | Colapsable |

---

## 📡 ENDPOINTS REST

### Base URL
```
https://api.vibralive.test/api
```

### Autenticación
Todos los endpoints requieren header:
```
Authorization: Bearer <JWT_TOKEN>
```

### ⚠️ Respuestas de Error Estándar

```json
{
  "statusCode": 403,
  "message": "Forbidden. You lack permission: clinics:create",
  "error": "PermissionDenied",
  "timestamp": "2026-02-24T14:30:00.000Z",
  "path": "/api/platform/clinics"
}
```

### 1. GESTIÓN DE CLÍNICAS

#### 1.1 Listar Clínicas
```
GET /platform/clinics
?limit=20&offset=0&status=ACTIVE&plan=STARTER&city=CDMX&search=mascota

Headers:
  Authorization: Bearer <token>
  
Response 200:
{
  "data": [
    {
      "id": "uuid",
      "name": "Mascota Veterinaria",
      "city": "CDMX",
      "status": "ACTIVE",
      "plan": "STARTER",
      "email": "contact@mascota.com",
      "phone": "+52 (55) 1234-5678",
      "active_staff_count": 12,
      "active_clients_count": 248,
      "active_pets_count": 1204,
      "created_at": "2026-02-23T10:30:00Z",
      "suspended_at": null,
      "suspension_reason": null
    }
  ],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 45,
    "page": 1,
    "pages": 3
  }
}

Permisos:
  - PLATFORM_SUPERADMIN: Todas
  - PLATFORM_SUPPORT: Todas
  - PLATFORM_FINANCE: Todas (read-only)
  - CLINIC_OWNER: Negado
```

#### 1.2 Obtener Detalle de Clínica
```
GET /platform/clinics/{clinic_id}

Response 200:
{
  "id": "uuid",
  "name": "Mascota Veterinaria",
  "city": "CDMX",
  "status": "ACTIVE",
  "plan": "STARTER",
  "email": "contact@mascota.com",
  "phone": "+52 (55) 1234-5678",
  "internal_notes": "Cliente importante",
  "animal_types": ["PERRO", "GATO"],
  "whatsapp_enabled": true,
  "whatsapp_number": "+52 (55) XXXX-XXXX",
  "created_at": "2026-02-23T10:30:00Z",
  "updated_at": "2026-02-24T08:00:00Z",
  "suspended_at": null,
  "suspended_by": null,
  "suspension_reason": null,
  // KPIs
  "active_staff_count": 12,
  "active_clients_count": 248,
  "active_pets_count": 1204,
  "stats_updated_at": "2026-02-24T00:05:00Z",
  // Límites del plan
  "max_staff_users": 100,
  "max_clients": 1000,
  "max_pets": 5000
}

Permisos:
  - PLATFORM_SUPERADMIN: Todas
  - PLATFORM_SUPPORT: Todas
  - CLINIC_OWNER: Solo la suya
```

#### 1.3 Crear Clínica
```
POST /platform/clinics

Body:
{
  "name": "Mascota Veterinaria",
  "city": "CDMX",
  "email": "contact@mascota.com",
  "phone": "+52 (55) 1234-5678",
  "plan": "STARTER",
  "status": "ACTIVE",
  "animal_types": ["PERRO", "GATO"],
  "internal_notes": "Cliente VIP"
}

Response 201:
{
  "id": "uuid",
  "name": "Mascota Veterinaria",
  ...
}

Permisos:
  - PLATFORM_SUPERADMIN: Sí
  - PLATFORM_SUPPORT: No
  - clinic:create required
```

#### 1.4 Actualizar Clínica
```
PATCH /platform/clinics/{clinic_id}

Body:
{
  "name": "Mascota Veterinaria Nuevo Nombre",
  "city": "Monterrey",
  "email": "newemail@mascota.com",
  "phone": "+52 (81) 5678-1234",
  "animal_types": ["PERRO", "GATO", "AVE"]
}

Response 200:
{ ...clinic object... }

Permisos:
  - PLATFORM_SUPERADMIN: Sí
  - PLATFORM_SUPPORT: No
  - clinic:update required
```

#### 1.5 Suspender Clínica
```
POST /platform/clinics/{clinic_id}/suspend

Body:
{
  "reason": "Impago de suscripción",
  "notify_clinic": true
}

Response 200:
{
  "id": "uuid",
  "status": "SUSPENDED",
  "suspended_at": "2026-02-24T14:30:00Z",
  "suspended_by": "uuid-admin",
  "suspension_reason": "Impago de suscripción"
}

Permisos:
  - PLATFORM_SUPERADMIN: Sí
  - PLATFORM_SUPPORT: request (aprueba SuperAdmin)
  - clinic:suspend required
```

#### 1.6 Activar Clínica
```
POST /platform/clinics/{clinic_id}/activate

Response 200:
{
  "id": "uuid",
  "status": "ACTIVE",
  "suspended_at": null
}

Permisos:
  - PLATFORM_SUPERADMIN: Sí
  - PLATFORM_SUPPORT: Sí
  - clinic:activate required
```

#### 1.7 Cambiar Plan de Clínica
```
PATCH /platform/clinics/{clinic_id}/plan

Body:
{
  "plan": "PROFESSIONAL"
}

Response 200:
{
  "plan": "PROFESSIONAL",
  "max_staff_users": 300,
  "max_clients": 5000,
  "max_pets": 20000
}

Permisos:
  - PLATFORM_SUPERADMIN: Sí
  - plans:update required
```

#### 1.8 Eliminar Clínica
```
DELETE /platform/clinics/{clinic_id}

Response 204 No Content

Permisos:
  - PLATFORM_SUPERADMIN: Sí (requiere confirmación doble)
  - clinic:delete required
  
Nota: Soft delete. Se marca como DELETED pero datos se retienen.
```

---

### 2. GESTIÓN DE USUARIOS PLATAFORMA

#### 2.1 Listar Usuarios Plataforma
```
GET /platform/users
?limit=20&offset=0&role=PLATFORM_SUPPORT&status=ACTIVE&search=john

Response 200:
{
  "data": [
    {
      "id": "uuid",
      "email": "admin@vibralive.test",
      "full_name": "Juan Pérez",
      "status": "ACTIVE",
      "platform_roles": [
        {
          "key": "PLATFORM_SUPERADMIN",
          "name": "Platform SuperAdmin"
        }
      ],
      "created_at": "2026-01-15T10:30:00Z",
      "last_login_at": "2026-02-24T14:00:00Z"
    }
  ],
  "pagination": { ... }
}

Permisos:
  - PLATFORM_SUPERADMIN: Todas
  - PLATFORM_SUPPORT: Todas
  - users:read required
```

#### 2.2 Obtener Usuario
```
GET /platform/users/{user_id}

Response 200:
{
  "id": "uuid",
  "email": "admin@vibralive.test",
  "full_name": "Juan Pérez",
  "status": "ACTIVE",
  "platform_roles": [...],
  "impersonating": {
    "clinic_id": null,
    "user_id": null
  },
  "created_at": "2026-01-15T10:30:00Z",
  "updated_at": "2026-02-24T08:00:00Z",
  "last_login_at": "2026-02-24T14:00:00Z",
  "deactivated_at": null
}

Permisos:
  - PLATFORM_SUPERADMIN: Todas
  - PLATFORM_SUPPORT: Todas
  - users:read required
```

#### 2.3 Crear Usuario Plataforma
```
POST /platform/users

Body:
{
  "email": "newadmin@vibralive.test",
  "full_name": "María López",
  "platform_roles": ["PLATFORM_SUPPORT"],
  "send_invitation": true
}

Response 201:
{
  "id": "uuid",
  "email": "newadmin@vibralive.test",
  "full_name": "María López",
  "status": "INVITED",
  "platform_roles": [
    {
      "key": "PLATFORM_SUPPORT",
      "name": "Platform Support"
    }
  ],
  "invitation_token": "magic-link-token",
  "invitation_token_expires_at": "2026-02-25T12:30:00Z"
}

Permisos:
  - PLATFORM_SUPERADMIN: Sí
  - PLATFORM_SUPPORT: No
  - users:create required
```

#### 2.4 Actualizar Roles de Usuario
```
PATCH /platform/users/{user_id}/roles

Body:
{
  "platform_roles": ["PLATFORM_SUPERADMIN", "PLATFORM_FINANCE"]
}

Response 200:
{
  "id": "uuid",
  "platform_roles": [...]
}

Permisos:
  - PLATFORM_SUPERADMIN: Sí
  - users:update required
```

#### 2.5 Reenviar Invitación
```
POST /platform/users/{user_id}/resend-invitation

Body:
{
  "message": "Por favor completa tu registro" (opcional)
}

Response 200:
{
  "email": "user@vibralive.test",
  "invitation_sent_at": "2026-02-24T14:30:00Z",
  "invitation_expires_at": "2026-02-25T14:30:00Z"
}

Permisos:
  - PLATFORM_SUPERADMIN: Sí
  - users:invite required
```

#### 2.6 Reset Password (Magic Link)
```
POST /platform/users/{user_id}/reset-password

Body:
{
  "send_email": true
}

Response 200:
{
  "email": "user@vibralive.test",
  "reset_link_sent_at": "2026-02-24T14:30:00Z",
  "reset_link_expires_at": "2026-02-25T14:30:00Z"
}

Permisos:
  - PLATFORM_SUPERADMIN: Sí
  - PLATFORM_SUPPORT: Sí
  - users:reset_password required
```

#### 2.7 Deactivar Usuario
```
POST /platform/users/{user_id}/deactivate

Body:
{
  "reason": "Usuario ya no sirve"
}

Response 200:
{
  "id": "uuid",
  "status": "DEACTIVATED",
  "deactivated_at": "2026-02-24T14:30:00Z"
}

Permisos:
  - PLATFORM_SUPERADMIN: Sí
  - users:deactivate required
```

#### 2.8 Activar Usuario (Reactivar)
```
POST /platform/users/{user_id}/activate

Response 200:
{
  "id": "uuid",
  "status": "ACTIVE"
}

Permisos:
  - PLATFORM_SUPERADMIN: Sí
```

---

### 3. GESTIÓN DE USUARIOS DE CLÍNICA (desde Platform)

#### 3.1 Listar Usuarios de Clínica
```
GET /platform/clinics/{clinic_id}/users
?limit=20&offset=0&role=CLINIC_STAFF&status=ACTIVE

Response 200:
{
  "data": [
    {
      "id": "uuid",
      "email": "juan@clinic.com",
      "full_name": "Juan Pérez",
      "status": "ACTIVE",
      "clinic_role": "CLINIC_OWNER",
      "created_at": "2026-02-23T10:30:00Z",
      "last_login_at": "2026-02-24T14:00:00Z"
    }
  ],
  "pagination": { ... }
}

Permisos:
  - PLATFORM_SUPERADMIN: Todas
  - PLATFORM_SUPPORT: Todas
  - clinic_users:read required (en contexto de clinic_id)
```

#### 3.2 Crear Usuario en Clínica
```
POST /platform/clinics/{clinic_id}/users

Body:
{
  "email": "newuser@clinic.com",
  "full_name": "Carla García",
  "clinic_role": "CLINIC_STAFF",
  "send_invitation": true
}

Response 201:
{
  "id": "uuid",
  "email": "newuser@clinic.com",
  "full_name": "Carla García",
  "clinic_role": "CLINIC_STAFF",
  "status": "INVITED"
}

Permisos:
  - PLATFORM_SUPERADMIN: Sí
  - PLATFORM_SUPPORT: Sí
  - clinic_users:create required
```

#### 3.3 Actualizar Rol de Usuario en Clínica
```
PATCH /platform/clinics/{clinic_id}/users/{user_id}/role

Body:
{
  "clinic_role": "CLINIC_MANAGER"
}

Response 200:
{
  "id": "uuid",
  "clinic_role": "CLINIC_MANAGER"
}

Permisos:
  - PLATFORM_SUPERADMIN: Sí
  - clinic_users:update required
```

#### 3.4 Impersonate Usuario de Clínica
```
POST /platform/clinics/{clinic_id}/users/{user_id}/impersonate

Response 200:
{
  "impersonation_token": "jwt-token-as-user",
  "expires_at": "2026-02-24T15:30:00Z",
  "clinic_id": "clinic-uuid",
  "user_id": "user-uuid"
}

Después: Frontend debe usar este token para acceder al panel
Topbar: "👤 Impersonating: Juan Pérez [Salir]"

Permisos:
  - PLATFORM_SUPERADMIN: Sí
  - users:impersonate required
  
Nota: Se registra en audit_logs inmediatamente
```

#### 3.5 Forzar Logout de Usuario
```
POST /platform/clinics/{clinic_id}/users/{user_id}/logout

Response 200:
{
  "status": "logged_out",
  "timestamp": "2026-02-24T14:30:00Z"
}

Nota: Invalida todos los tokens JWT del usuario
Se registra en audit_logs

Permisos:
  - PLATFORM_SUPERADMIN: Sí
```

---

### 4. GESTIÓN DE ROLES Y PERMISOS

#### 4.1 Listar Roles
```
GET /platform/roles
?is_active=true

Response 200:
{
  "data": [
    {
      "id": "uuid",
      "key": "PLATFORM_SUPERADMIN",
      "name": "Platform SuperAdmin",
      "description": "Control total de la plataforma",
      "permissions": [
        "clinics:create",
        "clinics:read",
        ...
      ],
      "is_active": true,
      "is_immutable": true,
      "created_at": "2026-01-01T00:00:00Z"
    }
  ]
}

Permisos:
  - PLATFORM_SUPERADMIN: Sí
  - permissions:read required
```

#### 4.2 Obtener Rol
```
GET /platform/roles/{role_id}

Response 200:
{ ...role object... }

Permisos:
  - permissions:read required
```

#### 4.3 Actualizar Permisos de Rol (MVP+)
```
PATCH /platform/roles/{role_id}

Body:
{
  "permissions": [
    "clinics:create",
    "clinics:read",
    "users:read"
  ]
}

Response 200:
{ ...updated role... }

Permisos:
  - PLATFORM_SUPERADMIN: Sí
  - permissions:manage required
  
Nota: No se puede editar is_immutable roles
```

---

### 5. AUDITORÍA

#### 5.1 Listar Logs de Auditoría
```
GET /platform/audit-logs
?limit=50&offset=0&actor_id=uuid&action=CREATE&resource_type=clinic&status=SUCCESS&from_date=2026-02-20&to_date=2026-02-24

Response 200:
{
  "data": [
    {
      "id": "uuid",
      "actor_id": "uuid",
      "actor": {
        "email": "admin@vibralive.test",
        "full_name": "Juan Pérez"
      },
      "action": "CREATE",
      "resource_type": "clinic",
      "resource_id": "clinic-uuid",
      "clinic_id": "clinic-uuid",
      "changes": {
        "before": {},
        "after": {
          "name": "Mascota Veterinaria",
          "status": "ACTIVE"
        }
      },
      "impersonation_context": null,
      "client_ip": "192.168.1.100",
      "user_agent": "Mozilla/5.0...",
      "status": "SUCCESS",
      "error_message": null,
      "duration_ms": 245,
      "created_at": "2026-02-24T14:30:00Z"
    }
  ],
  "pagination": { ... }
}

Permisos:
  - PLATFORM_SUPERADMIN: Cualquier log
  - PLATFORM_SUPPORT: Solo logs de sus clínicas
  - audit_logs:read required
```

#### 5.2 Obtener Detalle de Log
```
GET /platform/audit-logs/{log_id}

Response 200:
{ ...audit log full object... }

Permisos:
  - audit_logs:read required
```

#### 5.3 Exportar Logs (CSV)
```
GET /platform/audit-logs/export
?from_date=2026-02-01&to_date=2026-02-28&action=CREATE&resource_type=clinic

Response 200 (application/csv):
actor_id,actor_email,action,resource_type,resource_id,created_at,status
uuid,admin@vibralive.test,CREATE,clinic,clinic-uuid,2026-02-24T14:30:00Z,SUCCESS
...

Permisos:
  - PLATFORM_SUPERADMIN: Sí
  - audit_logs:export required
```

---

### 6. INVITACIONES Y MAGIC LINKS

#### 6.1 Validar Magic Link (Frontend)
```
GET /auth/magic-link/validate?token=magic-link-token

Response 200:
{
  "valid": true,
  "type": "invitation", // o "password_reset"
  "user_id": "uuid",
  "email": "user@vibralive.test",
  "expires_at": "2026-02-25T14:30:00Z"
}

o

Response 200:
{
  "valid": false,
  "error": "Token expired or invalid"
}
```

#### 6.2 Completar Invitación (Frontend)
```
POST /auth/magic-link/complete

Body:
{
  "token": "magic-link-token",
  "password": "SecurePass123!"
}

Response 200:
{
  "access_token": "jwt-token",
  "refresh_token": "refresh-token",
  "user": {
    "id": "uuid",
    "email": "user@vibralive.test"
  }
}
```

---

### 7. Modelo de Respuesta de Error Estandarizado

```json
{
  "statusCode": 400,
  "message": "Email ya existe en sistema",
  "error": "ValidationError",
  "details": {
    "field": "email",
    "value": "admin@vibralive.test",
    "constraint": "UNIQUE_VIOLATION"
  },
  "timestamp": "2026-02-24T14:30:00.000Z",
  "path": "/api/platform/users"
}
```

---

## 💻 RECOMENDACIONES TÉCNICAS FRONTEND

### 1. Server vs Client Components (Next.js 14 App Router)

#### 1.1 Estrategia General
```
┌─────────────────────────────────┐
│ Layout (Server + Providers)     │
├─────────────────────────────────┤
│                                 │
│ Sidebar (Server)                │
│  ├─ Navigation links            │
│  └─ User info (from JWT)        │
│                                 │
│ Topbar (Server)                 │
│  ├─ Search (Client)             │
│  └─ User menu (Client)          │
│                                 │
│ Main Content (Client)           │
│  ├─ Tabla + Filtros (Client)   │
│  ├─ Modales (Client)            │
│  └─ Forms (Client)              │
│                                 │
└─────────────────────────────────┘
```

#### 1.2 Client Components Obligatorios
```
- Tablas con paginación / filtros / búsqueda
- Formularios (input validación en tiempo real)
- Modales
- Toasts / Notificaciones
- Dropdowns / Selects
- Date pickers
- Impersonation context
- Loading states interactivos
```

#### 1.3 Server Components Recomendados
```
- Layout principal
- Sidebar (si es estático)
- Breadcrumb (si es estático)
- Fetch inicial de datos (SSR)
- Metadata dinámica
```

**Ejemplo:**

```typescript
// app/platform/clinics/page.tsx (Server Component)
export default async function ClinicsPage() {
  const clinics = await fetchClinicsSSR(); // Server-side data
  
  return (
    <div>
      <ClinicsClient initialData={clinics} />
    </div>
  );
}

// app/platform/clinics/ClinicsList.tsx (Client Component)
'use client'
import { ClinicsTable } from '@/components/ClinicsTable';
import { useClinics } from '@/hooks/useClinics';

export function ClinicsClient({ initialData }) {
  const { clinics, filters, paginate } = useClinics(initialData);
  
  return (
    <div>
      <ClinicsFilters {...filters} />
      <ClinicsTable data={clinics} onPaginate={paginate} />
    </div>
  );
}
```

---

### 2. Manejo de Estado (Zustand)

#### 2.1 Store Structure

```typescript
// store/platform-admin.store.ts
import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';

interface PlatformAdminStore {
  // User state
  currentUser: PlatformUser | null;
  currentRole: PlatformRole | null;
  permissions: string[];
  
  // Impersonation state
  impersonating: {
    clinic_id: string | null;
    user_id: string | null;
    original_user_id: string;
  } | null;
  
  // UI state
  sidebarOpen: boolean;
  activeTab: string;
  
  // Data state (opcional - para datos grandes usar React Query)
  clinics: Clinic[];
  selectedClinic: Clinic | null;
  
  // Actions
  setCurrentUser: (user: PlatformUser) => void;
  setPermissions: (permissions: string[]) => void;
  startImpersonation: (clinic_id: string, user_id: string) => void;
  endImpersonation: () => void;
  setSidebarOpen: (open: boolean) => void;
  setActiveTab: (tab: string) => void;
  
  // Helpers
  hasPermission: (permission: string) => boolean;
  isImpersonating: () => boolean;
}

export const usePlatformAdminStore = create<PlatformAdminStore>()(
  devtools(
    persist(
      (set, get) => ({
        currentUser: null,
        currentRole: null,
        permissions: [],
        impersonating: null,
        sidebarOpen: true,
        activeTab: 'overview',
        clinics: [],
        selectedClinic: null,
        
        setCurrentUser: (user) => set({ currentUser: user }),
        setPermissions: (permissions) => set({ permissions }),
        
        startImpersonation: (clinic_id, user_id) =>
          set({
            impersonating: {
              clinic_id,
              user_id,
              original_user_id: get().currentUser?.id || '',
            },
          }),
        
        endImpersonation: () => set({ impersonating: null }),
        
        setSidebarOpen: (open) => set({ sidebarOpen: open }),
        setActiveTab: (tab) => set({ activeTab: tab }),
        
        hasPermission: (permission) =>
          get().permissions.includes(permission),
        
        isImpersonating: () => get().impersonating !== null,
      }),
      {
        name: 'platform-admin-store',
        partialize: (state) => ({
          sidebarOpen: state.sidebarOpen,
          activeTab: state.activeTab,
        }),
      }
    )
  )
);
```

#### 2.2 Separación de Concerns

```
store/
├── platform-admin.store.ts     # User, auth, UI state
├── clinic-list.store.ts         # Tabla de clínicas (data, filters, pagination)
└── modals.store.ts              # Estado de modales (isOpen, data)
```

---

### 3. Formularios (React Hook Form + Zod)

#### 3.1 Schema Zod para Crear Clínica

```typescript
// schemas/clinic.schema.ts
import { z } from 'zod';

export const CreateClinicSchema = z.object({
  name: z
    .string()
    .min(3, 'Mínimo 3 caracteres')
    .max(100, 'Máximo 100 caracteres')
    .regex(/^[a-zA-Z0-9\s\-ñáéíóú]+$/, 'Solo letras, números y guiones'),
  
  city: z.string().nonempty('Selecciona una ciudad'),
  
  email: z
    .string()
    .email('Email inválido')
    .refine((val) => !val.endsWith('@vibralive.test'), 
      'No puede usar dominio interno'),
  
  phone: z
    .string()
    .regex(/^\+52\s\(\d{2}\)\s\d{4}-\d{4}$/, 'Formato: +52 (XX) XXXX-XXXX')
    .optional()
    .or(z.literal('')),
  
  plan: z.enum(['STARTER', 'PROFESSIONAL', 'ENTERPRISE']),
  
  status: z.enum(['ACTIVE', 'PENDING']).default('ACTIVE'),
  
  animal_types: z
    .array(z.enum(['PERRO', 'GATO', 'AVE', 'REPTIL']))
    .min(1, 'Selecciona al menos un tipo'),
});

export type CreateClinicInput = z.infer<typeof CreateClinicSchema>;

// Paso 2
export const CreateClinicOwnerSchema = z.object({
  owner_full_name: z
    .string()
    .min(3, 'Mínimo 3 caracteres')
    .max(100, 'Máximo 100 caracteres'),
  
  owner_email: z
    .string()
    .email('Email inválido'),
  
  send_invitation: z.boolean().default(true),
  
  additional_staff: z
    .array(
      z.object({
        email: z.string().email(),
        full_name: z.string().min(3),
        role: z.enum(['CLINIC_STAFF', 'CLINIC_MANAGER']),
      })
    )
    .max(5, 'Máximo 5 usuarios en este paso'),
}).refine(
  (data) => data.owner_email !== data.additional_staff.map(s => s.email).join('|'),
  { message: 'El email del owner no puede duplicarse' }
);

export type CreateClinicOwnerInput = z.infer<typeof CreateClinicOwnerSchema>;
```

#### 3.2 Implementación del Formulario

```typescript
// components/forms/CreateClinicForm.tsx
'use client'

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { CreateClinicSchema, CreateClinicInput } from '@/schemas/clinic.schema';

export function CreateClinicForm() {
  const [step, setStep] = useState(1);
  const [clinicData, setClinicData] = useState<Partial<CreateClinicInput>>({});
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    watch,
  } = useForm<CreateClinicInput>({
    resolver: zodResolver(CreateClinicSchema),
    mode: 'onChange', // Validación en tiempo real
  });
  
  const onSubmit = async (data: CreateClinicInput) => {
    if (step === 1) {
      setClinicData(data);
      setStep(2);
    } else {
      // Submit completo
      const response = await createClinic({
        ...clinicData,
        ...data,
      });
      
      if (response.ok) {
        // Toast success + redirect
      }
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {step === 1 ? (
        <>
          <div>
            <label>Nombre *</label>
            <input
              {...register('name')}
              placeholder="Ej: Mascota Monterrey"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <span className="text-red-500 text-sm">
                {errors.name.message}
              </span>
            )}
          </div>

          <div>
            <label>Ciudad *</label>
            <select {...register('city')}>
              <option value="">Seleccionar...</option>
              <option value="CDMX">Ciudad de México</option>
              <option value="GDL">Guadalajara</option>
            </select>
            {errors.city && (
              <span className="text-red-500">{errors.city.message}</span>
            )}
          </div>

          <div>
            <label>Email *</label>
            <input
              {...register('email')}
              type="email"
              placeholder="contact@clinic.com"
            />
            {errors.email && (
              <span className="text-red-500">{errors.email.message}</span>
            )}
          </div>

          {/* Más campos... */}

          <div className="flex justify-end gap-2">
            <button type="button">Cancelar</button>
            <button 
              type="submit" 
              disabled={isSubmitting || !isValid}
            >
              Siguiente →
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Paso 2 */}
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creando...' : 'Crear Clínica'}
          </button>
        </>
      )}
    </form>
  );
}
```

---

### 4. Manejo de Errores API

#### 4.1 Custom Hook para Errores

```typescript
// hooks/useApiError.ts
import { AxiosError } from 'axios';

interface ApiErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  details?: Record<string, any>;
}

export function useApiError() {
  const getErrorMessage = (error: unknown): string => {
    if (error instanceof AxiosError) {
      const data = error.response?.data as ApiErrorResponse;
      
      if (data?.statusCode === 403) {
        return 'No tienes permiso para realizar esta acción';
      }
      
      if (data?.statusCode === 409) {
        return 'El recurso ya existe. Intenta con otro valor.';
      }
      
      return data?.message || 'Error desconocido';
    }
    
    return 'Error de conexión';
  };
  
  return { getErrorMessage };
}
```

#### 4.2 API Client con Interceptores

```typescript
// lib/api-client.ts
import axios from 'axios';
import { useAuthStore } from '@/store/auth.store';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

// Request interceptor
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado, refresh
      useAuthStore.getState().refreshToken();
    }
    
    if (error.response?.status === 403) {
      // Permission denied
      console.error('Permission denied:', error.response.data);
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
```

---

### 5. Loading States y Esqueletos

#### 5.1 Skeleton Loaders

```typescript
// components/skeletons/ClinicTableSkeleton.tsx
export function ClinicTableSkeleton() {
  return (
    <table className="w-full">
      <tbody>
        {Array(5).fill(0).map((_, i) => (
          <tr key={i} className="border-b">
            <td className="p-4">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-32" />
            </td>
            <td className="p-4">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
            </td>
            {/* Más columnas */}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

#### 5.2 Button Loading States

```typescript
// components/Button.tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: 'primary' | 'danger' | 'secondary';
}

export function Button({ loading, children, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={`px-4 py-2 rounded transition-all ${
        loading ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {loading ? (
        <>
          <span className="inline-block animate-spin">⟳</span> Cargando...
        </>
      ) : (
        children
      )}
    </button>
  );
}
```

---

### 6. Estructura de Carpetas Recomendada

```
vibralive-frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   └── platform/
│   │       ├── layout.tsx
│   │       ├── dashboard/
│   │       │   └── page.tsx
│   │       ├── clinics/
│   │       │   ├── page.tsx          # Lista
│   │       │   ├── [id]/
│   │       │   │   └── page.tsx      # Detalle
│   │       │   └── new/
│   │       │       └── page.tsx      # Crear
│   │       ├── users/
│   │       │   └── page.tsx
│   │       └── audit-logs/
│   │           └── page.tsx
│   │
│   ├── components/
│   │   ├── platform/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Topbar.tsx
│   │   │   ├── clinics/
│   │   │   │   ├── ClinicsList.tsx
│   │   │   │   ├── ClinicDetail.tsx
│   │   │   │   ├── ClinicForm.tsx
│   │   │   │   └── ClinicFilters.tsx
│   │   │   ├── users/
│   │   │   │   ├── UsersList.tsx
│   │   │   │   └── UserModal.tsx
│   │   │   └── modals/
│   │   │       ├── CreateClinicModal.tsx
│   │   │       ├── ConfirmSuspendModal.tsx
│   │   │       └── ImpersonateModal.tsx
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Toast.tsx
│   │   │   └── DataTable.tsx
│   │   └── skeletons/
│   │       ├── ClinicTableSkeleton.tsx
│   │       └── ClinicDetailSkeleton.tsx
│   │
│   ├── hooks/
│   │   ├── useClinics.ts       # React Query hook
│   │   ├── useUsers.ts
│   │   ├── useApiError.ts
│   │   └── useImpersonation.ts
│   │
│   ├── lib/
│   │   ├── api-client.ts
│   │   ├── validations.ts
│   │   └── utils.ts
│   │
│   ├── store/
│   │   ├── platform-admin.store.ts
│   │   ├── clinic-list.store.ts
│   │   └── modals.store.ts
│   │
│   ├── schemas/
│   │   ├── clinic.schema.ts
│   │   ├── user.schema.ts
│   │   └── auth.schema.ts
│   │
│   ├── services/
│   │   ├── clinics.service.ts
│   │   ├── users.service.ts
│   │   └── audit.service.ts
│   │
│   └── types/
│       └── index.ts

```

---

### 7. Data Fetching (React Query vs SWR)

#### Recomendación: TanStack Query (React Query)

**Ventajas:**
- Caching automático
- Refetch en foco de ventana
- Paginación integrada
- Request deduplication
- Cancelación automática de requests

```typescript
// hooks/useClinics.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clinicsService } from '@/services/clinics.service';

export function useClinics(params: ClinicsParams) {
  return useQuery({
    queryKey: ['clinics', params],
    queryFn: () => clinicsService.list(params),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos (antiguo cacheTime)
  });
}

export function useCreateClinic() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data) => clinicsService.create(data),
    onSuccess: () => {
      // Invalida la lista
      queryClient.invalidateQueries({ queryKey: ['clinics'] });
    },
  });
}
```

---

### 8. Buenas Prácticas Multi-Tenant

#### 8.1 Verificación de Acceso

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { jwtDecode } from 'jwt-decode';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('accessToken')?.value;
  
  if (!token) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
  
  try {
    const decoded = jwtDecode(token);
    
    // Si la URL contiene clinic_id, verifica que el usuario tenga acceso
    const clinicId = request.nextUrl.pathname.split('/')[3];
    
    if (clinicId && decoded.clinic_id !== clinicId) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  } catch {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/platform/:path*'],
};
```

#### 8.2 Context para Clinic Actual

```typescript
// context/clinic.context.tsx
'use client'

import { createContext, useContext } from 'react';

interface ClinicContextType {
  clinicId: string | null;
  clinic: Clinic | null;
}

const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

export function ClinicProvider({ children, clinicId }: any) {
  return (
    <ClinicContext.Provider value={{ clinicId, clinic: null }}>
      {children}
    </ClinicContext.Provider>
  );
}

export function useClinicContext() {
  const context = useContext(ClinicContext);
  if (!context) {
    throw new Error('useClinicContext debe ser usado dentro de ClinicProvider');
  }
  return context;
}
```

---

## 🔐 CONSIDERACIONES DE SEGURIDAD

### 1. Data Isolation & Multi-Tenancy

**Regla de Oro:**
```
NUNCA exponer datos de otros tenants
Validar clinic_id en CADA query
```

**Backend:**
```typescript
// Ejemplo Good ✓
async getClinicUsers(clinicId: string, userId: string) {
  // 1. Verificar que el usuario tiene acceso a esta clínica
  const userAccess = await this.userClinicService.validateAccess(
    userId, 
    clinicId
  );
  
  if (!userAccess) {
    throw new ForbiddenException();
  }
  
  // 2. Consultar SOLO usuarios de esa clínica
  return this.userRepository.find({
    where: { clinic_id: clinicId },
  });
}

// Ejemplo Bad ✗
async getClinicUsers(clinicId: string) {
  return this.userRepository.find({
    where: { clinic_id: clinicId },
  });
  // No valida si el usuario puede acceder a esa clínica!
}
```

**Frontend:**
```typescript
// Validar clinic_id en middleware
// Mantener clinic_id en header Authorization
// No confiar en parámetro de URL para queries sensitivas
```

### 2. Auditoría de Acciones Críticas

**Registro obligatorio:**
```
- Crear clínica ✓
- Suspender clínica ✓
- Crear usuario ✓
- Cambiar rol ✓
- Impersonate (crítico) ✓
- Reset password ✓
- Ver datos sensitivos ✓
```

**Payload de auditoría:**
```json
{
  "actor_id": "platform-user-uuid",
  "action": "IMPERSONATE",
  "resource_type": "clinic_user",
  "resource_id": "user-uuid",
  "clinic_id": "clinic-uuid",
  "changes": {
    "before": {},
    "after": {}
  },
  "impersonation_context": {
    "original_platform_user_id": "admin-uuid",
    "impersonating_as_user_id": "clinic-user-uuid",
    "impersonating_as_clinic_id": "clinic-uuid"
  },
  "client_ip": "192.168.1.100",
  "user_agent": "Mozilla/...",
  "status": "SUCCESS",
  "created_at": "2026-02-24T14:30:00Z"
}
```

### 3. Impersonation Security

```typescript
// 1. Requisitos
- Solo PLATFORM_SUPERADMIN puede impersonate
- Requiere permission: users:impersonate
- Timeout de 1 hora (sessión separada)
- Se registra inmediatamente en auditoría

// 2. Implementación
POST /platform/clinics/{clinic_id}/users/{user_id}/impersonate
→ Genera JWT temporal con flags impersonation
→ JWT contiene original_user_id + impersonating_user_id
→ Frontend muestra banner: "👤 Impersonating: Juan [Exit]"

// 3. Validación en backend
En cada request:
- Si impersonating !== null, validar que original_user_id es SUPERADMIN
- Incluir impersonation_context en auditoría
- Si 1 hora pass, invalidar token

// 4. Exit
POST /platform/impersonate/exit
→ Redirecciona a platform admin panel
→ Registra FIN de impersonation en auditoría
```

### 4. Permiso Verificación en Cada Endpoint

**Guard:**
```typescript
@UseGuards(AuthGuard, PermissionGuard)
@RequirePermission('clinics:create')
@Post('clinics')
async createClinic(@Body() dto: CreateClinicDto) {
  // Guard ya verificó
  // statusCode 403 si no tiene permiso
}
```

**Nunca hacer:**
```typescript
// ✗ MAL: Confiar en frontend
if (user.role === 'SUPERADMIN') {
  // Crear
}

// ✓ BIEN: Verificar en backend
@RequirePermission('clinics:create')
```

### 5. JWT & Refresh Tokens

```
Access Token:
- Duración: 15 minutos
- Payload: user, roles, permissions, tenant_id

Refresh Token:
- Duración: 7 días
- Usado para renovar access token
- No incluye datos sensitivos
- Almacenado en httpOnly cookie
```

### 6. Rate Limiting

```typescript
// Endpoints sensitivos
- Login: 5 intentos / 15 minutos
- Reset password: 3 intentos / hora
- Create clinic: 10 / hora
- Impersonate: 20 / hora
```

### 7. CORS & CSRF

```typescript
// CORS
corsOptions: {
  origin: process.env.FRONTEND_URL,
  credentials: true,
  optionsSuccessStatus: 200,
}

// CSRF
generarCSRFToken en login
Incluir en headers de POST/PATCH/DELETE
```

### 8. Secrets Management

```
// En Azure Key Vault
- DATABASE_PASSWORD
- JWT_SECRET
- WHATSAPP_API_KEY
- API_KEYS

NO en .env o código
```

---

## 🚀 ROADMAP DE IMPLEMENTACIÓN

### Fase 1: Foundation (Semana 1-2)

#### Backend
- [ ] Crear tablas: platform_users, platform_roles, audit_logs
- [ ] Implementar Guards: AuthGuard, PlatformRoleGuard, PermissionGuard
- [ ] Endpoints CRUD básicos: Clínicas, Usuarios
- [ ] Auditoría automática (AuditInterceptor)
- [ ] Validar permisos en cada endpoint

#### Frontend
- [ ] Layout base (Sidebar + Topbar)
- [ ] Store Zustand (platform-admin)
- [ ] Setup React Query
- [ ] Componente DataTable reutilizable
- [ ] Autenticación (JWT)

#### Base de Datos
- [ ] Migraciones
- [ ] Seeds de roles

---

### Fase 2: CRUD Clínicas (Semana 2-3)

#### Pantallas
- [ ] Lista de clínicas (tabla, filtros, búsqueda, paginación)
- [ ] Crear clínica (wizard 2 pasos)
- [ ] Detalle de clínica (tabs)
- [ ] Editar clínica

#### Funcionalidad
- [ ] Suspender / Activar clínica
- [ ] Cambiar plan (MVP+)
- [ ] Soft delete

---

### Fase 3: Gestión de Usuarios (Semana 3-4)

#### Pantallas
- [ ] Lista de usuarios plataforma
- [ ] Crear usuario (modal)
- [ ] Crear usuario en clínica (modal)
- [ ] Gestionar roles (tabla de usuarios)

#### Funcionalidad
- [ ] Invitaciones por email (magic link)
- [ ] Reset password
- [ ] Deactivar usuario
- [ ] Impersonate usuario
- [ ] Forzar logout

---

### Fase 4: Auditoría & Polish (Semana 4)

#### Auditoría
- [ ] Dashboard de auditoría (tabla, filtros)
- [ ] Exportar logs (CSV)
- [ ] Detalle de log

#### Polish
- [ ] Validaciones frontend
- [ ] Error handling
- [ ] Loading states
- [ ] Toasts
- [ ] Mobile responsive

---

## 📋 RESUMEN EJECUTIVO

| Aspecto | Decisión |
|---------|----------|
| **RBAC** | 3 roles plataforma + roles de clínica, permisos granulares en DB |
| **Datos** | Nuevas tablas: platform_users, platform_roles, audit_logs |
| **Frontend** | Next.js 14 (Server/Client), Zustand, React Query, React Hook Form + Zod |
| **Backend** | Guards en NestJS, Auditoría automática, Validación multi-tenant |
| **Seguridad** | Impersonation con auditoría, Rate limiting, CORS, JWT 15min + refresh 7d |
| **MVP Scope** | CRUD clínicas, usuarios, roles, auditoría básica. NO: planes/billing, mobile |
| **Prioridad** | Data isolation > Auditoría > UX > Optimización |

---

**Esta especificación está lista para traducirse en código de producción.**

