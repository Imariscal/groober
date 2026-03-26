import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, OneToMany } from 'typeorm';
import { ServicePackageItem } from './service-package-item.entity';

@Entity('service_packages')
@Index(['clinicId', 'isActive'])
export class ServicePackage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'clinic_id' })
  clinicId!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ default: true, name: 'is_active' })
  isActive!: boolean;

  @OneToMany(() => ServicePackageItem, item => item.package, { cascade: true, eager: false })
  items?: ServicePackageItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
