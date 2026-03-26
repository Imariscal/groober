import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Clinic } from './clinic.entity';
import { PriceList } from './price-list.entity';
import { Service } from './service.entity';

@Entity('price_list_history')
@Index(['clinicId', 'priceListId', 'changedAt'])
@Index(['priceListId', 'changedAt'])
export class PriceListHistory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'clinic_id' })
  clinicId!: string;

  @Column({ type: 'uuid', name: 'price_list_id' })
  priceListId!: string;

  @Column({ type: 'uuid', name: 'service_id' })
  serviceId!: string;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    nullable: true,
    name: 'old_price',
  })
  oldPrice: number | null = null;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    name: 'new_price',
  })
  newPrice!: number;

  @CreateDateColumn({ name: 'changed_at' })
  changedAt!: Date;

  @Column({
    type: 'uuid',
    nullable: true,
    name: 'changed_by_user_id',
  })
  changedByUserId: string | null = null;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  reason: string | null = null;

  // Relations
  @ManyToOne(() => Clinic)
  @JoinColumn({ name: 'clinic_id' })
  clinic!: Clinic;

  @ManyToOne(() => PriceList)
  @JoinColumn({ name: 'price_list_id' })
  priceList!: PriceList;

  @ManyToOne(() => Service)
  @JoinColumn({ name: 'service_id' })
  service!: Service;
}
