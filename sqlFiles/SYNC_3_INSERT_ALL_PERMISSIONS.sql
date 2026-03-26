-- ============================================================================
-- SCRIPT 3: INSERTAR - TODOS LOS PERMISOS DESDE roles-permissions.const.ts
-- ============================================================================
-- Descripción: Inserta TODOS los permisos con descripciones amigables
--              y categorías bien organizadas
-- Basado en: vibralive-backend/src/modules/auth/constants/roles-permissions.const.ts
-- Fecha: 2026-03-24
-- ============================================================================

BEGIN TRANSACTION;

-- ============================================================================
-- 1. PLATAFORMA (Super Admin)
-- ============================================================================

INSERT INTO permissions (id, code, name, description, category) VALUES
-- Clínicas
(gen_random_uuid(), 'platform:clinics:create', 'PLATFORM_CLINICS_CREATE', 'Crear nuevas clínicas', 'Plataforma'),
(gen_random_uuid(), 'platform:clinics:read', 'PLATFORM_CLINICS_READ', 'Ver todas las clínicas', 'Plataforma'),
(gen_random_uuid(), 'platform:clinics:update', 'PLATFORM_CLINICS_UPDATE', 'Editar clínicas', 'Plataforma'),
(gen_random_uuid(), 'platform:clinics:delete', 'PLATFORM_CLINICS_DELETE', 'Eliminar clínicas', 'Plataforma'),
(gen_random_uuid(), 'platform:clinics:suspend', 'PLATFORM_CLINICS_SUSPEND', 'Suspender clínicas', 'Plataforma'),
(gen_random_uuid(), 'platform:clinics:activate', 'PLATFORM_CLINICS_ACTIVATE', 'Activar clínicas', 'Plataforma'),

-- Planes de suscripción
(gen_random_uuid(), 'platform:plans:create', 'PLATFORM_PLANS_CREATE', 'Crear planes de suscripción', 'Plataforma'),
(gen_random_uuid(), 'platform:plans:read', 'PLATFORM_PLANS_READ', 'Ver planes', 'Plataforma'),
(gen_random_uuid(), 'platform:plans:update', 'PLATFORM_PLANS_UPDATE', 'Editar planes', 'Plataforma'),
(gen_random_uuid(), 'platform:plans:delete', 'PLATFORM_PLANS_DELETE', 'Eliminar planes', 'Plataforma'),
(gen_random_uuid(), 'platform:plans:toggle', 'PLATFORM_PLANS_TOGGLE', 'Activar/desactivar planes', 'Plataforma'),

-- Usuarios de plataforma
(gen_random_uuid(), 'platform:users:create', 'PLATFORM_USERS_CREATE', 'Crear usuarios en plataforma', 'Plataforma'),
(gen_random_uuid(), 'platform:users:read', 'PLATFORM_USERS_READ', 'Ver usuarios plataforma', 'Plataforma'),
(gen_random_uuid(), 'platform:users:update', 'PLATFORM_USERS_UPDATE', 'Editar usuarios plataforma', 'Plataforma'),
(gen_random_uuid(), 'platform:users:delete', 'PLATFORM_USERS_DELETE', 'Eliminar usuarios plataforma', 'Plataforma'),
(gen_random_uuid(), 'platform:users:impersonate', 'PLATFORM_USERS_IMPERSONATE', 'Impersonar usuarios', 'Plataforma'),

-- Dashboards y reportes
(gen_random_uuid(), 'platform:dashboard', 'PLATFORM_DASHBOARD', 'Acceso a dashboard de plataforma', 'Plataforma'),
(gen_random_uuid(), 'platform:reports', 'PLATFORM_REPORTS', 'Ver reportes de plataforma', 'Plataforma'),
(gen_random_uuid(), 'audit:read', 'AUDIT_READ', 'Ver logs de auditoría', 'Auditoría'),

-- ============================================================================
-- 2. CLÍNICA (Configuración)
-- ============================================================================

INSERT INTO permissions (id, code, name, description, category) VALUES
(gen_random_uuid(), 'clinic:manage', 'CLINIC_MANAGE', 'Administrar clínica', 'Configuración de Clínica'),
(gen_random_uuid(), 'clinic:settings', 'CLINIC_SETTINGS', 'Configurar clínica', 'Configuración de Clínica'),
(gen_random_uuid(), 'clinic:branding', 'CLINIC_BRANDING', 'Configurar marca y branding', 'Configuración de Clínica'),
(gen_random_uuid(), 'clinic:communication:config', 'CLINIC_COMMUNICATION_CONFIG', 'Configurar comunicación (Email, WhatsApp)', 'Configuración de Clínica'),
(gen_random_uuid(), 'clinic:communication:read', 'CLINIC_COMMUNICATION_READ', 'Ver configuración de comunicación', 'Configuración de Clínica'),
(gen_random_uuid(), 'clinic:calendar:manage', 'CLINIC_CALENDAR_MANAGE', 'Gestionar excepciones de calendario', 'Configuración de Clínica');

-- ============================================================================
-- 3. USUARIOS Y ROLES
-- ============================================================================

INSERT INTO permissions (id, code, name, description, category) VALUES
(gen_random_uuid(), 'users:create', 'USERS_CREATE', 'Crear usuarios de clínica', 'Usuarios y Roles'),
(gen_random_uuid(), 'users:read', 'USERS_READ', 'Ver usuarios', 'Usuarios y Roles'),
(gen_random_uuid(), 'users:update', 'USERS_UPDATE', 'Editar usuarios', 'Usuarios y Roles'),
(gen_random_uuid(), 'users:deactivate', 'USERS_DEACTIVATE', 'Desactivar usuarios', 'Usuarios y Roles'),
(gen_random_uuid(), 'users:delete', 'USERS_DELETE', 'Eliminar usuarios', 'Usuarios y Roles'),

