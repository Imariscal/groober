import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Clinic } from './clinic.entity';
import { Pet } from './pet.entity';
import { MedicalVisit } from './medical-visit.entity';
import { User } from './user.entity';

@Entity('prescriptions')
@Index(['clinicId', 'petId', 'status'])
@Index(['clinicId', 'medicalVisitId'])
export class Prescription {
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
    name: 'prescribed_by_veterinarian_id',
  })
  prescribedByVeterinarianId!: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'medication_id',
  })
  medicationId?: string;

  @Column({
    type: 'varchar',
    length: 200,
    name: 'medication_name',
  })
  medicationName!: string;

  @Column({
    type: 'varchar',
    length: 50,
  })
  dosage!: string;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'dosage_unit',
  })
  dosageUnit!: string;

  @Column({
    type: 'varchar',
    length: 100,
  })
  frequency!: string;

  @Column({
    type: 'integer',
    name: 'duration_days',
  })
  durationDays!: number;

  @Column({
    type: 'integer',
  })
  quantity!: number;

  @Column({
    type: 'varchar',
    length: 20,
  })
  route!: 'ORAL' | 'INJECTION' | 'TOPICAL' | 'INHALED';

  @Column({
    type: 'text',
    nullable: true,
  })
  instructions?: string;

  @Column({
    type: 'integer',
    default: 0,
    name: 'refills_allowed',
  })
  refillsAllowed!: number;

  @Column({
    type: 'timestamp with time zone',
    name: 'prescribed_date',
  })
  prescribedDate!: Date;

  @Column({
    type: 'date',
    name: 'start_date',
  })
  startDate!: Date;

  @Column({
    type: 'date',
    name: 'end_date',
  })
  endDate!: Date;

  @Column({
    type: 'varchar',
    length: 30,
    default: 'ACTIVE',
  })
  status!: 'ACTIVE' | 'COMPLETED' | 'DISCONTINUED' | 'EXPIRED';

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

  @ManyToOne(() => MedicalVisit, (mv) => mv.prescriptions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'medical_visit_id' })
  medicalVisit!: MedicalVisit;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'prescribed_by_veterinarian_id' })
  prescribedByVeterinarian!: User;
}
