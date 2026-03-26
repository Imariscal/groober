-- ============================================================================
-- SCRIPT 5: VERIFICACIÓN - ESTADO FINAL DEL SISTEMA DE PERMISOS
-- ============================================================================
-- Descripción: Valida que la sincronización se completó correctamente
-- Ejecución: Después de ejecutar Scripts 1-4
-- Fecha: 2026-03-24
-- ============================================================================

-- ============================================================================
-- 1. ESTADÍSTICAS GENERALES
-- ============================================================================

SECTION_1: -- Estadísticas Generales

SELECT
  'PERMISOS TOTALES' as métrica,
  COUNT(*) as cantidad
FROM permissions

UNION ALL

SELECT
  'ROLES TOTALES' as métrica,
  COUNT(*) as cantidad
FROM roles

UNION ALL

SELECT
  'CATEGORÍAS DE PERMISOS' as métrica,
  COUNT(DISTINCT category) as cantidad
FROM permissions

UNION ALL

SELECT
  'ASIGNACIONES ROLE_PERMISSIONS' as métrica,
  COUNT(*) as cantidad
FROM role_permissions;

-- ============================================================================
-- 2. PERMISOS POR CATEGORÍA
-- ============================================================================

SECTION_2: -- Permisos por Categoría

SELECT
  category as "Categoría",
  COUNT(*) as "Total Permisos",
  COUNT(DISTINCT code) as "Códigos Únicos"
FROM permissions
GROUP BY category
ORDER BY COUNT(*) DESC;

-- ============================================================================
-- 3. ESTADO DE CADA ROL
-- ============================================================================

SECTION_3: -- Estado de Cada Rol

SELECT
  r.code as "Rol",
  r.name as "Nombre",
  COUNT(DISTINCT rp.permission_id) as "Permisos Asignados"
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
GROUP BY r.id, r.code, r.name
ORDER BY COUNT(DISTINCT rp.permission_id) DESC;

-- ============================================================================
-- 4. AUDIT: CLINIC_OWNER PERMISOS ESPERADOS VS REALES
-- ============================================================================

SECTION_4: -- Audit CLINIC_OWNER

WITH clinic_owner_perms AS (
  SELECT
    p.code,
    p.name,
    p.category,
    p.description
  FROM role_permissions rp
  JOIN roles r ON rp.role_id = r.id
  JOIN permissions p ON rp.permission_id = p.id
  WHERE r.code = 'CLINIC_OWNER'
)
SELECT
  'CLINIC_OWNER' as role,
  (SELECT COUNT(*) FROM permissions) as permisos_sistema,
  (SELECT COUNT(*) FROM clinic_owner_perms) as permisos_asignados,
  CASE 
    WHEN (SELECT COUNT(*) FROM permissions) = (SELECT COUNT(*) FROM clinic_owner_perms)
    THEN '✓ SINCRONIZADO'
    ELSE '✗ DIFERENCIA: ' || 
         ((SELECT COUNT(*) FROM permissions) - (SELECT COUNT(*) FROM clinic_owner_perms))::text ||
         ' faltando'
  END as estado;

-- ============================================================================
-- 5. DESGLOSE CLINIC_OWNER POR CATEGORÍA
-- ============================================================================

SECTION_5: -- Desglose CLINIC_OWNER por Categoría

SELECT
  p.category as "Categoría",
  COUNT(*) as "Permisos"
FROM role_permissions rp
JOIN roles r ON rp.role_id = r.id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.code = 'CLINIC_OWNER'
GROUP BY p.category
ORDER BY COUNT(*) DESC;

-- ============================================================================
-- 6. PERMISOS DUPLICADOS (Validación de Integridad)
-- ============================================================================

SECTION_6: -- Validación de Duplicados

SELECT COUNT(*) as duplicados
FROM (
  SELECT
    rp.role_id,
    rp.permission_id,
    COUNT(*) as cnt
  FROM role_permissions rp
  GROUP BY rp.role_id, rp.permission_id
  HAVING COUNT(*) > 1
) duplicado_check;

-- Si el resultado es 0, no hay duplicados (BIEN)

-- ============================================================================
-- 7. PERMISOS SIN ASIGNAR (Análisis)
-- ============================================================================

SECTION_7: -- Permisos Sin Asignar (No asignados a nadie)

SELECT
  COUNT(*) as "Permisos Sin Asignar",
  STRING_AGG(code, ', ') as "Códigos"
FROM permissions p
WHERE id NOT IN (
  SELECT DISTINCT permission_id FROM role_permissions
);

-- ============================================================================
-- 8. CAMPOS CRÍTICOS NULOS (Validación de Datos)
-- ============================================================================

SECTION_8: -- Validación Campos Nulos

SELECT
  'permissions / code' as "Tabla / Campo",
  COUNT(*) as "Registros Nulos"
