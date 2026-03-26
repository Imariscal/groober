import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm';

export class FixServiceSizePriceIndex1741010000000 implements MigrationInterface {
  name = 'FixServiceSizePriceIndex1741010000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the old unique index if it exists
    try {
      await queryRunner.dropIndex('service_size_prices', 'IDX_service_size_prices_clinic_service_size_unique');
    } catch (error) {
      // Index may not exist, continue
      console.log('Old index not found, continuing...');
    }

    // Drop the old constraint if exists (might have been created differently)
    try {
      await queryRunner.query(
        `ALTER TABLE service_size_prices DROP CONSTRAINT IF EXISTS "UQ_service_size_prices_clinic_service_pet_size"`,
      );
    } catch (error) {
      console.log('Old constraint not found, continuing...');
    }

    // Ensure the new composite index exists
    try {
      await queryRunner.createIndex(
        'service_size_prices',
        new TableIndex({
          name: 'IDX_service_size_prices_composite',
          columnNames: ['clinic_id', 'price_list_id', 'service_id', 'pet_size'],
          isUnique: false, // Cannot be unique with NULL values for price_list_id
        }),
      );
    } catch (error) {
      // Index might already exist
      console.log('Index already exists or error creating:', error);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.dropIndex('service_size_prices', 'IDX_service_size_prices_composite');
    } catch (error) {
      console.log('Index not found during rollback');
    }
  }
}
