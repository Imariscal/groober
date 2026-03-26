import React, { useState, useEffect } from 'react';
import { useSaleStore, Sale, SaleItem } from '../stores/saleStore';
import { posApi } from '../services/api';

interface EditSaleModalProps {
  isOpen: boolean;
  sale: Sale | null;
  onClose: () => void;
  onSaveComplete?: () => void;
}

export const EditSaleModal: React.FC<EditSaleModalProps> = ({
  isOpen,
  sale,
  onClose,
  onSaveComplete,
}) => {
  const { setError, setSuccessMessage, setLoading, setSale } = useSaleStore();
  const [items, setItems] = useState<SaleItem[]>([]);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (sale) {
      setItems(sale.items || []);
      setDiscountAmount(sale.discountAmount || 0);
      setNotes(sale.notes || '');
    }
  }, [sale, isOpen]);

  if (!isOpen || !sale) return null;

  // ✓ No permitir edición si no es DRAFT
  if (sale.status !== 'DRAFT') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
          <h2 className="text-xl font-bold text-red-600 mb-4">No permitido</h2>
          <p className="text-gray-700 mb-6">
            Solo se pueden editar ventas en estado DRAFT. Esta venta tiene estado{' '}
            <strong>{sale.status}</strong>.
          </p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded font-medium transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  const handleAddItem = () => {
    const newItem: SaleItem = {
      productId: '',
      quantity: 1,
      unitPrice: 0,
      subtotal: 0,
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (
    index: number,
    field: keyof SaleItem,
    value: any,
  ) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Recalcular subtotal
    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].subtotal =
        newItems[index].quantity * newItems[index].unitPrice;
    }

    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ✓ Validación en cliente
    if (items.length === 0) {
      setError('La venta debe tener al menos un artículo');
      return;
    }

    for (const item of items) {
      if (!item.productId) {
        setError('Todos los artículos deben tener un producto seleccionado');
        return;
      }
      if (item.quantity <= 0) {
        setError('La cantidad debe ser mayor a 0');
        return;
      }
    }

    if (discountAmount < 0) {
      setError('El descuento no puede ser negativo');
      return;
    }

    try {
      setIsSubmitting(true);
      setLoading(true);
      setError(null);

      const payload = {
        items,
        discountAmount,
        notes,
      };

      // ✓ El servidor validará:
      // - Que la venta sea DRAFT
      // - Todos los datos de los items
      // - Que los productos existan y estén activos
      const response = await posApi.put(`/pos/sales/${sale.id}`, payload);

      setSale(response.data.data);
      setSuccessMessage('Venta actualizada correctamente');
      onSaveComplete?.();
      onClose();
    } catch (err: any) {
      console.error('Error:', err);
      let errorMessage = 'Error al actualizar la venta';

      if (err.response?.status === 400) {
        errorMessage = err.response.data.message;
      } else if (err.response?.status === 403) {
        errorMessage = 'No tienes permisos para editar esta venta';
      }

      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0) - discountAmount;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Editar Venta</h2>
            <p className="text-sm text-gray-500">Venta #{sale.id}</p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Items */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Artículos</h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-medium transition-colors"
              >
                + Agregar Artículo
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className="p-4 border border-gray-200 rounded-lg space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="font-medium text-gray-900">Artículo {idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="text-red-500 hover:text-red-700 font-medium text-sm"
                    >
                      Eliminar
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Producto ID
                      </label>
                      <input
                        type="text"
                        value={item.productId}
                        onChange={(e) =>
                          handleItemChange(idx, 'productId', e.target.value)
                        }
                        placeholder="prod-001"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isSubmitting}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cantidad
                      </label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(idx, 'quantity', parseFloat(e.target.value) || 0)
                        }
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isSubmitting}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Precio Unitario
                      </label>
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) =>
                          handleItemChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)
                        }
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <p className="text-sm font-medium text-gray-700">
                      Subtotal: ${item.subtotal.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Descuento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descuento (opcional)
            </label>
            <input
              type="number"
              value={discountAmount}
              onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
              disabled={isSubmitting}
            />
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Agregar notas sobre esta venta..."
              disabled={isSubmitting}
            />
          </div>

          {/* Resumen */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">
                  ${items.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2)}
                </span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Descuento:</span>
                  <span className="font-medium">-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                <span>Total:</span>
                <span className="text-green-600">${totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditSaleModal;
