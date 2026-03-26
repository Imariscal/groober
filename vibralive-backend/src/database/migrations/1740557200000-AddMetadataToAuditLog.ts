import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddMetadataToAuditLog1740557200000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if column already exists
        const table = await queryRunner.getTable("audit_logs");
        const columnExists = table?.columns.some(col => col.name === 'metadata');
        
        if (!columnExists) {
            await queryRunner.addColumn(
                "audit_logs",
                new TableColumn({
                    name: "metadata",
                    type: "jsonb",
                    isNullable: true,
                    default: "'{}'",
                })
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn("audit_logs", "metadata");
    }
}
