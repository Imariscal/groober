import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddAllowAppointmentOverlapToClinicConfig1773000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'clinic_configuration',
      new TableColumn({
        name: 'allow_appointment_overlap',
        type: 'boolean',
        default: false,
        isNullable: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('clinic_configuration', 'allow_appointment_overlap');
  }
}
