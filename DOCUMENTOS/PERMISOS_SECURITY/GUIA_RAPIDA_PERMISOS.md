# Guía Rápida - Sistema de Permisos VibraLive

## 🚀 Quick Start (1 minuto)

```typescript
// En cualquier componente:
import { usePermissions } from '@/hooks/usePermissions';

export default function MyComponent() {
  const { has, hasAny, isOwner } = usePermissions();
  
  // Mostrar botón solo si tiene permiso
  return (
    <>
      {has('clients:create') && <CreateButton />}
      {has('clients:delete') && <DeleteButton />}
      {isOwner() && <OwnerSettings />}
    </>
  );
}
```

---

## 📋 Métodos Más Usados

### `has(permission: string): boolean`
```typescript
const { has } = usePermissions();

if (has('clients:create')) {
  // Usuario puede crear clientes
}
```

### `hasAny(permissions: string[]): boolean`
```typescript
const { hasAny } = usePermissions();

if (hasAny(['clients:create', 'clients:update'])) {
  // Usuario puede crear O actualizar clientes
}
```

### `hasAll(permissions: string[]): boolean`
```typescript
const { hasAll } = usePermissions();

if (hasAll(['clients:read', 'reports:view'])) {
  // Usuario DEBE tener ambos permisos
}
```

### `isRole(role: string): boolean`
```typescript
const { isRole, isOwner, isSuperAdmin, isStaff } = usePermissions();

if (isOwner()) {
  // Es dueño de clínica
}
```

---

## 💡 Casos de Uso Comunes

### Case 1: Mostrar Botón Condicionalmente
```typescript
{has('clients:create') && (
  <button onClick={handleCreate}>Crear Cliente</button>
)}
```

### Case 2: Deshabilitar Input si no tiene permiso
```typescript
<input 
  disabled={!has('clients:update')} 
  {...props} 
/>
```

### Case 3: Renderizar componente diferente
```typescript
{has('reports:view') ? (
  <AdvancedReports />
) : (
  <BasicView />
)}
```

### Case 4: Ocultar sección completa
```typescript
{hasAny(['clients:read', 'clients:update', 'clients:delete']) && (
  <ClientsSection />
)}
```

### Case 5: Validar rol
```typescript
{isOwner() && <OwnerPanel />}
{isSuperAdmin() && <AdminPanel />}
{isStaff() && <StaffView />}
```

### Case 6: Usar PermissionGate
```typescript
<PermissionGate permissions={['clients:create']}>
  <CreateClientForm />
</PermissionGate>
```

---

## 🎯 Permisos por Módulo

### Clientes
- `clients:create` - Crear nuevo cliente
- `clients:read` - Ver clientes
- `clients:update` - Editar clientes
- `clients:delete` - Eliminar clientes

### Mascotas
- `pets:create` - Crear mascota
- `pets:read` - Ver mascotas
- `pets:update` - Editar mascotas
- `pets:delete` - Eliminar mascotas

### Citas
- `appointments:create` - Crear cita
- `appointments:read` - Ver citas
- `appointments:update` - editar citas
- `appointments:complete` - Completar cita
- `appointments:cancel` - Cancelar cita

### Reportes
- `reports:view` - Ver reportes
- `reports:export` - Exportar reportes
- `reports:schedule` - Programar reportes

### Usuarios (Solo Owner/SuperAdmin)
- `users:create` - Crear usuario
- `users:read` - Ver usuarios
- `users:update` - Editar usuarios
- `users:delete` - Eliminar usuarios

### Configuración (Solo Owner)
- `settings:clinic` - Configurar clínica
- `settings:pricing` - Configurar precios
- `settings:services` - Configurar servicios

**Ver `PERMISSIONS_MATRIX.md` para lista completa de 200+ permisos.**

---

## 🔄 Flujo Completo

```
1. Usuario hace LOGIN
   └─ POST /api/auth/login
   └─ Backend retorna JWT con role + permissions[]
   
2. Frontend guarda en Zustand + localStorage
   └─ localStorage.user = { id, email, role, permissions[], ... }
   
3. Componentes consultan usePermissions()
   └─ Hook extrae permissions del store
   
4. Lógica condicional según permiso
   └─ if (has('clients:create')) → mostrar botón
   
5. API call con JWT en header
   └─ Authorization: Bearer {jwt}
   
6. Backend valida permiso en endpoint
   └─ @CheckPermission('clients:create')
   └─ Si OK → ejecuta acción
   └─ Si NO → retorna 403 Forbidden
```

---

## 🛡️ Patrón Seguro

