import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm';

export class CreateMedicalVisitsTables1783200000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create medical_visits table
    await queryRunner.query(
      `CREATE TABLE medical_visits (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        clinic_id uuid NOT NULL,
        appointment_id uuid NOT NULL,
        pet_id uuid NOT NULL,
        veterinarian_id uuid,
        visit_date timestamp with time zone NOT NULL,
        visit_type varchar(50) NOT NULL DEFAULT 'CHECKUP',
        reason_for_visit text,
        chief_complaint text,
        weight numeric(5,2),
        temperature numeric(5,2),
        heart_rate integer,
        respiratory_rate integer,
        blood_pressure varchar(20),
        body_condition_score integer,
        coat_condition text,
        general_notes text,
        preliminary_diagnosis text,
        final_diagnosis text,
        treatment_plan text,
        prognosis text,
        status varchar(50) NOT NULL DEFAULT 'DRAFT',
        signed_at timestamp with time zone,
        signed_by_veterinarian_id uuid,
        follow_up_required boolean NOT NULL DEFAULT false,
        follow_up_date timestamp with time zone,
        follow_up_appointment_id uuid,
        visit_notes text,
        created_by uuid NOT NULL,
        modified_by uuid NOT NULL,
        created_at timestamp with time zone NOT NULL DEFAULT now(),
        updated_at timestamp with time zone NOT NULL DEFAULT now(),
        CONSTRAINT fk_medical_visits_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
        CONSTRAINT fk_medical_visits_appointment FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
        CONSTRAINT fk_medical_visits_pet FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE,
        CONSTRAINT fk_medical_visits_veterinarian FOREIGN KEY (veterinarian_id) REFERENCES users(id),
        CONSTRAINT fk_medical_visits_created_by FOREIGN KEY (created_by) REFERENCES users(id),
        CONSTRAINT fk_medical_visits_modified_by FOREIGN KEY (modified_by) REFERENCES users(id)
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_medical_visits_clinic_pet_date ON medical_visits (clinic_id, pet_id, visit_date)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_medical_visits_clinic_appointment ON medical_visits (clinic_id, appointment_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_medical_visits_clinic_status ON medical_visits (clinic_id, status)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_medical_visits_clinic_vet ON medical_visits (clinic_id, veterinarian_id)`,
    );

    // 2. Create medical_visit_exams table
    await queryRunner.query(
      `CREATE TABLE medical_visit_exams (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        medical_visit_id uuid NOT NULL,
        exam_type varchar(30) NOT NULL,
        exam_name varchar(100) NOT NULL,
        findings text,
        is_normal boolean,
        performed_date timestamp with time zone,
        performed_by uuid,
        notes text,
        attachments_count integer NOT NULL DEFAULT 0,
        created_at timestamp with time zone NOT NULL DEFAULT now(),
        updated_at timestamp with time zone NOT NULL DEFAULT now(),
        CONSTRAINT fk_exam_medical_visit FOREIGN KEY (medical_visit_id) REFERENCES medical_visits(id) ON DELETE CASCADE,
        CONSTRAINT fk_exam_performed_by FOREIGN KEY (performed_by) REFERENCES users(id)
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_exam_medical_visit_type ON medical_visit_exams (medical_visit_id, exam_type)`,
    );

    // 3. Create medical_visit_diagnoses table
    await queryRunner.query(
      `CREATE TABLE medical_visit_diagnoses (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        medical_visit_id uuid NOT NULL,
        diagnosis_code varchar(50),
        diagnosis_name varchar(200) NOT NULL,
        severity varchar(20) NOT NULL DEFAULT 'MODERATE',
        status varchar(30) NOT NULL DEFAULT 'PRELIMINARY',
        notes text,
        created_at timestamp with time zone NOT NULL DEFAULT now(),
        updated_at timestamp with time zone NOT NULL DEFAULT now(),
        CONSTRAINT fk_diagnosis_medical_visit FOREIGN KEY (medical_visit_id) REFERENCES medical_visits(id) ON DELETE CASCADE
      )`,
    );

    // 4. Create prescriptions table
    await queryRunner.query(
      `CREATE TABLE prescriptions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        clinic_id uuid NOT NULL,
        medical_visit_id uuid NOT NULL,
        pet_id uuid NOT NULL,
        prescribed_by_veterinarian_id uuid NOT NULL,
        medication_id varchar(100),
        medication_name varchar(200) NOT NULL,
        dosage varchar(50) NOT NULL,
        dosage_unit varchar(20) NOT NULL,
        frequency varchar(100) NOT NULL,
        duration_days integer NOT NULL,
        quantity integer NOT NULL,
        route varchar(20) NOT NULL,
        instructions text,
        refills_allowed integer NOT NULL DEFAULT 0,
        prescribed_date timestamp with time zone NOT NULL,
        start_date date NOT NULL,
        end_date date NOT NULL,
        status varchar(30) NOT NULL DEFAULT 'ACTIVE',
        created_at timestamp with time zone NOT NULL DEFAULT now(),
        updated_at timestamp with time zone NOT NULL DEFAULT now(),
        CONSTRAINT fk_prescription_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
        CONSTRAINT fk_prescription_medical_visit FOREIGN KEY (medical_visit_id) REFERENCES medical_visits(id) ON DELETE CASCADE,
        CONSTRAINT fk_prescription_pet FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE,
        CONSTRAINT fk_prescription_veterinarian FOREIGN KEY (prescribed_by_veterinarian_id) REFERENCES users(id)
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_prescription_clinic_pet_status ON prescriptions (clinic_id, pet_id, status)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_prescription_clinic_visit ON prescriptions (clinic_id, medical_visit_id)`,
    );

    // 5. Create vaccinations table
    await queryRunner.query(
      `CREATE TABLE vaccinations (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        clinic_id uuid NOT NULL,
        pet_id uuid NOT NULL,
        vaccine_type varchar(50) NOT NULL,
        vaccine_name varchar(100) NOT NULL,
        vaccine_batch varchar(100),
        administered_date timestamp with time zone NOT NULL,
        veterinarian_id uuid NOT NULL,
        next_due_date date,
        notes text,
        created_at timestamp with time zone NOT NULL DEFAULT now(),
        updated_at timestamp with time zone NOT NULL DEFAULT now(),
        CONSTRAINT fk_vaccination_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
        CONSTRAINT fk_vaccination_pet FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE,
        CONSTRAINT fk_vaccination_veterinarian FOREIGN KEY (veterinarian_id) REFERENCES users(id)
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_vaccination_clinic_pet_date ON vaccinations (clinic_id, pet_id, administered_date)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_vaccination_clinic_pet_due ON vaccinations (clinic_id, pet_id, next_due_date)`,
    );

    // 6. Create medication_allergies table
    await queryRunner.query(
      `CREATE TABLE medication_allergies (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        clinic_id uuid NOT NULL,
        pet_id uuid NOT NULL,
        medication_id varchar(100),
        medication_name varchar(200) NOT NULL,
        severity varchar(20) NOT NULL,
        reaction text NOT NULL,
        documented_date timestamp with time zone NOT NULL,
        documented_by uuid NOT NULL,
        notes text,
        created_at timestamp with time zone NOT NULL DEFAULT now(),
        updated_at timestamp with time zone NOT NULL DEFAULT now(),
        CONSTRAINT fk_allergy_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
        CONSTRAINT fk_allergy_pet FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE,
        CONSTRAINT fk_allergy_documented_by FOREIGN KEY (documented_by) REFERENCES users(id)
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_allergy_clinic_pet ON medication_allergies (clinic_id, pet_id)`,
    );

    // 7. Create diagnostic_orders table
    await queryRunner.query(
      `CREATE TABLE diagnostic_orders (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        clinic_id uuid NOT NULL,
        medical_visit_id uuid NOT NULL,
        pet_id uuid NOT NULL,
        ordered_by_veterinarian_id uuid NOT NULL,
        test_type varchar(30) NOT NULL,
        test_name varchar(100) NOT NULL,
        reason text NOT NULL,
        order_date timestamp with time zone NOT NULL,
        due_date date NOT NULL,
        specimen_collected_date timestamp with time zone,
        status varchar(30) NOT NULL DEFAULT 'ORDERED',
        lab_name varchar(100),
        lab_reference_id varchar(100),
        created_at timestamp with time zone NOT NULL DEFAULT now(),
        updated_at timestamp with time zone NOT NULL DEFAULT now(),
        CONSTRAINT fk_order_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
        CONSTRAINT fk_order_medical_visit FOREIGN KEY (medical_visit_id) REFERENCES medical_visits(id) ON DELETE CASCADE,
        CONSTRAINT fk_order_pet FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE,
        CONSTRAINT fk_order_veterinarian FOREIGN KEY (ordered_by_veterinarian_id) REFERENCES users(id)
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_order_clinic_pet_status ON diagnostic_orders (clinic_id, pet_id, status)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_order_clinic_visit ON diagnostic_orders (clinic_id, medical_visit_id)`,
    );

    // 8. Create diagnostic_test_results table
    await queryRunner.query(
      `CREATE TABLE diagnostic_test_results (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        diagnostic_order_id uuid NOT NULL,
        test_result_name varchar(200) NOT NULL,
        result_value varchar(100),
        result_unit varchar(50),
        reference_range_min varchar(50),
        reference_range_max varchar(50),
        is_normal boolean,
        notes text,
        completed_date timestamp with time zone,
        created_at timestamp with time zone NOT NULL DEFAULT now(),
        updated_at timestamp with time zone NOT NULL DEFAULT now(),
        CONSTRAINT fk_result_order FOREIGN KEY (diagnostic_order_id) REFERENCES diagnostic_orders(id) ON DELETE CASCADE
      )`,
    );

    // 9. Create medical_procedures table
    await queryRunner.query(
      `CREATE TABLE medical_procedures (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        clinic_id uuid NOT NULL,
        medical_visit_id uuid NOT NULL,
        pet_id uuid NOT NULL,
        performed_by_veterinarian_id uuid NOT NULL,
        procedure_type varchar(100) NOT NULL,
        procedure_name varchar(200) NOT NULL,
        procedure_date timestamp with time zone NOT NULL,
        duration_minutes integer,
        anesthesia_type varchar(100),
        complications text,
        notes text,
        created_at timestamp with time zone NOT NULL DEFAULT now(),
        updated_at timestamp with time zone NOT NULL DEFAULT now(),
        CONSTRAINT fk_procedure_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
        CONSTRAINT fk_procedure_medical_visit FOREIGN KEY (medical_visit_id) REFERENCES medical_visits(id) ON DELETE CASCADE,
        CONSTRAINT fk_procedure_pet FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE,
        CONSTRAINT fk_procedure_veterinarian FOREIGN KEY (performed_by_veterinarian_id) REFERENCES users(id)
      )`,
    );

    // 10. Create follow_up_notes table
    await queryRunner.query(
      `CREATE TABLE follow_up_notes (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        clinic_id uuid NOT NULL,
        medical_visit_id uuid NOT NULL,
        pet_id uuid NOT NULL,
        note_date timestamp with time zone NOT NULL,
        written_by uuid NOT NULL,
        note_content text NOT NULL,
        status_update text,
        created_at timestamp with time zone NOT NULL DEFAULT now(),
        updated_at timestamp with time zone NOT NULL DEFAULT now(),
        CONSTRAINT fk_followup_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
        CONSTRAINT fk_followup_medical_visit FOREIGN KEY (medical_visit_id) REFERENCES medical_visits(id) ON DELETE CASCADE,
        CONSTRAINT fk_followup_pet FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE,
        CONSTRAINT fk_followup_written_by FOREIGN KEY (written_by) REFERENCES users(id)
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_followup_clinic_pet_date ON follow_up_notes (clinic_id, pet_id, note_date)`,
    );

    // 11. Create medical_attachments table
    await queryRunner.query(
      `CREATE TABLE medical_attachments (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        clinic_id uuid NOT NULL,
        medical_visit_id uuid NOT NULL,
        pet_id uuid NOT NULL,
        document_type varchar(50) NOT NULL,
        file_name varchar(255) NOT NULL,
        file_size integer NOT NULL,
        file_type varchar(50) NOT NULL,
        storage_path varchar(500) NOT NULL,
        uploaded_by uuid NOT NULL,
        upload_date timestamp with time zone NOT NULL,
        is_confidential boolean NOT NULL DEFAULT false,
        created_at timestamp with time zone NOT NULL DEFAULT now(),
        updated_at timestamp with time zone NOT NULL DEFAULT now(),
        CONSTRAINT fk_attachment_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
        CONSTRAINT fk_attachment_medical_visit FOREIGN KEY (medical_visit_id) REFERENCES medical_visits(id) ON DELETE CASCADE,
        CONSTRAINT fk_attachment_pet FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE,
        CONSTRAINT fk_attachment_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users(id)
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_attachment_clinic_visit ON medical_attachments (clinic_id, medical_visit_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_attachment_clinic_pet ON medical_attachments (clinic_id, pet_id)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS medical_attachments`);
    await queryRunner.query(`DROP TABLE IF EXISTS follow_up_notes`);
    await queryRunner.query(`DROP TABLE IF EXISTS medical_procedures`);
    await queryRunner.query(`DROP TABLE IF EXISTS diagnostic_test_results`);
    await queryRunner.query(`DROP TABLE IF EXISTS diagnostic_orders`);
    await queryRunner.query(`DROP TABLE IF EXISTS medication_allergies`);
    await queryRunner.query(`DROP TABLE IF EXISTS vaccinations`);
    await queryRunner.query(`DROP TABLE IF EXISTS prescriptions`);
    await queryRunner.query(`DROP TABLE IF EXISTS medical_visit_diagnoses`);
    await queryRunner.query(`DROP TABLE IF EXISTS medical_visit_exams`);
    await queryRunner.query(`DROP TABLE IF EXISTS medical_visits`);
  }
}
