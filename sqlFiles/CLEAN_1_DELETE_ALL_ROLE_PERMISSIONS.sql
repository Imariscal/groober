-- ============================================================================
-- SCRIPT 1: LIMPIAR - ELIMINAR TODOS LOS ROLE_PERMISSIONS
-- ============================================================================
-- Descripción: Elimina todas las asignaciones de permisos a roles
-- IMPORTANTE: Ejecutar PRIMERO antes de eliminar permissions
-- Fecha: 2026-03-24
-- ============================================================================

BEGIN TRANSACTION;

-- Guardar log de la operación
CREATE TEMP TABLE cleanup_log AS
SELECT 
  COUNT(*) as total_role_permissions_eliminados,
  NOW() as timestamp
FROM role_permissions;

-- Ver qué se va a eliminar
SELECT 
  'ELIMINANDO' as operacion,
  COUNT(*) as cantidad
FROM role_permissions;

-- ELIMINAR todos los role_permissions
DELETE FROM role_permissions;

-- Verificar resultado
SELECT 
  'RESULTADO' as operacion,
  COUNT(*) as role_permissions_restantes
FROM role_permissions;

-- Si llegó a 0, la eliminación fue exitosa
COMMIT;

-- ============================================================================
-- ROLLBACK EN CASO DE ERROR
-- ============================================================================
-- ROLLBACK;