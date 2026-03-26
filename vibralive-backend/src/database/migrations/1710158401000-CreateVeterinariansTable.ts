import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateVeterinariansTable1710158401000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create veterinarians table
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
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'NOW()',
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
    // Drop table
    await queryRunner.dropTable('veterinarians', true);
  }
}
