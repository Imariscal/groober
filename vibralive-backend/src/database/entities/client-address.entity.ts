import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Clinic } from './clinic.entity';
import { Client } from './client.entity';

export enum GeocodeStatus {
  PENDING = 'PENDING',
  OK = 'OK',
  FAILED = 'FAILED',
}

@Entity('client_addresses')
@Index(['clinicId', 'clientId'])
@Index(['geocodeStatus'])
export class ClientAddress {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'clinic_id' })
  clinicId!: string;

  @Column({ type: 'uuid', name: 'client_id' })
  clientId!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  label!: string; // e.g., "Casa", "Trabajo"

  @Column({ type: 'varchar', length: 255 })
  street!: string;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'number_ext' })
  numberExt!: string;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'number_int' })
  numberInt!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  neighborhood!: string;

  @Column({ type: 'varchar', length: 100 })
  city!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  state!: string;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'zip_code' })
  zipCode!: string;

  @Column({ type: 'text', nullable: true })
  references!: string; // e.g., "Puerta azul junto al supermercado"

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 8,
    nullable: true,
  })
  lat!: number;

  @Column({
    type: 'decimal',
    precision: 11,
    scale: 8,
    nullable: true,
  })
  lng!: number;

  @Column({
    type: 'varchar',
    length: 20,
    name: 'geocode_status',
    default: GeocodeStatus.PENDING,
  })
  geocodeStatus!: GeocodeStatus;

  @Column({ type: 'boolean', name: 'is_default', default: false })
  isDefault!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Clinic, (clinic) => clinic.id, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'clinic_id' })
  clinic!: Clinic;

  @ManyToOne(() => Client, (client) => client.addresses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'client_id' })
  client!: Client;
}
