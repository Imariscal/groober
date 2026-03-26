-- Script para asignar permisos POS al rol CLINIC_OWNER
-- Ejecutar en DBeaver o psql

-- 1. Obtener el ID del rol CLINIC_OWNER
SELECT id, name FROM roles WHERE name = 'CLINIC_OWNER';

-- 2. Obtener los IDs de los permisos POS
SELECT id, name FROM permissions WHERE name LIKE 'pos:sales:%';

-- 3. Asignar los permisos (REEMPLAZA clinic_owner_id_aqui y permission_id_aqui)
-- Ejemplo si clinic_owner_id = '123e4567-e89b-12d3-a456-426614174000' 
-- y los permission ids son los del paso 2

INSERT INTO role_permissions (role_id, permission_id)
VALUES
  ('clinic_owner_id_aqui', 'pos_sales_create_id'),
  ('clinic_owner_id_aqui', 'pos_sales_read_id'),
  ('clinic_owner_id_aqui', 'pos_sales_update_id'),
  ('clinic_owner_id_aqui', 'pos_sales_complete_id')
ON CONFLICT DO NOTHING;

-- 4. Verificar que se asignaron correctamente
SELECT 
  r.name as role_name,
  p.name as permission_name
FROM roles r
INNER JOIN role_permissions rp ON r.id = rp.role_id
INNER JOIN permissions p ON p.id = rp.permission_id
WHERE r.name = 'CLINIC_OWNER' AND p.name LIKE 'pos:sales:%'
ORDER BY p.name;
