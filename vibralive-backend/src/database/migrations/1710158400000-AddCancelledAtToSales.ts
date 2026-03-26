import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddCancelledAtToSales1710158400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'sales',
      new TableColumn({
        name: 'cancelled_at',
        type: 'timestamp with time zone',
        isNullable: true,
        default: null,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('sales', 'cancelled_at');
  }
}
