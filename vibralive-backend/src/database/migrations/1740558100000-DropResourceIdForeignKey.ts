import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropResourceIdForeignKey1740558100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Dropear la foreign key constraint en resource_id
    await queryRunner.query(
      `ALTER TABLE "audit_logs" DROP CONSTRAINT IF EXISTS "FK_177183f29f438c488b5e8510cdb"`
    );

    // Asegurar que resource_id es nullable
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ALTER COLUMN "resource_id" DROP NOT NULL`
    );

    // Asegurar que tiene default null
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ALTER COLUMN "resource_id" SET DEFAULT NULL`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revertir cambios
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ALTER COLUMN "resource_id" DROP DEFAULT`
    );
  }
}
