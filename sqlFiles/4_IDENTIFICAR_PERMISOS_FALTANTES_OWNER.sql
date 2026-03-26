-- ============================================================================
-- IDENTIFICAR PERMISOS FALTANTES EN CLINIC_OWNER
-- ============================================================================
-- Descripción: Lista exactamente cuáles son los 34 permisos que FALTAN en
-- CLINIC_OWNER para tener acceso completo al sistema
--
-- IMPORTANTE: Script de LECTURA solamente
-- Fecha: 2026-03-24
-- ============================================================================

SELECT 
  p.code as "Código de Permiso",
  p.name as "Nombre",
  p.description as "Descripción",
  p.category as "Categoría",
  CASE 
    WHEN p.code IN (
      'email:read_outbox', 'email:send', 'email:retry',
      'whatsapp:read_message', 'whatsapp:send', 'whatsapp:read_outbox', 'whatsapp:retry',
      'dashboard:clinic', 'notification:create', 'notification:read'
    ) THEN '⚠️ COMUNICACIÓN'
    WHEN p.code LIKE 'campaign%' THEN '⚠️ CAMPAÑAS'
    WHEN p.code LIKE 'report%' THEN '⚠️ REPORTES'
    WHEN p.code LIKE 'reminder%' THEN '⚠️ RECORDATORIOS'
    WHEN p.code LIKE 'pos:%' THEN '⚠️ POS'
    WHEN p.code LIKE 'preventive%' THEN '⚠️ CUIDADO PREVENTIVO'
    WHEN p.code LIKE 'route%' THEN '⚠️ RUTAS'
    ELSE '❓ OTRA'
  END as "Módulo",
  'ASIGNAR' as "Acción"
FROM permissions p
WHERE p.id NOT IN (
  SELECT rp.permission_id 
  FROM role_permissions rp
  JOIN roles r ON rp.role_id = r.id
  WHERE r.code = 'CLINIC_OWNER'
)
ORDER BY 
  CASE 
    WHEN p.code IN ('email:read_outbox', 'email:send', 'email:retry',
                     'whatsapp:read_message', 'whatsapp:send', 'whatsapp:read_outbox', 'whatsapp:retry',
                     'dashboard:clinic') THEN 1
    WHEN p.code LIKE 'campaign%' THEN 2
    WHEN p.code LIKE 'report%' THEN 3
    WHEN p.code LIKE 'reminder%' THEN 4
    WHEN p.code LIKE 'pos:%' THEN 5
    WHEN p.code LIKE 'preventive%' THEN 6
    WHEN p.code LIKE 'route%' THEN 7
    ELSE 8
  END,
  p.category,
  p.code;

-- ============================================================================
-- CUANTIFICAR FALTANTES POR CATEGORÍA
-- ============================================================================

SELECT 
  p.category as "Categoría",
  COUNT(*) as "Cantidad Faltante"
FROM permissions p
WHERE p.id NOT IN (
  SELECT rp.permission_id 
  FROM role_permissions rp
  JOIN roles r ON rp.role_id = r.id
  WHERE r.code = 'CLINIC_OWNER'
)
GROUP BY p.category
ORDER BY COUNT(*) DESC;

-- ============================================================================
-- TOTAL DE PERMISOS
-- ============================================================================

SELECT 
  (SELECT COUNT(*) FROM permissions) as "Total en BD",
  (SELECT COUNT(DISTINCT rp.permission_id) FROM role_permissions rp 
   JOIN roles r ON rp.role_id = r.id WHERE r.code = 'CLINIC_OWNER') as "CLINIC_OWNER Tiene",
  (SELECT COUNT(*) FROM permissions) - 
  (SELECT COUNT(DISTINCT rp.permission_id) FROM role_permissions rp 
   JOIN roles r ON rp.role_id = r.id WHERE r.code = 'CLINIC_OWNER') as "CLINIC_OWNER Falta";