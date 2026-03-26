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
import { User } from './user.entity';

// Matches Appointment.locationType enum
export type StylistType = 'CLINIC' | 'HOME';

@Entity('stylists')
@Index('idx_stylists_clinic', ['clinicId'])
@Index('idx_stylists_user', ['userId'], { unique: true })
export class Stylist {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'clinic_id', type: 'uuid' })
  clinicId!: string;

  @Column({ name: 'user_id', type: 'uuid', unique: true })
  userId!: string;

  @Column({ name: 'display_name', type: 'varchar', length: 100, nullable: true })
  displayName!: string | null;

  @Column({ 
    name: 'type', 
    type: 'varchar', 
    length: 20,
    enum: ['CLINIC', 'HOME'],
    default: 'CLINIC',
    comment: 'CLINIC = Estilista de clínica, HOME = Estilista de domicilio/ruta'
  })
  type!: StylistType;

  @Column({ name: 'is_bookable', type: 'boolean', default: true })
  isBookable!: boolean;

  @Column({ name: 'calendar_color', type: 'varchar', length: 20, nullable: true })
  calendarColor!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
