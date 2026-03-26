# 🚀 GUÍA DE EJECUCIÓN - SINCRONIZACIÓN DE PERMISOS EN BD

## 📁 Archivos Listos para Ejecutar

Todos los scripts están en: `sqlFiles/`

### Scripts Completos (5 archivos):

1. ✅ `SYNC_1_DELETE_ALL_ROLE_PERMISSIONS.sql` → 87 líneas
2. ✅ `SYNC_2_DELETE_ALL_PERMISSIONS.sql` → 47 líneas
3. ✅ `SYNC_3_INSERT_ALL_PERMISSIONS.sql` → 436 líneas (180 permisos)
4. ✅ `SYNC_4_ASSIGN_CLINIC_OWNER.sql` → 85 líneas
5. ✅ `SYNC_5_VERIFY_PERMISSIONS.sql` → 160 líneas (lectura, no modifica)

---

## 🔧 PARTE 1: PREPARAR CONEXIÓN A BD

### Opción A: DBeaver (Recomendado)

```
1. Abre DBeaver
2. Conecta a tu BD VibraLive (PostgreSQL)
3. Abre una pestaña de SQL Query
4. Continúa con "PARTE 2"
```

### Opción B: pgAdmin

```
1. Abre pgAdmin en navegador
2. Selecciona DB VibraLive
3. Abre "Query Tool"
4. Continúa con "PARTE 2"
```

### Opción C: Terminal (psql)

```bash
psql -U tu_usuario -d vibralive -h localhost
```

---

## 🏃 PARTE 2: EJECUTAR EN ORDEN

### PASO 1️⃣: Ejecutar SYNC_1 (DELETE role_permissions)

**Archivo:** `SYNC_1_DELETE_ALL_ROLE_PERMISSIONS.sql`

**En DBeaver/pgAdmin:**
```
1. Abre el archivo SYNC_1_DELETE_ALL_ROLE_PERMISSIONS.sql
2. Selecciona TODO el contenido (Ctrl+A)
3. Ejecuta (Ctrl+Enter o botón ejecutar)
4. Espera a que termine
5. Verifica resultado: "DESPUÉS DE LIMPIEZA" = 0 rows
```

**Espera resultante:**
```
ANTES DE LIMPIEZA: X rows (X = número de asignaciones que había)
DESPUÉS DE LIMPIEZA: 0 rows ✓
```

---

### PASO 2️⃣: Ejecutar SYNC_2 (DELETE permissions)

**Archivo:** `SYNC_2_DELETE_ALL_PERMISSIONS.sql`

**En DBeaver/pgAdmin:**
```
1. Abre el archivo SYNC_2_DELETE_ALL_PERMISSIONS.sql
2. Selecciona TODO el contenido (Ctrl+A)
3. Ejecuta (Ctrl+Enter o botón ejecutar)
4. Espera a que termine
5. Verifica resultado: ambos conteos = 0
```

**Espera resultante:**
```
PERMISOS EN BD (ANTES): Y rows (Y = número de permisos que había)
ASIGNACIONES EN BD: 0 rows
PERMISOS EN BD (DESPUÉS): 0 rows ✓
ASIGNACIONES EN BD: 0 rows ✓
```

---

### PASO 3️⃣: Ejecutar SYNC_3 (INSERT 180 permisos)

**Archivo:** `SYNC_3_INSERT_ALL_PERMISSIONS.sql`

**En DBeaver/pgAdmin:**
```
1. Abre el archivo SYNC_3_INSERT_ALL_PERMISSIONS.sql
2. Selecciona TODO el contenido (Ctrl+A)
3. Ejecuta (Ctrl+Enter o botón ejecutar)
4. Esto puede tomar 3-5 segundos
5. Verifica resultado: ~180 permisos insertados
```

**Espera resultante:**
```
Categoría | Cantidad
======================
Expediente Médico    | 67
POS                  | 17
Plataforma           | 19
... (todas las categorías)
======================
TOTAL | 180 ✓
```

---

### PASO 4️⃣: Ejecutar SYNC_4 (ASSIGN a CLINIC_OWNER)

**Archivo:** `SYNC_4_ASSIGN_CLINIC_OWNER.sql`

**En DBeaver/pgAdmin:**
```
1. Abre el archivo SYNC_4_ASSIGN_CLINIC_OWNER.sql
2. Selecciona TODO el contenido (Ctrl+A)
3. Ejecuta (Ctrl+Enter o botón ejecutar)
4. Esto toma ~1-2 segundos
5. Verifica resultado: CLINIC_OWNER = 180 permisos
```

