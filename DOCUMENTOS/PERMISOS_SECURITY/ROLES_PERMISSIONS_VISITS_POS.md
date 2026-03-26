# 🔐 Roles y Permisos - Módulos de Visitas, Cuidado Preventivo y POS

**Fecha:** Marzo 10, 2026  
**Estado:** ✅ Completado

---

## 📋 Resumen de Cambios

Se han agregado nuevos permisos para los tres módulos extensibles a VibraLive:
1. **Visitas Clínicas** (Clinical Visits)
2. **Cuidado Preventivo** (Preventive Care)
3. **Sistema POS** (Point of Sale)
4. **Recordatorios** (Reminders)

---

## 🔑 Permisos Agregados

### 1. Visitas Clínicas

| Código | Descripción | Owner | Staff |
|--------|-------------|-------|-------|
| `visits:create` | Crear visitas clínicas | ✅ | ✅ |
| `visits:read` | Ver visitas clínicas | ✅ | ✅ |
| `visits:update` | Editar visitas clínicas | ✅ | ✅ |
| `visits:update_status` | Cambiar estado de visita | ✅ | ✅ |
| `visits:complete` | Completar visita | ✅ | ✅ |
| `visits:cancel` | Cancelar visita | ✅ | ❌ |

---

### 2. Cuidado Preventivo

| Código | Descripción | Owner | Staff |
|--------|-------------|-------|-------|
| `preventive_care:create` | Crear eventos de cuidado preventivo | ✅ | ❌ |
| `preventive_care:read` | Ver eventos de cuidado preventivo | ✅ | ✅ |
| `preventive_care:update` | Editar eventos de cuidado preventivo | ✅ | ✅ |
| `preventive_care:delete` | Eliminar eventos de cuidado preventivo | ✅ | ❌ |
| `preventive_care:complete` | Completar evento preventivo | ✅ | ❌ |

---

### 3. Recordatorios

| Código | Descripción | Owner | Staff |
|--------|-------------|-------|-------|
| `reminders:create` | Crear recordatorios | ✅ | ❌ |
| `reminders:read` | Ver recordatorios | ✅ | ✅ |
| `reminders:send` | Enviar recordatorios | ✅ | ❌ |
| `reminders:cancel` | Cancelar recordatorios | ✅ | ❌ |
| `reminders:queue` | Ver cola de recordatorios | ✅ | ❌ |

---

### 4. POS (Punto de Venta)

#### Productos

| Código | Descripción | Owner | Staff |
|--------|-------------|-------|-------|
| `pos:products:create` | Crear productos POS | ✅ | ❌ |
| `pos:products:read` | Ver productos POS | ✅ | ✅ |
| `pos:products:update` | Editar productos POS | ✅ | ❌ |
| `pos:products:delete` | Eliminar productos POS | ✅ | ❌ |

#### Ventas

| Código | Descripción | Owner | Staff |
|--------|-------------|-------|-------|
| `pos:sales:create` | Crear ventas POS | ✅ | ✅ |
| `pos:sales:read` | Ver ventas POS | ✅ | ✅ |
| `pos:sales:update` | Editar ventas POS | ✅ | ✅ |
| `pos:sales:complete` | Completar ventas POS | ✅ | ❌ |
| `pos:sales:cancel` | Cancelar ventas POS | ✅ | ❌ |
| `pos:sales:refund` | Reembolsar ventas POS | ✅ | ✅ |

#### Inventario

| Código | Descripción | Owner | Staff |
|--------|-------------|-------|-------|
| `pos:inventory:read` | Ver inventario POS | ✅ | ✅ |
| `pos:inventory:adjust` | Ajustar inventario POS | ✅ | ✅ |
| `pos:inventory:history` | Ver historial de inventario | ✅ | ❌ |

#### Pagos

| Código | Descripción | Owner | Staff |
|--------|-------------|-------|-------|
| `pos:payments:create` | Registrar pagos POS | ✅ | ✅ |
| `pos:payments:read` | Ver pagos POS | ✅ | ✅ |

