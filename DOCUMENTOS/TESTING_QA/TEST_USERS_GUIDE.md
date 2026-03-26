# Usuarios de Prueba - VibraLive

Este documento contiene ejemplos de usuarios que puedes usar para probar el sistema con diferentes roles y permisos.

## Usuario Superadmin (Pre-creado)

```json
{
  "id": "uuid-superadmin",
  "name": "Super Admin",
  "email": "superAdmin@vibralive.com",
  "password": "admin@1234",
  "password_hash": "$2b$10$...", // bcrypt hash
  "role": "superadmin",
  "clinic_id": null,
  "status": "ACTIVE",
  "permissions": [
    "clinics:*",
    "users:*",
    "audit:*",
    "dashboard:admin"
  ],
  "available_features": [
    "clinics",
    "users",
    "audit",
    "dashboard"
  ],
  "available_menu": [
    "dashboard",
    "clinics",
    "users",
    "audit",
    "settings"
  ]
}
```

**Uso:**
- Email: `superAdmin@vibralive.com`
- Password: `admin@1234`

---

## Usuario Owner (Crear vía Registro)

Puedes crear este usuario a través del formulario de registro en `/register`:

```json
{
  "id": "uuid-owner-1",
  "name": "Dr. Juan García",
  "email": "juan.garcia@clinica.com",
  "password": "Clínica@123",
  "role": "owner",
  "clinic_id": "clinic-uuid-1",
  "status": "ACTIVE",
  "permissions": [
    "clinic:manage",
    "clients:*",
    "pets:*",
    "users:*",
    "reports:*"
  ],
  "available_features": [
    "clinic",
    "clients",
    "pets",
    "users",
    "reports"
  ],
  "available_menu": [
    "dashboard",
    "clients",
    "pets",
    "users",
    "reports",
    "clinic_settings"
  ]
}
```

**Pasos para crear:**
1. Visita `http://localhost:3000/register`
2. Completa con:
   - Nombre Clínica: `Mi Clínica Veterinaria`
   - Teléfono: `+34912345678`
   - Ciudad: `Madrid`
   - Nombre Propietario: `Dr. Juan García`
   - Email: `juan.garcia@clinica.com`
   - Password: `Clínica@123`
   - Confirm Password: `Clínica@123`
3. Haz clic en "Registrar Clínica"

**Resultado:**
- Nueva clínica creada
- Nuevo usuario creado con rol `owner`
- Login automático y redirección a `/clinic/dashboard`

---

## Usuario Staff (Crear manualmente en BD)

Para crear un usuario staff, necesitas:
1. Una clínica existente (creada por owner)
2. Insertar directamente en BD o crear endpoint

Ejemplo de datos:

```json
{
  "id": "uuid-staff-1",
  "name": "Enfermera María Silva",
  "email": "maria.silva@clinica.com",
  "password": "Staff@2024",
  "password_hash": "$2b$10$...", // bcrypt hash
  "role": "staff",
  "clinic_id": "clinic-uuid-1",
  "status": "ACTIVE",
  "permissions": [
    "clients:*",
    "pets:*",
    "reminders:*"
  ],
  "available_features": [
    "clients",
    "pets",
    "reminders"
  ],
  "available_menu": [
    "dashboard",
    "clients",
    "pets",
    "reminders"
  ]
}
```

**SQL para insertar (PostgreSQL):**
```sql
INSERT INTO "user" (
  id, 
  name, 
  email, 
  password, 
  role, 
  clinic_id,
  status,
  created_at,
  updated_at
)
VALUES (
  gen_random_uuid(),
  'Enfermera María Silva',
  'maria.silva@clinica.com',
  '$2b$10$OJ0ZBRnzvgPPCATZL/PjpO.BW5n3iyZy5qJ5cKNzYC3jRxEKVVOJm', -- password: Staff@2024
  'staff',
  'clinic-uuid-1',
  'ACTIVE',
  NOW(),
  NOW()
);
```

---

## Matriz de Permisos por Rol

### SUPERADMIN
- Gestión completa del sistema
- Ver todas las clínicas
- Gestionar todos los usuarios
- Ver auditoría
- Acceso a dashboard administrativo

