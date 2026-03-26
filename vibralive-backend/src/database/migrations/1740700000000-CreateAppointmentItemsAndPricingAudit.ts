import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateAppointmentItemsAndPricingAudit1740700000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ========== CREATE appointment_items ==========
    const appointmentItemsExists = await queryRunner.hasTable('appointment_items');
    if (!appointmentItemsExists) {
      await queryRunner.createTable(
        new Table({
          name: 'appointment_items',
          columns: [
            {
              name: 'id',
              type: 'uuid',
              isPrimary: true,
              generationStrategy: 'uuid',
              default: 'gen_random_uuid()',
            },
            {
              name: 'clinic_id',
              type: 'uuid',
              isNullable: false,
            },
            {
              name: 'appointment_id',
              type: 'uuid',
              isNullable: false,
            },
            {
              name: 'service_id',
              type: 'uuid',
              isNullable: false,
            },
            {
              name: 'price_at_booking',
              type: 'numeric',
              precision: 10,
              scale: 2,
              isNullable: false,
            },
            {
              name: 'quantity',
              type: 'integer',
              default: '1',
              isNullable: false,
            },
            {
              name: 'subtotal',
              type: 'numeric',
              precision: 12,
              scale: 2,
              isNullable: true,
            },
            {
              name: 'created_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
            },
          ],
          foreignKeys: [
            {
              name: 'fk_appointment_items_clinic',
              columnNames: ['clinic_id'],
              referencedTableName: 'clinics',
              referencedColumnNames: ['id'],
              onDelete: 'CASCADE',
            },
            {
              name: 'fk_appointment_items_appointment',
              columnNames: ['appointment_id'],
              referencedTableName: 'appointments',
              referencedColumnNames: ['id'],
              onDelete: 'CASCADE',
            },
            {
              name: 'fk_appointment_items_service',
              columnNames: ['service_id'],
              referencedTableName: 'services',
              referencedColumnNames: ['id'],
            },
          ],
        })
      );

      await queryRunner.createIndex(
        'appointment_items',
        new TableIndex({
          name: 'idx_appointment_items_appointment',
          columnNames: ['appointment_id'],
        })
      );

      await queryRunner.createIndex(
        'appointment_items',
        new TableIndex({
          name: 'idx_appointment_items_clinic',
          columnNames: ['clinic_id'],
        })
      );

      await queryRunner.createIndex(
        'appointment_items',
        new TableIndex({
          name: 'idx_appointment_items_service',
          columnNames: ['service_id'],
        })
      );
    }

    // ========== CREATE price_list_history ==========
    const priceHistoryExists = await queryRunner.hasTable('price_list_history');
    if (!priceHistoryExists) {
      await queryRunner.createTable(
        new Table({
          name: 'price_list_history',
          columns: [
            {
              name: 'id',
              type: 'uuid',
              isPrimary: true,
              generationStrategy: 'uuid',
              default: 'gen_random_uuid()',
            },
            {
              name: 'clinic_id',
              type: 'uuid',
              isNullable: false,
            },
            {
              name: 'price_list_id',
              type: 'uuid',
              isNullable: false,
            },
            {
              name: 'service_id',
              type: 'uuid',
              isNullable: false,
            },
            {
              name: 'old_price',
              type: 'numeric',
              precision: 10,
              scale: 2,
              isNullable: true,
            },
            {
              name: 'new_price',
              type: 'numeric',
              precision: 10,
              scale: 2,
              isNullable: false,
            },
            {
              name: 'changed_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
            },
            {
              name: 'changed_by_user_id',
              type: 'uuid',
              isNullable: true,
            },
            {
              name: 'reason',
              type: 'varchar',
              length: '255',
              isNullable: true,
            },
          ],
          foreignKeys: [
            {
              name: 'fk_price_list_history_clinic',
              columnNames: ['clinic_id'],
              referencedTableName: 'clinics',
              referencedColumnNames: ['id'],
            },
            {
              name: 'fk_price_list_history_price_list',
              columnNames: ['price_list_id'],
              referencedTableName: 'price_lists',
              referencedColumnNames: ['id'],
            },
            {
              name: 'fk_price_list_history_service',
              columnNames: ['service_id'],
              referencedTableName: 'services',
              referencedColumnNames: ['id'],
            },
          ],
        })
      );

      await queryRunner.createIndex(
        'price_list_history',
        new TableIndex({
          name: 'idx_price_list_history_price_list_id',
          columnNames: ['price_list_id', 'changed_at'],
        })
      );

      await queryRunner.createIndex(
        'price_list_history',
        new TableIndex({
          name: 'idx_price_list_history_clinic_id',
          columnNames: ['clinic_id', 'changed_at'],
        })
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('price_list_history', true);
    await queryRunner.dropTable('appointment_items', true);
  }
}
