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
import { User } from './user.entity';
import { GroomerRouteStop } from './groomer-route-stop.entity';

export enum RouteStatus {
  PENDING = 'PENDING',
  GENERATED = 'GENERATED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity('groomer_routes')
@Index(['clinicId', 'routeDate'])
@Index(['groomerUserId', 'routeDate'])
@Index(['status'])
export class GroomerRoute {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'clinic_id' })
  clinicId!: string;

  @Column({ type: 'date', name: 'route_date' })
  routeDate!: Date;

  @Column({ type: 'uuid', name: 'groomer_user_id' })
  groomerUserId!: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: RouteStatus.PENDING,
  })
  status!: RouteStatus;

  @Column({ type: 'integer', nullable: true, name: 'total_stops' })
  totalStops!: number;

  @Column({
    type: 'integer',
    nullable: true,
    name: 'total_distance_meters',
  })
  totalDistanceMeters!: number;

  @Column({
    type: 'integer',
    nullable: true,
    name: 'estimated_duration_minutes',
  })
  estimatedDurationMinutes!: number;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    name: 'generated_at',
  })
  generatedAt!: Date;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    name: 'algorithm_version',
  })
  algorithmVersion!: string;

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

  @ManyToOne(() => User, (user) => user.id, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'groomer_user_id' })
  groomerUser!: User;

  @OneToMany(() => GroomerRouteStop, (stop) => stop.route)
  stops!: GroomerRouteStop[];
}
