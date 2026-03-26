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

export type VeterinarianSpecialty =
  | 'GENERAL'
  | 'SURGERY'
  | 'CARDIOLOGY'
  | 'DERMATOLOGY'
  | 'ORTHOPEDICS'
  | 'OPHTHALMOLOGY'
  | 'DENTISTRY'
  | 'OTHER';

@Entity('veterinarians')
@Index('idx_veterinarians_clinic', ['clinicId'])
@Index('idx_veterinarians_user', ['userId'], { unique: true })
export class Veterinarian {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'clinic_id', type: 'uuid' })
  clinicId!: string;

  @Column({ name: 'user_id', type: 'uuid', unique: true })
  userId!: string;

  @Column({ 
    name: 'display_name', 
    type: 'varchar', 
    length: 100, 
    nullable: true,
    comment: 'Nombre para mostrar (ej: "Dr. David Martínez")'
  })
  displayName!: string | null;

  @Column({
    name: 'specialty',
    type: 'varchar',
    length: 50,
    enum: ['GENERAL', 'SURGERY', 'CARDIOLOGY', 'DERMATOLOGY', 'ORTHOPEDICS', 'OPHTHALMOLOGY', 'DENTISTRY', 'OTHER'],
    default: 'GENERAL',
    comment: 'Especialidad veterinaria'
  })
  specialty!: VeterinarianSpecialty;

  @Column({ 
    name: 'is_bookable', 
    type: 'boolean', 
    default: true,
    comment: 'Si puede recibir citas agendadas'
  })
  isBookable!: boolean;

  @Column({ 
    name: 'calendar_color', 
    type: 'varchar', 
    length: 20, 
    nullable: true,
    comment: 'Color hexadecimal para el calendario'
  })
  calendarColor!: string | null;

  @Column({
    name: 'license_number',
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'Número de cédula profesional'
  })
  licenseNumber!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
