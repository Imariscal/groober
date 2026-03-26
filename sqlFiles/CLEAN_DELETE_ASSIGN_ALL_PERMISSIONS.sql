-- ============================================================================
-- SCRIPT COMBINADO: ELIMINAR ROLE_PERMISSIONS Y ASIGNAR TODOS LOS 304 
-- ============================================================================
-- Descripción: 
--   1. Elimina TODOS los role_permissions (tabla limpia)
--   2. Asigna LOS 304 PERMISOS A CLINIC_OWNER
-- 
-- Resultado esperado: CLINIC_OWNER tendrá exactamente 304 permisos
-- ============================================================================

BEGIN TRANSACTION;

-- ============================================================================
-- PARTE 1: ESTADO INICIAL
-- ============================================================================

SELECT '==== ESTADO INICIAL ====' as fase;

SELECT 
  'Total permissions en BD' as metrica,
  COUNT(*) as cantidad
FROM permissions;

SELECT 
  'Total role_permissions ANTES de limpiar' as metrica,
  COUNT(*) as cantidad
FROM role_permissions;

-- Permisos actuales por rol
SELECT 
  r.code as "Rol",
  COUNT(rp.permission_id) as "Permisos Actuales"
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
GROUP BY r.id, r.code
ORDER BY r.code;

-- ============================================================================
-- PARTE 2: ELIMINAR TODOS LOS ROLE_PERMISSIONS
-- ============================================================================

SELECT '==== ELIMINANDO role_permissions ====' as fase;

DELETE FROM role_permissions;

SELECT 
  'role_permissions eliminados' as resultado,
  COUNT(*) as cantidad_restante
FROM role_permissions;

-- ============================================================================
-- PARTE 3: ASIGNAR LOS 304 PERMISOS A CLINIC_OWNER
-- ============================================================================

SELECT '==== ASIGNANDO 304 PERMISOS A CLINIC_OWNER ====' as fase;

INSERT INTO role_permissions (id, role_id, permission_id)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM roles WHERE code = 'CLINIC_OWNER'),
  id
FROM permissions
ORDER BY id;

-- ============================================================================
-- PARTE 4: VERIFICACIÓN FINAL
-- ============================================================================

SELECT '==== VERIFICACIÓN FINAL ====' as fase;

-- Total de permisos asignados a CLINIC_OWNER
SELECT 
  'Total PERMISOS CLINIC_OWNER después de asignación' as metrica,
  COUNT(*) as cantidad
FROM role_permissions rp
JOIN roles r ON rp.role_id = r.id
WHERE r.code = 'CLINIC_OWNER';

-- Verificar que es exactamente 304
SELECT 
  CASE 
    WHEN COUNT(*) = 304 THEN '✓ CORRECTO: 304 permisos asignados'
    ELSE '✗ ERROR: Permisos asignados = ' || COUNT(*)
  END as "Estado Verificación"
FROM role_permissions rp
JOIN roles r ON rp.role_id = r.id
WHERE r.code = 'CLINIC_OWNER';

-- Permisos por rol según tabla total
SELECT 
  r.code as "Rol",
  COUNT(rp.permission_id) as "Total Permisos Asignados"
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
GROUP BY r.id, r.code
ORDER BY r.code;

-- Resumen de categorías en CLINIC_OWNER
SELECT 
  'CLINIC_OWNER - Permisos por Categoría' as "Análisis",
  SUBSTRING(p.code FROM 1 FOR POSITION(':' IN p.code) - 1) as "Categoría",
  COUNT(*) as "Cantidad"
FROM role_permissions rp
JOIN roles r ON rp.role_id = r.id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.code = 'CLINIC_OWNER'
GROUP BY SUBSTRING(p.code FROM 1 FOR POSITION(':' IN p.code) - 1)
ORDER BY "Categoría";

COMMIT;

-- ============================================================================
-- ROLLBACK EN CASO DE ERROR (DESCOMENTAR SI NECESARIO)
-- ============================================================================
-- ROLLBACK;
