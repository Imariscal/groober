-- ==========================================
-- SCRIPT PARA INSERTAR PERMISOS DE POS
-- ==========================================
-- Este script inserta los permisos faltantes 
-- para el módulo POS (Punto de Venta)
-- y los asigna a los roles de clínica

-- ==========================================
-- PASO 1: INSERTAR PERMISOS INDIVIDUALES
-- ==========================================

-- Primero, verificar/insertar los permisos de productos con SINGULAR (como usa el controller)
INSERT INTO permissions (id, code, name, description, category)
VALUES 
  (gen_random_uuid(), 'pos:product:read', 'Leer Productos POS', 'Ver productos del punto de venta', 'pos'),
  (gen_random_uuid(), 'pos:product:create', 'Crear Productos POS', 'Crear nuevos productos en punto de venta', 'pos'),
  (gen_random_uuid(), 'pos:product:update', 'Actualizar Productos POS', 'Editar productos existentes del punto de venta', 'pos'),
  (gen_random_uuid(), 'pos:product:delete', 'Eliminar Productos POS', 'Eliminar productos del punto de venta', 'pos'),
  (gen_random_uuid(), 'pos:sales:read', 'Leer Ventas POS', 'Ver ventas del punto de venta', 'pos'),
  (gen_random_uuid(), 'pos:sales:create', 'Crear Ventas POS', 'Crear nuevas ventas en punto de venta', 'pos'),
  (gen_random_uuid(), 'pos:sales:update', 'Actualizar Ventas POS', 'Editar ventas existentes', 'pos'),
  (gen_random_uuid(), 'pos:sales:complete', 'Completar Ventas POS', 'Marcar ventas como completadas', 'pos'),
  (gen_random_uuid(), 'pos:sales:cancel', 'Cancelar Ventas POS', 'Cancelar ventas', 'pos'),
  (gen_random_uuid(), 'pos:sales:refund', 'Reembolsar Ventas POS', 'Procesar reembolsos de ventas', 'pos')
ON CONFLICT (code) DO NOTHING;

-- También insertar versiones en PLURAL (según constantes) como respaldo
INSERT INTO permissions (id, code, name, description, category)
VALUES 
  (gen_random_uuid(), 'pos:products:read', 'Leer Productos POS', 'Ver productos del punto de venta', 'pos'),
  (gen_random_uuid(), 'pos:products:create', 'Crear Productos POS', 'Crear nuevos productos en punto de venta', 'pos'),
  (gen_random_uuid(), 'pos:products:update', 'Actualizar Productos POS', 'Editar productos existentes del punto de venta', 'pos'),
  (gen_random_uuid(), 'pos:products:delete', 'Eliminar Productos POS', 'Eliminar productos del punto de venta', 'pos'),
  (gen_random_uuid(), 'pos:sales:read', 'Leer Ventas POS', 'Ver ventas del punto de venta', 'pos'),
  (gen_random_uuid(), 'pos:sales:create', 'Crear Ventas POS', 'Crear nuevas ventas en punto de venta', 'pos'),
  (gen_random_uuid(), 'pos:sales:update', 'Actualizar Ventas POS', 'Editar ventas existentes', 'pos'),
  (gen_random_uuid(), 'pos:sales:complete', 'Completar Ventas POS', 'Marcar ventas como completadas', 'pos'),
  (gen_remote_uuid(), 'pos:sales:cancel', 'Cancelar Ventas POS', 'Cancelar ventas', 'pos'),
  (gen_random_uuid(), 'pos:sales:refund', 'Reembolsar Ventas POS', 'Procesar reembolsos de ventas', 'pos')
ON CONFLICT (code) DO NOTHING;

-- ==========================================
-- PASO 2: ASIGNAR PERMISOS A ROLES EXISTENTES
-- ==========================================

-- Encontrar todos los permisos de POS
WITH pos_permissions AS (
  SELECT id FROM permissions 
  WHERE code LIKE 'pos:%'
),

-- Encontrar todos los roles 'owner' (propietarios de clínicas)
owner_roles AS (
  SELECT id FROM roles 
  WHERE code = 'owner' OR name LIKE '%Owner%' OR name LIKE '%Propietario%'
)

-- Asignar todos los permisos de POS a todos los roles owner
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  or.id,
  pp.id
FROM owner_roles or
CROSS JOIN pos_permissions pp
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ==========================================
-- PASO 3: VERIFICACIÓN
-- ==========================================

-- Ver los permisos de POS creados
SELECT 'Permisos de POS creados:' as info;
SELECT code, name, category FROM permissions WHERE category = 'pos' ORDER BY code;

-- Ver asignaciones de roles
SELECT 'Asignaciones de permisos a roles:' as info;
SELECT 
  r.code as role_code,
  r.name as role_name,
  COUNT(rp.permission_id) as total_permissions
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
GROUP BY r.id, r.code, r.name
ORDER BY r.name;

-- ==========================================
-- ALTERNATIVA: Si solo tienes UN usuario específico
-- Ejecuta esto si conoces el ID del usuario:
-- ==========================================

-- DESCOMENTAR Y EJECUTAR SI NECESITAS ASIGNAR A UN USUARIO ESPECÍFICO
/*
-- Reemplaza 'TU_USER_ID' con el UUID real del usuario
UPDATE users
SET role = 'owner'
WHERE id = 'TU_USER_ID';

-- O si usas una tabla user_roles:
INSERT INTO user_roles (user_id, role_id)
SELECT 
  'TU_USER_ID',
  id
FROM roles
WHERE code = 'owner' AND clinic_id IS NOT NULL
LIMIT 1
ON CONFLICT DO NOTHING;
*/

-- ==========================================
-- DIAGNÓSTICO: Ver permisos del usuario actual
-- ==========================================

-- Reemplaza 'TU_USER_ID' para ver qué permisos tiene ese usuario
/*
SELECT 
  u.id,
  u.email,
  u.role,
  p.code as permission_code,
  p.name as permission_name
FROM users u
LEFT JOIN roles r ON u.role = r.code AND u.clinic_id = r.clinic_id
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id
WHERE u.id = 'TU_USER_ID'
ORDER BY p.code;
*/
