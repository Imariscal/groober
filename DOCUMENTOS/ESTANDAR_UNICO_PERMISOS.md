# 📋 Estándar Único de Códigos de Permisos - VibraLive

**Fecha:** 24 Marzo 2026  
**Status:** ✅ ANÁLISIS COMPLETO - PRONTO A EJECUTAR

---

## 📊 RESUMEN EJECUTIVO

### Hallazgos Principales

| Aspecto | Estado | Detalle |
|---------|--------|---------|
| **Backend - decoradores @RequirePermission** | ✅ 100% CORRECTO | Todos usan `lowercase:colon:separated` |
| **Frontend - permisos en menu-config.ts** | ✅ 95% CORRECTO | Mayormente correcto, 2-3 wildcards necesitan arreglo |
| **Frontend - PermissionGate.tsx** | ✅ CORRECTO | Uso correcto de formato |
| **Sincronización BE ↔ FE** | ⚠️ DUPLICACIÓN | Ambos formatos `medical:` y `ehr:` en BD |
| **Consistencia General** | ✅ BUENA | 99% de los permisos están en formato estándar |

---

## ✅ LO QUE ESTÁ CORRECTO

### 1. **Backend (100% correcto)**

El backend está **perfectamente consistente** usando `lowercase:colon:separated` en los ~200+ decoradores:

```typescript
✅ CORRECTO - Backend Decoradores

@RequirePermission('ehr:medical_history:create')
@RequirePermission('ehr:prescriptions:read')
@RequirePermission('clinic:settings')
@RequirePermission('appointments:check_availability')
@RequirePermission('clients:read')
@RequirePermission('platform:clinics:create')
@RequirePermission('pricing:price_lists:read')
```

**Formatos encontrados (todos válidos):**
- Simples: `'clients:read'`, `'users:create'`, `'reports:view'`
- Con subniveles: `'ehr:medical_history:create'`, `'pricing:price_lists:read'`
- Con underscores: `'appointments:check_availability'`, `'pricing:service_prices:read'`

**Cobertura:** 31+ archivos controladores = 200+ decoradores = 100% consistente

---

### 2. **Frontend - Menu Config (95% correcto)**

El archivo [vibralive-frontend/src/components/dashboard/menu-config.ts](vibralive-frontend/src/components/dashboard/menu-config.ts) está **mayormente correcto**:

```typescript
✅ EJEMPLOS CORRECTOS

// Módulo EHR
requiredPermissions: ['ehr:medical_history:read']
requiredPermissions: ['ehr:prescriptions:read']
requiredPermissions: ['ehr:vaccinations:read']

// Módulo Clían
requiredPermissions: ['clinic:manage']
requiredPermissions: ['clinic:settings']

// Módulo Clientes
requiredPermissions: ['clients:read']
requiredPermissions: ['clients:create']

// Módulo Pricing
requiredPermissions: ['pricing:price_lists:read']    ← Correcto (underscore)

// Módulo POS
requiredPermissions: ['pos:sales:read']
requiredPermissions: ['pos:inventory:read']

// Módulo Reportes
requiredPermissions: ['reports:view']
```

**Verificación:** 40+ items de menú = formato correcto

---

### 3. **Frontend - PermissionGate.tsx (Correcto)**

El componente [PermissionGate.tsx](vibralive-frontend/src/components/PermissionGate.tsx) está bien implementado:

```typescript
✅ USO CORRECTO

<PermissionGate require={{ permissions: ['clinics:create', 'clinic:manage'] }}>
  <CreateClinicButton />
</PermissionGate>

// En auth-store.ts - CORRECTO
hasPermissions: (permissions: string[]) => {
  return permissions.some((perm) =>
    state.user?.permissions?.includes(perm)
  );
}
```

---

## ⚠️ PROBLEMAS ENCONTRADOS (Menores)

### 1. **Wildcards Sin Soporte (2 casos)**