(gen_random_uuid(), 'roles:create', 'ROLES_CREATE', 'Crear roles personalizados', 'Usuarios y Roles'),
(gen_random_uuid(), 'roles:read', 'ROLES_READ', 'Ver roles', 'Usuarios y Roles'),
(gen_random_uuid(), 'roles:update', 'ROLES_UPDATE', 'Editar roles', 'Usuarios y Roles'),
(gen_random_uuid(), 'roles:delete', 'ROLES_DELETE', 'Eliminar roles', 'Usuarios y Roles'),
(gen_random_uuid(), 'roles:permissions:list', 'ROLES_PERMISSIONS_LIST', 'Listar permisos disponibles', 'Usuarios y Roles');

-- ============================================================================
-- 4. CLIENTES Y MASCOTAS
-- ============================================================================

INSERT INTO permissions (id, code, name, description, category) VALUES
(gen_random_uuid(), 'clients:create', 'CLIENTS_CREATE', 'Crear clientes', 'Clientes y Mascotas'),
(gen_random_uuid(), 'clients:read', 'CLIENTS_READ', 'Ver clientes', 'Clientes y Mascotas'),
(gen_random_uuid(), 'clients:update', 'CLIENTS_UPDATE', 'Editar clientes', 'Clientes y Mascotas'),
(gen_random_uuid(), 'clients:deactivate', 'CLIENTS_DEACTIVATE', 'Desactivar clientes', 'Clientes y Mascotas'),
(gen_random_uuid(), 'clients:delete', 'CLIENTS_DELETE', 'Eliminar clientes', 'Clientes y Mascotas'),

(gen_random_uuid(), 'clients:addresses:create', 'CLIENTS_ADDRESSES_CREATE', 'Crear direcciones de cliente', 'Clientes y Mascotas'),
(gen_random_uuid(), 'clients:addresses:read', 'CLIENTS_ADDRESSES_READ', 'Ver direcciones', 'Clientes y Mascotas'),
(gen_random_uuid(), 'clients:addresses:update', 'CLIENTS_ADDRESSES_UPDATE', 'Editar direcciones', 'Clientes y Mascotas'),
(gen_random_uuid(), 'clients:addresses:delete', 'CLIENTS_ADDRESSES_DELETE', 'Eliminar direcciones', 'Clientes y Mascotas'),
(gen_random_uuid(), 'clients:addresses:set_default', 'CLIENTS_ADDRESSES_SET_DEFAULT', 'Establecer dirección por defecto', 'Clientes y Mascotas'),

(gen_random_uuid(), 'clients:tags:create', 'CLIENTS_TAGS_CREATE', 'Crear tags de cliente', 'Clientes y Mascotas'),
(gen_random_uuid(), 'clients:tags:read', 'CLIENTS_TAGS_READ', 'Ver tags', 'Clientes y Mascotas'),
(gen_random_uuid(), 'clients:tags:delete', 'CLIENTS_TAGS_DELETE', 'Eliminar tags', 'Clientes y Mascotas'),

(gen_random_uuid(), 'pets:create', 'PETS_CREATE', 'Crear mascotas', 'Clientes y Mascotas'),
(gen_random_uuid(), 'pets:read', 'PETS_READ', 'Ver mascotas', 'Clientes y Mascotas'),
(gen_random_uuid(), 'pets:update', 'PETS_UPDATE', 'Editar mascotas', 'Clientes y Mascotas'),
(gen_random_uuid(), 'pets:delete', 'PETS_DELETE', 'Eliminar mascotas', 'Clientes y Mascotas');

-- ============================================================================
-- 5. CITAS Y SERVICIOS
-- ============================================================================

INSERT INTO permissions (id, code, name, description, category) VALUES
(gen_random_uuid(), 'appointments:create', 'APPOINTMENTS_CREATE', 'Crear citas', 'Citas y Servicios'),
(gen_random_uuid(), 'appointments:read', 'APPOINTMENTS_READ', 'Ver citas', 'Citas y Servicios'),
(gen_random_uuid(), 'appointments:update', 'APPOINTMENTS_UPDATE', 'Editar citas', 'Citas y Servicios'),
(gen_random_uuid(), 'appointments:update_status', 'APPOINTMENTS_UPDATE_STATUS', 'Cambiar estado de cita', 'Citas y Servicios'),
(gen_random_uuid(), 'appointments:update_services', 'APPOINTMENTS_UPDATE_SERVICES', 'Actualizar servicios de cita', 'Citas y Servicios'),
(gen_random_uuid(), 'appointments:complete', 'APPOINTMENTS_COMPLETE', 'Completar cita', 'Citas y Servicios'),
(gen_random_uuid(), 'appointments:check_availability', 'APPOINTMENTS_CHECK_AVAILABILITY', 'Verificar disponibilidad de estilista', 'Citas y Servicios'),

(gen_random_uuid(), 'services:create', 'SERVICES_CREATE', 'Crear servicios', 'Citas y Servicios'),
(gen_random_uuid(), 'services:read', 'SERVICES_READ', 'Ver servicios', 'Citas y Servicios'),
(gen_random_uuid(), 'services:update', 'SERVICES_UPDATE', 'Editar servicios', 'Citas y Servicios'),
(gen_random_uuid(), 'services:deactivate', 'SERVICES_DEACTIVATE', 'Desactivar servicios', 'Citas y Servicios'),
(gen_random_uuid(), 'services:delete', 'SERVICES_DELETE', 'Eliminar servicios', 'Citas y Servicios'),

