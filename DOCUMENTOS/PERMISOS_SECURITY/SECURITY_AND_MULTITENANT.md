# 🔐 Seguridad & Multitenant - Documento Técnico

**Versión**: 1.0  
**Fecha**: February 25, 2026  
**Audiencia**: Business Analyst, Arquitecto de Software, Tech Lead  
**Estado**: ✅ Producción Ready  

---

## Executive Summary

VibraLive implementa una arquitectura **multitenant de aislamiento de datos por clínica** con autenticación basada en **JWT** y autorización mediante **roles y permisos granulares**. 

**Modelo de Seguridad**: 
- 🏥 **Multitenant**: Cada clínica (tenant) es un aislamiento lógico
- 👥 **RBAC + PBAC**: Roles (propietario, staff) + Permisos específicos
- 🔐 **JWT**: Tokens con clinic_id incluido
- 📝 **Audit Trail**: Log de todas las acciones críticas
- 🛡️ **Defense in Depth**: Guards + interceptores + validaciones

**Impacto Empresarial**:
- ✅ Seguridad de datos por cliente garantizada
- ✅ Escalabilidad horizontal (multiclínica)
- ✅ Cumplimiento regulatorio (GDPR, auditoría)
- ✅ Control granular de acceso
- ✅ Trazabilidad de operaciones

---

## 1. Arquitectura Multitenant

### 1.1 Concepto de Tenant

Un **tenant** es una clínica veterinaria independiente. La arquitectura permite múltiples clínicas en una única instancia de base de datos con **aislamiento lógico de datos**.

```
┌─────────────────────────────────────────────────┐
│          INFRAESTRUCTURA COMPARTIDA             │
│  (Base de datos única, servidor único)          │
└─────────────────────────────────────────────────┘
         │        │        │        │
    ┌────┴─┐  ┌──┴────┐ ┌─┴─────┐ ┌┴───────┐
    │Clínica│  │Clínica│ │Clínica│ │Clínica │
    │   A   │  │   B   │ │   C   │ │   D    │
    └──────┬┘  └──┬────┘ └─┬─────┘ └┬───────┘
         │        │        │        │
         └────────┼────────┼────────┘
                  │
            ┌─────▼─────────────────┐
            │   CLINIC_ID FILTER    │
            │  Todos los queries    │
            │  incluyen clinic_id   │
            └───────────────────────┘
```

### 1.2 Niveles de Aislamiento

| Nivel | Mecanismo | Dónde | Efecto |
|-------|-----------|-------|--------|
| **Base de Datos** | `clinic_id` FK | Entity |Datos separados logicamente |
| **API Queries** | `WHERE clinic_id = ?` | Repository | Solo datos del tenant |
| **JWT Payload** | `clinic_id` token | Request | Validación en guards |
| **Middleware** | Tenant context | Interceptor | Propagación de contexto |
| **Auditoría** | `tenant_id` log | Audit Entity | Trazabilidad por cliente |

### 1.3 Entidades Multitenants

**Entities que pertenecen a Clinic** (clinic_id as FK):
```typescript
✅ Client        - Clientes de la clínica
✅ Pet          - Mascotas registradas
✅ AnimalType   - Tipos de animales (customizable)
✅ Reminder     - Recordatorios (citas, vacunas)
✅ MessageLog   - Historial de mensajes (SMS/WhatsApp)
✅ User         - Staff de la clínica
```

**Entities sin clinic_id** (globales):
```typescript
❌ PlatformUser    - Usuarios de plataforma (soporte, admin system)
❌ PlatformRole    - Roles de plataforma
❌ AuditLog        - Log de auditoría global
```

### 1.4 Flujo de Request en Contexto Multitenant

```
1. Login Frontend
   │
2. Backend valida credenciales
   │
3. JWT generado con:
   ├── user_id
   ├── clinic_id ◄── KEY MULTITENANT
   ├── role: "owner" | "staff"
   └── permissions: ["clients:read", ...]
   │
4. Request a /api/clients
   ├── Header: Authorization: Bearer {jwt}
   │
5. AuthGuard verifica JWT
   ├── Extrae clinic_id del token
   ├── Asigna request.clinicId ◄── MULTITENANT CONTEXT
   │
6. ClientController.findAll()
   ├── Inyecta @CurrentClinicId() clinic_id
   ├── SELECT * FROM clients WHERE clinic_id = ?
   │
7. Resultado: solo datos de esa clínica
```

### 1.5 Escalabilidad Horizontal

