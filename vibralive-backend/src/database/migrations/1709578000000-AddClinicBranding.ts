import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddClinicBranding1709578000000 implements MigrationInterface {
  name = 'AddClinicBranding1709578000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add slug column to clinics table
    await queryRunner.query(`
      ALTER TABLE "clinics" ADD COLUMN IF NOT EXISTS "slug" varchar(100) UNIQUE
    `);

    // Generate slugs for existing clinics
    await queryRunner.query(`
      UPDATE "clinics" 
      SET "slug" = LOWER(REGEXP_REPLACE(REGEXP_REPLACE("name", '[^a-zA-Z0-9\\s]', '', 'g'), '\\s+', '-', 'g'))
      WHERE "slug" IS NULL
    `);

    await queryRunner.query(`
      CREATE TABLE "clinic_branding" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "clinic_id" uuid NOT NULL,
        
        -- Logo & Images
        "logo_url" varchar,
        "logo_dark_url" varchar,
        "favicon_url" varchar,
        "login_background_url" varchar,
        
        -- Brand Identity
        "brand_name" varchar,
        "tagline" varchar,
        
        -- Primary Colors
        "primary_color" varchar NOT NULL DEFAULT '#0ea5e9',
        "primary_color_light" varchar NOT NULL DEFAULT '#38bdf8',
        "primary_color_dark" varchar NOT NULL DEFAULT '#0284c7',
        
        -- Secondary/Accent Colors
        "secondary_color" varchar NOT NULL DEFAULT '#8b5cf6',
        "accent_color" varchar NOT NULL DEFAULT '#f59e0b',
        
        -- Navigation Colors
        "sidebar_bg_color" varchar NOT NULL DEFAULT '#0f172a',
        "sidebar_text_color" varchar NOT NULL DEFAULT '#e2e8f0',
        "sidebar_active_bg" varchar NOT NULL DEFAULT '#1e293b',
        "sidebar_active_text" varchar NOT NULL DEFAULT '#38bdf8',
        
        -- TopBar Colors
        "topbar_bg_color" varchar NOT NULL DEFAULT '#ffffff',
        "topbar_text_color" varchar NOT NULL DEFAULT '#1e293b',
        
        -- Login Page
        "login_gradient_from" varchar NOT NULL DEFAULT '#2563eb',
        "login_gradient_to" varchar NOT NULL DEFAULT '#1d4ed8',
        "login_text_color" varchar NOT NULL DEFAULT '#ffffff',
        
        -- Typography
        "font_family" varchar NOT NULL DEFAULT 'Inter',
        "heading_font_family" varchar,
        
        -- Border Radius
        "border_radius" varchar NOT NULL DEFAULT '0.5rem',
        "button_radius" varchar NOT NULL DEFAULT '0.5rem',
        
        -- Custom Features Display
        "features_json" text,
        
        -- Footer & Legal
        "footer_text" varchar,
        "privacy_policy_url" varchar,
        "terms_url" varchar,
        
        -- Custom CSS
        "custom_css" text,
        
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        
        CONSTRAINT "PK_clinic_branding" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_clinic_branding_clinic" UNIQUE ("clinic_id"),
        CONSTRAINT "FK_clinic_branding_clinic" FOREIGN KEY ("clinic_id") 
          REFERENCES "clinics"("id") ON DELETE CASCADE
      )
    `);

    // Create index for faster lookups
    await queryRunner.query(`
      CREATE INDEX "IDX_clinic_branding_clinic_id" ON "clinic_branding" ("clinic_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_clinic_branding_clinic_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "clinic_branding"`);
    await queryRunner.query(`ALTER TABLE "clinics" DROP COLUMN IF EXISTS "slug"`);
  }
}
