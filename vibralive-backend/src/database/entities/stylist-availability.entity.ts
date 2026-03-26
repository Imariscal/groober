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
 * Define los horarios de trabajo de un estilista por día de la semana
 * Permite que cada estilista tenga horarios flexibles
 */
@Entity('stylist_availabilities')
@Index('idx_stylist_availability_stylist', ['stylistId'])
@Index('idx_stylist_availability_dayofweek', ['stylistId', 'dayOfWeek'], {
  unique: true,
})
export class StylistAvailability {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'stylist_id', type: 'uuid' })
  stylistId!: string;

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
  startTime!: string; // Format: HH:mm

  @Column({
    name: 'end_time',
    type: 'time',
    comment: 'Hora de fin (ej: 18:00)',
  })
  endTime!: string; // Format: HH:mm

  @Column({
    name: 'is_active',
    type: 'boolean',
    default: true,
    comment: 'Si es false, el estilista no trabaja ese día',
  })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => Stylist, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'stylist_id' })
  stylist!: Stylist;
}
