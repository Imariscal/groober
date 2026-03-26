import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddAssignmentFieldsToAppointments1772660300000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create ENUM for assignment_source
    await queryRunner.query(`
      CREATE TYPE assignment_source_enum AS ENUM ('NONE', 'AUTO_ROUTE', 'MANUAL_RECEPTION', 'COMPLETED_IN_CLINIC')
    `);

    // Add assignment_source column
    await queryRunner.addColumn(
      'appointments',
      new TableColumn({
        name: 'assignment_source',
        type: 'assignment_source_enum',
        default: "'NONE'",
        isNullable: false,
      }),
    );

    // Add assigned_at column
    await queryRunner.addColumn(
      'appointments',
      new TableColumn({
        name: 'assigned_at',
        type: 'timestamp',
        isNullable: true,
      }),
    );

    // Set assigned_at for existing assignments
    await queryRunner.query(`
      UPDATE appointments 
      SET assigned_at = updated_at, assignment_source = 'COMPLETED_IN_CLINIC'::assignment_source_enum
      WHERE assigned_staff_user_id IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop columns
    await queryRunner.dropColumn('appointments', 'assigned_at');
    await queryRunner.dropColumn('appointments', 'assignment_source');

    // Drop ENUM type
    await queryRunner.query(`DROP TYPE assignment_source_enum`);
  }
}
