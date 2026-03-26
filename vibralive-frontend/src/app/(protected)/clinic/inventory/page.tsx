'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { MdAdd, MdInventory2, MdRefresh } from 'react-icons/md';
import { FiFilter, FiSearch, FiAlertCircle, FiRefreshCw } from 'react-icons/fi';
import { PermissionGate } from '@/components/PermissionGate';
import { CreateProductModal } from '@/components/CreateProductModal';
import { EditProductModal } from '@/components/EditProductModal';
import { DeleteProductConfirmation } from '@/components/DeleteProductConfirmation';
import { ProductCard } from '@/components/platform/ProductCard';
import { ProductsTable } from '@/components/platform/ProductsTable';
import { getProducts, createProduct, updateProduct, deleteProduct, type Product } from '@/api/products-api';
import toast from 'react-hot-toast';

type ViewMode = 'cards' | 'table';

export default function InventoryPageV2() {
  const [filterCategory, setFilterCategory] = useState('all');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

  // ==================== LOAD DATA ====================
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setIsLoading(true);
        const data = await getProducts();
        setProducts(data);
      } catch (error) {
        console.error('Error loading products:', error);
        toast.error('Error al cargar productos');
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();
  }, []);

  // ==================== HANDLERS ====================
  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const data = await getProducts();
      setProducts(data);
      toast.success('Inventario actualizado');
    } catch (error) {
      toast.error('Error al actualizar inventario');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProduct = async (newProduct: Product) => {
    try {
      setIsCreating(true);
      const created = await createProduct({
        name: newProduct.name,
        sku: newProduct.sku,
        description: newProduct.description,
        category: newProduct.category,
        brand: newProduct.brand,
        stockQuantity: newProduct.stockQuantity,
        stockUnit: newProduct.stockUnit,
        minStockAlert: newProduct.minStockAlert,
        salePrice: newProduct.salePrice,
        costPrice: newProduct.costPrice,
        isActive: newProduct.isActive,
      });
      setProducts([...products, created]);
      setIsCreateModalOpen(false);
      toast.success('Producto creado exitosamente');
    } catch (error) {
      console.error('Error creating product:', error);
      toast.error('Error al crear producto');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditProduct = async (updatedProduct: Product) => {
    try {
      setIsCreating(true);
      const updated = await updateProduct(updatedProduct.id, {
        name: updatedProduct.name,
        sku: updatedProduct.sku,
        description: updatedProduct.description,
        category: updatedProduct.category,
        brand: updatedProduct.brand,
        stockQuantity: updatedProduct.stockQuantity,
        stockUnit: updatedProduct.stockUnit,
        minStockAlert: updatedProduct.minStockAlert,
        salePrice: updatedProduct.salePrice,
        costPrice: updatedProduct.costPrice,
        isActive: updatedProduct.isActive,
      });
      setProducts(products.map(p => p.id === updated.id ? updated : p));
      setIsEditModalOpen(false);
      setEditingProduct(null);
      toast.success('Producto actualizado exitosamente');
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Error al actualizar producto');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteProduct = (product: Product) => {
    setDeletingProduct(product);
  };

  const handleConfirmDelete = async () => {
    if (deletingProduct) {
      try {
        await deleteProduct(deletingProduct.id);
        setProducts(products.filter(p => p.id !== deletingProduct.id));
        setDeletingProduct(null);
        toast.success('Producto eliminado');
      } catch (error) {
        console.error('Error deleting product:', error);
        toast.error('Error al eliminar producto');
      }
    }
  };

  const handleToggleActive = async (product: Product) => {
    try {
      // Enviar todos los campos para preservar la información completa
      const updated = await updateProduct(product.id, {
        name: product.name,
        sku: product.sku,
        description: product.description,
        category: product.category,
        brand: product.brand,
        stockQuantity: product.stockQuantity,
        stockUnit: product.stockUnit,
        minStockAlert: product.minStockAlert,
        salePrice: product.salePrice,
        costPrice: product.costPrice,
        isActive: !product.isActive,
      });
      setProducts(products.map(p => p.id === updated.id ? updated : p));
      toast.success(`Producto ${!product.isActive ? 'activado' : 'desactivado'}`);
    } catch (error) {
      console.error('Error toggling product:', error);
      toast.error('Error al actualizar producto');
    }
  };

  // ==================== FILTERING ====================
  const filteredAndSortedProducts = useMemo(() => {
    // Filter out undefined products first
    let filtered = products.filter(p => p && typeof p === 'object');

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        (p.name?.toLowerCase().includes(term) || false) ||
        (p.sku?.toLowerCase().includes(term) || false)
      );
    }

    // Category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(p => p.category === filterCategory);
    }

    // Low stock filter
    if (showLowStockOnly) {
      filtered = filtered.filter(p => (p.stockQuantity ?? 0) <= (p.minStockAlert ?? 0));
    }

    return filtered;
  }, [products, searchTerm, filterCategory, showLowStockOnly]);

  // ==================== STATS ====================
  const stats = useMemo(() => {
    // Filter out any undefined products
    const validProducts = products.filter(p => p && typeof p === 'object');
    
    const total = validProducts.length;
    const lowStock = validProducts.filter(p => p.stockQuantity <= (p.minStockAlert ?? 0)).length;
    const totalValue = validProducts.reduce((sum, p) => sum + ((p.stockQuantity ?? 0) * (p.salePrice ?? 0)), 0);
    const inactive = validProducts.filter(p => !p.isActive).length;

    return { total, lowStock, totalValue, inactive };
  }, [products]);

  return (
    <div className="min-h-screen bg-slate-50 -m-6 lg:-m-4">
      {/* Modals */}
      <CreateProductModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateProduct}
      />
      <EditProductModal 
        isOpen={isEditModalOpen} 
        product={editingProduct}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingProduct(null);
        }}
        onSuccess={handleEditProduct}
      />
      <DeleteProductConfirmation 
        isOpen={!!deletingProduct}
        product={deletingProduct}
        onClose={() => setDeletingProduct(null)}
        onSuccess={handleConfirmDelete}
      />

      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <MdInventory2 className="text-primary-600 text-3xl" />
              Inventario
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Gestión de productos y stock
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Refresh */}
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              title="Actualizar"
            >
              <FiRefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            {/* New Product Button */}
            <button
              onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition"
            >
              <MdAdd className="w-5 h-5" />
              <span className="hidden sm:inline">Nuevo Producto</span>
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="flex flex-wrap gap-3 mt-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-sm">
            <FiSearch className="text-slate-500" />
            <span className="text-slate-600">Total:</span>
            <span className="font-semibold">{stats.total}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 rounded-lg text-sm">
            <MdInventory2 className="text-orange-600" />
            <span className="text-orange-700">Stock bajo:</span>
            <span className="font-semibold text-orange-700">{stats.lowStock}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg text-sm">
            <span className="text-green-600">💰</span>
            <span className="text-green-700">Valor:</span>
            <span className="font-semibold text-green-700">${stats.totalValue.toFixed(2)}</span>
          </div>
          {stats.inactive > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg text-sm">
              <span className="text-gray-600">🔒</span>
              <span className="text-gray-700">Inactivos:</span>
              <span className="font-semibold text-gray-700">{stats.inactive}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Panel - Filters */}
          <div className="lg:col-span-1 space-y-4">
            {/* Search */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2">
                <FiSearch className="w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Buscar producto..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 border-none outline-none text-sm bg-transparent"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <FiFilter className="text-slate-500" />
                <span className="text-sm font-medium text-slate-700">Categoría</span>
              </div>
              <div className="space-y-2">
                {['all', 'FOOD', 'ACCESSORY', 'HYGIENE', 'DEVICE'].map((cat) => (
                  <button 
                    key={cat}
                    onClick={() => setFilterCategory(cat)} 
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${
                      filterCategory === cat
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat === 'all' ? '📦 Todas' : cat === 'FOOD' ? '🍖 Comida' : cat === 'ACCESSORY' ? '🎀 Accesorios' : cat === 'HYGIENE' ? '🧼 Higiene' : '📱 Dispositivos'}
                  </button>
                ))}
              </div>
            </div>

            {/* Low Stock Filter */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={showLowStockOnly} 
                  onChange={(e) => setShowLowStockOnly(e.target.checked)} 
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-slate-700">Solo stock bajo</span>
              </label>
            </div>
          </div>

          {/* Right Panel - Products */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              {/* Header with view toggle */}
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <p className="text-sm text-slate-600">
                  {filteredAndSortedProducts.length} productos encontrados
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`p-2 rounded-lg transition ${
                      viewMode === 'cards'
                        ? 'bg-primary-100 text-primary-600'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                    title="Vista de tarjetas"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4z" />
                      <path d="M3 10a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-2 rounded-lg transition ${
                      viewMode === 'table'
                        ? 'bg-primary-100 text-primary-600'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                    title="Vista de tabla"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {filteredAndSortedProducts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <FiAlertCircle className="w-12 h-12 text-slate-300 mb-3" />
                    <p className="text-slate-500">No hay productos que mostrar</p>
                  </div>
                ) : viewMode === 'cards' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filteredAndSortedProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onEdit={(p) => {
                          setEditingProduct(p);
                          setIsEditModalOpen(true);
                        }}
                        onDelete={handleDeleteProduct}
                        onToggleActive={handleToggleActive}
                      />
                    ))}
                  </div>
                ) : (
                  <ProductsTable
                    products={filteredAndSortedProducts}
                    onEdit={(p) => {
                      setEditingProduct(p);
                      setIsEditModalOpen(true);
                    }}
                    onDelete={handleDeleteProduct}
                    onToggleActive={handleToggleActive}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
