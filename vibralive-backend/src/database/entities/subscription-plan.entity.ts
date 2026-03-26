import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';

@Entity('subscription_plans')
@Unique(['code'])
export class SubscriptionPlan {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50 })
  code!: string; // 'starter', 'professional', 'enterprise'

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price!: number;

  @Column({ type: 'varchar', length: 10, default: 'MXN' })
  currency!: string;

  @Column({ name: 'billing_period', type: 'varchar', length: 20, default: 'monthly' })
  billingPeriod!: 'monthly' | 'yearly';

  @Column({ name: 'max_staff_users', type: 'integer', default: 5 })
  maxStaffUsers!: number;

  @Column({ name: 'max_clients', type: 'integer', default: 100 })
  maxClients!: number;

  @Column({ name: 'max_pets', type: 'integer', default: 200 })
  maxPets!: number;

  @Column({ type: 'jsonb', default: '[]' })
  features!: string[];

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status!: 'active' | 'inactive';

  @Column({ name: 'sort_order', type: 'integer', default: 0 })
  sortOrder!: number;

  @Column({ name: 'is_popular', type: 'boolean', default: false })
  isPopular!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
