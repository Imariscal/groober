import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRbacAndStylistsTables1772800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create roles table
    await queryRunner.query(`
      CREATE TABLE roles (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        clinic_id uuid,
        code varchar(50) NOT NULL,
        name varchar(100) NOT NULL,
        description varchar(255),
        is_system boolean NOT NULL DEFAULT false,
        created_at timestamp NOT NULL DEFAULT now(),
        CONSTRAINT uq_roles_clinic_code UNIQUE (clinic_id, code)
      );
      CREATE INDEX idx_roles_clinic_id ON roles (clinic_id);
    `);

    // Create permissions table
    await queryRunner.query(`
      CREATE TABLE permissions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        code varchar(100) NOT NULL UNIQUE,
        description varchar(255)
      );
    `);

    // Create role_permissions junction table
    await queryRunner.query(`
      CREATE TABLE role_permissions (
        role_id uuid NOT NULL,
        permission_id uuid NOT NULL,
        PRIMARY KEY (role_id, permission_id),
        CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
        CONSTRAINT fk_role_permissions_permission FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
      );
    `);

    // Create user_roles junction table
    await queryRunner.query(`
      CREATE TABLE user_roles (
        user_id uuid NOT NULL,
        role_id uuid NOT NULL,
        assigned_at timestamp NOT NULL DEFAULT now(),
        PRIMARY KEY (user_id, role_id),
        CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
      );
    `);

    // Create stylists table
    await queryRunner.query(`
      CREATE TABLE stylists (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        clinic_id uuid NOT NULL,
        user_id uuid NOT NULL UNIQUE,
        display_name varchar(100),
        is_bookable boolean NOT NULL DEFAULT true,
        calendar_color varchar(20),
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now(),
        CONSTRAINT fk_stylists_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_stylists_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE
      );
      CREATE INDEX idx_stylists_clinic ON stylists (clinic_id);
      CREATE INDEX idx_stylists_user ON stylists (user_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS stylists;`);
    await queryRunner.query(`DROP TABLE IF EXISTS user_roles;`);
    await queryRunner.query(`DROP TABLE IF EXISTS role_permissions;`);
    await queryRunner.query(`DROP TABLE IF EXISTS permissions;`);
    await queryRunner.query(`DROP TABLE IF EXISTS roles;`);
  }
}
