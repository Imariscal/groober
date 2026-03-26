-- Insert CLINIC_VETERINARIAN role
-- This works even if the role already exists

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM roles WHERE code = 'CLINIC_VETERINARIAN') THEN
    INSERT INTO roles (code, name, description, is_system, created_at)
    VALUES (
      'CLINIC_VETERINARIAN',
      'Veterinario de Clínica',
      'Veterinario que gestiona citas y servicios veterinarios',
      false,
      NOW()
    );
    RAISE NOTICE 'Role CLINIC_VETERINARIAN created successfully';
  ELSE
    RAISE NOTICE 'Role CLINIC_VETERINARIAN already exists';
  END IF;
END $$;

-- Verify the role was created
SELECT id, code, name FROM roles WHERE code = 'CLINIC_VETERINARIAN';
