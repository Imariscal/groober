import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddEntityTypeToAuditLog1740557000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if column already exists
        const table = await queryRunner.getTable("audit_logs");
        const columnExists = table?.columns.some(col => col.name === 'entity_type');
        
        if (!columnExists) {
            await queryRunner.addColumn(
                "audit_logs",
                new TableColumn({
                    name: "entity_type",
                    type: "varchar",
                    length: "50",
                    isNullable: false,
                    default: "'clinic'",
                })
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn("audit_logs", "entity_type");
    }
}
