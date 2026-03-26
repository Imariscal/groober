import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * NOTA: Esta migración fue creada en una iteración anterior pero causó errores
 * porque intentaba alterar campos que ya estaban en formato timestamp with time zone.
 * 
 * Se ha convertido en un NO-OP (operación vacía) para mantener el historial de migraciones.
 * Los cambios reales se aplican en: 1773100000000-ConvertRemainingTimestampsToWithTimeZone.ts
 */
export class ConvertAllTimestampsToWithTimeZone1740820000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Esta migración es un NO-OP.
    // Los campos ya están en timestamp with time zone en entities.
    // La migración 1773100000000 maneja los campos que aún necesitaban conversión.
    console.log('[MIGRATION] ConvertAllTimestampsToWithTimeZone (1740820000001) - NO-OP (legacy migration)');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // NO-OP: No hay cambios que revertir en esta migración
    console.log('[MIGRATION ROLLBACK] ConvertAllTimestampsToWithTimeZone (1740820000001) - NO-OP');
  }
}
