# 🏗️ ARQUITECTURA FRONTEND - GUÍA COMPLETA

## 📋 Estructura Implementada

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Rutas públicas
│   │   ├── login/
│   │   ├── register/
│   │   └── layout.tsx
│   ├── (protected)/              # Rutas protegidas
│   │   ├── dashboard/            # SuperAdmin
│   │   ├── admin/                # Admin routes
│   │   ├── clinic/               # Owner routes
│   │   ├── staff/                # Staff routes
│   │   └── layout.tsx
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── PermissionGate.tsx        # ✨ NEW - Componente condicional
│   ├── ProtectedRoute.tsx        # ✨ NEW - Protección de rutas
│   ├── DynamicSidebar.tsx        # ✨ NEW - Menú dinámico
│   ├── ProtectedPageLayout.tsx   # ✨ NEW - Layout protegido
│   ├── DashboardHeader.tsx       # Existente
│   ├── LoginForm.tsx             # Existente
│   ├── RegisterForm.tsx          # Existente
│   └── Providers.tsx             # Existente
├── hooks/
│   ├── useAuth.ts                # ✨ MEJORA - Versión mejorada
│   ├── useFormValidation.ts      # Existente
│   └── usePermissions.ts         # (Exportado desde PermissionGate)
├── lib/
│   └── api-client.ts             # API client con axios
├── store/
│   └── auth-store.ts             # ✨ MEJORA - Con métodos de permisos
├── types/
│   ├── index.ts                  # ✨ MEJORA - User con permisos
│   └── menu.ts                   # ✨ NEW - Tipos de menú
└── middleware.ts                 # (Opcional - para verificar auth)
```

---

## 🎨 COMPONENTES PRINCIPALES

### 1. **PermissionGate** (✨ NEW)

Wrapper condicional que renderiza contenido solo si el usuario tiene permisos.

```tsx
// USO 1: Requiere UNO de los permisos
<PermissionGate require={{ permissions: ['clinics:create', 'clinic:manage'] }}>
  <CreateClinicButton />
</PermissionGate>

// USO 2: Requiere TODOS los permisos
<PermissionGate require={{ allPermissions: ['users:create', 'users:delete'] }}>
  <AdminPanel />
</PermissionGate>

// USO 3: Requiere feature específico
<PermissionGate require={{ feature: 'clinics-management' }}>
  <ClinicsManager />
</PermissionGate>

// USO 4: Requiere rol
<PermissionGate require={{ role: 'superadmin' }}>
  <AdminDashboard />
</PermissionGate>

// USO 5: Con fallback
<PermissionGate 
  require={{ role: 'superadmin' }}
  fallback={<p>No tienes acceso a esta sección</p>}
>
  <AdminPanel />
</PermissionGate>
```

### 2. **ProtectedRoute** (✨ NEW)

Protege rutas completamente. Redirige si no está autenticado o sin permisos.

```tsx
// En el layout de rutas protegidas
export default function ProtectedLayout({ children }) {
  return (
    <ProtectedRoute requiredPermissions={['clinics:read']}>
      <ProtectedPageLayout>
        {children}
      </ProtectedPageLayout>
    </ProtectedRoute>
  );
}

// Con validación de rol
<ProtectedRoute requiredRole="superadmin">
  <AdminDashboard />
</ProtectedRoute>

// Con validación de feature
<ProtectedRoute requiredFeature="clinics-management">
  <ClinicsModule />
</ProtectedRoute>
```

### 3. **DynamicSidebar** (✨ NEW)

Menú lateral que se adapta dinámicamente al rol del usuario.

```tsx
// En el layout principal
import { DynamicSidebar } from '@/components/DynamicSidebar';

export default function Layout({ children }) {
  return (
    <div className="flex">
      <DynamicSidebar />
      <main>{children}</main>
    </div>
  );
}
```

**Características:**
- ✅ Menú dinámico según rol
- ✅ Responsive (mobile + desktop)
- ✅ Indicador activo
- ✅ Submenús colapsables
- ✅ Botón logout
- ✅ Información del usuario

### 4. **ProtectedPageLayout** (✨ NEW)

Layout completo para páginas protegidas (header + sidebar).

```tsx
import { ProtectedPageLayout } from '@/components/ProtectedPageLayout';

