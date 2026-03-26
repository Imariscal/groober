import {
  IsUUID,
  IsEnum,
  IsOptional,
  IsString,
  IsNumber,
  Min,
  IsDateString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

// ============ PRODUCTS ============

export class CreateSaleProductDto {
  @IsUUID()
  clinicId!: string;

  @IsString()
  sku!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(['FOOD', 'ACCESSORY', 'CLOTHING', 'HYGIENE', 'TOY', 'OTHER'])
  category!: 'FOOD' | 'ACCESSORY' | 'CLOTHING' | 'HYGIENE' | 'TOY' | 'OTHER';

  @IsOptional()
  @IsString()
  brand?: string;

  @IsNumber()
  @Min(0.01)
  salePrice!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  costPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stockQuantity?: number;

  @IsOptional()
  @IsEnum(['UNIT', 'KG', 'BAG', 'BOX', 'LITER', 'PACK'])
  stockUnit?: 'UNIT' | 'KG' | 'BAG' | 'BOX' | 'LITER' | 'PACK';

  @IsOptional()
  @IsNumber()
  @Min(0)
  minStockAlert?: number;
}

export class UpdateSaleProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  salePrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  costPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minStockAlert?: number;

  @IsOptional()
  appliesToReminder?: boolean;
}

export class SaleProductResponseDto {
  id!: string;
  clinicId!: string;
  sku!: string;
  name!: string;
  description?: string;
  category!: string;
  brand?: string;
  salePrice!: number;
  costPrice?: number;
  stockQuantity!: number;
  stockUnit!: string;
  minStockAlert?: number;
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}

// ============ SALES ============

export class SaleItemLineDto {
  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsOptional()
  @IsUUID()
  serviceId?: string;

  @IsNumber()
  @Min(0.01)
  quantity!: number;

  @IsNumber()
  @Min(0.01)
  unitPrice!: number;
}

export class CreateSaleDto {
  @IsUUID()
  clinicId!: string;

  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsOptional()
  @IsUUID()
  appointmentId?: string;

  @IsOptional()
  @IsEnum(['POS', 'APPOINTMENT_ADDON'])
  saleType?: 'POS' | 'APPOINTMENT_ADDON';

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleItemLineDto)
  items!: SaleItemLineDto[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  taxAmount?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsUUID()
  createdByUserId?: string;
}

export class CompleteSaleDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleItemLineDto)
  items!: SaleItemLineDto[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  taxAmount?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class SaleResponseDto {
  id!: string;
  clinicId!: string;
  clientId?: string;
  appointmentId?: string;
  saleType!: string;
  status!: string;
  subtotal!: number;
  discountAmount!: number;
  taxAmount!: number;
  totalAmount!: number;
  notes?: string;
  soldAt?: Date;
  createdAt!: Date;
  updatedAt!: Date;
}

// ============ PAYMENTS ============

export class CreateSalePaymentDto {
  @IsUUID()
  saleId!: string;

  @IsEnum(['CASH', 'CARD', 'TRANSFER', 'MIXED', 'OTHER'])
  paymentMethod!: 'CASH' | 'CARD' | 'TRANSFER' | 'MIXED' | 'OTHER';

  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsDateString()
  paidAt!: string;
}

export class SalePaymentResponseDto {
  id!: string;
  clinicId!: string;
  saleId!: string;
  paymentMethod!: string;
  amount!: number;
  reference?: string;
  paidAt!: Date;
  createdAt!: Date;
}

// ============ INVENTORY ============

export class CreateInventoryMovementDto {
  @IsUUID()
  clinicId!: string;

  @IsUUID()
  productId!: string;

  @IsEnum(['IN', 'OUT', 'ADJUSTMENT'])
  movementType!: 'IN' | 'OUT' | 'ADJUSTMENT';

  @IsNumber()
  @Min(0.01)
  quantity!: number;

  @IsEnum(['SALE', 'PURCHASE', 'ADJUSTMENT', 'RETURN', 'DAMAGE', 'OTHER'])
  reason!: 'SALE' | 'PURCHASE' | 'ADJUSTMENT' | 'RETURN' | 'DAMAGE' | 'OTHER';

  @IsOptional()
  @IsUUID()
  referenceId?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsUUID()
  createdByUserId?: string;
}

export class InventoryMovementResponseDto {
  id!: string;
  clinicId!: string;
  productId!: string;
  movementType!: string;
  quantity!: number;
  reason!: string;
  referenceId?: string;
  notes?: string;
  createdAt!: Date;
}
