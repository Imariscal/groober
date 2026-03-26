import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddRemderCyclesToServices1740650000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add reminder cycle columns to services table
    await queryRunner.addColumn(
      'services',
      new TableColumn({
        name: 'applies_reminder_cycle',
        type: 'boolean',
        default: false,
      })
    );

    await queryRunner.addColumn(
      'services',
      new TableColumn({
        name: 'reminder_cycle_type',
        type: 'varchar',
        length: '20',
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      'services',
      new TableColumn({
        name: 'reminder_cycle_value',
        type: 'integer',
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      'services',
      new TableColumn({
        name: 'reminder_days_before',
        type: 'integer',
        default: 7,
      })
    );

    await queryRunner.addColumn(
      'services',
      new TableColumn({
        name: 'requires_followup',
        type: 'boolean',
        default: false,
      })
    );

    // Create check constraint for cycle_type
    await queryRunner.query(`
      ALTER TABLE services
      ADD CONSTRAINT check_reminder_cycle_type
      CHECK (reminder_cycle_type IS NULL OR reminder_cycle_type IN ('DAY', 'WEEK', 'MONTH', 'YEAR'))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop check constraint for cycle_type
    await queryRunner.query(`
      ALTER TABLE services
      DROP CONSTRAINT IF EXISTS check_reminder_cycle_type
    `);

    await queryRunner.dropColumn('services', 'applies_reminder_cycle');
    await queryRunner.dropColumn('services', 'reminder_cycle_type');
    await queryRunner.dropColumn('services', 'reminder_cycle_value');
    await queryRunner.dropColumn('services', 'reminder_days_before');
    await queryRunner.dropColumn('services', 'requires_followup');
  }
}
