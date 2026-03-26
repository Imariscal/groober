# Próximos Pasos - Integración del Sistema de Permisos

## 🎯 Objetivo Inmediato

Integrar el sistema de permisos en **ModernSidebar.tsx** para que el menú se filtre automáticamente según los permisos del usuario.

---

## Paso 1: Actualizar ModernSidebar.tsx

### Ubicación del Archivo
`src/components/dashboard/modern-sidebar.tsx`

### Cambios Necesarios

**En la sección de imports (top del archivo):**
```typescript
// Agregar estos imports
import { getMenuForRole, filterMenuByPermissions } from './menu-config';
import { useAuth } from '@/hooks/useAuth';
```

**En el componente ModernSidebar (buscar línea ~70):**

❌ **ANTES (Hardcodeado):**
```typescript
const clinicOwnerNavigation = [
  { title: "Dashboard", items: [...] },
  { title: "Management", items: [...] },
  ...
];

const staffNavigation = [
  { title: "Dashboard", items: [...] },
  ...
];

const superAdminNavigation = [
  ...
];

// Luego se usa:
const navigation = 
  userRole === 'owner' ? clinicOwnerNavigation :
  userRole === 'staff' ? staffNavigation :
  superAdminNavigation;
```

✅ **DESPUÉS (Dinámico con permisos):**
```typescript
export default function ModernSidebar() {
  const { user } = useAuth();
  
  // Obtener menú base según rol
  const baseMenu = getMenuForRole(user?.role || 'staff');
  
  // Filtrar según permisos del usuario
  const navigation = filterMenuByPermissions(
    baseMenu,
    user?.permissions || []
  );

  // El resto del componente sigue igual...
```

### Cambios en el rendering del menú

**En la sección donde se renderizan items (buscar `.map(group => ...)`):**

❌ **ANTES:**
```typescript
{navigation.map((group, index) => (
  <div key={index}>
    {group.title && <p className="text-sm font-semibold">{group.title}</p>}
    {group.items.map((item, itemIndex) => (
      // render item
    ))}
  </div>
))}
```

✅ **DESPUÉS - NO NECESITA CAMBIOS**
El código anterior funciona igual porque `menu-config.ts` retorna la misma estructura, solo que sin los items que no tienen permisos.

---

## Paso 2: Validar la Estructura de menu-config.ts

### Verificar que el archivo existe
```
src/components/dashboard/menu-config.ts
```

### Validar que tiene estas exportaciones
```typescript
export const CLINIC_OWNER_MENU = [...]
export const STAFF_MENU = [...]
export const SUPERADMIN_MENU = [...]

export function getMenuForRole(role) { ... }
export function filterMenuByPermissions(menu, userPermissions) { ... }
export function hasRequiredPermissions(userPermissions, required) { ... }
```

---

## Paso 3: Verificar que useAuth exporta lo necesario

### Ubicación
`src/hooks/useAuth.ts`

### Debe exportar
```typescript
export { useAuth };

// useAuth debe retornar:
{
  user: { 
    id, 
    email, 
    role, 
    permissions: string[], 
    ...
  },
  token,
  isAuthenticated,
  login,
  logout,
  register,
  refreshUser,
  updateUser
}
```

---

## Paso 4: Validación de Permisos en el Token

### Verificar que el JWT incluye permisos

**En la respuesta del login, el JWT debe contener:**
```typescript
{
  sub: userId,           // JWT standard
  email: 'user@email.com',
  role: 'owner',
  permissions: [
    'clients:create',
    'clients:read',
    'clients:update',
    'appointments:read',
    ...
  ],
  clinic_id: 123
}
```

**Si falta `permissions` en el JWT:**

1. Backend → Ir a `auth.service.ts`
2. En `login()` method, agregar permisos al JWT:
```typescript
const payload = {
  sub: user.id,
  email: user.email,
  role: user.role,
  permissions: user.getPermissions(), // Obtener del usuario/rol
  clinic_id: user.clinic_id
};

return this.jwtService.sign(payload);
```

---

## Paso 5: Testing Manual

### Test 1: Login con cuenta Owner
```
Email: owner@clinic.com
Password: 1012915Im@
Esperado: Menú muestra TODAS las opciones
```

### Test 2: Login con cuenta Staff
```
Email: staff@clinic.com
Password: (su password)
Esperado: Menú solo muestra: Dashboard, Appointments, Clients/Pets
          NO muestra: Reports, Clinic Settings, Users
```

### Test 3: Verificar localStorage
```javascript
// En DevTools Console:
JSON.parse(localStorage.getItem('user')).permissions
// Debe mostrar array de permisos
```

### Test 4: Verificar Zustand store
```javascript
// En DevTools (si hay Zustand devtools):
authStore.getState().user.permissions
// Debe coincidir con localStorage
```

---

## Paso 6: Aplicar a otras páginas

### Rutas que necesitan protección

**Ubicaciones de archivos a actualizar:**

