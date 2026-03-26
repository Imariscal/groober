-- Script para verificar y agregar stock al producto Joyeria

-- 1. Verificar que el producto existe y ver su estado actual
SELECT 
  id,
  name,
  sku,
  is_active,
  stock_quantity,
  created_at
FROM sale_products 
WHERE name ILIKE '%joyeria%' OR sku ILIKE '%JOy001%';

-- 2. Si el producto existe pero tiene stock 0, agregar stock
UPDATE sale_products 
SET stock_quantity = 50  -- Cambiar a la cantidad que necesites
WHERE (name ILIKE '%joyeria%' OR sku ILIKE '%JOy001%') 
  AND stock_quantity <= 0;

-- 3. Verificar que se actualizó correctamente
SELECT 
  id,
  name,
  sku,
  is_active,
  stock_quantity
FROM sale_products 
WHERE name ILIKE '%joyeria%' OR sku ILIKE '%JOy001%';

-- 4. Ver todos los productos activos con su stock
SELECT name, sku, stock_quantity, is_active
FROM sale_products
WHERE is_active = true
ORDER BY name;
