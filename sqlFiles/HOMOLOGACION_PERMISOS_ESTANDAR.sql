-- ============================================================================
-- SCRIPT: HOMOLOGACIÓN DE PERMISOS A FORMATO ESTÁNDAR
-- ============================================================================
-- Objetivo: Convertir todos los códigos de permisos a formato ÚNICO
-- Formato Estándar: lowercase:colon:separated (ej: ehr:medical_history:read)
-- Fecha: 2026-03-24
-- ============================================================================

BEGIN TRANSACTION;

-- ============================================================================
-- PASO 1: MOSTRAR ESTADÍSTICAS INICIALES
-- ============================================================================

SELECT 
  '=== ESTADÍSTICAS INICIALES ===' as fase,
  COUNT(*) as total_permisos
FROM permissions;

-- Ver formato actual de permisos
SELECT 
  CASE 
    WHEN code ~ '^[A-Z_]+$' THEN 'UPPERCASE_SNAKE_CASE'
    WHEN code ~ '^[a-z_]+$' THEN 'lowercase_snake_case'
    WHEN code ~ '^[a-z:]+$' THEN 'lowercase:colon:separated'
    ELSE 'OTRO'
  END as formato,
  COUNT(*) as cantidad,
  MAX(code) as ejemplo
FROM permissions
GROUP BY formato
ORDER BY cantidad DESC;

-- ============================================================================
-- PASO 2: CREAR TABLA DE MAPEO (para rastrear cambios)
-- ============================================================================

CREATE TEMP TABLE permission_mapping (
  old_code VARCHAR(255) PRIMARY KEY,
  new_code VARCHAR(255) NOT NULL UNIQUE
);

-- Mapping: Legacy UPPERCASE → Nuevo lowercase:colon

-- PLATFORM permisos → platform:*
INSERT INTO permission_mapping VALUES
  ('PLATFORM_CLINICS_CREATE', 'platform:clinics:create'),
  ('PLATFORM_CLINICS_READ', 'platform:clinics:read'),
  ('PLATFORM_CLINICS_UPDATE', 'platform:clinics:update'),
  ('PLATFORM_CLINICS_DELETE', 'platform:clinics:delete'),
  ('PLATFORM_CLINICS_SUSPEND', 'platform:clinics:suspend'),
  ('PLATFORM_CLINICS_ACTIVATE', 'platform:clinics:activate'),
  ('PLATFORM_PLANS_CREATE', 'platform:plans:create'),
  ('PLATFORM_PLANS_READ', 'platform:plans:read'),
  ('PLATFORM_PLANS_UPDATE', 'platform:plans:update'),
  ('PLATFORM_PLANS_DELETE', 'platform:plans:delete'),
  ('PLATFORM_PLANS_TOGGLE', 'platform:plans:toggle'),
  ('PLATFORM_USERS_CREATE', 'platform:users:create'),
  ('PLATFORM_USERS_READ', 'platform:users:read'),
  ('PLATFORM_USERS_UPDATE', 'platform:users:update'),
  ('PLATFORM_USERS_DELETE', 'platform:users:delete'),
  ('PLATFORM_USERS_IMPERSONATE', 'platform:users:impersonate'),
  ('PLATFORM_DASHBOARD', 'platform:dashboard:access'),
  ('PLATFORM_REPORTS', 'platform:reports:access'),
  ('AUDIT_READ', 'audit:logs:read'),
  
-- CLINIC permisos → clinic:*
  ('CLINIC_MANAGE', 'clinic:manage'),
  ('CLINIC_SETTINGS', 'clinic:settings:manage'),
  ('CLINIC_BRANDING', 'clinic:branding:manage'),
  ('CLINIC_COMMUNICATION_CONFIG', 'clinic:communication:configure'),
  ('CLINIC_COMMUNICATION_READ', 'clinic:communication:read'),
  ('CLINIC_CALENDAR_MANAGE', 'clinic:calendar:manage'),
  
-- USERS permisos → users:*
  ('USERS_CREATE', 'users:create'),
  ('USERS_READ', 'users:read'),
  ('USERS_UPDATE', 'users:update'),
  ('USERS_DEACTIVATE', 'users:deactivate'),
  ('USERS_DELETE', 'users:delete'),
  
-- ROLES permisos → roles:*
  ('ROLES_CREATE', 'roles:create'),
  ('ROLES_READ', 'roles:read'),
  ('ROLES_UPDATE', 'roles:update'),
  ('ROLES_DELETE', 'roles:delete'),
  ('ROLES_PERMISSIONS_LIST', 'roles:permissions:list'),
  