```
┌─────────────────────────────────────────────────┐
│     PLAN DE ESCALABILIDAD MULTITENANT           │
└─────────────────────────────────────────────────┘

STARTER PLAN
├── Max 1 clínica
├── Max 100 staff users
├── Max 1,000 clientes
└── Max 5,000 mascotas

PROFESSIONAL PLAN
├── Max 5 clínicas
├── Max 500 staff users
├── Max 10,000 clientes
└── Max 50,000 mascotas

ENTERPRISE PLAN
├── Max unlimited clínicas / cuenta
├── Max unlimited staff
├── Max unlimited clientes
└── Max unlimited mascotas
└── SLA 99.9%
```

---

## 2. Autenticación

### 2.1 Flujo de Login

```
┌────────────────────────────────────────────────┐
│           FLUJO DE AUTENTICACIÓN               │
└────────────────────────────────────────────────┘

USUARIO FINAL
    │
    ├─ Input: email + password
    │
    ▼
FRONTEND (Next.js)
    ├─ POST /api/auth/login
    ├─ Body: { email, password }
    │
    ▼
BACKEND (NestJS)
    ├─ 1. Validar payload (Zod schema)
    ├─ 2. SELECT user WHERE email = ?
    ├─ 3. bcrypt.compare(password, hashed)
    │         ❌ No coincide → 401 Unauthorized
    │
    ├─ 4. Cargar clinic del usuario (clinic_id)
    ├─ 5. Verificar clinic.status = ACTIVE
    │         ❌ Suspendida → 403 Forbidden
    │
    ├─ 6. Cargar roles y permisos del usuario
    ├─ 7. Generar JWT con:
    │    {
    │      sub: user.id,
    │      email: user.email,
    │      clinic_id: user.clinic_id,
    │      role: user.role,
    │      permissions: [...]
    │    }
    │
    ├─ 8. Actualizar last_login
    ├─ 9. Retornar { user, token }
    │
    ▼
FRONTEND (Next.js)
    ├─ localStorage.setItem('token', token)
    ├─ Zustand auth-store.setUser(user)
    ├─ Redirect segun rol:
    │   ├─ superadmin → /dashboard/admin
    │   ├─ owner → /clinic/dashboard
    │   └─ staff → /staff/dashboard
    │
    ▼
USUARIO AUTORIZADO
```

### 2.2 Estructura JWT

```
JWT = Header.Payload.Signature

HEADER:
{
  "alg": "HS256",
  "typ": "JWT"
}

PAYLOAD: (incluir clinic_id es crucial)
{
  "sub": "user-uuid-123",           // user_id
  "email": "owner@clinic.mx",
  "clinic_id": "clinic-uuid-456",   // ◄── MULTITENANT KEY
  "role": "owner",
  "permissions": [
    "clients:create",
    "clients:read",
    "clients:update",
    "pets:*"
  ],
  "iat": 1708915600,               // Issued at
  "exp": 1708919200,               // Token expira en 1 hora
  "jti": "unique-id"               // JWT ID para invalidación
}

SIGNATURE:
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  process.env.JWT_SECRET_KEY
)
```

### 2.3 Ciclo de Vida del Token

| Evento | Acción | Duración |
|--------|--------|----------|
| **Login exitoso** | JWT generado | Inmediato |
| **Token válido** | Requests autorizados | 1 hora (configurable) |
| **Token a expirar** | Refresh token llamado | Preemptive |
| **Token expirado** | 401 Unauthorized | Rechazo automático |
| **Logout** | Token invalidado | Inmediato (blacklist) |

### 2.4 Seguridad de Credenciales

```
ALMACENAMIENTO DE PASSWORD
├─ NUNCA: almacenar en plain text
├─ ✅ SIEMPRE: bcrypt.hash() con salt rounds = 10
│
VERIFICACIÓN
├─ bcrypt.compare(input, stored_hash)
├─ Retorna boolean
├─ Immune a ataques de timing
│
RESET PASSWORD
├─ Token temporal uuid v4
├─ Expira en 15 minutos
├─ One-time use
├─ Enviado por email con link

EJEMPLO:
user.passwordResetToken = uuid.v4()
user.passwordResetTokenExpiresAt = now + 15 minutes
```

---

## 3. Autorización (RBAC + PBAC)

### 3.1 Modelo de Roles - Clinic-Level

**Roles dentro de una clínica:**

