import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey, TableIndex } from 'typeorm';

export class AddPriceListIdToServiceSizePrice1741000000000 implements MigrationInterface {
  name = 'AddPriceListIdToServiceSizePrice1741000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add the price_list_id column (nullable to maintain backward compatibility)
    await queryRunner.addColumn(
      'service_size_prices',
      new TableColumn({
        name: 'price_list_id',
        type: 'uuid',
        isNullable: true,
        comment: 'Optional: links price to specific price list. If NULL, price is global for service.',
      }),
    );

    // Add foreign key constraint to price_lists
    await queryRunner.createForeignKey(
      'service_size_prices',
      new TableForeignKey({
        columnNames: ['price_list_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'price_lists',
        onDelete: 'CASCADE',
        name: 'FK_service_size_prices_price_list_id',
      }),
    );

    // Add composite unique index for (clinic_id, price_list_id, service_id, pet_size)
    // This allows NULL price_list_id to exist multiple times (global prices)
    await queryRunner.createIndex(
      'service_size_prices',
      new TableIndex({
        name: 'IDX_service_size_prices_price_list_composite',
        columnNames: ['clinic_id', 'price_list_id', 'service_id', 'pet_size'],
        isUnique: false, // Can't be unique with NULLs
      }),
    );

    // Remove or update the old unique index if it exists
    // This depends on the database state - the migration will try to handle it gracefully
    try {
      await queryRunner.dropIndex('service_size_prices', 'IDX_clinic_id_service_id_pet_size');
    } catch (error) {
      // Index might not exist, continue
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key
    await queryRunner.dropForeignKey('service_size_prices', 'FK_service_size_prices_price_list_id');

    // Drop the new index
    try {
      await queryRunner.dropIndex('service_size_prices', 'IDX_service_size_prices_price_list_composite');
    } catch (error) {
      // Index might not exist
    }

    // Remove the column
    await queryRunner.dropColumn('service_size_prices', 'price_list_id');

    // Restore old index if needed
    await queryRunner.createIndex(
      'service_size_prices',
      new TableIndex({
        name: 'IDX_clinic_id_service_id_pet_size',
        columnNames: ['clinic_id', 'service_id', 'pet_size'],
        isUnique: true,
      }),
    );
  }
}
