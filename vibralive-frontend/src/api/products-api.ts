import { api } from '@/lib/api';

export interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  category: 'FOOD' | 'ACCESSORY' | 'CLOTHING' | 'HYGIENE' | 'TOY' | 'OTHER';
  brand?: string;
  salePrice: number;
  costPrice?: number;
  stockQuantity: number;
  stockUnit: 'UNIT' | 'KG' | 'BAG' | 'BOX' | 'LITER' | 'PACK';
  minStockAlert?: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProductPayload {
  name: string;
  sku: string;
  description?: string;
  category: 'FOOD' | 'ACCESSORY' | 'CLOTHING' | 'HYGIENE' | 'TOY' | 'OTHER';
  brand?: string;
  salePrice: number;
  costPrice?: number;
  stockQuantity: number;
  stockUnit: 'UNIT' | 'KG' | 'BAG' | 'BOX' | 'LITER' | 'PACK';
  minStockAlert?: number;
  isActive?: boolean;
}

export interface UpdateProductPayload extends Partial<CreateProductPayload> {
  id: string;
}

/**
 * Get all products for the clinic
 */
export const getProducts = async (): Promise<Product[]> => {
  try {
    const response = await api.get('/pos/products');
    const products = (response.data?.data || response.data || []) as Product[];
    // Filter out undefined/null values and ensure valid products
    return products.filter((p): p is Product => p !== null && p !== undefined && typeof p === 'object' && 'id' in p) || [];
  } catch (error: any) {
    console.error('[ProductsApi] Error fetching products:', error);
    return [];
  }
};

/**
 * Get a single product by ID
 */
export const getProduct = async (productId: string): Promise<Product | null> => {
  try {
    const response = await api.get(`/pos/products/${productId}`);
    const product = (response.data?.data || response.data || null) as Product | null;
    return product;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    console.error('[ProductsApi] Error fetching product:', error);
    return null;
  }
};

/**
 * Create a new product
 */
export const createProduct = async (payload: CreateProductPayload): Promise<Product> => {
  try {
    const response = await api.post('/pos/products', payload);
    const product = (response.data?.data || response.data) as Product;
    return product;
  } catch (error: any) {
    console.error('[ProductsApi] Error creating product:', error);
    throw error;
  }
};

/**
 * Update an existing product
 */
export const updateProduct = async (productId: string, payload: Partial<CreateProductPayload>): Promise<Product> => {
  try {
    const response = await api.put(`/pos/products/${productId}`, payload);
    const product = (response.data?.data || response.data) as Product;
    return product;
  } catch (error: any) {
    console.error('[ProductsApi] Error updating product:', error);
    throw error;
  }
};

/**
 * Delete a product
 */
export const deleteProduct = async (productId: string): Promise<Product> => {
  try {
    // Soft delete by setting isActive to false
    return await updateProduct(productId, { isActive: false });
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

/**
 * Search products - NOT IMPLEMENTED IN BACKEND
 * This function is a placeholder. Implement full-text search in backend if needed.
 */
export const searchProducts = async (query: string): Promise<Product[]> => {
  try {
    // For now, fetch all products and filter client-side
    const allProducts = await getProducts();
    return allProducts.filter(p => 
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.sku.toLowerCase().includes(query.toLowerCase()) ||
      (p.description?.toLowerCase().includes(query.toLowerCase()) || false) ||
      (p.brand?.toLowerCase().includes(query.toLowerCase()) || false)
    );
  } catch (error) {
    console.error('Error searching products:', error);
    throw error;
  }
};

/**
 * Get low stock products
 */
export const getLowStockProducts = async (): Promise<Product[]> => {
  try {
    const response = await api.get('/pos/products/alerts/low-stock');
    const products = (response.data?.data || response.data || []) as Product[];
    return products || [];
  } catch (error: any) {
    console.error('[ProductsApi] Error fetching low stock products:', error);
    return [];
  }
};
