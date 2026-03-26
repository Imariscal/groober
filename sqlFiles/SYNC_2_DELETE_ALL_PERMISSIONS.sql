-- ============================================================================
-- SCRIPT 2: LIMPIEZA - ELIMINAR TODOS LOS PERMISOS OBSOLETOS
-- ============================================================================
-- Descripción: Elimina TODOS los permisos de la tabla permissions
--              Prepara la BD para insertar permisos nuevos/limpios
-- Impacto: Pizarra limpia (clean slate) para inserción nueva
-- Reversible: Sí (si guardaste un backup)
-- Fecha: 2026-03-24
-- NOTA: Ejecutar después de SYNC_1
-- ============================================================================

BEGIN TRANSACTION;

-- ============================================================================
-- CONTAR PERMISOS ANTES DE ELIMINAR
-- ============================================================================

SELECT 
  'PERMISOS EN BD (ANTES)' as metrica,
  COUNT(*) as cantidad
FROM permissions;

-- Verificar que role_permissions está vacía (requisito)
SELECT 
  'ASIGNACIONES EN BD' as metrica,
  COUNT(*) as cantidad
FROM role_permissions;

-- ============================================================================
-- ELIMINAR TODOS LOS PERMISOS ANTIGUOS/OBSOLETOS
-- ============================================================================

DELETE FROM permissions;

-- ============================================================================
-- VERIFICAR DESPUÉS DE ELIMINAR
-- ============================================================================

SELECT 
  'PERMISOS EN BD (DESPUÉS)' as metrica,
  COUNT(*) as cantidad
FROM permissions;

SELECT 
  'ASIGNACIONES EN BD' as metrica,
  COUNT(*) as cantidad
FROM role_permissions;

-- Si ambos conteos son 0, la limpieza fue exitosa

COMMIT;

-- ============================================================================
-- ROLLBACK MANUAL (si necesitas revertir después de ejecutar COMMIT)
-- ============================================================================
-- Para revertir DESPUÉS de que se ejecutó: 
-- Restaura desde backup
-- ROLLBACK;
