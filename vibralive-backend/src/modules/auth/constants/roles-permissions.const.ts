/**
 * Definición centralizada de roles y permisos del sistema
 * 
 * Cubre todos los módulos y funcionalidades de VibraLive:
 * - Gestión de clínica (configuración, marcas, comunicación)
 * - Clientes y mascotas (CRUD, dirección, tags)
 * - Citas y servicios (creación, actualización, estado, precios)
 * - Rutas de grooming (optimización, planificación)
 * - Campañas y notificaciones (templates, sendos, monitoreo)
 * - Reportes y analytics (ventas, citas, clientes, servicios, geografía)
 * - Usuarios y roles (gestión, permisos, disponibilidad de estilistas)
 * - Sistema multi-tenant (plataforma para superadmin)
 * - Auditoría (logs de cambios)
 * - Sistema EHR (registro médico electrónico, diagnósticos, prescripciones, vacunas)
 */

export type UserRole = 'SUPER_ADMIN' | 'CLINIC_OWNER' | 'CLINIC_STYLIST' | 'CLINIC_VETERINARIAN' | 'CLINIC_STAFF';

export interface Permission {
  key: string;
  description: string;
}

export interface RoleConfig {
  name: string;
  description: string;
  permissions: Permission[];
}

export const ROLES_PERMISSIONS: Record<UserRole, RoleConfig> = {
  SUPER_ADMIN: {
    name: 'Super Administrador',
    description: 'Gestor de plataforma - Crea y gestiona clínicas y planes',
    permissions: [
      // =========================================================================
      // GESTIÓN DE PLATAFORMA (SUPERADMIN ONLY)
      // =========================================================================
      { key: 'platform:clinics:create', description: 'Crear nuevas clínicas' },
      { key: 'platform:clinics:read', description: 'Ver todas las clínicas' },
      { key: 'platform:clinics:update', description: 'Editar clínicas' },
      { key: 'platform:clinics:delete', description: 'Eliminar clínicas' },
      { key: 'platform:clinics:suspend', description: 'Suspender clínicas' },
      { key: 'platform:clinics:activate', description: 'Activar clínicas' },
      
      { key: 'platform:plans:create', description: 'Crear planes de suscripción' },
      { key: 'platform:plans:read', description: 'Ver planes' },
      { key: 'platform:plans:update', description: 'Editar planes' },
      { key: 'platform:plans:delete', description: 'Eliminar planes' },
      { key: 'platform:plans:toggle', description: 'Activar/desactivar planes' },
      
      { key: 'platform:users:create', description: 'Crear usuarios en plataforma' },
      { key: 'platform:users:read', description: 'Ver usuarios plataforma' },
      { key: 'platform:users:update', description: 'Editar usuarios plataforma' },
      { key: 'platform:users:delete', description: 'Eliminar usuarios plataforma' },
      { key: 'platform:users:impersonate', description: 'Impersonar usuarios' },
      
      { key: 'audit:read', description: 'Ver logs de auditoría' },
      { key: 'platform:dashboard', description: 'Acceso a dashboard de plataforma' },
      { key: 'platform:reports', description: 'Ver reportes de plataforma' },
    ],
  },
  CLINIC_OWNER: {
    name: 'Propietario de Clínica',
    description: 'Administrador con acceso completo a su clínica',
    permissions: [
      // =========================================================================
      // GESTIÓN DE CLÍNICA
      // =========================================================================
      { key: 'clinic:manage', description: 'Administrar clínica' },
      { key: 'clinic:settings', description: 'Configurar clínica' },
      { key: 'clinic:branding', description: 'Configurar marca y branding' },
      { key: 'clinic:communication:config', description: 'Configurar comunicación (Email, WhatsApp)' },
      { key: 'clinic:communication:read', description: 'Ver configuración de comunicación' },
      { key: 'clinic:calendar:manage', description: 'Gestionar excepciones de calendario' },
      
      // =========================================================================
      // USUARIOS Y ROLES (CLINIC-LEVEL)
      // =========================================================================
      { key: 'users:create', description: 'Crear usuarios de clínica' },
      { key: 'users:read', description: 'Ver usuarios' },
      { key: 'users:update', description: 'Editar usuarios' },
      { key: 'users:deactivate', description: 'Desactivar usuarios' },
      { key: 'users:delete', description: 'Eliminar usuarios' },
      
      { key: 'roles:create', description: 'Crear roles personalizados' },
      { key: 'roles:read', description: 'Ver roles' },
      { key: 'roles:update', description: 'Editar roles' },
      { key: 'roles:delete', description: 'Eliminar roles' },
      { key: 'roles:permissions:list', description: 'Listar permisos disponibles' },
      
      // =========================================================================
      // CLIENTES Y MASCOTAS
      // =========================================================================
      { key: 'clients:create', description: 'Crear clientes' },
      { key: 'clients:read', description: 'Ver clientes' },
      { key: 'clients:update', description: 'Editar clientes' },
      { key: 'clients:deactivate', description: 'Desactivar clientes' },
      { key: 'clients:delete', description: 'Eliminar clientes' },
      
      { key: 'clients:addresses:create', description: 'Crear direcciones de cliente' },
      { key: 'clients:addresses:read', description: 'Ver direcciones' },
      { key: 'clients:addresses:update', description: 'Editar direcciones' },
      { key: 'clients:addresses:delete', description: 'Eliminar direcciones' },
      { key: 'clients:addresses:set_default', description: 'Establecer dirección por defecto' },
      
      { key: 'clients:tags:create', description: 'Crear tags de cliente' },
      { key: 'clients:tags:read', description: 'Ver tags' },
      { key: 'clients:tags:delete', description: 'Eliminar tags' },
      
      { key: 'pets:create', description: 'Crear mascotas' },
      { key: 'pets:read', description: 'Ver mascotas' },
      { key: 'pets:update', description: 'Editar mascotas' },
      { key: 'pets:delete', description: 'Eliminar mascotas' },
      
      // =========================================================================
      // CITAS Y SERVICIOS
      // =========================================================================
      { key: 'appointments:create', description: 'Crear citas' },
      { key: 'appointments:read', description: 'Ver citas' },
      { key: 'appointments:update', description: 'Editar citas' },
      { key: 'appointments:update_status', description: 'Cambiar estado de cita' },
      { key: 'appointments:update_services', description: 'Actualizar servicios de cita' },
      { key: 'appointments:complete', description: 'Completar cita' },
      { key: 'appointments:check_availability', description: 'Verificar disponibilidad de estilista' },
      
      // =========================================================================
      // VISITAS CLÍNICAS Y MÓDULO EHR
      // =========================================================================
      { key: 'visits:create', description: 'Crear visitas clínicas' },
      { key: 'visits:read', description: 'Ver visitas clínicas' },
      { key: 'visits:update', description: 'Editar visitas clínicas' },
      { key: 'visits:update_status', description: 'Cambiar estado de visita' },
      { key: 'visits:complete', description: 'Completar visita' },
      { key: 'visits:cancel', description: 'Cancelar visita' },
      
      { key: 'ehr:medical_history:create', description: 'Crear historial médico' },
      { key: 'ehr:medical_history:read', description: 'Ver historial médico' },
      { key: 'ehr:medical_history:update', description: 'Editar historial médico' },
      { key: 'ehr:medical_history:sign', description: 'Firmar registros médicos' },
      
      { key: 'ehr:diagnostics:create', description: 'Agregar diagnósticos' },
      { key: 'ehr:diagnostics:read', description: 'Ver diagnósticos' },
      { key: 'ehr:diagnostics:update', description: 'Editar diagnósticos' },
      
      { key: 'ehr:prescriptions:create', description: 'Crear prescripciones' },
      { key: 'ehr:prescriptions:read', description: 'Ver prescripciones' },
      { key: 'ehr:prescriptions:update', description: 'Editar prescripciones' },
      { key: 'ehr:prescriptions:cancel', description: 'Cancelar prescripciones' },
      
      { key: 'ehr:vaccinations:create', description: 'Crear registro de vacunas' },
      { key: 'ehr:vaccinations:read', description: 'Ver registro de vacunas' },
      { key: 'ehr:vaccinations:update', description: 'Editar registro de vacunas' },
      
      { key: 'ehr:allergies:create', description: 'Crear alergias' },
      { key: 'ehr:allergies:read', description: 'Ver alergias' },
      { key: 'ehr:allergies:update', description: 'Editar alergias' },
      
      { key: 'ehr:diagnostic_orders:create', description: 'Crear órdenes de diagnóstico' },
      { key: 'ehr:diagnostic_orders:read', description: 'Ver órdenes de diagnóstico' },
      { key: 'ehr:diagnostic_orders:update', description: 'Editar órdenes de diagnóstico' },
      
      { key: 'ehr:procedures:create', description: 'Registrar procedimientos médicos' },
      { key: 'ehr:procedures:read', description: 'Ver procedimientos médicos' },
      { key: 'ehr:procedures:update', description: 'Editar procedimientos médicos' },
      
      { key: 'ehr:follow_ups:create', description: 'Crear notas de seguimiento' },
      { key: 'ehr:follow_ups:read', description: 'Ver notas de seguimiento' },
      { key: 'ehr:follow_ups:update', description: 'Editar notas de seguimiento' },
      
      { key: 'ehr:history:read', description: 'Ver historial médico completo' },
      { key: 'ehr:attachments:create', description: 'Subir adjuntos médicos' },
      { key: 'ehr:attachments:read', description: 'Ver adjuntos médicos' },
      { key: 'ehr:attachments:delete', description: 'Eliminar adjuntos médicos' },
      { key: 'ehr:attachments:download', description: 'Descargar adjuntos médicos' },
      { key: 'ehr:signatures:create', description: 'Crear firma digital de expediente' },
      { key: 'ehr:signatures:read', description: 'Ver firmas digitales' },
      { key: 'ehr:signatures:verify', description: 'Verificar autenticidad de firmas' },
      { key: 'ehr:signatures:revoke', description: 'Revocar firma digital' },
      { key: 'ehr:analytics:read', description: 'Ver reportes de EHR' },
      { key: 'ehr:analytics:export', description: 'Exportar reportes de EHR' },
      { key: 'ehr:analytics:trends', description: 'Ver tendencias médicas' },
      { key: 'ehr:read', description: 'Acceso general a expediente médico' },
      { key: 'ehr:manage', description: 'Administrar expediente médico' },
      
      // =========================================================================
      // CATÁLOGO DE VACUNAS
      // =========================================================================
      { key: 'vaccines:create', description: 'Crear vacunas en catálogo' },
      { key: 'vaccines:read', description: 'Ver catálogo de vacunas' },
      { key: 'vaccines:update', description: 'Editar vacunas en catálogo' },
      { key: 'vaccines:delete', description: 'Eliminar vacunas en catálogo' },
      
      // =========================================================================
      // CUIDADO PREVENTIVO
      // =========================================================================
      { key: 'preventive_care:create', description: 'Crear eventos de cuidado preventivo' },
      { key: 'preventive_care:read', description: 'Ver eventos de cuidado preventivo' },
      { key: 'preventive_care:update', description: 'Editar eventos de cuidado preventivo' },
      { key: 'preventive_care:delete', description: 'Eliminar eventos de cuidado preventivo' },
      { key: 'preventive_care:complete', description: 'Completar evento preventivo' },
      
      // =========================================================================
      // RECORDATORIOS
      // =========================================================================
      { key: 'reminders:create', description: 'Crear recordatorios' },
      { key: 'reminders:read', description: 'Ver recordatorios' },
      { key: 'reminders:send', description: 'Enviar recordatorios' },
      { key: 'reminders:cancel', description: 'Cancelar recordatorios' },
      { key: 'reminders:queue', description: 'Ver cola de recordatorios' },
      
      // =========================================================================
      // POS (PUNTO DE VENTA)
      // =========================================================================
      { key: 'pos:products:create', description: 'Crear productos POS' },
      { key: 'pos:products:read', description: 'Ver productos POS' },
      { key: 'pos:products:update', description: 'Editar productos POS' },
      { key: 'pos:products:delete', description: 'Eliminar productos POS' },
      
      { key: 'pos:sales:create', description: 'Crear ventas POS' },
      { key: 'pos:sales:read', description: 'Ver ventas POS' },
      { key: 'pos:sales:update', description: 'Editar ventas POS' },
      { key: 'pos:sales:complete', description: 'Completar ventas POS' },
      { key: 'pos:sales:cancel', description: 'Cancelar ventas POS' },
      { key: 'pos:sales:refund', description: 'Reembolsar ventas POS' },
      
      { key: 'pos:inventory:read', description: 'Ver inventario POS' },
      { key: 'pos:inventory:adjust', description: 'Ajustar inventario POS' },
      { key: 'pos:inventory:history', description: 'Ver historial de inventario' },
      
      { key: 'pos:payments:create', description: 'Registrar pagos POS' },
      { key: 'pos:payments:read', description: 'Ver pagos POS' },
      
      { key: 'pos:reports', description: 'Ver reportes de POS' },
      
      { key: 'services:create', description: 'Crear servicios' },
      { key: 'services:read', description: 'Ver servicios' },
      { key: 'services:update', description: 'Editar servicios' },
      { key: 'services:deactivate', description: 'Desactivar servicios' },
      { key: 'services:delete', description: 'Eliminar servicios' },
      
      { key: 'packages:create', description: 'Crear paquetes' },
      { key: 'packages:read', description: 'Ver paquetes' },
      { key: 'packages:update', description: 'Editar paquetes' },
      { key: 'packages:deactivate', description: 'Desactivar paquetes' },
      { key: 'packages:delete', description: 'Eliminar paquetes' },
      
      // =========================================================================
      // PRECIOS Y FACTURACIÓN
      // =========================================================================
      { key: 'pricing:price_lists:create', description: 'Crear listas de precios' },
      { key: 'pricing:price_lists:read', description: 'Ver listas de precios' },
      { key: 'pricing:price_lists:delete', description: 'Eliminar listas de precios' },
      
      { key: 'pricing:service_prices:create', description: 'Establecer precio de servicio' },
      { key: 'pricing:service_prices:update', description: 'Actualizar precio de servicio' },
      { key: 'pricing:service_prices:delete', description: 'Eliminar precio de servicio' },
      { key: 'pricing:service_prices:read', description: 'Ver precios de servicios' },
      
      { key: 'pricing:package_prices:create', description: 'Establecer precio de paquete' },
      { key: 'pricing:package_prices:update', description: 'Actualizar precio de paquete' },
      { key: 'pricing:package_prices:delete', description: 'Eliminar precio de paquete' },
      { key: 'pricing:package_prices:read', description: 'Ver precios de paquetes' },
      
      { key: 'pricing:calculate', description: 'Calcular precios de cita' },
      { key: 'pricing:history', description: 'Ver historial de precios' },
      
      // =========================================================================
      // ESTILISTAS Y DISPONIBILIDAD
      // =========================================================================
      { key: 'stylists:read', description: 'Ver estilistas' },
      { key: 'stylists:update', description: 'Editar estilistas' },
      
      { key: 'stylists:availability:create', description: 'Crear disponibilidad de estilista' },
      { key: 'stylists:availability:read', description: 'Ver disponibilidades' },
      { key: 'stylists:availability:update', description: 'Editar disponibilidades' },
      { key: 'stylists:availability:delete', description: 'Eliminar disponibilidades' },
      
      { key: 'stylists:unavailable:create', description: 'Crear período no disponible' },
      { key: 'stylists:unavailable:read', description: 'Ver períodos no disponibles' },
      { key: 'stylists:unavailable:update', description: 'Editar períodos no disponibles' },
      { key: 'stylists:unavailable:delete', description: 'Eliminar períodos no disponibles' },
      
      { key: 'stylists:capacity:create', description: 'Crear capacidad de estilista' },
      { key: 'stylists:capacity:read', description: 'Ver capacidades' },
      { key: 'stylists:capacity:update', description: 'Editar capacidades' },
      { key: 'stylists:capacity:delete', description: 'Eliminar capacidades' },
      
      { key: 'stylists:slots', description: 'Ver slots disponibles' },
      
      // =========================================================================
      // VETERINARIOS Y DISPONIBILIDAD
      // =========================================================================
      { key: 'veterinarians:create', description: 'Crear veterinarios' },
      { key: 'veterinarians:read', description: 'Ver veterinarios' },
      { key: 'veterinarians:update', description: 'Editar veterinarios' },
      { key: 'veterinarians:delete', description: 'Eliminar veterinarios' },
      
      // =========================================================================
      // RUTAS Y OPTIMIZACIÓN (GROOMING)
      // =========================================================================
      { key: 'routes:optimize', description: 'Optimizar rutas' },
      { key: 'routes:validate', description: 'Validar optimización de rutas' },
      { key: 'routes:config', description: 'Configurar parámetros de rutas' },
      { key: 'routes:plan_home_grooming', description: 'Planificar grooming a domicilio' },
      
      // =========================================================================
      // CAMPAÑAS Y PLANTILLAS
      // =========================================================================
      { key: 'campaigns:create', description: 'Crear campañas' },
      { key: 'campaigns:read', description: 'Ver campañas' },
      { key: 'campaigns:update', description: 'Editar campañas' },
      { key: 'campaigns:delete', description: 'Eliminar campañas' },
      { key: 'campaigns:start', description: 'Iniciar campaña' },
      { key: 'campaigns:pause', description: 'Pausar campaña' },
      { key: 'campaigns:resume', description: 'Reanudar campaña' },
      { key: 'campaigns:metrics', description: 'Ver métricas de campaña' },
      { key: 'campaigns:recipients', description: 'Ver destinatarios de campaña' },
      { key: 'campaigns:preview_audience', description: 'Previsualizar audiencia' },
      
      { key: 'campaign_templates:create', description: 'Crear plantillas de campaña' },
      { key: 'campaign_templates:read', description: 'Ver plantillas' },
      { key: 'campaign_templates:update', description: 'Editar plantillas' },
      { key: 'campaign_templates:delete', description: 'Eliminar plantillas' },
      { key: 'campaign_templates:preview', description: 'Previsualizar plantilla' },
      { key: 'campaign_templates:render', description: 'Renderizar plantilla' },
      { key: 'campaign_templates:variables', description: 'Ver variables soportadas' },
      
      // =========================================================================
      // NOTIFICACIONES Y COMUNICACIÓN
      // =========================================================================
      { key: 'notifications:create', description: 'Crear notificaciones' },
      { key: 'notifications:read', description: 'Ver notificaciones' },
      { key: 'notifications:details', description: 'Ver detalles de notificación' },
      { key: 'notifications:queue', description: 'Ver cola de notificaciones' },
      { key: 'notifications:errors', description: 'Ver errores de notificación' },
      { key: 'notifications:retry', description: 'Reintentar notificaciones' },
      { key: 'notifications:delete', description: 'Eliminar notificaciones' },
      
      { key: 'whatsapp:send', description: 'Enviar mensajes WhatsApp' },
      { key: 'whatsapp:read_outbox', description: 'Ver bandeja salida WhatsApp' },
      { key: 'whatsapp:read_message', description: 'Ver mensaje WhatsApp' },
      { key: 'whatsapp:retry', description: 'Reintentar envío WhatsApp' },
      
      { key: 'email:send', description: 'Enviar emails' },
      { key: 'email:read_outbox', description: 'Ver bandeja salida emails' },
      { key: 'email:retry', description: 'Reintentar envío emails' },
      
      // =========================================================================
      // REPORTES Y ANALYTICS
      // =========================================================================
      { key: 'reports:view', description: 'Ver reportes' },
      { key: 'reports:revenue', description: 'Ver reportes de ingresos' },
      { key: 'reports:appointments', description: 'Ver reportes de citas' },
      { key: 'reports:clients', description: 'Ver reportes de clientes' },
      { key: 'reports:services', description: 'Ver reportes de servicios' },
      { key: 'reports:performance', description: 'Ver reportes de desempeño' },
      { key: 'reports:geography', description: 'Ver reportes geográficos' },
      { key: 'reports:export', description: 'Exportar reportes' },
      
      // =========================================================================
      // DASHBOARD
      // =========================================================================
      { key: 'dashboard:clinic', description: 'Acceso a dashboard de clínica' },
    ],
  },
  CLINIC_STAFF: {
    name: 'Personal de Clínica',
    description: 'Personal operativo con acceso limitado a funciones diarias',
    permissions: [
      // =========================================================================
      // CLIENTES Y MASCOTAS (LECTURA Y CREACIÓN)
      // =========================================================================
      { key: 'clients:read', description: 'Ver clientes' },
      { key: 'clients:create', description: 'Crear clientes' },
      { key: 'clients:update', description: 'Editar clientes' },
      
      { key: 'clients:addresses:read', description: 'Ver direcciones' },
      { key: 'clients:addresses:create', description: 'Crear direcciones de cliente' },
      { key: 'clients:addresses:update', description: 'Editar direcciones' },
      
      { key: 'clients:tags:read', description: 'Ver tags' },
      
      { key: 'pets:read', description: 'Ver mascotas' },
      { key: 'pets:create', description: 'Crear mascotas' },
      { key: 'pets:update', description: 'Editar mascotas' },
      
      // =========================================================================
      // CITAS Y SERVICIOS
      // =========================================================================
      { key: 'appointments:create', description: 'Crear citas' },
      { key: 'appointments:read', description: 'Ver citas' },
      { key: 'appointments:update', description: 'Editar citas' },
      { key: 'appointments:update_status', description: 'Cambiar estado de cita' },
      { key: 'appointments:update_services', description: 'Actualizar servicios de cita' },
      { key: 'appointments:complete', description: 'Completar cita' },
      { key: 'appointments:check_availability', description: 'Verificar disponibilidad de estilista' },
      
      // =========================================================================
      // VISITAS CLÍNICAS
      // =========================================================================
      { key: 'visits:create', description: 'Crear visitas clínicas' },
      { key: 'visits:read', description: 'Ver visitas clínicas' },
      { key: 'visits:update', description: 'Editar visitas clínicas' },
      { key: 'visits:update_status', description: 'Cambiar estado de visita' },
      { key: 'visits:complete', description: 'Completar visita' },
      
      // =========================================================================
      // CUIDADO PREVENTIVO
      // =========================================================================
      { key: 'preventive_care:read', description: 'Ver eventos de cuidado preventivo' },
      { key: 'preventive_care:update', description: 'Editar eventos de cuidado preventivo' },
      
      // =========================================================================
      // RECORDATORIOS
      // =========================================================================
      { key: 'reminders:read', description: 'Ver recordatorios' },
      
      // =========================================================================
      // POS (PUNTO DE VENTA)
      // =========================================================================
      { key: 'pos:products:read', description: 'Ver productos POS' },
      
      { key: 'pos:sales:create', description: 'Crear ventas POS' },
      { key: 'pos:sales:read', description: 'Ver ventas POS' },
      { key: 'pos:sales:update', description: 'Editar ventas POS' },
      { key: 'pos:sales:refund', description: 'Reembolsar ventas POS' },
      
      { key: 'pos:inventory:read', description: 'Ver inventario POS' },
      { key: 'pos:inventory:adjust', description: 'Ajustar inventario POS' },
      
      { key: 'pos:payments:create', description: 'Registrar pagos POS' },
      { key: 'pos:payments:read', description: 'Ver pagos POS' },
      
      // =========================================================================
      // VISITAS CLÍNICAS Y MÓDULO EHR (LECTURA Y ASISTENCIA)
      // =========================================================================
      { key: 'visits:read', description: 'Ver visitas clínicas' },
      { key: 'visits:create', description: 'Crear visitas clínicas' },
      { key: 'visits:update', description: 'Editar visitas clínicas' },
      { key: 'visits:update_status', description: 'Cambiar estado de visita' },
      { key: 'visits:complete', description: 'Completar visita' },
      
      { key: 'ehr:medical_history:read', description: 'Ver historial médico' },
      { key: 'ehr:diagnostics:read', description: 'Ver diagnósticos' },
      { key: 'ehr:prescriptions:read', description: 'Ver prescripciones' },
      { key: 'ehr:vaccinations:read', description: 'Ver registro de vacunas' },
      { key: 'ehr:allergies:read', description: 'Ver alergias' },
      { key: 'ehr:diagnostic_orders:read', description: 'Ver órdenes de diagnóstico' },
      { key: 'ehr:procedures:read', description: 'Ver procedimientos médicos' },
      { key: 'ehr:follow_ups:read', description: 'Ver notas de seguimiento' },
      { key: 'ehr:history:read', description: 'Ver historial médico completo' },
      
      // =========================================================================
      // CUIDADO PREVENTIVO
      // =========================================================================
      { key: 'preventive_care:read', description: 'Ver eventos de cuidado preventivo' },
      { key: 'preventive_care:update', description: 'Editar eventos de cuidado preventivo' },
      
      // =========================================================================
      // RECORDATORIOS
      // =========================================================================
      { key: 'reminders:read', description: 'Ver recordatorios' },
      
      // =========================================================================
      // POS (PUNTO DE VENTA)
      // =========================================================================
      { key: 'pos:products:read', description: 'Ver productos POS' },
      
      { key: 'pos:sales:create', description: 'Crear ventas POS' },
      { key: 'pos:sales:read', description: 'Ver ventas POS' },
      { key: 'pos:sales:update', description: 'Editar ventas POS' },
      { key: 'pos:sales:refund', description: 'Reembolsar ventas POS' },
      
      { key: 'pos:inventory:read', description: 'Ver inventario POS' },
      { key: 'pos:inventory:adjust', description: 'Ajustar inventario POS' },
      
      { key: 'pos:payments:create', description: 'Registrar pagos POS' },
      { key: 'pos:payments:read', description: 'Ver pagos POS' },
      
      { key: 'services:read', description: 'Ver servicios' },
      { key: 'packages:read', description: 'Ver paquetes' },
      
      // =========================================================================
      // ESTILISTAS (LECTURA Y DISPONIBILIDAD)
      // =========================================================================
      { key: 'stylists:read', description: 'Ver estilistas' },
      { key: 'stylists:slots', description: 'Ver slots disponibles' },
      
      { key: 'stylists:availability:read', description: 'Ver disponibilidades' },
      { key: 'stylists:capacity:read', description: 'Ver capacidades' },
      
      // =========================================================================
      // PRECIOS (LECTURA SOLAMENTE)
      // =========================================================================
      { key: 'pricing:service_prices:read', description: 'Ver precios de servicios' },
      { key: 'pricing:package_prices:read', description: 'Ver precios de paquetes' },
      { key: 'pricing:calculate', description: 'Calcular precios de cita' },
      
      // =========================================================================
      // NOTIFICACIONES (LECTURA Y ENVÍO BÁSICO)
      // =========================================================================
      { key: 'notifications:read', description: 'Ver notificaciones' },
      { key: 'notifications:details', description: 'Ver detalles de notificación' },
      
      { key: 'whatsapp:send', description: 'Enviar mensajes WhatsApp' },
      { key: 'whatsapp:read_message', description: 'Ver mensaje WhatsApp' },
      
      { key: 'email:send', description: 'Enviar emails' },
      
      // =========================================================================
      // REPORTES (LECTURA BÁSICA)
      // =========================================================================
      { key: 'reports:view', description: 'Ver reportes' },
      { key: 'reports:appointments', description: 'Ver reportes de citas' },
      { key: 'reports:clients', description: 'Ver reportes de clientes' },
      { key: 'reports:services', description: 'Ver reportes de servicios' },
      
      // =========================================================================
      // DASHBOARD
      // =========================================================================
      { key: 'dashboard:clinic', description: 'Acceso a dashboard básico de clínica' },
    ],
  },
  CLINIC_STYLIST: {
    name: 'Estilista',
    description: 'Profesional de grooming con acceso a citas y prevención',
    permissions: [
      // =========================================================================
      // CITAS Y GROOMING
      // =========================================================================
      { key: 'appointments:read', description: 'Ver citas' },
      { key: 'appointments:update_status', description: 'Cambiar estado de cita' },
      
      { key: 'visits:read', description: 'Ver visitas' },
      { key: 'visits:update_status', description: 'Cambiar estado de visita' },
      
      // =========================================================================
      // CUIDADO PREVENTIVO
      // =========================================================================
      { key: 'preventive_care:read', description: 'Ver eventos de cuidado preventivo' },
      { key: 'preventive_care:update', description: 'Editar eventos de cuidado preventivo' },
      
      // =========================================================================
      // NOTIFICACIONES (LECTURA)
      // =========================================================================
      { key: 'notifications:read', description: 'Ver notificaciones' },
      
      // =========================================================================
      // DASHBOARD
      // =========================================================================
      { key: 'dashboard:clinic', description: 'Acceso a dashboard de estilista' },
    ],
  },
  CLINIC_VETERINARIAN: {
    name: 'Veterinario',
    description: 'Profesional veterinario con acceso a registro médico electrónico',
    permissions: [
      // =========================================================================
      // CLIENTES Y MASCOTAS (LECTURA)
      // =========================================================================
      { key: 'clients:read', description: 'Ver clientes' },
      { key: 'pets:read', description: 'Ver mascotas' },
      
      // =========================================================================
      // CITAS
      // =========================================================================
      { key: 'appointments:read', description: 'Ver citas' },
      
      // =========================================================================
      // VISITAS CLÍNICAS Y MÓDULO EHR (ACCESO COMPLETO)
      // =========================================================================
      { key: 'visits:read', description: 'Ver visitas clínicas' },
      
      { key: 'ehr:medical_history:read', description: 'Ver historial médico' },
      { key: 'ehr:diagnostics:read', description: 'Ver diagnósticos' },
      { key: 'ehr:prescriptions:read', description: 'Ver prescripciones' },
      { key: 'ehr:vaccinations:read', description: 'Ver registro de vacunas' },
      { key: 'ehr:allergies:read', description: 'Ver alergias' },
      { key: 'ehr:diagnostic_orders:read', description: 'Ver órdenes de diagnóstico' },
      { key: 'ehr:procedures:read', description: 'Ver procedimientos médicos' },
      { key: 'ehr:follow_ups:read', description: 'Ver notas de seguimiento' },
      { key: 'ehr:history:read', description: 'Ver historial médico completo' },
      
      // =========================================================================
      // EHR - RESPALDO EXPLÍCITO (EXPEDIENTE MÉDICO ELECTRÓNICO)
      // =========================================================================
      { key: 'ehr:medical_history:create', description: 'Crear historial médico' },
      { key: 'ehr:medical_history:read', description: 'Ver historial médico' },
      { key: 'ehr:medical_history:update', description: 'Editar historial médico' },
      
      { key: 'ehr:prescriptions:create', description: 'Crear prescripciones' },
      { key: 'ehr:prescriptions:read', description: 'Ver prescripciones' },
      { key: 'ehr:prescriptions:update', description: 'Editar prescripciones' },
      
      { key: 'ehr:vaccinations:create', description: 'Crear registro de vacunas' },
      { key: 'ehr:vaccinations:read', description: 'Ver registro de vacunas' },
      { key: 'ehr:vaccinations:update', description: 'Editar registro de vacunas' },
      
      { key: 'ehr:allergies:create', description: 'Crear alergias' },
      { key: 'ehr:allergies:read', description: 'Ver alergias' },
      { key: 'ehr:allergies:update', description: 'Editar alergias' },
      
      { key: 'ehr:diagnostics:create', description: 'Crear diagnósticos' },
      { key: 'ehr:diagnostics:read', description: 'Ver diagnósticos' },
      { key: 'ehr:diagnostics:update', description: 'Editar diagnósticos' },
      
      { key: 'ehr:diagnostic_orders:create', description: 'Crear órdenes de diagnóstico' },
      { key: 'ehr:diagnostic_orders:read', description: 'Ver órdenes de diagnóstico' },
      { key: 'ehr:diagnostic_orders:update', description: 'Editar órdenes de diagnóstico' },
      
      { key: 'ehr:procedures:create', description: 'Registrar procedimientos médicos' },
      { key: 'ehr:procedures:read', description: 'Ver procedimientos médicos' },
      { key: 'ehr:procedures:update', description: 'Editar procedimientos médicos' },
      
      { key: 'ehr:follow_ups:create', description: 'Crear notas de seguimiento' },
      { key: 'ehr:follow_ups:read', description: 'Ver notas de seguimiento' },
      { key: 'ehr:follow_ups:update', description: 'Editar notas de seguimiento' },
      
      { key: 'ehr:attachments:create', description: 'Subir adjuntos médicos' },
      { key: 'ehr:attachments:read', description: 'Ver adjuntos médicos' },
      { key: 'ehr:attachments:delete', description: 'Eliminar adjuntos médicos' },
      { key: 'ehr:attachments:download', description: 'Descargar adjuntos médicos' },
      
      { key: 'ehr:signatures:create', description: 'Crear firma digital de expediente' },
      { key: 'ehr:signatures:read', description: 'Ver firmas digitales' },
      { key: 'ehr:signatures:verify', description: 'Verificar autenticidad de firmas' },
      { key: 'ehr:signatures:revoke', description: 'Revocar firma digital' },
      
      { key: 'ehr:analytics:read', description: 'Ver reportes de EHR' },
      { key: 'ehr:analytics:export', description: 'Exportar reportes de EHR' },
      { key: 'ehr:analytics:trends', description: 'Ver tendencias médicas' },
      
      { key: 'ehr:read', description: 'Acceso general a expediente médico' },
      { key: 'ehr:manage', description: 'Administrar expediente médico' },
      
      // =========================================================================
      // CATÁLOGO DE VACUNAS
      // =========================================================================
      { key: 'vaccines:create', description: 'Crear vacunas en catálogo' },
      { key: 'vaccines:read', description: 'Ver catálogo de vacunas' },
      { key: 'vaccines:update', description: 'Editar vacunas en catálogo' },
      { key: 'vaccines:delete', description: 'Eliminar vacunas en catálogo' },
      
      // =========================================================================
      // DASHBOARD
      // =========================================================================
      { key: 'dashboard:clinic', description: 'Acceso a dashboard de veterinario' },
    ],
  },
};

