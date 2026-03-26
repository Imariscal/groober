# 🔄 SINCRONIZACIÓN LIMPIA - SISTEMA DE PERMISOS VibraLive

## 📋 Descripción General

Plan ejecutado para **limpiar y sincronizar completamente** el sistema de permisos usando `roles-permissions.const.ts` como única fuente de verdad.

**Resultado esperado:**
- ✅ ~200 permisos en 18 categorías insertados
- ✅ CLINIC_OWNER tendrá TODOS los 200 permisos
- ✅ Cero duplicados en la base de datos
- ✅ Sistema sincronizado y listo para desarrollo

---

## 🚀 Orden de Ejecución

### Script 1: LIMPIEZA DE ASIGNACIONES
**Archivo:** `SYNC_1_DELETE_ALL_ROLE_PERMISSIONS.sql`

```sql
-- Elimina TODAS las asignaciones de permisos a roles
-- Mantiene la tabla de permisos intacta (por ahora)
-- Impacto: Las asignaciones se pierden, pero los permisos quedan en BD
```

**¿Qué hace?**
- Cuenta permisos asignados antes
- DELETE FROM role_permissions (TODOS)
- Verifica eliminación

**Metadata:**
- Tiempo ejecución: < 1 segundo
- Reversible: Sí (si guardaste un backup)
- Crítico: NO (los permisos persisten en tabla de permisos)

---

### Script 2: LIMPIEZA DE PERMISOS
**Archivo:** `SYNC_2_DELETE_ALL_PERMISSIONS.sql`

```sql
-- Elimina TODOS los permisos de la tabla permissions
-- Con esto logramos un "clean slate" (pizarra limpia)
-- Impacto: Prepara la BD para inserción nueva
```

**¿Qué hace?**
- Cuenta permisos antes
- DELETE FROM permissions (TODOS)
- Verifica eliminación
- Confirma que role_permissions está vacía

**Metadata:**
- Tiempo ejecución: < 1 segundo
- Reversible: Sí (si guardaste un backup)
- Crítico: SÍ - después del script 1

---

### Script 3: INSERCIÓN DE PERMISOS
**Archivo:** `SYNC_3_INSERT_ALL_PERMISSIONS.sql`

```sql
-- Inserta TODOS los 200 permisos desde roles-permissions.const.ts
-- Organiza en 18 categorías con descripciones amigables
-- Impacto: Población de tabla permissions desde source of truth
```

**¿Qué hace?**
- Inserta permisos en 18 categorías:
  - Plataforma (Super Admin)
  - Configuración de Clínica
  - Usuarios y Roles
  - Clientes y Mascotas
  - Citas y Servicios
  - Visitas Clínicas
  - **Expediente Médico Electrónico (EHR)** ⭐ 50+ permisos
  - Cuidado Preventivo
  - Recordatorios
  - POS
  - Precios y Facturación
  - Estilistas y Disponibilidad
  - Veterinarios
  - Rutas y Optimización
  - Campañas
  - Notificaciones y Comunicación
  - Reportes y Analytics
  - Dashboard
  - Auditoría

- Verifica inserción con agrupamiento por categoría
- Muestra conteo total

**Metadata:**
- Tiempo ejecución: ~2-3 segundos
- Reversible: Sí (ejecutar script 2 nuevamente)
- Crítico: SÍ - debe ejecutarse después del script 2

---

### Script 4: ASIGNACIÓN A CLINIC_OWNER
**Archivo:** `SYNC_4_ASSIGN_CLINIC_OWNER.sql`

```sql
-- Asigna TODOS los 200 permisos a CLINIC_OWNER
-- Otros roles pueden configurarse independientemente después
-- Impacto: CLINIC_OWNER queda con permisos completos
```

**¿Qué hace?**
- Obtiene ID de CLINIC_OWNER role
- INSERT INTO role_permissions (todos los permisos a CLINIC_OWNER)
- Usa ON CONFLICT ... DO NOTHING (evita duplicados)
- Verifica asignación

**Post-ejecución:**
- CLINIC_OWNER tendrá: ~200 permisos
- Comparativa: Permisos totales vs CLINIC_OWNER asignados
- Desglose por categoría

**Metadata:**
- Tiempo ejecución: ~1-2 segundos
- Reversible: Sí (ejecutar script 1)
- Crítico: SÍ - completa la sincronización

---

### Script 5: VERIFICACIÓN FINAL
**Archivo:** `SYNC_5_VERIFY_PERMISSIONS.sql`

```sql
-- Valida que la sincronización se completó correctamente
-- NO modifica datos, solo consulta y reporta
-- Impacto: Cero - solo lectura
```

