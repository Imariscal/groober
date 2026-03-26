-- ============================================================================
-- INSERTAR PERMISOS EHR FALTANTES EN LA BASE DE DATOS
-- ============================================================================
-- Fecha: 2026-03-24
-- Descripción: Inserta los permisos del EHR en la tabla 'permissions'
-- Estructura esperada: id, code, name, description, category
--
-- NOTA IMPORTANTE: Ejecutar después de sincronizar el código con el commit
-- que actualiza los controladores a usar 'ehr:*' en lugar de 'visits:*'
-- ============================================================================

-- 1. Crear permisos de HISTORIAL MÉDICO (EHR)
INSERT INTO permissions (id, code, name, description, category)
VALUES 
  (gen_random_uuid(), 'ehr:medical_history:create', 'ehr_medical_history_create', 'Crear historial médico', 'ehr'),
  (gen_random_uuid(), 'ehr:medical_history:read', 'ehr_medical_history_read', 'Ver historial médico', 'ehr'),
  (gen_random_uuid(), 'ehr:medical_history:update', 'ehr_medical_history_update', 'Editar historial médico', 'ehr'),
  (gen_random_uuid(), 'ehr:medical_history:delete', 'ehr_medical_history_delete', 'Eliminar historial médico', 'ehr')
ON CONFLICT (code) DO NOTHING;

-- 2. Crear permisos de PRESCRIPCIONES (EHR)
INSERT INTO permissions (id, code, name, description, category)
VALUES 
  (gen_random_uuid(), 'ehr:prescriptions:create', 'ehr_prescriptions_create', 'Crear prescripciones', 'ehr'),
  (gen_random_uuid(), 'ehr:prescriptions:read', 'ehr_prescriptions_read', 'Ver prescripciones', 'ehr'),
  (gen_random_uuid(), 'ehr:prescriptions:update', 'ehr_prescriptions_update', 'Editar prescripciones', 'ehr'),
  (gen_random_uuid(), 'ehr:prescriptions:delete', 'ehr_prescriptions_delete', 'Eliminar prescripciones', 'ehr'),
  (gen_random_uuid(), 'ehr:prescriptions:sign', 'ehr_prescriptions_sign', 'Firmar prescripciones digitalmente', 'ehr')
ON CONFLICT (code) DO NOTHING;

-- 3. Crear permisos de VACUNACIONES (EHR)
INSERT INTO permissions (id, code, name, description, category)
VALUES 
  (gen_random_uuid(), 'ehr:vaccinations:create', 'ehr_vaccinations_create', 'Crear registro de vacunas', 'ehr'),
  (gen_random_uuid(), 'ehr:vaccinations:read', 'ehr_vaccinations_read', 'Ver registro de vacunas', 'ehr'),
  (gen_random_uuid(), 'ehr:vaccinations:update', 'ehr_vaccinations_update', 'Editar registro de vacunas', 'ehr'),
  (gen_random_uuid(), 'ehr:vaccinations:delete', 'ehr_vaccinations_delete', 'Eliminar registro de vacunas', 'ehr')
ON CONFLICT (code) DO NOTHING;

-- 4. Crear permisos de ALERGIAS (EHR)
INSERT INTO permissions (id, code, name, description, category)
VALUES 
  (gen_random_uuid(), 'ehr:allergies:create', 'ehr_allergies_create', 'Crear alergias', 'ehr'),
  (gen_random_uuid(), 'ehr:allergies:read', 'ehr_allergies_read', 'Ver alergias', 'ehr'),
  (gen_random_uuid(), 'ehr:allergies:update', 'ehr_allergies_update', 'Editar alergias', 'ehr'),
  (gen_random_uuid(), 'ehr:allergies:delete', 'ehr_allergies_delete', 'Eliminar alergias', 'ehr')
ON CONFLICT (code) DO NOTHING;

