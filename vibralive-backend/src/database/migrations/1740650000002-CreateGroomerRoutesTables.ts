import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateGroomerRoutesTables1740650000002
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create groomer_routes table
    await queryRunner.createTable(
      new Table({
        name: 'groomer_routes',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'clinic_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'route_date',
            type: 'date',
            isNullable: false,
            comment: 'Date of the route (grooming day)',
          },
          {
            name: 'groomer_user_id',
            type: 'uuid',
            isNullable: false,
            comment: 'Staff user assigned as groomer',
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'PENDING'",
            comment: 'PENDING|GENERATED|IN_PROGRESS|COMPLETED|CANCELLED',
          },
          {
            name: 'total_stops',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'total_distance_meters',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'estimated_duration_minutes',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'generated_at',
            type: 'timestamp',
            isNullable: true,
            comment: 'When algorithm generated this route',
          },
          {
            name: 'algorithm_version',
            type: 'varchar',
            length: '50',
            isNullable: true,
            comment: 'e.g., "v1.0-nearest-neighbor"',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['clinic_id'],
            referencedTableName: 'clinics',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
          new TableForeignKey({
            columnNames: ['groomer_user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
        ],
      }),
    );

    // Create indexes for groomer_routes
    await queryRunner.createIndex(
      'groomer_routes',
      new TableIndex({
        name: 'idx_groomer_routes_clinic_date',
        columnNames: ['clinic_id', 'route_date'],
      }),
    );

    await queryRunner.createIndex(
      'groomer_routes',
      new TableIndex({
        name: 'idx_groomer_routes_groomer_date',
        columnNames: ['groomer_user_id', 'route_date'],
      }),
    );

    await queryRunner.createIndex(
      'groomer_routes',
      new TableIndex({
        name: 'idx_groomer_routes_status',
        columnNames: ['status'],
      }),
    );

    // Create groomer_route_stops table
    await queryRunner.createTable(
      new Table({
        name: 'groomer_route_stops',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'route_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'appointment_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'stop_order',
            type: 'integer',
            isNullable: false,
            comment: '1, 2, 3... sequence in the route',
          },
          {
            name: 'planned_arrival_time',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'planned_departure_time',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'actual_arrival_time',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'actual_departure_time',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'travel_distance_to_stop_meters',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'travel_duration_to_stop_minutes',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'PENDING'",
            comment: 'PENDING|IN_PROGRESS|COMPLETED|SKIPPED',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['route_id'],
            referencedTableName: 'groomer_routes',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
          new TableForeignKey({
            columnNames: ['appointment_id'],
            referencedTableName: 'appointments',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
        ],
      }),
    );

    // Create indexes for groomer_route_stops
    await queryRunner.createIndex(
      'groomer_route_stops',
      new TableIndex({
        name: 'idx_groomer_route_stops_route',
        columnNames: ['route_id'],
      }),
    );

    await queryRunner.createIndex(
      'groomer_route_stops',
      new TableIndex({
        name: 'idx_groomer_route_stops_appointment',
        columnNames: ['appointment_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('groomer_route_stops', true);
    await queryRunner.dropTable('groomer_routes', true);
  }
}
