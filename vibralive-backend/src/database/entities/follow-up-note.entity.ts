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

@Entity('follow_up_notes')
@Index(['clinicId', 'petId', 'noteDate'])
export class FollowUpNote {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'clinic_id' })
  clinicId!: string;

  @Column({ type: 'uuid', name: 'medical_visit_id' })
  medicalVisitId!: string;

  @Column({ type: 'uuid', name: 'pet_id' })
  petId!: string;

  @Column({
    type: 'timestamp with time zone',
    name: 'note_date',
  })
  noteDate!: Date;

  @Column({
    type: 'uuid',
    name: 'written_by',
  })
  writtenBy!: string;

  @Column({
    type: 'text',
    name: 'note_content',
  })
  noteContent!: string;

  @Column({
    type: 'text',
    nullable: true,
    name: 'status_update',
  })
  statusUpdate?: string;

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

  @ManyToOne(() => MedicalVisit, (mv) => mv.followUpNotes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'medical_visit_id' })
  medicalVisit!: MedicalVisit;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'written_by' })
  writtenByUser!: User;
}
