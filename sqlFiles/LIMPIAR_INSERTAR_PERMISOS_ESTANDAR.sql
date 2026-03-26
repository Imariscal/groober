-- ============================================================================
-- SCRIPT: LIMPIAR Y REINSERTAR PERMISOS CON ESTÁNDAR ÚNICO
-- ============================================================================
-- Objetivo: 
-- 1. Eliminar TODOS los permisos en formato legacy (UPPERCASE, lowercase_snake, mixed)
-- 2. Insertar SOLO permisos en formato estándar: lowercase:colon:separated
-- 3. Borrar role_permissions de CLINIC_OWNER
-- 4. Reinsertar permisos de CLINIC_OWNER desde const
-- 
-- Estándar: ehr:vaccinations:update (no medical:vaccinations:update, no EHR_VACCINATIONS_UPDATE)
-- Fecha: 2026-03-24
-- ============================================================================

BEGIN TRANSACTION;

-- ============================================================================
-- PASO 1: BACKUP - Ver estado actual
-- ============================================================================

SELECT '=== ESTADO INICIAL ===' as paso;
SELECT COUNT(*) as total_permisos FROM permissions;
SELECT COUNT(*) as clinic_owner_perms FROM role_permissions rp 
JOIN roles r ON rp.role_id = r.id WHERE r.code = 'CLINIC_OWNER';

-- ============================================================================
-- PASO 2: ELIMINAR role_permissions para CLINIC_OWNER (para reinsertar limpio)
-- ============================================================================

DELETE FROM role_permissions 
WHERE role_id = (SELECT id FROM roles WHERE code = 'CLINIC_OWNER');

SELECT 'Eliminados: role_permissions para CLINIC_OWNER' as paso;

-- ============================================================================
-- PASO 3: ELIMINAR permisos en formato LEGACY (UPPERCASE_SNAKE_CASE)
-- ============================================================================

DELETE FROM permissions 
WHERE code ~ '^[A-Z_]+$';

SELECT 'Eliminados: Permisos UPPERCASE_SNAKE_CASE' as paso;

-- ============================================================================
-- PASO 4: ELIMINAR permisos en formato legacy snake_case
-- ============================================================================

DELETE FROM permissions 
WHERE code ~ '^[a-z_]+$';

SELECT 'Eliminados: Permisos lowercase_snake_case' as paso;

-- ============================================================================
-- PASO 5: ELIMINAR permisos duplicados o inconsistentes (medical:* en lugar de ehr:*)
-- ============================================================================

DELETE FROM permissions 
WHERE code LIKE 'medical:%' OR code LIKE 'medical_%';

SELECT 'Eliminados: Permisos medical:* legacy' as paso;

-- ============================================================================
-- PASO 6: VERIFICAR que quedan solo permisos en formato estándar
-- ============================================================================

SELECT '=== PERMISOS RESTANTES ===' as paso,
  COUNT(*) as total,
  COUNT(CASE WHEN code ~ '^[a-z:]+$' THEN 1 END) as formato_correcto,
  MAX(code) as ejemplo
FROM permissions;

-- ============================================================================
-- PASO 7: INSERTAR PERMISOS DE CLINIC_OWNER (desde ROLES_PERMISSIONS const)
-- ============================================================================

