
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateVeterinarianAvailabilityTables1783100000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create veterinarian_availabilities table
    await queryRunner.query(
      `CREATE TABLE veterinarian_availabilities (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        veterinarian_id uuid NOT NULL,
        day_of_week integer NOT NULL,
        start_time time NOT NULL,
        end_time time NOT NULL,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now(),
        CONSTRAINT fk_veterinarian_availabilities_veterinarian FOREIGN KEY (veterinarian_id) REFERENCES veterinarians(id) ON DELETE CASCADE,
        CONSTRAINT uq_veterinarian_availability_dayofweek UNIQUE (veterinarian_id, day_of_week)
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_veterinarian_availability_veterinarian ON veterinarian_availabilities (veterinarian_id)`,
    );

    // Create veterinarian_unavailable_periods table
    await queryRunner.query(
      `CREATE TABLE veterinarian_unavailable_periods (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        veterinarian_id uuid NOT NULL,
        reason varchar(50) NOT NULL DEFAULT 'OTHER',
        start_date date NOT NULL,
        end_date date NOT NULL,
        is_all_day boolean NOT NULL DEFAULT true,
        start_time time,
        end_time time,
        notes text,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now(),
        CONSTRAINT fk_veterinarian_unavailable_periods_veterinarian FOREIGN KEY (veterinarian_id) REFERENCES veterinarians(id) ON DELETE CASCADE
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_veterinarian_unavailable_veterinarian ON veterinarian_unavailable_periods (veterinarian_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_veterinarian_unavailable_dates ON veterinarian_unavailable_periods (veterinarian_id, start_date, end_date)`,
    );

    // Create veterinarian_capacities table
    await queryRunner.query(
      `CREATE TABLE veterinarian_capacities (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        veterinarian_id uuid NOT NULL,
        date date NOT NULL,
        max_appointments integer NOT NULL,
        notes text,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now(),
        CONSTRAINT fk_veterinarian_capacities_veterinarian FOREIGN KEY (veterinarian_id) REFERENCES veterinarians(id) ON DELETE CASCADE,
        CONSTRAINT uq_veterinarian_capacity_date UNIQUE (veterinarian_id, date)
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_veterinarian_capacity_veterinarian ON veterinarian_capacities (veterinarian_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_veterinarian_capacity_date ON veterinarian_capacities (veterinarian_id, date)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS veterinarian_capacities`);
    await queryRunner.query(
      `DROP TABLE IF EXISTS veterinarian_unavailable_periods`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS veterinarian_availabilities`);
  }
}
