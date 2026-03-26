import { MigrationInterface, QueryRunner, TableColumn, Table, Index } from 'typeorm';

export class EvolutionClientProfile1741019400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // PARTE A: Agregar nuevas columnas a clients
    await queryRunner.addColumn(
      'clients',
      new TableColumn({
        name: 'whatsapp_number',
        type: 'varchar',
        length: '20',
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      'clients',
      new TableColumn({
        name: 'phone_secondary',
        type: 'varchar',
        length: '20',
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      'clients',
      new TableColumn({
        name: 'preferred_contact_method',
        type: 'varchar',
        length: '20',
        default: "'WHATSAPP'",
      })
    );

    await queryRunner.addColumn(
      'clients',
      new TableColumn({
        name: 'preferred_contact_time_start',
        type: 'time',
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      'clients',
      new TableColumn({
        name: 'preferred_contact_time_end',
        type: 'time',
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      'clients',
      new TableColumn({
        name: 'housing_type',
        type: 'varchar',
        length: '20',
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      'clients',
      new TableColumn({
        name: 'access_notes',
        type: 'text',
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      'clients',
      new TableColumn({
        name: 'service_notes',
        type: 'text',
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      'clients',
      new TableColumn({
        name: 'do_not_contact',
        type: 'boolean',
        default: false,
      })
    );

    await queryRunner.addColumn(
      'clients',
      new TableColumn({
        name: 'do_not_contact_reason',
        type: 'text',
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      'clients',
      new TableColumn({
        name: 'status',
        type: 'varchar',
        length: '20',
        default: "'ACTIVE'",
      })
    );

    // Agregar constraints
    await queryRunner.query(
      `ALTER TABLE clients ADD CONSTRAINT chk_preferred_contact_method 
       CHECK (preferred_contact_method IN ('WHATSAPP', 'PHONE', 'EMAIL', 'SMS'))`
    );

    await queryRunner.query(
      `ALTER TABLE clients ADD CONSTRAINT chk_housing_type 
       CHECK (housing_type IS NULL OR housing_type IN ('HOUSE', 'APARTMENT', 'COMMERCIAL', 'OTHER'))`
    );

    await queryRunner.query(
      `ALTER TABLE clients ADD CONSTRAINT chk_client_status 
       CHECK (status IN ('ACTIVE', 'INACTIVE', 'ARCHIVED', 'BLACKLISTED'))`
    );

    // PARTE B: Crear tabla client_tags
    await queryRunner.createTable(
      new Table({
        name: 'client_tags',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'client_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'clinic_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'tag',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'NOW()',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['client_id'],
            referencedTableName: 'clients',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['clinic_id'],
            referencedTableName: 'clinics',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
        uniques: [
          {
            columnNames: ['client_id', 'tag'],
            name: 'uk_client_tags_unique',
          },
        ],
      })
    );

    // Crear índices
    await queryRunner.query(
      `CREATE INDEX idx_client_tags_clinic_tag ON client_tags(clinic_id, tag)`
    );

    await queryRunner.query(
      `CREATE INDEX idx_client_tags_client_id ON client_tags(client_id)`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop table client_tags
    await queryRunner.dropTable('client_tags');

    // Drop constraints
    await queryRunner.query(
      `ALTER TABLE clients DROP CONSTRAINT IF EXISTS chk_preferred_contact_method`
    );
    await queryRunner.query(
      `ALTER TABLE clients DROP CONSTRAINT IF EXISTS chk_housing_type`
    );
    await queryRunner.query(
      `ALTER TABLE clients DROP CONSTRAINT IF EXISTS chk_client_status`
    );

    // Drop columns
    await queryRunner.dropColumn('clients', 'whatsapp_number');
    await queryRunner.dropColumn('clients', 'phone_secondary');
    await queryRunner.dropColumn('clients', 'preferred_contact_method');
    await queryRunner.dropColumn('clients', 'preferred_contact_time_start');
    await queryRunner.dropColumn('clients', 'preferred_contact_time_end');
    await queryRunner.dropColumn('clients', 'housing_type');
    await queryRunner.dropColumn('clients', 'access_notes');
    await queryRunner.dropColumn('clients', 'service_notes');
    await queryRunner.dropColumn('clients', 'do_not_contact');
    await queryRunner.dropColumn('clients', 'do_not_contact_reason');
    await queryRunner.dropColumn('clients', 'status');
  }
}