(gen_random_uuid(), 'packages:create', 'PACKAGES_CREATE', 'Crear paquetes', 'Citas y Servicios'),
(gen_random_uuid(), 'packages:read', 'PACKAGES_READ', 'Ver paquetes', 'Citas y Servicios'),
(gen_random_uuid(), 'packages:update', 'PACKAGES_UPDATE', 'Editar paquetes', 'Citas y Servicios'),
(gen_random_uuid(), 'packages:deactivate', 'PACKAGES_DEACTIVATE', 'Desactivar paquetes', 'Citas y Servicios'),
(gen_random_uuid(), 'packages:delete', 'PACKAGES_DELETE', 'Eliminar paquetes', 'Citas y Servicios');

-- ============================================================================
-- 6. VISITAS CLÍNICAS (Grooming y Veterinaria)
-- ============================================================================

INSERT INTO permissions (id, code, name, description, category) VALUES
(gen_random_uuid(), 'visits:create', 'VISITS_CREATE', 'Crear visitas clínicas', 'Visitas Clínicas'),
(gen_random_uuid(), 'visits:read', 'VISITS_READ', 'Ver visitas clínicas', 'Visitas Clínicas'),
(gen_random_uuid(), 'visits:update', 'VISITS_UPDATE', 'Editar visitas clínicas', 'Visitas Clínicas'),
(gen_random_uuid(), 'visits:update_status', 'VISITS_UPDATE_STATUS', 'Cambiar estado de visita', 'Visitas Clínicas'),
(gen_random_uuid(), 'visits:complete', 'VISITS_COMPLETE', 'Completar visita', 'Visitas Clínicas'),
(gen_random_uuid(), 'visits:cancel', 'VISITS_CANCEL', 'Cancelar visita', 'Visitas Clínicas');

-- ============================================================================
-- 7. EHR - EXPEDIENTE MÉDICO ELECTRÓNICO (Antiguo: medical_visits y medical:*)
-- ============================================================================

INSERT INTO permissions (id, code, name, description, category) VALUES
-- Visitas médicas (antiguo sistema - mantener para compatibilidad)
(gen_random_uuid(), 'medical_visits:create', 'MEDICAL_VISITS_CREATE', 'Crear registros médicos de visita', 'Expediente Médico Electrónico'),
(gen_random_uuid(), 'medical_visits:read', 'MEDICAL_VISITS_READ', 'Ver registros médicos de visita', 'Expediente Médico Electrónico'),
(gen_random_uuid(), 'medical_visits:update', 'MEDICAL_VISITS_UPDATE', 'Editar registros médicos', 'Expediente Médico Electrónico'),
(gen_random_uuid(), 'medical_visits:sign', 'MEDICAL_VISITS_SIGN', 'Firmar registros médicos', 'Expediente Médico Electrónico'),

-- Diagnósticos
(gen_random_uuid(), 'medical:diagnoses:create', 'MEDICAL_DIAGNOSES_CREATE', 'Agregar diagnósticos', 'Expediente Médico Electrónico'),
(gen_random_uuid(), 'medical:diagnoses:read', 'MEDICAL_DIAGNOSES_READ', 'Ver diagnósticos', 'Expediente Médico Electrónico'),
(gen_random_uuid(), 'medical:diagnoses:update', 'MEDICAL_DIAGNOSES_UPDATE', 'Editar diagnósticos', 'Expediente Médico Electrónico'),

-- Prescripciones
(gen_random_uuid(), 'medical:prescriptions:create', 'MEDICAL_PRESCRIPTIONS_CREATE', 'Crear prescripciones', 'Expediente Médico Electrónico'),
(gen_random_uuid(), 'medical:prescriptions:read', 'MEDICAL_PRESCRIPTIONS_READ', 'Ver prescripciones', 'Expediente Médico Electrónico'),
(gen_random_uuid(), 'medical:prescriptions:update', 'MEDICAL_PRESCRIPTIONS_UPDATE', 'Editar prescripciones', 'Expediente Médico Electrónico'),
(gen_random_uuid(), 'medical:prescriptions:cancel', 'MEDICAL_PRESCRIPTIONS_CANCEL', 'Cancelar prescripciones', 'Expediente Médico Electrónico'),

-- Vacunaciones
(gen_random_uuid(), 'medical:vaccinations:create', 'MEDICAL_VACCINATIONS_CREATE', 'Registrar vacunaciones', 'Expediente Médico Electrónico'),
(gen_random_uuid(), 'medical:vaccinations:read', 'MEDICAL_VACCINATIONS_READ', 'Ver vacunaciones', 'Expediente Médico Electrónico'),
(gen_random_uuid(), 'medical:vaccinations:update', 'MEDICAL_VACCINATIONS_UPDATE', 'Editar vacunaciones', 'Expediente Médico Electrónico'),

-- Alergias
(gen_random_uuid(), 'medical:allergies:create', 'MEDICAL_ALLERGIES_CREATE', 'Registrar alergias a medicamentos', 'Expediente Médico Electrónico'),
(gen_random_uuid(), 'medical:allergies:read', 'MEDICAL_ALLERGIES_READ', 'Ver alergias', 'Expediente Médico Electrónico'),
(gen_random_uuid(), 'medical:allergies:update', 'MEDICAL_ALLERGIES_UPDATE', 'Editar alergias', 'Expediente Médico Electrónico'),

