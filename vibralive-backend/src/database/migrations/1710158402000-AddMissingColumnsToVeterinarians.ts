import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddMissingColumnsToVeterinarians1710158402000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if the table exists first
    const tableExists = await queryRunner.hasTable('veterinarians');
    
    if (!tableExists) {
      console.log('veterinarians table does not exist, skipping migration');
      return;
    }

    // Add specialty column if it doesn't exist
    const hasSpecialty = await queryRunner.hasColumn('veterinarians', 'specialty');
    if (!hasSpecialty) {
      await queryRunner.addColumn(
        'veterinarians',
        new TableColumn({
          name: 'specialty',
          type: 'varchar',
          length: '50',
          default: "'GENERAL'",
          isNullable: false,
        }),
      );
      console.log('Added specialty column');
    }

    // Add license_number column if it doesn't exist
    const hasLicense = await queryRunner.hasColumn('veterinarians', 'license_number');
    if (!hasLicense) {
      await queryRunner.addColumn(
        'veterinarians',
        new TableColumn({
          name: 'license_number',
          type: 'varchar',
          length: '100',
          isNullable: true,
        }),
      );
      console.log('Added license_number column');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('veterinarians');
    
    if (!tableExists) {
      return;
    }

    const hasSpecialty = await queryRunner.hasColumn('veterinarians', 'specialty');
    if (hasSpecialty) {
      await queryRunner.dropColumn('veterinarians', 'specialty');
    }

    const hasLicense = await queryRunner.hasColumn('veterinarians', 'license_number');
    if (hasLicense) {
      await queryRunner.dropColumn('veterinarians', 'license_number');
    }
  }
}
