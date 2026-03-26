import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Assign Owner Role to mariscal21@hotmail.com
 * 
 * Ensures that the user with email mariscal21@hotmail.com has the 'owner' role
 * to access campaigns and other admin features.
 * 
 * Date: March 9, 2026
 */
export class AssignOwnerRoleToMariscal1750000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('👤 Assigning owner role to mariscal21@hotmail.com');

    // Update the user role to 'owner' if exists
    const updateResult = await queryRunner.query(
      `UPDATE users SET role = 'owner' WHERE email = $1`,
      ['mariscal21@hotmail.com'],
    );

    if (updateResult.affectedRows && updateResult.affectedRows > 0) {
      console.log('✅ User mariscal21@hotmail.com updated to owner role');
    } else {
      console.log('⚠️  User mariscal21@hotmail.com not found in database');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rollback: Set role back to 'staff' for this user
    await queryRunner.query(
      `UPDATE users SET role = 'staff' WHERE email = $1`,
      ['mariscal21@hotmail.com'],
    );
  }
}
