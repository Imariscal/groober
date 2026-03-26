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

/**
 * Define la capacidad máxima de citas para un veterinario en un día específico
 * Permite overriding de capacidad para días con alta/baja demanda
 */
@Entity('veterinarian_capacities')
@Index('idx_veterinarian_capacity_vet', ['veterinarianId'])
@Index('idx_veterinarian_capacity_date', ['veterinarianId', 'date'], { unique: true })
export class VeterinarianCapacity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'veterinarian_id', type: 'uuid' })
  veterinarianId!: string;

  @Column({
    name: 'date',
    type: 'date',
    comment: 'Fecha específica para la cual se define la capacidad',
  })
  date!: Date;

  @Column({
    name: 'max_appointments',
    type: 'integer',
    comment: 'Número máximo de citas permitidas en ese día',
  })
  maxAppointments!: number;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Notas sobre la capacidad (ej: "Alta demanda", "Personal reducido")',
  })
  notes?: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => Veterinarian, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'veterinarian_id' })
  veterinarian!: Veterinarian;
}
