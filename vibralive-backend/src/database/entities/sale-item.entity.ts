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
import { Sale } from './sale.entity';
import { SaleProduct } from './sale-product.entity';
import { Service } from './service.entity';

@Entity('sale_items')
@Index(['saleId'])
@Index(['productId'])
@Index(['serviceId'])
@Index(['appointmentItemId'])
export class SaleItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'clinic_id' })
  clinicId!: string;

  @Column({ type: 'uuid', name: 'sale_id' })
  saleId!: string;

  @Column({ type: 'uuid', name: 'product_id', nullable: true })
  productId?: string;

  @Column({ type: 'uuid', name: 'service_id', nullable: true })
  serviceId?: string;

  @Column({ type: 'uuid', name: 'appointment_item_id', nullable: true })
  appointmentItemId?: string;

  @Column({ type: 'numeric', precision: 10, scale: 2, transformer: { to: (v) => v, from: (v) => parseFloat(v) } })
  quantity!: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, name: 'unit_price', transformer: { to: (v) => v, from: (v) => parseFloat(v) } })
  unitPrice!: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, transformer: { to: (v) => v, from: (v) => parseFloat(v) } })
  subtotal!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  // Relations
  @ManyToOne(() => Clinic, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clinic_id' })
  clinic!: Clinic;

  @ManyToOne(() => Sale, (sale) => sale.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sale_id' })
  sale!: Sale;

  @ManyToOne(() => SaleProduct, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'product_id' })
  product?: SaleProduct;

  @ManyToOne(() => Service, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'service_id' })
  service?: Service;
}
