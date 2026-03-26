-- ============================================================================
-- ASIGNAR TODOS LOS PERMISOS A CLINIC_OWNER
-- ============================================================================
-- Descripción: Asigna TODOS los permisos del sistema a CLINIC_OWNER
-- El dueño de clínica debe tener acceso completo a todo
--
-- IMPORTANTE: Script de MODIFICACIÓN - Usa transacción para seguridad
-- Fecha: 2026-03-24
-- ============================================================================

BEGIN TRANSACTION;

-- Guardar registro de la acción
CREATE TEMP TABLE asignacion_log AS
SELECT 
  r.id as role_id,
  r.code as role_code,
  COUNT(p.id) as permisos_a_asignar,
  NOW() as timestamp
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'CLINIC_OWNER'
  AND p.id NOT IN (
    SELECT rp.permission_id 
    FROM role_permissions rp
    WHERE rp.role_id = r.id
  )
GROUP BY r.id, r.code;

-- Ver cuántos permisos se van a asignar
SELECT 
  role_code as "Rol",
  permisos_a_asignar as "Permisos a Asignar",
  timestamp as "Timestamp"
FROM asignacion_log;

-- ============================================================================
-- ASIGNAR LOS PERMISOS FALTANTES
-- ============================================================================

INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  r.id as role_id,
  p.id as permission_id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'CLINIC_OWNER'
  AND p.id NOT IN (
    SELECT rp.permission_id 
    FROM role_permissions rp
    WHERE rp.role_id = r.id
  )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- VERIFICAR RESULTADO
-- ============================================================================

SELECT 
  r.code as "Rol",
  COUNT(DISTINCT rp.permission_id) as "Total Permisos Asignados",
  (SELECT COUNT(*) FROM permissions) as "Total en BD",
  (SELECT COUNT(*) FROM permissions) - COUNT(DISTINCT rp.permission_id) as "Faltantes"
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
WHERE r.code = 'CLINIC_OWNER'
GROUP BY r.code;

-- ============================================================================
-- LISTADO DE PERMISOS ASIGNADOS A CLINIC_OWNER (con categorías)
-- ============================================================================

SELECT 
  p.category as "Categoría",
  COUNT(*) as "Cantidad",
  STRING_AGG(p.code, ', ' ORDER BY p.code) as "Códigos"
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.code = 'CLINIC_OWNER'
GROUP BY p.category
ORDER BY COUNT(*) DESC;

-- ============================================================================
-- CONFIRMACIÓN: Sin conflictos esperados
-- ============================================================================

COMMIT;

-- ============================================================================
-- EN CASO DE ERROR O QUERER REVERTIR:
-- ============================================================================
-- ROLLBACK;
