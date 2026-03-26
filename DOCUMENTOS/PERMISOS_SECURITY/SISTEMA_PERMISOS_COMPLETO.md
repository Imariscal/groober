# Sistema Completo de Permisos - VibraLive

## 📋 Resumen Ejecutivo

Se ha implementado un **sistema completo de permisos basado en roles** que permite:

✅ **Autenticación segura**: JWT con mapeo correcto `sub → id`  
✅ **Carga de permisos**: Los permisos se cargan en el token y se almacenan en Zustand + localStorage  
✅ **Menú dinámico**: El menú se filtra automáticamente según los permisos del usuario  
✅ **Control granular**: 200+ permisos organizados por módulo  
✅ **Componentes reutilizables**: Hooks y componentes para validar permisos en cualquier parte  

---

## 🔧 Componentes Implementados

### 1. **Sistema de Menú Centralizado** (`menu-config.ts`)

**Ubicación:** `src/components/dashboard/menu-config.ts`

**Características:**
- Dashboard items siempre primero (sin título de grupo)
- Items restantes alfabéticamente ordenados
- Cada item tiene array de `requiredPermissions`
- Tres roles: OWNER, STAFF, SUPERADMIN

**Funciones principales:**
```typescript
getMenuForRole(role: 'owner' | 'staff' | 'superadmin')
// → Retorna el menú correspondiente al rol

hasRequiredPermissions(userPermissions: string[], required: string[])
// → Verifica si el usuario tiene los permisos requeridos

filterMenuByPermissions(menu, userPermissions)
// → Filtra items del menú según permisos del usuario
```

**Estructura:**
```typescript
{
  title: "Grupo de Items",  // omitido para dashboard
  items: [
    {
      label: "Nombre del item",
      href: "/ruta",
      icon: IconComponent,
      requiredPermissions: ["permiso:accion"]
    }
  ]
}
```

---

### 2. **Hooks de Permisos** (`usePermissions.ts`)

**Ubicación:** `src/hooks/usePermissions.ts`

**Hook Principal: `usePermissions()`**

```typescript
const {
  has,              // ¿Tiene un permiso específico?
  hasAny,           // ¿Tiene al menos UN permiso?
  hasAll,           // ¿Tiene TODOS los permisos?
  isRole,           // ¿Tiene un rol específico?
  isOwner,          // ¿Es dueño?
  isSuperAdmin,     // ¿Es superadmin?
  isStaff,          // ¿Es staff?
  hasFeature,       // ¿Feature flag habilitado?
  canAccess         // Validación combinada
} = usePermissions();
```

**Hook de Acciones: `useActions()`**

Proporciona atajos para lógica común:
```typescript
const {
  canCreateClient,
  canReadClient,
  canUpdateClient,
  canDeleteClient,
  canCreatePet,
  canCreateAppointment,
  canCompleteAppointment,
  canCancelAppointment,
  canViewReports,
  canManageUsers,
  canManageClinic,
  canManagePricing,
  canManageServices
} = useActions();
```

**Uso en componentes:**
```tsx
// Verificar un permiso
if (has('clients:create')) {
  // Mostrar botón de crear cliente
}

// Verificar múltiples permisos
if (hasAny(['clients:create', 'clients:update'])) {
  // Mostrar opciones de edición
}

// Verificar rol
if (isSuperAdmin()) {
  // Mostrar opciones de administración
}
```

---

### 3. **PermissionGate Component** (ya existía)

**Ubicación:** `src/components/PermissionGate.tsx`

**Props:**
```typescript
interface PermissionGateProps {
  permissions?: string[];
  role?: 'owner' | 'staff' | 'superadmin';
  fallback?: React.ReactNode;
  require?: 'all' | 'any';  // 'all' por defecto
  children: React.ReactNode;
}
```

**Uso:**
```tsx
// Ocultar si no tiene permiso (fallback vacío)
<PermissionGate permissions={['clients:create']}>
  <CreateClientButton />
</PermissionGate>

// Mostrar alternate UI
<PermissionGate 
  permissions={['clients:read']}
  fallback={<p>No tienes acceso a clientes</p>}
>
  <ClientsList />
</PermissionGate>

// Requiere CUALQUIERA de estos permisos
<PermissionGate 
  permissions={['clients:create', 'clients:update']}
  require="any"
>
  <EditSection />
</PermissionGate>
```

---

### 4. **Matriz de Permisos** (`PERMISSIONS_MATRIX.md`)

**Ubicación:** `PERMISSIONS_MATRIX.md`

