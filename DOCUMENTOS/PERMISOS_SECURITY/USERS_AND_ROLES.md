# Sistema de Usuarios y Roles

Este documento describe la estructura y relaciones del sistema de gestión de usuarios y roles en VibraLive.

---

## 🏗️ Arquitectura de Usuarios

El sistema cuenta con **dos tipos de usuarios independientes**:

1. **Users** - Personal de clínicas veterinarias
2. **PlatformUsers** - Usuarios administrativos de la plataforma (VibraLive)

---

## 👥 Tabla 1: users (Usuarios de Clínica)

### Descripción
Almacena el personal de las clínicas veterinarias (veterinarios, asistentes, grooming, etc.).

### Estructura

| Columna | Tipo | Nullable | Descripción |
|---------|------|----------|-------------|
| `id` | UUID | ❌ | ID único del usuario |
| `clinic_id` | UUID | ✅ | ID de la clínica (FK) |
| `name` | VARCHAR(255) | ❌ | Nombre completo |
| `email` | VARCHAR(255) | ❌ | Email único |
| `phone` | VARCHAR(20) | ✅ | Teléfono |
| `hashed_password` | VARCHAR(255) | ❌ | Contraseña hasheada |
| `role` | VARCHAR(50) | ❌ | Rol: superadmin, owner, staff |
| `status` | VARCHAR(50) | ❌ | Estado: INVITED, ACTIVE, DEACTIVATED |
| `last_login` | TIMESTAMP | ✅ | Fecha del último login |
| `deactivated_at` | TIMESTAMP | ✅ | Fecha de desactivación |
| `deactivated_by` | UUID | ✅ | ID del usuario que desactivó |
| `invitation_token` | UUID | ✅ | Token de invitación |
| `invitation_token_expires_at` | TIMESTAMP | ✅ | Expiración del token |
| `password_reset_token` | UUID | ✅ | Token para resetear contraseña |
| `password_reset_token_expires_at` | TIMESTAMP | ✅ | Expiración del token de reset |
| `created_at` | TIMESTAMP | ❌ | Fecha de creación |
| `updated_at` | TIMESTAMP | ❌ | Fecha de actualización |

### Roles en Users

| Rol | Descripción | Permisos |
|-----|-------------|----------|
| **superadmin** | Superadministrador del sistema | Acceso total a todas las funciones |
| **owner** | Propietario/Administrador de clínica | Gestión completa de la clínica |
| **staff** | Personal de la clínica | Acceso limitado según permisos específicos |

### Estados de User

| Estado | Descripción |
|--------|------------|
| **INVITED** | Usuario invitado, pendiente de aceptar invitación |
| **ACTIVE** | Usuario activo y con acceso |
| **DEACTIVATED** | Usuario inactivo/desactivado |

### Ciclo de Vida

```
Invitación
    ↓
[INVITED] → (Usuario acepta) → [ACTIVE]
                                   ↓
                           (Admin desactiva)
                                   ↓
                             [DEACTIVATED]
```

### Relaciones
- **Clinic** (N:1) - Pertenece a una única clínica
- **Appointments** (1:N) - Puede estar asignado a citas
- **AuditLog** (1:N) - Se registran sus acciones

---

## 🔑 Tabla 2: platform_users (Usuarios de Plataforma)

### Descripción
Almacena usuarios administrativos de la plataforma VibraLive (soporte, finanzas, superadmins, etc.). Estos usuarios pueden administrar múltiples clínicas y tienen acceso a funcionalidades de la plataforma.

### Estructura

| Columna | Tipo | Nullable | Descripción |
|---------|------|----------|-------------|
| `id` | UUID | ❌ | ID único del usuario de plataforma |
| `email` | VARCHAR(255) | ❌ | Email único |
| `full_name` | VARCHAR(255) | ❌ | Nombre completo |
| `password_hash` | VARCHAR(255) | ❌ | Contraseña hasheada |
| `status` | VARCHAR(50) | ❌ | Estado: INVITED, ACTIVE, DEACTIVATED, SUSPENDED |
| `impersonating_clinic_id` | UUID | ✅ | ID de clínica que está suplantando (impersonation) |
| `impersonating_user_id` | UUID | ✅ | ID de usuario que está suplantando |
| `last_login_at` | TIMESTAMP | ✅ | Fecha del último login |
| `deactivated_at` | TIMESTAMP | ✅ | Fecha de desactivación |
| `invitation_token` | UUID | ✅ | Token para aceptar invitación |
| `invitation_token_expires_at` | TIMESTAMP | ✅ | Expiración del token de invitación |
| `password_reset_token` | UUID | ✅ | Token para resetear contraseña |
| `password_reset_token_expires_at` | TIMESTAMP | ✅ | Expiración del token de reset |
| `created_at` | TIMESTAMP | ❌ | Fecha de creación |
| `updated_at` | TIMESTAMP | ❌ | Fecha de actualización |

### Estados de PlatformUser

