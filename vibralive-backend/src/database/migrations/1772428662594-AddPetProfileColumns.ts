import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPetProfileColumns1772428662594 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // ========== PERFIL ==========
        await queryRunner.query(`
            ALTER TABLE pets
            ADD COLUMN IF NOT EXISTS sex VARCHAR(10) NOT NULL DEFAULT 'UNKNOWN'
        `);

        await queryRunner.query(`
            ALTER TABLE pets
            ADD COLUMN IF NOT EXISTS is_sterilized BOOLEAN NOT NULL DEFAULT false
        `);

        await queryRunner.query(`
            ALTER TABLE pets
            ADD COLUMN IF NOT EXISTS color VARCHAR(100) NULL
        `);

        await queryRunner.query(`
            ALTER TABLE pets
            ADD COLUMN IF NOT EXISTS size VARCHAR(5) NULL
        `);

        // ========== IDENTIFICACIÓN ==========
        await queryRunner.query(`
            ALTER TABLE pets
            ADD COLUMN IF NOT EXISTS microchip_number VARCHAR(50) NULL
        `);

        await queryRunner.query(`
            ALTER TABLE pets
            ADD COLUMN IF NOT EXISTS tag_number VARCHAR(50) NULL
        `);

        await queryRunner.query(`
            ALTER TABLE pets
            ADD COLUMN IF NOT EXISTS external_reference VARCHAR(80) NULL
        `);

        // ========== OPERACIÓN CLÍNICA ==========
        await queryRunner.query(`
            ALTER TABLE pets
            ADD COLUMN IF NOT EXISTS notes TEXT NULL
        `);

        await queryRunner.query(`
            ALTER TABLE pets
            ADD COLUMN IF NOT EXISTS allergies TEXT NULL
        `);

        await queryRunner.query(`
            ALTER TABLE pets
            ADD COLUMN IF NOT EXISTS blood_type VARCHAR(20) NULL
        `);

        // ========== ESTADO DE VIDA ==========
        await queryRunner.query(`
            ALTER TABLE pets
            ADD COLUMN IF NOT EXISTS is_deceased BOOLEAN NOT NULL DEFAULT false
        `);

        await queryRunner.query(`
            ALTER TABLE pets
            ADD COLUMN IF NOT EXISTS deceased_at DATE NULL
        `);

        // ========== SOFT DELETE ==========
        await queryRunner.query(`
            ALTER TABLE pets
            ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL
        `);

        // ========== ÍNDICES ==========
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_pets_clinic_client 
            ON pets(clinic_id, client_id)
        `);

        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS idx_pets_microchip 
            ON pets(clinic_id, microchip_number) 
            WHERE microchip_number IS NOT NULL
        `);

        // ========== CONSTRAINT: deceased consistency ==========
        // Check if constraint exists before adding
        const constraintExists = await queryRunner.query(`
            SELECT 1 FROM pg_constraint WHERE conname = 'chk_deceased_consistency'
        `);
        
        if (constraintExists.length === 0) {
            await queryRunner.query(`
                ALTER TABLE pets 
                ADD CONSTRAINT chk_deceased_consistency 
                CHECK (
                    (is_deceased = false AND deceased_at IS NULL) OR 
                    (is_deceased = true AND deceased_at IS NOT NULL)
                )
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop constraint
        await queryRunner.query(`
            ALTER TABLE pets DROP CONSTRAINT IF EXISTS chk_deceased_consistency
        `);

        // Drop indexes
        await queryRunner.query(`DROP INDEX IF EXISTS idx_pets_microchip`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_pets_clinic_client`);

        // Drop columns (reverse order)
        await queryRunner.query(`ALTER TABLE pets DROP COLUMN IF EXISTS deleted_at`);
        await queryRunner.query(`ALTER TABLE pets DROP COLUMN IF EXISTS deceased_at`);
        await queryRunner.query(`ALTER TABLE pets DROP COLUMN IF EXISTS is_deceased`);
        await queryRunner.query(`ALTER TABLE pets DROP COLUMN IF EXISTS blood_type`);
        await queryRunner.query(`ALTER TABLE pets DROP COLUMN IF EXISTS allergies`);
        await queryRunner.query(`ALTER TABLE pets DROP COLUMN IF EXISTS notes`);
        await queryRunner.query(`ALTER TABLE pets DROP COLUMN IF EXISTS external_reference`);
        await queryRunner.query(`ALTER TABLE pets DROP COLUMN IF EXISTS tag_number`);
        await queryRunner.query(`ALTER TABLE pets DROP COLUMN IF EXISTS microchip_number`);
        await queryRunner.query(`ALTER TABLE pets DROP COLUMN IF EXISTS size`);
        await queryRunner.query(`ALTER TABLE pets DROP COLUMN IF EXISTS color`);
        await queryRunner.query(`ALTER TABLE pets DROP COLUMN IF EXISTS is_sterilized`);
        await queryRunner.query(`ALTER TABLE pets DROP COLUMN IF EXISTS sex`);
    }

}
