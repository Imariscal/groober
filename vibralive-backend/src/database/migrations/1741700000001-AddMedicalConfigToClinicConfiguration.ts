import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddMedicalConfigToClinicConfiguration1741700000001
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add medical capacity columns
    await queryRunner.addColumn(
      'clinic_configuration',
      new TableColumn({
        name: 'clinic_medical_capacity',
        type: 'integer',
        default: 1,
        isNullable: false,
      }),
    );

    await queryRunner.addColumn(
      'clinic_configuration',
      new TableColumn({
        name: 'home_medical_capacity',
        type: 'integer',
        default: 1,
        isNullable: false,
      }),
    );

    await queryRunner.addColumn(
      'clinic_configuration',
      new TableColumn({
        name: 'medical_travel_buffer_minutes',
        type: 'integer',
        default: 10,
        isNullable: false,
      }),
    );

    await queryRunner.addColumn(
      'clinic_configuration',
      new TableColumn({
        name: 'max_clinic_medical_overlapping_appointments',
        type: 'integer',
        default: 3,
        isNullable: false,
      }),
    );

    await queryRunner.addColumn(
      'clinic_configuration',
      new TableColumn({
        name: 'allow_medical_appointment_overlap',
        type: 'boolean',
        default: false,
        isNullable: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn(
      'clinic_configuration',
      'clinic_medical_capacity',
    );
    await queryRunner.dropColumn(
      'clinic_configuration',
      'home_medical_capacity',
    );
    await queryRunner.dropColumn(
      'clinic_configuration',
      'medical_travel_buffer_minutes',
    );
    await queryRunner.dropColumn(
      'clinic_configuration',
      'max_clinic_medical_overlapping_appointments',
    );
    await queryRunner.dropColumn(
      'clinic_configuration',
      'allow_medical_appointment_overlap',
    );
  }
}
