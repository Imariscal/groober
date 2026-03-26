import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Remove COMMERCIAL option from housing_type enum
 * Keep only: HOUSE, APARTMENT, OTHER
 * Created: 2026-03-01
 */
export class RemoveCommercialFromHousingType1741200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the existing constraint
    await queryRunner.query(
      `ALTER TABLE clients DROP CONSTRAINT IF EXISTS chk_housing_type`
    );

    // Create new constraint without COMMERCIAL
    await queryRunner.query(
      `ALTER TABLE clients ADD CONSTRAINT chk_housing_type 
       CHECK (housing_type IS NULL OR housing_type IN ('HOUSE', 'APARTMENT', 'OTHER'))`
    );

    // Clear any existing COMMERCIAL values (set to NULL)
    await queryRunner.query(
      `UPDATE clients SET housing_type = NULL WHERE housing_type = 'COMMERCIAL'`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore the old constraint with COMMERCIAL
    await queryRunner.query(
      `ALTER TABLE clients DROP CONSTRAINT IF EXISTS chk_housing_type`
    );

    await queryRunner.query(
      `ALTER TABLE clients ADD CONSTRAINT chk_housing_type 
       CHECK (housing_type IS NULL OR housing_type IN ('HOUSE', 'APARTMENT', 'COMMERCIAL', 'OTHER'))`
    );
  }
}
