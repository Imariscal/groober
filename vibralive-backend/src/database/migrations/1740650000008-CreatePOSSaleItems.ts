import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreatePOSSaleItems1740650000008 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create sale_items table
    await queryRunner.createTable(
      new Table({
        name: 'sale_items',
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
            name: 'sale_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'product_id',
            type: 'uuid',
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
            name: 'unit_price',
            type: 'numeric',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'subtotal',
            type: 'numeric',
            precision: 12,
            scale: 2,
            isNullable: false,
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
      'sale_items',
      new TableIndex({
        name: 'idx_sale_items_sale',
        columnNames: ['sale_id'],
      })
    );

    await queryRunner.createIndex(
      'sale_items',
      new TableIndex({
        name: 'idx_sale_items_product',
        columnNames: ['product_id'],
      })
    );

    // Add foreign keys
    await queryRunner.createForeignKey(
      'sale_items',
      new TableForeignKey({
        columnNames: ['clinic_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'clinics',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'sale_items',
      new TableForeignKey({
        columnNames: ['sale_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'sales',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'sale_items',
      new TableForeignKey({
        columnNames: ['product_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'sale_products',
        onDelete: 'RESTRICT',
      })
    );

    // Create sale_payments table
    await queryRunner.createTable(
      new Table({
        name: 'sale_payments',
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
            name: 'sale_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'payment_method',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'amount',
            type: 'numeric',
            precision: 12,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'reference',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'paid_at',
            type: 'timestamp with time zone',
            isNullable: false,
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
      'sale_payments',
      new TableIndex({
        name: 'idx_sale_payments_sale',
        columnNames: ['sale_id'],
      })
    );

    // Add check constraint
    await queryRunner.query(`
      ALTER TABLE sale_payments
      ADD CONSTRAINT check_payment_method
      CHECK (payment_method IN ('CASH', 'CARD', 'TRANSFER', 'MIXED', 'OTHER'))
    `);

    // Add foreign keys
    await queryRunner.createForeignKey(
      'sale_payments',
      new TableForeignKey({
        columnNames: ['clinic_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'clinics',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'sale_payments',
      new TableForeignKey({
        columnNames: ['sale_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'sales',
        onDelete: 'CASCADE',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('sale_payments');
    await queryRunner.dropTable('sale_items');
  }
}
