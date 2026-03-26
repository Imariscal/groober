import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('services')
@Index(['clinicId', 'isActive'])
export class Service {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'clinic_id' })
  clinicId!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'enum', enum: ['MEDICAL', 'GROOMING'] })
  category!: 'MEDICAL' | 'GROOMING';

  @Column({ type: 'int', default: 30, name: 'default_duration_minutes' })
  defaultDurationMinutes!: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true, transformer: { to: (v) => v, from: (v) => v ? parseFloat(v) : undefined } })
  price?: number;

  @Column({ default: false, name: 'applies_reminder_cycle' })
  appliesToReminder!: boolean;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'reminder_cycle_type' })
  reminderCycleType?: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';

  @Column({ type: 'int', nullable: true, name: 'reminder_cycle_value' })
  reminderCycleValue?: number;

  @Column({ type: 'int', default: 7, name: 'reminder_days_before' })
  reminderDaysBefore!: number;

  @Column({ default: false, name: 'requires_followup' })
  requiresFollowup!: boolean;

  @Column({ default: true, name: 'is_active' })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
