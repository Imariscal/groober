import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createSale,
  getSales,
  getSaleById,
  updateSale,
  completeSale,
  cancelSale,
  refundSale,
  addPayment,
  getSalesReport,
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  getLowStockProducts,
  addInventory,
  removeInventory,
  getInventoryMovements,
  getInventoryReport,
  getInventoryAlerts,
} from '@/lib/pos-api';
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

const POS_QUERY_KEY = 'pos';

// ========================
// SALES HOOKS
// ========================

/**
 * Query hook for fetching sales with filters
 */
export function useSalesQuery(filters?: Record<string, any>) {
  return useQuery<SalesListResponseDto>({
    queryKey: [POS_QUERY_KEY, 'sales', filters],
    queryFn: () => getSales(filters),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Query hook for fetching single sale
 */
export function useSaleQuery(saleId: string) {
  return useQuery<SaleResponseDto>({
    queryKey: [POS_QUERY_KEY, 'sale', saleId],
    queryFn: () => getSaleById(saleId),
    enabled: !!saleId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Mutation hook for creating sales
 */
export function useCreateSaleMutation() {
  const queryClient = useQueryClient();

  return useMutation<SaleResponseDto, Error, CreateSaleDto>({
    mutationFn: (dto: CreateSaleDto) => createSale(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [POS_QUERY_KEY, 'sales'] });
    },
  });
}

/**
 * Mutation hook for updating sales
 */
export function useUpdateSaleMutation(saleId: string) {
  const queryClient = useQueryClient();

  return useMutation<SaleResponseDto, Error, CreateSaleDto>({
    mutationFn: (dto: CreateSaleDto) => updateSale(saleId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [POS_QUERY_KEY] });
    },
  });
}

/**
 * Mutation hook for completing sales
 */
export function useCompleteSaleMutation(saleId: string) {
  const queryClient = useQueryClient();

  return useMutation<SaleResponseDto, Error, void>({
    mutationFn: () => completeSale(saleId),
    onSuccess: () => {
      // Invalidate only sales-related queries (not entire POS namespace)
      queryClient.invalidateQueries({ queryKey: [POS_QUERY_KEY, 'sales'] });
      queryClient.invalidateQueries({ queryKey: [POS_QUERY_KEY, 'sale', saleId] });
    },
  });
}

/**
 * Mutation hook for canceling sales
 */
export function useCancelSaleMutation(saleId: string) {
  const queryClient = useQueryClient();

  return useMutation<SaleResponseDto, Error, void>({
    mutationFn: () => cancelSale(saleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [POS_QUERY_KEY] });
    },
  });
}

/**
 * Mutation hook for refunding sales
 */
export function useRefundSaleMutation(saleId: string) {
  const queryClient = useQueryClient();

  return useMutation<SaleResponseDto, Error, { reason?: string; amount?: number }>({
    mutationFn: ({ reason, amount }: { reason?: string; amount?: number }) =>
      refundSale(saleId, reason, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [POS_QUERY_KEY] });
    },
  });
}

/**
 * Mutation hook for adding payments
 */
export function useAddPaymentMutation(saleId: string) {
  const queryClient = useQueryClient();

  return useMutation<SalePaymentResponseDto, Error, CreateSalePaymentDto>({
    mutationFn: (dto: CreateSalePaymentDto) => addPayment(saleId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [POS_QUERY_KEY, 'sale', saleId] });
    },
  });
}

// ========================
// PRODUCTS HOOKS
// ========================

/**
 * Query hook for fetching products with filters
 */
export function useProductsQuery(filters?: Record<string, any>) {
  return useQuery<ProductsListResponseDto>({
    queryKey: [POS_QUERY_KEY, 'products', filters],
    queryFn: () => getProducts(filters),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Query hook for fetching single product
 */
export function useProductQuery(productId: string) {
  return useQuery<SaleProductResponseDto>({
    queryKey: [POS_QUERY_KEY, 'product', productId],
    queryFn: () => getProductById(productId),
    enabled: !!productId,
  });
}

/**
 * Query hook for fetching low-stock products
 */
export function useLowStockProductsQuery(threshold: number = 10) {
  return useQuery<SaleProductResponseDto[]>({
    queryKey: [POS_QUERY_KEY, 'low-stock', threshold],
    queryFn: () => getLowStockProducts(threshold),
    staleTime: 10 * 60 * 1000, // Refresh every 10 mins
  });
}

/**
 * Mutation hook for creating products
 */
export function useCreateProductMutation() {
  const queryClient = useQueryClient();

  return useMutation<SaleProductResponseDto, Error, CreateSaleProductDto>({
    mutationFn: (dto: CreateSaleProductDto) => createProduct(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [POS_QUERY_KEY, 'products'] });
    },
  });
}

/**
 * Mutation hook for updating products
 */
export function useUpdateProductMutation(productId: string) {
  const queryClient = useQueryClient();

  return useMutation<SaleProductResponseDto, Error, CreateSaleProductDto>({
    mutationFn: (dto: CreateSaleProductDto) => updateProduct(productId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [POS_QUERY_KEY] });
    },
  });
}

// ========================
// INVENTORY HOOKS
// ========================

/**
 * Query hook for fetching inventory movements
 */
export function useInventoryMovementsQuery(filters?: Record<string, any>) {
  return useQuery<InventoryMovementsListResponseDto>({
    queryKey: [POS_QUERY_KEY, 'inventory', 'movements', filters],
    queryFn: () => getInventoryMovements(filters),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Query hook for fetching inventory alerts
 */
export function useInventoryAlertsQuery() {
  return useQuery<any>({
    queryKey: [POS_QUERY_KEY, 'inventory', 'alerts'],
    queryFn: getInventoryAlerts,
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Mutation hook for adding inventory
 */
export function useAddInventoryMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    InventoryMovementResponseDto,
    Error,
    {
      productId: string;
      quantity: number;
      reason?: string;
    }
  >({
    mutationFn: ({
      productId,
      quantity,
      reason,
    }: {
      productId: string;
      quantity: number;
      reason?: string;
    }) => addInventory(productId, quantity, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [POS_QUERY_KEY, 'inventory'] });
      queryClient.invalidateQueries({ queryKey: [POS_QUERY_KEY, 'products'] });
    },
  });
}

/**
 * Mutation hook for removing inventory
 */
export function useRemoveInventoryMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    InventoryMovementResponseDto,
    Error,
    {
      productId: string;
      quantity: number;
      reason?: string;
    }
  >({
    mutationFn: ({
      productId,
      quantity,
      reason,
    }: {
      productId: string;
      quantity: number;
      reason?: string;
    }) => removeInventory(productId, quantity, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [POS_QUERY_KEY, 'inventory'] });
      queryClient.invalidateQueries({ queryKey: [POS_QUERY_KEY, 'products'] });
    },
  });
}
