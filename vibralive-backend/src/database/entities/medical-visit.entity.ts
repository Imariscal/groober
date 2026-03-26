import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Clinic } from './clinic.entity';
import { Pet } from './pet.entity';
import { User } from './user.entity';
import { Appointment } from './appointment.entity';

@Entity('medical_visits')
@Index(['clinicId', 'petId', 'visitDate'])
@Index(['clinicId', 'appointmentId'])
@Index(['clinicId', 'status'])
@Index(['clinicId', 'veterinarianId'])
export class MedicalVisit {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'clinic_id' })
  clinicId!: string;

  @Column({ type: 'uuid', name: 'appointment_id' })
  appointmentId!: string;

  @Column({ type: 'uuid', name: 'pet_id' })
  petId!: string;

  @Column({ type: 'uuid', name: 'veterinarian_id', nullable: true })
  veterinarianId?: string;

  @Column({
    type: 'timestamp with time zone',
    name: 'visit_date',
  })
  visitDate!: Date;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'CHECKUP',
    name: 'visit_type',
  })
  visitType!:
    | 'CHECKUP'
    | 'VACCINATION'
    | 'SURGERY'
    | 'CONSULTATION'
    | 'FOLLOWUP'
    | 'EMERGENCY';

  @Column({
    type: 'text',
    nullable: true,
    name: 'reason_for_visit',
  })
  reasonForVisit?: string;

  @Column({
    type: 'text',
    nullable: true,
    name: 'chief_complaint',
  })
  chiefComplaint?: string;

  // === EXAM FIELDS ===
  @Column({
    type: 'numeric',
    precision: 5,
    scale: 2,
    nullable: true,
    name: 'weight',
  })
  weight?: number;

  @Column({
    type: 'numeric',
    precision: 5,
    scale: 2,
    nullable: true,
    name: 'temperature',
  })
  temperature?: number;

  @Column({
    type: 'integer',
    nullable: true,
    name: 'heart_rate',
  })
  heartRate?: number;

  @Column({
    type: 'integer',
    nullable: true,
    name: 'respiratory_rate',
  })
  respiratoryRate?: number;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    name: 'blood_pressure',
  })
  bloodPressure?: string;

  @Column({
    type: 'integer',
    nullable: true,
    name: 'body_condition_score',
  })
  bodyConditionScore?: number;

  @Column({
    type: 'text',
    nullable: true,
    name: 'coat_condition',
  })
  coatCondition?: string;

  @Column({
    type: 'text',
    nullable: true,
    name: 'general_notes',
  })
  generalNotes?: string;

  // === DIAGNOSIS & TREATMENT ===
  @Column({
    type: 'text',
    nullable: true,
    name: 'preliminary_diagnosis',
  })
  preliminaryDiagnosis?: string;

  @Column({
    type: 'text',
    nullable: true,
    name: 'final_diagnosis',
  })
  finalDiagnosis?: string;

  @Column({
    type: 'text',
    nullable: true,
    name: 'treatment_plan',
  })
  treatmentPlan?: string;

  @Column({
    type: 'text',
    nullable: true,
    name: 'prognosis',
  })
  prognosis?: string;

  // === WORKFLOW ===
  @Column({
    type: 'varchar',
    length: 50,
    default: 'DRAFT',
  })
  status!: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'SIGNED';

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    name: 'signed_at',
  })
  signedAt?: Date;

  @Column({
    type: 'uuid',
    nullable: true,
    name: 'signed_by_veterinarian_id',
  })
  signedByVeterinarianId?: string;

  @Column({
    type: 'boolean',
    default: false,
    name: 'follow_up_required',
  })
  followUpRequired!: boolean;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    name: 'follow_up_date',
  })
  followUpDate?: Date;

  @Column({
    type: 'uuid',
    nullable: true,
    name: 'follow_up_appointment_id',
  })
  followUpAppointmentId?: string;

  @Column({
    type: 'text',
    nullable: true,
    name: 'visit_notes',
  })
  visitNotes?: string;

  // === AUDIT ===
  @Column({
    type: 'uuid',
    name: 'created_by',
  })
  createdBy!: string;

  @Column({
    type: 'uuid',
    name: 'modified_by',
  })
  modifiedBy!: string;

  @CreateDateColumn({
    type: 'timestamp with time zone',
    name: 'created_at',
  })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'timestamp with time zone',
    name: 'updated_at',
  })
  updatedAt!: Date;

  // === RELATIONSHIPS ===
  @ManyToOne(() => Clinic)
  @JoinColumn({ name: 'clinic_id' })
  clinic!: Clinic;

  @ManyToOne(() => Pet)
  @JoinColumn({ name: 'pet_id' })
  pet!: Pet;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'veterinarian_id' })
  veterinarian?: User;

  @ManyToOne(() => Appointment)
  @JoinColumn({ name: 'appointment_id' })
  appointment!: Appointment;

  @OneToMany('MedicalVisitExam', (exam: any) => exam.medicalVisit, {
    cascade: true,
  })
  exams!: any[];

  @OneToMany('MedicalVisitDiagnosis', (diagnosis: any) => diagnosis.medicalVisit, {
    cascade: true,
  })
  diagnoses!: any[];

  @OneToMany('Prescription', (prescription: any) => prescription.medicalVisit, {
    cascade: true,
  })
  prescriptions!: any[];

  @OneToMany('DiagnosticOrder', (order: any) => order.medicalVisit, {
    cascade: true,
  })
  diagnosticOrders!: any[];

  @OneToMany('MedicalProcedure', (procedure: any) => procedure.medicalVisit, {
    cascade: true,
  })
  procedures!: any[];

  @OneToMany('FollowUpNote', (note: any) => note.medicalVisit, {
    cascade: true,
  })
  followUpNotes!: any[];

  @OneToMany('MedicalAttachment', (attachment: any) => attachment.medicalVisit, {
    cascade: true,
  })
  attachments!: any[];
}
