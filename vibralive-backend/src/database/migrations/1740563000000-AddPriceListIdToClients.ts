import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPriceListIdToClients1740563000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE clients ADD COLUMN price_list_id uuid;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE clients DROP COLUMN price_list_id;
    `);
  }
}
