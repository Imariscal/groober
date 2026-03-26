import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeCityRequiredOnClinic1740558000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // First, set default values for existing NULL cities
        await queryRunner.query(
            `UPDATE clinics SET city = 'Unknown' WHERE city IS NULL`
        );

        // Then alter the column to be NOT NULL
        await queryRunner.query(
            `ALTER TABLE clinics ALTER COLUMN city SET NOT NULL`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert: make city nullable again
        await queryRunner.query(
            `ALTER TABLE clinics ALTER COLUMN city DROP NOT NULL`
        );
    }
}
