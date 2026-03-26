import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Clinic } from './clinic.entity';

@Entity('sale_products')
@Index(['clinicId', 'sku'], { unique: true })
@Index(['clinicId', 'isActive'])
export class SaleProduct {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'clinic_id' })
  clinicId!: string;

  @Column({ type: 'varchar', length: 80 })
  sku!: string;

  @Column({ type: 'varchar', length: 200 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 50 })
  category!: 'FOOD' | 'ACCESSORY' | 'CLOTHING' | 'HYGIENE' | 'TOY' | 'OTHER';

  @Column({ type: 'varchar', length: 100, nullable: true })
  brand?: string;

  @Column({ type: 'numeric', precision: 10, scale: 2, name: 'sale_price', transformer: { to: (v) => v, from: (v) => parseFloat(v) } })
  salePrice!: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, name: 'cost_price', nullable: true, transformer: { to: (v) => v, from: (v) => v ? parseFloat(v) : undefined } })
  costPrice?: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, name: 'stock_quantity', default: 0, transformer: { to: (v) => v, from: (v) => parseFloat(v) } })
  stockQuantity!: number;

  @Column({ type: 'varchar', length: 20, name: 'stock_unit', default: 'UNIT' })
  stockUnit!: 'UNIT' | 'KG' | 'BAG' | 'BOX' | 'LITER' | 'PACK';

  @Column({ type: 'numeric', precision: 10, scale: 2, name: 'min_stock_alert', nullable: true, transformer: { to: (v) => v, from: (v) => v ? parseFloat(v) : undefined } })
  minStockAlert?: number;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Clinic, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clinic_id' })
  clinic!: Clinic;
}
