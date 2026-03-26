import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateReminderQueue1740650000005 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create reminder_queue table
    await queryRunner.createTable(
      new Table({
        name: 'reminder_queue',
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
            name: 'preventive_event_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'appointment_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'channel',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'reminder_type',
            type: 'varchar',
            length: '30',
            isNullable: false,
          },
          {
            name: 'scheduled_for',
            type: 'timestamp with time zone',
            isNullable: false,
          },
          {
            name: 'sent_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'PENDING'",
          },
          {
            name: 'template_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'payload_json',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'error_message',
            type: 'text',
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
      'reminder_queue',
      new TableIndex({
        name: 'idx_reminder_queue_clinic_status',
        columnNames: ['clinic_id', 'status'],
      })
    );

    await queryRunner.createIndex(
      'reminder_queue',
      new TableIndex({
        name: 'idx_reminder_queue_scheduled',
        columnNames: ['status', 'scheduled_for'],
      })
    );

    await queryRunner.createIndex(
      'reminder_queue',
      new TableIndex({
        name: 'idx_reminder_queue_pet',
        columnNames: ['pet_id'],
      })
    );

    // Add check constraints
    await queryRunner.query(`
      ALTER TABLE reminder_queue
      ADD CONSTRAINT check_channel
      CHECK (channel IN ('WHATSAPP', 'EMAIL'))
    `);

    await queryRunner.query(`
      ALTER TABLE reminder_queue
      ADD CONSTRAINT check_reminder_type
      CHECK (reminder_type IN ('UPCOMING_PREVENTIVE_EVENT', 'OVERDUE_PREVENTIVE_EVENT', 'APPOINTMENT_REMINDER'))
    `);

    await queryRunner.query(`
      ALTER TABLE reminder_queue
      ADD CONSTRAINT check_reminder_status
      CHECK (status IN ('PENDING', 'SENT', 'FAILED', 'CANCELLED'))
    `);

    // Add foreign keys
    await queryRunner.createForeignKey(
      'reminder_queue',
      new TableForeignKey({
        columnNames: ['clinic_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'clinics',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'reminder_queue',
      new TableForeignKey({
        columnNames: ['client_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'clients',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'reminder_queue',
      new TableForeignKey({
        columnNames: ['pet_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'pets',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'reminder_queue',
      new TableForeignKey({
        columnNames: ['preventive_event_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'pet_preventive_care_events',
        onDelete: 'SET NULL',
      })
    );

    await queryRunner.createForeignKey(
      'reminder_queue',
      new TableForeignKey({
        columnNames: ['appointment_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'appointments',
        onDelete: 'SET NULL',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('reminder_queue');
  }
}