-- Órdenes de diagnóstico
(gen_random_uuid(), 'medical:diagnostic_orders:create', 'MEDICAL_DIAGNOSTIC_ORDERS_CREATE', 'Crear órdenes de diagnóstico', 'Expediente Médico Electrónico'),
(gen_random_uuid(), 'medical:diagnostic_orders:read', 'MEDICAL_DIAGNOSTIC_ORDERS_READ', 'Ver órdenes de diagnóstico', 'Expediente Médico Electrónico'),
(gen_random_uuid(), 'medical:diagnostic_orders:update', 'MEDICAL_DIAGNOSTIC_ORDERS_UPDATE', 'Editar órdenes de diagnóstico', 'Expediente Médico Electrónico'),

-- Procedimientos
(gen_random_uuid(), 'medical:procedures:create', 'MEDICAL_PROCEDURES_CREATE', 'Registrar procedimientos médicos', 'Expediente Médico Electrónico'),
(gen_random_uuid(), 'medical:procedures:read', 'MEDICAL_PROCEDURES_READ', 'Ver procedimientos médicos', 'Expediente Médico Electrónico'),

-- Seguimiento
(gen_random_uuid(), 'medical:follow_ups:create', 'MEDICAL_FOLLOW_UPS_CREATE', 'Crear notas de seguimiento', 'Expediente Médico Electrónico'),
(gen_random_uuid(), 'medical:follow_ups:read', 'MEDICAL_FOLLOW_UPS_READ', 'Ver notas de seguimiento', 'Expediente Médico Electrónico'),

-- Historial médico general
(gen_random_uuid(), 'medical:history:read', 'MEDICAL_HISTORY_READ', 'Ver historial médico completo', 'Expediente Médico Electrónico'),

-- EHR nuevo sistema (ehr:*)
(gen_random_uuid(), 'ehr:medical_history:create', 'EHR_MEDICAL_HISTORY_CREATE', 'Crear historial médico', 'Expediente Médico Electrónico'),
(gen_random_uuid(), 'ehr:medical_history:read', 'EHR_MEDICAL_HISTORY_READ', 'Ver historial médico', 'Expediente Médico Electrónico'),
(gen_random_uuid(), 'ehr:medical_history:update', 'EHR_MEDICAL_HISTORY_UPDATE', 'Editar historial médico', 'Expediente Médico Electrónico'),
(gen_random_uuid(), 'ehr:medical_history:delete', 'EHR_MEDICAL_HISTORY_DELETE', 'Eliminar historial médico', 'Expediente Médico Electrónico'),

(gen_random_uuid(), 'ehr:prescriptions:create', 'EHR_PRESCRIPTIONS_CREATE', 'Crear prescripciones', 'Expediente Médico Electrónico'),
(gen_random_uuid(), 'ehr:prescriptions:read', 'EHR_PRESCRIPTIONS_READ', 'Ver prescripciones', 'Expediente Médico Electrónico'),
(gen_random_uuid(), 'ehr:prescriptions:update', 'EHR_PRESCRIPTIONS_UPDATE', 'Editar prescripciones', 'Expediente Médico Electrónico'),
(gen_random_uuid(), 'ehr:prescriptions:delete', 'EHR_PRESCRIPTIONS_DELETE', 'Eliminar prescripciones', 'Expediente Médico Electrónico'),
(gen_random_uuid(), 'ehr:prescriptions:sign', 'EHR_PRESCRIPTIONS_SIGN', 'Firmar prescripciones digitalmente', 'Expediente Médico Electrónico'),

(gen_random_uuid(), 'ehr:vaccinations:create', 'EHR_VACCINATIONS_CREATE', 'Crear registro de vacunas', 'Expediente Médico Electrónico'),
(gen_random_uuid(), 'ehr:vaccinations:read', 'EHR_VACCINATIONS_READ', 'Ver registro de vacunas', 'Expediente Médico Electrónico'),
(gen_random_uuid(), 'ehr:vaccinations:update', 'EHR_VACCINATIONS_UPDATE', 'Editar registro de vacunas', 'Expediente Médico Electrónico'),
(gen_random_uuid(), 'ehr:vaccinations:delete', 'EHR_VACCINATIONS_DELETE', 'Eliminar registro de vacunas', 'Expediente Médico Electrónico'),

(gen_random_uuid(), 'ehr:allergies:create', 'EHR_ALLERGIES_CREATE', 'Crear alergias', 'Expediente Médico Electrónico'),
(gen_random_uuid(), 'ehr:allergies:read', 'EHR_ALLERGIES_READ', 'Ver alergias', 'Expediente Médico Electrónico'),
(gen_random_uuid(), 'ehr:allergies:update', 'EHR_ALLERGIES_UPDATE', 'Editar alergias', 'Expediente Médico Electrónico'),
(gen_random_uuid(), 'ehr:allergies:delete', 'EHR_ALLERGIES_DELETE', 'Eliminar alergias', 'Expediente Médico Electrónico'),

