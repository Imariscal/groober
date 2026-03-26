import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateClinicCalendarExceptionsTable1772700000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE clinic_calendar_exception_type AS ENUM ('CLOSED', 'SPECIAL_HOURS');
      
      CREATE TABLE clinic_calendar_exceptions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        clinic_id uuid NOT NULL,
        date date NOT NULL,
        type clinic_calendar_exception_type NOT NULL,
        start_time time NULL,
        end_time time NULL,
        reason varchar(200) NULL,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now(),
        CONSTRAINT fk_clinic_calendar_exceptions_clinic_id 
          FOREIGN KEY (clinic_id) 
          REFERENCES clinics(id) ON DELETE CASCADE,
        CONSTRAINT uq_clinic_calendar_exceptions_clinic_id_date 
          UNIQUE (clinic_id, date)
      );
      
      CREATE INDEX idx_clinic_calendar_exceptions_clinic_id_date 
        ON clinic_calendar_exceptions (clinic_id, date);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS clinic_calendar_exceptions;
      DROP TYPE IF EXISTS clinic_calendar_exception_type;
    `);
  }
}