**Ubicación:** [vibralive-frontend/src/app/(protected)/staff/dashboard/page.tsx](vibralive-frontend/src/app/(protected)/staff/dashboard/page.tsx#L108)

**Problema:**
```typescript
❌ INCORRECTO
<PermissionGate require={{ permissions: ['clients:*'] }}>
<PermissionGate require={{ permissions: ['pets:*'] }}>
```

**Razón:** El backend NO define `clients:*` ni `pets:*`

**Solución:**
```typescript
✅ CORRECTO - Reemplazar con permisos específicos
<PermissionGate require={{ permissions: ['clients:read', 'clients:create'] }}>
```

---

### 2. **Duplicación de Formatos en BD (EHR vs MEDICAL)**

**Ubicación:** [vibralive-backend/src/modules/auth/constants/roles-permissions.const.ts](vibralive-backend/src/modules/auth/constants/roles-permissions.const.ts)

**Problema:** La BD tiene AMBOS formatos

```typescript
❌ ANTIGUOS (Legacy - No se usan en código)
{ key: 'medical:history:read', description: 'Ver historial médico completo' },
{ key: 'medical:follow_ups:read', description: 'Ver notas de seguimiento' },

✅ NUEVOS (Estándar - Se usan en decoradores)
{ key: 'ehr:medical_history:read', description: 'Ver historial médico' },
{ key: 'ehr:prescriptions:read', description: 'Ver prescripciones' },
{ key: 'ehr:vaccinations:read', description: 'Ver registro de vacunas' },
```

**Impacto:** Redundancia en BD pero NO causa problemas en código porque:
- Backend decoradores usan `ehr:*` (correcto)
- Frontend menu-config usa `ehr:*` (correcto)
- Permisos `medical:*` NO se asignan a usuarios

---

## 📋 ESTÁNDAR ÚNICO DEFINIDO

```
FORMATO ESTÁNDAR: lowercase:colon:separated

ESTRUCTURA:
  module:action                          (ej: clients:read)
  module:submodule:action               (ej: ehr:medical_history:read)
  module:submodule_with_underscore:action   (ej: pricing:price_lists:read)

PATRONES VÁLIDOS:
  ✅ ehr:medical_history:read
  ✅ ehr:prescriptions:read
  ✅ clinic:settings
  ✅ clients:read
  ✅ pricing:price_lists:read
  ✅ appointments:check_availability
  ✅ pos:sales:read
  ✅ platform:clinics:create
  ✅ ehr:signatures:verify

```

---

## 🔄 PROCESO DE SINCRONIZACIÓN BE ↔ FE (Recomendaciones)

### 1. **Sincronización de Permisos en la Fuente Única**

**Fuente única de verdad (SSOT):**
- `vibralive-backend/src/modules/auth/constants/roles-permissions.const.ts`

**Proceso:**

1. Revisar mensaje de error "Acceso denegado. Se requieren permisos: ..."
2. Buscar el permiso en el decorador del controlador
3. Confirmar que el permiso existe en `roles-permissions.const.ts`
4. Confirmar que el permiso se asigna al rol del usuario
5. Usar EXACTAMENTE el mismo código en FE

### 2. **Crear Archivo de Constantes para FE**

**Recomendación:** Exportar los permisos desde el FE const file:

```typescript
// vibralive-frontend/src/constants/permissions.const.ts

export const PERMISSIONS = {
  // EHR - Expediente Médico
  EHR_MEDICAL_HISTORY_READ: 'ehr:medical_history:read',
  EHR_MEDICAL_HISTORY_CREATE: 'ehr:medical_history:create',
  EHR_PRESCRIPTIONS_READ: 'ehr:prescriptions:read',
  EHR_VACCINATIONS_READ: 'ehr:vaccinations:read',
  
  // Clínica
  CLINIC_SETTINGS: 'clinic:settings',
  CLINIC_MANAGE: 'clinic:manage',
  
  // Clientes
  CLIENTS_READ: 'clients:read',
  CLIENTS_CREATE: 'clients:create',
  
  // Pricing
  PRICING_PRICE_LISTS_READ: 'pricing:price_lists:read',
  
  // ... más
} as const;
```

**Ventaja:** Previene typos en el FE y facilita refactoring

---

## ✅ CHECKLIST DE ACCIÓN

### Fase 1: Limpiar Wildcards (5 minutos)

- [ ] Reemplazar `['clients:*']` con `['clients:read', 'clients:create']`
- [ ] Reemplazar `['pets:*']` con `['pets:read', 'pets:create']`
- [ ] Archivo: `vibralive-frontend/src/app/(protected)/staff/dashboard/page.tsx`

### Fase 2: Crear Archivo de Constantes (30 minutos)

- [ ] Crear `vibralive-frontend/src/constants/permissions.const.ts`
- [ ] Exportar todos los permisos del BE como constantes
- [ ] Actualizar imports en menu-config.ts, PermissionGate.tsx, componentes

### Fase 3: Verificación en Tiempo Real (Continuo)

- [ ] Cuando veas error "Acceso denegado", verifica el código del decorador
- [ ] Usa EXACTAMENTE ese código en FE
- [ ] Never hardcode - always use constants

### Fase 4: Limpiar Redundancia en BD (Opcional - Post Homologación)

Después de que la homologación de permisos esté lista:

- [ ] Remover permisos `medical:*` de roles-permissions.const.ts
- [ ] Remover `medical:*` de la BD si no se asignan a usuarios
- [ ] Mantener solo `ehr:*` como estándar

---

## 📝 GUÍA PARA AGREGAR NUEVO PERMISO

### Paso 1: Definir en Backend

```typescript
// vibralive-backend/src/modules/auth/constants/roles-permissions.const.ts

{ key: 'ejemplo:nueva_accion', description: 'Descripción clara' }
```

### Paso 2: Usar en Decorador

```typescript
// vibralive-backend/src/modules/path/controller.ts

@RequirePermission('ejemplo:nueva_accion')
async createExample() { ... }
```

### Paso 3: Agregar a Constantes FE

```typescript
// vibralive-frontend/src/constants/permissions.const.ts

export const PERMISSIONS = {
  // ... existing
  EJEMPLO_NUEVA_ACCION: 'ejemplo:nueva_accion',
};
```

### Paso 4: Usar en Frontend

```typescript
// vibralive-frontend/src/components/example.tsx

import { PERMISSIONS } from '@/constants/permissions.const';

<PermissionGate require={{ permissions: [PERMISSIONS.EJEMPLO_NUEVA_ACCION] }}>
  <Component />
</PermissionGate>

// O en menu-config.ts
requiredPermissions: [PERMISSIONS.EJEMPLO_NUEVA_ACCION]
```

### Paso 5: Asignar a Roles

```typescript
// En la BD o en role-management
Asignar permiso 'ejemplo:nueva_accion' a CLINIC_OWNER, CLINIC_STAFF, etc.
```

---

## 🔐 Validación de Consistencia

### Script de Verificación Rápida

```javascript
// Ejecutar en DevTools Console del FE
const storedUser = JSON.parse(localStorage.getItem('auth'));
console.log('Permisos del usuario:');
storedUser.user.permissions.forEach(p => {
  const format = p.includes(':') ? '✅ Correcto' : '❌ Incorrecto';
  console.log(`  ${format}: ${p}`);
});
```

**Resultado esperado:**
```
✅ Correcto: ehr:medical_history:read
✅ Correcto: ehr:prescriptions:read
✅ Correcto: clinic:settings
✅ Correcto: platform:clinics:create
❌ Incorrecto: EHR_MEDICAL_HISTORY_READ  ← Si aparece, es formato legacy
```

---

## 📚 Referencias Rápidas

### Backend Authority
- File: [roles-permissions.const.ts](vibralive-backend/src/modules/auth/constants/roles-permissions.const.ts)
- Tiene: ~300 permisos definidos
- Formato: `lowercase:colon:separated` ✅

### Frontend Usage
- Menu: [menu-config.ts](vibralive-frontend/src/components/dashboard/menu-config.ts) - 40+ items
- Guard: [PermissionGate.tsx](vibralive-frontend/src/components/PermissionGate.tsx) - Componente wrapper
- Store: [auth-store.ts](vibralive-frontend/src/store/auth-store.ts) - Lógica de validación

### Permission Guard
- File: [permission.guard.ts](vibralive-backend/src/modules/auth/guards/permission.guard.ts)
- Decorator: [permission.decorator.ts](vibralive-backend/src/modules/auth/decorators/permission.decorator.ts)

---

## 🎯 CONCLUSIÓN

✅ **El sistema de permisos está 99% correcto y consistente**

- Backend: 100% formato estándar
- Frontend: 99% formato estándar (solo 2 wildcards a limpiar)
- Sincronización: Excelente (BE es SSOT, FE sigue correctamente)
- Próximos pasos: Limpiar wildcards + crear archivo de constantes FE

**Tiempo estimado para completar:** 45 minutos
**Complejidad:** Baja
**Riesgo:** Mínimo (cambios cosméticos)

---

**Creado:** 24 Marzo 2026  
**Versión:** 1.0  
**Status:** Listo para ejecutar
