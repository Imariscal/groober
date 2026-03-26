import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWhatsAppMultitenantTables1738003200000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1️⃣ CREATE: whatsapp_config (GLOBAL - Credenciales Twilio)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS whatsapp_config (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        
        -- Identificación
        name VARCHAR(100) NOT NULL UNIQUE,
        provider VARCHAR(50) NOT NULL DEFAULT 'twilio',
        
        -- Credenciales
        account_sid VARCHAR(255) NOT NULL,
        auth_token TEXT NOT NULL,
        
        -- Limits globales
        global_daily_limit INTEGER DEFAULT 50000,
        
        -- Webhook
        webhook_url VARCHAR(255),
        webhook_secret TEXT,
        
        -- Status
        is_active BOOLEAN DEFAULT TRUE,
        is_verified BOOLEAN DEFAULT FALSE,
        last_verified_at TIMESTAMP WITH TIME ZONE,
        
        -- Auditoría
        last_error TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      
      COMMENT ON TABLE whatsapp_config IS 'Global Twilio/WhatsApp configuración compartida por N clínicas';
      CREATE INDEX idx_whatsapp_config_active ON whatsapp_config(is_active);
      CREATE INDEX idx_whatsapp_config_verified ON whatsapp_config(is_verified);
    `);

    // 2️⃣ ALTER: clinic_whatsapp_config (POR CLÍNICA - Límites + Display)
    await queryRunner.query(`
      ALTER TABLE clinic_whatsapp_config
      ADD COLUMN IF NOT EXISTS whatsapp_config_id UUID 
        REFERENCES whatsapp_config(id) ON DELETE RESTRICT;
    `);

    await queryRunner.query(`
      ALTER TABLE clinic_whatsapp_config
      ADD COLUMN IF NOT EXISTS display_phone VARCHAR(20),
      ADD COLUMN IF NOT EXISTS sender_name VARCHAR(100),
      ADD COLUMN IF NOT EXISTS monthly_message_limit INTEGER NOT NULL DEFAULT 200,
      ADD COLUMN IF NOT EXISTS monthly_messages_used INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS monthly_reset_date DATE,
      ADD COLUMN IF NOT EXISTS last_message_sent_at TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS alert_threshold_percentage INTEGER DEFAULT 80,
      ADD COLUMN IF NOT EXISTS is_alert_sent BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS allows_overage BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS overage_cost_per_message DECIMAL(10, 2) DEFAULT 0.05,
      ADD COLUMN IF NOT EXISTS total_overage_messages INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(50) DEFAULT 'basic',
      ADD COLUMN IF NOT EXISTS send_appointment_confirmation BOOLEAN DEFAULT TRUE,
      ADD COLUMN IF NOT EXISTS send_appointment_reminder BOOLEAN DEFAULT TRUE,
      ADD COLUMN IF NOT EXISTS reminder_hours_before INTEGER DEFAULT 4,
      ADD COLUMN IF NOT EXISTS send_stylist_on_way BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS send_service_completed BOOLEAN DEFAULT FALSE;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_clinic_whatsapp_config_id 
        ON clinic_whatsapp_config(whatsapp_config_id);
      CREATE INDEX IF NOT EXISTS idx_clinic_whatsapp_monthly 
        ON clinic_whatsapp_config(monthly_reset_date);
    `);

    // 3️⃣ CREATE: whatsapp_appointment_tracking (RELACIÓN cita↔WhatsApp)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS whatsapp_appointment_tracking (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        
        -- Multitenant
        clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
        appointment_id UUID NOT NULL UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
        client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
        
        -- Cliente
        phone_number VARCHAR(20) NOT NULL,
        
        -- Timing de cita
        appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
        reminder_sent_at TIMESTAMP WITH TIME ZONE,
        
        -- Status
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        
        -- Webhook tracking
        last_message_id VARCHAR(255),
        last_response_body TEXT,
        last_response_at TIMESTAMP WITH TIME ZONE,
        
        -- Metadata
        metadata_json JSONB DEFAULT '{}',
        notes TEXT,
        
        -- Auditoría
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      
      COMMENT ON TABLE whatsapp_appointment_tracking IS 'Relación 1:1 appointments ↔ WhatsApp tracking. CRÍTICA para identificar clínica en webhook.';
      
      CREATE INDEX idx_whatsapp_track_clinic_phone 
        ON whatsapp_appointment_tracking(clinic_id, phone_number, status);
      
      CREATE INDEX idx_whatsapp_track_status 
        ON whatsapp_appointment_tracking(status, appointment_date)
        WHERE status IN ('pending', 'rescheduled_pending');
      
      CREATE INDEX idx_whatsapp_track_phone 
        ON whatsapp_appointment_tracking(phone_number);
    `);

    // 4️⃣ CREATE: whatsapp_message_usage (BILLING - Cada mensaje)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS whatsapp_message_usage (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        
        clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
        appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
        
        -- Mensaje
        provider_message_id VARCHAR(255) UNIQUE,
        parent_message_id VARCHAR(255),
        direction VARCHAR(20) NOT NULL,
        message_type VARCHAR(50),
        
        -- Billing
        is_billable BOOLEAN DEFAULT TRUE,
        message_cost DECIMAL(10, 2) DEFAULT 0.01,
        was_overage BOOLEAN DEFAULT FALSE,
        
        -- Timestamps
        sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        
        -- Self-referential FK para reply-to tracking
        CONSTRAINT fk_parent_message_id 
          FOREIGN KEY (parent_message_id) REFERENCES whatsapp_message_usage(provider_message_id) ON DELETE SET NULL
      );
      
      COMMENT ON TABLE whatsapp_message_usage IS 'Tracking de CADA mensaje para billing + reply-to identification (ParentMessageSid)';
      
      CREATE INDEX idx_message_usage_clinic_month 
        ON whatsapp_message_usage(clinic_id, DATE_TRUNC('month', sent_at));
      
      CREATE INDEX idx_message_usage_billable 
        ON whatsapp_message_usage(clinic_id, is_billable);
      
      CREATE INDEX idx_message_usage_parent 
        ON whatsapp_message_usage(parent_message_id);
      
      CREATE UNIQUE INDEX idx_provider_message_dedup 
        ON whatsapp_message_usage(provider_message_id) 
        WHERE provider_message_id IS NOT NULL;
    `);

    // 5️⃣ CREATE: whatsapp_monthly_billing (FACTURACIÓN)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS whatsapp_monthly_billing (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        
        clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
        billing_year SMALLINT NOT NULL,
        billing_month SMALLINT NOT NULL CHECK (billing_month >= 1 AND billing_month <= 12),
        
        -- Consumo
        message_limit INTEGER NOT NULL,
        messages_sent INTEGER DEFAULT 0,
        messages_overage INTEGER DEFAULT 0,
        
        -- Costos
        base_price DECIMAL(10, 2),
        overage_cost DECIMAL(10, 2) DEFAULT 0,
        total_cost DECIMAL(10, 2),
        
        -- Invoice
        status VARCHAR(50) DEFAULT 'pending',
        invoice_id VARCHAR(255),
        invoice_date TIMESTAMP WITH TIME ZONE,
        due_date TIMESTAMP WITH TIME ZONE,
        paid_date TIMESTAMP WITH TIME ZONE,
        
        -- Auditoría
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        
        -- Constraint
        UNIQUE(clinic_id, billing_year, billing_month)
      );
      
      COMMENT ON TABLE whatsapp_monthly_billing IS 'Facturación mensual por clínica. Reset 1ro del mes.';
      
      CREATE INDEX idx_billing_clinic_month 
        ON whatsapp_monthly_billing(clinic_id, billing_year, billing_month);
      
      CREATE INDEX idx_billing_pending 
        ON whatsapp_monthly_billing(status) WHERE status = 'pending';
    `);

    // 6️⃣ CREATE: whatsapp_message_recharges (RECARGAS)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS whatsapp_message_recharges (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        
        clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
        
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        unit_price DECIMAL(10, 2) NOT NULL,
        total_amount DECIMAL(10, 2) NOT NULL,
        
        status VARCHAR(50) DEFAULT 'pending',
        payment_method VARCHAR(50),
        transaction_id VARCHAR(255),
        
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP WITH TIME ZONE
      );
      
      COMMENT ON TABLE whatsapp_message_recharges IS 'Historial de recargas de mensajes para overage';
      
      CREATE INDEX idx_recharge_clinic_status 
        ON whatsapp_message_recharges(clinic_id, status);
    `);

    // 7️⃣ INSERT: Datos iniciales para whatsapp_config
    await queryRunner.query(`
      INSERT INTO whatsapp_config (
        name, 
        provider, 
        account_sid, 
        auth_token,
        webhook_url
      ) 
      VALUES (
        'VibraLive Twilio Main',
        'twilio',
        'AC40e066d6faa9f9bd6dd4687cec5a9ee8',
        'd44002a1d669f59c2f6992bfaedbec92',
        'https://vibralive.com/api/webhooks/twilio/messages'
      )
      ON CONFLICT (name) DO NOTHING;
    `);

    // 8️⃣ UPDATE: clinic_whatsapp_config - asignar whatsapp_config_id
    await queryRunner.query(`
      UPDATE clinic_whatsapp_config 
      SET whatsapp_config_id = (SELECT id FROM whatsapp_config LIMIT 1)
      WHERE whatsapp_config_id IS NULL;
    `);

    console.log('✅ WhatsApp Multitenant Tables Migration completed successfully!');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rollback (reverso del orden de creación)
    await queryRunner.query(`
      DROP TABLE IF EXISTS whatsapp_message_recharges CASCADE;
      DROP TABLE IF EXISTS whatsapp_monthly_billing CASCADE;
      DROP TABLE IF EXISTS whatsapp_message_usage CASCADE;
      DROP TABLE IF EXISTS whatsapp_appointment_tracking CASCADE;
      
      ALTER TABLE clinic_whatsapp_config
      DROP COLUMN IF EXISTS whatsapp_config_id CASCADE,
      DROP COLUMN IF EXISTS display_phone,
      DROP COLUMN IF EXISTS sender_name,
      DROP COLUMN IF EXISTS monthly_message_limit,
      DROP COLUMN IF EXISTS monthly_messages_used,
      DROP COLUMN IF EXISTS monthly_reset_date,
      DROP COLUMN IF EXISTS last_message_sent_at,
      DROP COLUMN IF EXISTS alert_threshold_percentage,
      DROP COLUMN IF EXISTS is_alert_sent,
      DROP COLUMN IF EXISTS allows_overage,
      DROP COLUMN IF EXISTS overage_cost_per_message,
      DROP COLUMN IF EXISTS total_overage_messages,
      DROP COLUMN IF EXISTS subscription_tier,
      DROP COLUMN IF EXISTS send_appointment_confirmation,
      DROP COLUMN IF EXISTS send_appointment_reminder,
      DROP COLUMN IF EXISTS reminder_hours_before,
      DROP COLUMN IF EXISTS send_stylist_on_way,
      DROP COLUMN IF EXISTS send_service_completed;
      
      DROP TABLE IF EXISTS whatsapp_config CASCADE;
    `);

    console.log('✅ WhatsApp Multitenant Tables Migration rolled back successfully!');
  }
}
