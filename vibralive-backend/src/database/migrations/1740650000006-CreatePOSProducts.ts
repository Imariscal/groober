import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreatePOSProducts1740650000006 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create sale_products table
    await queryRunner.createTable(
      new Table({
        name: 'sale_products',
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
            name: 'sku',
            type: 'varchar',
            length: '80',
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '200',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'category',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'brand',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'sale_price',
            type: 'numeric',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'cost_price',
            type: 'numeric',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'stock_quantity',
            type: 'numeric',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'stock_unit',
            type: 'varchar',
            length: '20',
            default: "'UNIT'",
          },
          {
            name: 'min_stock_alert',
            type: 'numeric',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // Create indexes
    await queryRunner.createIndex(
      'sale_products',
      new TableIndex({
        name: 'idx_sale_products_clinic_sku',
        columnNames: ['clinic_id', 'sku'],
        isUnique: true,
      })
    );

    await queryRunner.createIndex(
      'sale_products',
      new TableIndex({
        name: 'idx_sale_products_clinic_active',
        columnNames: ['clinic_id', 'is_active'],
      })
    );

    // Add check constraints
    await queryRunner.query(`
      ALTER TABLE sale_products
      ADD CONSTRAINT check_category
      CHECK (category IN ('FOOD', 'ACCESSORY', 'CLOTHING', 'HYGIENE', 'TOY', 'OTHER'))
    `);

    await queryRunner.query(`
      ALTER TABLE sale_products
      ADD CONSTRAINT check_stock_unit
      CHECK (stock_unit IN ('UNIT', 'KG', 'BAG', 'BOX', 'LITER', 'PACK'))
    `);

    await queryRunner.query(`
      ALTER TABLE sale_products
      ADD CONSTRAINT check_prices
      CHECK (sale_price > 0 AND (cost_price IS NULL OR cost_price >= 0))
    `);

    // Add foreign key
    await queryRunner.createForeignKey(
      'sale_products',
      new TableForeignKey({
        columnNames: ['clinic_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'clinics',
        onDelete: 'CASCADE',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('sale_products');
  }
}
