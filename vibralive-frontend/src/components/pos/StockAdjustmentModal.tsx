'use client';

import React, { useState } from 'react';
import { FiX, FiPlus, FiMinus } from 'react-icons/fi';

interface StockAdjustmentModalProps {
  product: any;
  onClose: () => void;
  onSubmit: (data: {
    productId: string;
    quantity: number;
    operation: 'add' | 'remove';
    reason: string;
  }) => void;
  isLoading?: boolean;
}

const ADJUSTMENT_REASONS = [
  { value: 'restock', label: 'Reabastecimiento' },
  { value: 'damage', label: 'Daño/Pérdida' },
  { value: 'adjustment', label: 'Ajuste de inventario' },
  { value: 'return', label: 'Devolución de cliente' },
  { value: 'sample', label: 'Muestra' },
  { value: 'other', label: 'Otro' },
];

export default function StockAdjustmentModal({
  product,
  onClose,
  onSubmit,
  isLoading = false,
}: StockAdjustmentModalProps) {
  const [operation, setOperation] = useState<'add' | 'remove'>('add');
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('adjustment');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) {
      alert('La cantidad debe ser mayor a 0');
      return;
    }
    onSubmit({
      productId: product.id,
      quantity,
      operation,
      reason,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Ajustar Stock</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition"
            disabled={isLoading}
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Product Info */}
          <div>
            <p className="text-sm text-gray-600">Producto</p>
            <p className="text-lg font-semibold text-gray-900">{product.name}</p>
            <p className="text-sm text-gray-500">{product.sku}</p>
            <div className="mt-2 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Stock actual: <span className="font-bold text-gray-900">{product.currentStock}</span></p>
              <p className="text-sm text-gray-600">Stock mínimo: <span className="font-bold text-gray-900">{product.minimumStock}</span></p>
            </div>
          </div>

          {/* Operation Type */}
          <div>
            <label className="text-sm font-semibold text-gray-900">Tipo de Operación</label>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setOperation('add')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition font-medium ${
                  operation === 'add'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <FiPlus />
                Añadir
              </button>
              <button
                type="button"
                onClick={() => setOperation('remove')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition font-medium ${
                  operation === 'remove'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <FiMinus />
                Quitar
              </button>
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label htmlFor="quantity" className="text-sm font-semibold text-gray-900">
              Cantidad
            </label>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="number"
                id="quantity"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span className="text-sm text-gray-600">unidades</span>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label htmlFor="reason" className="text-sm font-semibold text-gray-900">
              Razón
            </label>
            <select
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {ADJUSTMENT_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Nuevo stock:</p>
            <p className="text-2xl font-bold text-gray-900">
              {operation === 'add' ? product.currentStock + quantity : Math.max(0, product.currentStock - quantity)}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
