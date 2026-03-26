import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateClinicConfigurationTable1772700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE clinic_configuration (
        clinic_id uuid PRIMARY KEY,
        timezone varchar(50) NOT NULL DEFAULT 'America/Monterrey',
        business_hours jsonb NOT NULL DEFAULT '{"week": {"mon": [{"start": "09:00", "end": "19:00"}], "tue": [{"start": "09:00", "end": "19:00"}], "wed": [{"start": "09:00", "end": "19:00"}], "thu": [{"start": "09:00", "end": "19:00"}], "fri": [{"start": "09:00", "end": "19:00"}], "sat": [{"start": "09:00", "end": "14:00"}], "sun": []}}'::jsonb,
        clinic_grooming_capacity integer NOT NULL DEFAULT 1,
        home_grooming_capacity integer NOT NULL DEFAULT 1,
        home_travel_buffer_minutes integer NOT NULL DEFAULT 20,
        prevent_same_pet_same_day boolean NOT NULL DEFAULT true,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now(),
        CONSTRAINT fk_clinic_configuration_clinic_id 
          FOREIGN KEY (clinic_id) 
          REFERENCES clinics(id) ON DELETE CASCADE
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS clinic_configuration`);
  }
}