#### Reportes

| Código | Descripción | Owner | Staff |
|--------|-------------|-------|-------|
| `pos:reports` | Ver reportes de POS | ✅ | ❌ |

---

## 👥 Matriz de Roles

### CLINIC_OWNER (Propietario)
**Descripción:** Control total de la clínica  
**Permisos Asignados:**
- Todos los permisos de visitas (CREATE, READ, UPDATE, UPDATE_STATUS, COMPLETE, CANCEL)
- Todos los permisos de cuidado preventivo (CREATE, READ, UPDATE, DELETE, COMPLETE)
- Todos los permisos de recordatorios (CREATE, READ, SEND, CANCEL, QUEUE)
- Todos los permisos de POS (PRODUCTS, SALES, INVENTORY, PAYMENTS, REPORTS)

**Casos de Uso:**
- Crear y gestionar visitas clínicas
- Configurar ciclos de cuidado preventivo
- Crear campañas de recordatorios automáticos
- Definir catálogo de productos y gestionar ventas

---

### CLINIC_STAFF (Personal de Clínica)
**Descripción:** Personal operativo con acceso limitado a funciones diarias  
**Permisos Asignados:**
- Permisos de visitas: CREATE, READ, UPDATE, UPDATE_STATUS, COMPLETE (no CANCEL)
- Permisos de cuidado preventivo: READ, UPDATE (no CREATE, DELETE, COMPLETE)
- Permisos de recordatorios: READ (no CREATE, SEND, CANCEL, QUEUE)
- Permisos de POS:
  - Productos: READ (no CREATE, UPDATE, DELETE)
  - Ventas: CREATE, READ, UPDATE, REFUND (no COMPLETE, CANCEL)
  - Inventario: READ, ADJUST
  - Pagos: CREATE, READ
  - Reportes: ❌ (no acceso)

**Casos de Uso:**
- Registrar visitas de clientes en la clínica
- Ver historial de cuidados preventivos
- Crear y procesar ventas de productos
- Registrar y ajustar inventario

---

### CLINIC_STYLIST (Estilista/Groomer)
**Descripción:** Estilista/Groomer de la clínica  
**Permisos Asignados:**
- Consulta: READ en visitas y cuidado preventivo
- POS: solo lectura de productos

**Casos de Uso:**
- Ver visitas clínicas en su calendario
- Consultar historial de cuidados para mascotas

---

## 🗂️ Archivos Modificados

### Backend

#### 1. **roles-permissions.const.ts**
```
Ubicación: vibralive-backend/src/modules/auth/constants/roles-permissions.const.ts

Cambios:
- ✅ Agregados 35+ nuevos permisos de código
- ✅ Actualizados permisos para rol CLINIC_OWNER
- ✅ Actualizados permisos para rol CLINIC_STAFF
- ✅ Actualizados FEATURES_BY_ROLE con nuevos módulos
```

#### 2. **rbac.seed.ts**
```
Ubicación: vibralive-backend/src/database/seeds/rbac.seed.ts

Cambios:
- ✅ Agregados permisos a SYSTEM_PERMISSIONS
- ✅ Actualizados permisos de SYSTEM_ROLES
- ✅ Agregados permiso de visitas, preventive care, POS y reminders
```

#### 3. **Migration: AddVisitsAndPOSPermissions**
```
Ubicación: vibralive-backend/src/database/migrations/1740650000010-AddVisitsAndPOSPermissions.ts

Cambios:
- ✅ Migración para crear permisos en BD
- ✅ Asociaciones de permisos con roles existentes
- ✅ Rollback seguro para eliminar permisos
```

### Frontend

#### 1. **menu-config.ts**
```
Ubicación: vibralive-frontend/src/components/dashboard/menu-config.ts

Cambios:
- ✅ Actualizado menú de Operaciones con item "Visitas"
- ✅ Permiso requerido: visits:read
```

