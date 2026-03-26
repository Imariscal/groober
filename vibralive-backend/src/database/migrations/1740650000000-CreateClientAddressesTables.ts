import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateClientAddressesTables1740650000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create client_addresses table
    await queryRunner.createTable(
      new Table({
        name: 'client_addresses',
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
            name: 'label',
            type: 'varchar',
            length: '100',
            isNullable: true,
            comment: 'e.g., "Casa", "Trabajo", "Casa Papá"',
          },
          {
            name: 'street',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'number_ext',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'number_int',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'neighborhood',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'city',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'state',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'zip_code',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'references',
            type: 'text',
            isNullable: true,
            comment: 'e.g., "Puerta azul junto al supermercado"',
          },
          {
            name: 'lat',
            type: 'decimal',
            precision: 10,
            scale: 8,
            isNullable: true,
          },
          {
            name: 'lng',
            type: 'decimal',
            precision: 11,
            scale: 8,
            isNullable: true,
          },
          {
            name: 'geocode_status',
            type: 'varchar',
            length: '20',
            default: "'PENDING'",
            comment: 'PENDING|OK|FAILED',
          },
          {
            name: 'is_default',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
        foreignKeys: [
          new TableForeignKey({
            columnNames: ['clinic_id'],
            referencedTableName: 'clinics',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
          new TableForeignKey({
            columnNames: ['client_id'],
            referencedTableName: 'clients',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
        ],
      }),
    );

    // Create partial unique index para garantizar máximo 1 default por (clinic_id, client_id)
    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_client_addresses_default_unique
      ON client_addresses(clinic_id, client_id)
      WHERE is_default = true;
    `);

    // Create regular indexes para queries frecuentes
    await queryRunner.createIndex(
      'client_addresses',
      new TableIndex({
        name: 'idx_client_addresses_clinic_client',
        columnNames: ['clinic_id', 'client_id'],
      }),
    );

    await queryRunner.createIndex(
      'client_addresses',
      new TableIndex({
        name: 'idx_client_addresses_geocode_status',
        columnNames: ['geocode_status'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('client_addresses', true);
  }
}
