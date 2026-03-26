-- ============================================================================
-- SCRIPT 4: ASIGNAR - TODOS LOS PERMISOS A CLINIC_OWNER
-- ============================================================================
-- Descripción: Asigna TODOS los permisos nuevamente insertados a CLINIC_OWNER
-- Dependencias: Script 3 debe haber ejecutado exitosamente (permisos insertados)
-- Fecha: 2026-03-24
-- ============================================================================

BEGIN TRANSACTION;

-- Obtener el ID de CLINIC_OWNER role
-- Nota: Si falla aquí, significa que el role no existe en la tabla roles
WITH clinic_owner_role AS (
  SELECT id, name
  FROM roles
  WHERE code = 'CLINIC_OWNER'
  LIMIT 1
)
-- Verificar que CLINIC_OWNER existe
SELECT 
  'CLINIC_OWNER found' as status,
  id as role_id,
  name as role_name
FROM clinic_owner_role;

-- ============================================================================
-- ASIGNAR TODOS LOS PERMISOS A CLINIC_OWNER
-- ============================================================================
INSERT INTO role_permissions (id, role_id, permission_id)
SELECT
  gen_random_uuid(),
  (SELECT id FROM roles WHERE code = 'CLINIC_OWNER' LIMIT 1) as role_id,
  id as permission_id
FROM permissions
ON CONFLICT (role_id, permission_id) DO NOTHING;  -- Si ya existe, ignorar

-- ============================================================================
-- VERIFICACIÓN POST-INSERCIÓN
-- ============================================================================

-- 1. Contar cuántos permisos tiene CLINIC_OWNER ahora
SELECT
  'CLINIC_OWNER' as role,
  COUNT(DISTINCT rp.permission_id) as total_permissions
FROM role_permissions rp
JOIN roles r ON rp.role_id = r.id
WHERE r.code = 'CLINIC_OWNER'
GROUP BY r.code;

-- 2. Comparar con el total de permisos disponibles
SELECT
  'Comparativa' as tipo,
  (SELECT COUNT(*) FROM permissions) as permisos_totales,
  (SELECT COUNT(DISTINCT rp.permission_id) 
   FROM role_permissions rp 
   JOIN roles r ON rp.role_id = r.id 
   WHERE r.code = 'CLINIC_OWNER') as clinic_owner_tiene,
  CASE 
    WHEN (SELECT COUNT(*) FROM permissions) = 
         (SELECT COUNT(DISTINCT rp.permission_id) 
          FROM role_permissions rp 
          JOIN roles r ON rp.role_id = r.id 
          WHERE r.code = 'CLINIC_OWNER')
    THEN 'SINCRONIZADO ✓'
    ELSE 'DIFERENCIA DETECTADA ✗'
  END as estado;

-- 3. Desglose de CLINIC_OWNER por categoría
SELECT
  p.category as "Categoría",
  COUNT(DISTINCT rp.permission_id) as "Permisos CLINIC_OWNER"
FROM role_permissions rp
JOIN roles r ON rp.role_id = r.id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.code = 'CLINIC_OWNER'
GROUP BY p.category
ORDER BY COUNT(DISTINCT rp.permission_id) DESC;

-- 4. Listar todos los permisos de CLINIC_OWNER (primeros 20 para verificación)
SELECT
  p.code as "Código",
  p.name as "Nombre",
  p.category as "Categoría",
  p.description as "Descripción"
FROM role_permissions rp
JOIN roles r ON rp.role_id = r.id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.code = 'CLINIC_OWNER'
ORDER BY p.category, p.code
LIMIT 20;

-- ============================================================================
-- SI REQUIERES VERIFICAR TODOS LOS PERMISOS DE CLINIC_OWNER, EJECUTA:
-- ============================================================================
/*
SELECT
  p.code,
  p.category
FROM role_permissions rp
JOIN roles r ON rp.role_id = r.id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.code = 'CLINIC_OWNER'
ORDER BY p.category, p.code;
*/

COMMIT;

-- ============================================================================
-- ROLLBACK EN CASO DE ERROR
-- ============================================================================
-- ROLLBACK;