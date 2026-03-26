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
import { MedicalVisit } from './medical-visit.entity';
import { User } from './user.entity';

@Entity('medical_visit_exams')
@Index(['medicalVisitId', 'examType'])
export class MedicalVisitExam {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'medical_visit_id' })
  medicalVisitId!: string;

  @Column({
    type: 'varchar',
    length: 30,
    name: 'exam_type',
  })
  examType!:
    | 'PHYSICAL'
    | 'BLOOD_WORK'
    | 'URINALYSIS'
    | 'XRAY'
    | 'ULTRASOUND'
    | 'ECG'
    | 'ENDOSCOPY';

  @Column({
    type: 'varchar',
    length: 100,
    name: 'exam_name',
  })
  examName!: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  findings?: string;

  @Column({
    type: 'boolean',
    nullable: true,
    name: 'is_normal',
  })
  isNormal?: boolean;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    name: 'performed_date',
  })
  performedDate?: Date;

  @Column({
    type: 'uuid',
    nullable: true,
    name: 'performed_by',
  })
  performedBy?: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  notes?: string;

  @Column({
    type: 'integer',
    default: 0,
    name: 'attachments_count',
  })
  attachmentsCount!: number;

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
  @ManyToOne(() => MedicalVisit, (mv) => mv.exams, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'medical_visit_id' })
  medicalVisit!: MedicalVisit;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'performed_by' })
  performedByUser?: User;
}
