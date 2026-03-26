-- ============================================================================
-- SCRIPT: VERIFICAR Y ASIGNAR TODOS LOS PERMISOS A CLINIC_OWNER
-- ============================================================================
-- Objetivo: Asegurar que CLINIC_OWNER tenga EXACTAMENTE el mismo número
-- de permisos que existen en la tabla permissions
-- ============================================================================

BEGIN TRANSACTION;

-- ============================================================================
-- PASO 1: VERIFICAR CUÁNTOS PERMISOS HAY EN TOTAL
-- ============================================================================

SELECT '=== PASO 1: CONTEO TOTAL DE PERMISOS ===' as paso;

SELECT 
  COUNT(*) as "TOTAL PERMISOS EN BD"
FROM permissions;

-- Almacenar el total
\set total_permisos (SELECT COUNT(*) FROM permissions)

-- ============================================================================
-- PASO 2: VER PERMISOS ACTUALES DE CLINIC_OWNER ANTES
-- ============================================================================

SELECT '=== PASO 2: CLINIC_OWNER ANTES ===' as paso;

SELECT 
  'Permisos de CLINIC_OWNER ANTES' as estado,
  COUNT(*) as cantidad
FROM role_permissions rp
JOIN roles r ON rp.role_id = r.id
WHERE r.code = 'CLINIC_OWNER';

-- ============================================================================
-- PASO 3: ELIMINAR TODOS LOS ROLE_PERMISSIONS
-- ============================================================================

SELECT '=== PASO 3: ELIMINAR TODOS role_permissions ===' as paso;

DELETE FROM role_permissions;

SELECT 
  'role_permissions eliminados' as resultado,
  COUNT(*) as "Quedan en tabla" 
FROM role_permissions;

-- ============================================================================
-- PASO 4: ASIGNAR TODOS LOS PERMISOS A CLINIC_OWNER
-- ============================================================================

SELECT '=== PASO 4: ASIGNAR TODOS LOS PERMISOS ===' as paso;

INSERT INTO role_permissions (id, role_id, permission_id)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM roles WHERE code = 'CLINIC_OWNER'),
  id
FROM permissions;

SELECT 
  'Permisos insertados en role_permissions' as resultado;

-- ============================================================================
-- PASO 5: VERIFICACIÓN FINAL - CIFRAS DEBEN COINCIDIR
-- ============================================================================

SELECT '=== PASO 5: VERIFICACIÓN FINAL ===' as paso;

-- Total de permisos en tabla permissions
SELECT 
  COUNT(*) as "TOTAL EN TABLA PERMISSIONS"
FROM permissions;

-- Total de permisos asignados a CLINIC_OWNER
SELECT 
  COUNT(*) as "TOTAL ASIGNADOS A CLINIC_OWNER"
FROM role_permissions rp
JOIN roles r ON rp.role_id = r.id
WHERE r.code = 'CLINIC_OWNER';

-- COMPARACIÓN DIRECTA
WITH totales AS (
  SELECT 
    (SELECT COUNT(*) FROM permissions) as total_permisos,
    (SELECT COUNT(*) FROM role_permissions rp 
     JOIN roles r ON rp.role_id = r.id 
     WHERE r.code = 'CLINIC_OWNER') as clinic_owner_permisos
)
SELECT 
  total_permisos,
  clinic_owner_permisos,
  CASE 
    WHEN total_permisos = clinic_owner_permisos THEN '✓ CORRECTO: Los números coinciden'
    ELSE '✗ ERROR: No coinciden. Diferencia = ' || (total_permisos - clinic_owner_permisos)
  END as "RESULTADO"
FROM totales;

-- Vista desglosada por rol
SELECT 
  r.code as "Rol",
  COUNT(rp.permission_id) as "Permisos Asignados"
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
GROUP BY r.id, r.code
ORDER BY r.code;

-- ============================================================================
-- PASO 6: MUESTREO DE PERMISOS ASIGNADOS
-- ============================================================================

SELECT '=== PASO 6: MUESTRA DE PERMISOS (primeros 20) ===' as paso;

SELECT 
  p.code as "Código Permiso",
  p.description as "Descripción"
FROM role_permissions rp
JOIN roles r ON rp.role_id = r.id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.code = 'CLINIC_OWNER'
ORDER BY p.code
LIMIT 20;

COMMIT;

-- ============================================================================
-- ROLLBACK EN CASO DE ERROR
-- ============================================================================
-- ROLLBACK;