| Estado | Descripción |
|--------|------------|
| **INVITED** | Usuario invitado, pendiente de aceptar invitación |
| **ACTIVE** | Usuario activo con acceso completo |
| **DEACTIVATED** | Usuario inactivo, sin acceso |
| **SUSPENDED** | Usuario suspendido por seguridad |

### Características Especiales

#### Impersonation (Suplantación)
Permite a admins de soporte suplantarse como otro usuario para resolver problemas:
- `impersonating_clinic_id` - Clínica que está suplantando
- `impersonating_user_id` - Usuario que está suplantando
- Auditoría completa de acciones en modo suplantación

### Relaciones
- **PlatformRole** (M:N) - Puede tener múltiples roles de plataforma
- **AuditLog** (1:N) - Se registran todas sus acciones

### Índices
```sql
CREATE INDEX idx_platform_users_email ON platform_users(email);
```

---

## 🎭 Tabla 3: platform_roles (Roles de Plataforma)

### Descripción
Define roles con conjuntos específicos de permisos para usuarios de plataforma. Usa un sistema flexible de permisos basado en cadenas (strings).

### Estructura

| Columna | Tipo | Nullable | Descripción |
|---------|------|----------|-------------|
| `id` | UUID | ❌ | ID único del rol |
| `key` | VARCHAR(50) | ❌ | Identificador único del rol (ej: PLATFORM_SUPERADMIN) |
| `name` | VARCHAR(100) | ❌ | Nombre legible (ej: "Superadmin de Plataforma") |
| `description` | TEXT | ❌ | Descripción detallada del rol |
| `permissions` | TEXT[] (array) | ❌ | Array de permisos asociados |
| `is_active` | BOOLEAN | ❌ | Si el rol está activo |
| `is_immutable` | BOOLEAN | ❌ | Si el rol no puede ser modificado (sistema) |
| `created_at` | TIMESTAMP | ❌ | Fecha de creación |

### Roles Predefinidos del Sistema

#### 1. PLATFORM_SUPERADMIN
```json
{
  "key": "PLATFORM_SUPERADMIN",
  "name": "Superadmin de Plataforma",
  "description": "Acceso total a toda la plataforma",
  "is_immutable": true,
  "permissions": [
    "platform:users:read",
    "platform:users:create",
    "platform:users:update",
    "platform:users:delete",
    "platform:roles:read",
    "platform:roles:create",
    "platform:roles:update",
    "platform:roles:delete",
    "clinics:read",
    "clinics:update",
    "subscriptions:read",
    "subscriptions:update",
    "billing:read",
    "audit:read",
    "impersonation:use"
  ]
}
```

#### 2. PLATFORM_SUPPORT
```json
{
  "key": "PLATFORM_SUPPORT",
  "name": "Soporte de Plataforma",
  "description": "Acceso para resolver problemas de usuarios",
  "is_immutable": true,
  "permissions": [
    "platform:users:read",
    "platform:users:update",
    "clinics:read",
    "audit:read",
    "impersonation:use",
    "tickets:read",
    "tickets:update"
  ]
}
```

#### 3. PLATFORM_FINANCE
```json
{
  "key": "PLATFORM_FINANCE",
  "name": "Finanzas",
  "description": "Gestión de suscripciones y facturación",
  "is_immutable": true,
  "permissions": [
    "subscriptions:read",
    "subscriptions:update",
    "billing:read",
    "billing:update",
    "audit:read:transactions"
  ]
}
```

### Sistema de Permisos

Los permisos siguen la convención: `module:resource:action`

**Ejemplos de permisos:**
- `platform:users:read` - Leer usuarios de plataforma
- `platform:users:create` - Crear usuarios
- `platform:users:update` - Actualizar usuarios
- `platform:users:delete` - Eliminar usuarios
- `clinics:read` - Ver clínicas
- `clinics:update` - Actualizar clínicas
- `impersonation:use` - Usar suplantación
- `audit:read` - Ver logs de auditoría
- `subscriptions:read` - Ver suscripciones
- `subscriptions:update` - Actualizar suscripciones
- `billing:read` - Ver facturación

### Roles Customizables

Se pueden crear roles personalizados de acuerdo a necesidades específicas:
- Combinación flexible de permisos
- No inmutables (se pueden modificar)
- Pueden ser activados/desactivados

### Relaciones
- **PlatformUser** (M:N) - Múltiples usuarios pueden tener este rol
- Tabla de unión: `platform_user_roles`

---

## 📊 Tabla de Unión: platform_user_roles

### Descripción
Tabla de relación muchos-a-muchos entre `platform_users` y `platform_roles`.

### Estructura

| Columna | Tipo | Descripción |
|---------|------|------------|
| `user_id` | UUID | FK → platform_users.id |
| `role_id` | UUID | FK → platform_roles.id |

### Características
- Un usuario de plataforma puede tener múltiples roles
- Cada rol puede tener múltiples usuario

---

## 🔗 Diagrama de Relaciones

