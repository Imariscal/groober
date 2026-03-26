import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDiseassesCoveredToVaccines1710000000003
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add diseases_covered column as TEXT (TypeORM's simple-array is stored as text)
    await queryRunner.query(
      `ALTER TABLE vaccines 
       ADD COLUMN diseases_covered text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert: Remove diseases_covered column
    await queryRunner.query(
      `ALTER TABLE vaccines 
       DROP COLUMN diseases_covered`,
    );
  }
}
