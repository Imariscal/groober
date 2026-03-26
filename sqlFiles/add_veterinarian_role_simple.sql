-- Simple SQL to add CLINIC_VETERINARIAN role
-- Execute this in your PostgreSQL database (DBeaver, pgAdmin, or psql)

INSERT INTO roles (code, name, description, is_system, created_at, updated_at)
VALUES (
  'CLINIC_VETERINARIAN',
  'Veterinario de Clínica',
  'Veterinario que gestiona citas y servicios veterinarios',
  false,
  NOW(),
  NOW()
) ON CONFLICT (code) DO NOTHING;

-- Verify the role was created
SELECT id, code, name FROM roles WHERE code = 'CLINIC_VETERINARIAN';
