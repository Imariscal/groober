import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Service } from './service.entity';

@Entity('service_prices')
@Index(['clinicId', 'priceListId', 'serviceId'])
export class ServicePrice {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'clinic_id' })
  clinicId!: string;

  @Column({ type: 'uuid', name: 'price_list_id' })
  priceListId!: string;

  @Column({ type: 'uuid', name: 'service_id' })
  serviceId!: string;

  @ManyToOne(() => Service, { eager: false })
  @JoinColumn({ name: 'service_id' })
  service?: Service;

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