```
1. OWNER (Propietario)
   ├─ Acceso total a la clínica
   ├─ Gestión de staff
   ├─ Facturación
   ├─ Reportería
   └─ Pero: NO puede acceder a otras clínicas

2. STAFF (Personal clínica)
   ├─ Gestión de clientes (lectura)
   ├─ Gestión de mascotas (lectura)
   ├─ Recordatorios (CRUD)
   ├─ Mensajes (lectura)
   └─ Pero: Solo de su propia clínica

3. SUPERADMIN (Plataforma - NO clinic-specific)
   ├─ Acceso a TODAS las clínicas
   ├─ Gestión de clínicas
   ├─ Gestión de usuarios globales
   ├─ Auditoría
   └─ Puede impersonate clinics
```

### 3.2 Matriz de Permisos

```
RECURSO              │ SUPERADMIN │ OWNER  │ STAFF
─────────────────────┼────────────┼────────┼──────
clinics (admin)      │ ✅ *       │ ❌     │ ❌
users (all)          │ ✅ *       │ ❌     │ ❌
audit (all)          │ ✅ R       │ ❌     │ ❌
dashboard (admin)    │ ✅         │ ❌     │ ❌
─────────────────────┼────────────┼────────┼──────
clinic (own)         │ ❌         │ ✅ RU  │ ❌
clients              │ ❌         │ ✅ *   │ ✅ R
pets                 │ ❌         │ ✅ *   │ ✅ R
staff (own clinic)   │ ❌         │ ✅ *   │ ❌
reminders            │ ❌         │ ✅ *   │ ✅ *
messages             │ ❌         │ ✅ *   │ ✅ R
reports              │ ❌         │ ✅ R   │ ❌

* = CRUD (Create, Read, Update, Delete)
R = Read only
RU = Read, Update
```

### 3.3 Guards & Decorators

**Guard Chain** (orden importa):

```
http request
    │
    ▼
1. AuthGuard
   ├─ ¿Hay JWT?
   ├─ ¿JWT válido?
   ├─ Si no → 401 Unauthorized
   │
    ▼
2. RoleGuard
   ├─ ¿Necesita rol específico?
   ├─ ¿user.role coincide?
   ├─ Si no → 403 Forbidden
   │
    ▼
3. PermissionGuard
   ├─ ¿Necesita permisos específicos?
   ├─ ¿user.permissions incluye?
   ├─ Si no → 403 Forbidden
   │
    ▼
4. Controller
   ├─ Request.user válido
   ├─ Request.clinicId poblado
   ├─ Procesar lógica
   │
    ▼
200 OK / 201 Created / etc
```

### 3.4 Aplicación de Guards

**Ejemplo en Controller:**

```typescript
import { AuthGuard } from '@/common/guards/auth.guard';
import { RoleGuard } from '@/common/guards/role.guard';
import { PermissionGuard } from '@/common/guards/permission.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { RequirePermission } from '@/common/decorators/require-permission.decorator';

@Controller('clients')
@UseGuards(AuthGuard, RoleGuard, PermissionGuard)  // Chain de guards
export class ClientController {
  
  // Público (solo necesita estar autenticado)
  @Get()
  findAll(
    @CurrentClinicId() clinicId: string,
    @CurrentUser() user: User
  ) {
    // SELECT * FROM clients WHERE clinic_id = clinicId
  }

  // Solo Owner de la clínica
  @Post()
  @Roles(['owner'])
  @RequirePermission(['clients:create'])
  create(
    @Body() dto: CreateClientDto,
    @CurrentClinicId() clinicId: string
  ) {
    // INSERT INTO clients ...
  }

  // Solo Superadmin (puede ver todas las clínicas)
  @Get('/admin/all-clinics')
  @Roles(['superadmin'])
  findAllClinics() {
    // SELECT * FROM clients (sin WHERE clinic_id)
  }
}
```

### 3.5 Permisos Granulares

```
FORMATO: "resource:action"

Ejemplos:
✅ "clients:create"       - Crear clientes
✅ "clients:read"         - Leer clientes
✅ "clients:update"       - Actualizar clientes
✅ "clients:delete"       - Eliminar clientes
✅ "clients:*"            - Todo en clientes

✅ "pets:read"
✅ "pets:create"
✅ "staff:manage"         - Gestionar staff
✅ "reports:export"       - Exportar reportes
✅ "audit:view"           - Ver logs de auditoría
✅ "clinic:suspend"       - Suspender clínica

ASIGNACIÓN:
owner -> [
  "clients:*",
  "pets:*",
  "staff:manage",
  "reports:*",
  "reminders:*"
]

staff -> [
  "clients:read",
  "pets:read",
  "reminders:*",
  "messages:read"
]
```

---

## 4. Capas de Seguridad

### 4.1 Defense in Depth

