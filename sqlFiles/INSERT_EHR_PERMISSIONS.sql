-- =====================================================================
-- SCRIPT: Agregar permisos de Expediente Médico Electrónico (EHR)
-- Asignar permisos a CLINIC_OWNER
-- =====================================================================

-- 1. CREAR TABLA TEMPORAL CON LOS PERMISOS A INSERTAR
CREATE TEMP TABLE temp_ehr_permissions (name VARCHAR, description VARCHAR);

INSERT INTO temp_ehr_permissions VALUES
('ehr:medical_history:create', 'Crear historial médico'),
('ehr:medical_history:read', 'Ver historial médico'),
('ehr:medical_history:update', 'Editar historial médico'),
('ehr:medical_history:delete', 'Eliminar historial médico'),
('ehr:prescriptions:create', 'Crear prescripciones'),
('ehr:prescriptions:read', 'Ver prescripciones'),
('ehr:prescriptions:update', 'Editar prescripciones'),
('ehr:prescriptions:delete', 'Eliminar prescripciones'),
('ehr:prescriptions:sign', 'Firmar prescripciones digitalmente'),
('ehr:vaccinations:create', 'Crear registro de vacunas'),
('ehr:vaccinations:read', 'Ver registro de vacunas'),
('ehr:vaccinations:update', 'Editar registro de vacunas'),
('ehr:vaccinations:delete', 'Eliminar registro de vacunas'),
('ehr:allergies:create', 'Crear alergias'),
('ehr:allergies:read', 'Ver alergias'),
('ehr:allergies:update', 'Editar alergias'),
('ehr:allergies:delete', 'Eliminar alergias'),
('ehr:diagnostics:create', 'Crear diagnósticos'),
('ehr:diagnostics:read', 'Ver diagnósticos'),
('ehr:diagnostics:update', 'Editar diagnósticos'),
('ehr:diagnostics:delete', 'Eliminar diagnósticos'),
('ehr:attachments:create', 'Subir adjuntos médicos'),
('ehr:attachments:read', 'Ver adjuntos médicos'),
('ehr:attachments:delete', 'Eliminar adjuntos médicos'),
('ehr:attachments:download', 'Descargar adjuntos médicos'),
('ehr:signatures:create', 'Crear firma digital de expediente'),
('ehr:signatures:read', 'Ver firmas digitales'),
('ehr:signatures:verify', 'Verificar autenticidad de firmas'),
('ehr:signatures:revoke', 'Revocar firma digital'),
('ehr:analytics:read', 'Ver reportes de EHR'),
('ehr:analytics:export', 'Exportar reportes de EHR'),
('ehr:analytics:trends', 'Ver tendencias médicas'),
('ehr:read', 'Acceso general a expediente médico'),
('ehr:manage', 'Administrar expediente médico');

-- 2. INSERTAR PERMISOS QUE NO EXISTAN
INSERT INTO permissions (id, name, description) 
SELECT gen_random_uuid(), t.name, t.description
FROM temp_ehr_permissions t
WHERE NOT EXISTS (SELECT 1 FROM permissions p WHERE p.name = t.name);

-- 3. ASIGNAR TODOS LOS PERMISOS DE EHR A CLINIC_OWNER
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE (r.name = 'CLINIC_OWNER' OR r.code = 'owner')
AND p.name LIKE 'ehr:%'
AND NOT EXISTS (
  SELECT 1 FROM role_permissions rp 
  WHERE rp.role_id = r.id AND rp.permission_id = p.id
);

-- 4. ASIGNAR PERMISOS DE EHR A CLINIC_STAFF (lectura y actualizaciones básicas)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE (r.name = 'CLINIC_STAFF' OR r.code = 'staff')
AND p.name IN (
  'ehr:medical_history:read', 'ehr:medical_history:update',
  'ehr:prescriptions:create', 'ehr:prescriptions:read', 'ehr:prescriptions:update',
  'ehr:vaccinations:read', 'ehr:vaccinations:create', 'ehr:vaccinations:update',
  'ehr:allergies:read', 'ehr:allergies:create', 'ehr:allergies:update',
  'ehr:diagnostics:read', 'ehr:diagnostics:create', 'ehr:diagnostics:update',
  'ehr:attachments:create', 'ehr:attachments:read', 'ehr:attachments:download',
  'ehr:analytics:read'
)
AND NOT EXISTS (
  SELECT 1 FROM role_permissions rp 
  WHERE rp.role_id = r.id AND rp.permission_id = p.id
);

-- 5. ASIGNAR PERMISOS DE EHR A CLINIC_VETERINARIAN (si existe)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE (r.name = 'CLINIC_VETERINARIAN' OR r.code = 'veterinarian')
AND p.name IN (
  'ehr:medical_history:create', 'ehr:medical_history:read', 'ehr:medical_history:update',
  'ehr:prescriptions:create', 'ehr:prescriptions:read', 'ehr:prescriptions:update', 'ehr:prescriptions:sign',
  'ehr:vaccinations:create', 'ehr:vaccinations:read', 'ehr:vaccinations:update',
  'ehr:allergies:create', 'ehr:allergies:read', 'ehr:allergies:update',
  'ehr:diagnostics:create', 'ehr:diagnostics:read', 'ehr:diagnostics:update',
  'ehr:attachments:create', 'ehr:attachments:read', 'ehr:attachments:download',
  'ehr:signatures:create', 'ehr:signatures:read', 'ehr:signatures:verify',
  'ehr:analytics:read',
  'ehr:read', 'ehr:manage'
)
AND NOT EXISTS (
  SELECT 1 FROM role_permissions rp 
  WHERE rp.role_id = r.id AND rp.permission_id = p.id
);

-- 6. VERIFICACIÓN
SELECT '=== Permisos de EHR creados ===' as info;
SELECT COUNT(*) as total_permisos, COUNT(DISTINCT name) as permisos_unicos FROM permissions WHERE name LIKE 'ehr:%';

SELECT '=== Detalles de permisos de EHR ===' as info;
SELECT id, name, description FROM permissions WHERE name LIKE 'ehr:%' ORDER BY name;

SELECT '=== Roles disponibles ===' as info;
SELECT id, code, name FROM roles;

SELECT '=== Asignaciones de EHR a roles ===' as info;
SELECT 
  r.code as role_code,
  r.name as role_name,
  COUNT(rp.permission_id) as total_ehr_permissions
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id AND p.name LIKE 'ehr:%'
GROUP BY r.id, r.code, r.name
HAVING COUNT(rp.permission_id) > 0
ORDER BY r.name;

SELECT '✅ Proceso completado! Verifica las queries arriba para confirmar.' as resultado;
