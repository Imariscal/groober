import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Service } from './service.entity';
import { PriceList } from './price-list.entity';

/**
 * ServiceSizePrice - Precios de servicios según tamaño de mascota
 * Permite tener precios diferentes para XS, S, M, L, XL
 * 
 * Nota: priceListId es OPTIONAL
 * - Si es NULL: precio global del servicio (usado en servicios/citas)
 * - Si tiene valor: precio específico para esa lista de precios
 */
@Entity('service_size_prices')
@Index(['clinicId', 'serviceId'])
@Index(['clinicId', 'serviceId', 'petSize'], { unique: false })
@Index(['clinicId', 'priceListId', 'serviceId', 'petSize'], { unique: true })
export class ServiceSizePrice {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'clinic_id' })
  clinicId!: string;

  @Column({ type: 'uuid', name: 'service_id' })
  serviceId!: string;

  @ManyToOne(() => Service, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'service_id' })
  service?: Service;

  // NEW: Optional price list association
  @Column({ type: 'uuid', name: 'price_list_id', nullable: true })
  priceListId?: string | null;

  @ManyToOne(() => PriceList, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'price_list_id' })
  priceList?: PriceList;

  @Column({
    type: 'enum',
    enum: ['XS', 'S', 'M', 'L', 'XL'],
    name: 'pet_size',
  })
  petSize!: 'XS' | 'S' | 'M' | 'L' | 'XL';

  @Column({ type: 'numeric', precision: 10, scale: 2, transformer: { to: (v) => v, from: (v) => parseFloat(v) } })
  price!: number;

  @Column({
    type: 'integer',
    nullable: true,
    name: 'duration_minutes',
    comment: 'Duración específica para este tamaño (ej: baño XL = 35 min, Corte XL = 40 min). Si es NULL usa Service.defaultDurationMinutes'
  })
  durationMinutes?: number;

  @Column({ default: 'MXN' })
  currency!: string;

  @Column({ default: true, name: 'is_active' })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
