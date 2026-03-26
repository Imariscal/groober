import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreatePetPreventiveCareEvents1740650000004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create pet_preventive_care_events table
    await queryRunner.createTable(
      new Table({
        name: 'pet_preventive_care_events',
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
            name: 'client_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'pet_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'appointment_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'appointment_item_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'service_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'event_type',
            type: 'varchar',
            length: '30',
            isNullable: false,
          },
          {
            name: 'applied_at',
            type: 'timestamp with time zone',
            isNullable: false,
          },
          {
            name: 'next_due_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'cycle_type',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'cycle_value',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'reminder_days_before',
            type: 'integer',
            default: 7,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'ACTIVE'",
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_by_user_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // Create indexes
    await queryRunner.createIndex(
      'pet_preventive_care_events',
      new TableIndex({
        name: 'idx_preventive_events_clinic_pet',
        columnNames: ['clinic_id', 'pet_id'],
      })
    );

    await queryRunner.createIndex(
      'pet_preventive_care_events',
      new TableIndex({
        name: 'idx_preventive_events_next_due',
        columnNames: ['clinic_id', 'status', 'next_due_at'],
      })
    );

    await queryRunner.createIndex(
      'pet_preventive_care_events',
      new TableIndex({
        name: 'idx_preventive_events_appointment',
        columnNames: ['appointment_id'],
      })
    );

    // Add check constraints
    await queryRunner.query(`
      ALTER TABLE pet_preventive_care_events
      ADD CONSTRAINT check_event_type
      CHECK (event_type IN ('VACCINE', 'DEWORMING_INTERNAL', 'DEWORMING_EXTERNAL', 'GROOMING_MAINTENANCE', 'OTHER'))
    `);

    await queryRunner.query(`
      ALTER TABLE pet_preventive_care_events
      ADD CONSTRAINT check_cycle_type
      CHECK (cycle_type IS NULL OR cycle_type IN ('DAY', 'WEEK', 'MONTH', 'YEAR'))
    `);

    await queryRunner.query(`
      ALTER TABLE pet_preventive_care_events
      ADD CONSTRAINT check_status
      CHECK (status IN ('ACTIVE', 'COMPLETED', 'CANCELLED', 'EXPIRED'))
    `);

    // Add foreign keys
    await queryRunner.createForeignKey(
      'pet_preventive_care_events',
      new TableForeignKey({
        columnNames: ['clinic_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'clinics',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'pet_preventive_care_events',
      new TableForeignKey({
        columnNames: ['client_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'clients',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'pet_preventive_care_events',
      new TableForeignKey({
        columnNames: ['pet_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'pets',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'pet_preventive_care_events',
      new TableForeignKey({
        columnNames: ['appointment_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'appointments',
        onDelete: 'SET NULL',
      })
    );

    await queryRunner.createForeignKey(
      'pet_preventive_care_events',
      new TableForeignKey({
        columnNames: ['service_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'services',
        onDelete: 'RESTRICT',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('pet_preventive_care_events');
  }
}