-- CLIENTS permisos → clients:*
  ('CLIENTS_CREATE', 'clients:create'),
  ('CLIENTS_READ', 'clients:read'),
  ('CLIENTS_UPDATE', 'clients:update'),
  ('CLIENTS_DEACTIVATE', 'clients:deactivate'),
  ('CLIENTS_DELETE', 'clients:delete'),
  ('CLIENTS_ADDRESSES_CREATE', 'clients:addresses:create'),
  ('CLIENTS_ADDRESSES_READ', 'clients:addresses:read'),
  ('CLIENTS_ADDRESSES_UPDATE', 'clients:addresses:update'),
  ('CLIENTS_ADDRESSES_DELETE', 'clients:addresses:delete'),
  ('CLIENTS_ADDRESSES_SET_DEFAULT', 'clients:addresses:set_default'),
  ('CLIENTS_TAGS_CREATE', 'clients:tags:create'),
  ('CLIENTS_TAGS_READ', 'clients:tags:read'),
  ('CLIENTS_TAGS_DELETE', 'clients:tags:delete'),
  
-- PETS permisos → pets:*
  ('PETS_CREATE', 'pets:create'),
  ('PETS_READ', 'pets:read'),
  ('PETS_UPDATE', 'pets:update'),
  ('PETS_DELETE', 'pets:delete'),
  
-- APPOINTMENTS permisos → appointments:*
  ('APPOINTMENTS_CREATE', 'appointments:create'),
  ('APPOINTMENTS_READ', 'appointments:read'),
  ('APPOINTMENTS_UPDATE', 'appointments:update'),
  ('APPOINTMENTS_UPDATE_STATUS', 'appointments:status:update'),
  ('APPOINTMENTS_UPDATE_SERVICES', 'appointments:services:update'),
  ('APPOINTMENTS_COMPLETE', 'appointments:complete'),
  ('APPOINTMENTS_CHECK_AVAILABILITY', 'appointments:availability:check'),
  
-- VISITS permisos → visits:*
  ('VISITS_CREATE', 'visits:create'),
  ('VISITS_READ', 'visits:read'),
  ('VISITS_UPDATE', 'visits:update'),
  ('VISITS_UPDATE_STATUS', 'visits:status:update'),
  ('VISITS_COMPLETE', 'visits:complete'),
  ('VISITS_CANCEL', 'visits:cancel'),
  
-- NOTA: MEDICAL_* y EHR_* (uppercase) son LEGACY, solo mapear los que existan en BD
-- Mantener SOLO UNO por cada destino para evitar violar UNIQUE constraint
-- Preferencia: Mapear códigos LEGACY reales que estén en la BD

-- EHR permisos legacy (uppercase) → ehr:* (estándar)
  ('EHR_MEDICAL_HISTORY_CREATE', 'ehr:medical_history:create'),
  ('EHR_MEDICAL_HISTORY_READ', 'ehr:medical_history:read'),
  ('EHR_MEDICAL_HISTORY_UPDATE', 'ehr:medical_history:update'),
  ('EHR_MEDICAL_HISTORY_DELETE', 'ehr:medical_history:delete'),
  ('EHR_PRESCRIPTIONS_CREATE', 'ehr:prescriptions:create'),
  ('EHR_PRESCRIPTIONS_READ', 'ehr:prescriptions:read'),
  ('EHR_PRESCRIPTIONS_UPDATE', 'ehr:prescriptions:update'),
  ('EHR_PRESCRIPTIONS_DELETE', 'ehr:prescriptions:delete'),
  ('EHR_PRESCRIPTIONS_SIGN', 'ehr:prescriptions:sign'),
  ('EHR_VACCINATIONS_CREATE', 'ehr:vaccinations:create'),
  ('EHR_VACCINATIONS_READ', 'ehr:vaccinations:read'),
  ('EHR_VACCINATIONS_UPDATE', 'ehr:vaccinations:update'),
  ('EHR_VACCINATIONS_DELETE', 'ehr:vaccinations:delete'),
  ('EHR_ALLERGIES_CREATE', 'ehr:allergies:create'),
  ('EHR_ALLERGIES_READ', 'ehr:allergies:read'),
  ('EHR_ALLERGIES_UPDATE', 'ehr:allergies:update'),
  ('EHR_ALLERGIES_DELETE', 'ehr:allergies:delete'),
  ('EHR_DIAGNOSTICS_CREATE', 'ehr:diagnostics:create'),
  ('EHR_DIAGNOSTICS_READ', 'ehr:diagnostics:read'),
  ('EHR_DIAGNOSTICS_UPDATE', 'ehr:diagnostics:update'),
  ('EHR_DIAGNOSTICS_DELETE', 'ehr:diagnostics:delete'),
  ('EHR_ATTACHMENTS_CREATE', 'ehr:attachments:create'),
  ('EHR_ATTACHMENTS_READ', 'ehr:attachments:read'),
  ('EHR_ATTACHMENTS_DELETE', 'ehr:attachments:delete'),
  ('EHR_ATTACHMENTS_DOWNLOAD', 'ehr:attachments:download'),
  ('EHR_SIGNATURES_CREATE', 'ehr:signatures:create'),
  ('EHR_SIGNATURES_READ', 'ehr:signatures:read'),
  ('EHR_SIGNATURES_VERIFY', 'ehr:signatures:verify'),
  ('EHR_SIGNATURES_REVOKE', 'ehr:signatures:revoke'),
  ('EHR_ANALYTICS_READ', 'ehr:analytics:read'),
  ('EHR_ANALYTICS_EXPORT', 'ehr:analytics:export'),
  ('EHR_ANALYTICS_TRENDS', 'ehr:analytics:trends'),
  ('EHR_READ', 'ehr:read'),
  ('EHR_MANAGE', 'ehr:manage'),
  
