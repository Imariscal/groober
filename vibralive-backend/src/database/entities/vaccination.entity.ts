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
import { Vaccine } from './vaccine.entity';

@Entity('vaccinations')
@Index(['clinicId', 'petId', 'administeredDate'])
@Index(['clinicId', 'petId', 'nextDueDate'])
export class Vaccination {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'clinic_id' })
  clinicId!: string;

  @Column({ type: 'uuid', name: 'pet_id' })
  petId!: string;

  @Column({ type: 'uuid', name: 'vaccine_id' })
  vaccineId!: string;

  @Column({
    type: 'varchar',
    length: 100,
    name: 'vaccine_name',
  })
  vaccineName!: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'vaccine_batch',
  })
  vaccineBatch?: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    name: 'manufacturer',
  })
  manufacturer?: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'lot_number',
  })
  lotNumber?: string;

  @Column({
    type: 'timestamp with time zone',
    name: 'administered_date',
  })
  administeredDate!: Date;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    name: 'expiration_date',
  })
  expirationDate?: Date;

  @Column({
    type: 'uuid',
    name: 'veterinarian_id',
  })
  veterinarianId!: string;

  @Column({
    type: 'date',
    nullable: true,
    name: 'next_due_date',
  })
  nextDueDate?: Date;

  @Column({
    type: 'text',
    nullable: true,
    name: 'adverse_reactions',
  })
  adverseReactions?: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  notes?: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'ADMINISTERED',
    name: 'status',
  })
  status!: 'ADMINISTERED' | 'OVERDUE' | 'PENDING' | 'OMITTED';

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
  veterinarian!: User;

  @ManyToOne(() => Vaccine)
  @JoinColumn({ name: 'vaccine_id' })
  vaccine!: Vaccine;
}
