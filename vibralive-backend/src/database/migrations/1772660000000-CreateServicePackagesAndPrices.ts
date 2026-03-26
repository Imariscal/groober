import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateServicePackagesAndPrices1772660000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE service_packages (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        clinic_id uuid NOT NULL,
        name varchar NOT NULL,
        description text,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now()
      );
      CREATE INDEX idx_service_packages_clinic_id_is_active ON service_packages (clinic_id, is_active);

      CREATE TABLE service_package_items (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        clinic_id uuid NOT NULL,
        package_id uuid NOT NULL REFERENCES service_packages(id) ON DELETE CASCADE,
        service_id uuid NOT NULL,
        quantity integer NOT NULL DEFAULT 1,
        sort_order integer NOT NULL DEFAULT 0,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now()
      );
      CREATE INDEX idx_service_package_items_clinic_id_package_id ON service_package_items (clinic_id, package_id);
      ALTER TABLE service_package_items ADD CONSTRAINT uq_service_package_item UNIQUE (clinic_id, package_id, service_id);

      CREATE TABLE service_package_prices (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        clinic_id uuid NOT NULL,
        price_list_id uuid NOT NULL,
        package_id uuid NOT NULL REFERENCES service_packages(id) ON DELETE CASCADE,
        price numeric(10,2) NOT NULL,
        currency varchar NOT NULL DEFAULT 'MXN',
        is_available boolean NOT NULL DEFAULT true,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now()
      );
      CREATE INDEX idx_service_package_prices_clinic_id_price_list_id_package_id ON service_package_prices (clinic_id, price_list_id, package_id);
      ALTER TABLE service_package_prices ADD CONSTRAINT uq_service_package_price UNIQUE (clinic_id, price_list_id, package_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS service_package_prices;
      DROP TABLE IF EXISTS service_package_items;
      DROP TABLE IF EXISTS service_packages;
    `);
  }
}