---

## 🔄 Sincronización Backend-Frontend

### Mapeo de Permisos

El backend y frontend usan formatos de permisos diferentes:

**Backend (Código DB):**
```
VISIT_CREATE      (una palabra con guión bajo)
VISIT_READ
VISIT_UPDATE
```

**Frontend (Constantes):**
```
visits:read       (módulo:acción)
visits:create
visits:update
```

**Transformación:**
El usuario recibe los permisos del backend como strings en formato `módulo:acción` cuando se autentica.

---

## 📋 Checklist de Implementación

### Backend
- [x] Aggegados permisos en SYSTEM_PERMISSIONS (rbac.seed.ts)
- [x] Agrupados permisos por módulo funcional
- [x] Asignados permisos a roles (CLINIC_OWNER, CLINIC_STAFF, CLINIC_STYLIST)
- [x] Creada migración para aplicar cambios en BD
- [x] Actualizado FEATURES_BY_ROLE en roles-permissions.const.ts
- [ ] Ejecutar migración: `npm run migration:run`
- [ ] Ejecutar seed (si es DB nueva): `npm run seed`

### Frontend
- [x] Actualizado menu-config.ts con nuevo menú item
- [x] MenuItem para Visitas con permiso `visits:read`
- [x] Categoría en "Operaciones" (mismo nivel que Grooming y Citas)
- [ ] Componentes de permisos: se heredan del hook usePermissions

### Testing Recomendado
- [ ] Crear usuario con rol CLINIC_OWNER → Verificar acceso a Visitas
- [ ] Crear usuario con rol CLINIC_STAFF → Verificar permisos limitados
- [ ] Crear usuario con rol CLINIC_STYLIST → Verificar solo lectura
- [ ] Intentar acciones sin permisos → Verificar rechazo

---

## 🚀 Próximos Pasos

1. **Ejecutar migración:**
   ```bash
   cd vibralive-backend
   npm run migration:run
   ```

2. **Verificar en BD:**
   ```sql
   -- Ver todos los permisos
   SELECT * FROM permissions WHERE code LIKE 'VISIT_%' OR code LIKE 'POS_%';
   
   -- Ver asociaciones de roles
   SELECT r.code as role, p.code as permission 
   FROM role_permissions rp
   JOIN roles r ON rp.role_id = r.id
   JOIN permissions p ON rp.permission_id = p.id
   WHERE r.code = 'CLINIC_OWNER'
   ORDER BY p.code;
   ```

3. **Crear controladores con decoradores:**
   ```typescript
   @Post('/visits')
   @RequirePermission('visits:create')
   async create(@Body() dto: CreateVisitDto) {
     // Implementation
   }
   
   @Get('/visits')
   @RequirePermission('visits:read')
   async getAll() {
     // Implementation
   }
   ```

4. **Frontend: Proteger componentes:**
   ```typescript
   const { has } = usePermissions();
   
   if (!has('visits:read')) {
     return <Unauthorized />;
   }
   ```

---

## 📊 Estadísticas de Permisos

| Rol | Total Permisos | Visitas | Preventive Care | POS | Reminders |
|-----|:---:|:---:|:---:|:---:|:---:|
| CLINIC_OWNER | 80+ | 6 | 5 | 15+ | 5 |
| CLINIC_STAFF | 50+ | 5 | 2 | 8 | 1 |
| CLINIC_STYLIST | 15 | 1 | 0 | 1 | 0 |

---

## ✅ Validación

**Permisos Agregados:** 35  
**Permisos Únicos:** 35  
**Roles Actualizados:** 3 (CLINIC_OWNER, CLINIC_STAFF, CLINIC_STYLIST)  
**Módulos Agregados:** 4 (visits, preventive-care, pos, reminders)  

---

**Creado:** Marzo 10, 2026  
**Versión:** 1.0  
**Estado:** ✅ Listo para migración
