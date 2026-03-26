import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Clinic } from './clinic.entity';
import { Client } from './client.entity';
import { User } from './user.entity';
import { ConversationMessage } from './conversation-message.entity';
import { WhatsAppConversationTransition } from './whatsapp-conversation-transition.entity';

export enum ConversationStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  HANDOFF = 'HANDOFF',
  ARCHIVED = 'ARCHIVED',
}

@Entity('whatsapp_conversations')
@Index(['clinicId', 'status'])
@Index(['clinicId', 'clientId'])
@Index(['clinicId', 'lastMessageAt'])
@Index(['phoneNumber'])
@Index(['assignedUserId'])
export class WhatsAppConversation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'clinic_id', type: 'uuid' })
  clinicId!: string;

  @Column({ name: 'client_id', type: 'uuid' })
  clientId!: string;

  @Column({ name: 'phone_number', type: 'varchar', length: 20 })
  phoneNumber!: string;

  @Column({
    type: 'enum',
    enum: ConversationStatus,
    default: ConversationStatus.OPEN,
  })
  status!: ConversationStatus;

  @Column({ name: 'current_state', type: 'varchar', length: 50, nullable: true })
  currentState?: string; // IDLE, AWAITING_CONFIRMATION, HANDOFF_TO_HUMAN, etc.

  @Column({ name: 'current_intent', type: 'varchar', length: 100, nullable: true })
  currentIntent?: string; // appointment_booking, rescheduling, cancellation, etc.

  @Column({ name: 'last_message_at', type: 'timestamp with time zone', nullable: true })
  lastMessageAt?: Date;

  @Column({ name: 'last_inbound_at', type: 'timestamp with time zone', nullable: true })
  lastInboundAt?: Date;

  @Column({ name: 'last_outbound_at', type: 'timestamp with time zone', nullable: true })
  lastOutboundAt?: Date;

  @Column({ name: 'assigned_user_id', type: 'uuid', nullable: true })
  assignedUserId?: string;

  @Column({ name: 'opened_at', type: 'timestamp with time zone', nullable: true })
  openedAt?: Date;

  @Column({ name: 'closed_at', type: 'timestamp with time zone', nullable: true })
  closedAt?: Date;

  @Column({ name: 'metadata_json', type: 'jsonb', nullable: true })
  metadataJson?: Record<string, any>;

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

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'assigned_user_id' })
  assignedUser?: User;

  @OneToMany(() => ConversationMessage, (msg) => msg.conversation)
  messages!: ConversationMessage[];

  @OneToMany(() => WhatsAppConversationTransition, (transition) => transition.conversation)
  stateTransitions!: WhatsAppConversationTransition[];
}
