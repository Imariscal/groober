# ✅ CHECKLIST DE IMPLEMENTACIÓN FRONTEND

## 📦 ARCHIVOS CREADOS/MODIFICADOS

### ✨ NUEVOS ARCHIVOS
- [x] `src/types/menu.ts` - Tipos para menú dinámico
- [x] `src/components/PermissionGate.tsx` - Componente condicional por permisos
- [x] `src/components/ProtectedRoute.tsx` - Protección de rutas
- [x] `src/components/DynamicSidebar.tsx` - Sidebar dinámico
- [x] `src/components/ProtectedPageLayout.tsx` - Layout protegido
- [x] `src/FRONTEND_ARCHITECTURE.md` - Documentación completa
- [x] `src/IMPLEMENTATION_CHECKLIST.md` - Este archivo

### 🔄 ARCHIVOS MEJORADOS
- [x] `src/types/index.ts` - User type actualizado con permisos
- [x] `src/store/auth-store.ts` - AuthStore con métodos de permisos
- [x] `src/hooks/useAuth.ts` - Hook mejorado con permission checks

### ℹ️ ARCHIVOS SIN CAMBIOS (Pero necesarios revisar)
- [ ] `src/lib/api-client.ts` - Revisar interceptors
- [ ] `src/components/Providers.tsx` - Revisar que incluya auth provider
- [ ] `src/components/LoginForm.tsx` - Actualizar para nuevo flujo
- [ ] `src/app/layout.tsx` - Revisar estructura

---

## 🛠️ TAREAS POR HACER

### FASE 1: Configuración Base (Priority: ALTA)

- [ ] **Instalar dependencias faltantes**
  ```bash
  npm install react-icons
  ```

- [ ] **Actualizar lib/api-client.ts** con interceptors
  - Agregar token al header automáticamente
  - Manejar 401 (redirigir a login)
  - Re-export funciones login, register

- [ ] **Actualizar src/components/Providers.tsx**
  - Asegurar que AuthProvider o ProtectedRoute sea el root
  - Agregar toast provider si no existe

- [ ] **Crear src/middleware.ts** (Opcional pero recomendado)
  ```typescript
  // Proteger rutas a nivel middleware
  import { NextResponse } from 'next/server';
  import type { NextRequest } from 'next/server';

  export function middleware(request: NextRequest) {
    const token = request.cookies.get('access_token')?.value;
    const protectedRoutes = ['/dashboard', '/clinic', '/staff', '/admin'];
    
    if (protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
      if (!token) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }
    
    return NextResponse.next();
  }

  export const config = {
    matcher: ['/dashboard/:path*', '/clinic/:path*', '/staff/:path*', '/admin/:path*'],
  };
  ```

- [ ] **Actualizar .env.local**
  ```
  NEXT_PUBLIC_API_URL=http://localhost:3001
  ```

---

### FASE 2: Rutas y Layouts (Priority: ALTA)

- [ ] **Reorganizar estructura de rutas**
  ```
  app/
  ├── (auth)/
  │   ├── login/
  │   │   └── page.tsx
  │   ├── register/
  │   │   └── page.tsx
  │   └── layout.tsx (layout público)
  ├── (protected)/
  │   ├── dashboard/
  │   │   └── page.tsx (SuperAdmin)
  │   ├── admin/
  │   │   ├── clinics/
  │   │   ├── users/
  │   │   ├── audit/
  │   │   └── settings/
  │   │       └── page.tsx
  │   ├── clinic/
  │   │   ├── dashboard/
  │   │   ├── clients/
  │   │   ├── pets/
  │   │   ├── users/
  │   │   ├── reports/
  │   │   └── settings/
  │   │       └── page.tsx
  │   ├── staff/
  │   │   ├── dashboard/
  │   │   ├── clients/
  │   │   ├── pets/
  │   │   └── reminders/
  │   │       └── page.tsx
  │   └── layout.tsx (layout protegido con ProtectedRoute)
  ├── unauthorized/
  │   └── page.tsx
  ├── layout.tsx (root)
  └── page.tsx (home/login redirect)
  ```

- [ ] **Crear layout/(auth)/layout.tsx**
  ```tsx
  export default function AuthLayout({ children }) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    );
  }
  ```

- [ ] **Crear layout/(protected)/layout.tsx**
  ```tsx
  'use client';

  import { ProtectedRoute } from '@/components/ProtectedRoute';

  export default function ProtectedLayout({ children }) {
    return (
      <ProtectedRoute>
        {children}
      </ProtectedRoute>
    );
  }
  ```

