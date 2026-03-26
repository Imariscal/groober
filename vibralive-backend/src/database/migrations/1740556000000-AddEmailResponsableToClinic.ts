import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddEmailResponsableToClinic1740556000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn(
            "clinics",
            new TableColumn({
                name: "email",
                type: "varchar",
                length: "255",
                isNullable: true,
            })
        );

        await queryRunner.addColumn(
            "clinics",
            new TableColumn({
                name: "responsable",
                type: "varchar",
                length: "255",
                isNullable: true,
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn("clinics", "responsable");
        await queryRunner.dropColumn("clinics", "email");
    }
}
