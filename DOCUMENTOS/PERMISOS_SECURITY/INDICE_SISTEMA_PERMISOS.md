# Índice de Documentación - Sistema de Permisos

## 📚 Documentación Sobre Sistema de Permisos

### 🔧 Guías de Implementación

1. **[SISTEMA_PERMISOS_COMPLETO.md](SISTEMA_PERMISOS_COMPLETO.md)** ⭐ PRINCIPAL
   - Resumen ejecutivo del sistema de permisos
   - Componentes implementados (menu-config, usePermissions, PermissionGate)
   - Hooks y funciones disponibles
   - Stack de autenticación (fixes aplicados)
   - Flujo completo de permisos
   - Estructura de archivos
   - Próximos pasos priorizados
   - **Leer primero esto**

2. **[PROXIMOS_PASOS_INTEGRACION.md](PROXIMOS_PASOS_INTEGRACION.md)** ⭐ GUÍA PRÁCTICA
   - Paso 1: Actualizar ModernSidebar.tsx
   - Paso 2: Validar menu-config.ts
   - Paso 3: Verificar useAuth hooks
   - Paso 4: Validación de permisos en JWT
   - Paso 5: Testing manual
   - Paso 6: Proteger rutas principal
   - Paso 7: Validación en backend
   - Paso 8: Checklist de implementación
   - Paso 9: Comandos útiles para testing
   - Paso 10: Estructura final
   - **Timeline estimado: 90 minutos**

3. **[GUIA_RAPIDA_PERMISOS.md](GUIA_RAPIDA_PERMISOS.md)** ⭐ REFERENCIA
   - Quick start (1 minuto)
   - Métodos más usados
   - Casos de uso comunes
   - Permisos por módulo
   - Flujo completo
   - Patrón seguro frontend + backend
   - Troubleshooting
   - Testing en DevTools
   - Ejemplos rápidos
   - **Tener abierto mientras programas**

4. **[PERMISSIONS_MATRIX.md](PERMISSIONS_MATRIX.md)** 📋 REFERENCIA
   - 200+ permisos documentados
   - Organizados por módulo
   - Matriz Owner/Staff/SuperAdmin
   - Ejemplos de uso
   - Mejores prácticas
   - **Consultar cuando necesites nuevo permiso**

### 📂 Archivos de Código

#### Nuevos (Sistema de Permisos)
- `src/components/dashboard/menu-config.ts` - Menú centralizado
- `src/hooks/usePermissions.ts` - Hook de permisos + acciones
- `permissions-examples.tsx` - 6 ejemplos de uso reales

#### Modificados (Fixes de Autenticación)
- `src/auth/auth.guard.ts` - Fix: sub → id mapping
- `src/auth/auth.service.ts` - Add: getUserById()
- `src/auth/auth.controller.ts` - Update: /me endpoint
- `src/hooks/useAuth.ts` - Add: updateUser(), refreshUser()
- `src/app/profile/page.tsx` - Add: llamadas a sync functions
- `src/types/index.ts` - Add: campos de dirección

#### Existentes (Sin cambios)
- `src/components/PermissionGate.tsx` - Ya existe, documentado
- `src/app/(authenticated)/layout.tsx` - Auth provider

---

## 🎯 ¿Por Dónde Empezar?

### Para Entender Todo el Sistema
1. Lee **[SISTEMA_PERMISOS_COMPLETO.md](SISTEMA_PERMISOS_COMPLETO.md)** (10 min)
2. Lee **[GUIA_RAPIDA_PERMISOS.md](GUIA_RAPIDA_PERMISOS.md)** (5 min)
3. Revisa **[permissions-examples.tsx](permissions-examples.tsx)** (5 min)

### Para Implementar Cambios
1. Sigue **[PROXIMOS_PASOS_INTEGRACION.md](PROXIMOS_PASOS_INTEGRACION.md)** (90 min)
2. Usa **[GUIA_RAPIDA_PERMISOS.md](GUIA_RAPIDA_PERMISOS.md)** como referencia

### Para Agregar Nuevo Permiso
1. Defínelo en backend (user.permissions)
2. Agrega entrada en **[PERMISSIONS_MATRIX.md](PERMISSIONS_MATRIX.md)**
3. Usa con `usePermissions().has('nuevo:permiso')`

