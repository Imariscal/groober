'use client';

import React, { useState, useMemo } from 'react';
import { MdClose, MdShoppingCart, MdAdd, MdDelete } from 'react-icons/md';
import toast from 'react-hot-toast';
import { useCreateSaleMutation, useProductsQuery } from '@/hooks/usePosMutations';
import { useAuthStore } from '@/store/auth-store';

interface SaleItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  productName?: string;
}

interface CreateSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateSaleModal({ isOpen, onClose, onSuccess }: CreateSaleModalProps) {
  const user = useAuthStore((state) => state.user);
  const clinicId = user?.clinic_id;
  
  if (!clinicId) {
    return null; // No clinic selected
  }

  const createSaleMutation = useCreateSaleMutation();
  const { data: salesData } = useProductsQuery();

  // Extraer productos de la respuesta
  const products = (salesData?.data || []) as any[];

  const [formData, setFormData] = useState({
    saleType: 'POS' as const,
    clientId: '',
    notes: '',
    discountAmount: 0,
    taxAmount: 0,
  });

  const [items, setItems] = useState<SaleItem[]>([]);
  const [newItem, setNewItem] = useState({
    productId: '',
    quantity: 1,
    unitPrice: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Calcular totales
  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const discountAmount = formData.discountAmount || 0;
    const taxAmount = formData.taxAmount || 0;
    const total = subtotal - discountAmount + taxAmount;

    return { subtotal, discountAmount, taxAmount, total };
  }, [items, formData.discountAmount, formData.taxAmount]);

