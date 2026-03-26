-- ============================================================================
-- SCRIPT 2: COMPLETAR PERMISOS EHR CON DESCRIPCIONES AMIGABLES
-- ============================================================================
-- Descripción: Asegura que todos los permisos EHR existan con descripciones
-- amigables para el usuario final y categorías bien organizadas
-- 
-- Fecha: 2026-03-24
-- ============================================================================

-- ============================================================================
-- 1. ACTUALIZAR DESCRIPCIONES Y CATEGORÍAS AMIGABLES
-- ============================================================================

-- Actualizar categoría EHR a "Expediente Médico Electrónico"
UPDATE permissions 
SET category = 'Expediente Médico Electrónico'
WHERE code LIKE 'ehr:%'
  AND category IS NOT NULL;

-- Actualizar descripciones a versiones amigables para usuario final

-- HISTORIAL MÉDICO
UPDATE permissions SET description = 'Crear registros en el historial médico del paciente'
WHERE code = 'ehr:medical_history:create';

UPDATE permissions SET description = 'Ver historial médico completo del paciente'
WHERE code = 'ehr:medical_history:read';

UPDATE permissions SET description = 'Editar registros médicos existentes'
WHERE code = 'ehr:medical_history:update';

UPDATE permissions SET description = 'Eliminar registros del historial médico'
WHERE code = 'ehr:medical_history:delete';

-- PRESCRIPCIONES
UPDATE permissions SET description = 'Crear nuevas prescripciones y recetas médicas'
WHERE code = 'ehr:prescriptions:create';

UPDATE permissions SET description = 'Ver prescripciones activas e históricas'
WHERE code = 'ehr:prescriptions:read';

UPDATE permissions SET description = 'Editar prescripciones en estado borrador'
WHERE code = 'ehr:prescriptions:update';

UPDATE permissions SET description = 'Eliminar prescripciones no dispensadas'
WHERE code = 'ehr:prescriptions:delete';

UPDATE permissions SET description = 'Firmar digitalmente prescripciones (solo veterinarios)'
WHERE code = 'ehr:prescriptions:sign';

-- VACUNACIONES
UPDATE permissions SET description = 'Registrar nuevas vacunaciones administradas'
WHERE code = 'ehr:vaccinations:create';

UPDATE permissions SET description = 'Consultar histórico de vacunaciones y próximas dosis'
WHERE code = 'ehr:vaccinations:read';

UPDATE permissions SET description = 'Actualizar información de vacunaciones registradas'
WHERE code = 'ehr:vaccinations:update';

UPDATE permissions SET description = 'Eliminar registros de vacunación'
WHERE code = 'ehr:vaccinations:delete';

-- ALERGIAS A MEDICAMENTOS
UPDATE permissions SET description = 'Registrar nuevas alergias o intolerancias a medicamentos'
WHERE code = 'ehr:allergies:create';

UPDATE permissions SET description = 'Consultar alergias conocidas del paciente'
WHERE code = 'ehr:allergies:read';

UPDATE permissions SET description = 'Actualizar información de alergias existentes'
WHERE code = 'ehr:allergies:update';

UPDATE permissions SET description = 'Eliminar registros de alergias resueltas'
WHERE code = 'ehr:allergies:delete';

-- DIAGNÓSTICOS Y ÓRDENES DE LABORATORIO
UPDATE permissions SET description = 'Crear nuevos diagnósticos en la consulta'
WHERE code = 'ehr:diagnostics:create';

UPDATE permissions SET description = 'Ver diagnósticos y hallazgos clínicos registrados'
WHERE code = 'ehr:diagnostics:read';

UPDATE permissions SET description = 'Editar diagnósticos en estado borrador'
WHERE code = 'ehr:diagnostics:update';

UPDATE permissions SET description = 'Eliminar diagnósticos no confirmados'
WHERE code = 'ehr:diagnostics:delete';

-- ADJUNTOS MÉDICOS (Estudios, radiografías, análisis)
UPDATE permissions SET description = 'Subir nuevos documentos médicos (radiografías, análisis, etc.)'
WHERE code = 'ehr:attachments:create';

