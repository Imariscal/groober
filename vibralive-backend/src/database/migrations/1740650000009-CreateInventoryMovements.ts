import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateInventoryMovements1740650000009 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create inventory_movements table
    await queryRunner.createTable(
      new Table({
        name: 'inventory_movements',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'clinic_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'product_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'movement_type',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'quantity',
            type: 'numeric',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'reason',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'reference_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_by_user_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // Create indexes
    await queryRunner.createIndex(
      'inventory_movements',
      new TableIndex({
        name: 'idx_inventory_movements_product',
        columnNames: ['product_id'],
      })
    );

    await queryRunner.createIndex(
      'inventory_movements',
      new TableIndex({
        name: 'idx_inventory_movements_clinic_created',
        columnNames: ['clinic_id', 'created_at'],
      })
    );

    // Add check constraints
    await queryRunner.query(`
      ALTER TABLE inventory_movements
      ADD CONSTRAINT check_movement_type
      CHECK (movement_type IN ('IN', 'OUT', 'ADJUSTMENT'))
    `);

    await queryRunner.query(`
      ALTER TABLE inventory_movements
      ADD CONSTRAINT check_reason
      CHECK (reason IN ('SALE', 'PURCHASE', 'ADJUSTMENT', 'RETURN', 'DAMAGE', 'OTHER'))
    `);

    // Add foreign keys
    await queryRunner.createForeignKey(
      'inventory_movements',
      new TableForeignKey({
        columnNames: ['clinic_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'clinics',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'inventory_movements',
      new TableForeignKey({
        columnNames: ['product_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'sale_products',
        onDelete: 'CASCADE',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('inventory_movements');
  }
}
