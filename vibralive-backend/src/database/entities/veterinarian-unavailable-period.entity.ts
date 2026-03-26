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

export type UnavailablePeriodReason = 'VACATION' | 'SICK_LEAVE' | 'REST_DAY' | 'PERSONAL' | 'OTHER';

/**
 * Define períodos en los que el veterinario no está disponible
 * (vacaciones, licencia médica, descanso, etc.)
 */
@Entity('veterinarian_unavailable_periods')
@Index('idx_veterinarian_unavailable_vet', ['veterinarianId'])
@Index('idx_veterinarian_unavailable_dates', ['veterinarianId', 'startDate', 'endDate'])
export class VeterinarianUnavailablePeriod {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'veterinarian_id', type: 'uuid' })
  veterinarianId!: string;

  @Column({
    name: 'reason',
    type: 'enum',
    enum: ['VACATION', 'SICK_LEAVE', 'REST_DAY', 'PERSONAL', 'OTHER'],
    default: 'OTHER',
    comment: 'Razón de no disponibilidad'
  })
  reason!: UnavailablePeriodReason;

  @Column({
    name: 'start_date',
    type: 'date',
    comment: 'Fecha de inicio del período no disponible',
  })
  startDate!: Date;

  @Column({
    name: 'end_date',
    type: 'date',
    comment: 'Fecha de fin del período no disponible',
  })
  endDate!: Date;

  @Column({
    name: 'is_all_day',
    type: 'boolean',
    default: true,
    comment: 'Si es true, el período aplica a todo el día',
  })
  isAllDay!: boolean;

  @Column({
    name: 'start_time',
    type: 'time',
    nullable: true,
    comment: 'Hora de inicio (si no es all_day)',
  })
  startTime!: string | null;

  @Column({
    name: 'end_time',
    type: 'time',
    nullable: true,
    comment: 'Hora de fin (si no es all_day)',
  })
  endTime!: string | null;

  @Column({
    name: 'notes',
    type: 'text',
    nullable: true,
    comment: 'Notas adicionales',
  })
  notes!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => Veterinarian, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'veterinarian_id' })
  veterinarian!: Veterinarian;
}