- [ ] **Crear page unauthorized/page.tsx**
  ```tsx
  'use client';

  import Link from 'next/link';

  export default function UnauthorizedPage() {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold mb-4">403</h1>
        <p className="text-gray-600 mb-8">No tienes permisos para acceder a esta página</p>
        <Link href="/dashboard" className="px-4 py-2 bg-blue-600 text-white rounded">
          Volver al Dashboard
        </Link>
      </div>
    );
  }
  ```

---

### FASE 3: Componentes de Rutas (Priority: MEDIA)

- [ ] **Crear app/(protected)/dashboard/page.tsx** (SuperAdmin)
  - Mostrar estadísticas globales
  - Usar PermissionGate para secciones específicas
  - Agregar botones de crear clínicas

- [ ] **Crear app/(protected)/admin/clinics/page.tsx**
  - Listar clínicas con paginación
  - Acciones (editar, suspender, eliminar)
  - Proteger con @RequirePermission('clinics:read')

- [ ] **Crear app/(protected)/admin/users/page.tsx**
  - Listar usuarios
  - Crear usuario
  - Editar/Eliminar

- [ ] **Crear app/(protected)/clinic/dashboard/page.tsx** (Owner)
  - Dashboard de clínica
  - Estadísticas de su clínica
  - Acciones rápidas

- [ ] **Crear app/(protected)/clinic/clients/page.tsx**
  - CRUD de clientes
  - Tabla con búsqueda
  - Acciones condicionales

- [ ] **Crear app/(protected)/clinic/pets/page.tsx**
  - CRUD de mascotas
  - Asociar a cliente
  - Tipos de animales

- [ ] **Crear app/(protected)/staff/dashboard/page.tsx**
  - Vista reducida del dashboard

---

### FASE 4: Actualizar Componentes Existentes (Priority: MEDIA)

- [ ] **Actualizar LoginForm.tsx**
  ```tsx
  'use client';
  
  import { useAuth } from '@/hooks/useAuth';
  
  export function LoginForm() {
    const { login, isLoading, error } = useAuth();
    // ... implementar con nuevo flujo
  }
  ```

- [ ] **Actualizar RegisterForm.tsx**
  - Agregar campo "city"
  - Usar nuevo hook useAuth.register

- [ ] **Actualizar DashboardHeader.tsx**
  - Agregar notificaciones
  - Dropdown de usuarios
  - Busqueda global

- [ ] **Verificar Providers.tsx**
  - Que tenga Toaster (react-hot-toast)
  - Que esté como root provider

---

### FASE 5: Estilo y UX (Priority: BAJA)

- [ ] **Mejorar estilos de DynamicSidebar**
  - Agregar iconos reales con react-icons
  - Animaciones más suaves
  - Colores por rol

- [ ] **Crear componentes UI reutilizables**
  - Button variants
  - Card component
  - Badge component
  - Empty state

- [ ] **Agregar dark mode** (opcional)
  - Integrar con next-themes
  - Persistir preferencia

- [ ] **Animations**
  - Transiciones con Framer Motion
  - Page transitions
  - Loading skeletons

---

### FASE 6: Testing (Priority: BAJA)

- [ ] **Tests unitarios**
  ```bash
  npm install --save-dev jest @testing-library/react
  ```
  - Test useAuth hook
  - Test PermissionGate
  - Test ProtectedRoute

- [ ] **Tests E2E** (Cypress/Playwright)
  - Login flow
  - Permission gates
  - Navigation

---

## 🔍 VERIFICACIÓN

Después de implementar, verifica:

- [ ] Login funciona (todas las rutas redirigen a /login)
- [ ] Después de login, menú se renderiza correctamente
- [ ] Menú muestra solo items válidos para el rol
- [ ] PermissionGate oculta botones sin permisos
- [ ] Rutas protegidas redirigen correctamente
- [ ] Logout borra session
- [ ] Token se envía en cada request
- [ ] 401 redirige a login
- [ ] 403 muestra /unauthorized
- [ ] F5 refresh (hydration) no pierde datos

---

## 📝 NOTAS

1. **No modificar** `lib/api-client.ts` directamente hasta tener error
2. **Usar** componentes existentes donde sea posible
3. **Reutilizar** estilos de Tailwind
4. **Testing** en navegador primero (F12 → Network)
5. **LocalStorage** se valida automáticamente en useAuth

---

## ⚡ QUICK START

```bash
# 1. Instalar react-icons
npm install react-icons

# 2. Dev server
npm run dev

# 3. Abrir navegador
open http://localhost:3000

# 4. Login como superadmin
# Email: superAdmin@vibralive.com
# Password: admin@1234
```

---

¡La arquitectura está lista! Solo falta implementar las páginas. 🚀
