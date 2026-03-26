'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { MdClose, MdShoppingCart, MdAdd, MdDelete } from 'react-icons/md';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth-store';
import { useProductsQuery, useSaleQuery, useUpdateSaleMutation } from '@/hooks/usePosMutations';
import { clientsApi } from '@/lib/clients-api';
import { Client } from '@/types';

interface SaleItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  productName?: string;
}

interface EditSaleModalProps {
  isOpen: boolean;
  sale: {
    id: string;
    date: string;
    items?: any[];
    total: number;
    status: 'DRAFT' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
    customerName?: string;
    paymentMethod?: string;
  } | null;
  onClose: () => void;
  onSuccess?: (sale: any) => void;
}

export function EditSaleModal({ isOpen, sale, onClose, onSuccess }: EditSaleModalProps) {
  const user = useAuthStore((state) => state.user);
  const clinicId = user?.clinic_id;

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
  const [clients, setClients] = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [clientSearchInput, setClientSearchInput] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [productSearchInput, setProductSearchInput] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(clientSearchInput.toLowerCase()) ||
    client.phone?.toLowerCase().includes(clientSearchInput.toLowerCase())
  );

  const activeProducts = products.filter((p: any) => p.isActive);
  const filteredProducts = activeProducts.filter((p: any) =>
    p.name.toLowerCase().includes(productSearchInput.toLowerCase()) ||
    p.sku?.toLowerCase().includes(productSearchInput.toLowerCase())
  );

  useEffect(() => {
    if (isOpen && sale?.id) {
      refetchSaleDetails();
    }
  }, [isOpen, sale?.id, refetchSaleDetails]);

  useEffect(() => {
    if (!isOpen || !saleDetails?.items) {
      return;
    }

    const existingItems: SaleItem[] = saleDetails.items.map((item: any) => ({
      productId: item.productId,
      quantity: Number(item.quantity || 0),
      unitPrice: Number(item.unitPrice || 0),
      productName: item.product?.name || 'Producto',
    }));

    setItems(existingItems);
    setFormData({
      saleType: 'POS',
      clientId: saleDetails.clientId || '',
      notes: saleDetails.notes || '',
      discountAmount: Number(saleDetails.discountAmount || 0),
      taxAmount: Number(saleDetails.taxAmount || 0),
    });
    setSelectedClientId(saleDetails.clientId || '');
    setClientSearchInput('');
    setNewItem({ productId: '', quantity: 1, unitPrice: 0 });
    setErrors({});
  }, [isOpen, saleDetails]);

  const fetchClients = async () => {
    try {
      setClientsLoading(true);
      const response = await clientsApi.listClients(1, 1000);
      setClients(response.data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Error al cargar clientes');
    } finally {
      setClientsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchClients();
      refetchSaleDetails();
    }
  }, [isOpen, refetchSaleDetails]);

  const handleProductChange = (productId: string) => {
    const selectedProduct = products.find((p) => p.id === productId);
    if (!selectedProduct) return;

    if (selectedProduct.stockQuantity <= 0) {
      setErrors((prev) => ({ ...prev, product: `Sin stock disponible` }));
      return;
    }

    setNewItem({
      productId,
      quantity: Math.min(newItem.quantity || 1, selectedProduct.stockQuantity),
      unitPrice: Number(selectedProduct.salePrice || 0),
    });
    setProductSearchInput(selectedProduct.name);
    setShowProductDropdown(false);
    setErrors((prev) => ({ ...prev, product: '' }));
  };

  const handleAddItem = () => {
    const newErrors: Record<string, string> = {};
    if (!newItem.productId) newErrors.product = 'Selecciona un producto';
    if (!newItem.quantity || newItem.quantity <= 0) newErrors.quantity = 'Cantidad debe ser > 0';
    if (newItem.unitPrice <= 0) newErrors.unitPrice = 'Precio debe ser > 0';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const selectedProduct = products.find((p) => p.id === newItem.productId);
    if (!selectedProduct) {
      setErrors({ product: 'Producto no encontrado' });
      return;
    }

    if (newItem.quantity > selectedProduct.stockQuantity) {
      setErrors({ quantity: `Stock insuficiente. Disponible: ${selectedProduct.stockQuantity}` });
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
    setProductSearchInput('');
    setErrors({});
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'discountAmount' || name === 'taxAmount' ? parseFloat(value) || 0 : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const discount = parseFloat(String(formData.discountAmount || 0));
    const tax = parseFloat(String(formData.taxAmount || 0));
    const total = subtotal - discount + tax;
    return { subtotal, discount, tax, total: Math.max(0, total) };
  }, [items, formData.discountAmount, formData.taxAmount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (items.length === 0) newErrors.items = 'Agrega al menos un producto';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await updateMutation.mutateAsync({
        clinicId: clinicId || '',
        saleType: formData.saleType,
        clientId: selectedClientId || undefined,
        notes: formData.notes || undefined,
        discountAmount: formData.discountAmount || 0,
        taxAmount: formData.taxAmount || 0,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      });

      toast.success('Venta actualizada exitosamente');
      onSuccess?.(sale!);
      onClose();
    } catch (error: any) {
      console.error('Error updating sale:', error);
      toast.error(error?.message || 'Error al actualizar venta');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[95vh] flex flex-col">
          {/* HEADER */}
          <div className="sticky top-0 z-20 bg-gradient-to-r from-primary-600 via-primary-600 to-primary-700 px-6 py-4 flex items-center justify-between border-b border-primary-700 shadow-sm">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <MdShoppingCart className="w-6 h-6 text-white" />
                <h2 className="text-2xl font-bold text-white">Editar Venta</h2>
              </div>
              <p className="text-primary-100 text-sm">Modifica los datos y productos de esta venta</p>
            </div>
            <button
              onClick={onClose}
              disabled={updateMutation.isPending}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition disabled:opacity-50"
            >
              <MdClose className="w-6 h-6" />
            </button>
          </div>

          {/* CONTENIDO: 2 COLUMNAS */}
          <div className="flex-1 overflow-hidden flex">
            <form onSubmit={handleSubmit} className="h-full w-full flex">
              {/* COLUMNA IZQUIERDA: MASTER (33%) */}
              <div className="w-1/3 bg-gradient-to-b from-gray-50 to-gray-100 border-r border-gray-200 p-6 space-y-4 overflow-y-auto">
                {/* Tipo de Venta */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-1 h-5 bg-primary-600 rounded-full"></div>
                    <label className="text-sm font-semibold text-gray-900">Tipo de Venta</label>
                  </div>
                  <select
                    name="saleType"
                    value={formData.saleType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-white transition"
                  >
                    <option value="POS">Punto de Venta</option>
                    <option value="APPOINTMENT_ADDON">Addon de Cita</option>
                  </select>
                </div>

                {/* Cliente */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-1 h-5 bg-primary-600 rounded-full"></div>
                    <label className="text-sm font-semibold text-gray-900">Cliente (Opcional)</label>
                  </div>
                  {clientsLoading ? (
                    <div className="h-10 bg-gray-200 rounded-lg animate-pulse" />
                  ) : (
                    <div className="relative">
                      {/* Autocomplete Input */}
                      <input
                        type="text"
                        placeholder="Busca por nombre o teléfono..."
                        value={clientSearchInput}
                        onChange={(e) => {
                          setClientSearchInput(e.target.value);
                          setShowClientDropdown(true);
                        }}
                        onFocus={() => setShowClientDropdown(true)}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm transition bg-white"
                      />

                      {/* Dropdown List */}
                      {showClientDropdown && filteredClients.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                          {filteredClients.map((client) => (
                            <button
                              key={client.id}
                              type="button"
                              onClick={() => {
                                setSelectedClientId(client.id);
                                setClientSearchInput(client.name);
                                setShowClientDropdown(false);
                              }}
                              className="w-full text-left px-4 py-2.5 hover:bg-primary-50 border-b border-gray-100 last:border-b-0 transition flex flex-col"
                            >
                              <span className="font-medium text-gray-900">{client.name}</span>
                              <span className="text-xs text-gray-500">↳ {client.phone || 'Sin teléfono'}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* No results message */}
                      {showClientDropdown && clientSearchInput && filteredClients.length === 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 p-3">
                          <p className="text-xs text-gray-500 text-center">No se encontraron clientes</p>
                        </div>
                      )}

                      {/* Close dropdown when clicking outside */}
                      {showClientDropdown && (
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setShowClientDropdown(false)}
                        />
                      )}

                      {selectedClientId && !clientSearchInput && (
                        <div className="mt-2 p-2 bg-primary-50 border border-primary-100 rounded-lg">
                          <p className="text-xs text-primary-700 font-medium">
                            <span className="font-semibold">{clients.find(c => c.id === selectedClientId)?.name}</span> • Teléfono: {clients.find(c => c.id === selectedClientId)?.phone}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Notas */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-1 h-5 bg-primary-600 rounded-full"></div>
                    <label className="text-sm font-semibold text-gray-900">Notas</label>
                  </div>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Notas sobre la venta..."
                    rows={3}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm resize-none transition"
                  />
                </div>

                {/* RESUMEN DE TOTALES */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-l-4 border-l-primary-600 border border-blue-200 p-4">
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-4">Resumen de Totales</h3>
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-600">Subtotal:</span>
                      <span className="font-semibold text-gray-900 text-sm">${Number(totals.subtotal || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <label htmlFor="discount-edit-left" className="text-xs font-medium text-gray-600">Descuento:</label>
                      <input
                        id="discount-edit-left"
                        type="number"
                        min="0"
                        step="0.01"
                        name="discountAmount"
                        value={formData.discountAmount}
                        onChange={handleInputChange}
                        className="w-24 px-2 py-1.5 border border-blue-200 rounded text-xs focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                      />
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <label htmlFor="tax-edit-left" className="text-xs font-medium text-gray-600">Impuesto:</label>
                      <input
                        id="tax-edit-left"
                        type="number"
                        min="0"
                        step="0.01"
                        name="taxAmount"
                        value={formData.taxAmount}
                        onChange={handleInputChange}
                        className="w-24 px-2 py-1.5 border border-blue-200 rounded text-xs focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                      />
                    </div>
                    <div className="border-t-2 border-blue-200 pt-3 mt-2">
                      <div className="text-center bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg py-3 px-3 border-0 shadow-lg">
                        <p className="text-xs text-primary-100 font-bold uppercase tracking-wide mb-1">Total a Pagar</p>
                        <p className="text-3xl font-bold text-white leading-none">${Number(totals.total || 0).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* COLUMNA DERECHA: DETAILS + TOTALES (67%) */}
              <div className="w-2/3 p-6 space-y-4 overflow-y-auto bg-white">
                {/* Agregar Productos */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-1 h-5 bg-success-600 rounded-full"></div>
                    <h3 className="text-sm font-semibold text-gray-900">Agregar Productos</h3>
                  </div>

                  <div className="grid grid-cols-12 gap-3">
                    {/* Producto - Autocomplete */}
                    <div className="col-span-6">
                      <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">Producto</label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Busca por nombre o SKU..."
                          value={productSearchInput}
                          onChange={(e) => {
                            setProductSearchInput(e.target.value);
                            setShowProductDropdown(true);
                          }}
                          onFocus={() => setShowProductDropdown(true)}
                          className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition text-sm ${
                            errors.product ? 'border-critical-500 focus:ring-critical-500 bg-critical-50' : 'border-gray-300 focus:ring-primary-500'
                          }`}
                        />
                        {showProductDropdown && filteredProducts.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                            {filteredProducts.map((product: any) => (
                              <button
                                key={product.id}
                                type="button"
                                onClick={() => handleProductChange(product.id)}
                                disabled={product.stockQuantity <= 0}
                                className={`w-full text-left px-4 py-2.5 border-b border-gray-100 last:border-b-0 transition flex justify-between items-start ${
                                  product.stockQuantity <= 0
                                    ? 'bg-gray-50 opacity-60 cursor-not-allowed hover:bg-gray-50'
                                    : 'hover:bg-primary-50'
                                }`}
                              >
                                <div className="flex flex-col flex-1">
                                  <span className={`font-medium text-sm ${
                                    product.stockQuantity <= 0 ? 'text-gray-500' : 'text-gray-900'
                                  }`}>
                                    {product.name}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    SKU: {product.sku || 'N/A'} • Stock: {product.stockQuantity}
                                    {product.stockQuantity <= 0 && <span className="text-critical-600 font-semibold ml-1">⚠️ Sin stock</span>}
                                  </span>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                        {showProductDropdown && productSearchInput && filteredProducts.length === 0 && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 p-3">
                            <p className="text-xs text-gray-500 text-center">No hay productos disponibles</p>
                          </div>
                        )}
                        {showProductDropdown && (
                          <div className="fixed inset-0 z-40" onClick={() => setShowProductDropdown(false)} />
                        )}
                      </div>
                      {errors.product && <p className="text-critical-600 text-xs mt-1">⚠️ {errors.product}</p>}
                    </div>

                    {/* Cantidad */}
                    <div className="col-span-3">
                      <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">Cantidad</label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={newItem.quantity}
                        onChange={(e) => {
                          setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 });
                          if (errors.quantity) setErrors((prev) => ({ ...prev, quantity: '' }));
                        }}
                        className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition text-sm ${
                          errors.quantity ? 'border-critical-500 focus:ring-critical-500 bg-critical-50' : 'border-gray-300 focus:ring-primary-500'
                        }`}
                      />
                      {errors.quantity && <p className="text-critical-600 text-xs mt-1">⚠️ {errors.quantity}</p>}
                    </div>

                    {/* Precio Unit */}
                    <div className="col-span-3">
                      <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">Precio</label>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={newItem.unitPrice}
                        onChange={(e) => {
                          setNewItem({ ...newItem, unitPrice: parseFloat(e.target.value) || 0 });
                          if (errors.unitPrice) setErrors((prev) => ({ ...prev, unitPrice: '' }));
                        }}
                        className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition text-sm ${
                          errors.unitPrice ? 'border-critical-500 focus:ring-critical-500 bg-critical-50' : 'border-gray-300 focus:ring-primary-500'
                        }`}
                      />
                      {errors.unitPrice && <p className="text-critical-600 text-xs mt-1">⚠️ {errors.unitPrice}</p>}
                    </div>

                    {/* Botón Agregar - ANCHO COMPLETO */}
                    <div className="col-span-12">
                      <button
                        type="button"
                        onClick={handleAddItem}
                        disabled={updateMutation.isPending || !newItem.productId}
                        className="w-full bg-success-600 hover:bg-success-700 text-white px-4 py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-sm hover:shadow-md"
                        title="Agregar producto a la venta"
                      >
                        <MdAdd className="w-5 h-5" />
                        Agregar Producto
                      </button>
                    </div>

                    {errors.items && <div className="col-span-12 text-critical-600 text-xs">⚠️ {errors.items}</div>}
                  </div>
                </div>

                {/* Tabla de Productos */}
                {items.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100 border-b border-gray-300">
                        <tr>
                          <th className="px-3 py-2.5 text-left font-semibold text-gray-900 text-xs">Producto</th>
                          <th className="px-3 py-2.5 text-center font-semibold text-gray-900 text-xs">Cantidad</th>
                          <th className="px-3 py-2.5 text-right font-semibold text-gray-900 text-xs">Precio</th>
                          <th className="px-3 py-2.5 text-right font-semibold text-gray-900 text-xs">Subtotal</th>
                          <th className="px-3 py-2.5 text-center font-semibold text-gray-900 text-xs">Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, index) => (
                          <tr key={index} className="border-b border-gray-200 hover:bg-primary-50 transition">
                            <td className="px-3 py-2.5 text-gray-900 font-medium text-sm">{item.productName}</td>
                            <td className="px-3 py-2.5 text-center text-gray-700">{item.quantity}</td>
                            <td className="px-3 py-2.5 text-right text-gray-700">${Number(item.unitPrice || 0).toFixed(2)}</td>
                            <td className="px-3 py-2.5 text-right font-semibold text-gray-900">${Number(item.quantity * item.unitPrice || 0).toFixed(2)}</td>
                            <td className="px-3 py-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(index)}
                                disabled={updateMutation.isPending}
                                className="inline-flex items-center justify-center w-7 h-7 text-critical-600 hover:bg-critical-100 rounded-lg transition disabled:opacity-50"
                              >
                                <MdDelete className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </form>
          </div>

          {/* FOOTER */}
          <div className="bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={updateMutation.isPending}
              className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition disabled:opacity-50 font-semibold"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={updateMutation.isPending}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition disabled:opacity-50 font-semibold flex items-center gap-2"
            >
              {updateMutation.isPending ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Guardando...
                </>
              ) : (
                <>
                  <MdShoppingCart className="w-5 h-5" />
                  Guardar Cambios
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
