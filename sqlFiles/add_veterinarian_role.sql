-- Add CLINIC_VETERINARIAN role to the system
-- This role allows users to manage veterinary appointments and services

BEGIN;

-- Insert the new role
INSERT INTO roles (code, name, description, is_system, created_at, updated_at)
VALUES (
  'CLINIC_VETERINARIAN',
  'Veterinario de Clínica',
  'Veterinario que gestiona citas y servicios veterinarios',
  false,
  NOW(),
  NOW()
) ON CONFLICT (code) DO NOTHING;

-- Get the role ID for the next step
WITH vet_role AS (
  SELECT id FROM roles WHERE code = 'CLINIC_VETERINARIAN'
)
-- Assign veterinarian permissions to the CLINIC_VETERINARIAN role
INSERT INTO role_permissions (role_id, permission_id, created_at)
SELECT 
  (SELECT id FROM vet_role),
  p.id,
  NOW()
FROM permissions p
WHERE p.code IN (
  'veterinarians:create',
  'veterinarians:read',
  'veterinarians:update',
  'veterinarians:delete',
  
  -- Also grant appointment-related permissions
  'appointments:create',
  'appointments:read',
  'appointments:update',
  'appointments:delete',
  
  -- Services permissions
  'services:read',
  'services:create',
  'services:update',
  
  -- Clients permissions (to see pet owners)
  'clients:read',
  'clients:update',
  
  -- Pets permissions
  'pets:read',
  'pets:update',
  
  -- Reports (view own appointments)
  'reports:read'
)
ON CONFLICT DO NOTHING;

COMMIT;
