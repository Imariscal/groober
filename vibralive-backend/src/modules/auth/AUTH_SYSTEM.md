# Sistema Centralizado de Autenticación

## Descripción

El sistema de autenticación está centralizado en el módulo `AuthModule` utilizando la entity `User`. El sistema utiliza roles y permisos para controlar el acceso a diferentes funcionalidades.

## Roles Disponibles

### 1. **SuperAdmin** (`superadmin`)
- Control total de la plataforma
- Puede crear, editar, eliminar y suspender clínicas
- Puede gestionar usuarios en todas las clínicas
- Acceso a logs de auditoría
- **Credenciales por defecto:**
  - Email: `superAdmin@vibralive.com`
  - Password: `admin@1234`

### 2. **Owner** (`owner`)
- Administrador de una clínica específica
- Puede gestionar usuarios dentro de su clínica
- Puede manejar clientes y mascotas
- Acceso a reportes de su clínica
- **Creado al registrarse** - nuevo propietario crea su clínica y se asigna automáticamente como `owner`

### 3. **Staff** (`staff`)
- Personal de la clínica
- Puede ver y crear clientes
- Puede ver y manejar mascotas
- Puede crear y ver recordatorios
- Acceso limitado a funcionalidades básicas

## Endpoints de Autenticación

### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "superAdmin@vibralive.com",
  "password": "admin@1234"
}

Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "clinic_id": null,
    "email": "superAdmin@vibralive.com",
    "name": "Super Administrator",
    "role": "superadmin",
    "status": "ACTIVE",
    "permissions": [
      "clinics:create",
      "clinics:read",
      "clinics:update",
      ...
    ],
    "available_features": [
      "clinics-management",
      "users-management",
      "audit-logs",
      "platform-settings",
      "dashboard-admin"
    ],
    "available_menu": [
      "dashboard",
      "clinics",
      "users",
      "audit",
      "settings"
    ]
  }
}
```

### Register (Crear clínica y propietario)
```
POST /api/auth/register
Content-Type: application/json

{
  "clinic_name": "Mi Clínica Veterinaria",
  "clinic_phone": "+525512345678",
  "city": "Mexico City",
  "owner_name": "Juan Pérez",
  "owner_email": "juan@example.com",
  "password": "SecurePass123!"
}
```

### Get Current User Profile
```
GET /api/auth/me
Authorization: Bearer {access_token}

Response:
{
  "user": {
    "id": "uuid",
    "clinic_id": "uuid",
    "email": "owner@example.com",
    "name": "Juan Pérez",
    "role": "owner",
    "status": "ACTIVE",
    "phone": "+525512345678",
    "permissions": [
      "clinic:manage",
      "users:create",
      "users:read",
      ...
    ],
    "available_features": [
      "clients-management",
      "pets-management",
      "users-management",
      "clinic-settings",
      "dashboard-clinic",
      "reports"
    ],
    "available_menu": [
      "dashboard",
      "clients",
      "pets",
      "users",
      "reports",
      "clinic-settings"
    ]
  },
  "timestamp": "2026-02-24T10:30:00.000Z"
}
```

## Estructura de Permisos

Los permisos están organizados por módulos:

- **clinics:** `create`, `read`, `update`, `delete`, `suspend`, `activate`
- **users:** `create`, `read`, `update`, `delete`, `impersonate`
- **clients:** `create`, `read`, `update`, `delete`
- **pets:** `create`, `read`, `update`, `delete`
- **reminders:** `create`, `read`, `update`
- **audit:** `read`
- **reports:** `view`
- **dashboard:** `admin`, `clinic`, `staff`

## Usando Guards y Decoradores en Controladores

### 1. Usar `AuthGuard` para proteger endpoints

```typescript
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '@/common/guards/auth.guard';

