import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableColumn, TableIndex } from 'typeorm';

export class CreateVaccineCatalog1710000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create vaccines catalog table
    await queryRunner.createTable(
      new Table({
        name: 'vaccines',
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
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'booster_days',
            type: 'integer',
            isNullable: false,
            comment: 'Days until next booster appointment',
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['clinic_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'clinics',
            onDelete: 'CASCADE',
          }),
        ],
        indices: [
          new TableIndex({
            columnNames: ['clinic_id'],
          }),
          new TableIndex({
            columnNames: ['clinic_id', 'is_active'],
          }),
        ],
      }),
    );

    // Add new columns to vaccinations table
    await queryRunner.addColumns('vaccinations', [
      new TableColumn({
        name: 'vaccine_id',
        type: 'uuid',
        isNullable: true,
      }),
      new TableColumn({
        name: 'manufacturer',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
      new TableColumn({
        name: 'lot_number',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
      new TableColumn({
        name: 'expiration_date',
        type: 'date',
        isNullable: true,
      }),
      new TableColumn({
        name: 'adverse_reactions',
        type: 'text',
        isNullable: true,
      }),
      new TableColumn({
        name: 'status',
        type: 'enum',
        enum: ['ADMINISTERED', 'OVERDUE', 'PENDING', 'OMITTED'],
        default: "'ADMINISTERED'",
        isNullable: false,
      }),
    ]);

    // Add foreign key for vaccine_id
    await queryRunner.createForeignKey(
      'vaccinations',
      new TableForeignKey({
        columnNames: ['vaccine_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'vaccines',
        onDelete: 'SET NULL',
      }),
    );

    // Add index on vaccine_id
    await queryRunner.createIndex(
      'vaccinations',
      new TableIndex({
        columnNames: ['vaccine_id'],
      }),
    );

    // Note: Drop old columns (vaccine_type, vaccine_name) in down() method
    // These columns will be migrated manually or left as is for backward compatibility
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove vaccine_id FK and index
    const table = await queryRunner.getTable('vaccinations');
    
    if (table) {
      const foreignKey = table.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('vaccine_id') !== -1,
      );
      if (foreignKey) {
        await queryRunner.dropForeignKey('vaccinations', foreignKey);
      }

      const index = table.indices.find(
        (idx) => idx.columnNames.indexOf('vaccine_id') !== -1,
      );
      if (index) {
        await queryRunner.dropIndex('vaccinations', index);
      }
    }

    // Drop new columns from vaccinations
    await queryRunner.dropColumns('vaccinations', [
      'vaccine_id',
      'manufacturer',
      'lot_number',
      'expiration_date',
      'adverse_reactions',
      'status',
    ]);

    // Drop vaccines table
    await queryRunner.dropTable('vaccines', true);
  }
}
