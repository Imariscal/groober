-- ============================================================================
-- SCRIPT: INSERTAR PERMISOS EHR FALTANTES A CLINIC_OWNER
-- ============================================================================
-- Descripción: Asigna los 34 permisos EHR que faltan a CLINIC_OWNER
-- Basado en: Permisos faltantes identificados en roles-permissions.const.ts
-- Fecha: 2026-03-24
-- ============================================================================

BEGIN TRANSACTION;

-- ============================================================================
-- OBTENER ID DE CLINIC_OWNER
-- ============================================================================

-- Verificar que CLINIC_OWNER existe
SELECT 'VERIFICANDO CLINIC_OWNER' as status;
SELECT id, code, name FROM roles WHERE code = 'CLINIC_OWNER';

-- ============================================================================
-- INSERTAR LOS 34 PERMISOS EHR FALTANTES
-- ============================================================================

-- Alergias (4 permisos)
INSERT INTO role_permissions (id, role_id, permission_id)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM roles WHERE code = 'CLINIC_OWNER'),
  id
FROM permissions
WHERE code IN (
  'ehr:allergies:create',
  'ehr:allergies:read',
  'ehr:allergies:update',
  'ehr:allergies:delete'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Analytics (3 permisos)
INSERT INTO role_permissions (id, role_id, permission_id)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM roles WHERE code = 'CLINIC_OWNER'),
  id
FROM permissions
WHERE code IN (
  'ehr:analytics:read',
  'ehr:analytics:export',
  'ehr:analytics:trends'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Adjuntos (4 permisos)
INSERT INTO role_permissions (id, role_id, permission_id)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM roles WHERE code = 'CLINIC_OWNER'),
  id
FROM permissions
WHERE code IN (
  'ehr:attachments:create',
  'ehr:attachments:read',
  'ehr:attachments:delete',
  'ehr:attachments:download'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Diagnósticos (4 permisos)
INSERT INTO role_permissions (id, role_id, permission_id)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM roles WHERE code = 'CLINIC_OWNER'),
  id
FROM permissions
WHERE code IN (
  'ehr:diagnostics:create',
  'ehr:diagnostics:read',
  'ehr:diagnostics:update',
  'ehr:diagnostics:delete'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Historial Médico (4 permisos)
INSERT INTO role_permissions (id, role_id, permission_id)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM roles WHERE code = 'CLINIC_OWNER'),
  id
FROM permissions
WHERE code IN (
  'ehr:medical_history:create',
  'ehr:medical_history:read',
  'ehr:medical_history:update',
  'ehr:medical_history:delete'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Prescripciones (5 permisos)
INSERT INTO role_permissions (id, role_id, permission_id)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM roles WHERE code = 'CLINIC_OWNER'),
  id
FROM permissions
WHERE code IN (
  'ehr:prescriptions:create',
  'ehr:prescriptions:read',
  'ehr:prescriptions:update',
  'ehr:prescriptions:delete',
  'ehr:prescriptions:sign'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Firmas (4 permisos)
INSERT INTO role_permissions (id, role_id, permission_id)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM roles WHERE code = 'CLINIC_OWNER'),
  id
FROM permissions
WHERE code IN (
  'ehr:signatures:create',
  'ehr:signatures:read',
  'ehr:signatures:verify',
  'ehr:signatures:revoke'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Vacunaciones (4 permisos)
INSERT INTO role_permissions (id, role_id, permission_id)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM roles WHERE code = 'CLINIC_OWNER'),
  id
FROM permissions
WHERE code IN (
  'ehr:vaccinations:create',
  'ehr:vaccinations:read',
  'ehr:vaccinations:update',
  'ehr:vaccinations:delete'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Acceso General (2 permisos)
INSERT INTO role_permissions (id, role_id, permission_id)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM roles WHERE code = 'CLINIC_OWNER'),
  id
FROM permissions
WHERE code IN (
  'ehr:read',
  'ehr:manage'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================================================
-- VERIFICAR DESPUÉS DE INSERCIÓN
-- ============================================================================

-- Contar permisos EHR que ahora tiene CLINIC_OWNER
SELECT 
  'PERMISOS EHR ASIGNADOS A CLINIC_OWNER' as metrica,
  COUNT(*) as cantidad
FROM role_permissions rp
JOIN roles r ON rp.role_id = r.id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.code = 'CLINIC_OWNER' 
  AND p.code LIKE 'ehr:%';

-- Listar los 34 permisos EHR asignados
SELECT 
  p.code as "Código",
  p.description as "Descripción",
  'CLINIC_OWNER' as "Rol"
FROM role_permissions rp
JOIN roles r ON rp.role_id = r.id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.code = 'CLINIC_OWNER' 
  AND p.code LIKE 'ehr:%'
ORDER BY p.code;

-- Total general de permisos de CLINIC_OWNER
SELECT 
  'TOTAL PERMISOS CLINIC_OWNER' as metrica,
  COUNT(DISTINCT rp.permission_id) as cantidad
FROM role_permissions rp
JOIN roles r ON rp.role_id = r.id
WHERE r.code = 'CLINIC_OWNER';

COMMIT;

-- ============================================================================
-- ROLLBACK EN CASO DE ERROR
-- ============================================================================
-- ROLLBACK;
