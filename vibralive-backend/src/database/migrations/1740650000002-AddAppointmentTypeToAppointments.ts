import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddAppointmentTypeToAppointments1740650000002
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add appointment_type column to appointments table
    await queryRunner.addColumn(
      'appointments',
      new TableColumn({
        name: 'appointment_type',
        type: 'enum',
        enum: ['GROOMING', 'CLINIC'],
        default: "'CLINIC'",
        comment: 'GROOMING|CLINIC - Type of appointment',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the appointment_type column
    await queryRunner.dropColumn('appointments', 'appointment_type');
  }
}
