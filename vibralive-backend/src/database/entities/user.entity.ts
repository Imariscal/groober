import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'clinic_id', type: 'uuid', nullable: true })
  clinicId!: string | null;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city!: string | null;

  @Column({ name: 'postal_code', type: 'varchar', length: 20, nullable: true })
  postalCode!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  country!: string | null;

  @Column({ name: 'hashed_password', type: 'varchar', length: 255 })
  hashedPassword!: string;

  @Column({ type: 'varchar', length: 50, default: 'staff' })
  role!: string; // superadmin, owner, staff

  @Column({
    type: 'varchar',
    length: 50,
    default: 'ACTIVE',
  })
  status!: 'INVITED' | 'ACTIVE' | 'DEACTIVATED';

  @Column({ name: 'last_login', type: 'timestamp with time zone', nullable: true })
  lastLogin!: Date;

  @Column({ name: 'deactivated_at', type: 'timestamp with time zone', nullable: true })
  deactivatedAt!: Date | null;

  @Column({ name: 'deactivated_by', type: 'uuid', nullable: true })
  deactivatedBy!: string | null;

  @Column({ name: 'invitation_token', type: 'uuid', nullable: true })
  invitationToken!: string | null;

  @Column({ name: 'invitation_token_expires_at', type: 'timestamp with time zone', nullable: true })
  invitationTokenExpiresAt!: Date | null;

  @Column({ name: 'password_reset_token', type: 'uuid', nullable: true })
  passwordResetToken!: string | null;

  @Column({ name: 'password_reset_token_expires_at', type: 'timestamp with time zone', nullable: true })
  passwordResetTokenExpiresAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