### Para Usar en Componente
1. Consulta **[GUIA_RAPIDA_PERMISOS.md](GUIA_RAPIDA_PERMISOS.md)** - Casos de uso comunes
2. Copia ejemplo de **[permissions-examples.tsx](permissions-examples.tsx)**
3. Adapta a tu componente

---

## 📊 Resumen Rápido

### Componentes Principales
```
menu-config.ts
  ├── getMenuForRole(role) → Menú según rol
  ├── filterMenuByPermissions(menu, perms) → Filtra items
  └── hasRequiredPermissions(userPerms, required) → Valida

usePermissions.ts
  ├── usePermissions() → Hook de validación
  │   ├── has(perm) → ¿Tiene permiso?
  │   ├── hasAny(perms) → ¿Tiene al menos uno?
  │   ├── hasAll(perms) → ¿Tiene todos?
  │   ├── isRole(role) → ¿Es rol específico?
  │   └── hasFeature(feature) → Feature flag
  └── useActions() → Atajos comunes

PermissionGate.tsx
  └── <PermissionGate permissions={['perm']}> → Componente wrapper
```

### Flujo de Autenticación
```
Login → JWT (con permissions) → Zustand + localStorage → usePermissions() → UI
```

### Patrones de Uso
```typescript
// Verificar permiso
const { has } = usePermissions();
if (has('clients:create')) { /* mostrar */ }

// Envolver componente
<PermissionGate permissions={['clients:read']}>
  <ClientsList />
</PermissionGate>

// Usar rol
const { isOwner } = usePermissions();
if (isOwner()) { /* mostrar owner panel */ }
```

---

## ✅ Checklist de Lectura

- [ ] Leí SISTEMA_PERMISOS_COMPLETO.md
- [ ] Leí GUIA_RAPIDA_PERMISOS.md
- [ ] Revisé permissions-examples.tsx
- [ ] Entiendo flujo de autenticación
- [ ] Entiendo cómo usar usePermissions()
- [ ] Entiendo cómo filtrar menú
- [ ] Preparado para integración

---

## 🚀 Próximas Acciones

### Inmediato
1. Actualizar ModernSidebar.tsx (Paso 1 de PROXIMOS_PASOS)
2. Probar menú se filtra con dos roles diferentes
3. Verificar localStorage guarda permissions

### Corto Plazo
4. Proteger rutas principales con PermissionGateRoute
5. Actualizar componentes para usar usePermissions
6. Agregar validación en backend endpoints

### Mediano Plazo
7. Auditoría completa de permisos
8. Testing con todos los roles
9. Documentación final de permisos por página

---

## 💡 Tips Importantes

⚠️ **Backend SIEMPRE valida** - Frontend es solo UX  
✅ **Permisos en localStorage** - Para offline y refresh rápido  
✅ **usePermissions() en componentes** - Mantiene sincronización  
✅ **Menu-config centralizado** - Una fuente de verdad  
✅ **PERMISSIONS_MATRIX.md actualizado** - Documentación viva  

---

## 📞 Referencia Rápida

| Necesito... | Ver... | Archivo |
|---|---|---|
| Nuevos permisos | has() | usePermissions.ts |
| Menú dinámico | filterMenuByPermissions() | menu-config.ts |
| Lógica común | useActions() | usePermissions.ts |
| Envolver componente | PermissionGate | PermissionGate.tsx |
| Lista de permisos | PERMISSIONS_MATRIX.md | PERMISSIONS_MATRIX.md |
| Ejemplos | permissions-examples.tsx | permissions-examples.tsx |
| Pasos implementación | PROXIMOS_PASOS | PROXIMOS_PASOS_INTEGRACION.md |

---

## 🎓 Conceptos Clave

### Permiso
`"recurso:acción"` - Ejemplo: `"clients:create"`

### Rol
`"owner" | "staff" | "superadmin"` - Agrupa permisos por nivel

### JWT Token
Contiene `{ sub, email, role, permissions[], clinic_id }`

### Zustand Store
Guarda usuario + permisos en memoria (useAuth hook)

### localStorage
Persiste user data para offline + refresh

### Menu-config
Estructura de menú predefinida con `requiredPermissions`

### PermissionGate
Componente que solo renderiza si tiene permiso

---

**Última actualización:** Diciembre 2024  
**Estado:** ✅ Sistema base completo, listo para integración  
**Próximo paso:** Ver PROXIMOS_PASOS_INTEGRACION.md Paso 1
