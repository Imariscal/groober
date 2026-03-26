-- 🗑️ Scripts Selectivos para Eliminar Ventas
-- Elige el script según lo que necesites limpiar

-- ============================================================
-- OPCIÓN 1: Eliminar SOLO ventas en DRAFT (Borradores)
-- ============================================================
BEGIN;
  -- Buscar IDs de sales que están en DRAFT
  WITH draft_sales AS (
    SELECT id FROM sales WHERE status = 'DRAFT'
  )
  DELETE FROM sale_payments WHERE sale_id IN (SELECT id FROM draft_sales);
  
  WITH draft_sales AS (
    SELECT id FROM sales WHERE status = 'DRAFT'
  )
  DELETE FROM sale_items WHERE sale_id IN (SELECT id FROM draft_sales);
  
  WITH draft_sales AS (
    SELECT id FROM sales WHERE status = 'DRAFT'
  )
  DELETE FROM inventory_movements WHERE sale_id IN (SELECT id FROM draft_sales);
  
  DELETE FROM sales WHERE status = 'DRAFT';
COMMIT;
-- Verificar: SELECT COUNT(*) FROM sales WHERE status = 'DRAFT';  → debe ser 0


-- ============================================================
-- OPCIÓN 2: Eliminar SOLO ventas COMPLETADAS
-- ============================================================
BEGIN;
  WITH completed_sales AS (
    SELECT id FROM sales WHERE status = 'COMPLETED'
  )
  DELETE FROM sale_payments WHERE sale_id IN (SELECT id FROM completed_sales);
  
  WITH completed_sales AS (
    SELECT id FROM sales WHERE status = 'COMPLETED'
  )
  DELETE FROM sale_items WHERE sale_id IN (SELECT id FROM completed_sales);
  
  WITH completed_sales AS (
    SELECT id FROM sales WHERE status = 'COMPLETED'
  )
  DELETE FROM inventory_movements WHERE sale_id IN (SELECT id FROM completed_sales);
  
  DELETE FROM sales WHERE status = 'COMPLETED';
COMMIT;
-- Verificar: SELECT COUNT(*) FROM sales WHERE status = 'COMPLETED';  → debe ser 0


-- ============================================================
-- OPCIÓN 3: Eliminar ventas de una FECHA ESPECÍFICA
-- ============================================================
BEGIN;
  -- Cambiar la fecha según necesites (YYYY-MM-DD)
  WITH dated_sales AS (
    SELECT id FROM sales WHERE DATE(created_at) = '2025-01-15'
  )
  DELETE FROM sale_payments WHERE sale_id IN (SELECT id FROM dated_sales);
  
  WITH dated_sales AS (
    SELECT id FROM sales WHERE DATE(created_at) = '2025-01-15'
  )
  DELETE FROM sale_items WHERE sale_id IN (SELECT id FROM dated_sales);
  
  WITH dated_sales AS (
    SELECT id FROM sales WHERE DATE(created_at) = '2025-01-15'
  )
  DELETE FROM inventory_movements WHERE sale_id IN (SELECT id FROM dated_sales);
  
  DELETE FROM sales WHERE DATE(created_at) = '2025-01-15';
COMMIT;


-- ============================================================
-- OPCIÓN 4: Eliminar ventas de un RANGO DE FECHAS
-- ============================================================
BEGIN;
  -- Cambiar las fechas según necesites
  WITH range_sales AS (
    SELECT id FROM sales 
    WHERE created_at >= '2025-01-01' AND created_at < '2025-02-01'
  )
  DELETE FROM sale_payments WHERE sale_id IN (SELECT id FROM range_sales);
  
  WITH range_sales AS (
    SELECT id FROM sales 
    WHERE created_at >= '2025-01-01' AND created_at < '2025-02-01'
  )
  DELETE FROM sale_items WHERE sale_id IN (SELECT id FROM range_sales);
  
  WITH range_sales AS (
    SELECT id FROM sales 
    WHERE created_at >= '2025-01-01' AND created_at < '2025-02-01'
  )
  DELETE FROM inventory_movements WHERE sale_id IN (SELECT id FROM range_sales);
  
  DELETE FROM sales 
  WHERE created_at >= '2025-01-01' AND created_at < '2025-02-01';
COMMIT;


-- ============================================================
-- OPCIÓN 5: Eliminar ventas mayores a cierto MONTO
-- ============================================================
BEGIN;
  -- Elimina ventas con total > 1000
  WITH high_sales AS (
    SELECT id FROM sales WHERE total_amount > 1000
  )
  DELETE FROM sale_payments WHERE sale_id IN (SELECT id FROM high_sales);
  
  WITH high_sales AS (
    SELECT id FROM sales WHERE total_amount > 1000
  )
  DELETE FROM sale_items WHERE sale_id IN (SELECT id FROM high_sales);
  
  WITH high_sales AS (
    SELECT id FROM sales WHERE total_amount > 1000
  )
  DELETE FROM inventory_movements WHERE sale_id IN (SELECT id FROM high_sales);
  
  DELETE FROM sales WHERE total_amount > 1000;
COMMIT;


-- ============================================================
-- CONSULTAS DE MONITOREO
-- ============================================================

-- Ver cantidad de ventas por estado
SELECT status, COUNT(*) as cantidad 
FROM sales 
GROUP BY status;

-- Ver ventas recientes (últimas 10)
SELECT id, client_id, total_amount, status, created_at 
FROM sales 
ORDER BY created_at DESC 
LIMIT 10;

-- Ver ventas de hoy
SELECT id, total_amount, status 
FROM sales 
WHERE DATE(created_at) = CURRENT_DATE;

-- Ver total de dinero en ventas
SELECT 
  status,
  COUNT(*) as cantidad,
  SUM(total_amount) as total_ventas
FROM sales 
GROUP BY status;

-- Ver si hay datos huérfanos (inconsistencias)
SELECT 'Huérfanos en sale_items' as tipo, COUNT(*) 
FROM sale_items 
WHERE sale_id NOT IN (SELECT id FROM sales)
UNION ALL
SELECT 'Huérfanos en sale_payments', COUNT(*) 
FROM sale_payments 
WHERE sale_id NOT IN (SELECT id FROM sales);
