import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddServiceIdToSaleItems1740750000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add serviceId column to allow storing service-based sales
    await queryRunner.addColumn(
      'sale_items',
      new TableColumn({
        name: 'service_id',
        type: 'uuid',
        isNullable: true,
        comment: 'Reference to Service when item is from an appointment (vs retail product)',
      }),
    );

    // Add foreign key to services table
    await queryRunner.query(`
      ALTER TABLE sale_items
      ADD CONSTRAINT fk_sale_items_service_id
      FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL
    `);

    // Add index for queries
    await queryRunner.query(`
      CREATE INDEX idx_sale_items_service_id ON sale_items(service_id)
    `);

    // Make product_id nullable to allow service-only items
    await queryRunner.query(`
      ALTER TABLE sale_items
      ALTER COLUMN product_id DROP NOT NULL
    `);

    // Add check constraint: must have either product_id OR service_id
    await queryRunner.query(`
      ALTER TABLE sale_items
      ADD CONSTRAINT check_item_has_product_or_service
      CHECK (product_id IS NOT NULL OR service_id IS NOT NULL)
    `);

    // Add appointment_item_id to track source
    await queryRunner.addColumn(
      'sale_items',
      new TableColumn({
        name: 'appointment_item_id',
        type: 'uuid',
        isNullable: true,
        comment: 'Reference to original AppointmentItem when converting appointment to sale',
      }),
    );

    await queryRunner.query(`
      CREATE INDEX idx_sale_items_appointment_item_id ON sale_items(appointment_item_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop constraints in reverse order
    await queryRunner.query(`ALTER TABLE sale_items DROP CONSTRAINT check_item_has_product_or_service`);
    await queryRunner.query(`DROP INDEX idx_sale_items_appointment_item_id`);
    await queryRunner.dropColumn('sale_items', 'appointment_item_id');
    await queryRunner.query(`ALTER TABLE sale_items DROP CONSTRAINT fk_sale_items_service_id`);
    await queryRunner.query(`DROP INDEX idx_sale_items_service_id`);
    await queryRunner.dropColumn('sale_items', 'service_id');
    await queryRunner.query(`ALTER TABLE sale_items ALTER COLUMN product_id SET NOT NULL`);
  }
}
