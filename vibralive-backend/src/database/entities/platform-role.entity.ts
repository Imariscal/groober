import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToMany,
} from 'typeorm';
import { PlatformUser } from './platform-user.entity';

@Entity('platform_roles')
export class PlatformRole {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  key!: string; // PLATFORM_SUPERADMIN, PLATFORM_SUPPORT, PLATFORM_FINANCE

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'text', array: true })
  permissions!: string[];

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @Column({ type: 'boolean', default: false })
  is_immutable!: boolean; // Protege roles del sistema

  @CreateDateColumn()
  created_at!: Date;

  @ManyToMany(() => PlatformUser, (user) => user.platform_roles, {
    lazy: true,
  })
  platform_users?: PlatformUser[];
}