/**
 * Obtiene los permisos de un rol específico
 */
export function getPermissionsByRole(role: UserRole): string[] {
  return ROLES_PERMISSIONS[role]?.permissions.map((p) => p.key) || [];
}

/**
 * Verifica si un rol tiene un permiso específico
 */
export function hasPermission(role: UserRole, permission: string): boolean {
  return getPermissionsByRole(role).includes(permission);
}

export const FEATURES_BY_ROLE: Record<
  UserRole,
  {
    menu: string[];
    modules: string[];
  }
> = {
  SUPER_ADMIN: {
    menu: [
      'dashboard',
      'clinics',
      'subscription-plans',
      'users',
      'audit',
      'platform-settings',
    ],
    modules: [
      'clinics-management',
      'subscription-plans',
      'users-management',
      'audit-logs',
      'platform-settings',
      'dashboard-admin',
    ],
  },
  CLINIC_OWNER: {
    menu: [
      'dashboard',
      'clients',
      'pets',
      'appointments',
      'visits',
      'services',
      'pricing',
      'stylists',
      'routes',
      'campaigns',
      'notifications',
      'preventive-care',
      'pos',
      'reports',
      'users',
      'clinic-settings',
    ],
    modules: [
      'clients-management',
      'pets-management',
      'appointments-management',
      'visits-management',
      'preventive-care-management',
      'services-management',
      'pricing-management',
      'stylists-management',
      'routes-optimization',
      'campaigns-management',
      'notifications-management',
      'pos-management',
      'reminders-management',
      'whatsapp-management',
      'email-management',
      'reports-analytics',
      'users-management',
      'clinic-settings',
      'dashboard-clinic',
    ],
  },
  CLINIC_STYLIST: {
    menu: [
      'dashboard',
      'appointments',
      'preventive-care',
      'notifications',
    ],
    modules: [
      'appointments-management',
      'preventive-care-view',
      'notifications-view',
      'dashboard-stylist',
    ],
  },
  CLINIC_STAFF: {
    menu: [
      'dashboard',
      'clients',
      'pets',
      'appointments',
      'visits',
      'stylists',
      'pos',
      'notifications',
      'reports',
    ],
    modules: [
      'clients-view',
      'pets-management',
      'appointments-management',
      'visits-management',
      'preventive-care-view',
      'stylists-view',
      'pos-sales',
      'notifications-view',
      'reminders-view',
      'whatsapp-basic',
      'email-basic',
      'reports-basic',
      'dashboard-staff',
    ],
  },
  CLINIC_VETERINARIAN: {
    menu: [
      'dashboard',
      'clients',
      'pets',
      'appointments',
      'visits',
      'medical-records',
    ],
    modules: [
      'clients-view',
      'pets-management',
      'appointments-management',
      'visits-management',
      'medical-records-view',
      'ehr-management',
      'dashboard-veterinarian',
    ],
  },
};
