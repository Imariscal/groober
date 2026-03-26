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

@Entity('whatsapp_conversation_transitions')
@Index(['conversationId', 'createdAt'])
@Index(['fromState', 'toState'])
export class WhatsAppConversationTransition {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'conversation_id', type: 'uuid' })
  conversationId!: string;

  @Column({ name: 'from_state', type: 'varchar', length: 100, nullable: true })
  fromState?: string;

  @Column({ name: 'to_state', type: 'varchar', length: 100 })
  toState!: string;

  @Column({ name: 'trigger_type', type: 'varchar', length: 100, nullable: true })
  triggerType?: string; // user_message, bot_action, timeout, human_handoff

  @Column({ name: 'trigger_value', type: 'text', nullable: true })
  triggerValue?: string;

  @Column({ name: 'metadata_json', type: 'jsonb', nullable: true })
  metadataJson?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  // Relations
  @ManyToOne(() => WhatsAppConversation, (conv) => conv.stateTransitions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conversation_id' })
  conversation!: WhatsAppConversation;
}
