import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migración: Convertir TODOS los created_at y updated_at a timestamp with time zone
 * 
 * Los campos de auditoría (created_at, updated_at) en TODAS las tablas
 * deben ser timestamp with time zone, no timestamp sin timezone.
 */
export class ConvertAllAuditColumnsToTimestampTz1773110000000
  implements MigrationInterface
{
  name = 'ConvertAllAuditColumnsToTimestampTz1773110000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log(
      '🔄 [MIGRATION] Convirtiendo created_at y updated_at a timestamp with time zone...',
    );

    // Obtener todas las tablas que tienen created_at o updated_at
    const tables = await queryRunner.query(`
      SELECT DISTINCT table_name
      FROM information_schema.columns
      WHERE column_name IN ('created_at', 'updated_at')
      AND table_schema = 'public'
      ORDER BY table_name
    `);

    console.log(`📝 Encontradas ${tables.length} tablas con campos de auditoría`);

    for (const { table_name } of tables) {
      console.log(`  ✓ Procesando tabla: ${table_name}`);

      // Verificar si created_at existe y no es timestamp with time zone
      const createdAtExists = await queryRunner.query(`
        SELECT 1 FROM information_schema.columns
        WHERE table_name = '${table_name}'
        AND column_name = 'created_at'
        AND data_type != 'timestamp with time zone'
      `);

      if (createdAtExists.length > 0) {
        await queryRunner.query(
          `ALTER TABLE "${table_name}" 
           ALTER COLUMN "created_at" 
           SET DATA TYPE timestamp with time zone 
           USING "created_at" AT TIME ZONE 'UTC'`,
        );
        console.log(`    ✓ ${table_name}.created_at → timestamp with time zone`);
      }

      // Verificar si updated_at existe y no es timestamp with time zone
      const updatedAtExists = await queryRunner.query(`
        SELECT 1 FROM information_schema.columns
        WHERE table_name = '${table_name}'
        AND column_name = 'updated_at'
        AND data_type != 'timestamp with time zone'
      `);

      if (updatedAtExists.length > 0) {
        await queryRunner.query(
          `ALTER TABLE "${table_name}" 
           ALTER COLUMN "updated_at" 
           SET DATA TYPE timestamp with time zone 
           USING "updated_at" AT TIME ZONE 'UTC'`,
        );
        console.log(`    ✓ ${table_name}.updated_at → timestamp with time zone`);
      }
    }

    console.log('✅ Conversión de campos de auditoría completada');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log(
      '⏪ [MIGRATION ROLLBACK] Revirtiendo created_at y updated_at...',
    );

    // Obtener todas las tablas
    const tables = await queryRunner.query(`
      SELECT DISTINCT table_name
      FROM information_schema.columns
      WHERE column_name IN ('created_at', 'updated_at')
      AND table_schema = 'public'
      ORDER BY table_name
    `);

    for (const { table_name } of tables) {
      // Revertir created_at
      const createdAtExists = await queryRunner.query(`
        SELECT 1 FROM information_schema.columns
        WHERE table_name = '${table_name}'
        AND column_name = 'created_at'
        AND data_type = 'timestamp with time zone'
      `);

      if (createdAtExists.length > 0) {
        await queryRunner.query(
          `ALTER TABLE "${table_name}" ALTER COLUMN "created_at" SET DATA TYPE timestamp`,
        );
      }

      // Revertir updated_at
      const updatedAtExists = await queryRunner.query(`
        SELECT 1 FROM information_schema.columns
        WHERE table_name = '${table_name}'
        AND column_name = 'updated_at'
        AND data_type = 'timestamp with time zone'
      `);

      if (updatedAtExists.length > 0) {
        await queryRunner.query(
          `ALTER TABLE "${table_name}" ALTER COLUMN "updated_at" SET DATA TYPE timestamp`,
        );
      }
    }

    console.log('✅ Rollback completado');
  }
}
