import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVisitsAndPOSPermissions1740650000010 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Insert new permissions for Clinical Visits
    await queryRunner.query(`
      INSERT INTO permissions (id, code, name, description, category)
      VALUES 
        (gen_random_uuid(), 'VISIT_CREATE', 'Create Clinical Visits', 'Crear visitas clínicas', 'visits'),
        (gen_random_uuid(), 'VISIT_READ', 'Read Clinical Visits', 'Ver visitas clínicas', 'visits'),
        (gen_random_uuid(), 'VISIT_UPDATE', 'Update Clinical Visits', 'Editar visitas clínicas', 'visits'),
        (gen_random_uuid(), 'VISIT_CANCEL', 'Cancel Clinical Visits', 'Cancelar visitas clínicas', 'visits'),
        (gen_random_uuid(), 'VISIT_COMPLETE', 'Complete Clinical Visits', 'Completar visitas clínicas', 'visits')
      ON CONFLICT (code) DO NOTHING
    `);

    // Insert new permissions for Preventive Care
    await queryRunner.query(`
      INSERT INTO permissions (id, code, name, description, category)
      VALUES 
        (gen_random_uuid(), 'PREVENTIVE_CARE_CREATE', 'Create Preventive Care Events', 'Crear eventos de cuidado preventivo', 'preventive_care'),
        (gen_random_uuid(), 'PREVENTIVE_CARE_READ', 'Read Preventive Care Events', 'Ver eventos de cuidado preventivo', 'preventive_care'),
        (gen_random_uuid(), 'PREVENTIVE_CARE_UPDATE', 'Update Preventive Care Events', 'Editar eventos de cuidado preventivo', 'preventive_care'),
        (gen_random_uuid(), 'PREVENTIVE_CARE_DELETE', 'Delete Preventive Care Events', 'Eliminar eventos de cuidado preventivo', 'preventive_care')
      ON CONFLICT (code) DO NOTHING
    `);

    // Insert new permissions for POS
    await queryRunner.query(`
      INSERT INTO permissions (id, code, name, description, category)
      VALUES 
        (gen_random_uuid(), 'POS_PRODUCT_CREATE', 'Create POS Products', 'Crear productos POS', 'pos'),
        (gen_random_uuid(), 'POS_PRODUCT_READ', 'Read POS Products', 'Ver productos POS', 'pos'),
        (gen_random_uuid(), 'POS_PRODUCT_UPDATE', 'Update POS Products', 'Editar productos POS', 'pos'),
        (gen_random_uuid(), 'POS_PRODUCT_DELETE', 'Delete POS Products', 'Eliminar productos POS', 'pos'),
        (gen_random_uuid(), 'POS_SALE_CREATE', 'Create POS Sales', 'Crear ventas POS', 'pos'),
        (gen_random_uuid(), 'POS_SALE_READ', 'Read POS Sales', 'Ver ventas POS', 'pos'),
        (gen_random_uuid(), 'POS_SALE_UPDATE', 'Update POS Sales', 'Editar ventas POS', 'pos'),
        (gen_random_uuid(), 'POS_SALE_CANCEL', 'Cancel POS Sales', 'Cancelar ventas POS', 'pos'),
        (gen_random_uuid(), 'POS_SALE_REFUND', 'Refund POS Sales', 'Reembolsar ventas POS', 'pos'),
        (gen_random_uuid(), 'POS_INVENTORY_READ', 'Read POS Inventory', 'Ver inventario POS', 'pos'),
        (gen_random_uuid(), 'POS_INVENTORY_ADJUST', 'Adjust POS Inventory', 'Ajustar inventario POS', 'pos')
      ON CONFLICT (code) DO NOTHING
    `);

    // Insert new permissions for Reminders
    await queryRunner.query(`
      INSERT INTO permissions (id, code, name, description, category)
      VALUES 
        (gen_random_uuid(), 'REMINDER_READ', 'Read Reminders', 'Ver recordatorios', 'reminders'),
        (gen_random_uuid(), 'REMINDER_SEND', 'Send Reminders', 'Enviar recordatorios', 'reminders'),
        (gen_random_uuid(), 'REMINDER_CANCEL', 'Cancel Reminders', 'Cancelar recordatorios', 'reminders')
      ON CONFLICT (code) DO NOTHING
    `);

    // Update CLINIC_OWNER role to include new permissions
    await queryRunner.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id FROM roles r, permissions p
      WHERE r.code = 'CLINIC_OWNER'
        AND p.code IN (
          'VISIT_CREATE', 'VISIT_READ', 'VISIT_UPDATE', 'VISIT_CANCEL', 'VISIT_COMPLETE',
          'PREVENTIVE_CARE_CREATE', 'PREVENTIVE_CARE_READ', 'PREVENTIVE_CARE_UPDATE', 'PREVENTIVE_CARE_DELETE',
          'POS_PRODUCT_CREATE', 'POS_PRODUCT_READ', 'POS_PRODUCT_UPDATE', 'POS_PRODUCT_DELETE',
          'POS_SALE_CREATE', 'POS_SALE_READ', 'POS_SALE_UPDATE', 'POS_SALE_CANCEL', 'POS_SALE_REFUND',
          'POS_INVENTORY_READ', 'POS_INVENTORY_ADJUST',
          'REMINDER_READ', 'REMINDER_SEND', 'REMINDER_CANCEL'
        )
        AND NOT EXISTS (
          SELECT 1 FROM role_permissions rp
          WHERE rp.role_id = r.id AND rp.permission_id = p.id
        )
      ON CONFLICT (role_id, permission_id) DO NOTHING
    `);

    // Update CLINIC_STAFF role to include new permissions
    await queryRunner.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id FROM roles r, permissions p
      WHERE r.code = 'CLINIC_STAFF'
        AND p.code IN (
          'VISIT_CREATE', 'VISIT_READ', 'VISIT_UPDATE', 'VISIT_COMPLETE',
          'PREVENTIVE_CARE_READ', 'PREVENTIVE_CARE_UPDATE',
          'POS_PRODUCT_READ',
          'POS_SALE_CREATE', 'POS_SALE_READ', 'POS_SALE_UPDATE', 'POS_SALE_REFUND',
          'POS_INVENTORY_READ', 'POS_INVENTORY_ADJUST',
          'REMINDER_READ'
        )
        AND NOT EXISTS (
          SELECT 1 FROM role_permissions rp
          WHERE rp.role_id = r.id AND rp.permission_id = p.id
        )
      ON CONFLICT (role_id, permission_id) DO NOTHING
    `);

    // Update CLINIC_STYLIST role to include new permissions
    await queryRunner.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id FROM roles r, permissions p
      WHERE r.code = 'CLINIC_STYLIST'
        AND p.code IN (
          'VISIT_READ',
          'POS_PRODUCT_READ'
        )
        AND NOT EXISTS (
          SELECT 1 FROM role_permissions rp
          WHERE rp.role_id = r.id AND rp.permission_id = p.id
        )
      ON CONFLICT (role_id, permission_id) DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove role-permission associations
    await queryRunner.query(`
      DELETE FROM role_permissions
      WHERE permission_id IN (
        SELECT id FROM permissions
        WHERE code IN (
          'VISIT_CREATE', 'VISIT_READ', 'VISIT_UPDATE', 'VISIT_CANCEL', 'VISIT_COMPLETE',
          'PREVENTIVE_CARE_CREATE', 'PREVENTIVE_CARE_READ', 'PREVENTIVE_CARE_UPDATE', 'PREVENTIVE_CARE_DELETE',
          'POS_PRODUCT_CREATE', 'POS_PRODUCT_READ', 'POS_PRODUCT_UPDATE', 'POS_PRODUCT_DELETE',
          'POS_SALE_CREATE', 'POS_SALE_READ', 'POS_SALE_UPDATE', 'POS_SALE_CANCEL', 'POS_SALE_REFUND',
          'POS_INVENTORY_READ', 'POS_INVENTORY_ADJUST',
          'REMINDER_READ', 'REMINDER_SEND', 'REMINDER_CANCEL'
        )
      )
    `);

    // Remove new permissions
    await queryRunner.query(`
      DELETE FROM permissions
      WHERE code IN (
        'VISIT_CREATE', 'VISIT_READ', 'VISIT_UPDATE', 'VISIT_CANCEL', 'VISIT_COMPLETE',
        'PREVENTIVE_CARE_CREATE', 'PREVENTIVE_CARE_READ', 'PREVENTIVE_CARE_UPDATE', 'PREVENTIVE_CARE_DELETE',
        'POS_PRODUCT_CREATE', 'POS_PRODUCT_READ', 'POS_PRODUCT_UPDATE', 'POS_PRODUCT_DELETE',
        'POS_SALE_CREATE', 'POS_SALE_READ', 'POS_SALE_UPDATE', 'POS_SALE_CANCEL', 'POS_SALE_REFUND',
        'POS_INVENTORY_READ', 'POS_INVENTORY_ADJUST',
        'REMINDER_READ', 'REMINDER_SEND', 'REMINDER_CANCEL'
      )
    `);
  }
}

