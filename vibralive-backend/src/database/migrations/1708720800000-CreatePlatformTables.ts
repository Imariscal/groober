import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreatePlatformTables1708720800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create clinics table first (parent table)
    const clinicsTableExists = await queryRunner.hasTable('clinics');
    if (!clinicsTableExists) {
      await queryRunner.createTable(
        new Table({
          name: 'clinics',
          columns: [
            {
              name: 'id',
              type: 'uuid',
              isPrimary: true,
              generationStrategy: 'uuid',
              default: 'gen_random_uuid()',
            },
            {
              name: 'name',
              type: 'varchar',
              length: '255',
            },
            {
              name: 'phone',
              type: 'varchar',
              length: '20',
              isUnique: true,
            },
            {
              name: 'city',
              type: 'varchar',
              length: '100',
              isNullable: true,
            },
            {
              name: 'country',
              type: 'varchar',
              length: '100',
              default: "'MX'",
            },
            {
              name: 'whatsapp_account_id',
              type: 'varchar',
              length: '100',
              isNullable: true,
            },
            {
              name: 'whatsapp_phone_id',
              type: 'varchar',
              length: '100',
              isNullable: true,
            },
            {
              name: 'subscription_plan',
              type: 'varchar',
              length: '50',
              default: "'starter'",
            },
            {
              name: 'status',
              type: 'varchar',
              length: '50',
              default: "'ACTIVE'",
            },
            {
              name: 'created_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
            },
            {
              name: 'updated_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
            },
          ],
        }),
        true,
      );
    }

    // Create users table
    const usersTableExists = await queryRunner.hasTable('users');
    if (!usersTableExists) {
      await queryRunner.createTable(
        new Table({
          name: 'users',
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
              isNullable: true,
            },
            {
              name: 'name',
              type: 'varchar',
              length: '255',
            },
            {
              name: 'email',
              type: 'varchar',
              length: '255',
              isUnique: true,
            },
            {
              name: 'phone',
              type: 'varchar',
              length: '20',
              isNullable: true,
            },
            {
              name: 'hashed_password',
              type: 'varchar',
              length: '255',
            },
            {
              name: 'role',
              type: 'varchar',
              length: '50',
              default: "'staff'",
            },
            {
              name: 'status',
              type: 'varchar',
              length: '50',
              default: "'ACTIVE'",
            },
            {
              name: 'last_login',
              type: 'timestamp',
              isNullable: true,
            },
            {
              name: 'created_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
            },
            {
              name: 'updated_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
            },
          ],
          foreignKeys: [
            {
              columnNames: ['clinic_id'],
              referencedTableName: 'clinics',
              referencedColumnNames: ['id'],
              onDelete: 'CASCADE',
            },
          ],
        }),
        true,
      );
    }

    // Create clients table
    const clientsTableExists = await queryRunner.hasTable('clients');
    if (!clientsTableExists) {
      await queryRunner.createTable(
        new Table({
          name: 'clients',
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
            },
            {
              name: 'name',
              type: 'varchar',
              length: '255',
            },
            {
              name: 'phone',
              type: 'varchar',
              length: '20',
            },
            {
              name: 'email',
              type: 'varchar',
              length: '255',
              isNullable: true,
            },
            {
              name: 'address',
              type: 'varchar',
              length: '500',
              isNullable: true,
            },
            {
              name: 'notes',
              type: 'text',
              isNullable: true,
            },
            {
              name: 'created_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
            },
            {
              name: 'updated_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
            },
          ],
          uniques: [
            {
              columnNames: ['clinic_id', 'phone'],
            },
          ],
          foreignKeys: [
            {
              columnNames: ['clinic_id'],
              referencedTableName: 'clinics',
              referencedColumnNames: ['id'],
              onDelete: 'CASCADE',
            },
          ],
        }),
        true,
      );
    }

    // Create animal_types table
    const animalTypesTableExists = await queryRunner.hasTable('animal_types');
    if (!animalTypesTableExists) {
      await queryRunner.createTable(
        new Table({
          name: 'animal_types',
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
            },
            {
              name: 'name',
              type: 'varchar',
              length: '100',
            },
            {
              name: 'created_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
            },
            {
              name: 'updated_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
            },
          ],
          foreignKeys: [
            {
              columnNames: ['clinic_id'],
              referencedTableName: 'clinics',
              referencedColumnNames: ['id'],
              onDelete: 'CASCADE',
            },
          ],
        }),
        true,
      );
    }

    // Create pets table
    const petsTableExists = await queryRunner.hasTable('pets');
    if (!petsTableExists) {
      await queryRunner.createTable(
        new Table({
          name: 'pets',
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
            },
            {
              name: 'client_id',
              type: 'uuid',
            },
            {
              name: 'name',
              type: 'varchar',
              length: '255',
            },
            {
              name: 'species',
              type: 'varchar',
              length: '50',
            },
            {
              name: 'breed',
              type: 'varchar',
              length: '100',
              isNullable: true,
            },
            {
              name: 'date_of_birth',
              type: 'date',
              isNullable: true,
            },
            {
              name: 'created_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
            },
            {
              name: 'updated_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
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
              onDelete: 'CASCADE',
            },
          ],
        }),
        true,
      );
    }

    // Create reminders table
    const remindersTableExists = await queryRunner.hasTable('reminders');
    if (!remindersTableExists) {
      await queryRunner.createTable(
        new Table({
          name: 'reminders',
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
            },
            {
              name: 'client_id',
              type: 'uuid',
            },
            {
              name: 'message',
              type: 'text',
            },
            {
              name: 'scheduled_at',
              type: 'timestamp',
            },
            {
              name: 'status',
              type: 'varchar',
              length: '50',
              default: "'PENDING'",
            },
            {
              name: 'created_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
            },
            {
              name: 'updated_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
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
              onDelete: 'CASCADE',
            },
          ],
        }),
        true,
      );
    }

    // Create message_logs table
    const messageLogsTableExists = await queryRunner.hasTable('message_logs');
    if (!messageLogsTableExists) {
      await queryRunner.createTable(
        new Table({
          name: 'message_logs',
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
            },
            {
              name: 'client_id',
              type: 'uuid',
            },
            {
              name: 'message',
              type: 'text',
            },
            {
              name: 'status',
              type: 'varchar',
              length: '50',
              default: "'SENT'",
            },
            {
              name: 'created_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
            },
            {
              name: 'updated_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
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
              onDelete: 'CASCADE',
            },
          ],
        }),
        true,
      );
    }

    // Create platform_roles table
    await queryRunner.createTable(
      new Table({
        name: 'platform_roles',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'key',
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
          },
          {
            name: 'permissions',
            type: 'text',
            isArray: true,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'is_immutable',
            type: 'boolean',
            default: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create platform_users table
    await queryRunner.createTable(
      new Table({
        name: 'platform_users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isUnique: true,
          },
          {
            name: 'full_name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'password_hash',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'ACTIVE'",
          },
          {
            name: 'impersonating_clinic_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'impersonating_user_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'last_login_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'deactivated_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'invitation_token',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'invitation_token_expires_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'password_reset_token',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'password_reset_token_expires_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Create index for platform_users email
    await queryRunner.createIndex(
      'platform_users',
      new TableIndex({
        columnNames: ['email'],
      }),
    );

    // Create platform_user_roles junction table
    await queryRunner.createTable(
      new Table({
        name: 'platform_user_roles',
        columns: [
          {
            name: 'user_id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'role_id',
            type: 'uuid',
            isPrimary: true,
          },
        ],
        foreignKeys: [
          {
            columnNames: ['user_id'],
            referencedTableName: 'platform_users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['role_id'],
            referencedTableName: 'platform_roles',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // Create audit_logs table
    await queryRunner.createTable(
      new Table({
        name: 'audit_logs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'actor_id',
            type: 'uuid',
          },
          {
            name: 'action',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'resource_type',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'resource_id',
            type: 'uuid',
          },
          {
            name: 'clinic_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'changes',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'impersonation_context',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'client_ip',
            type: 'varchar',
            length: '45',
            isNullable: true,
          },
          {
            name: 'user_agent',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'SUCCESS'",
          },
          {
            name: 'error_message',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'duration_ms',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['actor_id'],
            referencedTableName: 'platform_users',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          },
        ],
      }),
      true,
    );

    // Create indexes for audit_logs
    await queryRunner.createIndex(
      'audit_logs',
      new TableIndex({
        columnNames: ['actor_id'],
      }),
    );

    await queryRunner.createIndex(
      'audit_logs',
      new TableIndex({
        columnNames: ['resource_type'],
      }),
    );

    await queryRunner.createIndex(
      'audit_logs',
      new TableIndex({
        columnNames: ['action'],
      }),
    );

    await queryRunner.createIndex(
      'audit_logs',
      new TableIndex({
        columnNames: ['created_at'],
      }),
    );

    await queryRunner.createIndex(
      'audit_logs',
      new TableIndex({
        columnNames: ['clinic_id'],
      }),
    );

    // Update clinics table
    await queryRunner.query(`
      ALTER TABLE clinics 
      ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP NULL,
      ADD COLUMN IF NOT EXISTS suspended_by UUID NULL,
      ADD COLUMN IF NOT EXISTS suspension_reason TEXT NULL,
      ADD COLUMN IF NOT EXISTS plan VARCHAR(50) DEFAULT 'STARTER',
      ADD COLUMN IF NOT EXISTS max_staff_users INTEGER DEFAULT 100,
      ADD COLUMN IF NOT EXISTS max_clients INTEGER DEFAULT 1000,
      ADD COLUMN IF NOT EXISTS max_pets INTEGER DEFAULT 5000,
      ADD COLUMN IF NOT EXISTS active_staff_count INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS active_clients_count INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS active_pets_count INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS stats_updated_at TIMESTAMP NULL;
    `);

    // Update status column in clinics
    await queryRunner.query(`
      ALTER TABLE clinics 
      ALTER COLUMN status TYPE VARCHAR(50),
      ALTER COLUMN status SET DEFAULT 'ACTIVE';
    `);

    // Update users table
    await queryRunner.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMP NULL,
      ADD COLUMN IF NOT EXISTS deactivated_by UUID NULL,
      ADD COLUMN IF NOT EXISTS invitation_token UUID NULL,
      ADD COLUMN IF NOT EXISTS invitation_token_expires_at TIMESTAMP NULL,
      ADD COLUMN IF NOT EXISTS password_reset_token UUID NULL,
      ADD COLUMN IF NOT EXISTS password_reset_token_expires_at TIMESTAMP NULL;
    `);

    // Update status column in users
    await queryRunner.query(`
      ALTER TABLE users 
      ALTER COLUMN status TYPE VARCHAR(50),
      ALTER COLUMN status SET DEFAULT 'ACTIVE';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop audit_logs table
    await queryRunner.dropTable('audit_logs', true);

    // Drop platform_user_roles table
    await queryRunner.dropTable('platform_user_roles', true);

    // Drop platform_users table
    await queryRunner.dropTable('platform_users', true);

    // Drop platform_roles table
    await queryRunner.dropTable('platform_roles', true);

    // Drop message_logs table
    await queryRunner.dropTable('message_logs', true);

    // Drop reminders table
    await queryRunner.dropTable('reminders', true);

    // Drop pets table
    await queryRunner.dropTable('pets', true);

    // Drop animal_types table
    await queryRunner.dropTable('animal_types', true);

    // Drop clients table
    await queryRunner.dropTable('clients', true);

    // Drop users table
    await queryRunner.dropTable('users', true);

    // Drop clinics table
    await queryRunner.dropTable('clinics', true);
  }
}