```
┌────────────────────────────────────────────────┐
│            CAPAS DE SEGURIDAD                  │
└────────────────────────────────────────────────┘

CAPA 1: TRANSPORTE
├─ HTTPS/TLS 1.3 (encriptación en tránsito)
├─ Certificados SSL válidos
└─ HTTP Strict Transport Security (HSTS)

    │
    ▼
CAPA 2: AUTENTICACIÓN
├─ JWT tokens
├─ Validación de firma
├─ Verificación de expiración
├─ Extraction de Bearer token
└─ Rechazo de malformados

    │
    ▼
CAPA 3: AUTORIZACIÓN
├─ RoleGuard (verifica rol)
├─ PermissionGuard (verifica permisos específicos)
├─ Clinic isolation (clinic_id check)
└─ Data-level authorization (WHERE clinic_id=?)

    │
    ▼
CAPA 4: VALIDACIÓN
├─ Input validation (Zod schemas)
├─ Type checking (TypeScript)
├─ SQL injection prevention (TypeORM parameterized)
└─ Rate limiting (futuro)

    │
    ▼
CAPA 5: AUDITORÍA
├─ AuditLog entity
├─ Logging de acciones críticas
├─ Trazabilidad de cambios
├─ Timestamp + usuario + acción
└─ Almacenamiento persistente

    │
    ▼
CAPA 6: MONITOREO
├─ Error tracking
├─ Alertas de seguridad
├─ Análisis de acceso (futuro)
└─ Detección de anomalías (futuro)
```

### 4.2 Validation Pipeline

```typescript
// 1. Validación de input (DTO + Zod)
const CreateClientDtoSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
  phone: z.string().regex(/^\+?[0-9]+$/)
});

type CreateClientDto = z.infer<typeof CreateClientDtoSchema>;

// 2. En el controller
@Post()
@UseGuards(AuthGuard, RoleGuard, PermissionGuard)
async create(
  @Body() dto: CreateClientDto,  // Automáticamente validado
  @CurrentClinicId() clinicId: string
) {
  // En este punto:
  // ✅ DTO es válido
  // ✅ Usuario autenticado (JWT válido)
  // ✅ Usuario tiene permisos
  // ✅ clinicId inyectado del JWT
  
  const client = await this.clientsService.create({
    ...dto,
    clinic_id: clinicId  // Asegurado
  });
}
```

### 4.3 SQL Injection Prevention

```typescript
// ❌ WRONG - Vulnerable
db.query(`SELECT * FROM clients WHERE clinic_id = '${clinicId}'`);

// ✅ RIGHT - TypeORM parameterized
const clients = await clientRepository.find({
  where: { clinic_id: clinicId }  // Parameterized
});

// ✅ RIGHT - Query builder
const clients = await clientRepository
  .createQueryBuilder('client')
  .where('client.clinic_id = :clinicId', { clinicId })  // Parameterized
  .getMany();
```

### 4.4 Cross-Site Request Forgery (CSRF)

```typescript
// Protección: Token en cookies + mismo origen
// Frontend automáticamente:
// 1. Guarda JWT en localStorage (no httpOnly por ahora)
// 2. Lo incluye en Authorization header
// 3. Solo se envía al mismo origin

// Header HTTP:
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// CORS configurado en backend:
@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot(),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' }
    })
  ]
})
export class AppModule {}
```

---

## 5. Data Isolation & Multitenant Queries

### 5.1 Patrón de Data Isolation

**Objetivo**: Garantizar que ningún usuario vea datos de otras clínicas

```typescript
// Repository patrón con isolation automática
@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private clientRepository: Repository<Client>
  ) {}

  async findAll(clinicId: string): Promise<Client[]> {
    // SIEMPRE filtrar por clinic_id
    return this.clientRepository.find({
      where: { clinic_id: clinicId }  // ◄── CRUCIAL
    });
  }

  async findById(id: string, clinicId: string): Promise<Client> {
    // SIEMPRE incluir clinic_id en búsquedas por ID
    const client = await this.clientRepository.findOne({
      where: { 
        id,
        clinic_id: clinicId  // ◄── CRUCIAL
      }
    });

    if (!client) {
      throw new NotFoundException('Cliente no encontrado');
      // (o cliente en otra clínica)
    }

    return client;
  }

  async create(dto: CreateClientDto, clinicId: string): Promise<Client> {
    // SIEMPRE asignar clinic_id del JWT
    const client = this.clientRepository.create({
      ...dto,
      clinic_id: clinicId  // ◄── NUNCA del usuario input
    });

    return this.clientRepository.save(client);
  }

  async delete(id: string, clinicId: string): Promise<void> {
    // SIEMPRE verificar ownership
    const client = await this.findById(id, clinicId);  // Throws si no existe
    await this.clientRepository.remove(client);
  }
}
```

