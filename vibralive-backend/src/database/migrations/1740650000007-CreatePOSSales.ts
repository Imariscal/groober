import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreatePOSSales1740650000007 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create sales table
    await queryRunner.createTable(
      new Table({
        name: 'sales',
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
            name: 'client_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'appointment_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'sale_type',
            type: 'varchar',
            length: '20',
            default: "'POS'",
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'DRAFT'",
          },
          {
            name: 'subtotal',
            type: 'numeric',
            precision: 12,
            scale: 2,
            default: 0,
          },
          {
            name: 'discount_amount',
            type: 'numeric',
            precision: 12,
            scale: 2,
            default: 0,
          },
          {
            name: 'tax_amount',
            type: 'numeric',
            precision: 12,
            scale: 2,
            default: 0,
          },
          {
            name: 'total_amount',
            type: 'numeric',
            precision: 12,
            scale: 2,
            default: 0,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'sold_at',
            type: 'timestamp with time zone',
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
      'sales',
      new TableIndex({
        name: 'idx_sales_clinic_status',
        columnNames: ['clinic_id', 'status'],
      })
    );

    await queryRunner.createIndex(
      'sales',
      new TableIndex({
        name: 'idx_sales_client',
        columnNames: ['client_id'],
      })
    );

    await queryRunner.createIndex(
      'sales',
      new TableIndex({
        name: 'idx_sales_appointment',
        columnNames: ['appointment_id'],
      })
    );

    // Add check constraints
    await queryRunner.query(`
      ALTER TABLE sales
      ADD CONSTRAINT check_sale_type
      CHECK (sale_type IN ('POS', 'APPOINTMENT_ADDON'))
    `);

    await queryRunner.query(`
      ALTER TABLE sales
      ADD CONSTRAINT check_sale_status
      CHECK (status IN ('DRAFT', 'COMPLETED', 'CANCELLED', 'REFUNDED'))
    `);

    // Add foreign keys
    await queryRunner.createForeignKey(
      'sales',
      new TableForeignKey({
        columnNames: ['clinic_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'clinics',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'sales',
      new TableForeignKey({
        columnNames: ['client_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'clients',
        onDelete: 'SET NULL',
      })
    );

    await queryRunner.createForeignKey(
      'sales',
      new TableForeignKey({
        columnNames: ['appointment_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'appointments',
        onDelete: 'SET NULL',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('sales');
  }
}
