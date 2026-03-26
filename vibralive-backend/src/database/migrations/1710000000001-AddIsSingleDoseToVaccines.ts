import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddIsSingleDoseToVaccines1710000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add is_single_dose column to vaccines table
    await queryRunner.addColumn(
      'vaccines',
      new TableColumn({
        name: 'is_single_dose',
        type: 'boolean',
        default: false,
        isNullable: false,
        comment: 'Indicates if vaccine is single dose or requires boosters',
      }),
    );

    // Make booster_days nullable since single-dose vaccines won't have a booster schedule
    await queryRunner.changeColumn(
      'vaccines',
      'booster_days',
      new TableColumn({
        name: 'booster_days',
        type: 'integer',
        isNullable: true,
        comment: 'Days until next booster appointment (null for single-dose vaccines)',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert booster_days to be non-nullable
    await queryRunner.changeColumn(
      'vaccines',
      'booster_days',
      new TableColumn({
        name: 'booster_days',
        type: 'integer',
        isNullable: false,
        comment: 'Days until next booster appointment',
      }),
    );

    // Drop is_single_dose column
    await queryRunner.dropColumn('vaccines', 'is_single_dose');
  }
}
