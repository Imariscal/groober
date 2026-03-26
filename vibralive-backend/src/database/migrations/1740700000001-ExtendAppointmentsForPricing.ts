import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class ExtendAppointmentsForPricing1740700000001
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('appointments');

    if (table) {
      // Agregar total_amount
      const hasTotal = table.findColumnByName('total_amount');
      if (!hasTotal) {
        await queryRunner.addColumn(
          'appointments',
          new TableColumn({
            name: 'total_amount',
            type: 'numeric',
            precision: 12,
            scale: 2,
            isNullable: true,
            comment: 'Total amount for the appointment, calculated from appointment_items',
          })
        );
      }

      // Agregar price_lock_at
      const hasPriceLock = table.findColumnByName('price_lock_at');
      if (!hasPriceLock) {
        await queryRunner.addColumn(
          'appointments',
          new TableColumn({
            name: 'price_lock_at',
            type: 'timestamp',
            isNullable: true,
            comment: 'Timestamp when prices were locked (frozen) for this appointment',
          })
        );
      }

      // Agregar price_list_id
      const hasPriceListId = table.findColumnByName('price_list_id');
      if (!hasPriceListId) {
        await queryRunner.addColumn(
          'appointments',
          new TableColumn({
            name: 'price_list_id',
            type: 'uuid',
            isNullable: true,
            comment: 'Price list used for this appointment',
          })
        );
      }

      // Crear foreign key para price_list_id después de agregar la columna
      if (!hasTotal) {
        const hasForeignKey = table.foreignKeys.some(
          fk => fk.columnNames.includes('price_list_id')
        );

        if (!hasForeignKey) {
          await queryRunner.query(
            `ALTER TABLE appointments 
             ADD CONSTRAINT fk_appointments_price_list 
             FOREIGN KEY (price_list_id) REFERENCES price_lists(id)`
          );
        }
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('appointments');

    if (table) {
      // Remover foreign key si existe
      const foreignKey = table.foreignKeys.find(
        fk => fk.columnNames.includes('price_list_id')
      );
      if (foreignKey) {
        await queryRunner.dropForeignKey('appointments', foreignKey);
      }

      // Remover columnas
      const hasTotal = table.findColumnByName('total_amount');
      if (hasTotal) {
        await queryRunner.dropColumn('appointments', 'total_amount');
      }

      const hasPriceLock = table.findColumnByName('price_lock_at');
      if (hasPriceLock) {
        await queryRunner.dropColumn('appointments', 'price_lock_at');
      }

      const hasPriceListId = table.findColumnByName('price_list_id');
      if (hasPriceListId) {
        await queryRunner.dropColumn('appointments', 'price_list_id');
      }
    }
  }
}
