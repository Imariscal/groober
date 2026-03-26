import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { MedicalVisit } from './medical-visit.entity';

@Entity('medical_visit_diagnoses')
export class MedicalVisitDiagnosis {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'medical_visit_id' })
  medicalVisitId!: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    name: 'diagnosis_code',
  })
  diagnosisCode?: string;

  @Column({
    type: 'varchar',
    length: 200,
    name: 'diagnosis_name',
  })
  diagnosisName!: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'MODERATE',
  })
  severity!: 'MILD' | 'MODERATE' | 'SEVERE';

  @Column({
    type: 'varchar',
    length: 30,
    default: 'PRELIMINARY',
  })
  status!: 'PRELIMINARY' | 'CONFIRMED' | 'RULED_OUT';

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
  @ManyToOne(() => MedicalVisit, (mv) => mv.diagnoses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'medical_visit_id' })
  medicalVisit!: MedicalVisit;
}
