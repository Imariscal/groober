import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Clinic } from './clinic.entity';
import { Client } from './client.entity';
import { Appointment } from './appointment.entity';
import { Reminder } from './reminder.entity';

export enum PetSpecies {
  DOG = 'DOG',
  CAT = 'CAT',
  BIRD = 'BIRD',
  RABBIT = 'RABBIT',
  HAMSTER = 'HAMSTER',
  GUINEA_PIG = 'GUINEA_PIG',
  FISH = 'FISH',
  TURTLE = 'TURTLE',
  FERRET = 'FERRET',
  OTHER = 'OTHER',
}

export enum PetSex {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  UNKNOWN = 'UNKNOWN',
}

export enum PetSize {
  XS = 'XS',
  S = 'S',
  M = 'M',
  L = 'L',
  XL = 'XL',
}

@Entity('pets')
@Index(['clinicId', 'clientId'])
@Index(['clinicId', 'microchipNumber'], { unique: true, where: '"microchip_number" IS NOT NULL' })
export class Pet {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'clinic_id', type: 'uuid' })
  clinicId!: string;

  @Column({ name: 'client_id', type: 'uuid' })
  clientId!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 20, default: PetSpecies.DOG })
  species!: PetSpecies;

  @Column({ type: 'varchar', length: 100, nullable: true })
  breed!: string;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth!: Date;

  // ========== PERFIL ==========
  @Column({ type: 'varchar', length: 10, default: PetSex.UNKNOWN })
  sex!: PetSex;

  @Column({ name: 'is_sterilized', type: 'boolean', default: false })
  isSterilized!: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  color?: string;

  @Column({ type: 'varchar', length: 5, nullable: true })
  size?: PetSize;

  // ========== IDENTIFICACIÓN ==========
  @Column({ name: 'microchip_number', type: 'varchar', length: 50, nullable: true })
  microchipNumber?: string;

  @Column({ name: 'tag_number', type: 'varchar', length: 50, nullable: true })
  tagNumber?: string;

  @Column({ name: 'external_reference', type: 'varchar', length: 80, nullable: true })
  externalReference?: string;

  // ========== OPERACIÓN CLÍNICA ==========
  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'text', nullable: true })
  allergies?: string;

  @Column({ name: 'blood_type', type: 'varchar', length: 20, nullable: true })
  bloodType?: string;

  // ========== ESTADO DE VIDA ==========
  @Column({ name: 'is_deceased', type: 'boolean', default: false })
  isDeceased!: boolean;

  @Column({ name: 'deceased_at', type: 'date', nullable: true })
  deceasedAt?: Date;

  // ========== AUDITORÍA ==========
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;

  // Relations
  @ManyToOne(() => Clinic, (clinic) => clinic.pets, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'clinic_id' })
  clinic!: Clinic;

  @ManyToOne(() => Client, (client) => client.pets, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'client_id' })
  client!: Client;

  @OneToMany(() => Reminder, (reminder) => reminder.pet)
  reminders!: Reminder[];

  @OneToMany(() => Appointment, (appointment) => appointment.pet)
  appointments!: Appointment[];
}
