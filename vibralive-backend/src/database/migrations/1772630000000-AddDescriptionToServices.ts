import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDescriptionToServices1772630000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add description to services
    await queryRunner.query(`
      ALTER TABLE services 
      ADD COLUMN description varchar NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove description column from services
    await queryRunner.query(`
      ALTER TABLE services 
      DROP COLUMN description;
    `);
  }
}