-- Basado en roles-permissions.const.ts CLINIC_OWNER
INSERT INTO permissions (code, name, description, category)
VALUES
  -- CLINIC
  ('clinic:manage', 'Administrar clínica', 'Administrar clínica', 'Clínica'),
  ('clinic:settings', 'Configurar clínica', 'Configurar clínica', 'Clínica'),
  ('clinic:branding', 'Configurar marca y branding', 'Configurar marca y branding', 'Clínica'),
  ('clinic:communication:config', 'Configurar comunicación (Email, WhatsApp)', 'Configurar comunicación', 'Clínica'),
  ('clinic:communication:read', 'Ver configuración de comunicación', 'Ver comunicación', 'Clínica'),
  ('clinic:calendar:manage', 'Gestionar excepciones de calendario', 'Gestionar calendario', 'Clínica'),
  
  -- USERS
  ('users:create', 'Crear usuarios de clínica', 'Crear usuarios', 'Usuarios'),
  ('users:read', 'Ver usuarios', 'Ver usuarios', 'Usuarios'),
  ('users:update', 'Editar usuarios', 'Editar usuarios', 'Usuarios'),
  ('users:deactivate', 'Desactivar usuarios', 'Desactivar', 'Usuarios'),
  ('users:delete', 'Eliminar usuarios', 'Eliminar', 'Usuarios'),
  
  -- ROLES
  ('roles:create', 'Crear roles personalizados', 'Crear roles', 'Roles'),
  ('roles:read', 'Ver roles', 'Ver roles', 'Roles'),
  ('roles:update', 'Editar roles', 'Editar roles', 'Roles'),
  ('roles:delete', 'Eliminar roles', 'Eliminar roles', 'Roles'),
  ('roles:permissions:list', 'Listar permisos disponibles', 'Listar permisos', 'Roles'),
  
  -- CLIENTS
  ('clients:create', 'Crear clientes', 'Crear clientes', 'Clientes'),
  ('clients:read', 'Ver clientes', 'Ver clientes', 'Clientes'),
  ('clients:update', 'Editar clientes', 'Editar clientes', 'Clientes'),
  ('clients:deactivate', 'Desactivar clientes', 'Desactivar', 'Clientes'),
  ('clients:delete', 'Eliminar clientes', 'Eliminar', 'Clientes'),
  ('clients:addresses:create', 'Crear direcciones de cliente', 'Crear direcciones', 'Clientes'),
  ('clients:addresses:read', 'Ver direcciones', 'Ver direcciones', 'Clientes'),
  ('clients:addresses:update', 'Editar direcciones', 'Editar direcciones', 'Clientes'),
  ('clients:addresses:delete', 'Eliminar direcciones', 'Eliminar', 'Clientes'),
  ('clients:addresses:set_default', 'Establecer dirección por defecto', 'Set default', 'Clientes'),
  ('clients:tags:create', 'Crear tags de cliente', 'Crear tags', 'Clientes'),
  ('clients:tags:read', 'Ver tags', 'Ver tags', 'Clientes'),
  ('clients:tags:delete', 'Eliminar tags', 'Eliminar', 'Clientes'),
  
  -- PETS
  ('pets:create', 'Crear mascotas', 'Crear mascotas', 'Mascotas'),
  ('pets:read', 'Ver mascotas', 'Ver mascotas', 'Mascotas'),
  ('pets:update', 'Editar mascotas', 'Editar mascotas', 'Mascotas'),
  ('pets:delete', 'Eliminar mascotas', 'Eliminar', 'Mascotas'),
  
  -- APPOINTMENTS
  ('appointments:create', 'Crear citas', 'Crear citas', 'Citas'),
  ('appointments:read', 'Ver citas', 'Ver citas', 'Citas'),
  ('appointments:update', 'Editar citas', 'Editar citas', 'Citas'),
  ('appointments:update_status', 'Cambiar estado de cita', 'Cambiar estado', 'Citas'),
  ('appointments:update_services', 'Actualizar servicios de cita', 'Actualizar servicios', 'Citas'),
  ('appointments:complete', 'Completar cita', 'Completar', 'Citas'),
  ('appointments:check_availability', 'Verificar disponibilidad de estilista', 'Check disponibilidad', 'Citas'),
  
  -- VISITS
  ('visits:create', 'Crear visitas clínicas', 'Crear visitas', 'Visitas'),
  ('visits:read', 'Ver visitas clínicas', 'Ver visitas', 'Visitas'),
  ('visits:update', 'Editar visitas clínicas', 'Editar visitas', 'Visitas'),
  ('visits:update_status', 'Cambiar estado de visita', 'Cambiar estado', 'Visitas'),
  ('visits:complete', 'Completar visita', 'Completar', 'Visitas'),
  ('visits:cancel', 'Cancelar visita', 'Cancelar', 'Visitas'),
  
  -- EHR - Expediente Médico (ESTÁNDAR)
  ('ehr:medical_history:create', 'Crear historial médico', 'Crear historial', 'EHR'),
  ('ehr:medical_history:read', 'Ver historial médico', 'Ver historial', 'EHR'),
  ('ehr:medical_history:update', 'Editar historial médico', 'Editar historial', 'EHR'),
  ('ehr:medical_history:sign', 'Firmar registros médicos', 'Firmar', 'EHR'),
  