FROM permissions
WHERE code IS NULL

UNION ALL

SELECT
  'permissions / name',
  COUNT(*)
FROM permissions
WHERE name IS NULL

UNION ALL

SELECT
  'permissions / category',
  COUNT(*)
FROM permissions
WHERE category IS NULL

UNION ALL

SELECT
  'role_permissions / role_id',
  COUNT(*)
FROM role_permissions
WHERE role_id IS NULL

UNION ALL

SELECT
  'role_permissions / permission_id',
  COUNT(*)
FROM role_permissions
WHERE permission_id IS NULL;

-- Si todos los conteos son 0, la integridad es CORRECTA

-- ============================================================================
-- 9. COMPARATIVA ANTES/DESPUÉS (Si guardaste valores)
-- ============================================================================

SECTION_9: -- Comparativa Antes/Después

SELECT
  'Antes de sincronización' as período,
  0 as análisis
WHERE FALSE  -- Esta query está deshabilitada (sin datos previos)

UNION ALL

SELECT
  'Después de sincronización' as período,
  CASE
    WHEN (SELECT COUNT(*) FROM permissions) > 0 
      AND (SELECT COUNT(DISTINCT rp.permission_id) FROM role_permissions rp
           JOIN roles r ON rp.role_id = r.id
           WHERE r.code = 'CLINIC_OWNER') = (SELECT COUNT(*) FROM permissions)
    THEN 1  -- ÉXITO
    ELSE 0  -- ERROR
  END as análisis;

-- ============================================================================
-- 10. REPORTE FINAL
-- ============================================================================

SECTION_10: -- Reporte Final de Sincronización

WITH stats AS (
  SELECT
    (SELECT COUNT(*) FROM permissions) as total_permisos,
    (SELECT COUNT(DISTINCT category) FROM permissions) as total_categorias,
    (SELECT COUNT(DISTINCT rp.permission_id) 
     FROM role_permissions rp
     JOIN roles r ON rp.role_id = r.id
     WHERE r.code = 'CLINIC_OWNER') as clinic_owner_permisos,
    (SELECT COUNT(*) FROM role_permissions) as total_asignaciones,
    (SELECT COUNT(*) FROM (
      SELECT role_id, permission_id, COUNT(*) FROM role_permissions
      GROUP BY role_id, permission_id HAVING COUNT(*) > 1
    ) as dup) as duplicados,
    (SELECT COUNT(*) FROM permissions 
     WHERE code IS NULL OR name IS NULL OR category IS NULL) as campos_nulos
)
SELECT
  'SINCRONIZACIÓN LIMPIA DE PERMISOS' as "Reporte Final",
  total_permisos as "Total Permisos Insertados",
  total_categorias as "Categorías",
  clinic_owner_permisos as "CLINIC_OWNER Asignados",
  CASE
    WHEN clinic_owner_permisos = total_permisos THEN '✓ SINCRONIZADO'
    ELSE '✗ DESINCRONIZADO - Faltando: ' || (total_permisos - clinic_owner_permisos)::text
  END as "Estado Sincronización",
  CASE
    WHEN duplicados = 0 THEN '✓ Sin duplicados'
    ELSE '✗ ' || duplicados::text || ' duplicados encontrados'
  END as "Integridad",
  total_asignaciones as "Total Asignaciones BD",
  CASE
    WHEN campos_nulos = 0 THEN '✓ Todos campos válidos'
    ELSE '✗ ' || campos_nulos::text || ' campos nulos'
  END as "Validación Campos"
FROM stats;

-- ============================================================================
-- INTERPRETACIÓN DE RESULTADOS
-- ============================================================================
/*

ÉXITO:               Los siguientes indicadores muestran ÉXITO:
✓ Total Permisos     ~200 (todos los permisos de roles-permissions.const.ts insertados)
✓ Sincronización     CLINIC_OWNER tiene TODOS los permisos
✓ Integridad         Sin duplicados en role_permissions
✓ Validación         Todos los campos son NOT NULL

ADVERTENCIAS:        Si ves estos, investiga:
✗ Permisos Faltando  Significa que no se insertaron todos
✗ Desincronizado     CLINIC_OWNER no tiene TODOS los permisos
✗ Duplicados         Hay asignaciones duplicadas (ejecutar limpieza)
✗ Campos Nulos       Hay datos incompletos

ROLLBACK:            Si hay problemas, ejecuta los scripts en orden:
                     1. SYNC_1_DELETE_ALL_ROLE_PERMISSIONS.sql
                     2. SYNC_2_DELETE_ALL_PERMISSIONS.sql
                     3. SYNC_3_INSERT_ALL_PERMISSIONS.sql
                     4. SYNC_4_ASSIGN_CLINIC_OWNER.sql
                     5. VERIFY_PERMISSIONS.sql (este script)

*/