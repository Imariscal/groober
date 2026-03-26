-- Fix: Set default appointment_type for existing appointments
-- Citas existentes sin appointmentType reciben 'CLINIC' como valor por defecto
-- Esto es porque la mayoría de citas son clínicas (visitas veterinarias)

UPDATE appointments 
SET appointment_type = 'CLINIC' 
WHERE appointment_type IS NULL;

-- Verificar que se actualizaron correctamente
SELECT 
  COUNT(*) as total_appointments,
  COUNT(CASE WHEN appointment_type = 'CLINIC' THEN 1 END) as clinic_appointments,
  COUNT(CASE WHEN appointment_type = 'GROOMING' THEN 1 END) as grooming_appointments,
  COUNT(CASE WHEN appointment_type IS NULL THEN 1 END) as null_appointments
FROM appointments;