```typescript
// ✅ CORRECTO - Validar en AMBOS lados
Frontend:
  if (has('clients:create')) {
    <CreateButton onClick={handleCreate} />
  }

Backend:
  @Post()
  @CheckPermission('clients:create')
  async createClient() { ... }

// ❌ INCORRECTO - Solo validar frontend
// Un usuario malicioso podría saltarse validación frontend
// SIEMPRE validar en backend también
```

---

## 📦 Importar lo que Necesitas

### Para verificar permisos
```typescript
import { usePermissions } from '@/hooks/usePermissions';

const { has, hasAny, hasAll, isRole, isOwner, isSuperAdmin, isStaff } = usePermissions();
```

### Para acciones comunes
```typescript
import { useActions } from '@/hooks/usePermissions';

const { 
  canCreateClient, 
  canDeleteClient,
  canCreateAppointment,
  canViewReports,
  canManageUsers 
} = useActions();
```

### Para envolver componentes
```typescript
import PermissionGate from '@/components/PermissionGate';

<PermissionGate permissions={['clients:read']}>
  <ClientsList />
</PermissionGate>
```

### Para menú dinámico
```typescript
import { getMenuForRole, filterMenuByPermissions } from '@/components/dashboard/menu-config';

const menu = getMenuForRole('owner');
const filtered = filterMenuByPermissions(menu, permissions);
```

---

## 🐛 Troubleshooting

### Botón sigue apareciendo sin permiso
→ Verificar que `permissions` está en localStorage
→ Verificar que `has()` retorna false en DevTools
→ Verificar JWT inclye permissions

### Menú no filtra items
→ Verificar que `filterMenuByPermissions` se llama en ModernSidebar
→ Verificar que user.permissions no está vacío
→ Verificar menu-config items tienen `requiredPermissions`

### usePermissions retorna undefined
→ Verificar que usuario está autenticado
→ Verificar que useAuth() retorna user
→ Verificar que localStorage tiene 'user' key

### Endpoints retornan 403
→ Verificar JWT incluye permissions header
→ Verificar @CheckPermission está en endpoint
→ Verificar usuario tiene el permiso en DB

---

## 🧪 Testing en DevTools

```javascript
// Verificar permissions del usuario actual
JSON.parse(localStorage.getItem('user')).permissions

// Verificar rol
JSON.parse(localStorage.getItem('user')).role

// Verificar si tiene específico permiso
JSON.parse(localStorage.getItem('user')).permissions.includes('clients:create')

// Limpiar y re-login si necesitas
localStorage.removeItem('user')
// Ir a login page
```

---

## 📚 Referencias

| Archivo | Propósito |
|----|-----------|
| `menu-config.ts` | Menú predefinido por rol |
| `usePermissions.ts` | Hook de permisos + acciones |
| `PermissionGate.tsx` | Componente wrapper |
| `PERMISSIONS_MATRIX.md` | Documentación de todos permisos |
| `permissions-examples.tsx` | Ejemplos de uso reales |

---

## ⚡ Ejemplos Rápidos

### Botón con permiso
```tsx
{has('clients:create') && (
  <button onClick={createClient}>+ Nuevo Cliente</button>
)}
```

### Formulario con permisos
```tsx
<form>
  <input {...clientName} disabled={!has('clients:update')} />
  <button disabled={!has('clients:update')}>Guardar</button>
</form>
```

### Sección visible solo para Owner
```tsx
{isOwner() && (
  <AdminSection>
    <ManageUsers />
    <ClinicSettings />
  </AdminSection>
)}
```

### Tabla con acciones condicionales
```tsx
{clients.map(client => (
  <tr key={client.id}>
    <td>{client.name}</td>
    <td>
      {has('clients:update') && <EditButton />}
      {has('clients:delete') && <DeleteButton />}
    </td>
  </tr>
))}
```

---

## 🎓 Reglas de Oro

1. ✅ **Validar permisos en Frontend** para mejorar UX
2. ✅ **Validar permisos en Backend** para seguridad
3. ✅ **Almacenar permisos en localStorage** para offline
4. ✅ **Refrescar permisos después de login** con refreshUser()
5. ✅ **Usar usePermissions hook** en componentes
6. ✅ **Documentar permisos nuevos** en PERMISSIONS_MATRIX.md
7. ❌ **No confiar solo en frontend** - Backend debe validar

---

## 🔗 Links Útiles

- Implementación: `SISTEMA_PERMISOS_COMPLETO.md`
- Próximos pasos: `PROXIMOS_PASOS_INTEGRACION.md`
- Permisos detallados: `PERMISSIONS_MATRIX.md`
- Ejemplos: `permissions-examples.tsx`

---

**Última actualización:** Diciembre 2024  
**Versión:** 1.0