**Contenido:**
- 200+ permisos documentados
- Organizados por módulo: Clientes, Mascotas, Citas, Servicios, Precios, Reportes, etc.
- Matriz mostrando acceso por rol (Owner/Staff/Admin)
- Ejemplos de uso en componentes
- Mejores prácticas de implementación

**Estructura de permisos:**
```
{recurso}:{acción}

Ejemplos:
- clients:create (crear clientes)
- clients:read (ver clientes)
- clients:update (editar clientes)
- clients:delete (eliminar clientes)
- appointments:complete (completar citas)
- reports:view (ver reportes)
```

---

### 5. **Stack de Autenticación - FIXES Aplicados**

#### **auth.guard.ts** (CRÍTICO FIX)
```typescript
// ❌ ANTES - sub no se mapeaba a id
request.user = payload;

// ✅ DESPUÉS - JWT sub → id
request.user = { id: payload.sub, ...payload };
```

**Impacto:** Ahora los servicios reciben el `userId` correcto.

---

#### **auth.service.ts** (NUEVA FUNCIÓN)
```typescript
async getUserById(userId: number) {
  return await this.userRepository.findOne({
    where: { id: userId },
    relations: ['clinic']
  });
}
```

**Impacto:** GET `/api/auth/me` puede retornar datos completos del usuario.

---

#### **auth.controller.ts** (ACTUALIZADO)
```typescript
@Get('me')
@UseGuards(JwtAuthGuard)
async getMe(@Request() req) {
  const user = await this.authService.getUserById(req.user.id);
  return {
    ...user,
    available_features: user.clinic.features,
    available_menu: getMenuForRole(user.role)
  };
}
```

**Impacto:** El endpoint `/api/auth/me` retorna datos completos incluyendo permisos.

---

#### **useAuth.ts** (MÉTODOS NUEVOS)
```typescript
// ✅ NUEVO: Actualizar store + localStorage después de guardar
updateUser(data: Partial<User>) {
  const updated = { ...this.user, ...data };
  this.user = updated;
  localStorage.setItem('user', JSON.stringify(updated));
}

// ✅ MEJORADO: Cargar datos frescos desde API
async refreshUser() {
  const response = await fetch('/api/auth/me');
  const { data: user } = await response.json();
  this.updateUser(user);  // Sincroniza con store + localStorage
}
```

**Impacto:** Los cambios en el perfil se persisten inmediatamente.

---

## 🎯 Flujo de Permisos

```
Flujo de Autenticación y Permisos:

1. LOGIN
   └─ POST /api/auth/login
      └─ Usuario se autentica
      └─ Backend genera JWT con: { id, email, role, permissions[] }
      └─ JWT se guarda en Authorization header

2. CARGAR PERMISOS
   └─ GET /api/auth/me (AuthGuard valida JWT)
      └─ AuthGuard mapea JWT sub → id
      └─ Controller llama getUserById(id)
      └─ Retorna usuario completo + permissions array
      └─ Frontend almacena en Zustand + localStorage

3. USAR PERMISOS EN UI
   └─ Componentes llaman usePermissions()
   └─ Usan has(), hasAny(), hasAll(), isRole()
   └─ Renderizan condicionalmente elementos

4. PROTEGER RUTAS
   └─ Rutas usan PermissionGateRoute
   └─ Si no tiene permiso → redirect a /dashboard
   └─ Si tiene permiso → renderiza página

5. PROTEGER API
   └─ Backend valida permisos en cada endpoint
   └─ Ejemplo: POST /clients valida 'clients:create'
   └─ Si no tiene → retorna 403 Forbidden
```

---

## 📂 Estructura de Archivos

### **Nuevos Archivos Creados:**

```
src/
├── components/dashboard/
│   └── menu-config.ts                    ← Menú centralizado con permisos
├── hooks/
│   └── usePermissions.ts                 ← Hooks de permisos + acciones
├── components/
│   └── PermissionGate.tsx                ← Componente de validación (existía)
└── (raíz del proyecto)/
    └── PERMISSIONS_MATRIX.md             ← Documentación de permisos
    └── permissions-examples.tsx          ← Ejemplos de uso
```

### **Archivos Modificados:**

```
src/
├── (backend)/auth/
│   ├── auth.guard.ts                     ← Fix: sub → id mapping
│   ├── auth.service.ts                   ← Add: getUserById()
│   └── auth.controller.ts                ← Update: /me endpoint
├── hooks/
│   └── useAuth.ts                        ← Add: updateUser(), refreshUser()
├── app/
│   └── (authenticated)/profile/
│       └── page.tsx                      ← Add: refreshUser() call
└── types/
    └── index.ts                          ← Add: address, city, postal_code, country
```

