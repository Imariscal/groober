-- ============================================================================
-- SCRIPT 1: ELIMINAR PERMISOS OBSOLETOS
-- ============================================================================
-- Descripción: Elimina permisos del sistema medico antiguo (medical:* y medical_visits:*)
-- que fueron reemplazados por el nuevo sistema EHR (ehr:*)
-- 
-- IMPORTANTE: Ejecutar DESPUÉS de confirmar que el código no usa estos permisos
-- Fecha: 2026-03-24
-- ============================================================================

BEGIN TRANSACTION;

-- Guardar registro de los permisos que se eliminarán
CREATE TEMP TABLE permisos_a_eliminar AS
SELECT id, code, name, description, category
FROM permissions
WHERE code IN (
  'medical_visits:create',
  'medical_visits:read',
  'medical_visits:update',
  'medical_visits:sign',
  'medical:diagnoses:create',
  'medical:diagnoses:read',
  'medical:diagnoses:update',
  'medical:prescriptions:create',
  'medical:prescriptions:read',
  'medical:prescriptions:update',
  'medical:prescriptions:cancel',
  'medical:vaccinations:create',
  'medical:vaccinations:read',
  'medical:vaccinations:update',
  'medical:allergies:create',
  'medical:allergies:read',
  'medical:allergies:update',
  'medical:diagnostic_orders:create',
  'medical:diagnostic_orders:read',
  'medical:diagnostic_orders:update',
  'medical:procedures:create',
  'medical:procedures:read',
  'medical:follow_ups:create',
  'medical:follow_ups:read',
  'medical:history:read'
);

-- Ver permisos a eliminar
SELECT 
  'PERMISOS A ELIMINAR' as accion,
  COUNT(*) as cantidad,
  STRING_AGG(code, ', ' ORDER BY code) as codigos
FROM permisos_a_eliminar;

-- Eliminar las asignaciones role_permissions primero
DELETE FROM role_permissions rp
WHERE rp.permission_id IN (SELECT id FROM permisos_a_eliminar);

-- Eliminar los permisos
DELETE FROM permissions p
WHERE p.id IN (SELECT id FROM permisos_a_eliminar);

-- Verificar resultado
SELECT 
  'PERMISOS ELIMINADOS' as resultado,
  COUNT(*) as cantidad
FROM permissions
WHERE code IN (
  'medical_visits:create',
  'medical_visits:read',
  'medical_visits:update',
  'medical_visits:sign',
  'medical:diagnoses:create'
);

-- Si el resultado anterior es 0, la eliminación fue exitosa
COMMIT;

-- ============================================================================
-- ROLLBACK EN CASO DE ERROR
-- ============================================================================
-- ROLLBACK;