export default function Page() {
  return (
    <ProtectedPageLayout title="Gestión de Clínicas">
      <div>Tu contenido aquí</div>
    </ProtectedPageLayout>
  );
}
```

---

## 🔐 SISTEMA DE AUTENTICACIÓN

### Store (Zustand)

```typescript
import { useAuthStore } from '@/store/auth-store';

const auth = useAuthStore();

// State
auth.user              // User | null
auth.isAuthenticated   // boolean
auth.token             // string | null
auth.isLoading         // boolean
auth.error             // string | null

// Actions
auth.setUser(user)
auth.setToken(token)
auth.logout()
auth.loadFromStorage()

// Permission checks
auth.hasPermission('clinics:create')           // boolean
auth.hasPermissions(['clinics:create', ...])   // OR logic - any
auth.hasAllPermissions([...])                  // AND logic - all
auth.hasFeature('clinics-management')          // boolean
auth.hasRole('superadmin')                     // boolean
auth.canAccess(['clinics:read'], 'owner')      // boolean
```

### Hook useAuth

```typescript
import { useAuth } from '@/hooks/useAuth';

const auth = useAuth();

// State
auth.user              // User con permisos incluidos
auth.token             // JWT token
auth.isAuthenticated   // boolean
auth.isLoading         // boolean (incluye initial load)
auth.error             // string | null

// Actions
await auth.login(email, password)
await auth.register(clinicName, clinicPhone, city, ...)
auth.logout()
await auth.refreshUser()

// Permission checks
auth.hasPermission(perm)
auth.hasPermissions([...])
auth.hasAllPermissions([...])
auth.hasFeature(feature)
auth.hasRole(role)
auth.canAccess(perms, role)
```

---

## 📄 ESTRUCTURA DE RUTAS

### Rutas Públicas

```
/login                 # Login page
/register              # Register page
/                      # Home
```

### Rutas Protegidas - SuperAdmin

```
/dashboard             # Overview
/admin/clinics         # Listar clínicas
/admin/clinics/new     # Crear clínica
/admin/clinics/:id     # Ver/editar clínica
/admin/users           # Gestión usuarios
/admin/users/new
/admin/users/:id
/admin/audit           # Audit logs
/admin/settings        # Platform settings
```

### Rutas Protegidas - Owner

```
/clinic/dashboard      # Dashboard de clínica
/clinic/clients        # Clientes
/clinic/clients/new
/clinic/pets           # Mascotas
/clinic/users          # Mi equipo
/clinic/reports        # Reportes
/clinic/settings       # Config clínica
```

### Rutas Protegidas - Staff

```
/staff/dashboard       # Mi espacio
/staff/clients         # Clientes (visión limitada)
/staff/pets            # Mascotas
/staff/reminders       # Recordatorios
```

---

## 💻 EJEMPLOS DE IMPLEMENTACIÓN

### Ejemplo 1: Página Protegida - Dashboard SuperAdmin

```tsx
// app/(protected)/dashboard/page.tsx
'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ProtectedPageLayout } from '@/components/ProtectedPageLayout';
import { PermissionGate } from '@/components/PermissionGate';

export default function Dashboard() {
  return (
    <ProtectedRoute requiredRole="superadmin">
      <ProtectedPageLayout title="Dashboard Administrativo">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Estadísticas */}
          <StatsCard title="Total Clínicas" value="150" />
          <StatsCard title="Usuarios Activos" value="5000" />
          <StatsCard title="Suscripciones" value="120" />
        </div>

        {/* Solo si tiene permiso */}
        <PermissionGate require={{ permissions: ['audit:read'] }}>
          <AuditLogsSection />
        </PermissionGate>
      </ProtectedPageLayout>
    </ProtectedRoute>
  );
}
```

### Ejemplo 2: Lista con Acciones Condicionales

```tsx
'use client';

import { useAuth } from '@/hooks/useAuth';
import { PermissionGate } from '@/components/PermissionGate';

