import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateStylistAvailabilityTables1772900000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create stylist_availabilities table
    await queryRunner.query(`
      CREATE TABLE stylist_availabilities (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        stylist_id uuid NOT NULL,
        day_of_week integer NOT NULL,
        start_time time NOT NULL,
        end_time time NOT NULL,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now(),
        CONSTRAINT fk_stylist_availabilities_stylist FOREIGN KEY (stylist_id) REFERENCES stylists(id) ON DELETE CASCADE,
        CONSTRAINT uq_stylist_availability_dayofweek UNIQUE (stylist_id, day_of_week)
      );
      CREATE INDEX idx_stylist_availability_stylist ON stylist_availabilities (stylist_id);
    `);

    // Create stylist_unavailable_periods table
    await queryRunner.query(`
      CREATE TABLE stylist_unavailable_periods (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        stylist_id uuid NOT NULL,
        reason varchar(50) NOT NULL DEFAULT 'OTHER',
        start_date date NOT NULL,
        end_date date NOT NULL,
        is_all_day boolean NOT NULL DEFAULT true,
        start_time time,
        end_time time,
        notes text,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now(),
        CONSTRAINT fk_stylist_unavailable_periods_stylist FOREIGN KEY (stylist_id) REFERENCES stylists(id) ON DELETE CASCADE
      );
      CREATE INDEX idx_stylist_unavailable_stylist ON stylist_unavailable_periods (stylist_id);
      CREATE INDEX idx_stylist_unavailable_dates ON stylist_unavailable_periods (stylist_id, start_date, end_date);
    `);

    // Create stylist_capacities table
    await queryRunner.query(`
      CREATE TABLE stylist_capacities (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        stylist_id uuid NOT NULL,
        date date NOT NULL,
        max_appointments integer NOT NULL,
        notes text,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now(),
        CONSTRAINT fk_stylist_capacities_stylist FOREIGN KEY (stylist_id) REFERENCES stylists(id) ON DELETE CASCADE,
        CONSTRAINT uq_stylist_capacity_date UNIQUE (stylist_id, date)
      );
      CREATE INDEX idx_stylist_capacity_stylist ON stylist_capacities (stylist_id);
      CREATE INDEX idx_stylist_capacity_date ON stylist_capacities (stylist_id, date);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS stylist_capacities`);
    await queryRunner.query(
      `DROP TABLE IF EXISTS stylist_unavailable_periods`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS stylist_availabilities`);
  }
}
