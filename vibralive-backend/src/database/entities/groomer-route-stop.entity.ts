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
import { GroomerRoute } from './groomer-route.entity';
import { Appointment } from './appointment.entity';

export enum StopStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  SKIPPED = 'SKIPPED',
}

@Entity('groomer_route_stops')
@Index(['routeId'])
@Index(['appointmentId'])
export class GroomerRouteStop {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'route_id' })
  routeId!: string;

  @Column({ type: 'uuid', name: 'appointment_id' })
  appointmentId!: string;

  @Column({ type: 'integer', name: 'stop_order' })
  stopOrder!: number;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    name: 'planned_arrival_time',
  })
  plannedArrivalTime!: Date;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    name: 'planned_departure_time',
  })
  plannedDepartureTime!: Date;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    name: 'actual_arrival_time',
  })
  actualArrivalTime!: Date;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    name: 'actual_departure_time',
  })
  actualDepartureTime!: Date;

  @Column({
    type: 'integer',
    nullable: true,
    name: 'travel_distance_to_stop_meters',
  })
  travelDistanceToStopMeters!: number;

  @Column({
    type: 'integer',
    nullable: true,
    name: 'travel_duration_to_stop_minutes',
  })
  travelDurationToStopMinutes!: number;

  @Column({
    type: 'varchar',
    length: 20,
    default: StopStatus.PENDING,
  })
  status!: StopStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => GroomerRoute, (route) => route.stops, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'route_id' })
  route!: GroomerRoute;

  @ManyToOne(() => Appointment, (appointment) => appointment.id, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'appointment_id' })
  appointment!: Appointment;
}
