import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeResourceIdNullableOnAuditLog1740558000001 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Alter column to be nullable
        await queryRunner.query(
            `ALTER TABLE "audit_logs" ALTER COLUMN "resource_id" DROP NOT NULL`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert: make column not null again
        await queryRunner.query(
            `ALTER TABLE "audit_logs" ALTER COLUMN "resource_id" SET NOT NULL`
        );
    }
}