| Recurso | CREATE | READ | UPDATE | DELETE |
|---------|--------|------|--------|--------|
| Clínicas | ✅ | ✅ | ✅ | ✅ |
| Usuarios | ✅ | ✅ | ✅ | ✅ |
| Auditoría | ❌ | ✅ | ❌ | ❌ |
| Configuración | ✅ | ✅ | ✅ | ❌ |

### OWNER
- Gestión de su clínica y staff
- Visualizar clientes y mascotas
- Generar reportes
- NO puede gestionar otras clínicas

| Recurso | CREATE | READ | UPDATE | DELETE |
|---------|--------|------|--------|--------|
| Clínica Propia | ❌ | ✅ | ✅ | ❌ |
| Clientes Propios | ✅ | ✅ | ✅ | ✅ |
| Mascotas Propias | ✅ | ✅ | ✅ | ✅ |
| Staff Propio | ✅ | ✅ | ✅ | ✅ |
| Reportes | ❌ | ✅ | ❌ | ❌ |
| Otras Clínicas | ❌ | ❌ | ❌ | ❌ |

### STAFF
- Acceso limitado a clientes y mascotas
- Crear y enviar recordatorios
- Ver dashboard personal
- NO puede gestionar usuarios ni clínica

| Recurso | CREATE | READ | UPDATE | DELETE |
|---------|--------|------|--------|--------|
| Clientes | ❌ | ✅ | ❌ | ❌ |
| Mascotas | ❌ | ✅ | ❌ | ❌ |
| Recordatorios | ✅ | ✅ | ✅ | ✅ |
| Reportes | ❌ | ❌ | ❌ | ❌ |
| Staff/Usuarios | ❌ | ❌ | ❌ | ❌ |

---

## Ejemplo de URL por Rol

### SUPERADMIN
```
GET  http://localhost:3000/dashboard                    → Dashboard de sistema
GET  http://localhost:3000/admin/clinics                → Listar clínicas
GET  http://localhost:3000/admin/users                  → Listar usuarios
GET  http://localhost:3000/admin/audit                  → Auditoría
```

### OWNER
```
GET  http://localhost:3000/clinic/dashboard             → Dashboard de clínica
GET  http://localhost:3000/clinic/clients               → Clientes de su clínica
GET  http://localhost:3000/clinic/pets                  → Mascotas de su clínica
GET  http://localhost:3000/clinic/users                 → Staff de su clínica
GET  http://localhost:3000/clinic/reports               → Reportes de su clínica
```

### STAFF
```
GET  http://localhost:3000/staff/dashboard              → Mi dashboard
GET  http://localhost:3000/staff/clients                → Clientes asignados
GET  http://localhost:3000/staff/pets                   → Mascotas asignadas
GET  http://localhost:3000/staff/reminders              → Mis recordatorios
```

---

## Endpoints de API por Rol

### Disponibles para SUPERADMIN
```
GET    /api/clinics                          (Listar todas)
POST   /api/clinics                          (Crear)
GET    /api/clinics/{id}                     (Detalle)
PUT    /api/clinics/{id}                     (Editar)
DELETE /api/clinics/{id}                     (Eliminar)

GET    /api/users                            (Listar todos)
POST   /api/users                            (Crear)
GET    /api/users/{id}                       (Detalle)
PUT    /api/users/{id}                       (Editar)
DELETE /api/users/{id}                       (Eliminar)

GET    /api/audit-logs                       (Listar auditoría)
```

### Disponibles para OWNER
```
GET    /api/clinics/{my-clinic-id}           (Mi clínica)
PUT    /api/clinics/{my-clinic-id}           (Editar mi clínica)

GET    /api/clients                          (Mis clientes)
POST   /api/clients                          (Crear cliente)
GET    /api/clients/{id}                     (Detalle cliente)
PUT    /api/clients/{id}                     (Editar cliente)
DELETE /api/clients/{id}                     (Eliminar cliente)

GET    /api/pets                             (Mis mascotas)
POST   /api/pets                             (Crear mascota)
PUT    /api/pets/{id}                        (Editar mascota)
DELETE /api/pets/{id}                        (Eliminar mascota)

GET    /api/users                            (Mi staff)
POST   /api/users                            (Invitar staff)
PUT    /api/users/{id}                       (Editar staff)
DELETE /api/users/{id}                       (Eliminar staff)

GET    /api/reports                          (Mis reportes)
```

