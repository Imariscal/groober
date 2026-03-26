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
import { SaleProduct } from './sale-product.entity';

@Entity('inventory_movements')
@Index(['productId'])
@Index(['clinicId', 'createdAt'])
export class InventoryMovement {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'clinic_id' })
  clinicId!: string;

  @Column({ type: 'uuid', name: 'product_id' })
  productId!: string;

  @Column({ type: 'varchar', length: 20, name: 'movement_type' })
  movementType!: 'IN' | 'OUT' | 'ADJUSTMENT';

  @Column({ type: 'numeric', precision: 10, scale: 2, transformer: { to: (v) => v, from: (v) => parseFloat(v) } })
  quantity!: number;

  @Column({ type: 'varchar', length: 50 })
  reason!: 'SALE' | 'PURCHASE' | 'ADJUSTMENT' | 'RETURN' | 'DAMAGE' | 'OTHER';

  @Column({ type: 'uuid', name: 'reference_id', nullable: true })
  referenceId?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'uuid', name: 'created_by_user_id', nullable: true })
  createdByUserId?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  // Relations
  @ManyToOne(() => Clinic, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clinic_id' })
  clinic!: Clinic;

  @ManyToOne(() => SaleProduct, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product!: SaleProduct;
}
