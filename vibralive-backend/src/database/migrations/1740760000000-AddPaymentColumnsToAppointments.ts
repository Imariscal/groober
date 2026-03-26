import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPaymentColumnsToAppointments1740760000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add paid column (boolean, default false)
    await queryRunner.addColumn(
      'appointments',
      new TableColumn({
        name: 'paid',
        type: 'boolean',
        default: false,
        comment: 'Indicates if the appointment/sale has been paid',
      }),
    );

    // Add payment_date column (timestamp with timezone, nullable)
    await queryRunner.addColumn(
      'appointments',
      new TableColumn({
        name: 'payment_date',
        type: 'timestamp with time zone',
        isNullable: true,
        comment: 'Date and time when the appointment was paid',
      }),
    );

    // Create index for filtering by paid status
    await queryRunner.query(`
      CREATE INDEX idx_appointments_paid ON appointments(paid)
    `);

    // Create index for filtering by payment_date
    await queryRunner.query(`
      CREATE INDEX idx_appointments_payment_date ON appointments(payment_date)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS idx_appointments_payment_date`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_appointments_paid`);

    // Drop columns
    await queryRunner.dropColumn('appointments', 'payment_date');
    await queryRunner.dropColumn('appointments', 'paid');
  }
}