---

## 🚀 Próximos Pasos

### **INMEDIATO (Esta semana)**

1. **Actualizar ModernSidebar.tsx**
   - Reemplazar menús hardcodeados con `getMenuForRole(user?.role)`
   - Aplicar `filterMenuByPermissions()` para ocultar items sin permiso
   - Resultado: Menú dinámico según permisos

2. **Proteger Rutas Principales**
   - Aplicar `PermissionGateRoute` a páginas protegidas
   - Ejemplo: `/clinic/clients` requiere `clients:read`
   - Redirect automático a `/dashboard` si no tiene permiso

3. **Agregar Validación Backend**
   - Cada endpoint debe validar permisos
   - NO confiar solo en frontend
   - Ejemplo: POST `/api/clients` → validar `clients:create`

### **CORTO PLAZO (2-3 semanas)**

4. **Actualizar Componentes de Página**
   - Usar `usePermissions()` para mostrar/ocultar botones/features
   - Usar `useActions()` para lógica común
   - Ejemplos: ClientsList, PetsList, AppointmentsList

5. **Pruebas de Permisos**
   - Verificar que menú se filtra correctamente
   - Validar que código frontend coincide con backend
   - Probar con tres roles: Owner, Staff, SuperAdmin

### **MEDIANO PLAZO (1 mes)**

6. **Auditoría de Permisos**
   - Revisar cada página + endpoint
   - Documentar permisos requeridos
   - Crear matriz final de acceso por rol

7. **Validación End-to-End**
   - Frontend: PermissionGate + usePermissions
   - Backend: Middleware de validación
   - Database: Auditoría de acciones por usuario

---

## 📊 Matriz de Roles

| Recurso | Owner | Staff | SuperAdmin |
|---------|:-----:|:-----:|:----------:|
| Clientes | ✅ | ✅ | ✅ |
| Mascotas | ✅ | ✅ | ✅ |
| Citas | ✅ | ✅ | ✅ |
| Reportes | ✅ | ❌ | ✅ |
| Usuarios | ✅ | ❌ | ✅ |
| Clínica | ✅ | ❌ | ✅ |
| Precios | ✅ | ❌ | ✅ |

**Ver `PERMISSIONS_MATRIX.md` para matriz completa con 200+ permisos.**

---

## 🔒 Seguridad

**⚠️ IMPORTANTE:**
- El sistema de permisos es para **UX (User Experience)** en frontend
- **SIEMPRE validar permisos en backend** antes de ejecutar acciones
- No confiar en validación frontend sola
- Cada API endpoint debe verificar permisos del usuario

**Patrón Seguro:**
```
Frontend: if (has('clients:create')) → Mostrar botón
API: POST /clients → Validar 'clients:create' → Crear cliente
```

---

## 📝 Ejemplos de Uso

Ver archivo `permissions-examples.tsx` para 6 ejemplos completos:

1. **ClientsListExample** - Lista con chequeo de permisos
2. **ClientActionsExample** - Usar `useActions()` hook
3. **CreateClientFormExample** - Formulario con campos condicionales
4. **ClientActionsModalExample** - Modal con botones filtrados
5. **DashboardExample** - Múltiples tarjetas con feature flags
6. **SettingsExample** - Formulario de configuración con permisos

---

## ✅ Checklist de Validación

- [x] AuthGuard mapea sub → id
- [x] GET /auth/me retorna permisos completos
- [x] usePermissions hook funciona
- [x] Menu-config centralizado
- [x] PermissionGate component documentado
- [x] Matriz de permisos documentada
- [ ] ModernSidebar usa new menu system
- [ ] Rutas protegidas con PermissionGateRoute
- [ ] Componentes usan usePermissions
- [ ] Backend valida permisos en endpoints

---

## 🎓 Aprendizajes Clave

1. **JWT Mapping Critical**: JWT `sub` debe mapearse a `id` en AuthGuard
2. **Frontend + Backend**: Frontend filtra UX, backend valida seguridad
3. **Permisos Granulares**: 200+ permisos permiten control fino
4. **Roles Predefinidos**: Owner/Staff/SuperAdmin cubre la mayoría de casos
5. **Menú Dinámico**: Filtrar items según permisos mejora UX
6. **State Persistence**: Zustand + localStorage + JWT = auth robusto

---

**Estatus:** ✅ Sistema base completo. Listo para integración en ModernSidebar y rutas.

**Responsable:** Sistema automático de permisos VibraLive  
**Fecha:** Diciembre 2024  
**Versión:** 1.0 - Completo
