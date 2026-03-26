import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPriceToServices1772654700000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'services',
      new TableColumn({
        name: 'price',
        type: 'numeric',
        precision: 10,
        scale: 2,
        isNullable: true,
        default: null,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('services', 'price');
  }
}
