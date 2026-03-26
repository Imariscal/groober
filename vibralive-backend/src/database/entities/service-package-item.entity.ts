import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { ServicePackage } from './service-package.entity';
import { Service } from './service.entity';

@Entity('service_package_items')
@Index(['clinicId', 'packageId'])
@Index(['clinicId', 'packageId', 'serviceId'], { unique: true })
export class ServicePackageItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'clinic_id' })
  clinicId!: string;

  @Column({ type: 'uuid', name: 'package_id' })
  packageId!: string;

  @ManyToOne(() => ServicePackage, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'package_id' })
  package?: ServicePackage;

  @Column({ type: 'uuid', name: 'service_id' })
  serviceId!: string;

  @ManyToOne(() => Service, { eager: false })
  @JoinColumn({ name: 'service_id' })
  service?: Service;

  @Column({ type: 'int', default: 1 })
  quantity!: number;

  @Column({ type: 'int', default: 0, name: 'sort_order' })
  sortOrder!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
