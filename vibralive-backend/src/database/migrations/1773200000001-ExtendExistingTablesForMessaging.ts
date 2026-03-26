import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

/**
 * Migration: Extend Existing Tables for Conversational Messaging (Optional)
 * 
 * Adds optional columns to support tighter integration between:
 * - message_logs ↔ conversation_messages
 * - whatsapp_outbox ↔ conversation_messages
 * 
 * These changes are backward-compatible and optional.
 * All new columns are nullable.
 */
export class ExtendExistingTablesForMessaging1773200000001 implements MigrationInterface {
  name = 'ExtendExistingTablesForMessaging1773200000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('🚀 [MIGRATION] Extending existing tables for conversational messaging...');

    // ============================================================================
    // 1. Extend message_logs with conversation reference
    // ============================================================================
    const hasConversationIdInMessageLogs = await queryRunner.hasColumn('message_logs', 'conversation_id');
    if (!hasConversationIdInMessageLogs) {
      await queryRunner.addColumn(
        'message_logs',
        new TableColumn({
          name: 'conversation_id',
          type: 'uuid',
          isNullable: true,
          comment: 'Links to whatsapp_conversations for chat threading',
        }),
      );

      // Add index
      await queryRunner.query(
        `CREATE INDEX IDX_message_logs_conversation_id ON message_logs(conversation_id)`,
      );

      console.log('  ✓ message_logs.conversation_id added');
    }

    // Add payload_json to message_logs for structured data
    const hasPayloadInMessageLogs = await queryRunner.hasColumn('message_logs', 'payload_json');
    if (!hasPayloadInMessageLogs) {
      await queryRunner.addColumn(
        'message_logs',
        new TableColumn({
          name: 'payload_json',
          type: 'jsonb',
          isNullable: true,
          comment: 'Structured message payload from provider',
        }),
      );
      console.log('  ✓ message_logs.payload_json added');
    }

    // Add delivered_at if not exists (some systems may already have it)
    const hasDeliveredAtInMessageLogs = await queryRunner.hasColumn('message_logs', 'delivered_at');
    if (!hasDeliveredAtInMessageLogs) {
      await queryRunner.addColumn(
        'message_logs',
        new TableColumn({
          name: 'delivered_at',
          type: 'timestamp with time zone',
          isNullable: true,
        }),
      );
      console.log('  ✓ message_logs.delivered_at added');
    }

    // ============================================================================
    // 2. Extend whatsapp_outbox with conversation reference and template support
    // ============================================================================
    const hasConversationIdInOutbox = await queryRunner.hasColumn('whatsapp_outbox', 'conversation_id');
    if (!hasConversationIdInOutbox) {
      await queryRunner.addColumn(
        'whatsapp_outbox',
        new TableColumn({
          name: 'conversation_id',
          type: 'uuid',
          isNullable: true,
          comment: 'Links to whatsapp_conversations for chat threading',
        }),
      );

      // Add index
      await queryRunner.query(
        `CREATE INDEX IDX_whatsapp_outbox_conversation_id ON whatsapp_outbox(conversation_id)`,
      );

      console.log('  ✓ whatsapp_outbox.conversation_id added');
    }

    // Add template_id reference
    const hasTemplateIdInOutbox = await queryRunner.hasColumn('whatsapp_outbox', 'template_id');
    if (!hasTemplateIdInOutbox) {
      await queryRunner.addColumn(
        'whatsapp_outbox',
        new TableColumn({
          name: 'template_id',
          type: 'uuid',
          isNullable: true,
          comment: 'Reference to whatsapp_templates if this is a template send',
        }),
      );

      // Add index
      await queryRunner.query(
        `CREATE INDEX IDX_whatsapp_outbox_template_id ON whatsapp_outbox(template_id)`,
      );

      console.log('  ✓ whatsapp_outbox.template_id added');
    }

    // Add payload_json for structured messages
    const hasPayloadInOutbox = await queryRunner.hasColumn('whatsapp_outbox', 'payload_json');
    if (!hasPayloadInOutbox) {
      await queryRunner.addColumn(
        'whatsapp_outbox',
        new TableColumn({
          name: 'payload_json',
          type: 'jsonb',
          isNullable: true,
          comment: 'Structured message payload',
        }),
      );
      console.log('  ✓ whatsapp_outbox.payload_json added');
    }

    // Add scheduled_at for future message scheduling
    const hasScheduledAtInOutbox = await queryRunner.hasColumn('whatsapp_outbox', 'scheduled_at');
    if (!hasScheduledAtInOutbox) {
      await queryRunner.addColumn(
        'whatsapp_outbox',
        new TableColumn({
          name: 'scheduled_at',
          type: 'timestamp with time zone',
          isNullable: true,
          comment: 'For scheduling messages to be sent at a future time',
        }),
      );
      console.log('  ✓ whatsapp_outbox.scheduled_at added');
    }

    console.log('✅ Existing tables extended successfully');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('🔙 [MIGRATION] Rolling back table extensions...');

    // Remove from whatsapp_outbox
    const columns = ['scheduled_at', 'payload_json', 'template_id', 'conversation_id'];
    for (const col of columns) {
      const hasColumn = await queryRunner.hasColumn('whatsapp_outbox', col);
      if (hasColumn) {
        await queryRunner.dropColumn('whatsapp_outbox', col);
      }
    }

    // Remove from message_logs
    const messageCols = ['payload_json', 'delivered_at', 'conversation_id'];
    for (const col of messageCols) {
      const hasColumn = await queryRunner.hasColumn('message_logs', col);
      if (hasColumn) {
        await queryRunner.dropColumn('message_logs', col);
      }
    }

    console.log('✅ Rollback completed');
  }
}
