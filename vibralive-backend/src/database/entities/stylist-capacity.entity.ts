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
 * Define la capacidad máxima de citas para un estilista en un día específico
 * Permite overriding de capacidad para días con alta/baja demanda
 */
@Entity('stylist_capacities')
@Index('idx_stylist_capacity_stylist', ['stylistId'])
@Index('idx_stylist_capacity_date', ['stylistId', 'date'], { unique: true })
export class StylistCapacity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'stylist_id', type: 'uuid' })
  stylistId!: string;

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

  @ManyToOne(() => Stylist, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'stylist_id' })
  stylist!: Stylist;
}