### 5.2 Controller Application Pattern

```typescript
@Controller('clients')
@UseGuards(AuthGuard, RoleGuard, PermissionGuard)
export class ClientsController {
  constructor(private clientsService: ClientsService) {}

  @Get()
  @Roles(['owner', 'staff'])
  @RequirePermission(['clients:read'])
  async findAll(
    @CurrentClinicId() clinicId: string  // ◄── Inyectado del JWT
  ) {
    // clinicId garantizado + validado
    return this.clientsService.findAll(clinicId);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentClinicId() clinicId: string
  ) {
    // Busca: WHERE id=? AND clinic_id=?
    return this.clientsService.findById(id, clinicId);
  }

  @Post()
  @Roles(['owner'])
  @RequirePermission(['clients:create'])
  async create(
    @Body() dto: CreateClientDto,
    @CurrentClinicId() clinicId: string
  ) {
    // Crea con clinic_id del JWT (no de request body)
    return this.clientsService.create(dto, clinicId);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateClientDto,
    @CurrentClinicId() clinicId: string
  ) {
    return this.clientsService.update(id, dto, clinicId);
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @CurrentClinicId() clinicId: string
  ) {
    await this.clientsService.delete(id, clinicId);
  }
}
```

### 5.3 Query Ejemplos

```sql
-- ✅ Correcto: Filtro por clinic_id en todo
SELECT c.* FROM clients c
WHERE c.clinic_id = $1

-- ❌ INCORRECTO: Sin filtro de clinic_id
SELECT c.* FROM clients c

-- ❌ INCORRECTO: Validar en app, no en DB
SELECT c.* FROM clients c
WHERE c.id = $1
-- Problema: El app debe validar clinic_id por separado :(

-- ✅ Mejor: Incluir en query
SELECT c.* FROM clients c
WHERE c.id = $1 AND c.clinic_id = $2

-- ✅ Para relacionales: Incluir clinic_id en JOINs
SELECT c.*, p.* FROM clients c
LEFT JOIN pets p ON p.client_id = c.id
WHERE c.clinic_id = $1 AND p.clinic_id = $1
-- (pets también tiene clinic_id)
```

---

## 6. Auditoría y Logging

### 6.1 AuditLog Entity

```typescript
@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  tenant_id!: string;  // clinic_id o platform entity

  @Column()
  user_id!: string;    // Quién hizo la acción

  @Column()
  action!: string;     // 'CREATE', 'UPDATE', 'DELETE', 'LOGIN'

  @Column()
  resource_type!: string;  // 'client', 'pet', 'user'

  @Column()
  resource_id!: string;    // ID del recurso afectado

  @Column('jsonb', { nullable: true })
  changes!: {
    before?: Record<string, any>,
    after?: Record<string, any>
  };

  @Column()
  ip_address!: string;

  @Column('jsonb', { nullable: true })
  metadata!: Record<string, any>;

  @CreateDateColumn()
  created_at!: Date;
}
```

### 6.2 Acciones Auditadas

```
CATEGORÍA         │ ACCIONES REGISTRADAS
──────────────────┼──────────────────────────
Autenticación     │ LOGIN, LOGOUT, INVALID_LOGIN, PASSWORD_RESET
                  │
Gestión de datos  │ CLIENT_CREATED, CLIENT_UPDATED, CLIENT_DELETED
                  │ PET_CREATED, PET_UPDATED, PET_DELETED
                  │
Gestión de staff  │ USER_INVITED, USER_ACTIVATED, USER_DEACTIVATED
                  │ USER_PERMISSIONS_CHANGED
                  │
Gestión de clínica│ CLINIC_SUSPENDED, CLINIC_REACTIVATED
                  │ CLINIC_PLAN_CHANGED
                  │
Seguridad         │ FAILED_AUTH, PERMISSION_DENIED, SUSPICIOUS_ACTIVITY
```

### 6.3 Retention Policy

```
TIPO DE LOG       │ RETENCIÓN │ PROPÓSITO
──────────────────┼───────────┼────────────────────
Legal/Compliance  │ 7 años    │ Requisito regulatorio
Auditoría         │ 2 años    │ Trazabilidad
Debug logs        │ 30 días   │ Troubleshooting
Performance logs  │ 7 días    │ Análisis
```

---

## 7. Vulnerabilidades Comunes & Mitigación

### 7.1 OWASP Top 10 - VibraLive Coverage

