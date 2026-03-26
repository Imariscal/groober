'use client';

import React, { useState } from 'react';
import { MdEdit, MdDelete, MdMoreVert, MdCheckCircle } from 'react-icons/md';

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

interface ProductCardProps {
  product: Product;
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
    CLOTHING: 'Ropa',
    HYGIENE: 'Higiene',
    TOY: 'Juguetes',
    OTHER: 'Otros',
  };
  return labels[category] || 'Producto';
};

export function ProductCard({ product, onEdit, onDelete, onToggleActive }: ProductCardProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Valores numéricos - ahora el backend retorna números correctamente
  const stockQuantity = Number(product.stockQuantity) || 0;
  const salePrice = Number(product.salePrice) || 0;
  const costPrice = product.costPrice ? Number(product.costPrice) : undefined;
  const minStockAlert = Number(product.minStockAlert) || 0;

  const isLowStock = stockQuantity <= minStockAlert;
  const profitMargin = costPrice && salePrice ? (((salePrice - costPrice) / salePrice) * 100).toFixed(0) : null;

  const headerBg = !product.isActive
    ? 'bg-gradient-to-r from-gray-600 to-gray-700'
    : isLowStock
    ? 'bg-gradient-to-r from-warning-600 to-warning-700'
    : 'bg-gradient-to-r from-primary-600 to-primary-700';

  const statusLabel = !product.isActive ? 'Inactivo' : isLowStock ? 'Stock Bajo' : 'Disponible';
  const statusBadge = !product.isActive ? 'bg-gray-500' : isLowStock ? 'bg-orange-500' : 'bg-green-500';
  const cardBg = !product.isActive ? 'bg-gray-50' : 'bg-white';

  return (
    <div className={`rounded-lg border overflow-hidden transition-all hover:shadow-md h-96 flex flex-col ${cardBg} ${!product.isActive ? 'border-gray-200' : 'border-primary-200'}`}>
      {/* HEADER */}
      <div className={`${headerBg} px-4 py-3 relative flex-shrink-0`}>
        {/* Status Badge */}
        <span className={`absolute top-3 right-12 px-2.5 py-0.5 rounded text-xs font-semibold text-white ${statusBadge}`}>
          {statusLabel}
        </span>

        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            {categoryEmoji[product.category] || '📦'}
          </div>

          {/* Name + SKU */}
          <div className="flex-1 min-w-0 pr-10">
            <h3 className="font-bold text-white text-base leading-tight truncate">{product.name}</h3>
            <p className="text-white/60 text-xs font-mono mt-0.5">{product.sku}</p>
          </div>

          {/* Menu Button */}
          <div className="relative">
            <button
              onClick={() => setExpandedId(expandedId === product.id ? null : product.id)}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded transition"
              title="Opciones"
            >
              <MdMoreVert className="w-5 h-5" />
            </button>

            {expandedId === product.id && (
              <div className="absolute right-0 top-10 w-40 bg-white border border-gray-200 rounded-lg shadow-xl z-10 overflow-hidden">
                <button
                  onClick={() => {
                    onEdit?.(product);
                    setExpandedId(null);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-primary-50 text-primary-600 text-sm font-medium flex items-center gap-2 border-b border-gray-100"
                >
                  <MdEdit className="w-4 h-4" />
                  Editar
                </button>
                <button
                  onClick={() => {
                    onToggleActive?.(product);
                    setExpandedId(null);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-amber-50 text-amber-600 text-sm font-medium flex items-center gap-2 border-b border-gray-100"
                >
                  <MdCheckCircle className="w-4 h-4" />
                  {product.isActive ? 'Desactivar' : 'Activar'}
                </button>
                <button
                  onClick={() => {
                    onDelete?.(product);
                    setExpandedId(null);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 text-sm font-medium flex items-center gap-2"
                >
                  <MdDelete className="w-4 h-4" />
                  Eliminar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CONTENT - No scroll */}
      <div className="flex-1 p-4 flex flex-col gap-3 overflow-hidden">
        {/* Stock Info */}
        <div className="bg-slate-50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-600 font-medium">STOCK</span>
            <span className={`text-xs font-bold ${isLowStock ? 'text-orange-600' : 'text-green-600'}`}>
              {product.stockQuantity} {getStockUnitLabel(product.stockUnit || 'UNIT')}
            </span>
          </div>
          <div className="w-full bg-gray-300 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition ${isLowStock ? 'bg-orange-500' : 'bg-green-500'}`}
              style={{ width: `${Math.min((stockQuantity / Math.max(minStockAlert * 2, 1)) * 100, 100)}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-1">Mínimo: {minStockAlert}</p>
        </div>

        {/* Category */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-sm">{categoryEmoji[product.category]}</span>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
            {getCategoryLabel(product.category)}
          </span>
        </div>

        {/* Pricing - scrollable if needed */}
        <div className="border-t border-gray-200 pt-3 space-y-2 overflow-y-auto">
          <div className="flex items-center justify-between flex-shrink-0">
            <span className="text-xs text-slate-600">Venta</span>
            <span className="text-sm font-bold text-slate-900">${salePrice.toFixed(2)}</span>
          </div>
          {costPrice && (
            <>
              <div className="flex items-center justify-between flex-shrink-0">
                <span className="text-xs text-slate-600">Costo</span>
                <span className="text-xs text-slate-600">${costPrice.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between bg-green-50 p-2 rounded flex-shrink-0">
                <span className="text-xs font-medium text-green-700">Margen</span>
                <span className="text-xs font-bold text-green-700">{profitMargin}%</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
