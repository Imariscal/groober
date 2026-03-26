-- Verificar el estado actual de las citas
SELECT 
  COUNT(*) as total_appointments,
  COUNT(CASE WHEN appointment_type = 'CLINIC' THEN 1 END) as clinic_appointments,
  COUNT(CASE WHEN appointment_type = 'GROOMING' THEN 1 END) as grooming_appointments,
  COUNT(CASE WHEN appointment_type IS NULL THEN 1 END) as null_appointments
FROM appointments;

-- Ver citas en abril 2026 (prueba la consulta del usuario)
SELECT id, scheduled_at, appointment_type, location_type, status
FROM appointments
WHERE scheduled_at >= '2026-04-01'::timestamp 
  AND scheduled_at < '2026-05-01'::timestamp
ORDER BY scheduled_at ASC;

-- Ver citas CLINIC en abril 2026
SELECT COUNT(*) as clinic_appointments_april
FROM appointments
WHERE scheduled_at >= '2026-04-01'::timestamp 
  AND scheduled_at < '2026-05-01'::timestamp
  AND appointment_type = 'CLINIC';
