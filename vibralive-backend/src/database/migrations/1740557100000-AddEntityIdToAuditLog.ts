import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddEntityIdToAuditLog1740557100000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if column already exists
        const table = await queryRunner.getTable("audit_logs");
        const columnExists = table?.columns.some(col => col.name === 'entity_id');
        
        if (!columnExists) {
            await queryRunner.addColumn(
                "audit_logs",
                new TableColumn({
                    name: "entity_id",
                    type: "uuid",
                    isNullable: false,
                })
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn("audit_logs", "entity_id");
    }
}
