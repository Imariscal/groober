-- Script automático para crear permisos POS y asignarlos a CLINIC_OWNER
-- Este script es seguro ejecutar múltiples veces (IDEMPOTENTE)

BEGIN;

-- PASO 1: Crear los permisos si no existen
INSERT INTO permissions (id, name, description, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'pos:sales:create', 'Create sales from appointments', NOW(), NOW()),
  (gen_random_uuid(), 'pos:sales:read', 'Read sales', NOW(), NOW()),
  (gen_random_uuid(), 'pos:sales:update', 'Update draft sales', NOW(), NOW()),
  (gen_random_uuid(), 'pos:sales:complete', 'Complete sales and deduct inventory', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- PASO 2: Asignar los permisos al rol CLINIC_OWNER
WITH clinic_owner_role AS (
  SELECT id FROM roles WHERE name = 'CLINIC_OWNER' LIMIT 1
),
pos_permissions AS (
  SELECT id FROM permissions WHERE name IN (
    'pos:sales:create',
    'pos:sales:read', 
    'pos:sales:update',
    'pos:sales:complete'
  )
)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM clinic_owner_role r
CROSS JOIN pos_permissions p
WHERE NOT EXISTS (
  SELECT 1 FROM role_permissions rp
  WHERE rp.role_id = r.id AND rp.permission_id = p.id
);

COMMIT;

-- PASO 3: Verificar que todo se creó correctamente
SELECT 
  r.name as role,
  STRING_AGG(p.name, ', ' ORDER BY p.name) as permissions
FROM roles r
INNER JOIN role_permissions rp ON r.id = rp.role_id
INNER JOIN permissions p ON p.id = rp.permission_id
WHERE r.name = 'CLINIC_OWNER' AND p.name LIKE 'pos:%'
GROUP BY r.name;
