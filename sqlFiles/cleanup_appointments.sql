-- ================================================================
-- SCRIPT: Eliminar todas las citas y referencias
-- ================================================================
-- Este script elimina todas las citas y las tablas que dependen de ellas
-- Orden: dependendientes primero, luego principales
-- ================================================================

BEGIN;

-- 1. Eliminar appointment items (depende de appointments)
DELETE FROM appointment_items;

-- 2. Eliminar appointment groups (depende de appointments)
DELETE FROM appointment_groups;

-- 3. Eliminar groomer route stops (depende de appointments)
DELETE FROM groomer_route_stops
WHERE appointment_id IS NOT NULL;

-- 4. Eliminar appointments (principal)
DELETE FROM appointments;

-- 5. VERIFICACIÓN: Contar registros después de borrar
SELECT 
  'appointments' as tabla, COUNT(*) as registros FROM appointments
UNION ALL
SELECT 'appointment_items', COUNT(*) FROM appointment_items
UNION ALL
SELECT 'appointment_groups', COUNT(*) FROM appointment_groups
UNION ALL
SELECT 'groomer_route_stops', COUNT(*) FROM groomer_route_stops
WHERE appointment_id IS NOT NULL;

-- 6. RESETEAR SEQUENCE IDs (si existen)
-- Para PostgreSQL:
-- ALTER SEQUENCE appointments_id_seq RESTART WITH 1;
-- ALTER SEQUENCE appointment_items_id_seq RESTART WITH 1;
-- ALTER SEQUENCE appointment_groups_id_seq RESTART WITH 1;

-- Si todo va bien, descomenta COMMIT
COMMIT;

-- Si quieres rollback en caso de error, usa ROLLBACK;
