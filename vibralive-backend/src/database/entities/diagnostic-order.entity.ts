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
import { MedicalVisit } from './medical-visit.entity';
import { User } from './user.entity';

@Entity('diagnostic_orders')
@Index(['clinicId', 'petId', 'status'])
@Index(['clinicId', 'medicalVisitId'])
export class DiagnosticOrder {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'clinic_id' })
  clinicId!: string;

  @Column({ type: 'uuid', name: 'medical_visit_id' })
  medicalVisitId!: string;

  @Column({ type: 'uuid', name: 'pet_id' })
  petId!: string;

  @Column({
    type: 'uuid',
    name: 'ordered_by_veterinarian_id',
  })
  orderedByVeterinarianId!: string;

  @Column({
    type: 'varchar',
    length: 30,
    name: 'test_type',
  })
  testType!:
    | 'BLOOD_TEST'
    | 'URINE_TEST'
    | 'FECAL_TEST'
    | 'XRAY'
    | 'ULTRASOUND'
    | 'ECG'
    | 'ENDOSCOPY';

  @Column({
    type: 'varchar',
    length: 100,
    name: 'test_name',
  })
  testName!: string;

  @Column({
    type: 'text',
  })
  reason!: string;

  @Column({
    type: 'timestamp with time zone',
    name: 'order_date',
  })
  orderDate!: Date;

  @Column({
    type: 'date',
    name: 'due_date',
  })
  dueDate!: Date;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    name: 'specimen_collected_date',
  })
  specimenCollectedDate?: Date;

  @Column({
    type: 'varchar',
    length: 30,
    default: 'ORDERED',
  })
  status!:
    | 'ORDERED'
    | 'SAMPLE_COLLECTED'
    | 'IN_PROGRESS'
    | 'COMPLETED'
    | 'CANCELLED';

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'lab_name',
  })
  labName?: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'lab_reference_id',
  })
  labReferenceId?: string;

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

  @ManyToOne(() => MedicalVisit, (mv) => mv.diagnosticOrders, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'medical_visit_id' })
  medicalVisit!: MedicalVisit;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'ordered_by_veterinarian_id' })
  orderedByVeterinarian!: User;

  @OneToMany(
    'DiagnosticTestResult',
    (result: any) => result.diagnosticOrder,
    { cascade: true },
  )
  testResults!: any[];
}
