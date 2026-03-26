import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

/**
 * Migration: Create WhatsApp Conversational Messaging Infrastructure (Part 1)
 * 
 * Creates new tables for:
 * - WhatsApp conversations (conversation threads)
 * - Conversation messages (structured messages within conversations)
 * - WhatsApp templates (template management)
 * - Webhook events (raw webhook storage)
 * - Conversation transitions (state machine tracking)
 * 
 * Timestamp Strategy:
 * - All timestamps use 'timestamp with time zone' for UTC normalization
 * - Backend normalizes all inputs to UTC
 * - Frontend converts UTC → clinic timezone for display only
 */
export class CreateWhatsAppMessagingInfrastructure1773200000000 implements MigrationInterface {
  name = 'CreateWhatsAppMessagingInfrastructure1773200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('🚀 [MIGRATION] Creating WhatsApp Conversational Messaging Infrastructure...');

    // ============================================================================
    // 1. whatsapp_conversations - Main conversation threads
    // ============================================================================
    await queryRunner.createTable(
      new Table({
        name: 'whatsapp_conversations',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'clinic_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'client_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'phone_number',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['OPEN', 'CLOSED', 'HANDOFF', 'ARCHIVED'],
            default: `'OPEN'`,
            isNullable: false,
          },
          {
            name: 'current_state',
            type: 'varchar',
            length: '50',
            isNullable: true,
            comment: 'IDLE, AWAITING_CONFIRMATION, AWAITING_RESCHEDULE_DATE, etc.',
          },
          {
            name: 'current_intent',
            type: 'varchar',
            length: '100',
            isNullable: true,
            comment: 'appointment_booking, rescheduling, cancellation, etc.',
          },
          {
            name: 'last_message_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'last_inbound_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'last_outbound_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'assigned_user_id',
            type: 'uuid',
            isNullable: true,
            comment: 'User assigned to handle this conversation',
          },
          {
            name: 'opened_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'closed_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'metadata_json',
            type: 'jsonb',
            isNullable: true,
            comment: 'Additional context (appointment_id, service_type, etc.)',
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Indexes for whatsapp_conversations
    await queryRunner.createIndex(
      'whatsapp_conversations',
      new TableIndex({
        name: 'IDX_whatsapp_conversations_clinic_status',
        columnNames: ['clinic_id', 'status'],
      }),
    );

    await queryRunner.createIndex(
      'whatsapp_conversations',
      new TableIndex({
        name: 'IDX_whatsapp_conversations_clinic_client',
        columnNames: ['clinic_id', 'client_id'],
      }),
    );

    await queryRunner.createIndex(
      'whatsapp_conversations',
      new TableIndex({
        name: 'IDX_whatsapp_conversations_clinic_last_msg',
        columnNames: ['clinic_id', 'last_message_at'],
      }),
    );

    await queryRunner.createIndex(
      'whatsapp_conversations',
      new TableIndex({
        name: 'IDX_whatsapp_conversations_phone',
        columnNames: ['phone_number'],
      }),
    );

    await queryRunner.createIndex(
      'whatsapp_conversations',
      new TableIndex({
        name: 'IDX_whatsapp_conversations_assigned_user',
        columnNames: ['assigned_user_id'],
      }),
    );

    // Foreign keys for whatsapp_conversations
    await queryRunner.createForeignKey(
      'whatsapp_conversations',
      new TableForeignKey({
        columnNames: ['clinic_id'],
        referencedTableName: 'clinics',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'whatsapp_conversations',
      new TableForeignKey({
        columnNames: ['client_id'],
        referencedTableName: 'clients',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'whatsapp_conversations',
      new TableForeignKey({
        columnNames: ['assigned_user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    console.log('  ✓ whatsapp_conversations table created');

    // ============================================================================
    // 2. conversation_messages - Structured messages within conversations
    // ============================================================================
    await queryRunner.createTable(
      new Table({
        name: 'conversation_messages',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'conversation_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'clinic_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'client_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'direction',
            type: 'enum',
            enum: ['inbound', 'outbound'],
            isNullable: false,
          },
          {
            name: 'provider_message_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'WhatsApp message ID (wamid)',
          },
          {
            name: 'provider_parent_message_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'For threaded replies',
          },
          {
            name: 'message_type',
            type: 'varchar',
            length: '50',
            isNullable: false,
            comment: 'text, image, document, template, location, contact, sticker',
          },
          {
            name: 'template_name',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'payload_json',
            type: 'jsonb',
            isNullable: true,
            comment: 'Full message payload from provider',
          },
          {
            name: 'normalized_text',
            type: 'text',
            isNullable: true,
            comment: 'Plain text extracted for search',
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'sent', 'delivered', 'read', 'failed'],
            default: `'sent'`,
            isNullable: false,
          },
          {
            name: 'sent_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'delivered_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'read_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'failed_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'error_code',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'error_message',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Indexes for conversation_messages
    await queryRunner.createIndex(
      'conversation_messages',
      new TableIndex({
        name: 'IDX_conversation_messages_conversation_created',
        columnNames: ['conversation_id', 'created_at'],
      }),
    );

    await queryRunner.createIndex(
      'conversation_messages',
      new TableIndex({
        name: 'IDX_conversation_messages_clinic_created',
        columnNames: ['clinic_id', 'created_at'],
      }),
    );

    await queryRunner.createIndex(
      'conversation_messages',
      new TableIndex({
        name: 'IDX_conversation_messages_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'conversation_messages',
      new TableIndex({
        name: 'IDX_conversation_messages_provider_id',
        columnNames: ['provider_message_id'],
      }),
    );

    // Foreign keys for conversation_messages
    await queryRunner.createForeignKey(
      'conversation_messages',
      new TableForeignKey({
        columnNames: ['conversation_id'],
        referencedTableName: 'whatsapp_conversations',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'conversation_messages',
      new TableForeignKey({
        columnNames: ['clinic_id'],
        referencedTableName: 'clinics',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'conversation_messages',
      new TableForeignKey({
        columnNames: ['client_id'],
        referencedTableName: 'clients',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    console.log('  ✓ conversation_messages table created');

    // ============================================================================
    // 3. whatsapp_templates - Template management
    // ============================================================================
    await queryRunner.createTable(
      new Table({
        name: 'whatsapp_templates',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'clinic_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'category',
            type: 'enum',
            enum: ['AUTHENTICATION', 'MARKETING', 'UTILITY'],
            default: `'UTILITY'`,
            isNullable: false,
          },
          {
            name: 'language_code',
            type: 'varchar',
            length: '10',
            default: `'es'`,
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['draft', 'submitted', 'approved', 'rejected', 'paused', 'disabled'],
            default: `'draft'`,
            isNullable: false,
          },
          {
            name: 'header_type',
            type: 'varchar',
            length: '50',
            isNullable: true,
            comment: 'IMAGE, VIDEO, DOCUMENT, TEXT',
          },
          {
            name: 'body_text',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'footer_text',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'buttons_json',
            type: 'jsonb',
            isNullable: true,
            comment: 'Button definitions',
          },
          {
            name: 'variables_json',
            type: 'jsonb',
            isNullable: true,
            comment: 'Variable placeholders',
          },
          {
            name: 'provider_template_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'Meta template ID',
          },
          {
            name: 'rejected_reason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Indexes for whatsapp_templates
    await queryRunner.createIndex(
      'whatsapp_templates',
      new TableIndex({
        name: 'IDX_whatsapp_templates_clinic_status',
        columnNames: ['clinic_id', 'status'],
      }),
    );

    await queryRunner.createIndex(
      'whatsapp_templates',
      new TableIndex({
        name: 'IDX_whatsapp_templates_clinic_name',
        columnNames: ['clinic_id', 'name'],
      }),
    );

    await queryRunner.createIndex(
      'whatsapp_templates',
      new TableIndex({
        name: 'IDX_whatsapp_templates_provider_id',
        columnNames: ['provider_template_id'],
      }),
    );

    // Foreign key for whatsapp_templates
    await queryRunner.createForeignKey(
      'whatsapp_templates',
      new TableForeignKey({
        columnNames: ['clinic_id'],
        referencedTableName: 'clinics',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    console.log('  ✓ whatsapp_templates table created');

    // ============================================================================
    // 4. whatsapp_webhook_events - Raw webhook storage
    // ============================================================================
    await queryRunner.createTable(
      new Table({
        name: 'whatsapp_webhook_events',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'clinic_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'provider',
            type: 'varchar',
            length: '50',
            default: `'meta'`,
            isNullable: false,
          },
          {
            name: 'event_type',
            type: 'enum',
            enum: ['message', 'message_status', 'message_template_feedback', 'phone_number_quality'],
            isNullable: false,
          },
          {
            name: 'provider_event_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'payload_json',
            type: 'jsonb',
            isNullable: false,
            comment: 'Full webhook payload',
          },
          {
            name: 'received_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'processed_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'processing_status',
            type: 'enum',
            enum: ['pending', 'processing', 'processed', 'failed'],
            default: `'pending'`,
            isNullable: false,
          },
          {
            name: 'retry_count',
            type: 'integer',
            default: 0,
            isNullable: false,
          },
          {
            name: 'error_message',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Indexes for whatsapp_webhook_events
    await queryRunner.createIndex(
      'whatsapp_webhook_events',
      new TableIndex({
        name: 'IDX_whatsapp_webhook_events_clinic_type',
        columnNames: ['clinic_id', 'event_type'],
      }),
    );

    await queryRunner.createIndex(
      'whatsapp_webhook_events',
      new TableIndex({
        name: 'IDX_whatsapp_webhook_events_clinic_status',
        columnNames: ['clinic_id', 'processing_status'],
      }),
    );

    await queryRunner.createIndex(
      'whatsapp_webhook_events',
      new TableIndex({
        name: 'IDX_whatsapp_webhook_events_processed',
        columnNames: ['processed_at'],
      }),
    );

    await queryRunner.createIndex(
      'whatsapp_webhook_events',
      new TableIndex({
        name: 'IDX_whatsapp_webhook_events_provider_id',
        columnNames: ['provider_event_id'],
      }),
    );

    console.log('  ✓ whatsapp_webhook_events table created');

    // ============================================================================
    // 5. whatsapp_conversation_transitions - State machine tracking
    // ============================================================================
    await queryRunner.createTable(
      new Table({
        name: 'whatsapp_conversation_transitions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'conversation_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'from_state',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'to_state',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'trigger_type',
            type: 'varchar',
            length: '100',
            isNullable: true,
            comment: 'user_message, bot_action, timeout, human_handoff',
          },
          {
            name: 'trigger_value',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'metadata_json',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Indexes for whatsapp_conversation_transitions
    await queryRunner.createIndex(
      'whatsapp_conversation_transitions',
      new TableIndex({
        name: 'IDX_whatsapp_conversation_transitions_conversation_created',
        columnNames: ['conversation_id', 'created_at'],
      }),
    );

    await queryRunner.createIndex(
      'whatsapp_conversation_transitions',
      new TableIndex({
        name: 'IDX_whatsapp_conversation_transitions_states',
        columnNames: ['from_state', 'to_state'],
      }),
    );

    // Foreign key for whatsapp_conversation_transitions
    await queryRunner.createForeignKey(
      'whatsapp_conversation_transitions',
      new TableForeignKey({
        columnNames: ['conversation_id'],
        referencedTableName: 'whatsapp_conversations',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    console.log('  ✓ whatsapp_conversation_transitions table created');

    console.log('✅ WhatsApp Conversational Messaging Infrastructure created successfully');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('🔙 [MIGRATION] Rolling back WhatsApp Conversational Messaging Infrastructure...');

    await queryRunner.dropTable('whatsapp_conversation_transitions', true);
    await queryRunner.dropTable('whatsapp_webhook_events', true);
    await queryRunner.dropTable('whatsapp_templates', true);
    await queryRunner.dropTable('conversation_messages', true);
    await queryRunner.dropTable('whatsapp_conversations', true);

    console.log('✅ Rollback completed');
  }
}
