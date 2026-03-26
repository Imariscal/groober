import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDescriptionAndCurrencyToServices1772629800000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add description to price_lists
    await queryRunner.query(`
      ALTER TABLE price_lists 
      ADD COLUMN description varchar NULL;
    `);

    // Add currency and is_available to service_prices
    await queryRunner.query(`
      ALTER TABLE service_prices 
      ADD COLUMN currency varchar NOT NULL DEFAULT 'MXN';
    `);

    await queryRunner.query(`
      ALTER TABLE service_prices 
      ADD COLUMN is_available boolean NOT NULL DEFAULT true;
    `);

    // Add precision to price column to match entity definition
    await queryRunner.query(`
      ALTER TABLE service_prices 
      ALTER COLUMN price TYPE numeric(10,2);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove columns added in this migration
    await queryRunner.query(`
      ALTER TABLE price_lists 
      DROP COLUMN description;
    `);

    await queryRunner.query(`
      ALTER TABLE service_prices 
      DROP COLUMN currency;
    `);

    await queryRunner.query(`
      ALTER TABLE service_prices 
      DROP COLUMN is_available;
    `);

    // Revert price precision
    await queryRunner.query(`
      ALTER TABLE service_prices 
      ALTER COLUMN price TYPE numeric;
    `);
  }
}