('ehr:diagnostics:create', 'Agregar diagnósticos', 'Crear diagnóstico', 'EHR'),
  ('ehr:diagnostics:read', 'Ver diagnósticos', 'Ver diagnóstico', 'EHR'),
  ('ehr:diagnostics:update', 'Editar diagnósticos', 'Editar diagnóstico', 'EHR'),

  ('ehr:prescriptions:create', 'Crear prescripciones', 'Crear prescripción', 'EHR'),
  ('ehr:prescriptions:read', 'Ver prescripciones', 'Ver prescripción', 'EHR'),
  ('ehr:prescriptions:update', 'Editar prescripciones', 'Editar prescripción', 'EHR'),
  ('ehr:prescriptions:cancel', 'Cancelar prescripciones', 'Cancelar', 'EHR'),

  ('ehr:vaccinations:create', 'Crear registro de vacunas', 'Crear vacuna', 'EHR'),
  ('ehr:vaccinations:read', 'Ver registro de vacunas', 'Ver vacuna', 'EHR'),
  ('ehr:vaccinations:update', 'Editar registro de vacunas', 'Editar vacuna', 'EHR'),

  ('ehr:allergies:create', 'Crear alergias', 'Crear alergia', 'EHR'),
  ('ehr:allergies:read', 'Ver alergias', 'Ver alergia', 'EHR'),
  ('ehr:allergies:update', 'Editar alergias', 'Editar alergia', 'EHR'),
  
