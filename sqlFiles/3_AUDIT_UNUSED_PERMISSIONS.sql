-- ============================================================================
-- SCRIPT 3: AUDITAR PERMISOS NO ENCONTRADOS EN CÓDIGO
-- ============================================================================
-- Descripción: Identifica permisos en la BD que NO fueron encontrados en
-- decoradores del backend. Estos pueden ser:
-- 1. Funcionalidades no implementadas aún
-- 2. Código legacy sin usar
-- 3. Características desactivadas
--
-- IMPORTANTE: Script de LECTURA solamente - sin cambios
-- Fecha: 2026-03-24
-- ============================================================================

-- ============================================================================
-- 1. PERMISOS NO ENCONTRADOS EN CÓDIGO (por categoría)
-- ============================================================================

-- Permisos de CAMPAÑA que no están en código
SELECT 
  'CAMPAÑA' as categoria,
  code,
  name,
  description,
  'Revisar si está implementado' as accion
FROM permissions
WHERE code IN (
  'campaigns:metrics',           -- NO en código
  'campaigns:preview_audience',  -- NO en código
  'campaigns:recipients',        -- NO en código
  'campaigns:pause',             -- Posible en código
  'campaigns:resume',            -- Posible en código
  'campaigns:start'              -- Posible en código
)
UNION ALL

-- Permisos de EMAIL no encontrados
SELECT 
  'EMAIL',
  code,
  name,
  description,
  'Verificar si hay controlador de email'
FROM permissions
WHERE code LIKE 'email:%'
UNION ALL

-- Permisos TEMPLATE DE CAMPAÑA no encontrados
SELECT 
  'TEMPLATE CAMPAÑA',
  code,
  name,
  description,
  'Revisar campaign-template.controller.ts'
FROM permissions
WHERE code LIKE 'campaign_template:%'
  OR name LIKE 'CAMPAIGN_TEMPLATE%'
UNION ALL

-- Permisos de NOTIFICACIÓN con inconsistencia (notification vs notifications)
SELECT 
  'NOTIFICACIÓN',
  code,
  name,
  description,
  'Revisar if usando "notification:" vs "notifications:"'
FROM permissions
WHERE code LIKE 'notification:%'
UNION ALL

-- Permisos de POS no encontrados
SELECT 
  'PUNTO DE VENTA',
  code,
  name,
  description,
  'Verificar implementación en pos.controller.ts'
FROM permissions
WHERE code LIKE 'pos:%'
  AND code NOT IN (
    'pos:products:create',
    'pos:products:read',
    'pos:products:update',
    'pos:sales:create',
    'pos:sales:read',
    'pos:sales:update',
    'pos:sales:complete',
    'pos:sales:cancel',
    'pos:sales:refund',
    'pos:inventory:read',
    'pos:inventory:update'
  )
UNION ALL

-- Permisos de PRICING no encontrados
SELECT 
  'PRECIOS',
  code,
  name,
  description,
  'Verificar implementación en price-lists.controller.ts'
FROM permissions
WHERE code LIKE 'pricing:%'
  AND code NOT IN (
    'pricing:price_lists:create',
    'pricing:price_lists:read',
    'pricing:service_prices:read'
  )
UNION ALL

-- Permisos de CUIDADO PREVENTIVO no encontrados
SELECT 
  'CUIDADO PREVENTIVO',
  code,
  name,
  description,
  'Verificar si módulo está activo'
FROM permissions
WHERE code LIKE 'preventive_care:%'
UNION ALL

-- Permisos de RECORDATORIOS no encontrados
SELECT 
  'RECORDATORIOS',
  code,
  name,
  description,
  'Verificar si está implementado'
FROM permissions
WHERE code LIKE 'reminders:%'
  AND code NOT IN (
    'reminders:create',
    'reminders:read'
  )
UNION ALL

-- Permisos de REPORTES no encontrados
SELECT 
  'REPORTES',
  code,
  name,
  description,
  'Verificar si hay controlador de reportes'
FROM permissions
WHERE code LIKE 'reports:%'
UNION ALL

-- Permisos de ROLES no encontrados
SELECT 
  'ROLES',
  code,
  name,
  description,
  'Verificar implementación en roles.controller.ts'
FROM permissions
WHERE code LIKE 'roles:%'
  AND code NOT IN ('roles:read')
UNION ALL

-- Permisos de ESTILISTA no encontrados (availability, capacity, etc)
SELECT 
  'ESTILISTA',
  code,
  name,
  description,
  'Verificar implementación en stylists.controller.ts'
FROM permissions
WHERE code LIKE 'stylists:%'
  AND code NOT IN ('stylists:read', 'stylists:update')
UNION ALL

-- Permisos de RUTAS no encontrados
SELECT 
  'OPTIMIZACIÓN DE RUTAS',
  code,
  name,
  description,
  'Verificar si implementado en routes.controller.ts'
FROM permissions
WHERE code LIKE 'routes:%'
UNION ALL

-- Permisos de WHATSAPP no encontrados
SELECT 
  'WHATSAPP',
  code,
  name,
  description,
  'Verificar si integración está activa'
FROM permissions
WHERE code LIKE 'whatsapp:%'
ORDER BY categoria, code;

-- ============================================================================
-- 2. CUANTIFICAR PERMISOS POR ESTADO
-- ============================================================================

SELECT 
  'Permisos EHR activos' as tipo,
  COUNT(*) as cantidad
FROM permissions
WHERE code LIKE 'ehr:%'
UNION ALL
SELECT 
  'Permisos sin uso identificado',
  COUNT(*)
FROM permissions
WHERE id NOT IN (
  SELECT rp.permission_id FROM role_permissions rp
)
UNION ALL
SELECT 
  'Permisos total en sistema',
  COUNT(*)
FROM permissions
ORDER BY tipo;

-- ============================================================================
-- 3. ROLES CON PERMISOS NO ASIGNADOS
-- ============================================================================

SELECT 
  r.code as "Rol",
  COUNT(rp.permission_id) as "Permisos Asignados",
  (SELECT COUNT(*) FROM permissions p WHERE p.id NOT IN 
    (SELECT permission_id FROM role_permissions rp2 WHERE rp2.role_id = r.id)) 
  as "Permisos No Asignados"
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
WHERE r.code IN ('CLINIC_VETERINARIAN', 'CLINIC_OWNER', 'CLINIC_STAFF')
GROUP BY r.id, r.code
ORDER BY r.code;