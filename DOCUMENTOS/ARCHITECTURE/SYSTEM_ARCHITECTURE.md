# Arquitectura y Flujo del Sistema - VibraLive

## 1. Flujo de Autenticación

```
┌─────────────────────────────────────────────────────────────────┐
│                          USUARIOS                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Página Login    │
                    └──────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
    ┌──────────└─┐     ┌──────────┐     ┌──────────────────┐
    │ Credenciales│    │ Registro │    │ Recuperación Pass│
    │ Pre-rellenadas   │ o Login │    │ (Futuro)         │
    └──────────┬─┘     └──────────┘     └──────────────────┘
              │
              ▼
    ┌──────────────────────────────────┐
    │ POST /api/auth/login             │
    │ - Validar email + password       │
    │ - Hashear contraseña con bcrypt  │
    │ - Generar JWT token             │
    │ - Calcular permisos (roles-perm) │
    │ - Retornar user + permisos       │
    └──────────────────────────────────┘
              │
              ▼
    ┌──────────────────────────────────┐
    │ Frontend SavesAuth               │
    │ - localStorage.setItem('auth')   │
    │ - Zustand store update           │
    │ - Redirige por rol               │
    └──────────────────────────────────┘
              │
    ┌─────────┼─────────────┬─────────────┐
    │         │             │             │
    ▼         ▼             ▼             ▼
  Superadmin Owner        Staff        Error
  Dashboard  Dashboard    Dashboard    Page
```

## 2. Matriz de Permisos

```
                   SUPERADMIN        OWNER           STAFF
                   ──────────────    ─────────────   ──────────
Dashboard Admin    ✅                ❌              ❌
Clínicas           ✅ (CRUD)         ❌              ❌
Usuarios (all)     ✅ (CRUD)         ❌              ❌
Auditoría          ✅ (Read)         ❌              ❌
Config Sistema     ✅                ❌              ❌

Mi Clínica         ❌                ✅ (R/U)        ❌
Mis Clientes       ❌                ✅ (CRUD)       ✅ (Read)
Mis Mascotas       ❌                ✅ (CRUD)       ✅ (Read)
Mi Staff           ❌                ✅ (CRUD)       ❌
Mis Reportes       ❌                ✅ (Read)       ❌
Recordatorios      ❌                ❌              ✅ (CRUD)
```

## 3. Estructura de Carpetas - Frontend

```
src/
├── app/
│   ├── (auth)/                    ← Rutas públicas
│   │   ├── layout.tsx             ← Gradient background
│   │   ├── login/page.tsx         ← Formulario login
│   │   └── register/page.tsx      ← Formulario registro
│   │
│   ├── (protected)/               ← Rutas Protected
│   │   ├── layout.tsx             ← ProtectedRoute wrapper
│   │   │
│   │   ├── dashboard/page.tsx     ← Dashboard Superadmin
│   │   │
│   │   ├── admin/
│   │   │   ├── clinics/page.tsx   ← Tabla clínicas
│   │   │   └── users/page.tsx     ← Tabla usuarios
│   │   │
│   │   ├── clinic/
│   │   │   ├── dashboard/page.tsx ← Dashboard Owner
│   │   │   ├── clients/page.tsx   ← Clientes
│   │   │   ├── pets/page.tsx      ← Mascotas
│   │   │   └── users/page.tsx     ← Staff
│   │   │
│   │   └── staff/
│   │       └── dashboard/page.tsx ← Dashboard Staff
│   │
│   └── unauthorized/page.tsx      ← Error 403
│
├── components/
│   ├── PermissionGate.tsx         ← Renderizado condicional
│   ├── ProtectedRoute.tsx         ← Protección de rutas
│   ├── DynamicSidebar.tsx         ← Menú por rol
│   └── ProtectedPageLayout.tsx    ← Layout wrapper
│
├── hooks/
│   ├── useAuth.ts                 ← Hook autenticación
│   └── useFormValidation.ts       ← Hook validación
│
├── lib/
│   ├── api-client.ts              ← Axios + Interceptores
│   └── validations.ts             ← Esquemas Zod
│
├── store/
│   └── auth-store.ts              ← Zustand store
│
└── types/
    ├── index.ts                   ← User, etc.
    └── menu.ts                    ← Menu config
```

## 4. Estructura Datos - User

```javascript
{
  "id": "uuid",
  "name": "Super Admin",
  "email": "superAdmin@vibralive.com",
  "role": "superadmin",                    // ← Role define permisos
  "clinic_id": null,                       // ← null para superadmin
  "status": "ACTIVE",                      // ← ACTIVE | INACTIVE | DEACTIVATED
  
  // Generados por backend basado en rol
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

## 5. JWT Token Structure

```
Header: {
  "alg": "HS256",
  "typ": "JWT"
}

