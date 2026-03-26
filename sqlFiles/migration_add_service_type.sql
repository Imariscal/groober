-- Add service_type column to appointments table
-- service_type: MEDICAL (veterinary visits) | GROOMING (grooming services)

ALTER TABLE appointments 
ADD COLUMN service_type VARCHAR(20) 
DEFAULT 'MEDICAL' 
NOT NULL;

-- Add constraint to ensure valid values
ALTER TABLE appointments 
ADD CONSTRAINT check_service_type 
CHECK (service_type IN ('MEDICAL', 'GROOMING'));

-- Set existing appointments based on appointment_type
-- If appointment_type = 'CLINIC' → service_type = 'MEDICAL'
-- If appointment_type = 'GROOMING' → service_type = 'GROOMING'
UPDATE appointments 
SET service_type = CASE 
  WHEN appointment_type = 'GROOMING' THEN 'GROOMING'
  ELSE 'MEDICAL'
END;

-- Verify the migration
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN service_type = 'MEDICAL' THEN 1 END) as medical,
  COUNT(CASE WHEN service_type = 'GROOMING' THEN 1 END) as grooming,
  COUNT(CASE WHEN service_type IS NULL THEN 1 END) as null_values
FROM appointments;

-- Check combinations
SELECT service_type, location_type, COUNT(*) as count
FROM appointments
GROUP BY service_type, location_type
ORDER BY service_type, location_type;
