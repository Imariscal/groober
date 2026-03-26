import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateAppointmentAndWhatsApp1740466800000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create appointments table
    await queryRunner.createTable(
      new Table({
        name: 'appointments',
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
            name: 'pet_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'client_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'scheduled_at',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'SCHEDULED'",
            isNullable: false,
          },
          {
            name: 'reason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'duration_minutes',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'veterinarian_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'cancelled_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'cancelled_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'cancellation_reason',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
        foreignKeys: [
          {
            columnNames: ['clinic_id'],
            referencedTableName: 'clinics',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['pet_id'],
            referencedTableName: 'pets',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['client_id'],
            referencedTableName: 'clients',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // Create indices for appointments
    await queryRunner.createIndex(
      'appointments',
      new TableIndex({
        columnNames: ['clinic_id', 'status'],
      }),
    );

    await queryRunner.createIndex(
      'appointments',
      new TableIndex({
        columnNames: ['clinic_id', 'scheduled_at'],
      }),
    );

    await queryRunner.createIndex(
      'appointments',
      new TableIndex({
        columnNames: ['clinic_id', 'created_at'],
      }),
    );

    // Create whatsapp_outbox table
    await queryRunner.createTable(
      new Table({
        name: 'whatsapp_outbox',
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
            isNullable: true,
          },
          {
            name: 'phone_number',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'message_body',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'queued'",
            isNullable: false,
          },
          {
            name: 'idempotency_key',
            type: 'varchar',
            length: '255',
            isNullable: true,
            isUnique: true,
          },
          {
            name: 'retry_count',
            type: 'integer',
            default: 0,
            isNullable: false,
          },
          {
            name: 'max_retries',
            type: 'integer',
            default: 5,
            isNullable: false,
          },
          {
            name: 'last_retry_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'provider_message_id',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'provider_error',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'channel',
            type: 'varchar',
            length: '50',
            default: "'whatsapp'",
            isNullable: false,
          },
          {
            name: 'message_type',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'sent_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
        foreignKeys: [
          {
            columnNames: ['clinic_id'],
            referencedTableName: 'clinics',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['client_id'],
            referencedTableName: 'clients',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          },
        ],
      }),
      true,
    );

    // Create indices for whatsapp_outbox
    await queryRunner.createIndex(
      'whatsapp_outbox',
      new TableIndex({
        columnNames: ['clinic_id', 'status'],
      }),
    );

    await queryRunner.createIndex(
      'whatsapp_outbox',
      new TableIndex({
        columnNames: ['clinic_id', 'created_at'],
      }),
    );

    await queryRunner.createIndex(
      'whatsapp_outbox',
      new TableIndex({
        columnNames: ['idempotency_key'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'whatsapp_outbox',
      new TableIndex({
        columnNames: ['retry_count', 'status'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indices
    await queryRunner.dropIndex('whatsapp_outbox', 'IDX_whatsapp_outbox_retry_count_status');
    await queryRunner.dropIndex('whatsapp_outbox', 'IDX_whatsapp_outbox_idempotency_key');
    await queryRunner.dropIndex('whatsapp_outbox', 'IDX_whatsapp_outbox_clinic_id_created_at');
    await queryRunner.dropIndex('whatsapp_outbox', 'IDX_whatsapp_outbox_clinic_id_status');

    await queryRunner.dropIndex('appointments', 'IDX_appointments_clinic_id_created_at');
    await queryRunner.dropIndex('appointments', 'IDX_appointments_clinic_id_scheduled_at');
    await queryRunner.dropIndex('appointments', 'IDX_appointments_clinic_id_status');

    // Drop tables
    await queryRunner.dropTable('whatsapp_outbox', true);
    await queryRunner.dropTable('appointments', true);
  }
}
