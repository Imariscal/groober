import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ForeignKey,
  Unique,
} from 'typeorm';
import { Clinic } from './clinic.entity';

@Entity('animal_types')
@Unique(['clinicId', 'name'])
export class AnimalType {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ name: 'clinic_id', type: 'uuid' })
  clinicId!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Clinic, (clinic) => clinic.animalTypes, {
    onDelete: 'CASCADE',
  })
  clinic!: Clinic;
}
