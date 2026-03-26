'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { MdClose, MdShoppingCart, MdAdd, MdDelete } from 'react-icons/md';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth-store';
import { useProductsQuery, useSaleQuery, useUpdateSaleMutation } from '@/hooks/usePosMutations';

interface SaleItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  productName?: string;
}

interface Sale {
  id: string;
  date: string;
  items: number;
  total: number;
  status: 'DRAFT' | 'COMPLETED';
  customerName?: string;
  paymentMethod?: string;
}

interface EditSaleModalProps {
  isOpen: boolean;
  sale: Sale | null;
  onClose: () => void;
  onSuccess?: (sale: Sale) => void;
}

export function EditSaleModal({ isOpen, sale, onClose, onSuccess }: EditSaleModalProps) {
  const user = useAuthStore((state) => state.user);
  const clinicId = user?.clinic_id;

  // Load sale details and products
  const { data: saleDetails, refetch: refetchSaleDetails } = useSaleQuery(sale?.id || '');
  const { data: productsData } = useProductsQuery();
  const updateMutation = useUpdateSaleMutation(sale?.id || '');

  const products = (productsData?.data || []) as any[];

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

  // Initialize form when modal opens or sale changes - force refetch of sale details
  useEffect(() => {
    if (isOpen && sale?.id) {
      // Force refetch to get fresh data from backend
      refetchSaleDetails();
    }
  }, [isOpen, sale?.id, refetchSaleDetails]);

  // Load items from sale details once they arrive
  useEffect(() => {
    if (!isOpen || !saleDetails?.items) {
      console.log('[EditSaleModal] Waiting for data:', { isOpen, hasItems: !!saleDetails?.items, saleDetails });
      return;
    }

    console.log('[EditSaleModal] Loading items from sale details:', saleDetails.items);

    // Map existing items from the sale
    const existingItems: SaleItem[] = saleDetails.items.map((item: any) => ({
      productId: item.productId,
      quantity: Number(item.quantity || 0),
      unitPrice: Number(item.unitPrice || 0),
      productName: item.product?.name || 'Producto',
    }));

    setItems(existingItems);

    // Set form data
    setFormData({
      saleType: 'POS',
      clientId: saleDetails.clientId || '',
      notes: saleDetails.notes || '',
      discountAmount: Number(saleDetails.discountAmount || 0),
      taxAmount: Number(saleDetails.taxAmount || 0),
    });

    setNewItem({ productId: '', quantity: 1, unitPrice: 0 });
    setErrors({});
  }, [isOpen, saleDetails]);

  // ==================== HANDLERS ====================
  const handleProductChange = (productId: string) => {
    const selectedProduct = products.find((p) => p.id === productId);
    if (selectedProduct) {
      setNewItem({
        productId,
        quantity: newItem.quantity || 1,
        unitPrice: Number(selectedProduct.salePrice || 0),
      });
    }
  };

  const handleAddItem = () => {
    const newErrors: Record<string, string> = {};
    if (!newItem.productId) newErrors.product = 'Selecciona un producto';
    if (!newItem.quantity || newItem.quantity <= 0) newErrors.quantity = 'Cantidad debe ser mayor a 0';
    if (newItem.unitPrice <= 0) newErrors.unitPrice = 'Precio debe ser mayor a 0';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const selectedProduct = products.find((p) => p.id === newItem.productId);
    if (!selectedProduct) {
      setErrors({ product: 'Producto no encontrado' });
      return;
    }

    const newItemEntry: SaleItem = {
      productId: newItem.productId,
      quantity: newItem.quantity,
      unitPrice: newItem.unitPrice,
      productName: selectedProduct.name,
    };

    setItems([...items, newItemEntry]);
    setNewItem({ productId: '', quantity: 1, unitPrice: 0 });
    setErrors({});
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'discountAmount' || name === 'taxAmount' ? parseFloat(value) || 0 : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // ==================== CALCULATIONS ====================
  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const discount = parseFloat(String(formData.discountAmount || 0));
    const tax = parseFloat(String(formData.taxAmount || 0));
    const total = subtotal - discount + tax;

    return {
      subtotal,
      discount,
      tax,
      total: Math.max(0, total),
    };
  }, [items, formData.discountAmount, formData.taxAmount]);

  // ==================== SUBMIT ====================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (items.length === 0) newErrors.items = 'Agrega al menos un producto';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      if (!sale || !clinicId) return;

      // Prepare update DTO
      const updateDto = {
        clinicId,
        clientId: formData.clientId || undefined,
        saleType: formData.saleType,
        notes: formData.notes || undefined,
        discountAmount: formData.discountAmount || 0,
        taxAmount: formData.taxAmount || 0,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      };

      await updateMutation.mutateAsync(updateDto);
      
      toast.success('Venta actualizada exitosamente');
      onSuccess?.({
        ...sale,
        items: items.length,
        total: totals.total,
        customerName: formData.clientId || 'Venta Anónima',
      });
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar venta');
    }
  };

  if (!isOpen || !sale) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[95vh] flex flex-col">
          {/* HEADER */}
          <div className="sticky top-0 z-20 bg-gradient-to-r from-primary-600 via-primary-600 to-primary-700 px-6 py-4 flex items-center justify-between border-b border-primary-600 shadow-sm">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <MdShoppingCart className="w-6 h-6 text-white" />
                <h2 className="text-2xl font-bold text-white">Editar Venta</h2>
              </div>
              <p className="text-primary-100 text-sm">Actualiza los detalles y productos de la venta</p>
            </div>
            <button onClick={onClose} className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition">
              <MdClose className="w-6 h-6" />
            </button>
          </div>

          {/* CONTENT */}
          <div className="flex-1 overflow-y-auto p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* MASTER: Información General */}
              <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-4">
                <h3 className="text-sm font-semibold text-slate-900">Información General</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-slate-700 mb-1 block">Tipo</label>
                    <select
                      name="saleType"
                      value={formData.saleType}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                    >
                      <option value="POS">POS</option>
                      <option value="ONLINE">Online</option>
                      <option value="APPOINTMENT">Cita</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-700 mb-1 block">Cliente (Opcional)</label>
                    <input
                      type="text"
                      name="clientId"
                      value={formData.clientId}
                      onChange={handleInputChange}
                      placeholder="Nombre o ID del cliente"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 mb-1 block">Notas</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Notas adicionales de la venta"
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                  />
                </div>
              </div>

              {/* DETAIL: Agregar Productos */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h3 className="text-sm font-semibold text-slate-900 mb-4">Agregar Productos</h3>
                  <div className="grid grid-cols-12 gap-4 mb-4">
                  <div className="col-span-5">
                    <label className="text-xs font-medium text-slate-700 mb-1 block">Producto</label>
                    <select
                      value={newItem.productId}
                      onChange={(e) => handleProductChange(e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm transition ${
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
                    <label className="text-xs font-medium text-slate-700 mb-1 block">Cantidad</label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={newItem.quantity}
                      onChange={(e) => {
                        setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 });
                        if (errors.quantity) setErrors((prev) => ({ ...prev, quantity: '' }));
                      }}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm transition ${
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
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm transition ${
                        errors.unitPrice ? 'border-critical-500' : 'border-slate-300'
                      }`}
                    />
                    {errors.unitPrice && <p className="text-critical-600 text-xs mt-1">{errors.unitPrice}</p>}
                  </div>

                  <div className="col-span-1 flex items-end">
                    <button
                      type="button"
                      onClick={handleAddItem}
                      disabled={updateMutation.isPending || !newItem.productId}
                      className="w-full bg-success-600 hover:bg-success-700 text-white py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-sm hover:shadow-md"
                      title="Agregar producto a la venta"
                    >
                      <MdAdd className="w-5 h-5" />
                      Agregar
                    </button>
                  </div>
                </div>

                {errors.items && <p className="text-critical-600 text-xs">{errors.items}</p>}
              </div>

              {/* ITEMS TABLE */}
              {items.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b-2 border-slate-300">
                      <tr>
                        <th className="px-4 py-3 text-left font-bold text-slate-900">Producto</th>
                        <th className="text-center px-4 py-3 font-bold text-slate-900">Cantidad</th>
                        <th className="text-right px-4 py-3 font-bold text-slate-900">Precio Unit.</th>
                        <th className="text-right px-3 py-2 font-semibold text-slate-900">Subtotal</th>
                        <th className="text-center px-3 py-2 font-semibold text-slate-900">Acción</th>
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
                              disabled={updateMutation.isPending}
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
              disabled={updateMutation.isPending}
              className="px-4 py-2 bg-slate-200 text-slate-900 rounded-lg hover:bg-slate-300 transition disabled:opacity-50 font-semibold"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={updateMutation.isPending || items.length === 0}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition disabled:opacity-50 font-semibold"
            >
              {updateMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