**Validaciones:**
1. ✅ Estadísticas generales (permisos, roles, categorías)
2. ✅ Permisos por categoría
3. ✅ Estado de cada rol
4. ✅ CLINIC_OWNER permisos esperados vs reales
5. ✅ Desglose CLINIC_OWNER por categoría
6. ✅ Búsqueda de duplicados
7. ✅ Permisos sin asignar
8. ✅ Campos nulos (integridad)
9. ✅ Comparativa antes/después
10. ✅ Reporte final consolidado

**Indicadores de Éxito:**
```
✓ Total Permisos      ~200
✓ Categorías          18
✓ Sincronización      CLINIC_OWNER tiene TODOS los permisos
✓ Integridad          Sin duplicados
✓ Validación Campos   Todos NOT NULL
```

**Metadata:**
- Tiempo ejecución: < 2 segundos
- Reversible: N/A (no modifica)
- Crítico: NO (validación nada más)

---

## 📊 Estructura de Datos Insertados

### Categorías y Conteo
```
Expediente Médico Electrónico (EHR)    50 permisos ⭐
Plataforma (Super Admin)              19 permisos
POS (Punto de Venta)                  17 permisos
Estilistas y Disponibilidad           15 permisos
Clientes y Mascotas                   13 permisos
Campañas                              10 permisos
Usuarios y Roles                      10 permisos
Notificaciones y Comunicación          11 permisos
Precios y Facturación                 11 permisos
Reportes y Analytics                   8 permisos
Citas y Servicios                      7 permisos
Visitas Clínicas                       6 permisos
Configuración de Clínica               6 permisos
Cuidado Preventivo                     5 permisos
Recordatorios                          5 permisos
Rutas y Optimización                   4 permisos
Veterinarios                           4 permisos
Dashboard                              1 permiso
Auditoría                              1 permiso
─────────────────────────────────────────────
TOTAL                                ~200 permisos
```

---

## 🎯 Ejecución Paso a Paso

### Prerequisitos
```
✓ Acceso a BD PostgreSQL con credenciales
✓ Privilegios para ejecutar UPDATE/DELETE/INSERT
✓ Backup previo (recomendado, aunque los scripts son reversibles)
✓ roles-permissions.const.ts como referencia
```

### Pasos
```
1️⃣  Abre cliente SQL (pgAdmin, DBeaver, psql, etc.)
2️⃣  Copia contenido de SYNC_1_DELETE_ALL_ROLE_PERMISSIONS.sql
3️⃣  Pega en cliente y ejecuta
    ↳ Verifica: "X role_permissions eliminados"
    
4️⃣  Copia contenido de SYNC_2_DELETE_ALL_PERMISSIONS.sql
5️⃣  Pega en cliente y ejecuta
    ↳ Verifica: "Y permissions eliminados"
    
6️⃣  Copia contenido de SYNC_3_INSERT_ALL_PERMISSIONS.sql
7️⃣  Pega en cliente y ejecuta
    ↳ Verifica: "~200 permissions insertados"
              : "18 categorías pobladas"
    
8️⃣  Copia contenido de SYNC_4_ASSIGN_CLINIC_OWNER.sql
9️⃣  Pega en cliente y ejecuta
    ↳ Verifica: "CLINIC_OWNER = 200 permisos"
    
🔟 Copia contenido de SYNC_5_VERIFY_PERMISSIONS.sql
1️⃣1️⃣ Pega en cliente y ejecuta
    ↳ Revisa "Reporte Final de Sincronización"
    ↳ Busca: "✓ SINCRONIZADO"
```

---

## ✅ Validación Post-Ejecución

Después de ejecutar todos los scripts, verifica:

### 1. Recuento General
```sql
SELECT COUNT(*) FROM permissions;
-- Resultado esperado: ~200
```

### 2. CLINIC_OWNER Permisos
```sql
SELECT COUNT(DISTINCT rp.permission_id)
FROM role_permissions rp
JOIN roles r ON rp.role_id = r.id
WHERE r.code = 'CLINIC_OWNER';
-- Resultado esperado: ~200
```

### 3. Comparativa
```sql
SELECT
  (SELECT COUNT(*) FROM permissions) as total_sistema,
  (SELECT COUNT(DISTINCT rp.permission_id)
   FROM role_permissions rp
   JOIN roles r ON rp.role_id = r.id
   WHERE r.code = 'CLINIC_OWNER') as clinic_owner;
-- Resultado esperado: Ambos ~200 (iguales)
```

### 4. Integridad de Datos
```sql
-- Debe retornar 0 duplicados
SELECT COUNT(*)
FROM (
  SELECT role_id, permission_id, COUNT(*)
  FROM role_permissions
  GROUP BY role_id, permission_id
  HAVING COUNT(*) > 1
) dup;
```

---

## 🔙 Rollback (En Caso de Error)

Si algo sale mal, tienes dos opciones:

### Opción A: Rollback Automático
Cada script termina con:
```sql
COMMIT;
-- ROLLBACK;  ← Descomenta para revertir
```

Si algo falla durante la ejecución, la transacción se revierte automáticamente.

### Opción B: Rollback Manual (Desde Script)
Si ya ejecutaste los scripts:

```sql
-- 1. Vaciar role_permissions
DELETE FROM role_permissions WHERE role_id IN (
  SELECT id FROM roles WHERE code = 'CLINIC_OWNER'
);

-- 2. Vaciar permissions
DELETE FROM permissions;

-- 3. Restaurar de backup (si tienes)
-- O ejecutar scripts nuevamente
```

---

## 📝 Cambios Principales en Code

### Backend Controllers
Todos los decoradores ya fueron actualizados:
```typescript
// ANTES:
@RequirePermission('visits:view_medical_history')

// DESPUÉS:
@RequirePermission('ehr:medical_history:read')
```

### Permisos EHR Completos Ahora
El sistema tiene cobertura COMPLETA de:
- ✅ medical_visits (crear, leer, editar, firmar)
- ✅ Diagnósticos (CRUD)
- ✅ Prescripciones (CRUD + firma + cancelar)
- ✅ Vacunaciones (CRUD)
- ✅ Alergias (CRUD)
- ✅ Órdenes diagnósticas (CRUD)
- ✅ Procedimientos (crear, leer)
- ✅ Seguimiento (crear, leer)
- ✅ Historial médico (lectura)
- ✅ EHR nuevo sistema (CRUD completo)
- ✅ Firmas digitales (crear, leer, verificar, revocar)
- ✅ Adjuntos (CRUD + descarga)
- ✅ Analytics (reportes, export, tendencias)

---

## 🚨 Puntos Críticos a Recordar

1. **Orden de Ejecución**
   - No saltes scripts ni los ejecutes fuera de orden
   - Script 2 REQUIERE que Script 1 haya completado
   - Script 3 REQUIERE que Script 2 haya completado

2. **CLINIC_OWNER es Especial**
   - Recibe TODOS los ~200 permisos
   - Otros roles pueden configurarse después independientemente
   - No es automático - Script 4 lo hace explícitamente

3. **Integridad de Datos**
   - Script 2 ELIMINA todas las asignaciones previas
   - Script 3 es el único con inserciones grandes
   - Script 4 usa ON CONFLICT para evitar duplicados

4. **Reversibilidad**
   - Scripts 1-4 son reversibles
   - Ejecutar Script 2 nuevamente borra permisos insertados
   - Guardar backup antes para máxima seguridad

---

## 🎓 Resumen Técnico

**Problema Original:**
- BD tenía 238 permisos, 149 sin uso
- roles-permissions.const.ts define ~200 como "fuente de verdad"
- CLINIC_OWNER faltaban 34 permisos de 304

**Solución:**
1. DELETE role_permissions (rompe todas las asignaciones)
2. DELETE permissions (borra permisos antiguos/huérfanos)
3. INSERT desde roles-permissions.const.ts (~200 permisos)
4. INSERT role_permissions para CLINIC_OWNER (todos)
5. VERIFY (valida integridad)

**Resultado:**
- Sistema limpio, sincronizado, basado en código
- Fácil de mantener (cambiar const → ejecutar scripts)
- CLINIC_OWNER tiene acceso completo
- Otras roles pueden configurarse después

---

## 📞 Soporte & Troubleshooting

**¿Qué hacer si...?**

| Problema | Solución |
|----------|----------|
| Script falla con error | Revisa mensaje de error, ejecuta ROLLBACK; manualmente |
| Después de Script 1: role_permissions no está vacío | Ejecuta Script 1 de nuevo |
| Después de Script 2: permissions no está vacío | Ejecuta Script 2 de nuevo |
| CLINIC_OWNER no tiene ~200 permisos después | Revisa si roles.CLINIC_OWNER existe; ejecuta Script 4 de nuevo |
| Duplicados detectados en Script 5 | Ejecuta Script 1 y luego Script 4 nuevamente |
| Base de datos corrupta | Restaurar desde backup, ejecutar todos los scripts en orden |

---

## 📅 Información de Ejecución

- **Fecha de Generación:** 2024-03-24
- **Basado en:** `roles-permissions.const.ts` (lines 1-800+)
- **Permisos Totales:** ~200
- **Categorías:** 18
- **Roles Afectados:** 5 (SUPER_ADMIN, CLINIC_OWNER, CLINIC_STAFF, CLINIC_STYLIST, CLINIC_VETERINARIAN)
- **Focus Inicial:** CLINIC_OWNER con todos los permisos
- **Tiempo Total Estimado:** 5-10 segundos

---

**✨ Sincronización lista. Próxima ejecución: Script 1 (DELETE role_permissions)**