(gen_random_uuid(), 'ehr:diagnostics:create', 'EHR_DIAGNOSTICS_CREATE', 'Crear diagnósticos', 'Expediente Médico Electrónico'),
(gen_random_uuid(), 'ehr:diagnostics:read', 'EHR_DIAGNOSTICS_READ', 'Ver diagnósticos', 'Expediente Médico Electrónico'),
(gen_random_uuid(), 'ehr:diagnostics:update', 'EHR_DIAGNOSTICS_UPDATE', 'Editar diagnósticos', 'Expediente Médico Electrónico'),
(gen_random_uuid(), 'ehr:diagnostics:delete', 'EHR_DIAGNOSTICS_DELETE', 'Eliminar diagnósticos', 'Expediente Médico Electrónico'),

(gen_random_uuid(), 'ehr:attachments:create', 'EHR_ATTACHMENTS_CREATE', 'Subir adjuntos médicos', 'Expediente Médico Electrónico'),
(gen_random_uuid(), 'ehr:attachments:read', 'EHR_ATTACHMENTS_READ', 'Ver adjuntos médicos', 'Expediente Médico Electrónico'),
(gen_random_uuid(), 'ehr:attachments:delete', 'EHR_ATTACHMENTS_DELETE', 'Eliminar adjuntos médicos', 'Expediente Médico Electrónico'),
(gen_random_uuid(), 'ehr:attachments:download', 'EHR_ATTACHMENTS_DOWNLOAD', 'Descargar adjuntos médicos', 'Expediente Médico Electrónico'),

(gen_random_uuid(), 'ehr:signatures:create', 'EHR_SIGNATURES_CREATE', 'Crear firma digital de expediente', 'Expediente Médico Electrónico'),
(gen_random_uuid(), 'ehr:signatures:read', 'EHR_SIGNATURES_READ', 'Ver firmas digitales', 'Expediente Médico Electrónico'),
(gen_random_uuid(), 'ehr:signatures:verify', 'EHR_SIGNATURES_VERIFY', 'Verificar autenticidad de firmas', 'Expediente Médico Electrónico'),
(gen_random_uuid(), 'ehr:signatures:revoke', 'EHR_SIGNATURES_REVOKE', 'Revocar firma digital', 'Expediente Médico Electrónico'),

(gen_random_uuid(), 'ehr:analytics:read', 'EHR_ANALYTICS_READ', 'Ver reportes de EHR', 'Expediente Médico Electrónico'),
(gen_random_uuid(), 'ehr:analytics:export', 'EHR_ANALYTICS_EXPORT', 'Exportar reportes de EHR', 'Expediente Médico Electrónico'),
(gen_random_uuid(), 'ehr:analytics:trends', 'EHR_ANALYTICS_TRENDS', 'Ver tendencias médicas', 'Expediente Médico Electrónico'),

(gen_random_uuid(), 'ehr:read', 'EHR_READ', 'Acceso general a expediente médico', 'Expediente Médico Electrónico'),
(gen_random_uuid(), 'ehr:manage', 'EHR_MANAGE', 'Administrar expediente médico', 'Expediente Médico Electrónico');

-- ============================================================================
-- 8. CUIDADO PREVENTIVO
-- ============================================================================

INSERT INTO permissions (id, code, name, description, category) VALUES
(gen_random_uuid(), 'preventive_care:create', 'PREVENTIVE_CARE_CREATE', 'Crear eventos de cuidado preventivo', 'Cuidado Preventivo'),
(gen_random_uuid(), 'preventive_care:read', 'PREVENTIVE_CARE_READ', 'Ver eventos de cuidado preventivo', 'Cuidado Preventivo'),
(gen_random_uuid(), 'preventive_care:update', 'PREVENTIVE_CARE_UPDATE', 'Editar eventos de cuidado preventivo', 'Cuidado Preventivo'),
(gen_random_uuid(), 'preventive_care:delete', 'PREVENTIVE_CARE_DELETE', 'Eliminar eventos de cuidado preventivo', 'Cuidado Preventivo'),
(gen_random_uuid(), 'preventive_care:complete', 'PREVENTIVE_CARE_COMPLETE', 'Completar evento preventivo', 'Cuidado Preventivo');

-- ============================================================================
-- 9. RECORDATORIOS
-- ============================================================================

INSERT INTO permissions (id, code, name, description, category) VALUES
(gen_random_uuid(), 'reminders:create', 'REMINDERS_CREATE', 'Crear recordatorios', 'Recordatorios'),
(gen_random_uuid(), 'reminders:read', 'REMINDERS_READ', 'Ver recordatorios', 'Recordatorios'),
(gen_random_uuid(), 'reminders:send', 'REMINDERS_SEND', 'Enviar recordatorios', 'Recordatorios'),
(gen_random_uuid(), 'reminders:cancel', 'REMINDERS_CANCEL', 'Cancelar recordatorios', 'Recordatorios'),
(gen_random_uuid(), 'reminders:queue', 'REMINDERS_QUEUE', 'Ver cola de recordatorios', 'Recordatorios');

-- ============================================================================
-- 10. POS - PUNTO DE VENTA
-- ============================================================================

INSERT INTO permissions (id, code, name, description, category) VALUES
(gen_random_uuid(), 'pos:products:create', 'POS_PRODUCTS_CREATE', 'Crear productos POS', 'Punto de Venta'),
(gen_random_uuid(), 'pos:products:read', 'POS_PRODUCTS_READ', 'Ver productos POS', 'Punto de Venta'),
(gen_random_uuid(), 'pos:products:update', 'POS_PRODUCTS_UPDATE', 'Editar productos POS', 'Punto de Venta'),
(gen_random_uuid(), 'pos:products:delete', 'POS_PRODUCTS_DELETE', 'Eliminar productos POS', 'Punto de Venta'),

