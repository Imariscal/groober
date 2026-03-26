import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('vaccines')
@Index(['clinicId', 'isActive'])
export class Vaccine {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'clinic_id' })
  clinicId!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'int', name: 'booster_days', nullable: true })
  boosterDays?: number;

  @Column({ default: false, name: 'is_single_dose' })
  isSingleDose!: boolean;

  @Column({ type: 'simple-array', nullable: true, name: 'diseases_covered' })
  diseasesCovered?: string[];

  @Column({ default: true, name: 'is_active' })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
