import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNameAndCategoryToPermissions1772800000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add name column
    await queryRunner.query(`
      ALTER TABLE permissions 
      ADD COLUMN name varchar(100) NOT NULL DEFAULT '';
    `);

    // Add category column
    await queryRunner.query(`
      ALTER TABLE permissions 
      ADD COLUMN category varchar(50) NOT NULL DEFAULT 'general';
    `);

    // Update existing permissions with appropriate names and categories
    await queryRunner.query(`
      UPDATE permissions SET
        name = CASE code
          WHEN 'USER_CREATE' THEN 'Crear usuarios'
          WHEN 'USER_READ' THEN 'Ver usuarios'
          WHEN 'USER_UPDATE' THEN 'Editar usuarios'
          WHEN 'USER_DEACTIVATE' THEN 'Desactivar usuarios'
          WHEN 'CLIENT_CREATE' THEN 'Crear clientes'
          WHEN 'CLIENT_READ' THEN 'Ver clientes'
          WHEN 'CLIENT_UPDATE' THEN 'Editar clientes'
          WHEN 'CLIENT_DELETE' THEN 'Eliminar clientes'
          WHEN 'PET_CREATE' THEN 'Crear mascotas'
          WHEN 'PET_READ' THEN 'Ver mascotas'
          WHEN 'PET_UPDATE' THEN 'Editar mascotas'
          WHEN 'PET_DELETE' THEN 'Eliminar mascotas'
          WHEN 'APPOINTMENT_CREATE' THEN 'Crear citas'
          WHEN 'APPOINTMENT_READ' THEN 'Ver citas'
          WHEN 'APPOINTMENT_UPDATE' THEN 'Editar citas'
          WHEN 'APPOINTMENT_CANCEL' THEN 'Cancelar citas'
          WHEN 'STYLIST_READ' THEN 'Ver estilistas'
          WHEN 'STYLIST_UPDATE' THEN 'Editar estilistas'
          WHEN 'SERVICE_CREATE' THEN 'Crear servicios'
          WHEN 'SERVICE_READ' THEN 'Ver servicios'
          WHEN 'SERVICE_UPDATE' THEN 'Editar servicios'
          WHEN 'SERVICE_DELETE' THEN 'Eliminar servicios'
          WHEN 'PRICING_MANAGE' THEN 'Gestionar precios'
          WHEN 'CLINIC_SETTINGS_READ' THEN 'Ver configuración'
          WHEN 'CLINIC_SETTINGS_UPDATE' THEN 'Editar configuración'
          WHEN 'REPORTS_VIEW' THEN 'Ver reportes'
          ELSE code
        END,
        category = CASE 
          WHEN code LIKE 'USER_%' THEN 'users'
          WHEN code LIKE 'CLIENT_%' THEN 'clients'
          WHEN code LIKE 'PET_%' THEN 'pets'
          WHEN code LIKE 'APPOINTMENT_%' THEN 'appointments'
          WHEN code LIKE 'STYLIST_%' THEN 'stylists'
          WHEN code LIKE 'SERVICE_%' OR code = 'PRICING_MANAGE' THEN 'services'
          WHEN code LIKE 'CLINIC_%' OR code = 'REPORTS_VIEW' THEN 'clinic'
          ELSE 'general'
        END;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE permissions DROP COLUMN category;`);
    await queryRunner.query(`ALTER TABLE permissions DROP COLUMN name;`);
  }
}