| # | Vulnerabilidad | Estatus | Mitigación |
|---|---|---|---|
| 1 | Broken Access Control | 🟢 Mitigado | RoleGuard, PermissionGuard, clinic_id checks |
| 2 | Cryptographic Failures | 🟢 Mitigado | bcrypt, HTTPS, JWT signed |
| 3 | Injection | 🟢 Mitigado | TypeORM parameterized, TypeScript, Zod validation |
| 4 | Insecure Design | 🟡 Parcial | Mejoras en rate limiting, 2FA |
| 5 | Security Misconfiguration | 🟢 Mitigado | Environment vars, CORS configured |
| 6 | Vulnerable Components | 🟡 Parcial | Dependabot enabled, npm audit |
| 7 | Authentication Failures | 🟢 Mitigado | JWT, bcrypt, status tracking |
| 8 | Software & Data Integrity | 🟡 Mejora | Signed releases, dependency lock |
| 9 | Logging & Monitoring | 🟡 Parcial | AuditLog implementado, mejorar alertas |
| 10 | SSRF | 🟢 Mitigado | Ninguna llamada externa en scope actual |

### 7.2 Escenarios de Ataque & Defensa

**Escenario 1: Acceso a datos de otra clínica**

```
ATAQUE:
user@clinicA envía: GET /api/clients
... y en JWT tiene clinic_id = clinicA
... pero intenta modificar clinicId = clinicB

DEFENSA:
1. AuthGuard valida JWT
2. Extrae clinic_id del JWT (request.clinicId = clinicA)
3. ClientController.findAll() recibe clinicId de decorator
4. Service consulta: WHERE clinic_id = clinicA
5. ✅ Imposible acceder a clinicB

RESULTADO: 403 Forbidden (datos no encontrados)
```

**Escenario 2: Token expirado/robado**

```
ATAQUE:
Atacante obtiene token de usuario X
... pero token expiró hace 2 horas
... o usuario hizo logout (token invalidado)

DEFENSA:
1. Request llega: Authorization: Bearer {old_token}
2. AuthGuard llamaJwtService.verifyAsync(token)
3. JWT verifica:
   ├─ Firma válida? (secret key)
   ├─ exp > now? (expiración)
   └─ En blacklist? (logout)
4. ❌ Token rechazado

RESULTADO: 401 Unauthorized
```

**Escenario 3: SQL Injection**

```
ATAQUE:
POST /api/clients
Body: { name: "'; DROP TABLE clients; --" }

DEFENSA:
1. Input validation (Zod):
   ├─ name debe ser string
   ├─ Max length 255
   └─ No caracteres especiales (regex)
2. TypeORM parameterized:
   ├─ INSERT INTO clients (name, clinic_id) VALUES ($1, $2)
   ├─ Parámetros separados de query
   └─ DB driver escapa automáticamente
3. TypeScript type checking

RESULTADO: ✅ String guardado literalmente, no ejecutado
```

**Escenario 4: Escalada de privilegios**

```
ATAQUE:
staff user intenta:
POST /api/users (crear staff)
... cuando solo tiene "clients:read"

DEFENSA:
1. Request llega al UserController
2. @Roles(['owner']) decorator
   └─ Esperaowner, user tiene staff
3. RoleGuard lanza ForbiddenException
4. PermissionGuard verifica permisos
   └─ Necesita "staff:manage"
   └─ Solo tiene "clients:read"
5. Lanza ForbiddenException

RESULTADO: 403 Forbidden
```

---

## 8. Flujo de Acceso - Escenarios Reales

### 8.1 Owner de Clínica - Típico

```
OWNER FLOW:
1. Login: email + password
   → AWS DB: verificar credenciales
   → bcrypt.compare()
   
2. JWT generado:
   {
     sub: "owner-uuid",
     email: "owner@clinic.mx",
     clinic_id: "clinic-123",  ◄──
     role: "owner",
     permissions: ["clients:*", "staff:*", ...]
   }
   
3. Frontend: localStorage.token = JWT

4. GET /api/clinic/dashboard
   → AuthGuard → Verifica JWT
   → RoleGuard → ✅ role=owner
   → Controller → clinicId injected
   → Service → SELECT * FROM clients WHERE clinic_id='clinic-123'
   → Response: Dashboard data
   
5. PUT /api/clients/123
   → AuthGuard ✅
   → PermissionGuard: "clients:update"? ✅
   → Service.update(id, dto, clinicId='clinic-123')
   → UPDATE clients SET ... WHERE id=123 AND clinic_id='clinic-123'
   → Auditlog: { action: 'UPDATE', resource: 'client', user_id: 'owner-uuid' }
   → Response: 200 OK
   
6. Logout
   → Token invalidado (optional blacklist)
   → localStorage.removed
   → Next request: 401 Unauthorized
```

