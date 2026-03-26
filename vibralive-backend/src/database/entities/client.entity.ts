import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Unique,
} from 'typeorm';
import { Clinic } from './clinic.entity';
import { Pet } from './pet.entity';
import { Appointment } from './appointment.entity';
import { ClientAddress } from './client-address.entity';
import { WhatsAppOutbox } from './whatsapp-outbox.entity';
import { Reminder } from './reminder.entity';
import { MessageLog } from './message-log.entity';
import { ClientTag } from './client-tag.entity';
import { PriceList } from './price-list.entity';

@Entity('clients')
@Unique(['clinicId', 'phone'])
export class Client {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'clinic_id', type: 'uuid' })
  clinicId!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 20 })
  phone!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email!: string;

  @Column({ name: 'price_list_id', type: 'uuid', nullable: true })
  priceListId?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  address!: string;

  @Column({ type: 'text', nullable: true })
  notes!: string;

  // --- NUEVOS CAMPOS PARA PERFIL EVOLUCIONADO ---
  @Column({ name: 'whatsapp_number', type: 'varchar', length: 20, nullable: true })
  whatsappNumber?: string;

  @Column({ name: 'phone_secondary', type: 'varchar', length: 20, nullable: true })
  phoneSecondary?: string;

  @Column({
    name: 'preferred_contact_method',
    type: 'varchar',
    length: 20,
    default: 'WHATSAPP',
  })
  preferredContactMethod: string = 'WHATSAPP';

  @Column({ name: 'preferred_contact_time_start', type: 'time', nullable: true })
  preferredContactTimeStart?: string;

  @Column({ name: 'preferred_contact_time_end', type: 'time', nullable: true })
  preferredContactTimeEnd?: string;

  @Column({ name: 'housing_type', type: 'varchar', length: 20, nullable: true })
  housingType?: string;

  @Column({ name: 'access_notes', type: 'text', nullable: true })
  accessNotes?: string;

  @Column({ name: 'service_notes', type: 'text', nullable: true })
  serviceNotes?: string;

  @Column({ name: 'do_not_contact', type: 'boolean', default: false })
  doNotContact: boolean = false;

  @Column({ name: 'do_not_contact_reason', type: 'text', nullable: true })
  doNotContactReason?: string;

  @Column({ name: 'status', type: 'varchar', length: 20, default: 'ACTIVE' })
  status: string = 'ACTIVE';

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Clinic, (clinic) => clinic.clients, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'clinic_id' })
  clinic!: Clinic;

  @ManyToOne(() => PriceList, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'price_list_id' })
  priceList?: PriceList;

  @OneToMany(() => Pet, (pet) => pet.client)
  pets!: Pet[];

  @OneToMany(() => ClientAddress, (address) => address.client)
  addresses!: ClientAddress[];

  @OneToMany(() => Reminder, (reminder) => reminder.client)
  reminders!: Reminder[];

  @OneToMany(() => MessageLog, (messageLog) => messageLog.client)
  messageLogs!: MessageLog[];

  @OneToMany(() => Appointment, (appointment) => appointment.client)
  appointments!: Appointment[];

  @OneToMany(() => WhatsAppOutbox, (whatsappMessage) => whatsappMessage.client)
  whatsappMessages!: WhatsAppOutbox[];

  @OneToMany(() => ClientTag, (tag) => tag.client, { cascade: true })
  tags!: ClientTag[];
}
