'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { MdClose, MdShoppingCart, MdAdd, MdDelete } from 'react-icons/md';
import toast from 'react-hot-toast';
import { useCreateSaleMutation, useUpdateSaleMutation, useCompleteSaleMutation, useProductsQuery, useSaleQuery } from '@/hooks/usePosMutations';
import { useAuthStore } from '@/store/auth-store';
import { clientsApi } from '@/lib/clients-api';
import { Client } from '@/types';

interface SaleItem {
  productId?: string;
  serviceId?: string; // For items from appointments
  quantity: number;
  unitPrice: number;
  productName?: string;
  serviceDescription?: string; // Description of the service (for grooming services)
  isServiceItem?: boolean; // Flag to identify if it's a service from appointment
}

interface CreateSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  saleId?: string; // Optional: for editing existing sales
  isGroomingSale?: boolean; // Optional: for grooming appointments (auto-complete on payment)
  forceType?: 'POS' | 'APPOINTMENT_ADDON'; // Optional: force sale type (hides selector)
}

export function CreateSaleModal({ isOpen, onClose, onSuccess, saleId, isGroomingSale, forceType }: CreateSaleModalProps) {
  const user = useAuthStore((state) => state.user);
  const clinicId = user?.clinic_id;
  
  if (!clinicId) {
    return null;
  }

  const createSaleMutation = useCreateSaleMutation();
  const updateSaleMutation = useUpdateSaleMutation(saleId ||'');
  const completeSaleMutation = useCompleteSaleMutation(saleId || '');
  const { data: salesData } = useProductsQuery();
  const { data: existingSaleData } = useSaleQuery(saleId || '');

  const products = (salesData?.data || []) as any[];
  const isEditMode = !!saleId;

  const [formData, setFormData] = useState({
    saleType: (forceType || 'POS') as const,
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
  const [saleStatus, setSaleStatus] = useState<string | null>(null); // Track sale status (DRAFT, COMPLETED, etc.)

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(clientSearchInput.toLowerCase()) ||
    client.phone?.toLowerCase().includes(clientSearchInput.toLowerCase())
  );

  const activeProducts = products.filter((p: any) => p.isActive);
  const filteredProducts = activeProducts.filter((p: any) =>
    p.name.toLowerCase().includes(productSearchInput.toLowerCase()) ||
    p.sku?.toLowerCase().includes(productSearchInput.toLowerCase())
  );

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
      
      // Load existing sale if in edit mode
      if (isEditMode && existingSaleData) {
        const sale = existingSaleData.data || existingSaleData;
        console.log('Existing sale data:', sale);
        
        // Store sale status for UI decisions
        setSaleStatus(sale.status);
        
        setFormData({
          saleType: sale.saleType || 'POS',
          clientId: sale.clientId || '',
          notes: sale.notes || '',
          discountAmount: sale.discountAmount || 0,
          taxAmount: sale.taxAmount || 0,
        });
        setSelectedClientId(sale.clientId || '');
        
        // Load items from appointment (services or products)
        if (sale.items && Array.isArray(sale.items)) {
          const loadedItems = sale.items.map((item: any) => {
            // Check if it's a service item (from appointment) or product item
            const isServiceItem = !!item.serviceId;
            
            return {
              productId: item.productId,
              serviceId: item.serviceId,
              quantity: item.quantity || 1,
              unitPrice: item.unitPrice || item.priceAtBooking || 0,
              productName: item.product?.name || item.productName || item.service?.name || '',
              serviceDescription: item.service?.description || '', // Extract service description
              isServiceItem, // Flag to identify if it's a service from appointment
            };
          });
          
          console.log('Loaded items:', loadedItems);
          setItems(loadedItems);
        }
      }
    }
  }, [isOpen, isEditMode, existingSaleData]);

  // Reset sale status when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSaleStatus(null);
    }
  }, [isOpen]);

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

    setItems([...items, { 
      productId: newItem.productId, 
      quantity: newItem.quantity, 
      unitPrice: newItem.unitPrice, 
      productName: selectedProduct.name,
      isServiceItem: false, // New items added manually are products, not services
    }]);
    setNewItem({ productId: '', quantity: 1, unitPrice: 0 });
    setProductSearchInput('');
    setErrors({});
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const fieldValue = type === 'number' ? parseFloat(value) || 0 : value;
    setFormData((prev) => ({ ...prev, [name]: fieldValue }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const totals = useMemo(() => {
    const validItems = items.filter(item => item.productId || item.serviceId);
    const subtotal = validItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const discount = parseFloat(String(formData.discountAmount || 0));
    const tax = parseFloat(String(formData.taxAmount || 0));
    const total = subtotal - discount + tax;
    return { subtotal, discount, tax, total: Math.max(0, total) };
  }, [items, formData.discountAmount, formData.taxAmount]);

  const handleCompleteSale = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!saleId) return;

    // Filter items to exclude those without productId or serviceId
    const validItems = items.filter(item => item.productId || item.serviceId);

    // Validate there are items
    if (validItems.length === 0) {
      setErrors({ items: 'Agrega al menos un producto antes de pagar' });
      return;
    }

    try {
      // Step 1: Save the sale with items first (if in edit mode)
      if (isEditMode && saleId) {
        const finalSaleType = forceType || (isGroomingSale ? 'APPOINTMENT_ADDON' : formData.saleType);
        const payload = {
          clinicId,
          saleType: finalSaleType,
          clientId: selectedClientId || undefined,
          discountAmount: formData.discountAmount,
          taxAmount: formData.taxAmount,
          notes: formData.notes,
          items: validItems.map((item) => {
            const mappedItem: any = {
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            };
            
            if (item.productId) {
              mappedItem.productId = item.productId;
            }
            
            if (item.serviceId) {
              mappedItem.serviceId = item.serviceId;
            }
            
            return mappedItem;
          }),
        };

        // Update sale with new items
        await updateSaleMutation.mutateAsync(payload as any);
        toast.success('Cambios guardados');
      }

      // Step 2: Complete the sale
      await completeSaleMutation.mutateAsync();
      toast.success('¡Venta completada exitosamente!');
      onSuccess?.();
      onClose();
      setFormData({ saleType: 'POS', clientId: '', notes: '', discountAmount: 0, taxAmount: 0 });
      setItems([]);
      setNewItem({ productId: '', quantity: 1, unitPrice: 0 });
      setErrors({});
      setSelectedClientId('');
      setClientSearchInput('');
      setShowClientDropdown(false);
      setSaleStatus(null);
    } catch (error: any) {
      console.error('Error completing sale:', error);
      toast.error(error?.message || 'Error al completar venta');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🔵 handleSubmit iniciado', { isEditMode, saleId, itemsCount: items.length });
    
    // Filter items to exclude those without productId or serviceId
    const validItems = items.filter(item => item.productId || item.serviceId);
    
    const newErrors: Record<string, string> = {};
    if (validItems.length === 0) newErrors.items = 'Agrega al menos un producto';
    if (Object.keys(newErrors).length > 0) {
      console.warn('⚠️ Validación falló:', newErrors);
      setErrors(newErrors);
      return;
    }

    try {
      // Determinar saleType: forceType > isGroomingSale > formData
      const finalSaleType = forceType || (isGroomingSale ? 'APPOINTMENT_ADDON' : formData.saleType);

      const payload = {
        clinicId,
        saleType: finalSaleType,
        clientId: selectedClientId || undefined,
        discountAmount: formData.discountAmount,
        taxAmount: formData.taxAmount,
        notes: formData.notes,
        items: validItems.map((item) => {
          const mappedItem: any = {
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          };
          
          // Include productId if present
          if (item.productId) {
            mappedItem.productId = item.productId;
          }
          
          // Include serviceId if present
          if (item.serviceId) {
            mappedItem.serviceId = item.serviceId;
          }
          
          return mappedItem;
        }),
      };

      console.log('📤 Enviando payload:', payload);

      if (isEditMode && saleId) {
        // Update existing sale
        console.log('🔄 Actualizando venta existente:', saleId);
        await updateSaleMutation.mutateAsync(payload as any);
        console.log('✅ Venta actualizada');
        toast.success('✅ Cambios guardados correctamente');
      } else {
        // Create new sale
        console.log('➕ Creando nueva venta');
        await createSaleMutation.mutateAsync(payload as any);
        console.log('✅ Venta creada');
        toast.success(isGroomingSale ? 'Venta lista para pagar' : 'Venta creada exitosamente');
      }

      // Only close modal and reset if in create mode
      // In edit mode, keep modal open for payment step
      if (!isEditMode) {
        onSuccess?.();
        onClose();
        setFormData({ saleType: 'POS', clientId: '', notes: '', discountAmount: 0, taxAmount: 0 });
        setItems([]);
        setNewItem({ productId: '', quantity: 1, unitPrice: 0 });
        setErrors({});
        setSelectedClientId('');
        setClientSearchInput('');
        setShowClientDropdown(false);
      }
    } catch (error: any) {
      console.error('❌ Error en handleSubmit:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Error al guardar venta. Intenta de nuevo.';
      toast.error(errorMessage);
      setErrors({ submit: errorMessage });
    }
  };

  if (!isOpen) return null;

  const isLoading = createSaleMutation.isPending || updateSaleMutation.isPending || completeSaleMutation.isPending;

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
                <h2 className="text-2xl font-bold text-white">
                  {isEditMode ? 'Editar Venta' : isGroomingSale ? '💳 Pagar' : 'Nueva Venta'}
                </h2>
              </div>
              <p className="text-primary-100 text-sm">
                {isEditMode 
                  ? 'Actualiza los detalles y productos' 
                  : isGroomingSale
                  ? 'Completa los datos y agrega productos para pagar'
                  : 'Completa los datos y agrega productos'}
              </p>
            </div>
            <button onClick={onClose} disabled={isLoading} className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition disabled:opacity-50">
              <MdClose className="w-6 h-6" />
            </button>
          </div>

          {/* CONTENIDO: 2 COLUMNAS */}
          <div className="flex-1 overflow-hidden flex">
            <form id="sale-form" onSubmit={handleSubmit} className="h-full w-full flex">
              {/* COLUMNA IZQUIERDA: MASTER (33%) */}
              <div className="w-1/3 bg-gradient-to-b from-gray-50 to-gray-100 border-r border-gray-200 p-6 space-y-4 overflow-y-auto">
                {/* Tipo de Venta - SOLO SI NO ES GROOMING Y NO TIENE TIPO FORZADO */}
                {!isGroomingSale && !forceType && (
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
                )}

                {/* Cliente */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-1 h-5 bg-primary-600 rounded-full"></div>
                    <label className="text-sm font-semibold text-gray-900">
                      {isEditMode ? 'Cliente' : 'Cliente (Opcional)'}
                    </label>
                  </div>
                  {clientsLoading ? (
                    <div className="h-10 bg-gray-200 rounded-lg animate-pulse" />
                  ) : selectedClientId && clients.find(c => c.id === selectedClientId) ? (
                    // Show as READ-ONLY CARD if from appointment or client selected
                    <div className="p-4 bg-gradient-to-br from-blue-50 via-blue-50 to-indigo-50 border border-blue-200 rounded-lg shadow-sm space-y-3">
                      {(() => {
                        const selectedClient = clients.find(c => c.id === selectedClientId);
                        return (
                          <>
                            {/* Header: Nombre del cliente */}
                            <div className="flex items-start justify-between gap-2 pb-3 border-b border-blue-200">
                              <div className="flex-1">
                                <p className="text-lg font-bold text-blue-900 leading-tight">{selectedClient?.name}</p>
                                <p className="text-xs text-blue-600 mt-0.5">Cliente Seleccionado</p>
                              </div>
                              {!isGroomingSale && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedClientId('');
                                    setClientSearchInput('');
                                  }}
                                  className="px-2.5 py-1.5 text-xs font-semibold bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition whitespace-nowrap"
                                >
                                  ↻ Cambiar
                                </button>
                              )}
                            </div>

                            {/* Contact Info Grid */}
                            <div className="space-y-2">
                              {/* Phone */}
                              {selectedClient?.phone && (
                                <div className="flex items-start gap-2.5">
                                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white flex-shrink-0">
                                    <span className="text-xs font-bold">📱</span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide">Teléfono</p>
                                    <p className="text-sm font-medium text-gray-900 break-all">{selectedClient.phone}</p>
                                  </div>
                                </div>
                              )}

                              {/* Email */}
                              {selectedClient?.email && (
                                <div className="flex items-start gap-2.5">
                                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-600 text-white flex-shrink-0">
                                    <span className="text-xs font-bold">📧</span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs text-purple-600 font-semibold uppercase tracking-wide">Email</p>
                                    <p className="text-sm font-medium text-gray-900 break-all">{selectedClient.email}</p>
                                  </div>
                                </div>
                              )}

                              {/* Address */}
                              {selectedClient?.address && (
                                <div className="flex items-start gap-2.5">
                                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-600 text-white flex-shrink-0">
                                    <span className="text-xs font-bold">🏠</span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs text-orange-600 font-semibold uppercase tracking-wide">Dirección</p>
                                    <p className="text-sm font-medium text-gray-900">{selectedClient.address}</p>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Pets Section */}
                            {selectedClient?.pets && selectedClient.pets.length > 0 && (
                              <div className="pt-2 border-t border-blue-200">
                                <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                  <span className="text-base">🐾</span>
                                  Mascotas ({selectedClient.pets.length})
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {selectedClient.pets.map((pet: any) => (
                                    <div
                                      key={pet.id}
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-emerald-100 to-teal-100 border border-emerald-300 rounded-full text-xs font-semibold text-emerald-900 shadow-sm"
                                    >
                                      <span>🐕</span>
                                      {pet.name}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* No pets message*/}
                            {(!selectedClient?.pets || selectedClient.pets.length === 0) && (
                              <div className="pt-2 border-t border-blue-200">
                                <p className="text-xs text-gray-500 italic">Sin mascotas registradas</p>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  ) : (
                    // SEARCH MODE if no client selected
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
                      <label htmlFor="discount-create-left" className="text-xs font-medium text-gray-600">Descuento:</label>
                      <input
                        id="discount-create-left"
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
                      <label htmlFor="tax-create-left" className="text-xs font-medium text-gray-600">Impuesto:</label>
                      <input
                        id="tax-create-left"
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
                        disabled={isLoading || !newItem.productId}
                        className="w-full bg-success-600 hover:bg-success-700 text-white px-4 py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-sm hover:shadow-md"
                      >
                        <MdAdd className="w-5 h-5" />
                        Agregar Producto
                      </button>
                    </div>

                    {errors.items && <div className="col-span-12 text-critical-600 text-xs">⚠️ {errors.items}</div>}
                  </div>
                </div>

                {/* Tabla de Items: Servicios de Grooming + Productos */}
                {items.length > 0 && (
                  <div className="space-y-4">
                    {/* SERVICIOS DE GROOMING (si existen) */}
                    {items.filter((i: any) => i.isServiceItem).length > 0 && (
                      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-lg overflow-hidden">
                        <div className="bg-emerald-600 text-white px-4 py-2 font-semibold text-sm">
                          🎨 Servicios de Grooming (de la cita)
                        </div>
                        <table className="w-full text-sm">
                          <thead className="bg-emerald-100 border-b border-emerald-300">
                            <tr>
                              <th className="px-3 py-2 text-left font-semibold text-emerald-900 text-xs">Servicio</th>
                              <th className="px-3 py-2 text-left font-semibold text-emerald-900 text-xs">Descripción</th>
                              <th className="px-3 py-2 text-center font-semibold text-emerald-900 text-xs">Cantidad</th>
                              <th className="px-3 py-2 text-right font-semibold text-emerald-900 text-xs">Precio</th>
                              <th className="px-3 py-2 text-right font-semibold text-emerald-900 text-xs">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.filter((i: any) => i.isServiceItem && i.serviceId).map((item, index) => {
                              const fullIndex = items.findIndex(i => i === item);
                              return (
                                <tr key={fullIndex} className="border-b border-emerald-200 hover:bg-emerald-100/50 transition">
                                  <td className="px-3 py-2 text-emerald-900 font-medium text-sm">{item.productName}</td>
                                  <td className="px-3 py-2 text-emerald-800 text-xs">{item.serviceDescription || '-'}</td>
                                  <td className="px-3 py-2 text-center text-emerald-800">{item.quantity}</td>
                                  <td className="px-3 py-2 text-right text-emerald-800">${Number(item.unitPrice || 0).toFixed(2)}</td>
                                  <td className="px-3 py-2 text-right font-semibold text-emerald-900">${Number(item.quantity * item.unitPrice || 0).toFixed(2)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* PRODUCTOS ADICIONALES (si existen) */}
                    {items.filter((i: any) => !i.isServiceItem && i.productId).length > 0 && (
                      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-blue-600 text-white px-4 py-2 font-semibold text-sm">
                          🛍️ Productos Adicionales
                        </div>
                        <table className="w-full text-sm">
                          <thead className="bg-gray-100 border-b border-gray-300">
                            <tr>
                              <th className="px-3 py-2 text-left font-semibold text-gray-900 text-xs">Producto</th>
                              <th className="px-3 py-2 text-center font-semibold text-gray-900 text-xs">Cantidad</th>
                              <th className="px-3 py-2 text-right font-semibold text-gray-900 text-xs">Precio</th>
                              <th className="px-3 py-2 text-right font-semibold text-gray-900 text-xs">Subtotal</th>
                              <th className="px-3 py-2 text-center font-semibold text-gray-900 text-xs">Acción</th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.filter((i: any) => !i.isServiceItem && i.productId).map((item, index) => {
                              const fullIndex = items.findIndex(i => i === item);
                              return (
                                <tr key={fullIndex} className="border-b border-gray-200 hover:bg-primary-50 transition">
                                  <td className="px-3 py-2 text-gray-900 font-medium text-sm">{item.productName}</td>
                                  <td className="px-3 py-2 text-center text-gray-700">{item.quantity}</td>
                                  <td className="px-3 py-2 text-right text-gray-700">${Number(item.unitPrice || 0).toFixed(2)}</td>
                                  <td className="px-3 py-2 text-right font-semibold text-gray-900">${Number(item.quantity * item.unitPrice || 0).toFixed(2)}</td>
                                  <td className="px-3 py-2 text-center">
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveItem(fullIndex)}
                                      disabled={isLoading}
                                      className="inline-flex items-center justify-center w-7 h-7 text-critical-600 hover:bg-critical-100 rounded-lg transition disabled:opacity-50"
                                    >
                                      <MdDelete className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </form>
          </div>

          {/* FOOTER */}
          <div className="bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={createSaleMutation.isPending || updateSaleMutation.isPending || completeSaleMutation.isPending}
              className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition disabled:opacity-50 font-semibold"
            >
              Cancelar
            </button>
            
            {/* Show Pay button only in edit mode and DRAFT status (for completing the sale) */}
            {isEditMode && saleStatus === 'DRAFT' && (
              <button
                type="button"
                onClick={handleCompleteSale}
                disabled={createSaleMutation.isPending || updateSaleMutation.isPending || completeSaleMutation.isPending}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 font-semibold flex items-center gap-2"
              >
                {completeSaleMutation.isPending ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Pagando...
                  </>
                ) : (
                  <>
                    <MdShoppingCart className="w-5 h-5" />
                    💳 Pagar
                  </>
                )}
              </button>
            )}
            
            {/* Show status message if sale is already completed */}
            {isEditMode && saleStatus === 'COMPLETED' && (
              <div className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-semibold flex items-center gap-2">
                ✅ Venta Completada
              </div>
            )}
            
            {/* Only show save button if sale is not completed */}
            {!(isEditMode && saleStatus === 'COMPLETED') && (
              <button
                form="sale-form"
                type="submit"
                disabled={createSaleMutation.isPending || updateSaleMutation.isPending || completeSaleMutation.isPending}
                className={`px-4 py-2 text-white rounded-lg transition disabled:opacity-50 font-semibold flex items-center gap-2 ${
                  isGroomingSale 
                    ? 'bg-purple-600 hover:bg-purple-700' 
                    : 'bg-primary-600 hover:bg-primary-700'
                }`}
              >
                {createSaleMutation.isPending || updateSaleMutation.isPending ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    {isEditMode ? 'Guardando...' : isGroomingSale ? 'Completando...' : 'Creando...'}
                  </>
                ) : (
                  <>
                    <MdShoppingCart className="w-5 h-5" />
                    {isEditMode ? 'Guardar Cambios' : isGroomingSale ? '✅ Completar' : 'Crear Venta'}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
