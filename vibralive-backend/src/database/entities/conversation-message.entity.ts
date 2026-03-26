import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { WhatsAppConversation } from './whatsapp-conversation.entity';
import { Clinic } from './clinic.entity';
import { Client } from './client.entity';

export enum MessageDirection {
  INBOUND = 'inbound',
  OUTBOUND = 'outbound',
}

export enum MessageStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
}

@Entity('conversation_messages')
@Index(['conversationId', 'createdAt'])
@Index(['clinicId', 'createdAt'])
@Index(['status'])
@Index(['providerMessageId'])
export class ConversationMessage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'conversation_id', type: 'uuid' })
  conversationId!: string;

  @Column({ name: 'clinic_id', type: 'uuid' })
  clinicId!: string;

  @Column({ name: 'client_id', type: 'uuid' })
  clientId!: string;

  @Column({
    type: 'enum',
    enum: MessageDirection,
  })
  direction!: MessageDirection;

  @Column({ name: 'provider_message_id', type: 'varchar', length: 255, nullable: true })
  providerMessageId?: string; // WhatsApp message ID (wamid)

  @Column({ name: 'provider_parent_message_id', type: 'varchar', length: 255, nullable: true })
  providerParentMessageId?: string; // For threaded replies

  @Column({ name: 'message_type', type: 'varchar', length: 50 })
  messageType!: string; // text, image, document, template, location, contact, sticker

  @Column({ name: 'template_name', type: 'varchar', length: 100, nullable: true })
  templateName?: string;

  @Column({ name: 'payload_json', type: 'jsonb', nullable: true })
  payloadJson?: Record<string, any>;

  @Column({ name: 'normalized_text', type: 'text', nullable: true })
  normalizedText?: string; // Plain text extracted from payload for search

  @Column({
    type: 'enum',
    enum: MessageStatus,
    default: MessageStatus.SENT,
  })
  status!: MessageStatus;

  @Column({ name: 'sent_at', type: 'timestamp with time zone', nullable: true })
  sentAt?: Date;

  @Column({ name: 'delivered_at', type: 'timestamp with time zone', nullable: true })
  deliveredAt?: Date;

  @Column({ name: 'read_at', type: 'timestamp with time zone', nullable: true })
  readAt?: Date;

  @Column({ name: 'failed_at', type: 'timestamp with time zone', nullable: true })
  failedAt?: Date;

  @Column({ name: 'error_code', type: 'varchar', length: 50, nullable: true })
  errorCode?: string;

  @Column({ name: 'error_message', type: 'varchar', length: 500, nullable: true })
  errorMessage?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  // Relations
  @ManyToOne(() => WhatsAppConversation, (conv) => conv.messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conversation_id' })
  conversation!: WhatsAppConversation;

  @ManyToOne(() => Clinic, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clinic_id' })
  clinic!: Clinic;

  @ManyToOne(() => Client, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'client_id' })
  client!: Client;
}