-- 5. Crear permisos de DIAGNÓSTICOS (EHR)
INSERT INTO permissions (id, code, name, description, category)
VALUES 
  (gen_random_uuid(), 'ehr:diagnostics:create', 'ehr_diagnostics_create', 'Crear diagnósticos', 'ehr'),
  (gen_random_uuid(), 'ehr:diagnostics:read', 'ehr_diagnostics_read', 'Ver diagnósticos', 'ehr'),
  (gen_random_uuid(), 'ehr:diagnostics:update', 'ehr_diagnostics_update', 'Editar diagnósticos', 'ehr'),
  (gen_random_uuid(), 'ehr:diagnostics:delete', 'ehr_diagnostics_delete', 'Eliminar diagnósticos', 'ehr')
ON CONFLICT (code) DO NOTHING;

-- 6. Crear permisos de ADJUNTOS MÉDICOS (EHR)
INSERT INTO permissions (id, code, name, description, category)
VALUES 
  (gen_random_uuid(), 'ehr:attachments:create', 'ehr_attachments_create', 'Subir adjuntos médicos', 'ehr'),
  (gen_random_uuid(), 'ehr:attachments:read', 'ehr_attachments_read', 'Ver adjuntos médicos', 'ehr'),
  (gen_random_uuid(), 'ehr:attachments:delete', 'ehr_attachments_delete', 'Eliminar adjuntos médicos', 'ehr'),
  (gen_random_uuid(), 'ehr:attachments:download', 'ehr_attachments_download', 'Descargar adjuntos médicos', 'ehr')
ON CONFLICT (code) DO NOTHING;

-- 7. Crear permisos de FIRMAS DIGITALES (EHR)
INSERT INTO permissions (id, code, name, description, category)
VALUES 
  (gen_random_uuid(), 'ehr:signatures:create', 'ehr_signatures_create', 'Crear firma digital de expediente', 'ehr'),
  (gen_random_uuid(), 'ehr:signatures:read', 'ehr_signatures_read', 'Ver firmas digitales', 'ehr'),
  (gen_random_uuid(), 'ehr:signatures:verify', 'ehr_signatures_verify', 'Verificar autenticidad de firmas', 'ehr'),
  (gen_random_uuid(), 'ehr:signatures:revoke', 'ehr_signatures_revoke', 'Revocar firma digital', 'ehr')
ON CONFLICT (code) DO NOTHING;

-- 8. Crear permisos de ANALYTICS/REPORTES (EHR)
INSERT INTO permissions (id, code, name, description, category)
VALUES 
  (gen_random_uuid(), 'ehr:analytics:read', 'ehr_analytics_read', 'Ver reportes de EHR', 'ehr'),
  (gen_random_uuid(), 'ehr:analytics:export', 'ehr_analytics_export', 'Exportar reportes de EHR', 'ehr'),
  (gen_random_uuid(), 'ehr:analytics:trends', 'ehr_analytics_trends', 'Ver tendencias médicas', 'ehr')
ON CONFLICT (code) DO NOTHING;

-- 9. Crear permisos generales (EHR)
INSERT INTO permissions (id, code, name, description, category)
VALUES 
  (gen_random_uuid(), 'ehr:read', 'ehr_read', 'Acceso general a expediente médico', 'ehr'),
  (gen_random_uuid(), 'ehr:manage', 'ehr_manage', 'Administrar expediente médico', 'ehr')
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- VERIFICAR PERMISOS INSERTADOS
-- ============================================================================
SELECT id, code, name, description, category 
FROM permissions
WHERE code LIKE 'ehr:%'
ORDER BY code;

-- ============================================================================
-- ASIGNAR PERMISOS A ROLES
-- ============================================================================
-- CLINIC_VETERINARIAN: Acceso completo a EHR
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

-- CLINIC_OWNER: Acceso completo a EHR (para configuración)
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

-- CLINIC_STAFF: Solo lectura de EHR (except signatures)
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
    'ehr:analytics:read'
  )
  AND NOT EXISTS (
    SELECT 1 FROM role_permissions rp
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
  )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- VERIFICAR ASIGNACIONES
-- ============================================================================
SELECT 
  r.code as role,
  COUNT(p.code) as permission_count,
  STRING_AGG(p.code, ', ' ORDER BY p.code) as permissions
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id AND p.code LIKE 'ehr:%'
WHERE r.code IN ('CLINIC_VETERINARIAN', 'CLINIC_OWNER', 'CLINIC_STAFF')
GROUP BY r.code
ORDER BY r.code;
