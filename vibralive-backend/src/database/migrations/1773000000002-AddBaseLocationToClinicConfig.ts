import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddBaseLocationToClinicConfig1773000000002
  implements MigrationInterface
{
  name = 'AddBaseLocationToClinicConfig1773000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('clinic_configuration', [
      new TableColumn({
        name: 'base_lat',
        type: 'numeric',
        precision: 10,
        scale: 7,
        isNullable: true,
      }),
      new TableColumn({
        name: 'base_lng',
        type: 'numeric',
        precision: 10,
        scale: 7,
        isNullable: true,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('clinic_configuration', 'base_lng');
    await queryRunner.dropColumn('clinic_configuration', 'base_lat');
  }
}