('ehr:diagnostic_orders:create', 'Crear órdenes de diagnóstico', 'Crear orden', 'EHR'),
  ('ehr:diagnostic_orders:read', 'Ver órdenes de diagnóstico', 'Ver orden', 'EHR'),
  ('ehr:diagnostic_orders:update', 'Editar órdenes de diagnóstico', 'Editar orden', 'EHR'),

  ('ehr:procedures:create', 'Registrar procedimientos médicos', 'Crear procedimiento', 'EHR'),
  ('ehr:procedures:read', 'Ver procedimientos médicos', 'Ver procedimiento', 'EHR'),

  ('ehr:follow_ups:create', 'Crear notas de seguimiento', 'Crear nota', 'EHR'),
  ('ehr:follow_ups:read', 'Ver notas de seguimiento', 'Ver nota', 'EHR'),

  ('ehr:history:read', 'Ver historial médico completo', 'Ver historial completo', 'EHR'),
  ('ehr:attachments:create', 'Subir adjuntos médicos', 'Crear adjunto', 'EHR'),
  ('ehr:attachments:read', 'Ver adjuntos médicos', 'Ver adjunto', 'EHR'),
  ('ehr:attachments:delete', 'Eliminar adjuntos médicos', 'Eliminar', 'EHR'),
  ('ehr:attachments:download', 'Descargar adjuntos médicos', 'Descargar', 'EHR'),
  ('ehr:signatures:create', 'Crear firma digital de expediente', 'Crear firma', 'EHR'),
  ('ehr:signatures:read', 'Ver firmas digitales', 'Ver firma', 'EHR'),
  ('ehr:signatures:verify', 'Verificar autenticidad de firmas', 'Verificar', 'EHR'),
  ('ehr:signatures:revoke', 'Revocar firma digital', 'Revocar', 'EHR'),
  ('ehr:analytics:read', 'Ver reportes de EHR', 'Ver reportes', 'EHR'),
  ('ehr:analytics:export', 'Exportar reportes de EHR', 'Exportar', 'EHR'),
  ('ehr:analytics:trends', 'Ver tendencias médicas', 'Ver tendencias', 'EHR'),
  ('ehr:read', 'Acceso general a expediente médico', 'Acceso general', 'EHR'),
  ('ehr:manage', 'Administrar expediente médico', 'Administrar', 'EHR'),
  
  -- PREVENTIVE CARE
  ('preventive_care:create', 'Crear eventos de cuidado preventivo', 'Crear evento', 'Cuidado Preventivo'),
  ('preventive_care:read', 'Ver eventos de cuidado preventivo', 'Ver evento', 'Cuidado Preventivo'),
  ('preventive_care:update', 'Editar eventos de cuidado preventivo', 'Editar evento', 'Cuidado Preventivo'),
  ('preventive_care:delete', 'Eliminar eventos de cuidado preventivo', 'Eliminar', 'Cuidado Preventivo'),
  ('preventive_care:complete', 'Completar evento preventivo', 'Completar', 'Cuidado Preventivo'),
  
  -- REMINDERS
  ('reminders:create', 'Crear recordatorios', 'Crear recordatorio', 'Recordatorios'),
  ('reminders:read', 'Ver recordatorios', 'Ver recordatorio', 'Recordatorios'),
  ('reminders:send', 'Enviar recordatorios', 'Enviar', 'Recordatorios'),
  ('reminders:cancel', 'Cancelar recordatorios', 'Cancelar', 'Recordatorios'),
  ('reminders:queue', 'Ver cola de recordatorios', 'Ver cola', 'Recordatorios'),
  
  -- POS
  ('pos:products:create', 'Crear productos POS', 'Crear producto', 'POS'),
  ('pos:products:read', 'Ver productos POS', 'Ver producto', 'POS'),
  ('pos:products:update', 'Editar productos POS', 'Editar', 'POS'),
  ('pos:products:delete', 'Eliminar productos POS', 'Eliminar', 'POS'),
  ('pos:sales:create', 'Crear ventas POS', 'Crear venta', 'POS'),
  ('pos:sales:read', 'Ver ventas POS', 'Ver venta', 'POS'),
  ('pos:sales:update', 'Editar ventas POS', 'Editar venta', 'POS'),
  ('pos:sales:complete', 'Completar ventas POS', 'Completar', 'POS'),
  ('pos:sales:cancel', 'Cancelar ventas POS', 'Cancelar', 'POS'),
  ('pos:sales:refund', 'Reembolsar ventas POS', 'Reembolsar', 'POS'),
  ('pos:inventory:read', 'Ver inventario POS', 'Ver inventario', 'POS'),
  ('pos:inventory:adjust', 'Ajustar inventario POS', 'Ajustar', 'POS'),
  ('pos:inventory:history', 'Ver historial de inventario', 'Ver historial', 'POS'),
  ('pos:payments:create', 'Registrar pagos POS', 'Crear pago', 'POS'),
  ('pos:payments:read', 'Ver pagos POS', 'Ver pago', 'POS'),
  ('pos:reports', 'Ver reportes de POS', 'Ver reportes', 'POS'),
  
  -- SERVICES
  ('services:create', 'Crear servicios', 'Crear servicio', 'Servicios'),
  ('services:read', 'Ver servicios', 'Ver servicio', 'Servicios'),
  ('services:update', 'Editar servicios', 'Editar servicio', 'Servicios'),
  ('services:deactivate', 'Desactivar servicios', 'Desactivar', 'Servicios'),
  ('services:delete', 'Eliminar servicios', 'Eliminar', 'Servicios'),

  -- PACKAGES
  ('packages:create', 'Crear paquetes', 'Crear paquete', 'Paquetes'),
  ('packages:read', 'Ver paquetes', 'Ver paquete', 'Paquetes'),
  ('packages:update', 'Editar paquetes', 'Editar paquete', 'Paquetes'),
  ('packages:deactivate', 'Desactivar paquetes', 'Desactivar', 'Paquetes'),
  ('packages:delete', 'Eliminar paquetes', 'Eliminar', 'Paquetes'),
  -- PRICING
  ('pricing:price_lists:create', 'Crear listas de precios', 'Crear lista', 'Precios'),
  ('pricing:price_lists:read', 'Ver listas de precios', 'Ver lista', 'Precios'),
  ('pricing:price_lists:delete', 'Eliminar listas de precios', 'Eliminar', 'Precios'),
  ('pricing:service_prices:create', 'Establecer precio de servicio', 'Crear precio', 'Precios'),
  ('pricing:service_prices:update', 'Actualizar precio de servicio', 'Editar precio', 'Precios'),
  ('pricing:service_prices:delete', 'Eliminar precio de servicio', 'Eliminar', 'Precios'),
  ('pricing:service_prices:read', 'Ver precios de servicios', 'Ver precio', 'Precios'),
  ('pricing:package_prices:create', 'Establecer precio de paquete', 'Crear precio', 'Precios'),
  ('pricing:package_prices:update', 'Actualizar precio de paquete', 'Editar precio', 'Precios'),
  ('pricing:package_prices:delete', 'Eliminar precio de paquete', 'Eliminar', 'Precios'),
  ('pricing:package_prices:read', 'Ver precios de paquetes', 'Ver precio', 'Precios'),
  ('pricing:calculate', 'Calcular precios de cita', 'Calcular', 'Precios'),
  ('pricing:history', 'Ver historial de precios', 'Ver historial', 'Precios'),
  
  -- STYLISTS
  ('stylists:read', 'Ver estilistas', 'Ver estilista', 'Estilistas'),
  ('stylists:update', 'Editar estilistas', 'Editar estilista', 'Estilistas'),
  ('stylists:availability:create', 'Crear disponibilidad de estilista', 'Crear', 'Estilistas'),
  ('stylists:availability:read', 'Ver disponibilidades', 'Ver', 'Estilistas'),
  ('stylists:availability:update', 'Editar disponibilidades', 'Editar', 'Estilistas'),
  ('stylists:availability:delete', 'Eliminar disponibilidades', 'Eliminar', 'Estilistas'),
  ('stylists:unavailable:create', 'Crear período no disponible', 'Crear', 'Estilistas'),
  ('stylists:unavailable:read', 'Ver períodos no disponibles', 'Ver', 'Estilistas'),
  ('stylists:unavailable:update', 'Editar períodos no disponibles', 'Editar', 'Estilistas'),
  ('stylists:unavailable:delete', 'Eliminar períodos no disponibles', 'Eliminar', 'Estilistas'),
  ('stylists:capacity:create', 'Crear capacidad de estilista', 'Crear', 'Estilistas'),
  ('stylists:capacity:read', 'Ver capacidades', 'Ver', 'Estilistas'),
  ('stylists:capacity:update', 'Editar capacidades', 'Editar', 'Estilistas'),
  ('stylists:capacity:delete', 'Eliminar capacidades', 'Eliminar', 'Estilistas'),
  ('stylists:slots', 'Ver slots disponibles', 'Ver slots', 'Estilistas'),
  
  -- VETERINARIANS
  ('veterinarians:create', 'Crear veterinarios', 'Crear veterinario', 'Veterinarios'),
  ('veterinarians:read', 'Ver veterinarios', 'Ver veterinario', 'Veterinarios'),
  ('veterinarians:update', 'Editar veterinarios', 'Editar veterinario', 'Veterinarios'),
  ('veterinarians:delete', 'Eliminar veterinarios', 'Eliminar', 'Veterinarios'),
  
  -- ROUTES
  ('routes:optimize', 'Optimizar rutas', 'Optimizar rutas', 'Rutas'),
  ('routes:validate', 'Validar optimización de rutas', 'Validar rutas', 'Rutas'),
  ('routes:config', 'Configurar parámetros de rutas', 'Configurar rutas', 'Rutas'),
  ('routes:plan_home_grooming', 'Planificar grooming a domicilio', 'Planificar grooming', 'Rutas'),
  
  -- CAMPAIGNS
  ('campaigns:create', 'Crear campañas', 'Crear campaña', 'Campañas'),
  ('campaigns:read', 'Ver campañas', 'Ver campaña', 'Campañas'),
  ('campaigns:update', 'Editar campañas', 'Editar campaña', 'Campañas'),
  ('campaigns:delete', 'Eliminar campañas', 'Eliminar', 'Campañas'),
  ('campaigns:start', 'Iniciar campaña', 'Iniciar', 'Campañas'),
  ('campaigns:pause', 'Pausar campaña', 'Pausar', 'Campañas'),
  ('campaigns:resume', 'Reanudar campaña', 'Reanudar', 'Campañas'),
  ('campaigns:metrics', 'Ver métricas de campaña', 'Ver métricas', 'Campañas'),
  ('campaigns:recipients', 'Ver destinatarios de campaña', 'Ver destinatarios', 'Campañas'),
  ('campaigns:preview_audience', 'Previsualizar audiencia', 'Previsualizar', 'Campañas'),
  ('campaign_templates:create', 'Crear plantillas de campaña', 'Crear plantilla', 'Campañas'),
  ('campaign_templates:read', 'Ver plantillas', 'Ver plantilla', 'Campañas'),
  ('campaign_templates:update', 'Editar plantillas', 'Editar plantilla', 'Campañas'),
  ('campaign_templates:delete', 'Eliminar plantillas', 'Eliminar', 'Campañas'),
  ('campaign_templates:preview', 'Previsualizar plantilla', 'Previsualizar', 'Campañas'),
  ('campaign_templates:render', 'Renderizar plantilla', 'Renderizar', 'Campañas'),
  ('campaign_templates:variables', 'Ver variables soportadas', 'Ver variables', 'Campañas'),
  
  -- NOTIFICATIONS
  ('notifications:create', 'Crear notificaciones', 'Crear notificación', 'Notificaciones'),
  ('notifications:read', 'Ver notificaciones', 'Ver notificación', 'Notificaciones'),
  ('notifications:details', 'Ver detalles de notificación', 'Ver detalles', 'Notificaciones'),
  ('notifications:queue', 'Ver cola de notificaciones', 'Ver cola', 'Notificaciones'),
  ('notifications:errors', 'Ver errores de notificación', 'Ver errores', 'Notificaciones'),
  ('notifications:retry', 'Reintentar notificaciones', 'Reintentar', 'Notificaciones'),
  ('notifications:delete', 'Eliminar notificaciones', 'Eliminar', 'Notificaciones'),
  
  -- WHATSAPP
  ('whatsapp:send', 'Enviar mensajes WhatsApp', 'Enviar WhatsApp', 'WhatsApp'),
  ('whatsapp:read_outbox', 'Ver bandeja salida WhatsApp', 'Ver bandeja', 'WhatsApp'),
  ('whatsapp:read_message', 'Ver mensaje WhatsApp', 'Ver mensaje', 'WhatsApp'),
  ('whatsapp:retry', 'Reintentar envío WhatsApp', 'Reintentar', 'WhatsApp'),

  -- EMAIL
  ('email:send', 'Enviar emails', 'Enviar email', 'Email'),
  ('email:read_outbox', 'Ver bandeja salida emails', 'Ver bandeja', 'Email'),
  ('email:retry', 'Reintentar envío emails', 'Reintentar', 'Email'),

  -- REPORTS
  ('reports:view', 'Ver reportes', 'Ver reportes', 'Reportes'),
  ('reports:revenue', 'Ver reportes de ingresos', 'Ver ingresos', 'Reportes'),
  ('reports:appointments', 'Ver reportes de citas', 'Ver citas', 'Reportes'),
  ('reports:clients', 'Ver reportes de clientes', 'Ver clientes', 'Reportes'),
  ('reports:services', 'Ver reportes de servicios', 'Ver servicios', 'Reportes'),
  ('reports:performance', 'Ver reportes de desempeño', 'Ver desempeño', 'Reportes'),
  ('reports:geography', 'Ver reportes geográficos', 'Ver geografía', 'Reportes'),
  ('reports:export', 'Exportar reportes', 'Exportar', 'Reportes'),

  -- DASHBOARD
  ('dashboard:clinic', 'Acceso a dashboard de clínica', 'Acceso dashboard', 'Dashboard')
