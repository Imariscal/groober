-- Script para eliminar TODAS las ventas y datos relacionados
-- ADVERTENCIA: Este script es DESTRUCTIVO. Eliminará todos los datos de ventas.
-- Ejecutar solo en desarrollo o cuando estés seguro de que quieres limpiar todo.

BEGIN;

-- 1. Eliminar pagos de ventas (depende de sales)
DELETE FROM sale_payments WHERE sale_id IS NOT NULL;

-- 2. Eliminar items/productos de ventas (depende de sales)
DELETE FROM sale_items WHERE sale_id IS NOT NULL;

-- 3. Eliminar movimientos de inventario generados por ventas
DELETE FROM inventory_movements WHERE sale_id IS NOT NULL;

-- 4. Eliminar todas las ventas
DELETE FROM sales;

-- Resetear las secuencias (opcional, pero recomendado)
ALTER SEQUENCE sales_id_seq RESTART WITH 1;
ALTER SEQUENCE sale_items_id_seq RESTART WITH 1;
ALTER SEQUENCE sale_payments_id_seq RESTART WITH 1;

-- Confirmar cambios
COMMIT;

-- Verificar que todo fue eliminado
SELECT 'Ventas restantes: ' || COUNT(*) as check_sales FROM sales;
SELECT 'Items restantes: ' || COUNT(*) as check_items FROM sale_items;
SELECT 'Pagos restantes: ' || COUNT(*) as check_payments FROM sale_payments;
SELECT 'Movimientos de inventario: ' || COUNT(*) as check_movements FROM inventory_movements WHERE sale_id IS NOT NULL;
