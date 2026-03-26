-- ============================================================================
-- SCRIPT: INSERTAR PERMISOS DE VACCINES
-- ============================================================================
-- Objetivo: 
-- 1. Insertar SOLO los permisos nuevos para vaccines:create, vaccines:read, etc.
-- 2. Asignar permisos de vaccines a roles existentes
-- 3. No afectar ningún otro permiso (append mode)
--
-- Formato estándar: vaccines:create, vaccines:read, vaccines:update, etc.
-- Fecha: 2026-03-24
-- ============================================================================

BEGIN TRANSACTION;

-- ============================================================================
-- PASO 1: VER ESTADO ANTES DE LA INSERCIÓN
-- ============================================================================

SELECT '=== ESTADO ANTES ===' as paso;
SELECT COUNT(*) as total_permisos FROM permissions;
SELECT COUNT(*) as permisos_vaccines_actuales FROM permissions WHERE code LIKE 'vaccines:%';

-- ============================================================================
-- PASO 2: VERIFICAR ROLES DISPONIBLES
-- ============================================================================

SELECT '=== ROLES DISPONIBLES ===' as paso;
SELECT code, name FROM roles WHERE code IN ('CLINIC_OWNER', 'CLINIC_VETERINARIAN', 'RECEPTIONIST');

-- ============================================================================
-- PASO 3: INSERTAR SOLO PERMISOS DE VACCINES
-- ============================================================================

-- VACCINE CATALOG - NUEVO
INSERT INTO permissions (code, name, description, category)
VALUES
  ('vaccines:create', 'Crear vacunas en catálogo', 'Crear vacuna', 'Catálogo de Vacunas'),
  ('vaccines:read', 'Ver catálogo de vacunas', 'Ver catálogo', 'Catálogo de Vacunas'),
  ('vaccines:update', 'Editar vacunas en catálogo', 'Editar vacuna', 'Catálogo de Vacunas'),
  ('vaccines:delete', 'Eliminar vacunas del catálogo', 'Eliminar vacuna', 'Catálogo de Vacunas'),
  ('vaccines:activate', 'Activar vacunas', 'Activar', 'Catálogo de Vacunas'),
  ('vaccines:deactivate', 'Desactivar vacunas', 'Desactivar', 'Catálogo de Vacunas')
ON CONFLICT (code) DO NOTHING;

SELECT 'Insertados: Permisos de VACCINES ✓' as paso;

-- ============================================================================
-- PASO 4: ASIGNAR PERMISOS DE VACCINES A ROLES
-- ============================================================================

-- ASIGNAR A CLINIC_OWNER: Todos los permisos de vaccines
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  r.id,
  p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'CLINIC_OWNER'
  AND p.code LIKE 'vaccines:%'
ON CONFLICT DO NOTHING;

SELECT 'Asignados: Permisos de vaccines a CLINIC_OWNER' as paso;

-- ASIGNAR A CLINIC_VETERINARIAN: Permisos de vaccines
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  r.id,
  p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'CLINIC_VETERINARIAN'
  AND p.code LIKE 'vaccines:%'
ON CONFLICT DO NOTHING;

SELECT 'Asignados: Permisos de vaccines a CLINIC_VETERINARIAN' as paso;

-- ASIGNAR A RECEPTIONIST: Solo lectura de vaccines
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  r.id,
  p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'RECEPTIONIST'
  AND p.code IN ('vaccines:read')
ON CONFLICT DO NOTHING;

SELECT 'Asignados: Permisos de vaccines a RECEPTIONIST (lectura)' as paso;

-- ============================================================================
-- PASO 5: VERIFICACIÓN FINAL
-- ============================================================================

SELECT '=== VERIFICACIÓN FINAL ===' as paso;

SELECT 
  'Permisos de VACCINES creados' as descripción,
  COUNT(*) as cantidad
FROM permissions
WHERE code LIKE 'vaccines:%';

SELECT '=== PERMISOS DE VACCINES ===' as paso;
SELECT 
  code,
  name,
  category
FROM permissions
WHERE code LIKE 'vaccines:%'
ORDER BY code;

SELECT '=== ASIGNACIÓN A ROLES ===' as paso;
SELECT 
  r.code as role,
  COUNT(rp.permission_id) as total_vaccines_asignados
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id
WHERE r.code IN ('CLINIC_OWNER', 'CLINIC_VETERINARIAN', 'RECEPTIONIST')
  AND p.code LIKE 'vaccines:%'
GROUP BY r.id, r.code
ORDER BY r.code;

-- ============================================================================
-- CONFIRMACIÓN Y COMMIT
-- ============================================================================

SELECT '✓ SCRIPT COMPLETADO - Presión COMMIT para guardar cambios' as resultado;

COMMIT;

-- ============================================================================
-- EN CASO DE ERROR, DESCOMENTA ROLLBACK:
-- ============================================================================
-- ROLLBACK;