  const handleAddItem = () => {
    const newErrors: Record<string, string> = {};

    if (!newItem.productId) {
      newErrors.product = 'Selecciona un producto';
    }
    if (newItem.quantity <= 0) {
      newErrors.quantity = 'Cantidad debe ser mayor a 0';
    }
    if (newItem.unitPrice <= 0) {
      newErrors.unitPrice = 'Precio debe ser mayor a 0';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const selectedProduct = products.find((p: any) => p.id === newItem.productId);
    const itemToAdd: SaleItem = {
      ...newItem,
      productName: selectedProduct?.name || 'Producto desconocido',
    };

    setItems([...items, itemToAdd]);
    setNewItem({ productId: '', quantity: 1, unitPrice: 0 });
    setErrors({});
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleProductChange = (productId: string) => {
    const product = products.find((p: any) => p.id === productId);
    setNewItem({
      ...newItem,
      productId,
      unitPrice: product?.salePrice || 0,
    });
    if (errors.product) {
      setErrors((prev) => ({ ...prev, product: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};

    if (items.length === 0) {
      newErrors.items = 'Debe agregar al menos un producto';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await createSaleMutation.mutateAsync({
        clinicId,
        saleType: formData.saleType,
        clientId: formData.clientId || undefined,
        items: items.map(({ productId, quantity, unitPrice }) => ({
          productId,
          quantity,
          unitPrice,
        })),
        discountAmount: formData.discountAmount || undefined,
        taxAmount: formData.taxAmount || undefined,
        notes: formData.notes || undefined,
      });

      toast.success('Venta creada exitosamente');
      onSuccess?.();
      onClose();

      // Reset form
      setFormData({
        saleType: 'POS',
        clientId: '',
        notes: '',
        discountAmount: 0,
        taxAmount: 0,
      });
      setItems([]);
      setNewItem({ productId: '', quantity: 1, unitPrice: 0 });
      setErrors({});
    } catch (error: any) {
      console.error('Error creating sale:', error);
      toast.error(error?.message || 'Error al crear venta');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const fieldValue = type === 'number' ? parseFloat(value) || 0 : value;

    setFormData((prev) => ({
      ...prev,
      [name]: fieldValue,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  if (!isOpen) return null;

  const isLoading = createSaleMutation.isPending;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] flex flex-col">
          {/* HEADER */}
          <div className="sticky top-0 z-20 bg-gradient-to-r from-primary-600 via-primary-600 to-primary-700 px-6 py-4 flex items-center justify-between border-b border-primary-600 shadow-sm">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <MdShoppingCart className="w-6 h-6 text-white" />
                <h2 className="text-2xl font-bold text-white">Nueva Venta (Master-Detail)</h2>
              </div>
              <p className="text-primary-100 text-sm">Registra una nueva venta y sus productos</p>
            </div>
            <button onClick={onClose} disabled={isLoading} className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition disabled:opacity-50">
              <MdClose className="w-6 h-6" />
            </button>
          </div>

          {/* CONTENT */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* MASTER: Información General */}
              <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <div className="w-1 h-6 bg-primary-500 rounded"></div>
                  Información de la Venta
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-1">Tipo de Venta</label>
                    <select
                      name="saleType"
                      value={formData.saleType}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                    >
                      <option value="POS">Punto de Venta</option>
                      <option value="APPOINTMENT_ADDON">Addon de Cita</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-1">Cliente (Opcional)</label>
                    <input
                      type="text"
                      name="clientId"
                      value={formData.clientId}
                      onChange={handleInputChange}
                      placeholder="ID del cliente (vacío = venta anónima)"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-900 mb-1">Notas</label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="Notas adicionales sobre la venta"
                      rows={2}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* DETAIL: Agregar Productos */}
              <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 mb-5 flex items-center gap-2">
                  <div className="w-1 h-6 bg-success-500 rounded"></div>
                  Agregar Productos
                </h3>
                <div className="grid grid-cols-12 gap-4 mb-4">
                  <div className="col-span-5">
                    <label className="text-sm font-semibold text-slate-900 mb-2 block">Producto</label>
                    <select
                      value={newItem.productId}
                      onChange={(e) => handleProductChange(e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm ${
                        errors.product ? 'border-critical-500' : 'border-slate-300'
                      }`}
                    >
                      <option value="">Selecciona un producto...</option>
                      {products.map((product: any) => (
                        <option key={product.id} value={product.id}>
                          {product.name} - ${Number(product.salePrice || 0).toFixed(2)}
                        </option>
                      ))}
                    </select>
                    {errors.product && <p className="text-critical-600 text-xs mt-1">{errors.product}</p>}
                  </div>

                  <div className="col-span-3">
                    <label className="text-sm font-semibold text-slate-900 mb-2 block">Cantidad</label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={newItem.quantity}
                      onChange={(e) => {
                        setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 });
                        if (errors.quantity) setErrors((prev) => ({ ...prev, quantity: '' }));
                      }}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm ${
                        errors.quantity ? 'border-critical-500' : 'border-slate-300'
                      }`}
                    />
                    {errors.quantity && <p className="text-critical-600 text-xs mt-1">{errors.quantity}</p>}
                  </div>

                  <div className="col-span-3">
                    <label className="text-sm font-semibold text-slate-900 mb-2 block">Precio Unit.</label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={newItem.unitPrice}
                      onChange={(e) => {
                        setNewItem({ ...newItem, unitPrice: parseFloat(e.target.value) || 0 });
                        if (errors.unitPrice) setErrors((prev) => ({ ...prev, unitPrice: '' }));
                      }}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm ${
                        errors.unitPrice ? 'border-critical-500' : 'border-slate-300'
                      }`}
                    />
                    {errors.unitPrice && <p className="text-critical-600 text-xs mt-1">{errors.unitPrice}</p>}
                  </div>

                  <div className="col-span-1 flex items-end">
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="w-full bg-success-600 hover:bg-success-700 text-white py-3 rounded-lg transition flex items-center justify-center gap-2 font-semibold shadow-sm hover:shadow-md disabled:opacity-50"
                      disabled={isLoading || !newItem.productId}
                    >
                      <MdAdd className="w-5 h-5" />
                      <span>Agregar</span>
                    </button>
                  </div>
                </div>

                {errors.items && <p className="text-critical-600 text-sm mb-3">{errors.items}</p>}
              </div>

              {/* DETAIL: Tabla de Productos */}
              {items.length > 0 && (
                <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm overflow-x-auto">
                  <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <div className="w-1 h-6 bg-info-500 rounded"></div>
                    Productos en la Venta ({items.length})
                  </h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-slate-300 bg-slate-50">
                        <th className="text-left px-4 py-3 font-bold text-slate-900">Producto</th>
                        <th className="text-center px-4 py-3 font-bold text-slate-900">Cantidad</th>
                        <th className="text-right px-4 py-3 font-bold text-slate-900">Precio Unit.</th>
                        <th className="text-right px-4 py-3 font-bold text-slate-900">Subtotal</th>
                        <th className="text-center px-4 py-3 font-bold text-slate-900">Accion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, index) => (
                        <tr key={index} className="border-b border-slate-200 hover:bg-primary-50 transition">
                          <td className="px-4 py-3 text-slate-900 font-medium">{item.productName}</td>
                          <td className="text-center px-4 py-3 text-slate-900">{item.quantity}</td>
                          <td className="text-right px-4 py-3 text-slate-900">${Number(item.unitPrice || 0).toFixed(2)}</td>
                          <td className="text-right px-4 py-3 font-semibold text-slate-900">
                            ${(item.quantity * Number(item.unitPrice || 0)).toFixed(2)}
                          </td>
                          <td className="text-center px-4 py-3">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              disabled={isLoading}
                              className="inline-flex items-center justify-center w-8 h-8 text-critical-600 hover:bg-critical-100 hover:text-critical-700 rounded-lg disabled:opacity-50 transition"
                            >
                              <MdDelete className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* RESUMEN DE TOTALES */}
              <div className="bg-gradient-to-r from-slate-100 to-slate-50 p-4 rounded-lg border border-slate-300">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Resumen</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-1">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-700">Subtotal:</span>
                      <span className="font-semibold text-slate-900">${Number(totals.subtotal || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-slate-700 text-sm">Descuento:</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        name="discountAmount"
                        value={formData.discountAmount}
                        onChange={handleInputChange}
                        className="w-32 px-2 py-1 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <label className="text-slate-700 text-sm">Impuesto:</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        name="taxAmount"
                        value={formData.taxAmount}
                        onChange={handleInputChange}
                        className="w-32 px-2 py-1 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="col-span-1 flex flex-col justify-between bg-white p-3 rounded-lg border-2 border-primary-300">
                    <div className="text-center">
                      <p className="text-slate-600 text-xs mb-1">TOTAL A PAGAR</p>
                      <p className="text-3xl font-bold text-primary-600">${Number(totals.total || 0).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* FOOTER */}
          <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 bg-slate-200 text-slate-900 rounded-lg hover:bg-slate-300 transition disabled:opacity-50 font-semibold"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition disabled:opacity-50 font-semibold flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Guardando...
                </>
              ) : (
                <>
                  <MdShoppingCart className="w-5 h-5" />
                  Crear Venta
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
