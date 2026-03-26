-- ================================================================
-- SCRIPT: Limpieza TOTAL - Citas + Clientes + Mascotas
-- ================================================================
-- ⚠️  CUIDADO: Esto elimina TODO, incluyendo clientes y mascotas
-- ================================================================

BEGIN;

-- 1. Eliminar citas asociadas
DELETE FROM appointment_items;
DELETE FROM appointment_groups;
DELETE FROM groomer_route_stops WHERE appointment_id IS NOT NULL;
DELETE FROM appointments;

-- 2. Eliminar rutas de groomer (si dependen de datos de citas)
DELETE FROM groomer_routes;

-- 3. Eliminar direcciones de clientes (si están huérfanas)
DELETE FROM client_addresses WHERE client_id IN (
  SELECT id FROM clients WHERE clinic_id = 'tu_clinic_id_aqui'
);

-- 4. Eliminar mascotas
DELETE FROM pets WHERE client_id IN (
  SELECT id FROM clients WHERE clinic_id = 'tu_clinic_id_aqui'
);

-- 5. Eliminar clientes
DELETE FROM clients WHERE clinic_id = 'tu_clinic_id_aqui';

-- 6. VERIFICACIÓN
SELECT 
  'appointments' as tabla, COUNT(*) as registros FROM appointments
UNION ALL
SELECT 'appointment_items', COUNT(*) FROM appointment_items
UNION ALL
SELECT 'appointment_groups', COUNT(*) FROM appointment_groups
UNION ALL
SELECT 'clients', COUNT(*) FROM clients
UNION ALL
SELECT 'pets', COUNT(*) FROM pets;

COMMIT;
