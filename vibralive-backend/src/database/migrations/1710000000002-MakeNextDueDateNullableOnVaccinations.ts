import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeNextDueDateNullableOnVaccinations1710000000002
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Make next_due_date nullable for single-dose vaccines
    await queryRunner.query(
      `ALTER TABLE vaccinations 
       ALTER COLUMN next_due_date DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert: Make next_due_date NOT NULL again
    // Note: This will fail if there are NULL values, so we set them to administered_date + 1 year as fallback
    await queryRunner.query(
      `UPDATE vaccinations 
       SET next_due_date = administered_date + INTERVAL '365 days'
       WHERE next_due_date IS NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE vaccinations 
       ALTER COLUMN next_due_date SET NOT NULL`,
    );
  }
}
