import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixTimestampTimezone1740810000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Convert appointments.scheduled_at from TIMESTAMP to TIMESTAMP WITH TIME ZONE
    await queryRunner.query(`
      ALTER TABLE appointments
      ALTER COLUMN scheduled_at TYPE timestamp with time zone
    `);

    // Convert appointment_groups.scheduled_at from TIMESTAMP to TIMESTAMP WITH TIME ZONE
    await queryRunner.query(`
      ALTER TABLE appointment_groups
      ALTER COLUMN scheduled_at TYPE timestamp with time zone
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert: Convert back to TIMESTAMP without time zone
    await queryRunner.query(`
      ALTER TABLE appointments
      ALTER COLUMN scheduled_at TYPE timestamp
    `);

    await queryRunner.query(`
      ALTER TABLE appointment_groups
      ALTER COLUMN scheduled_at TYPE timestamp
    `);
  }
}
