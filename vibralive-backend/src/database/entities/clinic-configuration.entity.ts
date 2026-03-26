import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Clinic } from './clinic.entity';

export interface BusinessHours {
  week: {
    mon: Array<{ start: string; end: string }>;
    tue: Array<{ start: string; end: string }>;
    wed: Array<{ start: string; end: string }>;
    thu: Array<{ start: string; end: string }>;
    fri: Array<{ start: string; end: string }>;
    sat: Array<{ start: string; end: string }>;
    sun: Array<{ start: string; end: string }>;
  };
}

@Entity('clinic_configuration')
export class ClinicConfiguration {
  @PrimaryColumn({ type: 'uuid', name: 'clinic_id' })
  clinicId!: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'America/Monterrey',
  })
  timezone!: string;

  @Column({
    type: 'jsonb',
    name: 'business_hours',
    default: {
      week: {
        mon: [{ start: '09:00', end: '19:00' }],
        tue: [{ start: '09:00', end: '19:00' }],
        wed: [{ start: '09:00', end: '19:00' }],
        thu: [{ start: '09:00', end: '19:00' }],
        fri: [{ start: '09:00', end: '19:00' }],
        sat: [{ start: '09:00', end: '14:00' }],
        sun: [],
      },
    },
  })
  businessHours!: BusinessHours;

  @Column({
    type: 'integer',
    default: 1,
    name: 'clinic_grooming_capacity',
  })
  clinicGroomingCapacity!: number;

  @Column({
    type: 'integer',
    default: 1,
    name: 'home_grooming_capacity',
  })
  homeGroomingCapacity!: number;

  @Column({
    type: 'integer',
    default: 20,
    name: 'home_travel_buffer_minutes',
  })
  homeTravelBufferMinutes!: number;

  @Column({
    type: 'boolean',
    default: true,
    name: 'prevent_same_pet_same_day',
  })
  preventSamePetSameDay!: boolean;

  @Column({
    type: 'integer',
    default: 5,
    name: 'max_clinic_overlapping_appointments',
  })
  maxClinicOverlappingAppointments!: number;

  @Column({
    type: 'boolean',
    default: false,
    name: 'allow_appointment_overlap',
  })
  allowAppointmentOverlap!: boolean;

  // MEDICAL SERVICE CONFIGURATION
  @Column({
    type: 'integer',
    default: 1,
    name: 'clinic_medical_capacity',
  })
  clinicMedicalCapacity!: number;

  @Column({
    type: 'integer',
    default: 1,
    name: 'home_medical_capacity',
  })
  homeMedicalCapacity!: number;

  @Column({
    type: 'integer',
    default: 10,
    name: 'medical_travel_buffer_minutes',
  })
  medicalTravelBufferMinutes!: number;

  @Column({
    type: 'integer',
    default: 3,
    name: 'max_clinic_medical_overlapping_appointments',
  })
  maxClinicMedicalOverlappingAppointments!: number;

  @Column({
    type: 'boolean',
    default: false,
    name: 'allow_medical_appointment_overlap',
  })
  allowMedicalAppointmentOverlap!: boolean;

  // Ubicación base de la clínica para mapas
  @Column({
    type: 'numeric',
    precision: 10,
    scale: 7,
    nullable: true,
    name: 'base_lat',
    comment: 'Latitud base de la clínica para inicializar mapas',
  })
  baseLat!: number | null;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 7,
    nullable: true,
    name: 'base_lng',
    comment: 'Longitud base de la clínica para inicializar mapas',
  })
  baseLng!: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Clinic, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clinic_id' })
  clinic!: Clinic;
}
