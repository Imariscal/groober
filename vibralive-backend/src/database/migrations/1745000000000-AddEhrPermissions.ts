import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEhrPermissions1745000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Insert EHR permissions
    const permissions = [
      // HISTORIAL MÉDICO
      { code: 'ehr_medical_history_create', name: 'ehr:medical_history:create', description: 'Crear historial médico', category: 'ehr' },
      { code: 'ehr_medical_history_read', name: 'ehr:medical_history:read', description: 'Ver historial médico', category: 'ehr' },
      { code: 'ehr_medical_history_update', name: 'ehr:medical_history:update', description: 'Editar historial médico', category: 'ehr' },
      { code: 'ehr_medical_history_delete', name: 'ehr:medical_history:delete', description: 'Eliminar historial médico', category: 'ehr' },

      // PRESCRIPCIONES
      { code: 'ehr_prescriptions_create', name: 'ehr:prescriptions:create', description: 'Crear prescripciones', category: 'ehr' },
      { code: 'ehr_prescriptions_read', name: 'ehr:prescriptions:read', description: 'Ver prescripciones', category: 'ehr' },
      { code: 'ehr_prescriptions_update', name: 'ehr:prescriptions:update', description: 'Editar prescripciones', category: 'ehr' },
      { code: 'ehr_prescriptions_delete', name: 'ehr:prescriptions:delete', description: 'Eliminar prescripciones', category: 'ehr' },
      { code: 'ehr_prescriptions_sign', name: 'ehr:prescriptions:sign', description: 'Firmar prescripciones digitalmente', category: 'ehr' },

      // VACUNAS
      { code: 'ehr_vaccinations_create', name: 'ehr:vaccinations:create', description: 'Crear registro de vacunas', category: 'ehr' },
      { code: 'ehr_vaccinations_read', name: 'ehr:vaccinations:read', description: 'Ver registro de vacunas', category: 'ehr' },
      { code: 'ehr_vaccinations_update', name: 'ehr:vaccinations:update', description: 'Editar registro de vacunas', category: 'ehr' },
      { code: 'ehr_vaccinations_delete', name: 'ehr:vaccinations:delete', description: 'Eliminar registro de vacunas', category: 'ehr' },

      // ALERGIAS
      { code: 'ehr_allergies_create', name: 'ehr:allergies:create', description: 'Crear alergias', category: 'ehr' },
      { code: 'ehr_allergies_read', name: 'ehr:allergies:read', description: 'Ver alergias', category: 'ehr' },
      { code: 'ehr_allergies_update', name: 'ehr:allergies:update', description: 'Editar alergias', category: 'ehr' },
      { code: 'ehr_allergies_delete', name: 'ehr:allergies:delete', description: 'Eliminar alergias', category: 'ehr' },

      // DIAGNÓSTICOS
      { code: 'ehr_diagnostics_create', name: 'ehr:diagnostics:create', description: 'Crear diagnósticos', category: 'ehr' },
      { code: 'ehr_diagnostics_read', name: 'ehr:diagnostics:read', description: 'Ver diagnósticos', category: 'ehr' },
      { code: 'ehr_diagnostics_update', name: 'ehr:diagnostics:update', description: 'Editar diagnósticos', category: 'ehr' },
      { code: 'ehr_diagnostics_delete', name: 'ehr:diagnostics:delete', description: 'Eliminar diagnósticos', category: 'ehr' },

      // ADJUNTOS
      { code: 'ehr_attachments_create', name: 'ehr:attachments:create', description: 'Subir adjuntos médicos', category: 'ehr' },
      { code: 'ehr_attachments_read', name: 'ehr:attachments:read', description: 'Ver adjuntos médicos', category: 'ehr' },
      { code: 'ehr_attachments_delete', name: 'ehr:attachments:delete', description: 'Eliminar adjuntos médicos', category: 'ehr' },
      { code: 'ehr_attachments_download', name: 'ehr:attachments:download', description: 'Descargar adjuntos médicos', category: 'ehr' },

      // FIRMAS DIGITALES
      { code: 'ehr_signatures_create', name: 'ehr:signatures:create', description: 'Crear firma digital de expediente', category: 'ehr' },
      { code: 'ehr_signatures_read', name: 'ehr:signatures:read', description: 'Ver firmas digitales', category: 'ehr' },
      { code: 'ehr_signatures_verify', name: 'ehr:signatures:verify', description: 'Verificar autenticidad de firmas', category: 'ehr' },
      { code: 'ehr_signatures_revoke', name: 'ehr:signatures:revoke', description: 'Revocar firma digital', category: 'ehr' },

      // REPORTES Y ANALYTICS
      { code: 'ehr_analytics_read', name: 'ehr:analytics:read', description: 'Ver reportes de EHR', category: 'ehr' },
      { code: 'ehr_analytics_export', name: 'ehr:analytics:export', description: 'Exportar reportes de EHR', category: 'ehr' },
      { code: 'ehr_analytics_trends', name: 'ehr:analytics:trends', description: 'Ver tendencias médicas', category: 'ehr' },

      // ACCESO GENERAL
      { code: 'ehr_read', name: 'ehr:read', description: 'Acceso general a expediente médico', category: 'ehr' },
      { code: 'ehr_manage', name: 'ehr:manage', description: 'Administrar expediente médico', category: 'ehr' },
    ];

    // Insert permissions
    for (const perm of permissions) {
      await queryRunner.query(
        `INSERT INTO permissions (id, code, name, description, category)
         VALUES (gen_random_uuid(), $1, $2, $3, $4)
         ON CONFLICT (code) DO NOTHING`,
        [perm.code, perm.name, perm.description, perm.category]
      );
    }

    // 2. Get OWNER role and assign all permissions
    const result = await queryRunner.query(
      `SELECT id FROM roles WHERE code = 'owner' LIMIT 1`
    );

    if (result && result.length > 0) {
      const roleId = result[0].id;

      // Assign all EHR permissions to OWNER role
      for (const perm of permissions) {
        await queryRunner.query(
          `INSERT INTO role_permissions (role_id, permission_id)
           SELECT $1, p.id FROM permissions p
           WHERE p.code = $2
           ON CONFLICT DO NOTHING`,
          [roleId, perm.code]
        );
      }
    }

    // 3. Assign subset to STAFF role
    const staffResult = await queryRunner.query(
      `SELECT id FROM roles WHERE code = 'staff' LIMIT 1`
    );

    if (staffResult && staffResult.length > 0) {
      const staffRoleId = staffResult[0].id;
      const staffPermissions = [
        'ehr_medical_history_read',
        'ehr_medical_history_update',
        'ehr_prescriptions_create',
        'ehr_prescriptions_read',
        'ehr_prescriptions_update',
        'ehr_vaccinations_read',
        'ehr_vaccinations_create',
        'ehr_vaccinations_update',
        'ehr_allergies_read',
        'ehr_allergies_create',
        'ehr_allergies_update',
        'ehr_diagnostics_read',
        'ehr_diagnostics_create',
        'ehr_diagnostics_update',
        'ehr_attachments_create',
        'ehr_attachments_read',
        'ehr_attachments_download',
        'ehr_analytics_read',
      ];

      for (const code of staffPermissions) {
        await queryRunner.query(
          `INSERT INTO role_permissions (role_id, permission_id)
           SELECT $1, p.id FROM permissions p
           WHERE p.code = $2
           ON CONFLICT DO NOTHING`,
          [staffRoleId, code]
        );
      }
    }

    // 4. Assign subset to VETERINARIAN role
    const vetResult = await queryRunner.query(
      `SELECT id FROM roles WHERE code = 'veterinarian' LIMIT 1`
    );

    if (vetResult && vetResult.length > 0) {
      const vetRoleId = vetResult[0].id;
      const vetPermissions = [
        'ehr_medical_history_create',
        'ehr_medical_history_read',
        'ehr_medical_history_update',
        'ehr_prescriptions_create',
        'ehr_prescriptions_read',
        'ehr_prescriptions_update',
        'ehr_prescriptions_sign',
        'ehr_vaccinations_create',
        'ehr_vaccinations_read',
        'ehr_vaccinations_update',
        'ehr_allergies_create',
        'ehr_allergies_read',
        'ehr_allergies_update',
        'ehr_diagnostics_create',
        'ehr_diagnostics_read',
        'ehr_diagnostics_update',
        'ehr_attachments_create',
        'ehr_attachments_read',
        'ehr_attachments_download',
        'ehr_signatures_create',
        'ehr_signatures_read',
        'ehr_signatures_verify',
        'ehr_analytics_read',
        'ehr_read',
        'ehr_manage',
      ];

      for (const code of vetPermissions) {
        await queryRunner.query(
          `INSERT INTO role_permissions (role_id, permission_id)
           SELECT $1, p.id FROM permissions p
           WHERE p.code = $2
           ON CONFLICT DO NOTHING`,
          [vetRoleId, code]
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Delete role_permissions for EHR permissions
    await queryRunner.query(
      `DELETE FROM role_permissions
       WHERE permission_id IN (
         SELECT id FROM permissions WHERE category = 'ehr'
       )`
    );

    // Delete EHR permissions
    await queryRunner.query(
      `DELETE FROM permissions WHERE category = 'ehr'`
    );
  }
}
