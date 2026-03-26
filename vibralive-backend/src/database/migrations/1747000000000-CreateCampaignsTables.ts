import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

/**
 * Migration: Create Campaigns Module Tables
 * 
 * Creates 4 new tables for the Campaigns module:
 * 1. campaign_templates - Reusable campaign templates
 * 2. campaigns - Individual campaign executions
 * 3. campaign_recipients - Individual message recipients
 * 4. email_outbox - Outbound email queue
 * 
 * Date: March 9, 2026
 * Status: Production Ready
 */
export class CreateCampaignsTables1747000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('📧 Starting Campaigns Module migration...');

    // ============================================================================
    // 1. Create campaign_templates table
    // ============================================================================
    const campaignTemplatesTableExists = await queryRunner.hasTable(
      'campaign_templates',
    );
    if (!campaignTemplatesTableExists) {
      await queryRunner.createTable(
        new Table({
          name: 'campaign_templates',
          columns: [
            {
              name: 'id',
              type: 'uuid',
              isPrimary: true,
              generationStrategy: 'uuid',
              default: 'gen_random_uuid()',
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
              name: 'description',
              type: 'text',
              isNullable: true,
            },
            {
              name: 'channel',
              type: 'varchar',
              length: '50',
              isNullable: false,
            },
            {
              name: 'subject',
              type: 'varchar',
              length: '255',
              isNullable: true,
              comment: 'Email subject line',
            },
            {
              name: 'body',
              type: 'text',
              isNullable: false,
              comment: 'Plain text body (supports {{variables}})',
            },
            {
              name: 'body_html',
              type: 'text',
              isNullable: true,
              comment: 'HTML body for emails',
            },
            {
              name: 'preview_text',
              type: 'varchar',
              length: '255',
              isNullable: true,
              comment: 'Email preview text',
            },
            {
              name: 'whatsapp_template_name',
              type: 'varchar',
              length: '255',
              isNullable: true,
              comment: 'WhatsApp template name in Meta account',
            },
            {
              name: 'whatsapp_template_language',
              type: 'varchar',
              length: '10',
              isNullable: true,
              comment: 'WhatsApp template language code',
            },
            {
              name: 'variables_json',
              type: 'jsonb',
              isNullable: true,
              comment: 'List of variables: {"variables": ["clientName", "petName", ...]}',
            },
            {
              name: 'is_active',
              type: 'boolean',
              default: true,
              isNullable: false,
            },
            {
              name: 'created_by_user_id',
              type: 'uuid',
              isNullable: false,
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
          foreignKeys: [
            {
              columnNames: ['clinic_id'],
              referencedTableName: 'clinics',
              referencedColumnNames: ['id'],
              onDelete: 'CASCADE',
            },
            {
              columnNames: ['created_by_user_id'],
              referencedTableName: 'users',
              referencedColumnNames: ['id'],
              onDelete: 'RESTRICT',
            },
          ],
        }),
        true,
      );

      // Create indices for campaign_templates
      await queryRunner.createIndices('campaign_templates', [
        new TableIndex({
          name: 'IDX_campaign_templates_clinic_id',
          columnNames: ['clinic_id'],
        }),
        new TableIndex({
          name: 'IDX_campaign_templates_channel',
          columnNames: ['channel'],
        }),
        new TableIndex({
          name: 'IDX_campaign_templates_is_active',
          columnNames: ['is_active'],
        }),
        new TableIndex({
          name: 'IDX_campaign_templates_clinic_channel',
          columnNames: ['clinic_id', 'channel'],
        }),
      ]);

      console.log('  ✓ campaign_templates table created');
    }

    // ============================================================================
    // 2. Create campaigns table
    // ============================================================================
    const campaignsTableExists = await queryRunner.hasTable('campaigns');
    if (!campaignsTableExists) {
      await queryRunner.createTable(
        new Table({
          name: 'campaigns',
          columns: [
            {
              name: 'id',
              type: 'uuid',
              isPrimary: true,
              generationStrategy: 'uuid',
              default: 'gen_random_uuid()',
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
              name: 'description',
              type: 'text',
              isNullable: true,
            },
            {
              name: 'channel',
              type: 'varchar',
              length: '50',
              isNullable: false,
            },
            {
              name: 'campaign_template_id',
              type: 'uuid',
              isNullable: false,
            },
            {
              name: 'status',
              type: 'varchar',
              length: '50',
              default: "'DRAFT'",
              isNullable: false,
            },
            {
              name: 'filters_json',
              type: 'jsonb',
              isNullable: false,
              comment: 'Audience filters: {"species": ["DOG"], "sex": ["FEMALE"], ...}',
            },
            {
              name: 'scheduled_at',
              type: 'timestamp with time zone',
              isNullable: true,
            },
            {
              name: 'started_at',
              type: 'timestamp with time zone',
              isNullable: true,
            },
            {
              name: 'completed_at',
              type: 'timestamp with time zone',
              isNullable: true,
            },
            {
              name: 'estimated_recipients',
              type: 'integer',
              default: 0,
              isNullable: false,
            },
            {
              name: 'actual_recipients',
              type: 'integer',
              default: 0,
              isNullable: false,
            },
            {
              name: 'successful_count',
              type: 'integer',
              default: 0,
              isNullable: false,
            },
            {
              name: 'failed_count',
              type: 'integer',
              default: 0,
              isNullable: false,
            },
            {
              name: 'skipped_count',
              type: 'integer',
              default: 0,
              isNullable: false,
            },
            {
              name: 'opened_count',
              type: 'integer',
              default: 0,
              isNullable: false,
            },
            {
              name: 'read_count',
              type: 'integer',
              default: 0,
              isNullable: false,
            },
            {
              name: 'created_by_user_id',
              type: 'uuid',
              isNullable: false,
            },
            {
              name: 'paused_by_user_id',
              type: 'uuid',
              isNullable: true,
            },
            {
              name: 'paused_at',
              type: 'timestamp with time zone',
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
          foreignKeys: [
            {
              columnNames: ['clinic_id'],
              referencedTableName: 'clinics',
              referencedColumnNames: ['id'],
              onDelete: 'CASCADE',
            },
            {
              columnNames: ['campaign_template_id'],
              referencedTableName: 'campaign_templates',
              referencedColumnNames: ['id'],
              onDelete: 'RESTRICT',
            },
            {
              columnNames: ['created_by_user_id'],
              referencedTableName: 'users',
              referencedColumnNames: ['id'],
              onDelete: 'RESTRICT',
            },
            {
              columnNames: ['paused_by_user_id'],
              referencedTableName: 'users',
              referencedColumnNames: ['id'],
              onDelete: 'SET NULL',
            },
          ],
        }),
        true,
      );

      // Create indices for campaigns
      await queryRunner.createIndices('campaigns', [
        new TableIndex({
          name: 'IDX_campaigns_clinic_id',
          columnNames: ['clinic_id'],
        }),
        new TableIndex({
          name: 'IDX_campaigns_status',
          columnNames: ['status'],
        }),
        new TableIndex({
          name: 'IDX_campaigns_scheduled_at',
          columnNames: ['scheduled_at'],
        }),
        new TableIndex({
          name: 'IDX_campaigns_clinic_created_at',
          columnNames: ['clinic_id', 'created_at'],
        }),
        new TableIndex({
          name: 'IDX_campaigns_clinic_status',
          columnNames: ['clinic_id', 'status'],
        }),
      ]);

      console.log('  ✓ campaigns table created');
    }

    // ============================================================================
    // 3. Create campaign_recipients table
    // ============================================================================
    const campaignRecipientsTableExists = await queryRunner.hasTable(
      'campaign_recipients',
    );
    if (!campaignRecipientsTableExists) {
      await queryRunner.createTable(
        new Table({
          name: 'campaign_recipients',
          columns: [
            {
              name: 'id',
              type: 'uuid',
              isPrimary: true,
              generationStrategy: 'uuid',
              default: 'gen_random_uuid()',
            },
            {
              name: 'campaign_id',
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
              isNullable: true,
            },
            {
              name: 'pet_id',
              type: 'uuid',
              isNullable: true,
            },
            {
              name: 'channel',
              type: 'varchar',
              length: '50',
              isNullable: false,
            },
            {
              name: 'recipient_name',
              type: 'varchar',
              length: '255',
              isNullable: true,
              comment: 'Name captured at send time',
            },
            {
              name: 'recipient_email',
              type: 'varchar',
              length: '255',
              isNullable: true,
              comment: 'Email captured at send time',
            },
            {
              name: 'recipient_phone',
              type: 'varchar',
              length: '20',
              isNullable: true,
              comment: 'Phone captured at send time',
            },
            {
              name: 'status',
              type: 'varchar',
              length: '50',
              default: "'PENDING'",
              isNullable: false,
            },
            {
              name: 'skip_reason',
              type: 'varchar',
              length: '255',
              isNullable: true,
            },
            {
              name: 'message_log_id',
              type: 'uuid',
              isNullable: true,
            },
            {
              name: 'provider_message_id',
              type: 'varchar',
              length: '255',
              isNullable: true,
              comment: 'wamid from Meta or email provider ID',
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
              name: 'opened_at',
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
              length: '100',
              isNullable: true,
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
            {
              name: 'updated_at',
              type: 'timestamp with time zone',
              default: 'CURRENT_TIMESTAMP',
              isNullable: false,
            },
          ],
          foreignKeys: [
            {
              columnNames: ['campaign_id'],
              referencedTableName: 'campaigns',
              referencedColumnNames: ['id'],
              onDelete: 'CASCADE',
            },
            {
              columnNames: ['clinic_id'],
              referencedTableName: 'clinics',
              referencedColumnNames: ['id'],
              onDelete: 'CASCADE',
            },
            {
              columnNames: ['client_id'],
              referencedTableName: 'clients',
              referencedColumnNames: ['id'],
              onDelete: 'SET NULL',
            },
            {
              columnNames: ['pet_id'],
              referencedTableName: 'pets',
              referencedColumnNames: ['id'],
              onDelete: 'SET NULL',
            },
            {
              columnNames: ['message_log_id'],
              referencedTableName: 'message_logs',
              referencedColumnNames: ['id'],
              onDelete: 'SET NULL',
            },
          ],
        }),
        true,
      );

      // Create indices for campaign_recipients
      await queryRunner.createIndices('campaign_recipients', [
        new TableIndex({
          name: 'IDX_campaign_recipients_campaign_id',
          columnNames: ['campaign_id'],
        }),
        new TableIndex({
          name: 'IDX_campaign_recipients_clinic_id',
          columnNames: ['clinic_id'],
        }),
        new TableIndex({
          name: 'IDX_campaign_recipients_status',
          columnNames: ['status'],
        }),
        new TableIndex({
          name: 'IDX_campaign_recipients_campaign_status',
          columnNames: ['campaign_id', 'status'],
        }),
        new TableIndex({
          name: 'IDX_campaign_recipients_email',
          columnNames: ['recipient_email'],
        }),
        new TableIndex({
          name: 'IDX_campaign_recipients_phone',
          columnNames: ['recipient_phone'],
        }),
      ]);

      console.log('  ✓ campaign_recipients table created');
    }

    // ============================================================================
    // 4. Create email_outbox table
    // ============================================================================
    const emailOutboxTableExists = await queryRunner.hasTable('email_outbox');
    if (!emailOutboxTableExists) {
      await queryRunner.createTable(
        new Table({
          name: 'email_outbox',
          columns: [
            {
              name: 'id',
              type: 'uuid',
              isPrimary: true,
              generationStrategy: 'uuid',
              default: 'gen_random_uuid()',
            },
            {
              name: 'clinic_id',
              type: 'uuid',
              isNullable: false,
            },
            {
              name: 'client_id',
              type: 'uuid',
              isNullable: true,
            },
            {
              name: 'campaign_recipient_id',
              type: 'uuid',
              isNullable: true,
            },
            {
              name: 'to_email',
              type: 'varchar',
              length: '255',
              isNullable: false,
            },
            {
              name: 'subject',
              type: 'varchar',
              length: '255',
              isNullable: false,
            },
            {
              name: 'body',
              type: 'text',
              isNullable: false,
            },
            {
              name: 'body_html',
              type: 'text',
              isNullable: true,
            },
            {
              name: 'status',
              type: 'varchar',
              length: '50',
              default: "'PENDING'",
              isNullable: false,
            },
            {
              name: 'retry_count',
              type: 'integer',
              default: 0,
              isNullable: false,
            },
            {
              name: 'max_retries',
              type: 'integer',
              default: 3,
              isNullable: false,
            },
            {
              name: 'last_retry_at',
              type: 'timestamp with time zone',
              isNullable: true,
            },
            {
              name: 'provider_message_id',
              type: 'varchar',
              length: '255',
              isNullable: true,
            },
            {
              name: 'provider_response',
              type: 'jsonb',
              isNullable: true,
            },
            {
              name: 'scheduled_at',
              type: 'timestamp with time zone',
              isNullable: true,
            },
            {
              name: 'sent_at',
              type: 'timestamp with time zone',
              isNullable: true,
            },
            {
              name: 'error_code',
              type: 'varchar',
              length: '100',
              isNullable: true,
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
            {
              name: 'updated_at',
              type: 'timestamp with time zone',
              default: 'CURRENT_TIMESTAMP',
              isNullable: false,
            },
          ],
          foreignKeys: [
            {
              columnNames: ['clinic_id'],
              referencedTableName: 'clinics',
              referencedColumnNames: ['id'],
              onDelete: 'CASCADE',
            },
            {
              columnNames: ['client_id'],
              referencedTableName: 'clients',
              referencedColumnNames: ['id'],
              onDelete: 'SET NULL',
            },
            {
              columnNames: ['campaign_recipient_id'],
              referencedTableName: 'campaign_recipients',
              referencedColumnNames: ['id'],
              onDelete: 'CASCADE',
            },
          ],
        }),
        true,
      );

      // Create indices for email_outbox
      await queryRunner.createIndices('email_outbox', [
        new TableIndex({
          name: 'IDX_email_outbox_clinic_status',
          columnNames: ['clinic_id', 'status'],
        }),
        new TableIndex({
          name: 'IDX_email_outbox_email',
          columnNames: ['to_email'],
        }),
        new TableIndex({
          name: 'IDX_email_outbox_campaign_recipient',
          columnNames: ['campaign_recipient_id'],
        }),
        new TableIndex({
          name: 'IDX_email_outbox_created_at',
          columnNames: ['created_at'],
        }),
        new TableIndex({
          name: 'IDX_email_outbox_clinic_created_at',
          columnNames: ['clinic_id', 'created_at'],
        }),
      ]);

      console.log('  ✓ email_outbox table created');
    }

    console.log('✅ Campaigns Module migration completed successfully');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('⏮️  Rolling back Campaigns Module migration...');

    // Drop in reverse order of dependencies
    await queryRunner.dropTable('email_outbox', true);
    console.log('  ✓ email_outbox table dropped');

    await queryRunner.dropTable('campaign_recipients', true);
    console.log('  ✓ campaign_recipients table dropped');

    await queryRunner.dropTable('campaigns', true);
    console.log('  ✓ campaigns table dropped');

    await queryRunner.dropTable('campaign_templates', true);
    console.log('  ✓ campaign_templates table dropped');

    console.log('✅ Campaigns Module rollback completed');
  }
}
