import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('audit_logs')
@Index(['actorId', 'createdAt'])
@Index(['entityType', 'entityId'])
@Index(['action'])
@Index(['createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Actor (who did it)
  @Column({ name: 'actor_id', type: 'uuid' })
  actorId!: string;

  @Column({
    name: 'actor_type',
    type: 'varchar',
    length: 50,
    default: 'platform_user',
  })
  actorType!: 'platform_user' | 'clinic_user';

  // Action
  @Column({ type: 'varchar', length: 100 })
  action!:
    | 'CREATE_CLINIC'
    | 'UPDATE_CLINIC'
    | 'SUSPEND_CLINIC'
    | 'ACTIVATE_CLINIC'
    | 'CREATE_CLINIC_OWNER'
    | 'LOGIN'
    | 'LOGOUT'
    | 'CREATE'
    | 'READ'
    | 'UPDATE'
    | 'DELETE'
    | 'SUSPEND'
    | 'ACTIVATE'
    | 'INVITE'
    | 'RESET_PASSWORD'
    | 'IMPERSONATE'
    | 'IMPERSONATE_END';

  // Entity
  @Column({ name: 'entity_type', type: 'varchar', length: 50 })
  entityType!: 'clinic' | 'user' | 'client' | 'pet' | 'appointment' | 'platform_user';

  @Column({ name: 'entity_id', type: 'uuid' })
  entityId!: string;

  @Column({ name: 'resource_type', type: 'varchar', length: 50, default: 'platform' })
  resourceType!: string;

  @Column({ name: 'resource_id', type: 'uuid', nullable: true, default: null })
  resourceId!: string | null;

  // Metadata
  @Column({
    name: 'metadata',
    type: 'jsonb',
    default: '{}',
  })
  metadata!: Record<string, any>;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'SUCCESS',
  })
  status!: 'SUCCESS' | 'FAILURE';

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
