import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Client } from './client.entity';
import { Pet } from './pet.entity';
import { Appointment } from './appointment.entity';
import { WhatsAppOutbox } from './whatsapp-outbox.entity';
import { AnimalType } from './animal-type.entity';
import { Reminder } from './reminder.entity';
import { MessageLog } from './message-log.entity';
import { SubscriptionPlan } from './subscription-plan.entity';
import { ClientTag } from './client-tag.entity';

@Entity('clinics')
@Unique(['phone'])
export class Clinic {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 100, nullable: true, unique: true })
  slug?: string;

  @Column({ type: 'varchar', length: 20 })
  phone!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email!: string;

  @Column({ type: 'varchar', length: 255 })
  responsable!: string;

  @Column({ type: 'varchar', length: 100 })
  city!: string;

  @Column({ type: 'varchar', length: 100, default: 'MX' })
  country!: string;

  @Column({ name: 'whatsapp_account_id', type: 'varchar', length: 100, nullable: true })
  whatsappAccountId!: string;

  @Column({ name: 'whatsapp_phone_id', type: 'varchar', length: 100, nullable: true })
  whatsappPhoneId!: string;

  @Column({ name: 'subscription_plan', type: 'varchar', length: 50, default: 'starter' })
  subscriptionPlan!: string;

  @Column({ name: 'subscription_plan_id', type: 'uuid', nullable: true })
  subscriptionPlanId!: string | null;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'ACTIVE',
  })
  status!: 'ACTIVE' | 'SUSPENDED' | 'DELETED';

  @Column({ name: 'suspended_at', type: 'timestamp with time zone', nullable: true })
  suspendedAt!: Date | null;

  @Column({ name: 'suspended_by', type: 'uuid', nullable: true })
  suspendedBy!: string | null;

  @Column({ name: 'suspension_reason', type: 'text', nullable: true })
  suspensionReason!: string | null;

  @Column({ type: 'varchar', length: 50, default: 'STARTER' })
  plan!: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';

  @Column({ name: 'max_staff_users', type: 'integer', default: 100 })
  maxStaffUsers!: number;

  @Column({ name: 'max_clients', type: 'integer', default: 1000 })
  maxClients!: number;

  @Column({ name: 'max_pets', type: 'integer', default: 5000 })
  maxPets!: number;

  @Column({ name: 'active_staff_count', type: 'integer', default: 0 })
  activeStaffCount!: number;

  @Column({ name: 'active_clients_count', type: 'integer', default: 0 })
  activeClientsCount!: number;

  @Column({ name: 'active_pets_count', type: 'integer', default: 0 })
  activePetsCount!: number;

  @Column({ name: 'stats_updated_at', type: 'timestamp with time zone', nullable: true })
  statsUpdatedAt!: Date | null;

  @Column({ name: 'notifications_email', type: 'boolean', default: true })
  notificationsEmail!: boolean;

  @Column({ name: 'notifications_sms', type: 'boolean', default: true })
  notificationsSms!: boolean;

  @Column({ type: 'varchar', length: 50, default: 'private' })
  privacy!: 'public' | 'private';

  @Column({ type: 'varchar', length: 10, default: 'es' })
  language!: 'es' | 'en';

  @Column({ type: 'varchar', length: 50, default: 'America/Mexico_City' })
  timezone!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => SubscriptionPlan, { nullable: true, eager: true })
  @JoinColumn({ name: 'subscription_plan_id' })
  subscriptionPlanEntity!: SubscriptionPlan | null;

  @OneToMany(() => Client, (client) => client.clinic)
  clients!: Client[];

  @OneToMany(() => Pet, (pet) => pet.clinic)
  pets!: Pet[];

  @OneToMany(() => AnimalType, (animalType) => animalType.clinic)
  animalTypes!: AnimalType[];

  @OneToMany(() => Reminder, (reminder) => reminder.clinic)
  reminders!: Reminder[];

  @OneToMany(() => MessageLog, (messageLog) => messageLog.clinic)
  messageLogs!: MessageLog[];

  @OneToMany(() => Appointment, (appointment) => appointment.clinic)
  appointments!: Appointment[];

  @OneToMany(() => WhatsAppOutbox, (whatsappMessage) => whatsappMessage.clinic)
  whatsappMessages!: WhatsAppOutbox[];

  @OneToMany(() => ClientTag, (tag) => tag.clinic)
  clientTags!: ClientTag[];
}