export function ClinicsList({ clinics }) {
  const auth = useAuth();

  return (
    <table>
      <tbody>
        {clinics.map(clinic => (
          <tr key={clinic.id}>
            <td>{clinic.name}</td>
            <td>{clinic.status}</td>
            <td>
              <div className="space-x-2">
                {/* Edit button */}
                <PermissionGate require={{ permissions: ['clinics:update', 'clinic:manage'] }}>
                  <EditButton clinic={clinic} />
                </PermissionGate>

                {/* Delete button - solo SuperAdmin */}
                <PermissionGate require={{ permissions: ['clinics:delete'] }}>
                  <DeleteButton clinic={clinic} />
                </PermissionGate>

                {/* Suspend button */}
                <PermissionGate require={{ permissions: ['clinics:suspend'] }}>
                  <SuspendButton clinic={clinic} />
                </PermissionGate>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### Ejemplo 3: Formulario Login

```tsx
'use client';

import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error } = useAuth();
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      // Redirect es automático en el hook
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Contraseña"
        required
      />
      {error && <p className="text-red-500">{error}</p>}
      <button disabled={isLoading}>
        {isLoading ? 'Cargando...' : 'Iniciar Sesión'}
      </button>
    </form>
  );
}
```

### Ejemplo 4: Component Condicional por Rol

```tsx
'use client';

import { useAuth } from '@/hooks/useAuth';
import { PermissionGate } from '@/components/PermissionGate';

export function AdminPanel() {
  const { user } = useAuth();

  return (
    <div>
      {/* Solo SuperAdmin ve este section */}
      <PermissionGate require={{ role: 'superadmin' }}>
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <h3>Panel Administrativo</h3>
          <p>Control total del sistema</p>
        </div>
      </PermissionGate>

      {/* Owners ven esto */}
      <PermissionGate require={{ role: 'owner' }}>
        <div className="p-4 bg-blue-50 border border-blue-200 rounded">
          <h3>Panel de Clínica</h3>
          <p>Administra tu clínica</p>
        </div>
      </PermissionGate>

      {/* Staff ve esto */}
      <PermissionGate require={{ role: 'staff' }}>
        <div className="p-4 bg-green-50 border border-green-200 rounded">
          <h3>Mi Espacio</h3>
          <p>Gestiona clientes y mascotas</p>
        </div>
      </PermissionGate>
    </div>
  );
}
```

---

## 🚀 FLUJO COMPLETO

```
1. Usuario visita /login
   ↓
2. Frontend carga useAuth hook
   - Intenta cargar user y token de localStorage
   - Si existen → isInitialized = true
   - Sino → redirige a login
   ↓
3. Usuario ingresa credenciales
   - LoginForm → useAuth.login(email, password)
   - POST /api/auth/login
   ↓
4. Backend retorna:
   {
     access_token: "jwt...",
     user: {
       id, name, email, role,
       permissions: [...],
       available_features: [...],
       available_menu: [...]
     }
   }
   ↓
5. Frontend:
   - Guarda en localStorage (user + token)
   - Actualiza useAuthStore
   - Redirige según rol:
     * superadmin → /dashboard
     * owner → /clinic/dashboard
     * staff → /staff/dashboard
   ↓
6. Layout se monta:
   - ProtectedRoute valida token
   - DynamicSidebar se renderiza
   - getMenuForRole(user.role) → menú dinámico
   ↓
7. En páginas:
   - PermissionGate controla qué ve
   - useAuth para validaciones lógicas
   - DynamicSidebar marca item activo
   ↓
8. Si navega a ruta sin permisos:
   - ProtectedRoute redirige a /unauthorized
   ↓
9. Logout:
   - removeItem localStorage
   - authStore.logout()
   - redirige a /login
```

---

## ⚙️ CONFIGURACIÓN NECESARIA

### 1. Actualizar API Client

```typescript
// lib/api-client.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
});

// Interceptor para agregar token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar 401
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export { apiClient };
```

### 2. Actualizar .env.local

```ini
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 3. Layout estructura group routes

```tsx
// app/(protected)/layout.tsx
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ProtectedPageLayout } from '@/components/ProtectedPageLayout';

export default function ProtectedLayout({ children }) {
  return (
    <ProtectedRoute>
      {children}
    </ProtectedRoute>
  );
}
```

---

## 🎯 PRÓXIMOS PASOS

1. ✅ Completar páginas por rol
2. ✅ Implementar formularios CRUD
3. ✅ Agregar validación mejorada
4. ✅ Tests unitarios (useAuth, PermissionGate)
5. ✅ Tema con dark mode
6. ✅ Notificaciones (toast)
7. ✅ Loading states mejorados

---

Este es un sistema **production-ready** y altamente escalable.
