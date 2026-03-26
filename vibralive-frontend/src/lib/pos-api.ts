import { apiClient } from '@/lib/api-client';
import {
  CreateSaleDto,
  SaleResponseDto,
  CreateSaleProductDto,
  SaleProductResponseDto,
  CreateSalePaymentDto,
  SalePaymentResponseDto,
  InventoryMovementResponseDto,
  SalesListResponseDto,
  ProductsListResponseDto,
  InventoryMovementsListResponseDto,
} from '@/modules/pos/dtos/index';

/**
 * POS API Client
 * Handles all point-of-sale operations: sales, products, and inventory
 */

// ========================
// SALES OPERATIONS
// ========================

export async function createSale(dto: CreateSaleDto): Promise<SaleResponseDto> {
  return apiClient.post<SaleResponseDto>('/pos/sales', dto);
}

export async function createSaleFromAppointment(appointmentId: string): Promise<SaleResponseDto> {
  const response = await apiClient.post<SaleResponseDto>(`/pos/sales/from-appointment/${appointmentId}`, {});
  return response.data || response;
}

export async function getSales(
  filters?: Record<string, any>,
): Promise<SalesListResponseDto> {
  return apiClient.get<SalesListResponseDto>('/pos/sales', { params: filters });
}

export async function getSaleById(saleId: string): Promise<SaleResponseDto> {
  const response = await apiClient.get<any>(`/pos/sales/${saleId}`);
  // Backend returns { data: sale }, extract it
  return response.data || response;
}

export async function updateSale(
  saleId: string,
  dto: CreateSaleDto,
): Promise<SaleResponseDto> {
  return apiClient.put<SaleResponseDto>(`/pos/sales/${saleId}`, dto);
}

export async function completeSale(saleId: string): Promise<SaleResponseDto> {
  return apiClient.patch<SaleResponseDto>(`/pos/sales/${saleId}/complete`, {});
}

export async function cancelSale(saleId: string): Promise<SaleResponseDto> {
  return apiClient.patch<SaleResponseDto>(`/pos/sales/${saleId}/cancel`, {});
}

export async function refundSale(
  saleId: string,
  reason?: string,
  refundAmount?: number,
): Promise<SaleResponseDto> {
  return apiClient.patch<SaleResponseDto>(`/pos/sales/${saleId}/refund`, { reason, refundAmount });
}

export async function addPayment(
  saleId: string,
  dto: CreateSalePaymentDto,
): Promise<SalePaymentResponseDto> {
  return apiClient.post<SalePaymentResponseDto>(`/pos/sales/${saleId}/payments`, dto);
}

export async function getSalesReport(
  dateFrom: Date,
  dateTo: Date,
): Promise<any> {
  return apiClient.get<any>('/pos/sales-report', {
    params: {
      dateFrom: dateFrom.toISOString(),
      dateTo: dateTo.toISOString(),
    },
  });
}

// ========================
// PRODUCTS OPERATIONS
// ========================

export async function getProducts(
  filters?: Record<string, any>,
): Promise<ProductsListResponseDto> {
  return apiClient.get<ProductsListResponseDto>('/pos/products', { params: filters });
}

export async function getProductById(productId: string): Promise<SaleProductResponseDto> {
  return apiClient.get<SaleProductResponseDto>(`/pos/products/${productId}`);
}

export async function createProduct(
  dto: CreateSaleProductDto,
): Promise<SaleProductResponseDto> {
  return apiClient.post<SaleProductResponseDto>('/pos/products', dto);
}

export async function updateProduct(
  productId: string,
  dto: CreateSaleProductDto,
): Promise<SaleProductResponseDto> {
  return apiClient.put<SaleProductResponseDto>(`/pos/products/${productId}`, dto);
}

export async function getLowStockProducts(
  threshold?: number,
): Promise<SaleProductResponseDto[]> {
  return apiClient.get<SaleProductResponseDto[]>('/pos/products-low-stock', {
    params: { threshold: threshold || 10 },
  });
}

// ========================
// INVENTORY OPERATIONS
// ========================

export async function addInventory(
  productId: string,
  quantity: number,
  reason?: string,
): Promise<InventoryMovementResponseDto> {
  return apiClient.post<InventoryMovementResponseDto>('/pos/inventory/add', { productId, quantity, reason });
}

export async function removeInventory(
  productId: string,
  quantity: number,
  reason?: string,
): Promise<InventoryMovementResponseDto> {
  return apiClient.post<InventoryMovementResponseDto>('/pos/inventory/remove', { productId, quantity, reason });
}

export async function getInventoryMovements(
  filters?: Record<string, any>,
): Promise<InventoryMovementsListResponseDto> {
  return apiClient.get<InventoryMovementsListResponseDto>('/pos/inventory/movements', { params: filters });
}

export async function getInventoryReport(
  dateFrom: Date,
  dateTo: Date,
): Promise<any> {
  return apiClient.get<any>('/pos/inventory-report', {
    params: {
      dateFrom: dateFrom.toISOString(),
      dateTo: dateTo.toISOString(),
    },
  });
}

export async function getInventoryAlerts(): Promise<any> {
  return apiClient.get<any>('/pos/inventory-alerts');
}
