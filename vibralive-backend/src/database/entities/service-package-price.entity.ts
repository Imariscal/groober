import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { ServicePackage } from './service-package.entity';

@Entity('service_package_prices')
@Index(['clinicId', 'priceListId', 'packageId'])
@Index(['clinicId', 'priceListId', 'packageId'], { unique: true })
export class ServicePackagePrice {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'clinic_id' })
  clinicId!: string;

  @Column({ type: 'uuid', name: 'price_list_id' })
  priceListId!: string;

  @Column({ type: 'uuid', name: 'package_id' })
  packageId!: string;

  @ManyToOne(() => ServicePackage, { eager: false })
  @JoinColumn({ name: 'package_id' })
  package?: ServicePackage;

  @Column({ type: 'numeric', precision: 10, scale: 2, transformer: { to: (v) => v, from: (v) => parseFloat(v) } })
  price!: number;

  @Column({ default: 'MXN' })
  currency!: string;

  @Column({ default: true, name: 'is_available' })
  isAvailable!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