**Espera resultante:**
```
Comparativa:
  Permisos totales: 180
  CLINIC_OWNER asignados: 180
  Estado: ✓ SINCRONIZADO

Desglose CLINIC_OWNER por Categoría:
  Expediente Médico: 67
  POS: 17
  ...
  TOTAL: 180 ✓
```

---

### PASO 5️⃣: Ejecutar SYNC_5 (VERIFY - Validación)

**Archivo:** `SYNC_5_VERIFY_PERMISSIONS.sql`

⚠️ **ESTE SCRIPT NO MODIFICA NADA** - Solo lectura y validación

**En DBeaver/pgAdmin:**
```
1. Abre el archivo SYNC_5_VERIFY_PERMISSIONS.sql
2. Selecciona TODO el contenido (Ctrl+A)
3. Ejecuta (Ctrl+Enter o botón ejecutar)
4. Revisa los 10 reportes distintos
5. Busca "✓ SINCRONIZADO" en el reporte final
```

**Busca estas líneas en resultado (ÉXITO):**
```
SINCRONIZACIÓN LIMPIA DE PERMISOS:
────────────────────────────────
Total Permisos Insertados: 180
Categorías: 19
CLINIC_OWNER Asignados: 180
Estado Sincronización: ✓ SINCRONIZADO
Integridad: ✓ Sin duplicados
Validación Campos: ✓ Todos campos válidos
```

---

## ⏱️ Tiempo Total Estimado

| Script | Tiempo | Descripción |
|--------|--------|-------------|
| SYNC_1 | ~1 seg | Elimina asignaciones |
| SYNC_2 | ~1 seg | Elimina permisos |
| SYNC_3 | ~3 seg | Inserta 180 permisos |
| SYNC_4 | ~2 seg | Asigna a CLINIC_OWNER |
| SYNC_5 | ~2 seg | Verifica integridad |
| **TOTAL** | **~9 seg** | Sincronización completa |

---

## ✅ Checklist de Verificación

Después de ejecutar todos los scripts:

```
[ ] SYNC_1: role_permissions vacía (0 rows)
[ ] SYNC_2: permissions vacía (0 rows)
[ ] SYNC_3: 180 permisos insertados
[ ] SYNC_4: CLINIC_OWNER tiene 180 permisos
[ ] SYNC_5: Sin duplicados
[ ] SYNC_5: Todos campos válidos (NOT NULL)
[ ] SYNC_5: Estado = "✓ SINCRONIZADO"
```

---

## 🆘 Si Algo Sale Mal

### Error en SYNC_1 o SYNC_2

```sql
-- Verifica que no hay restricciones de clave foránea bloqueando:
SELECT constraint_name 
FROM information_schema.table_constraints 
WHERE table_name = 'role_permissions';
```

### Error en SYNC_3 (Permisos duplicados)

```sql
-- Verifica duplicados:
SELECT code, COUNT(*) 
FROM permissions 
GROUP BY code 
HAVING COUNT(*) > 1;
```

### CLINIC_OWNER no tiene 180 permisos después de SYNC_4

```sql
-- Verifica si CLINIC_OWNER existe:
SELECT id, code, name FROM roles WHERE code = 'CLINIC_OWNER';

-- Verifica cuántos permisos tiene asignados:
SELECT COUNT(DISTINCT permission_id) 
FROM role_permissions rp
JOIN roles r ON rp.role_id = r.id
WHERE r.code = 'CLINIC_OWNER';
```

---

## 📝 Ejemplo Completo (Paso-a-Paso)

Si usas DBeaver:

```
1. Click en "SQL Editor" → "New SQL Script"
2. Copy & paste contenido de SYNC_1
3. Press Ctrl+Enter (o click execute)
4. Ver resultado: "DESPUÉS DE LIMPIEZA: 0"
5. Cerrar tab
6. Repetir pasos 1-5 con SYNC_2, SYNC_3, SYNC_4, SYNC_5
```

---

## 🎯 Resultado Final Esperado

**Base de datos limpia y sincronizada:**
- ✅ 180 permisos únicos en BD
- ✅ CLINIC_OWNER con acceso completo (180 permisos)
- ✅ Otros roles pueden configurarse después
- ✅ Sin datos huérfanos u obsoletos
- ✅ Sistema basado en roles-permissions.const.ts (fuente única de verdad)

---

**¿Listo para ejecutar? Los 5 archivos están listos en `/sqlFiles/`**

Comienza con SYNC_1 → SYNC_2 → SYNC_3 → SYNC_4 → SYNC_5
