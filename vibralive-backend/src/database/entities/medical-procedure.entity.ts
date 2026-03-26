import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Clinic } from './clinic.entity';
import { Pet } from './pet.entity';
import { MedicalVisit } from './medical-visit.entity';
import { User } from './user.entity';

@Entity('medical_procedures')
export class MedicalProcedure {
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
    name: 'performed_by_veterinarian_id',
  })
  performedByVeterinarianId!: string;

  @Column({
    type: 'varchar',
    length: 100,
    name: 'procedure_type',
  })
  procedureType!: string;

  @Column({
    type: 'varchar',
    length: 200,
    name: 'procedure_name',
  })
  procedureName!: string;

  @Column({
    type: 'timestamp with time zone',
    name: 'procedure_date',
  })
  procedureDate!: Date;

  @Column({
    type: 'integer',
    nullable: true,
    name: 'duration_minutes',
  })
  durationMinutes?: number;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'anesthesia_type',
  })
  anesthesiaType?: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  complications?: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  notes?: string;

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

  @ManyToOne(() => MedicalVisit, (mv) => mv.procedures, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'medical_visit_id' })
  medicalVisit!: MedicalVisit;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'performed_by_veterinarian_id' })
  performedByVeterinarian!: User;
}
