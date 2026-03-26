import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddActorTypeToAuditLog1740555000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if column already exists to avoid errors
        const table = await queryRunner.getTable("audit_logs");
        const columnExists = table?.columns.some(col => col.name === 'actor_type');
        
        if (!columnExists) {
            await queryRunner.addColumn(
                "audit_logs",
                new TableColumn({
                    name: "actor_type",
                    type: "varchar",
                    length: "50",
                    default: "'platform_user'",
                    isNullable: false,
                })
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn("audit_logs", "actor_type");
    }
}
