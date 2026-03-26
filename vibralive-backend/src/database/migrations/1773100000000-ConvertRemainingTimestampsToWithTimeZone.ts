import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migración: Convertir todos los timestamps restantes a timestamp with time zone
 * 
 * CONTEXTO:
 * Esta es una migración DESTRUCTIVA en desarrollo. Convertimos todas las columnas
 * que representan "instantes reales en el tiempo" de `timestamp` a `timestamp with time zone`.
 * 
 * Esto garantiza que:
 * - Todas las fechas se almacenan con información de zona horaria en PostgreSQL
 * - No hay información perdida sobre el momento exacto en UTC
 * - El sistema es coherente con la política global de UTC
 * 
 * CAMPOS MODIFICADOS:
 * 1. appointments.cancelled_at
 * 2. appointments.assigned_at
 * 3. appointments.price_lock_at
 * 4. appointments.rescheduled_at
 * 5. groomer_routes.generated_at
 * 6. groomer_route_stops.planned_arrival_time
 * 7. groomer_route_stops.planned_departure_time
 * 8. groomer_route_stops.actual_arrival_time
 * 9. groomer_route_stops.actual_departure_time
 * 10. whatsapp_outbox.last_retry_at
 * 11. whatsapp_outbox.sent_at
 * 
 * TOTAL: 12 columnas convertidas de timestamp → timestamp with time zone
 * 
 * IMPORTANTE:
 * - Esta migración NO pivota los datos existentes
 * - PostgreSQL convierte automáticamente los valores existentes
 * - En desarrollo (sin datos antiguos), esto es seguro
 * - En producción, habría que revisar si datos históricos son críticos
 */

