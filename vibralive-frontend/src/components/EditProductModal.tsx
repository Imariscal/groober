'use client';

import React, { useState, useEffect } from 'react';
import { MdClose, MdInventory2 } from 'react-icons/md';
import { type Product, updateProduct } from '@/api/products-api';
import toast from 'react-hot-toast';

// Helper para traducir unidades
const getStockUnitLabel = (unit: string): string => {
  const unitMap: Record<string, string> = {
    'UNIT': 'Unidad',
    'KG': 'Kilogramo',
    'BAG': 'Bolsa',
    'BOX': 'Caja',
    'LITER': 'Litro',
    'PACK': 'Pack',
  };
  return unitMap[unit] || unit;
};

export { getStockUnitLabel };

interface EditProductModalProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
  onSuccess?: (product: Product) => void;
}

const CATEGORIES_OPTIONS = [
  { value: 'FOOD', label: '🍖 Comida' },
  { value: 'ACCESSORY', label: '🎀 Accesorios' },
  { value: 'CLOTHING', label: '👕 Ropa' },
  { value: 'HYGIENE', label: '🧼 Higiene' },
  { value: 'TOY', label: '🎾 Juguetes' },
  { value: 'OTHER', label: '📦 Otros' },
] as const;

const STOCK_UNITS_OPTIONS = [
  { value: 'UNIT', label: 'Unidad' },
  { value: 'KG', label: 'Kilogramo' },
  { value: 'BAG', label: 'Bolsa' },
  { value: 'BOX', label: 'Caja' },
  { value: 'LITER', label: 'Litro' },
  { value: 'PACK', label: 'Pack' },
] as const;

