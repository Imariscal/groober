-- ============================================================================
-- SCRIPT 1: LIMPIEZA - ELIMINAR TODAS LAS ASIGNACIONES DE PERMISOS A ROLES
-- ============================================================================
-- Descripción: Elimina TODAS las asignaciones en la tabla role_permissions
--              Mantiene la tabla de permisos intacta (por ahora)
-- Impacto: Las asignaciones se pierden, pero los permisos quedan en BD
-- Reversible: Sí (si guardaste un backup)
-- Fecha: 2026-03-24
-- ============================================================================

BEGIN TRANSACTION;

-- ============================================================================
-- CONTAR ANTES DE ELIMINAR
-- ============================================================================

SELECT 
  'ANTES DE LIMPIEZA' as estado,
  COUNT(*) as total_role_permissions
FROM role_permissions;

-- ============================================================================
-- ELIMINAR TODAS LAS ASIGNACIONES
-- ============================================================================

DELETE FROM role_permissions;

-- ============================================================================
-- VERIFICAR DESPUÉS DE ELIMINAR
-- ============================================================================

SELECT 
  'DESPUÉS DE LIMPIEZA' as estado,
  COUNT(*) as total_role_permissions
FROM role_permissions;

-- Si el resultado es 0, la limpieza fue exitosa
-- Si hay error, la transacción se revierte automáticamente

COMMIT;

-- ============================================================================
-- ROLLBACK MANUAL (si necesitas revertir después de ejecutar COMMIT)
-- ============================================================================
-- Para revertir DESPUÉS de que se ejecutó: 
-- Restaura desde backup o vuelve a ejecutar los scripts completos
-- ROLLBACK;