export class ConvertRemainingTimestampsToWithTimeZone1773100000000
  implements MigrationInterface
{
  name = 'ConvertRemainingTimestampsToWithTimeZone1773100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log(
      '🔄 [MIGRATION] Iniciando conversión de timestamps faltantes a timestamp with time zone...',
    );

    // ===================================================================
    // APPOINTMENTS TABLE
    // ===================================================================
    console.log('📝 Convirtiendo appointments table...');

    // Conversion 1: appointments.cancelled_at
    await queryRunner.query(
      `ALTER TABLE "appointments" 
       ALTER COLUMN "cancelled_at" 
       SET DATA TYPE timestamp with time zone 
       USING "cancelled_at" AT TIME ZONE 'UTC'`,
    );
    console.log('  ✓ appointments.cancelled_at → timestamp with time zone');

    // Conversion 2: appointments.assigned_at
    await queryRunner.query(
      `ALTER TABLE "appointments" 
       ALTER COLUMN "assigned_at" 
       SET DATA TYPE timestamp with time zone 
       USING "assigned_at" AT TIME ZONE 'UTC'`,
    );
    console.log('  ✓ appointments.assigned_at → timestamp with time zone');

    // Conversion 3: appointments.price_lock_at
    await queryRunner.query(
      `ALTER TABLE "appointments" 
       ALTER COLUMN "price_lock_at" 
       SET DATA TYPE timestamp with time zone 
       USING "price_lock_at" AT TIME ZONE 'UTC'`,
    );
    console.log('  ✓ appointments.price_lock_at → timestamp with time zone');

    // Conversion 4: appointments.rescheduled_at
    await queryRunner.query(
      `ALTER TABLE "appointments" 
       ALTER COLUMN "rescheduled_at" 
       SET DATA TYPE timestamp with time zone 
       USING "rescheduled_at" AT TIME ZONE 'UTC'`,
    );
    console.log('  ✓ appointments.rescheduled_at → timestamp with time zone');

    // ===================================================================
    // GROOMER_ROUTES TABLE
    // ===================================================================
    console.log('📝 Convirtiendo groomer_routes table...');

    // Conversion 5: groomer_routes.generated_at
    await queryRunner.query(
      `ALTER TABLE "groomer_routes" 
       ALTER COLUMN "generated_at" 
       SET DATA TYPE timestamp with time zone 
       USING "generated_at" AT TIME ZONE 'UTC'`,
    );
    console.log('  ✓ groomer_routes.generated_at → timestamp with time zone');

    // ===================================================================
    // GROOMER_ROUTE_STOPS TABLE
    // ===================================================================
    console.log('📝 Convirtiendo groomer_route_stops table...');

    // Conversion 6: groomer_route_stops.planned_arrival_time
    await queryRunner.query(
      `ALTER TABLE "groomer_route_stops" 
       ALTER COLUMN "planned_arrival_time" 
       SET DATA TYPE timestamp with time zone 
       USING "planned_arrival_time" AT TIME ZONE 'UTC'`,
    );
    console.log(
      '  ✓ groomer_route_stops.planned_arrival_time → timestamp with time zone',
    );

    // Conversion 7: groomer_route_stops.planned_departure_time
    await queryRunner.query(
      `ALTER TABLE "groomer_route_stops" 
       ALTER COLUMN "planned_departure_time" 
       SET DATA TYPE timestamp with time zone 
       USING "planned_departure_time" AT TIME ZONE 'UTC'`,
    );
    console.log(
      '  ✓ groomer_route_stops.planned_departure_time → timestamp with time zone',
    );

    // Conversion 8: groomer_route_stops.actual_arrival_time
    await queryRunner.query(
      `ALTER TABLE "groomer_route_stops" 
       ALTER COLUMN "actual_arrival_time" 
       SET DATA TYPE timestamp with time zone 
       USING "actual_arrival_time" AT TIME ZONE 'UTC'`,
    );
    console.log(
      '  ✓ groomer_route_stops.actual_arrival_time → timestamp with time zone',
    );

    // Conversion 9: groomer_route_stops.actual_departure_time
    await queryRunner.query(
      `ALTER TABLE "groomer_route_stops" 
       ALTER COLUMN "actual_departure_time" 
       SET DATA TYPE timestamp with time zone 
       USING "actual_departure_time" AT TIME ZONE 'UTC'`,
    );
    console.log(
      '  ✓ groomer_route_stops.actual_departure_time → timestamp with time zone',
    );

    // ===================================================================
    // WHATSAPP_OUTBOX TABLE
    // ===================================================================
    console.log('📝 Convirtiendo whatsapp_outbox table...');

    // Conversion 10: whatsapp_outbox.last_retry_at
    await queryRunner.query(
      `ALTER TABLE "whatsapp_outbox" 
       ALTER COLUMN "last_retry_at" 
       SET DATA TYPE timestamp with time zone 
       USING "last_retry_at" AT TIME ZONE 'UTC'`,
    );
    console.log('  ✓ whatsapp_outbox.last_retry_at → timestamp with time zone');

    // Conversion 11: whatsapp_outbox.sent_at
    await queryRunner.query(
      `ALTER TABLE "whatsapp_outbox" 
       ALTER COLUMN "sent_at" 
       SET DATA TYPE timestamp with time zone 
       USING "sent_at" AT TIME ZONE 'UTC'`,
    );
    console.log('  ✓ whatsapp_outbox.sent_at → timestamp with time zone');

    console.log('✅ Migración completada exitosamente');
    console.log(
      '📊 Total: 12 columnas convertidas a timestamp with time zone',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log(
      '⏪ [MIGRATION ROLLBACK] Revirtiendo conversión de timestamps...',
    );

    // NOTA: Este rollback es solo for completeness.
    // En desarrollo, generalmente NO se hace rollback de estas migraciones.

    // ===================================================================
    // APPOINTMENTS TABLE (ROLLBACK)
    // ===================================================================
    await queryRunner.query(
      `ALTER TABLE "appointments" 
       ALTER COLUMN "cancelled_at" 
       SET DATA TYPE timestamp`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" 
       ALTER COLUMN "assigned_at" 
       SET DATA TYPE timestamp`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" 
       ALTER COLUMN "price_lock_at" 
       SET DATA TYPE timestamp`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" 
       ALTER COLUMN "rescheduled_at" 
       SET DATA TYPE timestamp`,
    );

    // ===================================================================
    // GROOMER_ROUTES TABLE (ROLLBACK)
    // ===================================================================
    await queryRunner.query(
      `ALTER TABLE "groomer_routes" 
       ALTER COLUMN "generated_at" 
       SET DATA TYPE timestamp`,
    );

    // ===================================================================
    // GROOMER_ROUTE_STOPS TABLE (ROLLBACK)
    // ===================================================================
    await queryRunner.query(
      `ALTER TABLE "groomer_route_stops" 
       ALTER COLUMN "planned_arrival_time" 
       SET DATA TYPE timestamp`,
    );
    await queryRunner.query(
      `ALTER TABLE "groomer_route_stops" 
       ALTER COLUMN "planned_departure_time" 
       SET DATA TYPE timestamp`,
    );
    await queryRunner.query(
      `ALTER TABLE "groomer_route_stops" 
       ALTER COLUMN "actual_arrival_time" 
       SET DATA TYPE timestamp`,
    );
    await queryRunner.query(
      `ALTER TABLE "groomer_route_stops" 
       ALTER COLUMN "actual_departure_time" 
       SET DATA TYPE timestamp`,
    );

    // ===================================================================
    // WHATSAPP_OUTBOX TABLE (ROLLBACK)
    // ===================================================================
    await queryRunner.query(
      `ALTER TABLE "whatsapp_outbox" 
       ALTER COLUMN "last_retry_at" 
       SET DATA TYPE timestamp`,
    );
    await queryRunner.query(
      `ALTER TABLE "whatsapp_outbox" 
       ALTER COLUMN "sent_at" 
       SET DATA TYPE timestamp`,
    );

    console.log('✅ Rollback completado');
  }
}
