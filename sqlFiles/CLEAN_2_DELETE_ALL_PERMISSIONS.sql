-- ============================================================================
-- SCRIPT 2: LIMPIAR - ELIMINAR TODOS LOS PERMISSIONS
-- ============================================================================
-- Descripción: Elimina TODOS los permisos de la tabla permissions
-- IMPORTANTE: Solo ejecutar DESPUÉS de eliminar role_permissions
-- Fecha: 2026-03-24
-- ============================================================================

BEGIN TRANSACTION;

-- Ver cuántos se van a eliminar
SELECT 
  'ELIMINANDO' as operacion,
  COUNT(*) as cantidad,
  COUNT(DISTINCT category) as categorias
FROM permissions;

-- ELIMINAR todos los permissions
DELETE FROM permissions;

-- Verificar resultado
SELECT 
  'RESULTADO' as operacion,
  COUNT(*) as permissions_restantes
FROM permissions;

-- Si llegó a 0, la eliminación fue exitosa
-- Resultado esperado: 0 registros

COMMIT;

-- ============================================================================
-- ROLLBACK EN CASO DE ERROR
-- ============================================================================
-- ROLLBACK;