import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRescheduledAtToAppointments1772700000000 implements MigrationInterface {
  name = 'AddRescheduledAtToAppointments1772700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE appointments
      ADD COLUMN IF NOT EXISTS rescheduled_at TIMESTAMP NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE appointments
      DROP COLUMN IF EXISTS rescheduled_at
    `);
  }
}
