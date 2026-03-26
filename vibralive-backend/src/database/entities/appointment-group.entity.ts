import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Clinic } from './clinic.entity';
import { Client } from './client.entity';
import { Appointment } from './appointment.entity';
import { ClientAddress } from './client-address.entity';

@Entity('appointment_groups')
@Index(['clinicId', 'scheduledAt'])
@Index(['clinicId', 'createdAt'])
export class AppointmentGroup {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'clinic_id' })
  clinicId!: string;

  @Column({ type: 'uuid', name: 'client_id' })
  clientId!: string;

  @Column({ type: 'timestamp with time zone', name: 'scheduled_at' })
  scheduledAt!: Date;

  @Column({
    type: 'enum',
    enum: ['CLINIC', 'HOME'],
    default: 'CLINIC',
    name: 'location_type',
  })
  locationType!: 'CLINIC' | 'HOME';

  @Column({ type: 'uuid', nullable: true, name: 'address_id' })
  addressId?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Clinic, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clinic_id' })
  clinic!: Clinic;

  @ManyToOne(() => Client, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'client_id' })
  client!: Client;

  @OneToMany(() => Appointment, (apt) => apt.appointmentGroup)
  appointments!: Appointment[];

  @ManyToOne(() => ClientAddress, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'address_id' })
  address?: ClientAddress;
}
