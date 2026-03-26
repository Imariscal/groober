import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateVeterinariansTableComplete1710158403000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop table if it exists (from previous attempts)
    const tableExists = await queryRunner.hasTable('veterinarians');
    if (tableExists) {
      await queryRunner.dropTable('veterinarians', true);
    }

    // Create veterinarians table with all columns
    await queryRunner.createTable(
      new Table({
        name: 'veterinarians',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'clinic_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'display_name',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'specialty',
            type: 'varchar',
            length: '50',
            default: "'GENERAL'",
            isNullable: false,
          },
          {
            name: 'is_bookable',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'calendar_color',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'license_number',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'NOW()',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'NOW()',
            isNullable: false,
          },
        ],
        indices: [
          {
            name: 'idx_veterinarians_clinic_id',
            columnNames: ['clinic_id'],
          },
          {
            name: 'idx_veterinarians_user_id',
            columnNames: ['user_id'],
          },
        ],
      }),
      true,
    );

    // Add foreign key for clinic_id
    await queryRunner.createForeignKey(
      'veterinarians',
      new TableForeignKey({
        columnNames: ['clinic_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'clinics',
        onDelete: 'CASCADE',
      }),
    );

    // Add foreign key for user_id
    await queryRunner.createForeignKey(
      'veterinarians',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('veterinarians');
    if (tableExists) {
      await queryRunner.dropTable('veterinarians', true);
    }
  }
}
