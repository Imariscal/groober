import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddClinicCommunicationConfig1709574000000 implements MigrationInterface {
  name = 'AddClinicCommunicationConfig1709574000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Crear enum para proveedores de email
    await queryRunner.query(`
      CREATE TYPE "email_provider_enum" AS ENUM (
        'smtp',
        'sendgrid',
        'mailgun',
        'ses',
        'resend',
        'postmark',
        'platform'
      )
    `);

    // 2. Crear enum para proveedores de WhatsApp
    await queryRunner.query(`
      CREATE TYPE "whatsapp_provider_enum" AS ENUM (
        'meta',
        'twilio',
        '360dialog',
        'messagebird',
        'vonage',
        'wati'
      )
    `);

    // 3. Crear enum para canales de mensaje
    await queryRunner.query(`
      CREATE TYPE "message_channel_enum" AS ENUM (
        'email',
        'whatsapp',
        'sms',
        'push'
      )
    `);

    // 4. Crear enum para triggers de mensaje
    await queryRunner.query(`
      CREATE TYPE "message_trigger_enum" AS ENUM (
        'appointment_scheduled',
        'appointment_confirmed',
        'appointment_reminder',
        'appointment_same_day',
        'appointment_cancelled',
        'appointment_rescheduled',
        'stylist_on_way',
        'stylist_arrived',
        'pet_checked_in',
        'service_in_progress',
        'service_completed',
        'pet_ready_pickup',
        'appointment_follow_up',
        'review_request',
        'payment_received',
        'payment_reminder',
        'invoice_sent',
        'welcome',
        'birthday',
        'pet_birthday',
        'loyalty_reward',
        'vaccination_reminder',
        'grooming_due'
      )
    `);

    // 5. Crear enum para timing de mensaje
    await queryRunner.query(`
      CREATE TYPE "message_timing_enum" AS ENUM (
        'immediate',
        'hours_before',
        'days_before',
        'hours_after',
        'days_after',
        'scheduled'
      )
    `);

    // 6. Crear tabla clinic_billing_config
    await queryRunner.query(`
      CREATE TABLE "clinic_billing_config" (
        "clinic_id" uuid NOT NULL,
        "legal_name" varchar(200),
        "tax_id" varchar(20),
        "tax_regime" varchar(100),
        "fiscal_address" varchar(300),
        "fiscal_city" varchar(100),
        "fiscal_state" varchar(100),
        "fiscal_zip" varchar(20),
        "fiscal_country" varchar(3) NOT NULL DEFAULT 'MX',
        "billing_email" varchar(255),
        "billing_phone" varchar(20),
        "currency" varchar(10) NOT NULL DEFAULT 'MXN',
        "tax_rate" decimal(5,2) NOT NULL DEFAULT 16.00,
        "invoice_prefix" varchar(50),
        "invoice_next_number" integer NOT NULL DEFAULT 1,
        "invoice_logo_url" text,
        "invoice_footer_text" text,
        "billing_provider" varchar(50),
        "billing_api_key" text,
        "is_billing_active" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "pk_clinic_billing_config" PRIMARY KEY ("clinic_id"),
        CONSTRAINT "fk_clinic_billing_config_clinic" FOREIGN KEY ("clinic_id") 
          REFERENCES "clinics"("id") ON DELETE CASCADE
      )
    `);

    // 7. Crear tabla clinic_email_config
    await queryRunner.query(`
      CREATE TABLE "clinic_email_config" (
        "clinic_id" uuid NOT NULL,
        "provider" "email_provider_enum" NOT NULL DEFAULT 'platform',
        "smtp_host" varchar(255),
        "smtp_port" integer,
        "smtp_user" varchar(255),
        "smtp_password" text,
        "smtp_secure" boolean NOT NULL DEFAULT true,
        "api_key" text,
        "api_domain" varchar(255),
        "from_email" varchar(255),
        "from_name" varchar(255),
        "reply_to_email" varchar(255),
        "is_active" boolean NOT NULL DEFAULT false,
        "is_verified" boolean NOT NULL DEFAULT false,
        "last_verified_at" TIMESTAMP,
        "last_error" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "pk_clinic_email_config" PRIMARY KEY ("clinic_id"),
        CONSTRAINT "fk_clinic_email_config_clinic" FOREIGN KEY ("clinic_id") 
          REFERENCES "clinics"("id") ON DELETE CASCADE
      )
    `);

    // 8. Crear tabla clinic_whatsapp_config
    await queryRunner.query(`
      CREATE TABLE "clinic_whatsapp_config" (
        "clinic_id" uuid NOT NULL,
        "provider" "whatsapp_provider_enum" NOT NULL DEFAULT 'meta',
        "access_token" text,
        "phone_number_id" varchar(100),
        "business_account_id" varchar(100),
        "app_id" varchar(100),
        "account_sid" varchar(100),
        "auth_token" text,
        "twilio_phone_number" varchar(20),
        "api_key" text,
        "sender_phone" varchar(20),
        "webhook_url" varchar(255),
        "webhook_secret" text,
        "is_active" boolean NOT NULL DEFAULT false,
        "is_verified" boolean NOT NULL DEFAULT false,
        "last_verified_at" TIMESTAMP,
        "last_error" text,
        "daily_limit" integer NOT NULL DEFAULT 1000,
        "messages_sent_today" integer NOT NULL DEFAULT 0,
        "last_reset_date" date,
        "send_appointment_confirmation" boolean NOT NULL DEFAULT true,
        "send_appointment_reminder" boolean NOT NULL DEFAULT true,
        "reminder_hours_before" integer NOT NULL DEFAULT 24,
        "send_stylist_on_way" boolean NOT NULL DEFAULT true,
        "send_service_completed" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "pk_clinic_whatsapp_config" PRIMARY KEY ("clinic_id"),
        CONSTRAINT "fk_clinic_whatsapp_config_clinic" FOREIGN KEY ("clinic_id") 
          REFERENCES "clinics"("id") ON DELETE CASCADE
      )
    `);

    // 9. Crear tabla message_templates
    await queryRunner.query(`
      CREATE TABLE "message_templates" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "clinic_id" uuid NOT NULL,
        "name" varchar(100) NOT NULL,
        "trigger" "message_trigger_enum" NOT NULL,
        "channel" "message_channel_enum" NOT NULL,
        "subject" varchar(255),
        "body" text NOT NULL,
        "body_html" text,
        "timing" "message_timing_enum" NOT NULL DEFAULT 'immediate',
        "timing_value" integer,
        "scheduled_time" time,
        "whatsapp_template_name" varchar(255),
        "whatsapp_template_language" varchar(10),
        "is_active" boolean NOT NULL DEFAULT true,
        "is_system" boolean NOT NULL DEFAULT false,
        "times_sent" integer NOT NULL DEFAULT 0,
        "last_sent_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "pk_message_templates" PRIMARY KEY ("id"),
        CONSTRAINT "fk_message_templates_clinic" FOREIGN KEY ("clinic_id") 
          REFERENCES "clinics"("id") ON DELETE CASCADE
      )
    `);

    // 10. Crear índice compuesto para búsqueda eficiente
    await queryRunner.query(`
      CREATE INDEX "idx_message_templates_clinic_trigger_channel" 
      ON "message_templates" ("clinic_id", "trigger", "channel")
    `);

    console.log('✅ Migration AddClinicCommunicationConfig completed');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "message_templates"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "clinic_whatsapp_config"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "clinic_email_config"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "clinic_billing_config"`);

    // Drop enums
    await queryRunner.query(`DROP TYPE IF EXISTS "message_timing_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "message_trigger_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "message_channel_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "whatsapp_provider_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "email_provider_enum"`);
  }
}
