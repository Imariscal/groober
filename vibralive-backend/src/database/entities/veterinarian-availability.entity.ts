import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Veterinarian } from './veterinarian.entity';

/**
 * Define los horarios de trabajo de un veterinario por día de la semana
 * Permite que cada veterinario tenga horarios flexibles
 */
@Entity('veterinarian_availabilities')
@Index('idx_veterinarian_availability_vet', ['veterinarianId'])
@Index('idx_veterinarian_availability_dayofweek', ['veterinarianId', 'dayOfWeek'], {
  unique: true,
})
export class VeterinarianAvailability {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'veterinarian_id', type: 'uuid' })
  veterinarianId!: string;

  @Column({
    name: 'day_of_week',
    type: 'integer',
    comment: '0 = Monday, 6 = Sunday (ISO 8601)',
  })
  dayOfWeek!: number; // 0-6, Monday-Sunday

  @Column({
    name: 'start_time',
    type: 'time',
    comment: 'Hora de inicio (ej: 09:00)',
  })
  startTime!: string;

  @Column({
    name: 'end_time',
    type: 'time',
    comment: 'Hora de fin (ej: 17:00)',
  })
  endTime!: string;

  @Column({
    name: 'is_active',
    type: 'boolean',
    default: true,
    comment: 'Si está activo o no',
  })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => Veterinarian, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'veterinarian_id' })
  veterinarian!: Veterinarian;
}
