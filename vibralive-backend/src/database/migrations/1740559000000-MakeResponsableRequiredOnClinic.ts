import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeResponsableRequiredOnClinic1740559000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Set default value for existing nulls
    await queryRunner.query(
      `UPDATE "clinics" SET responsable = 'Sin responsable' WHERE responsable IS NULL`
    );

    // Alter column to be NOT NULL
    await queryRunner.query(
      `ALTER TABLE "clinics" ALTER COLUMN "responsable" SET NOT NULL`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert: allow nulls again
    await queryRunner.query(
      `ALTER TABLE "clinics" ALTER COLUMN "responsable" DROP NOT NULL`
    );
  }
}