-- PREVENTIVE CARE → preventive_care:*
  ('PREVENTIVE_CARE_CREATE', 'preventive_care:create'),
  ('PREVENTIVE_CARE_READ', 'preventive_care:read'),
  ('PREVENTIVE_CARE_UPDATE', 'preventive_care:update'),
  ('PREVENTIVE_CARE_DELETE', 'preventive_care:delete'),
  ('PREVENTIVE_CARE_COMPLETE', 'preventive_care:complete'),
  
-- REMINDERS → reminders:*
  ('REMINDERS_CREATE', 'reminders:create'),
  ('REMINDERS_READ', 'reminders:read'),
  ('REMINDERS_SEND', 'reminders:send'),
  ('REMINDERS_CANCEL', 'reminders:cancel'),
  ('REMINDERS_QUEUE', 'reminders:queue:manage'),
  
-- POS → pos:*
  ('POS_PRODUCTS_CREATE', 'pos:products:create'),
  ('POS_PRODUCTS_READ', 'pos:products:read'),
  ('POS_PRODUCTS_UPDATE', 'pos:products:update'),
  ('POS_PRODUCTS_DELETE', 'pos:products:delete'),
  ('POS_SALES_CREATE', 'pos:sales:create'),
  ('POS_SALES_READ', 'pos:sales:read'),
  ('POS_SALES_UPDATE', 'pos:sales:update'),
  ('POS_SALES_COMPLETE', 'pos:sales:complete'),
  ('POS_SALES_CANCEL', 'pos:sales:cancel'),
  ('POS_SALES_REFUND', 'pos:sales:refund'),
  ('POS_INVENTORY_READ', 'pos:inventory:read'),
  ('POS_INVENTORY_ADJUST', 'pos:inventory:adjust'),
  ('POS_INVENTORY_HISTORY', 'pos:inventory:history'),
  ('POS_PAYMENTS_CREATE', 'pos:payments:create'),
  ('POS_PAYMENTS_READ', 'pos:payments:read'),
  ('POS_REPORTS', 'pos:reports:access'),
  
-- SERVICES → services:*
  ('SERVICES_CREATE', 'services:create'),
  ('SERVICES_READ', 'services:read'),
  ('SERVICES_UPDATE', 'services:update'),
  ('SERVICES_DEACTIVATE', 'services:deactivate'),
  ('SERVICES_DELETE', 'services:delete'),
  
-- PACKAGES → packages:*
  ('PACKAGES_CREATE', 'packages:create'),
  ('PACKAGES_READ', 'packages:read'),
  ('PACKAGES_UPDATE', 'packages:update'),
  ('PACKAGES_DEACTIVATE', 'packages:deactivate'),
  ('PACKAGES_DELETE', 'packages:delete'),
  
