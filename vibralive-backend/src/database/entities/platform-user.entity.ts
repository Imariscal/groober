import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
  OneToMany,
  Index,
} from 'typeorm';
import { PlatformRole } from './platform-role.entity';
import { AuditLog } from './audit-log.entity';

@Entity('platform_users')
@Index(['email'])
export class PlatformUser {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 255 })
  full_name!: string;

  @Column({ type: 'varchar', length: 255 })
  password_hash!: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'ACTIVE',
  })
  status!: 'INVITED' | 'ACTIVE' | 'DEACTIVATED' | 'SUSPENDED';

  // Para impersonation
  @Column({ type: 'uuid', nullable: true })
  impersonating_clinic_id!: string | null;

  @Column({ type: 'uuid', nullable: true })
  impersonating_user_id!: string | null;

  // Tracking
  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  last_login_at!: Date | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  deactivated_at!: Date | null;

  // Magic link para invitación
  @Column({ type: 'uuid', nullable: true })
  invitation_token!: string | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  invitation_token_expires_at!: Date | null;

  // Reset password link
  @Column({ type: 'uuid', nullable: true })
  password_reset_token!: string | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  password_reset_token_expires_at!: Date | null;

  // Relations
  @ManyToMany(() => PlatformRole, (role) => role.platform_users, {
    eager: true,
    cascade: true,
  })
  @JoinTable({
    name: 'platform_user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  platform_roles!: PlatformRole[];
}
