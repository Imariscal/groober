import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateServicesAndPrices1740562000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE services (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        clinic_id uuid NOT NULL,
        name varchar NOT NULL,
        category varchar NOT NULL,
        default_duration_minutes integer NOT NULL DEFAULT 30,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now()
      );
      CREATE INDEX idx_services_clinic_id_is_active ON services (clinic_id, is_active);

      CREATE TABLE price_lists (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        clinic_id uuid NOT NULL,
        name varchar NOT NULL,
        is_default boolean NOT NULL DEFAULT true,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now()
      );
      CREATE INDEX idx_price_lists_clinic_id_is_default ON price_lists (clinic_id, is_default);

      CREATE TABLE service_prices (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        clinic_id uuid NOT NULL,
        price_list_id uuid NOT NULL,
        service_id uuid NOT NULL,
        price numeric NOT NULL,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now()
      );
      CREATE INDEX idx_service_prices_clinic_id_price_list_id_service_id ON service_prices (clinic_id, price_list_id, service_id);
      ALTER TABLE service_prices ADD CONSTRAINT uq_service_price UNIQUE (clinic_id, price_list_id, service_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS service_prices;
      DROP TABLE IF EXISTS price_lists;
      DROP TABLE IF EXISTS services;
    `);
  }
}