### Disponibles para STAFF
```
GET    /api/clients                          (Mis clientes)
GET    /api/clients/{id}                     (Detalle cliente)

GET    /api/pets                             (Mis mascotas)
GET    /api/pets/{id}                        (Detalle mascota)

POST   /api/reminders                        (Crear recordatorio)
GET    /api/reminders                        (Mis recordatorios)
PUT    /api/reminders/{id}                   (Editar recordatorio)
DELETE /api/reminders/{id}                   (Eliminar recordatorio)
```

---

## Script para Crear Usuarios de Prueba (SQL)

Si necesitas crear los usuarios directamente en la BD:

```sql
-- Asumir que la clínica ya está creada con ID: 'clinic-uuid-1'

-- Usuario: Juan García (Owner)
INSERT INTO "user" (id, name, email, password, role, clinic_id, status, created_at, updated_at)
VALUES (
  'owner-juan-uuid',
  'Dr. Juan García',
  'juan.garcia@clinica.com',
  '$2b$10$OJ0ZBRnzvgPPCATZL/PjpO.BW5n3iyZy5qJ5cKNzYC3jRxEKVVOJm', -- password: Clínica@123
  'owner',
  'clinic-uuid-1',
  'ACTIVE',
  NOW(),
  NOW()
);

-- Usuario: María Silva (Staff)
INSERT INTO "user" (id, name, email, password, role, clinic_id, status, created_at, updated_at)
VALUES (
  'staff-maria-uuid',
  'Enfermera María Silva',
  'maria.silva@clinica.com',
  '$2b$10$OJ0ZBRnzvgPPCATZL/PjpO.BW5n3iyZy5qJ5cKNzYC3jRxEKVVOJm', -- password: Staff@2024
  'staff',
  'clinic-uuid-1',
  'ACTIVE',
  NOW(),
  NOW()
);

-- Usuario: Pedro López (Staff)
INSERT INTO "user" (id, name, email, password, role, clinic_id, status, created_at, updated_at)
VALUES (
  'staff-pedro-uuid',
  'Veterinario Pedro López',
  'pedro.lopez@clinica.com',
  '$2b$10$OJ0ZBRnzvgPPCATZL/PjpO.BW5n3iyZy5qJ5cKNzYC3jRxEKVVOJm', -- password: Clinic@456
  'staff',
  'clinic-uuid-1',
  'ACTIVE',
  NOW(),
  NOW()
);
```

**Passwords para los SQL users:**
- Juan García: `Clínica@123`
- María Silva: `Staff@2024`
- Pedro López: `Clinic@456`

---

## Cómo Generar bcrypt Hash en JavaScript/NodeJS

```javascript
const bcrypt = require('bcrypt');

const password = 'Clínica@123';
const hash = bcrypt.hashSync(password, 10);
console.log(hash);
```

---

## Checklist de Prueba

- [ ] Login con superAdmin@vibralive.com
- [ ] Ver dashboard de superadmin
- [ ] Acceder a /admin/clinics
- [ ] Acceder a /admin/users
- [ ] Crear nueva clínica (Owner)
- [ ] Login con owner recién creado
- [ ] Ver dashboard de owner
- [ ] Acceder a /clinic/clients
- [ ] Acceder a /clinic/pets
- [ ] Ver que /admin/clinics está bloqueado para owner
- [ ] Logout correctamente
- [ ] Intento de acceso sin auth → redirige a login
- [ ] Toast de error con credenciales inválidas

---

## Notas Importantes

1. **Passwords en Producción:**
   - Nunca compartas contraseñas en plain text
   - Usa variables de entorno para credenciales
   - Usa bcrypt para hashear passwords

2. **Datos Sensibles:**
   - Los IDs de usuarios/clínicas son UUIDs
   - Los tokens JWT expiran (configurado en backend)
   - Usa HTTPS en producción

3. **Testing:**
   - Usa estas credenciales solo en desarrollo
   - En producción, configura usuarios reales
   - Implementa registro seguro con email verification

---

## Soporte

Si tienes problemas al probar:
1. Verifica que el backend está corriendo en puerto 3001
2. Verifica que el frontend está corriendo en puerto 3000
3. Revisa logs del backend
4. Abre Console en navegador (F12)
5. Comprueba Network en Developer Tools
