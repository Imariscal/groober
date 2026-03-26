/**
 * POS Module DTOs
 * Frontend type definitions for POS API
 */

// ============ RESPONSE TYPES ============

export interface SalesListResponseDto {
  data: SaleResponseDto[];
  total: number;
}

export interface ProductsListResponseDto {
  data: SaleProductResponseDto[];
  total: number;
}

export interface InventoryMovementsListResponseDto {
  data: InventoryMovementResponseDto[];
  total: number;
}

// ============ PRODUCTS ============

export interface CreateSaleProductDto {
  clinicId: string;
  sku: string;
  name: string;
  description?: string;
  category: 'FOOD' | 'ACCESSORY' | 'CLOTHING' | 'HYGIENE' | 'TOY' | 'OTHER';
  brand?: string;
  salePrice: number;
  costPrice?: number;
  stockQuantity?: number;
  stockUnit?: 'UNIT' | 'KG' | 'BAG' | 'BOX' | 'LITER' | 'PACK';
  minStockAlert?: number;
}

export interface SaleProductResponseDto {
  id: string;
  clinicId: string;
  sku: string;
  name: string;
  description?: string;
  category: string;
  brand?: string;
  salePrice: number;
  costPrice?: number;
  stockQuantity: number;
  stockUnit: string;
  minStockAlert?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============ SALES ============

export interface SaleItemLineDto {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateSaleDto {
  clinicId: string;
  clientId?: string;
  appointmentId?: string;
  saleType?: 'POS' | 'APPOINTMENT_ADDON';
  items: SaleItemLineDto[];
  discountAmount?: number;
  taxAmount?: number;
  notes?: string;
  createdByUserId?: string;
}

export interface CompleteSaleDto {
  items: SaleItemLineDto[];
  discountAmount?: number;
  taxAmount?: number;
  notes?: string;
}

export interface SaleResponseDto {
  id: string;
  clinicId: string;
  clientId?: string;
  appointmentId?: string;
  saleType: string;
  status: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string;
  soldAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  items?: Array<{
    id: string;
    productId: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    product?: {
      id: string;
      name: string;
      sku: string;
    };
  }>;
}

// ============ PAYMENTS ============

export interface CreateSalePaymentDto {
  amount: number;
  method: 'CASH' | 'CARD' | 'TRANSFER' | 'CHECK' | 'OTHER';
  reference?: string;
  notes?: string;
}

export interface SalePaymentResponseDto {
  id: string;
  saleId: string;
  amount: number;
  method: string;
  reference?: string;
  notes?: string;
  createdAt: Date;
}

// ============ INVENTORY ============

export interface InventoryMovementResponseDto {
  id: string;
  productId: string;
  type: 'ADD' | 'REMOVE' | 'ADJUST';
  quantity: number;
  reason?: string;
  reference?: string;
  createdAt: Date;
}

export interface InventoryAlertDto {
  productId: string;
  productName: string;
  currentStock: number;
  minStockAlert: number;
  status: 'CRITICAL' | 'WARNING' | 'NORMAL';
}
