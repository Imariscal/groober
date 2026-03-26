import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { Clinic } from './clinic.entity';

export enum CalendarExceptionType {
  CLOSED = 'CLOSED',
  SPECIAL_HOURS = 'SPECIAL_HOURS',
}

@Entity('clinic_calendar_exceptions')
@Index(['clinicId', 'date'])
@Unique(['clinicId', 'date'])
export class ClinicCalendarException {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'clinic_id' })
  clinicId!: string;

  @Column({ type: 'date' })
  date!: string;

  @Column({
    type: 'enum',
    enum: CalendarExceptionType,
  })
  type!: CalendarExceptionType;

  @Column({
    type: 'time',
    nullable: true,
    name: 'start_time',
  })
  startTime?: string;

  @Column({
    type: 'time',
    nullable: true,
    name: 'end_time',
  })
  endTime?: string;

  @Column({
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  reason?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Clinic, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clinic_id' })
  clinic!: Clinic;
}
