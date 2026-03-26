import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddServiceTypeToAppointments1741700000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add service_type column with default 'MEDICAL'
    await queryRunner.addColumn(
      'appointments',
      new TableColumn({
        name: 'service_type',
        type: 'enum',
        enum: ['MEDICAL', 'GROOMING'],
        default: "'MEDICAL'",
        isNullable: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove service_type column in case of rollback
    await queryRunner.dropColumn('appointments', 'service_type');
  }
}