-- PRICING → pricing:*
  ('PRICING_PRICE_LISTS_CREATE', 'pricing:price_lists:create'),
  ('PRICING_PRICE_LISTS_READ', 'pricing:price_lists:read'),
  ('PRICING_PRICE_LISTS_DELETE', 'pricing:price_lists:delete'),
  ('PRICING_SERVICE_PRICES_CREATE', 'pricing:service_prices:create'),
  ('PRICING_SERVICE_PRICES_UPDATE', 'pricing:service_prices:update'),
  ('PRICING_SERVICE_PRICES_DELETE', 'pricing:service_prices:delete'),
  ('PRICING_SERVICE_PRICES_READ', 'pricing:service_prices:read'),
  ('PRICING_PACKAGE_PRICES_CREATE', 'pricing:package_prices:create'),
  ('PRICING_PACKAGE_PRICES_UPDATE', 'pricing:package_prices:update'),
  ('PRICING_PACKAGE_PRICES_DELETE', 'pricing:package_prices:delete'),
  ('PRICING_PACKAGE_PRICES_READ', 'pricing:package_prices:read'),
  ('PRICING_CALCULATE', 'pricing:calculate'),
  ('PRICING_HISTORY', 'pricing:history:read'),
  
-- STYLISTS → stylists:*
  ('STYLISTS_READ', 'stylists:read'),
  ('STYLISTS_UPDATE', 'stylists:update'),
  ('STYLISTS_AVAILABILITY_CREATE', 'stylists:availability:create'),
  ('STYLISTS_AVAILABILITY_READ', 'stylists:availability:read'),
  ('STYLISTS_AVAILABILITY_UPDATE', 'stylists:availability:update'),
  ('STYLISTS_AVAILABILITY_DELETE', 'stylists:availability:delete'),
  ('STYLISTS_UNAVAILABLE_CREATE', 'stylists:unavailable:create'),
  ('STYLISTS_UNAVAILABLE_READ', 'stylists:unavailable:read'),
  ('STYLISTS_UNAVAILABLE_UPDATE', 'stylists:unavailable:update'),
  ('STYLISTS_UNAVAILABLE_DELETE', 'stylists:unavailable:delete'),
  ('STYLISTS_CAPACITY_CREATE', 'stylists:capacity:create'),
  ('STYLISTS_CAPACITY_READ', 'stylists:capacity:read'),
  ('STYLISTS_CAPACITY_UPDATE', 'stylists:capacity:update'),
  ('STYLISTS_CAPACITY_DELETE', 'stylists:capacity:delete'),
  ('STYLISTS_SLOTS', 'stylists:slots:manage'),
  
-- VETERINARIANS → veterinarians:*
  ('VETERINARIANS_CREATE', 'veterinarians:create'),
  ('VETERINARIANS_READ', 'veterinarians:read'),
  ('VETERINARIANS_UPDATE', 'veterinarians:update'),
  ('VETERINARIANS_DELETE', 'veterinarians:delete'),
  
-- ROUTES → routes:*
  ('ROUTES_OPTIMIZE', 'routes:optimize'),
  ('ROUTES_VALIDATE', 'routes:validate'),
  ('ROUTES_CONFIG', 'routes:configure'),
  ('ROUTES_PLAN_HOME_GROOMING', 'routes:plan_home_grooming'),
  
-- CAMPAIGNS → campaigns:*
  ('CAMPAIGNS_CREATE', 'campaigns:create'),
  ('CAMPAIGNS_READ', 'campaigns:read'),
  ('CAMPAIGNS_UPDATE', 'campaigns:update'),
  ('CAMPAIGNS_DELETE', 'campaigns:delete'),
  ('CAMPAIGNS_START', 'campaigns:start'),
  ('CAMPAIGNS_PAUSE', 'campaigns:pause'),
  ('CAMPAIGNS_RESUME', 'campaigns:resume'),
  ('CAMPAIGNS_METRICS', 'campaigns:metrics:read'),
  ('CAMPAIGNS_RECIPIENTS', 'campaigns:recipients:read'),
  ('CAMPAIGNS_PREVIEW_AUDIENCE', 'campaigns:audience:preview'),
  ('CAMPAIGN_TEMPLATES_CREATE', 'campaigns:templates:create'),
  ('CAMPAIGN_TEMPLATES_READ', 'campaigns:templates:read'),
  ('CAMPAIGN_TEMPLATES_UPDATE', 'campaigns:templates:update'),
  ('CAMPAIGN_TEMPLATES_DELETE', 'campaigns:templates:delete'),
  ('CAMPAIGN_TEMPLATES_PREVIEW', 'campaigns:templates:preview'),
  ('CAMPAIGN_TEMPLATES_RENDER', 'campaigns:templates:render'),
  ('CAMPAIGN_TEMPLATES_VARIABLES', 'campaigns:templates:variables'),
  