(gen_random_uuid(), 'pos:sales:create', 'POS_SALES_CREATE', 'Crear ventas POS', 'Punto de Venta'),
(gen_random_uuid(), 'pos:sales:read', 'POS_SALES_READ', 'Ver ventas POS', 'Punto de Venta'),
(gen_random_uuid(), 'pos:sales:update', 'POS_SALES_UPDATE', 'Editar ventas POS', 'Punto de Venta'),
(gen_random_uuid(), 'pos:sales:complete', 'POS_SALES_COMPLETE', 'Completar ventas POS', 'Punto de Venta'),
(gen_random_uuid(), 'pos:sales:cancel', 'POS_SALES_CANCEL', 'Cancelar ventas POS', 'Punto de Venta'),
(gen_random_uuid(), 'pos:sales:refund', 'POS_SALES_REFUND', 'Reembolsar ventas POS', 'Punto de Venta'),

(gen_random_uuid(), 'pos:inventory:read', 'POS_INVENTORY_READ', 'Ver inventario POS', 'Punto de Venta'),
(gen_random_uuid(), 'pos:inventory:adjust', 'POS_INVENTORY_ADJUST', 'Ajustar inventario POS', 'Punto de Venta'),
(gen_random_uuid(), 'pos:inventory:history', 'POS_INVENTORY_HISTORY', 'Ver historial de inventario', 'Punto de Venta'),

(gen_random_uuid(), 'pos:payments:create', 'POS_PAYMENTS_CREATE', 'Registrar pagos POS', 'Punto de Venta'),
(gen_random_uuid(), 'pos:payments:read', 'POS_PAYMENTS_READ', 'Ver pagos POS', 'Punto de Venta'),

(gen_random_uuid(), 'pos:reports', 'POS_REPORTS', 'Ver reportes de POS', 'Punto de Venta');

-- ============================================================================
-- 11. PRECIOS Y FACTURACIÓN
-- ============================================================================

INSERT INTO permissions (id, code, name, description, category) VALUES
(gen_random_uuid(), 'pricing:price_lists:create', 'PRICING_PRICE_LISTS_CREATE', 'Crear listas de precios', 'Precios y Facturación'),
(gen_random_uuid(), 'pricing:price_lists:read', 'PRICING_PRICE_LISTS_READ', 'Ver listas de precios', 'Precios y Facturación'),
(gen_random_uuid(), 'pricing:price_lists:delete', 'PRICING_PRICE_LISTS_DELETE', 'Eliminar listas de precios', 'Precios y Facturación'),

(gen_random_uuid(), 'pricing:service_prices:create', 'PRICING_SERVICE_PRICES_CREATE', 'Establecer precio de servicio', 'Precios y Facturación'),
(gen_random_uuid(), 'pricing:service_prices:update', 'PRICING_SERVICE_PRICES_UPDATE', 'Actualizar precio de servicio', 'Precios y Facturación'),
(gen_random_uuid(), 'pricing:service_prices:delete', 'PRICING_SERVICE_PRICES_DELETE', 'Eliminar precio de servicio', 'Precios y Facturación'),
(gen_random_uuid(), 'pricing:service_prices:read', 'PRICING_SERVICE_PRICES_READ', 'Ver precios de servicios', 'Precios y Facturación'),

(gen_random_uuid(), 'pricing:package_prices:create', 'PRICING_PACKAGE_PRICES_CREATE', 'Establecer precio de paquete', 'Precios y Facturación'),
(gen_random_uuid(), 'pricing:package_prices:update', 'PRICING_PACKAGE_PRICES_UPDATE', 'Actualizar precio de paquete', 'Precios y Facturación'),
(gen_random_uuid(), 'pricing:package_prices:delete', 'PRICING_PACKAGE_PRICES_DELETE', 'Eliminar precio de paquete', 'Precios y Facturación'),
(gen_random_uuid(), 'pricing:package_prices:read', 'PRICING_PACKAGE_PRICES_READ', 'Ver precios de paquetes', 'Precios y Facturación'),

(gen_random_uuid(), 'pricing:calculate', 'PRICING_CALCULATE', 'Calcular precios de cita', 'Precios y Facturación'),
(gen_random_uuid(), 'pricing:history', 'PRICING_HISTORY', 'Ver historial de precios', 'Precios y Facturación');

-- ============================================================================
-- 12. ESTILISTAS Y DISPONIBILIDAD
-- ============================================================================

INSERT INTO permissions (id, code, name, description, category) VALUES
(gen_random_uuid(), 'stylists:read', 'STYLISTS_READ', 'Ver estilistas', 'Estilistas y Disponibilidad'),
(gen_random_uuid(), 'stylists:update', 'STYLISTS_UPDATE', 'Editar estilistas', 'Estilistas y Disponibilidad'),

(gen_random_uuid(), 'stylists:availability:create', 'STYLISTS_AVAILABILITY_CREATE', 'Crear disponibilidad de estilista', 'Estilistas y Disponibilidad'),
(gen_random_uuid(), 'stylists:availability:read', 'STYLISTS_AVAILABILITY_READ', 'Ver disponibilidades', 'Estilistas y Disponibilidad'),
(gen_random_uuid(), 'stylists:availability:update', 'STYLISTS_AVAILABILITY_UPDATE', 'Editar disponibilidades', 'Estilistas y Disponibilidad'),
(gen_random_uuid(), 'stylists:availability:delete', 'STYLISTS_AVAILABILITY_DELETE', 'Eliminar disponibilidades', 'Estilistas y Disponibilidad'),