ON CONFLICT (code) DO NOTHING;

SELECT 'Insertados: Permisos CLINIC_OWNER' as paso;

-- ============================================================================
-- PASO 8: ASIGNAR PERMISOS A CLINIC_OWNER
-- ============================================================================

INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  r.id,
  p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'CLINIC_OWNER'
ON CONFLICT DO NOTHING;

SELECT 'Asignados: Permisos a CLINIC_OWNER' as paso;

-- ============================================================================
-- PASO 9: VERIFICACIÓN FINAL
-- ============================================================================

SELECT '=== VERIFICACIÓN FINAL ===' as paso;

SELECT 
  'Total permisos en BD' as descripción,
  COUNT(*) as cantidad
FROM permissions;

SELECT 
  'Formato de permisos ahora' as descripción,
  CASE 
    WHEN code ~ '^[a-z:]+$' THEN 'ESTÁNDAR ✓'
    WHEN code ~ '^[a-z_]+$' THEN 'LEGACY ⚠'
    WHEN code ~ '^[A-Z_]+$' THEN 'LEGACY ✗'
    ELSE 'OTRO ?'
  END as formato,
  COUNT(*) as cantidad
FROM permissions
GROUP BY formato
ORDER BY cantidad DESC;

SELECT 
  'Permisos de CLINIC_OWNER' as descripción,
  COUNT(*) as total
FROM role_permissions rp
JOIN roles r ON rp.role_id = r.id
WHERE r.code = 'CLINIC_OWNER';

SELECT '=== EJEMPLOS DE PERMISOS CLINIC_OWNER ===' as paso;
SELECT 
  p.code,
  p.name
FROM role_permissions rp
JOIN roles r ON rp.role_id = r.id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.code = 'CLINIC_OWNER'
ORDER BY p.code
LIMIT 30;

COMMIT;

-- ============================================================================
-- SI ALGO FALLA, DESCOMENTA ROLLBACK:
-- ============================================================================
-- ROLLBACK;
