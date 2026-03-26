import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddMaxOverlappingAppointmentsToClinicConfig1773000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'clinic_configuration',
      new TableColumn({
        name: 'max_clinic_overlapping_appointments',
        type: 'integer',
        default: 5,
        isNullable: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn(
      'clinic_configuration',
      'max_clinic_overlapping_appointments',
    );
  }
}