(gen_random_uuid(), 'stylists:unavailable:create', 'STYLISTS_UNAVAILABLE_CREATE', 'Crear período no disponible', 'Estilistas y Disponibilidad'),
(gen_random_uuid(), 'stylists:unavailable:read', 'STYLISTS_UNAVAILABLE_READ', 'Ver períodos no disponibles', 'Estilistas y Disponibilidad'),
(gen_random_uuid(), 'stylists:unavailable:update', 'STYLISTS_UNAVAILABLE_UPDATE', 'Editar períodos no disponibles', 'Estilistas y Disponibilidad'),
(gen_random_uuid(), 'stylists:unavailable:delete', 'STYLISTS_UNAVAILABLE_DELETE', 'Eliminar períodos no disponibles', 'Estilistas y Disponibilidad'),

(gen_random_uuid(), 'stylists:capacity:create', 'STYLISTS_CAPACITY_CREATE', 'Crear capacidad de estilista', 'Estilistas y Disponibilidad'),
(gen_random_uuid(), 'stylists:capacity:read', 'STYLISTS_CAPACITY_READ', 'Ver capacidades', 'Estilistas y Disponibilidad'),
(gen_random_uuid(), 'stylists:capacity:update', 'STYLISTS_CAPACITY_UPDATE', 'Editar capacidades', 'Estilistas y Disponibilidad'),
(gen_random_uuid(), 'stylists:capacity:delete', 'STYLISTS_CAPACITY_DELETE', 'Eliminar capacidades', 'Estilistas y Disponibilidad'),

(gen_random_uuid(), 'stylists:slots', 'STYLISTS_SLOTS', 'Ver slots disponibles', 'Estilistas y Disponibilidad');

-- ============================================================================
-- 13. VETERINARIOS
-- ============================================================================

INSERT INTO permissions (id, code, name, description, category) VALUES
(gen_random_uuid(), 'veterinarians:create', 'VETERINARIANS_CREATE', 'Crear veterinarios', 'Veterinarios'),
(gen_random_uuid(), 'veterinarians:read', 'VETERINARIANS_READ', 'Ver veterinarios', 'Veterinarios'),
(gen_random_uuid(), 'veterinarians:update', 'VETERINARIANS_UPDATE', 'Editar veterinarios', 'Veterinarios'),
(gen_random_uuid(), 'veterinarians:delete', 'VETERINARIANS_DELETE', 'Eliminar veterinarios', 'Veterinarios');

-- ============================================================================
-- 14. RUTAS Y OPTIMIZACIÓN
-- ============================================================================

INSERT INTO permissions (id, code, name, description, category) VALUES
(gen_random_uuid(), 'routes:optimize', 'ROUTES_OPTIMIZE', 'Optimizar rutas', 'Rutas y Optimización'),
(gen_random_uuid(), 'routes:validate', 'ROUTES_VALIDATE', 'Validar optimización de rutas', 'Rutas y Optimización'),
(gen_random_uuid(), 'routes:config', 'ROUTES_CONFIG', 'Configurar parámetros de rutas', 'Rutas y Optimización'),
(gen_random_uuid(), 'routes:plan_home_grooming', 'ROUTES_PLAN_HOME_GROOMING', 'Planificar grooming a domicilio', 'Rutas y Optimización');

-- ============================================================================
-- 15. CAMPAÑAS Y PLANTILLAS
-- ============================================================================

INSERT INTO permissions (id, code, name, description, category) VALUES
(gen_random_uuid(), 'campaigns:create', 'CAMPAIGNS_CREATE', 'Crear campañas', 'Campañas'),
(gen_random_uuid(), 'campaigns:read', 'CAMPAIGNS_READ', 'Ver campañas', 'Campañas'),
(gen_random_uuid(), 'campaigns:update', 'CAMPAIGNS_UPDATE', 'Editar campañas', 'Campañas'),
(gen_random_uuid(), 'campaigns:delete', 'CAMPAIGNS_DELETE', 'Eliminar campañas', 'Campañas'),
(gen_random_uuid(), 'campaigns:start', 'CAMPAIGNS_START', 'Iniciar campaña', 'Campañas'),
(gen_random_uuid(), 'campaigns:pause', 'CAMPAIGNS_PAUSE', 'Pausar campaña', 'Campañas'),
(gen_random_uuid(), 'campaigns:resume', 'CAMPAIGNS_RESUME', 'Reanudar campaña', 'Campañas'),
(gen_random_uuid(), 'campaigns:metrics', 'CAMPAIGNS_METRICS', 'Ver métricas de campaña', 'Campañas'),
(gen_random_uuid(), 'campaigns:recipients', 'CAMPAIGNS_RECIPIENTS', 'Ver destinatarios de campaña', 'Campañas'),
(gen_random_uuid(), 'campaigns:preview_audience', 'CAMPAIGNS_PREVIEW_AUDIENCE', 'Previsualizar audiencia', 'Campañas'),

(gen_random_uuid(), 'campaign_templates:create', 'CAMPAIGN_TEMPLATES_CREATE', 'Crear plantillas de campaña', 'Campañas'),
(gen_random_uuid(), 'campaign_templates:read', 'CAMPAIGN_TEMPLATES_READ', 'Ver plantillas', 'Campañas'),
(gen_random_uuid(), 'campaign_templates:update', 'CAMPAIGN_TEMPLATES_UPDATE', 'Editar plantillas', 'Campañas'),
(gen_random_uuid(), 'campaign_templates:delete', 'CAMPAIGN_TEMPLATES_DELETE', 'Eliminar plantillas', 'Campañas'),
(gen_random_uuid(), 'campaign_templates:preview', 'CAMPAIGN_TEMPLATES_PREVIEW', 'Previsualizar plantilla', 'Campañas'),
(gen_random_uuid(), 'campaign_templates:render', 'CAMPAIGN_TEMPLATES_RENDER', 'Renderizar plantilla', 'Campañas'),
(gen_random_uuid(), 'campaign_templates:variables', 'CAMPAIGN_TEMPLATES_VARIABLES', 'Ver variables soportadas', 'Campañas');