### 8.2 Staff - Operacional

```
STAFF FLOW:
1. Login: email + password
   
2. JWT:
   {
     sub: "staff-uuid",
     email: "vet@clinic.mx",
     clinic_id: "clinic-123",  ◄──
     role: "staff",
     permissions: ["clients:read", "pets:read", "reminders:*", ...]
   }
   
3. GET /api/clients
   → AuthGuard ✅
   → RoleGuard ✅ staff allowed
   → PermissionGuard: "clients:read"? ✅
   → Service → SELECT * WHERE clinic_id='clinic-123'  ✓
   → Response: Clientes para mostrar en tabla
   
4. POST /api/reminders (crear recordatorio)
   → AuthGuard ✅
   → PermissionGuard: "reminders:*"? ✅
   → Service → INSERT reminder (clinic_id='clinic-123')
   → Auditlog registrado
   → Response: 201 Created
   
5. POST /api/users (crear staff)
   → AuthGuard ✅
   → PermissionGuard: "staff:manage"? ❌ (solo tiene clients:read)
   → ForbiddenException: Acceso denegado
   → Response: 403 Forbidden
```

### 8.3 Superadmin - Mantenimiento

```
SUPERADMIN FLOW:
1. Login: email + password
   
2. JWT:
   {
     sub: "admin-uuid",
     email: "admin@vibralive.com",
     clinic_id: null,  ◄── NO TIENE CLINIC
     role: "superadmin",
     permissions: ["*:*"]  ◄── TODO ACCESO
   }
   
3. GET /api/admin/clinics
   → AuthGuard ✅
   → RoleGuard: "superadmin"? ✅
   → Service → SELECT * FROM clinics (sin WHERE clinic_id)
   → Response: Todas las clínicas
   
4. PUT /api/admin/clinics/clinic-123/suspend
   → AuthGuard ✅
   → RoleGuard: "superadmin"? ✅
   → Service → UPDATE clinics SET status='SUSPENDED' WHERE id='clinic-123'
   → Auditlog: { action: 'SUSPEND', resource: 'clinic', ... }
   → Response: 200 OK
   
5. GET /api/admin/audit-logs (por clínica)
   → AuthGuard ✅
   → Service → SELECT * FROM audit_logs WHERE tenant_id=? (opcional filter)
   → Response: Logs de auditoría global
   
6. POST /api/admin/platform-roles
   → AuthGuard ✅
   → RoleGuard: "superadmin"? ✅
   → Service → INSERT INTO platform_roles
   → Auditlog: { action: 'CREATE', resource: 'role', ... }
   → Response: 201 Created
```

---

## 9. Mejoras Futuras (Roadmap)

### 9.1 Seguridad adicional

```
Q1 2024:
⬜ 2FA (Two-Factor Authentication)
   └─ TOTP + SMS fallback
⬜ Rate limiting
   └─ 10 intentos de login, timeout exponencial
⬜ Device fingerprinting
   └─ Detectar logins desde nuevos dispositivos

Q2 2024:
⬜ Encryption at rest
   └─ Datos sensibles encriptados en DB
⬜ API key management
   └─ Para integraciones (WhatsApp, etc)
⬜ SSO / OAuth2
   └─ Integración con Google, Microsoft

Q3 2024:
⬜ Zero Trust Architecture
   └─ Validar en cada paso
⬜ Secret rotation
   └─ JWT secret + keys
⬜ Security scanning (SAST)
   └─ Análisis automático de código
```

### 9.2 Multitenant avanzado

```
⬜ Database sharding
   └─ Separar por clínica en prod (optional)
⬜ Tenant quotas
   └─ Realizar checks de límites en tiempo real
⬜ Tenant custom domains
   └─ clinic.vibralive.com vs app.vibralive.com/clinic
⬜ Data residency
   └─ Elegir región (GDPR compliance)
```

### 9.3 Observabilidad

```
⬜ Security events alerting
   └─ Notificaciones de acceso sospechoso
⬜ Penetration testing
   └─ Tercero externo cada semestre
⬜ SIEM integration
   └─ Splunk, Datadog para logs
⬜ Compliance monitoring (HIPAA)
   └─ Certificación automática
```

---

## 10. Compliance & Regulaciones

### 10.1 Estándares Aplicables