-- NOTIFICATIONS → notifications:*
  ('NOTIFICATIONS_CREATE', 'notifications:create'),
  ('NOTIFICATIONS_READ', 'notifications:read'),
  ('NOTIFICATIONS_DETAILS', 'notifications:details:read'),
  ('NOTIFICATIONS_QUEUE', 'notifications:queue:manage'),
  ('NOTIFICATIONS_ERRORS', 'notifications:errors:read'),
  ('NOTIFICATIONS_RETRY', 'notifications:retry'),
  ('NOTIFICATIONS_DELETE', 'notifications:delete'),
  
-- WHATSAPP → whatsapp:*
  ('WHATSAPP_SEND', 'whatsapp:send'),
  ('WHATSAPP_READ_OUTBOX', 'whatsapp:outbox:read'),
  ('WHATSAPP_READ_MESSAGE', 'whatsapp:messages:read'),
  ('WHATSAPP_RETRY', 'whatsapp:retry'),
  
-- EMAIL → email:*
  ('EMAIL_SEND', 'email:send'),
  ('EMAIL_READ_OUTBOX', 'email:outbox:read'),
  ('EMAIL_RETRY', 'email:retry'),
  
-- REPORTS → reports:*
  ('REPORTS_VIEW', 'reports:view'),
  ('REPORTS_REVENUE', 'reports:revenue:read'),
  ('REPORTS_APPOINTMENTS', 'reports:appointments:read'),
  ('REPORTS_CLIENTS', 'reports:clients:read'),
  ('REPORTS_SERVICES', 'reports:services:read'),
  ('REPORTS_PERFORMANCE', 'reports:performance:read'),
  ('REPORTS_GEOGRAPHY', 'reports:geography:read'),
  ('REPORTS_EXPORT', 'reports:export'),
  
-- DASHBOARD → dashboard:*
  ('DASHBOARD_CLINIC', 'dashboard:clinic:access');

-- ============================================================================
-- PASO 3: ACTUALIZAR CÓDIGOS EN TABLA PERMISSIONS
-- ============================================================================

SELECT '=== ACTUALIZANDO CÓDIGOS DE PERMISOS ===' as fase;

-- Actualizar solo permisos que están en el mapeo
UPDATE permissions
SET code = pm.new_code
FROM permission_mapping pm
WHERE permissions.code = pm.old_code;

SELECT 
  'Éxito: Permisos actualizados' as resultado,
  COUNT(*) as cantidad
FROM permissions;

-- ============================================================================
-- PASO 4: VERIFICACIÓN - Mostrar nuevos formatos
-- ============================================================================

SELECT '=== VERIFICACIÓN FINAL ===' as fase;

SELECT 
  CASE 
    WHEN code ~ '^[a-z:]+$' THEN '✓ lowercase:colon:separated (ESTÁNDAR)'
    WHEN code ~ '^[a-z_]+$' THEN '⚠ lowercase_snake_case (REVISAR)'
    WHEN code ~ '^[A-Z_]+$' THEN '✗ UPPERCASE_SNAKE_CASE (ANTIGUO)'
    ELSE '? OTRO FORMATO'
  END as formato,
  COUNT(*) as cantidad,
  array_agg(code LIMIT 3) as ejemplos
FROM permissions
GROUP BY 
  CASE 
    WHEN code ~ '^[a-z:]+$' THEN '✓ lowercase:colon:separated (ESTÁNDAR)'
    WHEN code ~ '^[a-z_]+$' THEN '⚠ lowercase_snake_case (REVISAR)'
    WHEN code ~ '^[A-Z_]+$' THEN '✗ UPPERCASE_SNAKE_CASE (ANTIGUO)'
    ELSE '? OTRO FORMATO'
  END
ORDER BY formato;

-- ============================================================================
-- PASO 5: VERIFICAR INTEGRIDAD DE ROLE_PERMISSIONS
-- ============================================================================

SELECT 
  'Verifying role_permissions integrity' as paso,
  COUNT(rp.id) as role_perm_count,
  COUNT(DISTINCT p.id) as unique_permissions
FROM role_permissions rp
LEFT JOIN permissions p ON rp.permission_id = p.id;

-- ============================================================================
-- PASO 6: SAMPLE - Ver nuevos permisos de CLINIC_OWNER
-- ============================================================================

SELECT '=== MUESTRA: Permisos de CLINIC_OWNER después ===' as fase;

SELECT 
  p.code as permiso,
  p.description as descripción
FROM role_permissions rp
JOIN roles r ON rp.role_id = r.id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.code = 'CLINIC_OWNER'
ORDER BY p.code
LIMIT 30;

COMMIT;

-- ============================================================================
-- ROLLBACK EN CASO DE ERROR
-- ============================================================================
-- ROLLBACK;
