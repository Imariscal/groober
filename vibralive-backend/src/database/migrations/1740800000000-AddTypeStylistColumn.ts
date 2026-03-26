import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddTypeStylistColumn1740800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('stylists');
    
    if (table && !table.findColumnByName('type')) {
      await queryRunner.addColumn(
        'stylists',
        new TableColumn({
          name: 'type',
          type: 'varchar',
          length: '20',
          enum: ['CLINIC', 'HOME'],
          default: "'CLINIC'",
          isNullable: false,
          comment: 'CLINIC = Estilista de clínica, HOME = Estilista de domicilio/ruta',
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('stylists');
    
    if (table && table.findColumnByName('type')) {
      await queryRunner.dropColumn('stylists', 'type');
    }
  }
}