-- ============================================================================
-- 16. NOTIFICACIONES Y COMUNICACIÓN
-- ============================================================================

INSERT INTO permissions (id, code, name, description, category) VALUES
(gen_random_uuid(), 'notifications:create', 'NOTIFICATIONS_CREATE', 'Crear notificaciones', 'Notificaciones y Comunicación'),
(gen_random_uuid(), 'notifications:read', 'NOTIFICATIONS_READ', 'Ver notificaciones', 'Notificaciones y Comunicación'),
(gen_random_uuid(), 'notifications:details', 'NOTIFICATIONS_DETAILS', 'Ver detalles de notificación', 'Notificaciones y Comunicación'),
(gen_random_uuid(), 'notifications:queue', 'NOTIFICATIONS_QUEUE', 'Ver cola de notificaciones', 'Notificaciones y Comunicación'),
(gen_random_uuid(), 'notifications:errors', 'NOTIFICATIONS_ERRORS', 'Ver errores de notificación', 'Notificaciones y Comunicación'),
(gen_random_uuid(), 'notifications:retry', 'NOTIFICATIONS_RETRY', 'Reintentar notificaciones', 'Notificaciones y Comunicación'),
(gen_random_uuid(), 'notifications:delete', 'NOTIFICATIONS_DELETE', 'Eliminar notificaciones', 'Notificaciones y Comunicación'),

(gen_random_uuid(), 'whatsapp:send', 'WHATSAPP_SEND', 'Enviar mensajes WhatsApp', 'Notificaciones y Comunicación'),
(gen_random_uuid(), 'whatsapp:read_outbox', 'WHATSAPP_READ_OUTBOX', 'Ver bandeja salida WhatsApp', 'Notificaciones y Comunicación'),
(gen_random_uuid(), 'whatsapp:read_message', 'WHATSAPP_READ_MESSAGE', 'Ver mensaje WhatsApp', 'Notificaciones y Comunicación'),
(gen_random_uuid(), 'whatsapp:retry', 'WHATSAPP_RETRY', 'Reintentar envío WhatsApp', 'Notificaciones y Comunicación'),

(gen_random_uuid(), 'email:send', 'EMAIL_SEND', 'Enviar emails', 'Notificaciones y Comunicación'),
(gen_random_uuid(), 'email:read_outbox', 'EMAIL_READ_OUTBOX', 'Ver bandeja salida emails', 'Notificaciones y Comunicación'),
(gen_random_uuid(), 'email:retry', 'EMAIL_RETRY', 'Reintentar envío emails', 'Notificaciones y Comunicación');

-- ============================================================================
-- 17. REPORTES Y ANALYTICS
-- ============================================================================

INSERT INTO permissions (id, code, name, description, category) VALUES
(gen_random_uuid(), 'reports:view', 'REPORTS_VIEW', 'Ver reportes', 'Reportes y Analytics'),
(gen_random_uuid(), 'reports:revenue', 'REPORTS_REVENUE', 'Ver reportes de ingresos', 'Reportes y Analytics'),
(gen_random_uuid(), 'reports:appointments', 'REPORTS_APPOINTMENTS', 'Ver reportes de citas', 'Reportes y Analytics'),
(gen_random_uuid(), 'reports:clients', 'REPORTS_CLIENTS', 'Ver reportes de clientes', 'Reportes y Analytics'),
(gen_random_uuid(), 'reports:services', 'REPORTS_SERVICES', 'Ver reportes de servicios', 'Reportes y Analytics'),
(gen_random_uuid(), 'reports:performance', 'REPORTS_PERFORMANCE', 'Ver reportes de desempeño', 'Reportes y Analytics'),
(gen_random_uuid(), 'reports:geography', 'REPORTS_GEOGRAPHY', 'Ver reportes geográficos', 'Reportes y Analytics'),
(gen_random_uuid(), 'reports:export', 'REPORTS_EXPORT', 'Exportar reportes', 'Reportes y Analytics');

-- ============================================================================
-- 18. DASHBOARD
-- ============================================================================

INSERT INTO permissions (id, code, name, description, category) VALUES
(gen_random_uuid(), 'dashboard:clinic', 'DASHBOARD_CLINIC', 'Acceso a dashboard de clínica', 'Dashboard');

-- ============================================================================
-- VERIFICAR INSERCIÓN
-- ============================================================================

SELECT 
  category as "Categoría",
  COUNT(*) as "Cantidad",
  COUNT(DISTINCT code) as "Códigos Únicos"
FROM permissions
GROUP BY category
ORDER BY COUNT(*) DESC;

-- Total general
SELECT 
  'TOTAL' as tipo,
  COUNT(*) as cantidad,
  COUNT(DISTINCT category) as categorias
FROM permissions;

-- Si el resultado es ~200 permisos en ~18 categorías, la inserción fue exitosa

COMMIT;

-- ============================================================================
-- ROLLBACK EN CASO DE ERROR
-- ============================================================================
-- ROLLBACK;