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

@Entity('medical_attachments')
@Index(['clinicId', 'medicalVisitId'])
@Index(['clinicId', 'petId'])
export class MedicalAttachment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'clinic_id' })
  clinicId!: string;

  @Column({ type: 'uuid', name: 'medical_visit_id' })
  medicalVisitId!: string;

  @Column({ type: 'uuid', name: 'pet_id' })
  petId!: string;

  @Column({
    type: 'varchar',
    length: 50,
    name: 'document_type',
  })
  documentType!:
    | 'XRAY'
    | 'ULTRASOUND'
    | 'LAB_REPORT'
    | 'PATHOLOGY'
    | 'CONSENT_FORM'
    | 'OTHER';

  @Column({
    type: 'varchar',
    length: 255,
    name: 'file_name',
  })
  fileName!: string;

  @Column({
    type: 'integer',
    name: 'file_size',
  })
  fileSize!: number;

  @Column({
    type: 'varchar',
    length: 50,
    name: 'file_type',
  })
  fileType!: string;

  @Column({
    type: 'varchar',
    length: 500,
    name: 'storage_path',
  })
  storagePath!: string;

  @Column({
    type: 'uuid',
    name: 'uploaded_by',
  })
  uploadedBy!: string;

  @Column({
    type: 'timestamp with time zone',
    name: 'upload_date',
  })
  uploadDate!: Date;

  @Column({
    type: 'boolean',
    default: false,
    name: 'is_confidential',
  })
  isConfidential!: boolean;

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

  @ManyToOne(() => MedicalVisit, (mv) => mv.attachments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'medical_visit_id' })
  medicalVisit!: MedicalVisit;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uploaded_by' })
  uploadedByUser!: User;
}
