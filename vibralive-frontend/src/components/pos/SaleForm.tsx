'use client';

import React, { useState } from 'react';
import { FiX, FiPlus, FiTrash2 } from 'react-icons/fi';
import { useProductsQuery } from '@/hooks/usePosMutations';
import { formatCurrency } from '@/lib/formatting';

interface SaleFormProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export default function SaleForm({
  onClose,
  onSubmit,
  isLoading = false,
}: SaleFormProps) {
  const { data: productsData = [] } = useProductsQuery();
  const products = (Array.isArray(productsData) ? productsData : []) as any[];
  const [clientName, setClientName] = useState('');
  const [petName, setPetName] = useState('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);

  const selectedProduct = products.find((p: any) => p.id === selectedProductId);
  const total = cartItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

  const handleAddToCart = () => {
    if (!selectedProductId || quantity <= 0) {
      alert('Selecciona un producto y cantidad válida');
      return;
    }

    const product = products.find((p: any) => p.id === selectedProductId);
    if (!product) return;

    const existingItem = cartItems.find(item => item.productId === selectedProductId);
    if (existingItem) {
      setCartItems(
        cartItems.map(item =>
          item.productId === selectedProductId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      );
    } else {
      setCartItems([
        ...cartItems,
        {
          productId: selectedProductId,
          productName: product.name,
          quantity,
          unitPrice: product.price || 0,
        },
      ]);
    }

    setSelectedProductId('');
    setQuantity(1);
  };

  const handleRemoveFromCart = (productId: string) => {
    setCartItems(cartItems.filter(item => item.productId !== productId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) {
      alert('Ingresa el nombre del cliente');
      return;
    }
    if (cartItems.length === 0) {
      alert('Agrega al menos un producto al carrito');
      return;
    }

    onSubmit({
      clientName: clientName.trim(),
      petName: petName.trim() || undefined,
      items: cartItems,
      total,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-900">Nueva Venta</h2>
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
          {/* Client Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Información del Cliente</h3>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Nombre del cliente *"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={isLoading}
              />
              <input
                type="text"
                placeholder="Nombre de la mascota"
                value={petName}
                onChange={(e) => setPetName(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Add Products */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Productos</h3>
            <div className="space-y-3">
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={isLoading}
              >
                <option value="">Selecciona un producto</option>
                {products.map((product: any) => (
                  <option key={product.id} value={product.id}>
                    {product.name} - {formatCurrency(product.price || 0)}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  disabled={isLoading}
                  placeholder="Cantidad"
                />
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isLoading || !selectedProductId}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <FiPlus />
                  Agregar
                </button>
              </div>
            </div>

            {/* Cart Items */}
            {cartItems.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                {cartItems.map((item, idx) => (
                  <div
                    key={item.productId}
                    className="flex items-center justify-between bg-white p-3 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.productName}</p>
                      <p className="text-sm text-gray-600">
                        {item.quantity} × {formatCurrency(item.unitPrice)} = {formatCurrency(item.quantity * item.unitPrice)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFromCart(item.productId)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      disabled={isLoading}
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Total */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-gray-900">Total:</span>
              <span className="text-3xl font-bold text-green-600">
                {formatCurrency(total)}
              </span>
            </div>
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
              disabled={isLoading || cartItems.length === 0}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Guardando...' : 'Registrar Venta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
