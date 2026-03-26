'use client';

import React from 'react';
import { MdEdit, MdDelete, MdWarningAmber, MdCheckCircle } from 'react-icons/md';

import { type Product } from '@/api/products-api';

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

interface ProductsTableProps {
  products: Product[];
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
  onToggleActive?: (product: Product) => void;
}

const categoryEmoji: Record<string, string> = {
  FOOD: '🍖',
  ACCESSORY: '🎀',
  CLOTHING: '👕',
  HYGIENE: '🧼',
  TOY: '🎾',
  OTHER: '📦',
};

const getCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    FOOD: 'Comida',
    ACCESSORY: 'Accesorios',
    HYGIENE: 'Higiene',
    DEVICE: 'Dispositivos',
  };
  return labels[category] || 'Producto';
};

export function ProductsTable({ products, onEdit, onDelete, onToggleActive }: ProductsTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-gray-50/80 border-b border-gray-200">
          <tr>
            <th className="px-4 py-2.5 text-left font-medium text-gray-600 text-xs uppercase tracking-wide">
              Producto
            </th>
            <th className="px-4 py-2.5 text-left font-medium text-gray-600 text-xs uppercase tracking-wide">
              Categoría
            </th>
            <th className="px-4 py-2.5 text-left font-medium text-gray-600 text-xs uppercase tracking-wide">
              Stock
            </th>
            <th className="px-4 py-2.5 text-right font-medium text-gray-600 text-xs uppercase tracking-wide">
              Venta
            </th>
            <th className="px-4 py-2.5 text-right font-medium text-gray-600 text-xs uppercase tracking-wide">
              Margen
            </th>
            <th className="px-4 py-2.5 text-center font-medium text-gray-600 text-xs uppercase tracking-wide">Estado</th>
            <th className="px-4 py-2.5 text-center font-medium text-gray-600 text-xs uppercase tracking-wide w-20">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {products.map((product) => {
            // Validar propiedades numéricas
            const stockQuantity = typeof product.stockQuantity === 'number' ? product.stockQuantity : 0;
            const salePrice = typeof product.salePrice === 'number' ? product.salePrice : 0;
            const costPrice = typeof product.costPrice === 'number' ? product.costPrice : undefined;
            const minStockAlert = typeof product.minStockAlert === 'number' ? product.minStockAlert : 0;
            const stockUnit = product.stockUnit || 'UNIT';
            
            const isLowStock = stockQuantity <= minStockAlert;
            const profitMargin = costPrice && salePrice ? (((salePrice - costPrice) / salePrice) * 100).toFixed(0) : 'N/A';

            return (
              <tr
                key={product.id}
                className={`transition group ${
                  !product.isActive
                    ? 'bg-gray-50 hover:bg-gray-100 border-l-4 border-l-gray-400'
                    : isLowStock
                    ? 'bg-orange-50/30 hover:bg-orange-50 border-l-4 border-l-orange-400'
                    : 'hover:bg-blue-50/30 border-l-4 border-l-blue-400'
                }`}
              >
                {/* PRODUCTO - Name, SKU, Status */}
                <td className="px-4 py-2.5">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{categoryEmoji[product.category]}</span>
                      <span className="font-semibold text-gray-900">{product.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400 font-mono">{product.sku}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                        !product.isActive
                          ? 'bg-gray-200 text-gray-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {product.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>
                </td>

                {/* CATEGORÍA */}
                <td className="px-4 py-2.5">
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                    {getCategoryLabel(product.category)}
                  </span>
                </td>

                {/* STOCK */}
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-gray-900">
                        <span className={isLowStock ? 'text-orange-600 font-bold' : 'text-green-600'}>
                          {stockQuantity} {getStockUnitLabel(stockUnit)}
                        </span>
                      </div>
                      <div className="text-[10px] text-gray-500">Mín: {minStockAlert} </div>
                    </div>
                    {isLowStock && <MdWarningAmber className="w-4 h-4 text-orange-600 flex-shrink-0" />}
                  </div>
                </td>

                {/* VENTA */}
                <td className="px-4 py-2.5 text-right">
                  <span className="text-sm font-bold text-gray-900">${typeof salePrice === 'number' ? salePrice.toFixed(2) : '0.00'}</span>
                  {costPrice && typeof costPrice === 'number' && (
                    <div className="text-[10px] text-gray-500">Costo: ${costPrice.toFixed(2)}</div>
                  )}
                </td>

                {/* MARGEN */}
                <td className="px-4 py-2.5 text-right">
                  {profitMargin !== 'N/A' ? (
                    <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">
                      {profitMargin}%
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">-</span>
                  )}
                </td>

                {/* ESTADO */}
                <td className="px-4 py-2.5 text-center">
                  {!product.isActive ? (
                    <span className="text-xs text-gray-500 font-medium">Inactivo</span>
                  ) : isLowStock ? (
                    <span className="text-xs text-orange-600 font-bold flex items-center justify-center gap-1">
                      <MdWarningAmber className="w-3 h-3" />
                      Bajo
                    </span>
                  ) : (
                    <span className="text-xs text-green-600 font-medium">Normal</span>
                  )}
                </td>

                {/* ACCIONES */}
                <td className="px-4 py-2.5">
                  <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={() => onEdit?.(product)}
                      className="p-2 text-primary-600 hover:bg-primary-100 rounded transition"
                      title="Editar"
                    >
                      <MdEdit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onToggleActive?.(product)}
                      className="p-2 text-amber-600 hover:bg-amber-100 rounded transition"
                      title={product.isActive ? 'Desactivar' : 'Activar'}
                    >
                      <MdCheckCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete?.(product)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded transition"
                      title="Eliminar"
                    >
                      <MdDelete className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
