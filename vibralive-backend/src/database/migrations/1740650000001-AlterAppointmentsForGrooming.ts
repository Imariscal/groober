import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey, Table, TableIndex } from 'typeorm';

export class AlterAppointmentsForGrooming1740650000001
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add columns to appointments table
    await queryRunner.addColumn(
      'appointments',
      new TableColumn({
        name: 'location_type',
        type: 'varchar',
        length: '20',
        default: "'CLINIC'",
        comment: 'CLINIC|HOME',
      }),
    );

    await queryRunner.addColumn(
      'appointments',
      new TableColumn({
        name: 'address_id',
        type: 'uuid',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'appointments',
      new TableColumn({
        name: 'assigned_staff_user_id',
        type: 'uuid',
        isNullable: true,
        comment: 'Groomer assigned (future use for routing)',
      }),
    );

    await queryRunner.addColumn(
      'appointments',
      new TableColumn({
        name: 'requires_route_planning',
        type: 'boolean',
        default: false,
        comment: 'true when location_type=HOME and grooming requires routing',
      }),
    );

    // Add foreign key for address_id
    await queryRunner.createForeignKey(
      'appointments',
      new TableForeignKey({
        columnNames: ['address_id'],
        referencedTableName: 'client_addresses',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    // Add foreign key for assigned_staff_user_id
    await queryRunner.createForeignKey(
      'appointments',
      new TableForeignKey({
        columnNames: ['assigned_staff_user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    // Add index for location_type filtering
    await queryRunner.createIndex(
      'appointments',
      new TableIndex({
        name: 'idx_appointments_location_type',
        columnNames: ['location_type'],
      }),
    );

    // Add index for route planning queries
    await queryRunner.createIndex(
      'appointments',
      new TableIndex({
        name: 'idx_appointments_requires_route_planning',
        columnNames: ['requires_route_planning', 'scheduled_at'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    const table = await queryRunner.getTable('appointments');
    const addressFk = table?.foreignKeys.find(
      (fk) => fk.columnNames[0] === 'address_id',
    );
    const staffFk = table?.foreignKeys.find(
      (fk) => fk.columnNames[0] === 'assigned_staff_user_id',
    );

    if (addressFk) {
      await queryRunner.dropForeignKey('appointments', addressFk);
    }
    if (staffFk) {
      await queryRunner.dropForeignKey('appointments', staffFk);
    }

    // Drop columns
    await queryRunner.dropColumn('appointments', 'location_type');
    await queryRunner.dropColumn('appointments', 'address_id');
    await queryRunner.dropColumn('appointments', 'assigned_staff_user_id');
    await queryRunner.dropColumn('appointments', 'requires_route_planning');
  }
}
