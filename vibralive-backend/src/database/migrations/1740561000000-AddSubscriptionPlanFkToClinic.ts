import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AddSubscriptionPlanFkToClinic1740561000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add subscription_plan_id column if it doesn't exist
    const table = await queryRunner.getTable('clinics');
    const columnExists = table?.columns.find(col => col.name === 'subscription_plan_id');

    if (!columnExists) {
      await queryRunner.addColumn(
        'clinics',
        new TableColumn({
          name: 'subscription_plan_id',
          type: 'uuid',
          isNullable: true,
          comment: 'Foreign key to subscription_plans table',
        }),
      );
    }

    // Add foreign key constraint
    const fkExists = table?.foreignKeys.find(
      fk => fk.columnNames.includes('subscription_plan_id'),
    );

    if (!fkExists) {
      await queryRunner.createForeignKey(
        'clinics',
        new TableForeignKey({
          name: 'FK_clinics_subscription_plan_id',
          columnNames: ['subscription_plan_id'],
          referencedTableName: 'subscription_plans',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        }),
      );
    }

    // Update existing clinics to use the professional plan (most clinics are professional)
    await queryRunner.query(`
      UPDATE clinics c
      SET subscription_plan_id = sp.id
      FROM subscription_plans sp
      WHERE sp.code = 'professional' AND c.subscription_plan_id IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('clinics');
    const fk = table?.foreignKeys.find(
      fk => fk.columnNames.includes('subscription_plan_id'),
    );

    if (fk) {
      await queryRunner.dropForeignKey('clinics', fk);
    }

    await queryRunner.dropColumn('clinics', 'subscription_plan_id');
  }
}
