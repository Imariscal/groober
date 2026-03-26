import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class ConvertLocationTypeToEnum1772660200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create ENUM type
    await queryRunner.query(`
      CREATE TYPE location_type_enum AS ENUM ('CLINIC', 'HOME')
    `);

    // Add temporary column with new type
    await queryRunner.addColumn(
      'appointments',
      new TableColumn({
        name: 'location_type_new',
        type: 'location_type_enum',
        default: "'CLINIC'",
        isNullable: false,
      }),
    );

    // Migrate data from old column to new, handling invalid values
    await queryRunner.query(`
      UPDATE appointments 
      SET location_type_new = CASE 
        WHEN UPPER(location_type) = 'HOME' THEN 'HOME'::location_type_enum
        ELSE 'CLINIC'::location_type_enum
      END
    `);

    // Drop old column
    await queryRunner.dropColumn('appointments', 'location_type');

    // Rename new column
    await queryRunner.query(
      `ALTER TABLE appointments RENAME COLUMN location_type_new TO location_type`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert to VARCHAR
    await queryRunner.addColumn(
      'appointments',
      new TableColumn({
        name: 'location_type_varchar',
        type: 'varchar',
        length: '20',
        default: "'CLINIC'",
      }),
    );

    await queryRunner.query(
      `UPDATE appointments SET location_type_varchar = location_type::text`,
    );

    await queryRunner.dropColumn('appointments', 'location_type');

    await queryRunner.query(
      `ALTER TABLE appointments RENAME COLUMN location_type_varchar TO location_type`,
    );

    // Drop ENUM type
    await queryRunner.query(`DROP TYPE location_type_enum`);
  }
}
