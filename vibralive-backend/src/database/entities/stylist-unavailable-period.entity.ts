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
import { Stylist } from './stylist.entity';

/**
 * Define períodos en los que el estilista no está disponible
 * (vacaciones, enfermedad, descanso, etc.)
 */
@Entity('stylist_unavailable_periods')
@Index('idx_stylist_unavailable_stylist', ['stylistId'])
@Index('idx_stylist_unavailable_dates', ['stylistId', 'startDate', 'endDate'])
export class StylistUnavailablePeriod {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'stylist_id', type: 'uuid' })
  stylistId!: string;

  @Column({
    name: 'reason',
    type: 'enum',
    enum: ['VACATION', 'SICK_LEAVE', 'REST_DAY', 'PERSONAL', 'OTHER'],
    default: 'OTHER',
  })
  reason!: 'VACATION' | 'SICK_LEAVE' | 'REST_DAY' | 'PERSONAL' | 'OTHER';

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
    comment: 'Hora de inicio si no es todo el día',
  })
  startTime?: string | null;

  @Column({
    name: 'end_time',
    type: 'time',
    nullable: true,
    comment: 'Hora de fin si no es todo el día',
  })
  endTime?: string | null;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Notas adicionales sobre el período no disponible',
  })
  notes?: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => Stylist, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'stylist_id' })
  stylist!: Stylist;
}
