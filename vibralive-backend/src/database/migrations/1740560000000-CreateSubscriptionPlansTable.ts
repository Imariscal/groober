import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateSubscriptionPlansTable1740560000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create subscription_plans table
    const tableExists = await queryRunner.hasTable('subscription_plans');
    if (!tableExists) {
      await queryRunner.createTable(
        new Table({
          name: 'subscription_plans',
          columns: [
            {
              name: 'id',
              type: 'uuid',
              isPrimary: true,
              generationStrategy: 'uuid',
              default: 'gen_random_uuid()',
            },
            {
              name: 'code',
              type: 'varchar',
              length: '50',
              isUnique: true,
            },
            {
              name: 'name',
              type: 'varchar',
              length: '100',
            },
            {
              name: 'description',
              type: 'text',
              isNullable: true,
            },
            {
              name: 'price',
              type: 'decimal',
              precision: 10,
              scale: 2,
              default: 0,
            },
            {
              name: 'currency',
              type: 'varchar',
              length: '10',
              default: "'MXN'",
            },
            {
              name: 'billing_period',
              type: 'varchar',
              length: '20',
              default: "'monthly'",
            },
            {
              name: 'max_staff_users',
              type: 'integer',
              default: 5,
            },
            {
              name: 'max_clients',
              type: 'integer',
              default: 100,
            },
            {
              name: 'max_pets',
              type: 'integer',
              default: 200,
            },
            {
              name: 'features',
              type: 'jsonb',
              default: "'[]'",
            },
            {
              name: 'status',
              type: 'varchar',
              length: '20',
              default: "'active'",
            },
            {
              name: 'sort_order',
              type: 'integer',
              default: 0,
            },
            {
              name: 'is_popular',
              type: 'boolean',
              default: false,
            },
            {
              name: 'created_at',
              type: 'timestamp',
              default: 'NOW()',
            },
            {
              name: 'updated_at',
              type: 'timestamp',
              default: 'NOW()',
            },
          ],
        }),
        true,
      );

      // Create index on code
      await queryRunner.createIndex(
        'subscription_plans',
        new TableIndex({
          name: 'IDX_subscription_plans_code',
          columnNames: ['code'],
        }),
      );

      // Create index on status
      await queryRunner.createIndex(
        'subscription_plans',
        new TableIndex({
          name: 'IDX_subscription_plans_status',
          columnNames: ['status'],
        }),
      );

      // Seed default plans
      await queryRunner.query(`
        INSERT INTO subscription_plans (id, code, name, description, price, currency, billing_period, max_staff_users, max_clients, max_pets, features, status, sort_order, is_popular)
        VALUES 
          (gen_random_uuid(), 'starter', 'Starter', 'Plan perfecto para clínicas pequeñas que están comenzando', 99, 'MXN', 'monthly', 5, 100, 200, '["Dashboard básico", "Gestión de clientes", "Recordatorios por WhatsApp", "Soporte por email"]'::jsonb, 'active', 1, false),
          (gen_random_uuid(), 'professional', 'Professional', 'Plan ideal para clínicas en crecimiento', 299, 'MXN', 'monthly', 20, 500, 1000, '["Todo de Starter", "Reportes avanzados", "API access", "Soporte prioritario", "Múltiples usuarios"]'::jsonb, 'active', 2, true),
          (gen_random_uuid(), 'enterprise', 'Enterprise', 'Plan para grandes clínicas y cadenas veterinarias', 999, 'MXN', 'monthly', 100, 5000, 10000, '["Todo de Professional", "SLA garantizado", "Integración custom", "Soporte 24/7", "Capacitación personalizada", "Manager dedicado"]'::jsonb, 'active', 3, false)
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('subscription_plans', true);
  }
}