@Get('clinics')
@UseGuards(AuthGuard)
async getClinic(@CurrentUser() user: User) {
  return { clinic_id: user.clinic_id };
}
```

### 2. Usar `PermissionGuard` para requerir permisos específicos

```typescript
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '@/common/guards/auth.guard';
import { PermissionGuard } from '@/modules/auth/guards/permission.guard';
import { RequirePermission } from '@/modules/auth/decorators/permission.decorator';

@Post('clinics')
@UseGuards(AuthGuard, PermissionGuard)
@RequirePermission('clinics:create')
async createClinic(@Body() dto: CreateClinicDto) {
  // Solo usuarios con permiso 'clinics:create' pueden acceder
  return this.clinicsService.create(dto);
}
```

### 3. Requerir múltiples permisos (OR logic - al menos uno)

```typescript
@Patch('clinics/:id')
@UseGuards(AuthGuard, PermissionGuard)
@RequirePermission('clinics:update', 'clinic:manage')
async updateClinic(@Param('id') id: string) {
  // El usuario debe tener 'clinics:update' O 'clinic:manage'
  return this.clinicsService.update(id);
}
```

### 4. Usar `RequireRole` para requerir un rol específico

```typescript
import { RequireRole } from '@/modules/auth/decorators/permission.decorator';

@Get('admin-dashboard')
@UseGuards(AuthGuard)
@RequireRole('superadmin')
async getAdminDashboard() {
  // Solo superadmin puede acceder
  return { data: 'admin' };
}
```

## Flujo en el Frontend

### 1. Login

```typescript
// Login
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'superAdmin@vibralive.com',
    password: 'admin@1234'
  })
});

const data = await response.json();
localStorage.setItem('access_token', data.access_token);
localStorage.setItem('user', JSON.stringify(data.user));
```

### 2. Renderizar menú basado en `available_menu`

```typescript
const user = JSON.parse(localStorage.getItem('user'));

const menuItems = {
  dashboard: <Dashboard />,
  clinics: <ClinicsManagement />,
  users: <UsersManagement />,
  clients: <ClientsManagement />,
  pets: <PetsManagement />,
  // ...
};

return (
  <Sidebar>
    {user.available_menu.map(menuKey => menuItems[menuKey])}
  </Sidebar>
);
```

### 3. Mostrar/Ocultar funcionalidades basado en `available_features`

```typescript
const user = JSON.parse(localStorage.getItem('user'));
const hasClinicManagement = user.available_features.includes('clinics-management');

return (
  <div>
    {hasClinicManagement && <CreateClinicButton />}
  </div>
);
```

### 4. Verificar permisos específicos

```typescript
const user = JSON.parse(localStorage.getItem('user'));
const canCreateUsers = user.permissions.includes('users:create');
const canDeleteUsers = user.permissions.includes('users:delete');

return (
  <UserList>
    {users.map(user => (
      <div>
        {user.name}
        {canDeleteUsers && <DeleteButton />}
      </div>
    ))}
  </UserList>
);
```

## Seguridad

### JWT Token:
- Se genera al login
- Contiene: `sub` (user id), `email`, `clinic_id`, `role`, `permissions`
- Se envía en el header: `Authorization: Bearer {token}`
- Se valida en cada request protegido por `AuthGuard`

### Validación en Backend:
- El `AuthGuard` verifica que el token sea válido
- El `PermissionGuard` verifica que el usuario tenga los permisos requeridos
- Cada endpoint puede requerir permisos específicos

## Permisos por Rol (Resumen)

Ver `src/modules/auth/constants/roles-permissions.const.ts` para la lista completa.

### SuperAdmin
- Acceso total a clinics, users, audit
- Puede impersonar usuarios
- Dashboard administrativo

### Owner
- Administración de su clínica
- Gestión de usuarios dentro de su clínica
- Gestión de clientes y mascotas
- Reportes de su clínica

### Staff
- Vista de clientes (puede crear)
- Gestión de mascotas
- Recordatorios
- Dashboard limitado