Payload: {
  "sub": "user-id",
  "email": "superAdmin@vibralive.com",
  "role": "superadmin",
  "iat": 1704067200,        // Issued At
  "exp": 1704153600         // Expires
}

Signature: HMACSHA256(
  base64UrlEncode(header) + "." +
  base64UrlEncode(payload),
  secret
)
```

## 6. Flujo de API Request

```
┌─────────────────────────────┐
│  Frontend Component         │
│  useAuth().hasPermission()  │
└──────────────┬──────────────┘
               │
               ▼
    ┌──────────────────────────────┐
    │ axios request                │
    │ GET /api/clinics             │
    └──────────────┬───────────────┘
                   │
                   ▼
    ┌──────────────────────────────┐
    │ Request Interceptor          │
    │ Agregar header:              │
    │ Authorization: Bearer <token>│
    └──────────────┬───────────────┘
                   │
                   ▼
    ┌──────────────────────────────┐
    │ Backend NestJS               │
    │ 1. Parse token (JWT)         │
    │ 2. Extract user info         │
    │ 3. Check role/permissions    │
    │ 4. Execute handler           │
    │ 5. Return data               │
    └──────────────┬───────────────┘
                   │
                   ▼
    ┌──────────────────────────────┐
    │ Response Interceptor         │
    │ - Si 200: retorna datos      │
    │ - Si 401: logout + redirige  │
    │ - Si 403: muestra toast      │
    │ - Si 404: nuestra toast      │
    │ - Si 5xx: nuestra error      │
    └──────────────┬───────────────┘
                   │
                   ▼
    ┌──────────────────────────────┐
    │ Frontend muestra datos       │
    │ o notificación de error      │
    └──────────────────────────────┘
```

## 7. Estado Global (Zustand Store)

```
auth-store.ts
├── State:
│   ├── user: User | null          ← Usuario actual
│   ├── token: string | null       ← JWT token
│   ├── isAuthenticated: boolean   ← ¿Está logueado?
│   ├── isLoading: boolean         ← ¿Cargando?
│   └── error: string | null       ← Mensaje de error
│
├── Core Actions:
│   ├── setUser(user)
│   ├── setToken(token)
│   ├── setLoading(loading)
│   ├── setError(error)
│   ├── login(email, pass)         ← Login
│   ├── register(data)             ← Registro
│   ├── logout()                   ← Logout
│   └── loadFromStorage()          ← Hidratar desde localStorage
│
└── Permission Methods:
    ├── hasPermission(perm)        ← ¿Tiene única permiso?
    ├── hasPermissions(perms)      ← ¿Tiene ALGUNO de los permisos?
    ├── hasAllPermissions(perms)   ← ¿Tiene TODOS los permisos?
    ├── hasFeature(feature)        ← ¿Tiene feature disponible?
    ├── hasRole(role)              ← ¿Es de cierto rol?
    └── canAccess(perms?, role?)   ← Check unificado
```

## 8. Componentes de Protección

### ProtectedRoute
```javascript
// Valida autenticación + permisos
<ProtectedRoute
  requiredPermissions={['clinics:create']}
  requiredRole="superadmin"
  fallback={<Spinner />}
>
  <YourComponent />
</ProtectedRoute>
```

### PermissionGate
```javascript
// Renderizado condicional dentro de comps
<PermissionGate require={{ permissions: ['users:delete'] }}>
  <button onClick={deleteUser}>Eliminar</button>
</PermissionGate>

// Si no tiene permiso, no se renderiza
```

### DynamicSidebar
```javascript
// Menu dinámico basado en rol
// Obtiene menu Array de: getMenuForRole(role)
// Renderiza links activos
// Muestra/oculta submenu
```

## 9. Flujo Completo: Login → Dashboard

```
1. Usuario ingresa email/password
   └─→ POST /api/auth/login

2. Backend valida credenciales
   └─→ Genera JWT token

3. Frontend recibe user + token
   └─→ auth-store.setUser(user)
   └─→ auth-store.setToken(token)
   └─→ localStorage.setItem('auth', {...})

4. Frontend redirige por rol
   ├─→ superadmin → /dashboard
   ├─→ owner → /clinic/dashboard
   └─→ staff → /staff/dashboard

5. Página de destino renderiza
   └─→ ProtectedRoute valida auth
   └─→ DynamicSidebar renderiza menú correcto
   └─→ PermissionGate muestra/oculta opciones
   └─→ Page muestra statsCards + acciones

6. Usuario navega por sidebar
   ├─→ Clicks hacen GET a /api/...
   ├─→ Request interceptor agrega token
   ├─→ Backend valida token + permisos
   ├─→ Response interceptor maneja errores
   └─→ Frontend muestra datos o errores
```

## 10. Mapeo de Rutas por Rol

```
SUPERADMIN:                 OWNER:                  STAFF:
──────────────             ─────────────           ──────────
/login                     /login                  /login
/register                  /register                /register

(protegido)               (protegido)              (protegido)

