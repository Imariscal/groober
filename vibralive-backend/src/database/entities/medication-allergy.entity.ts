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
import { User } from './user.entity';

@Entity('medication_allergies')
@Index(['clinicId', 'petId'])
export class MedicationAllergy {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'clinic_id' })
  clinicId!: string;

  @Column({ type: 'uuid', name: 'pet_id' })
  petId!: string;

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
    length: 20,
  })
  severity!: 'MILD' | 'MODERATE' | 'SEVERE';

  @Column({
    type: 'text',
  })
  reaction!: string;

  @Column({
    type: 'timestamp with time zone',
    name: 'documented_date',
  })
  documentedDate!: Date;

  @Column({
    type: 'uuid',
    name: 'documented_by',
  })
  documentedBy!: string;

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

  @ManyToOne(() => User)
  @JoinColumn({ name: 'documented_by' })
  documentedByUser!: User;
}
