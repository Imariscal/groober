import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProfileAndConfigurationColumnsToUserAndClinic1740800000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add missing columns to users table
    await queryRunner.query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS address VARCHAR(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(100) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS country VARCHAR(100) NULL`,
    );

    // Add missing columns to clinics table
    await queryRunner.query(
      `ALTER TABLE clinics ADD COLUMN IF NOT EXISTS notifications_email BOOLEAN DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE clinics ADD COLUMN IF NOT EXISTS notifications_sms BOOLEAN DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE clinics ADD COLUMN IF NOT EXISTS privacy VARCHAR(50) DEFAULT 'private'`,
    );
    await queryRunner.query(
      `ALTER TABLE clinics ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'es'`,
    );
    await queryRunner.query(
      `ALTER TABLE clinics ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'America/Mexico_City'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop columns from users table
    await queryRunner.query(
      `ALTER TABLE users DROP COLUMN IF EXISTS address`,
    );
    await queryRunner.query(
      `ALTER TABLE users DROP COLUMN IF EXISTS city`,
    );
    await queryRunner.query(
      `ALTER TABLE users DROP COLUMN IF EXISTS postal_code`,
    );
    await queryRunner.query(
      `ALTER TABLE users DROP COLUMN IF EXISTS country`,
    );

    // Drop columns from clinics table
    await queryRunner.query(
      `ALTER TABLE clinics DROP COLUMN IF EXISTS notifications_email`,
    );
    await queryRunner.query(
      `ALTER TABLE clinics DROP COLUMN IF EXISTS notifications_sms`,
    );
    await queryRunner.query(
      `ALTER TABLE clinics DROP COLUMN IF EXISTS privacy`,
    );
    await queryRunner.query(
      `ALTER TABLE clinics DROP COLUMN IF EXISTS language`,
    );
    await queryRunner.query(
      `ALTER TABLE clinics DROP COLUMN IF EXISTS timezone`,
    );
  }
}