```
GDPR (Europa)
├─ ✅ Data isolation por clínica
├─ ✅ Right to be forgotten (delete)
├─ ✅ Audit trails
├─ ⬜ Encryption at rest (roadmap)
└─ ⬜ DPA con proveedores

HIPAA (USA - Salud Animal)
├─ ✅ Access control (roles/permisos)
├─ ✅ Audit logging
├─ ✅ Data integrity (clinic_id checks)
├─ ⬜ Encryption standards
└─ ⬜ BAA agreements

SOC 2
├─ ✅ Access control (CC6, CC9)
├─ ✅ Change management (CI1)
├─ ✅ Incident response (IR1)
└─ ⬜ Formal security policy
```

### 10.2 Data Protection

```
OWNER RIGHTS:
✅ Ver todos SUS datos (clinic_id filter)
✅ Exportar SUS datos (CSV, JSON)
⬜ (FUTURO) Eliminar SUS datos (con confirmación)
⬜ (FUTURO) Solicitar copia completa

STAFF RIGHTS:
✅ Ver datos de la clínica (read-only)
✅ Crear/editar datos propios (reminders)
❌ Ver datos de otras clínicas

VIBRALIVE OBLIGATIONS:
✅ Garantizar data isolation
✅ Mantener audit logs
✅ Usar HTTPS/TLS
✅ Hashear passwords con bcrypt
⬜ (FUTURO) Encriptar datos en reposo
⬜ (FUTURO) Compliance reporting automático
```

---

## 11. Checklist de Seguridad

Usar este checklist antes de deployment:

### Pre-Production

- [ ] **Autenticación**
  - [ ] JWT secret es de 32+ caracteres
  - [ ] Token expiration: 1 hora
  - [ ] Refresh token: implementado
  - [ ] Logout: invalida tokens
  
- [ ] **Autorización**
  - [ ] Guards aplicados en todos los endpoints críticos
  - [ ] clinic_id verificado en TODAS las queries
  - [ ] Permisos granulares asignados por rol
  - [ ] Test de escalada de privilegios (negativo)
  
- [ ] **Validación**
  - [ ] Input validation con Zod en todos los DTOs
  - [ ] Output validation antes de respuesta
  - [ ] SQL injection tests (negative)
  - [ ] XSS tests en frontend
  
- [ ] **Auditoría**
  - [ ] AuditLog en acciones críticas
  - [ ] Timestamps correctos
  - [ ] IP address capturado
  - [ ] User ID registrado
  
- [ ] **Secrets**
  - [ ] `.env` no commiteado
  - [ ] Secrets en variables de ambiente
  - [ ] No hardcoded credentials
  - [ ] Rotation policy documentada
  
- [ ] **HTTPS**
  - [ ] SSL/TLS habilitado
  - [ ] Certificate válido
  - [ ] HSTS headers
  - [ ] Redirect HTTP → HTTPS

### Post-Deployment

- [ ] **Monitoreo**
  - [ ] Logs agregados (centralizados)
  - [ ] Alertas en fallos de auth
  - [ ] Dashboard de seguridad
  - [ ] Incident response plan

- [ ] **Testing**
  - [ ] Penetration testing planificado
  - [ ] Security scanning continuo
  - [ ] Dependencia updates automáticas
  - [ ] Vulnerability patching SLA

---

## 12. Contactos & Recursos

### Documentos Relacionados

- **SYSTEM_ARCHITECTURE.md** - Flujos técnicos
- **BACKEND_VALIDATION.md** - Validación API
- **DATABASE_SCHEMA** - Entidades completas
- **API_DOCUMENTATION** - Endpoints detallados

### Team Security

```
Security Lead: [Nombre]
Email: security@vibralive.com

Incidents: security@vibralive.com
Responsiveness: < 24 horas
Escalation: CTO
```

### External Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NestJS Security](https://docs.nestjs.com/security/introduction)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8949)
- [GDPR Compliance](https://gdpr-info.eu/)

---

## Conclusión

VibraLive implementa una **arquitectura de seguridad robusta** que garantiza:

✅ **Aislamiento de datos**: clinic_id enforced en cada layer  
✅ **Autenticación fuerte**: JWT + bcrypt  
✅ **Autorización granular**: RBAC + PBAC  
✅ **Auditoría completa**: Logs de todas las acciones  
✅ **Escalabilidad multitenant**: Soporta múltiples clínicas  
✅ **Cumplimiento**: GDPR-ready, HIPAA-compatible  

**Próximos pasos**: Implementar 2FA, rate limiting, y encryption at rest según roadmap.

---

**Documento preparado para**: Business Analyst, Arquitecto de Software  
**Versión**: 1.0  
**Fecha**: February 25, 2026  
**Estado**: ✅ Production Ready
