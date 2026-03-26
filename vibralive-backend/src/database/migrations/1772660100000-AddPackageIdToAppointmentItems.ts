import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPackageIdToAppointmentItems1772660100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE appointment_items 
      ALTER COLUMN service_id DROP NOT NULL;
      
      ALTER TABLE appointment_items 
      ADD COLUMN package_id uuid;
      
      CREATE INDEX idx_appointment_items_package_id ON appointment_items (package_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_appointment_items_package_id;
      ALTER TABLE appointment_items 
      DROP COLUMN package_id;
      
      ALTER TABLE appointment_items 
      ALTER COLUMN service_id SET NOT NULL;
    `);
  }
}