/dashboard ✅             /dashboard ❌            /dashboard ❌
/admin/clinics ✅         /admin/clinics ❌        /admin/clinics ❌
/admin/users ✅           /admin/users ❌          /admin/users ❌
                          
/clinic/dashboard ❌      /clinic/dashboard ✅     /clinic/dashboard ❌
/clinic/clients ❌        /clinic/clients ✅       /clinic/clients ❌*
/clinic/pets ❌           /clinic/pets ✅          /clinic/pets ❌*
/clinic/users ❌          /clinic/users ✅         /clinic/users ❌

/staff/dashboard ❌       /staff/dashboard ❌      /staff/dashboard ✅
/staff/clients ❌         /staff/clients ❌        /staff/clients ✅*

✅ = Acceso permitido
❌ = Acceso denegado (redirecciona a /unauthorized)
* = Acceso limitado (solo lectura)
```

## 11. Flujo de Datos - Ejemplo: Listar Clínicas

```
Frontend Component
       │
       ├─ useAuth() → { user, token, hasPermission }
       │
       └─ useEffect(() => {
            if (!hasPermission('clinics:*')) return;
            
            apiClient.get('/api/clinics')  ← Axios
          })
          │
          ├─ Request:
          │  GET /api/clinics
          │  Headers: { Authorization: Bearer ... }
          │
          ├─ Response Interceptor:
          │  if (status === 200) {
          │    setClinic(data)
          │  } else if (status === 401) {
          │    logout()
          │    redirect('/login')
          │  } else if (status === 403) {
          │    toast.error('No tienes permisos')
          │  }
          │
          └─ Renderiza:
             <table>
               {clinics.map(clinic => (
                 <tr key={clinic.id}>
                   <td>{clinic.name}</td>
                 </tr>
               ))}
             </table>
```

## 12. Tabla de Estados HTTP Manejados

```
200 OK            → Retorna datos, renderiza componente
201 Created       → Recurso creado, muestra toast success
400 Bad Request   → Validación fallida, toast error
401 Unauthorized  → Token inválido, logout + login redirect
403 Forbidden     → Sin permisos, redirect /unauthorized
404 Not Found     → Recurso no existe, toast error
409 Conflict      → Recurso duplicado, toast error
500 Server Error  → Error en backend, toast error
```

---

## 📊 Diagrama Simplificado

```
                      USUARIO
                        │
            ┌───────────┴───────────┐
            │                       │
         Login                  Register
            │                       │
            └───────────┬───────────┘
                        │
                    ✓ Auth
                        │
            ┌───────────┴───────────┬──────────────┐
            │                       │              │
       Superadmin               Owner            Staff
            │                       │              │
       /dashboard           /clinic/dashboard  /staff/dash
            │                       │              │
     ┌──────┼──────┬──────┐   ┌─────┼─────┐      │
     │      │      │      │   │     │     │      │
  Clinics Users Audit Settings Clients Pets  Reminders
     │      │      │      │   │     │     │      │
   CRUD   CRUD   Read   Update CRUD CRUD Read/Write
```

---

## ✅ Checklist de Implementación

- [x] Backend: User entity con roles
- [x] Backend: JWT autenticación
- [x] Backend: roles-permissions sistema
- [x] Backend: Guards de autorización
- [x] Frontend: Type definitions
- [x] Frontend: Zustand store
- [x] Frontend: useAuth hook
- [x] Frontend: API client con interceptores
- [x] Frontend: ProtectedRoute componente
- [x] Frontend: PermissionGate componente
- [x] Frontend: DynamicSidebar componente
- [x] Frontend: Auth pages (login, register)
- [x] Frontend: Protected layouts
- [x] Frontend: Dashboard pages
- [x] Frontend: Admin pages
- [x] Frontend: Clinic pages
- [x] Frontend: Staff pages
- [x] Frontend: Error page 403
- [ ] Frontend: 404, 500 pages (próximo paso)
- [ ] Backend: Email verification (próximo paso)
- [ ] Backend: Password recovery (próximo paso)
- [ ] Testing: Unit tests
- [ ] Testing: E2E tests

---

## 🚀 Próximos Pasos

1. **Integración Real de BD:**
   - Conectar GET /api/clinics a BD real
   - Conectar GET /api/clients a BD real
   - Implementar POST/PUT/DELETE endpoints

2. **Formularios Avanzados:**
   - Crear modal de creación de clínica
   - Crear modal de creación de usuario
   - Crear modal de edición

3. **Funcionalidades:**
   - Recordatorios automáticos
   - Reportes PDF
   - Búsqueda y filtros
   - Paginación

4. **Mejoras de UX:**
   - Loading skeletons
   - Confirmación de eliminación
   - Notificaciones en tiempo real
   - Avatar de usuario

5. **Testing:**
   - Unit tests para components
   - Integration tests para API
   - E2E tests con Cypress