export function EditProductModal({ isOpen, product, onClose, onSuccess }: EditProductModalProps) {
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    category: '' as 'FOOD' | 'ACCESSORY' | 'CLOTHING' | 'HYGIENE' | 'TOY' | 'OTHER' | '',
    brand: '',
    stockQuantity: '',
    stockUnit: 'UNIT' as 'UNIT' | 'KG' | 'BAG' | 'BOX' | 'LITER' | 'PACK',
    minStockAlert: '',
    salePrice: '',
    costPrice: '',
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen && product) {
      setFormData({
        name: product.name || '',
        sku: product.sku || '',
        description: product.description || '',
        category: product.category || '',
        brand: product.brand || '',
        stockQuantity: String(product.stockQuantity || ''),
        stockUnit: product.stockUnit || 'UNIT',
        minStockAlert: String(product.minStockAlert || ''),
        salePrice: String(product.salePrice || ''),
        costPrice: String(product.costPrice || ''),
        isActive: product.isActive ?? true,
      });
      setErrors({});
    }
  }, [isOpen, product]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre del producto es requerido';
    } else if (formData.name.trim().length < 2 || formData.name.length > 200) {
      newErrors.name = 'El nombre debe tener entre 2 y 200 caracteres';
    }

    if (!formData.sku.trim()) {
      newErrors.sku = 'El SKU es requerido';
    } else if (formData.sku.trim().length < 3) {
      newErrors.sku = 'El SKU debe tener al menos 3 caracteres';
    }

    if (!formData.category) {
      newErrors.category = 'Selecciona una categoría';
    }

    if (!formData.stockQuantity) {
      newErrors.stockQuantity = 'La cantidad es requerida';
    } else if (isNaN(Number(formData.stockQuantity)) || Number(formData.stockQuantity) < 0) {
      newErrors.stockQuantity = 'La cantidad debe ser un número válido';
    }

    if (formData.minStockAlert && (isNaN(Number(formData.minStockAlert)) || Number(formData.minStockAlert) < 0)) {
      newErrors.minStockAlert = 'La alerta mínima debe ser un número válido';
    }

    if (!formData.salePrice) {
      newErrors.salePrice = 'El precio de venta es requerido';
    } else if (isNaN(Number(formData.salePrice)) || Number(formData.salePrice) <= 0) {
      newErrors.salePrice = 'El precio debe ser mayor a 0';
    }

    if (formData.costPrice && (isNaN(Number(formData.costPrice)) || Number(formData.costPrice) < 0)) {
      newErrors.costPrice = 'El precio de costo debe ser un número válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !product) return;

    try {
      setLoading(true);

      // Llamar al API para actualizar el producto
      const updated = await updateProduct(product.id, {
        name: formData.name,
        sku: formData.sku,
        description: formData.description || undefined,
        category: formData.category as 'FOOD' | 'ACCESSORY' | 'CLOTHING' | 'HYGIENE' | 'TOY' | 'OTHER',
        brand: formData.brand || undefined,
        stockQuantity: Number(formData.stockQuantity),
        stockUnit: formData.stockUnit,
        minStockAlert: formData.minStockAlert ? Number(formData.minStockAlert) : undefined,
        salePrice: Number(formData.salePrice),
        costPrice: formData.costPrice ? Number(formData.costPrice) : undefined,
        isActive: formData.isActive,
      });

      toast.success('Producto actualizado exitosamente');
      onSuccess?.(updated);
      onClose();
    } catch (error: any) {
      console.error('Error updating product:', error);
      toast.error(error.message || 'Error al actualizar producto');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !product) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[95vh] flex flex-col transform transition-all duration-300">
          <div className="sticky top-0 z-20 bg-gradient-to-r from-primary-600 via-primary-600 to-primary-700 px-6 py-4 flex items-center justify-between border-b border-primary-600 shadow-sm">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <MdInventory2 className="w-6 h-6 text-white" />
                <h2 className="text-2xl font-bold text-white">Editar Producto</h2>
              </div>
              <p className="text-primary-100 text-sm">Actualiza los detalles del producto</p>
            </div>
            <button onClick={onClose} className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition duration-200">
              <MdClose className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-5 bg-blue-600 rounded-full"></div>
                <h3 className="text-sm font-semibold text-gray-900">Información Básica</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">Nombre *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="ej: Comida Premium"
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition ${
                      errors.name ? 'border-red-300 focus:ring-red-500 bg-red-50' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-300'
                    }`}
                  />
                  {errors.name && <p className="text-xs text-red-600 mt-1">⚠️ {errors.name}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">SKU *</label>
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleInputChange}
                    placeholder="ej: FOOD-001"
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition ${
                      errors.sku ? 'border-red-300 focus:ring-red-500 bg-red-50' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-300'
                    }`}
                  />
                  {errors.sku && <p className="text-xs text-red-600 mt-1">⚠️ {errors.sku}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">Categoría *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition ${
                      errors.category ? 'border-red-300 focus:ring-red-500 bg-red-50' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-300'
                    }`}
                  >
                    <option value="">Selecciona una categoría</option>
                    {CATEGORIES_OPTIONS.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                  {errors.category && <p className="text-xs text-red-600 mt-1">⚠️ {errors.category}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">Marca</label>
                  <input type="text" name="brand" value={formData.brand} onChange={handleInputChange} placeholder="ej: Royal Canin" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-300 transition" />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">Descripción</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Detalles adicionales..." rows={2} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-300 transition resize-none" />
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-5 bg-blue-600 rounded-full"></div>
                <h3 className="text-sm font-semibold text-gray-900">Inventario</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">Cantidad *</label>
                  <input type="number" name="stockQuantity" value={formData.stockQuantity} onChange={handleInputChange} placeholder="0" min="0" step="0.01" className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition ${errors.stockQuantity ? 'border-red-300 focus:ring-red-500 bg-red-50' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-300'}`} />
                  {errors.stockQuantity && <p className="text-xs text-red-600 mt-1">⚠️ {errors.stockQuantity}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">Unidad</label>
                  <select name="stockUnit" value={formData.stockUnit} onChange={handleInputChange} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-300 transition">
                    {STOCK_UNITS_OPTIONS.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">Alerta Stock Mínimo</label>
                <input type="number" name="minStockAlert" value={formData.minStockAlert} onChange={handleInputChange} placeholder="Cantidad mínima" min="0" step="0.01" className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition ${errors.minStockAlert ? 'border-red-300 focus:ring-red-500 bg-red-50' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-300'}`} />
                {errors.minStockAlert && <p className="text-xs text-red-600 mt-1">⚠️ {errors.minStockAlert}</p>}
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-5 bg-blue-600 rounded-full"></div>
                <h3 className="text-sm font-semibold text-gray-900">Precios</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">Precio Venta *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-500 text-sm">$</span>
                    <input type="number" name="salePrice" value={formData.salePrice} onChange={handleInputChange} placeholder="0.00" min="0" step="0.01" className={`w-full pl-7 pr-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition ${errors.salePrice ? 'border-red-300 focus:ring-red-500 bg-red-50' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-300'}`} />
                  </div>
                  {errors.salePrice && <p className="text-xs text-red-600 mt-1">⚠️ {errors.salePrice}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">Precio Costo</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-500 text-sm">$</span>
                    <input type="number" name="costPrice" value={formData.costPrice} onChange={handleInputChange} placeholder="0.00" min="0" step="0.01" className={`w-full pl-7 pr-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition ${errors.costPrice ? 'border-red-300 focus:ring-red-500 bg-red-50' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-300'}`} />
                  </div>
                  {errors.costPrice && <p className="text-xs text-red-600 mt-1">⚠️ {errors.costPrice}</p>}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleInputChange} className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" />
                <span className="text-sm font-medium text-gray-700">Producto activo</span>
              </label>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-semibold text-sm">
                Cancelar
              </button>
              <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold text-sm flex items-center justify-center gap-2">
                {loading ? <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Guardando...
                </> : <>
                  <MdInventory2 className="w-4 h-4" />
                  Guardar Cambios
                </>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