UPDATE permissions SET description = 'Ver y consultar documentos médicos adjuntos'
WHERE code = 'ehr:attachments:read';

UPDATE permissions SET description = 'Eliminar documentos médicos archivados'
WHERE code = 'ehr:attachments:delete';

UPDATE permissions SET description = 'Descargar documentos médicos para compartir'
WHERE code = 'ehr:attachments:download';

-- FIRMAS DIGITALES
UPDATE permissions SET description = 'Firmar digitalmente historias clínicas completas'
WHERE code = 'ehr:signatures:create';

UPDATE permissions SET description = 'Ver historiales de firmas y auditoría de cambios'
WHERE code = 'ehr:signatures:read';

UPDATE permissions SET description = 'Verificar la autenticidad de historias firmadas'
WHERE code = 'ehr:signatures:verify';

UPDATE permissions SET description = 'Revocar firma digital si hay errores críticos'
WHERE code = 'ehr:signatures:revoke';

-- REPORTES Y ANÁLISIS
UPDATE permissions SET description = 'Ver reportes de historial médico y análisis'
WHERE code = 'ehr:analytics:read';

UPDATE permissions SET description = 'Exportar historiales médicos en PDF o Excel'
WHERE code = 'ehr:analytics:export';

UPDATE permissions SET description = 'Analizar tendencias de salud a lo largo del tiempo'
WHERE code = 'ehr:analytics:trends';

-- ACCESO GENERAL
UPDATE permissions SET description = 'Acceso básico para consultar expedientes médicos'
WHERE code = 'ehr:read';

UPDATE permissions SET description = 'Administración completa del sistema de expedientes médicos'
WHERE code = 'ehr:manage';

-- ============================================================================
-- 2. VERIFICAR PERMISOS COMPLETADOS
-- ============================================================================

SELECT 
  category as "Categoría",
  COUNT(*) as "Cantidad",
  STRING_AGG(code, ', ' ORDER BY code) as "Códigos"
FROM permissions
WHERE code LIKE 'ehr:%'
GROUP BY category
ORDER BY category;

-- ============================================================================
-- 3. VERIFICAR DESCRIPCIONES AMIGABLES
-- ============================================================================

SELECT 
  code as "Código de Permiso",
  name as "Nombre",
  description as "Descripción Amigable",
  category as "Categoría"
FROM permissions
WHERE code LIKE 'ehr:%'
ORDER BY code;

-- ============================================================================
-- 4. RE-ASIGNAR PERMISOS A ROLES (con nuevas descripciones)
-- ============================================================================

-- CLINIC_VETERINARIAN: Acceso completo a EHR (ya asignado, pero validar)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  r.id as role_id,
  p.id as permission_id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'CLINIC_VETERINARIAN'
  AND p.code LIKE 'ehr:%'
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
  )
ON CONFLICT DO NOTHING;

-- CLINIC_OWNER: Acceso completo a EHR (ya asignado, pero validar)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  r.id as role_id,
  p.id as permission_id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'CLINIC_OWNER'
  AND p.code LIKE 'ehr:%'
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
  )
ON CONFLICT DO NOTHING;

-- CLINIC_STAFF: Solo lectura (ya asignado, pero validar)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  r.id as role_id,
  p.id as permission_id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'CLINIC_STAFF'
  AND p.code IN (
    'ehr:medical_history:read',
    'ehr:prescriptions:read',
    'ehr:vaccinations:read',
    'ehr:allergies:read',
    'ehr:diagnostics:read',
    'ehr:attachments:read',
    'ehr:attachments:download',
    'ehr:analytics:read'
  )
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
  )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 5. REPORTE FINAL DE ASIGNACIONES
-- ============================================================================

SELECT 
  r.code as "Rol",
  COUNT(p.code) as "Permisos EHR Asignados",
  STRING_AGG(p.code, ', ' ORDER BY p.code) as "Códigos"
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id AND p.code LIKE 'ehr:%'
WHERE r.code IN ('CLINIC_VETERINARIAN', 'CLINIC_OWNER', 'CLINIC_STAFF')
GROUP BY r.code
ORDER BY r.code;