```
┌──────────────────┐
│   PlatformUser   │──────┐
│                  │      │
│  - email         │      │ (M:N)
│  - full_name     │      │
│  - status        │      │
│  - impersonation │      │
└──────────────────┘      │
                          │
                    ┌─────▼──────┐
                    │ PlatformRole │
                    │              │
                    │ - key        │
                    │ - name       │
                    │ - permissions│
                    │ - is_active  │
                    └──────────────┘


┌──────────────────┐
│  User (Clínica)  │
│                  │
│  - name          │
│  - email         │
│  - role          │
│  - status        │
└────────┬─────────┘
         │ N:1
         │
      ┌──▼──┐
      │Clinic│
      └──────┘
```

---

## 📋 Comparativa: User vs PlatformUser

| Aspecto | User | PlatformUser |
|--------|------|--------------|
| **Propósito** | Personal de clínicas | Admins de plataforma |
| **Scope** | Una clínica | Toda la plataforma |
| **Roles** | 3 fijos (superadmin, owner, staff) | N dinámicos con permisos |
| **Tabla de Roles** | Rol como string en tabla | Tabla separada de roles (M:N) |
| **Impersonation** | No | Sí |
| **Estados** | INVITED, ACTIVE, DEACTIVATED | INVITED, ACTIVE, DEACTIVATED, SUSPENDED |

---

## 🔐 Flujo de Autenticación

### Para Users (Clínica)

```
1. Invitación a usuario
   ↓
2. Email con invitation_token
   ↓
3. Usuario acepta e inicializa contraseña
   ↓
4. Status: ACTIVE
   ↓
5. Puede usar email + password para login
```

### Para PlatformUsers

```
1. Invitación a usuario de plataforma
   ↓
2. Email con invitation_token (magic link)
   ↓
3. Usuario acepta e crea contraseña
   ↓
4. Roles asignados
   ↓
5. Status: ACTIVE
   ↓
6. Sistema verifica permisos según roles
```

---

## 💾 Consultas Útiles

### Obtener usuarios activos de una clínica
```sql
SELECT id, name, email, role, status
FROM users
WHERE clinic_id = 'clinic_uuid'
  AND status = 'ACTIVE'
ORDER BY name;
```

### Obtener usuarios de plataforma con sus roles
```sql
SELECT 
  pu.id,
  pu.email,
  pu.full_name,
  pu.status,
  array_agg(pr.name) as roles
FROM platform_users pu
LEFT JOIN platform_user_roles pur ON pu.id = pur.user_id
LEFT JOIN platform_roles pr ON pur.role_id = pr.id
GROUP BY pu.id
ORDER BY pu.email;
```

### Obtener todos los permisos de un usuario de plataforma
```sql
SELECT DISTINCT unnest(pr.permissions) as permission
FROM platform_users pu
JOIN platform_user_roles pur ON pu.id = pur.user_id
JOIN platform_roles pr ON pur.role_id = pr.id
WHERE pu.id = 'user_uuid'
  AND pr.is_active = true;
```

### Verificar si un usuario tiene permiso específico
```sql
SELECT EXISTS(
  SELECT 1
  FROM platform_users pu
  JOIN platform_user_roles pur ON pu.id = pur.user_id
  JOIN platform_roles pr ON pur.role_id = pr.id
  WHERE pu.id = 'user_uuid'
    AND 'platform:users:read' = ANY(pr.permissions)
    AND pr.is_active = true
) as has_permission;
```

### Desactivar usuario de clínica
```sql
UPDATE users
SET status = 'DEACTIVATED',
    deactivated_at = NOW(),
    deactivated_by = 'admin_user_uuid'
WHERE id = 'user_uuid'
  AND clinic_id = 'clinic_uuid';
```

---

## 🔒 Seguridad y Tokens

### Tokens de Invitación
- **Validez**: Generalmente 7 días
- **Uso**: Invitar nuevos usuarios
- **Flujo**: Email → Token → Página de aceptación → Crear contraseña

### Tokens de Reset de Contraseña
- **Validez**: Generalmente 1 hora
- **Uso**: Reset de contraseña olvidada
- **Flujo**: Email → Token → Nueva contraseña

### Impersonation (PlatformUser)
- Solo usuarios con permiso `impersonation:use`
- Se auditan todas las acciones en modo suplantación
- Permite resolver problemas de usuarios

---

## 📝 Notas Importantes

1. **Datos Sensibles**: Todas las contraseñas se hashean y no se almacenan en texto plano

2. **Email Único**: Tanto `users` como `platform_users` tienen emails únicos

3. **Auditoría**: Todas las acciones de usuarios se registran en `audit_logs`

4. **Tokens con Expiración**: Los tokens de invitación y reset expiran automáticamente

5. **Roles Inmutables**: Los roles del sistema (con `is_immutable=true`) no pueden ser modificados ni eliminados

6. **User Status vs PlatformUser Status**: 
   - Users solo tienen 3 estados
   - PlatformUsers tienen 4 (incluye SUSPENDED para casos de seguridad)

7. **Escalabilidad de Permisos**: El sistema de permisos en array permite agregar nuevos permisos sin migración de datos

