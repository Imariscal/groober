import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddDurationMinutesToServiceSizePrice1783300000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'service_size_prices',
      new TableColumn({
        name: 'duration_minutes',
        type: 'integer',
        isNullable: true,
        comment:
          'Duración específica en minutos para este tamaño de mascota. Si no se especifica, se usa el defaultDurationMinutes del servicio.',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('service_size_prices', 'duration_minutes');
  }
}
