-- Script para eliminar TODAS las ventas (VERSIÓN SEGURA - sin transacción)
-- Ejecutar sentencias una por una en caso de error

-- 1. Eliminar pagos de ventas
DELETE FROM sale_payments WHERE sale_id IS NOT NULL;
-- ✓ Confirmar: SELECT COUNT(*) FROM sale_payments;

-- 2. Eliminar items/productos de ventas
DELETE FROM sale_items WHERE sale_id IS NOT NULL;
-- ✓ Confirmar: SELECT COUNT(*) FROM sale_items;

-- 3. Eliminar movimientos de inventario generados por ventas
DELETE FROM inventory_movements WHERE sale_id IS NOT NULL;
-- ✓ Confirmar: SELECT COUNT(*) FROM inventory_movements WHERE sale_id IS NOT NULL;

-- 4. Eliminar todas las ventas
DELETE FROM sales;
-- ✓ Confirmar: SELECT COUNT(*) FROM sales;

-- 5. Resetear las secuencias (IDs) - OPCIONAL
ALTER SEQUENCE sales_id_seq RESTART WITH 1;
ALTER SEQUENCE sale_items_id_seq RESTART WITH 1;
ALTER SEQUENCE sale_payments_id_seq RESTART WITH 1;

-- VERIFICACIÓN FINAL
-- Ejecuta estas queries para confirmar que todo fue eliminado:
SELECT 'Ventas: ' || COUNT(*) FROM sales;
SELECT 'Sale Items: ' || COUNT(*) FROM sale_items;
SELECT 'Sale Payments: ' || COUNT(*) FROM sale_payments;
SELECT 'Inventory Movements (associados a ventas): ' || COUNT(*) FROM inventory_movements WHERE sale_id IS NOT NULL;
