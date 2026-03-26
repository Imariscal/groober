import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class DropVaccineTypeColumn1740467200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('vaccinations', 'vaccine_type');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'vaccinations',
      new TableColumn({
        name: 'vaccine_type',
        type: 'varchar',
        length: '50',
        isNullable: false,
      })
    );
  }
}
