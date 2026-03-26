import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddRecurrenceFieldsToCampaigns1741585200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add recurrence fields to campaigns table
    await queryRunner.addColumn(
      'campaigns',
      new TableColumn({
        name: 'is_recurring',
        type: 'boolean',
        default: false,
        isNullable: false,
      })
    );

    await queryRunner.addColumn(
      'campaigns',
      new TableColumn({
        name: 'recurrence_type',
        type: 'varchar',
        length: '50',
        default: "'ONCE'",
        isNullable: false,
        comment: 'ONCE, DAILY, WEEKLY, MONTHLY',
      })
    );

    await queryRunner.addColumn(
      'campaigns',
      new TableColumn({
        name: 'recurrence_interval',
        type: 'integer',
        default: 1,
        isNullable: false,
        comment: 'Every N days/weeks/months',
      })
    );

    await queryRunner.addColumn(
      'campaigns',
      new TableColumn({
        name: 'recurrence_end_date',
        type: 'timestamp with time zone',
        isNullable: true,
        comment: 'When does the recurrence stop',
      })
    );

    await queryRunner.addColumn(
      'campaigns',
      new TableColumn({
        name: 'last_sent_at',
        type: 'timestamp with time zone',
        isNullable: true,
        comment: 'Last time this recurring campaign was sent',
      })
    );

    await queryRunner.addColumn(
      'campaigns',
      new TableColumn({
        name: 'next_scheduled_at',
        type: 'timestamp with time zone',
        isNullable: true,
        comment: 'Next time this recurring campaign should be sent',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('campaigns', 'next_scheduled_at');
    await queryRunner.dropColumn('campaigns', 'last_sent_at');
    await queryRunner.dropColumn('campaigns', 'recurrence_end_date');
    await queryRunner.dropColumn('campaigns', 'recurrence_interval');
    await queryRunner.dropColumn('campaigns', 'recurrence_type');
    await queryRunner.dropColumn('campaigns', 'is_recurring');
  }
}
