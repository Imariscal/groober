-- ==========================================
-- DIAGNÓSTICO: VER PRODUCTOS EN LA BD
-- ==========================================

-- Ver todos los productos por clínica
SELECT 
  c.id as clinic_id,
  c.name as clinic_name,
  COUNT(sp.id) as total_products,
  SUM(CASE WHEN sp.is_active = true THEN 1 ELSE 0 END) as active_products,
  SUM(CASE WHEN sp.is_active = false THEN 1 ELSE 0 END) as inactive_products
FROM clinics c
LEFT JOIN sale_products sp ON c.id = sp.clinic_id
GROUP BY c.id, c.name
ORDER BY c.name;

-- Ver productos detallado
SELECT 
  'Productos por clínica:' as info;
SELECT 
  sp.id,
  sp.clinic_id,
  sp.name,
  sp.sku,
  sp.category,
  sp.sale_price,
  sp.stock_quantity,
  sp.is_active,
  sp.created_at
FROM sale_products sp
ORDER BY sp.clinic_id, sp.name;

-- Verificar si hay productos SIN clinic_id (esto sería el error anterior)
SELECT 
  'Verificar NULL clinic_id:' as info;
SELECT COUNT(*) as products_without_clinic_id
FROM sale_products
WHERE clinic_id IS NULL;

-- Ver la primera clínica y sus productos más recientes
SELECT 
  'Últimos 10 productos de la primera clínica:' as info;
WITH first_clinic AS (
  SELECT id FROM clinics LIMIT 1
)
SELECT 
  sp.id,
  sp.name,
  sp.sku,
  sp.is_active,
  sp.stock_quantity,
  sp.sale_price,
  sp.created_at
FROM sale_products sp
WHERE sp.clinic_id = (SELECT id FROM first_clinic)
ORDER BY sp.created_at DESC
LIMIT 10;

-- Ver estado de isActive de todos los productos
SELECT 
  'Distribución de is_active:' as info;
SELECT 
  is_active,
  COUNT(*) as cantidad
FROM sale_products
GROUP BY is_active
ORDER BY is_active DESC;