```
Página                          Archivo
─────────────────────────────────────────────────────────
Dashboard                       app/(authenticated)/page.tsx
Clientes                        app/(authenticated)/clinic/clients/page.tsx
Mascotas                        app/(authenticated)/clinic/pets/page.tsx
Citas                           app/(authenticated)/clinic/appointments/page.tsx
Reportes                        app/(authenticated)/clinic/reports/page.tsx
Usuarios                        app/(authenticated)/clinic/users/page.tsx
Configuración                   app/(authenticated)/clinic/settings/page.tsx
Precios                         app/(authenticated)/clinic/pricing/page.tsx
```

### Patrón para proteger una ruta

```typescript
// En cada página, al inicio del componente:
import { usePermissions } from '@/hooks/usePermissions';
import PermissionGateRoute from '@/components/PermissionGateRoute';

export default function Page() {
  const { has } = usePermissions();
  
  // Opción 1: Redirigir si no tiene permiso
  if (!has('clients:read')) {
    return <PermissionGateRoute />;
  }
  
  // Opción 2: Ocultar contenido
  return (
    <div>
      {has('clients:read') && <ClientsList />}
      {!has('clients:read') && <p>No tienes acceso</p>}
    </div>
  );
}
```

---

## Paso 7: Validación en Backend

### Cada endpoint debe validar permisos

**Ejemplo: POST /clients**

```typescript
@Post()
@UseGuards(JwtAuthGuard, PermissionGuard)
@CheckPermission('clients:create')
async createClient(@Body() data: CreateClientDto) {
  // Si llega aquí, usuario tiene permiso
  return this.clientService.create(data);
}
```

### Crear PermissionGuard

```typescript
// src/auth/permission.guard.ts
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class PermissionGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const requiredPermission = Reflect.getMetadata(
      'permission',
      context.getHandler()
    );
    
    if (!requiredPermission) return true;
    
    const userPermissions = request.user?.permissions || [];
    return userPermissions.includes(requiredPermission);
  }
}

// Custom decorator
export function CheckPermission(permission: string) {
  return SetMetadata('permission', permission);
}
```

---

## Paso 8: Checklist de Implementación

### Frontend
- [ ] ModernSidebar importa getMenuForRole y filterMenuByPermissions
- [ ] ModernSidebar llama filterMenuByPermissions(baseMenu, user.permissions)
- [ ] Menú se filtra correctamente en desarrollo
- [ ] Permisos se cargan en el JWT
- [ ] Permisos se almacenan en Zustand + localStorage

### Backend
- [ ] GET /auth/login incluye permissions en JWT
- [ ] GET /auth/me retorna usuario con permissions
- [ ] Validación de permisos en endpoints críticos
- [ ] PermissionGuard implementado
- [ ] @CheckPermission decorador en endpoints

### Testing
- [ ] Login con Owner → menú completo
- [ ] Login con Staff → menú limitado
- [ ] Verificar localStorage.permissions
- [ ] Verificar behavior de cada botón
- [ ] Navegar a ruta protegida sin permiso

---

## Paso 9: Comandos Útiles para Testing

### Verificar permisos en DevTools
```javascript
// Console → ejecutar:
const user = JSON.parse(localStorage.getItem('user'));
console.log('Role:', user.role);
console.log('Permissions:', user.permissions);
console.log('Has clients:create:', user.permissions.includes('clients:create'));
```

### Verificar menú en DevTools
```javascript
// Verificar que solo se muestran items permitidos
document.querySelectorAll('[data-menu-item]').forEach(el => {
  console.log(el.textContent, el.dataset.permission);
});
```

---

## Paso 10: Estructura Final

```
Login
  ↓
GET /auth/login
  ↓
Retorna JWT con { sub, email, role, permissions[] }
  ↓
Frontend almacena en Zustand + localStorage
  ↓
useAuth retorna user con permissions
  ↓
ModernSidebar llama filterMenuByPermissions()
  ↓
Menú se filtra automáticamente
  ↓
usePermissions() disponible en cualquier componente
  ↓
PermissionGate puede usarse para mostrar/ocultar UI
```

---

## 📞 Soporte

Si encuentras problemas:

1. **Menú no filtra**: Verificar que `filterMenuByPermissions` se llama
2. **Permisos null**: Verificar que JWT incluye permissions array
3. **localStorage vacío**: Verificar que `updateUser()` se llamó después de login
4. **Componentes no ven permisos**: Verificar que useAuth está en context provider

---

## 🚀 Timeline Estimado

- **Paso 1-2**: 15 minutos (actualizar ModernSidebar)
- **Paso 3-4**: 10 minutos (validar estructura)
- **Paso 5**: 20 minutos (testing manual)
- **Paso 6-7**: 30 minutos (proteger rutas y backend)
- **Paso 8-9**: 15 minutos (checklist y testing)

**Total:** ~90 minutos para integración completa

---

## Notas Importantes

⚠️ **NO olvidar validación en backend** - Frontend es solo UX
✅ **Prueba con múltiples roles** - Owner, Staff, SuperAdmin
✅ **Verifica localStorage después de login** - Debe tener permissions
✅ **Compara frontend vs backend permissions** - Deben coincidir
✅ **Documentar permisos nuevos** en PERMISSIONS_MATRIX.md

---

**Próximo paso:** Actualizar ModernSidebar.tsx según Paso 1
