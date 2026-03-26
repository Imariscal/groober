'use client';

import { useState, useEffect, useCallback } from 'react';
import { MdAdd, MdEdit, MdDelete, MdCheckCircle, MdLocationOn, MdExpandMore, MdWarning } from 'react-icons/md';
import { ClientAddress, CreateClientAddressPayload } from '@/types';
import { addressesApi } from '@/lib/addresses-api';
import { AddressForm } from './AddressForm';
import toast from 'react-hot-toast';

// Draft address type for CREATE mode (no id yet)
export interface DraftAddress extends CreateClientAddressPayload {
  _draftId: string; // Temporary ID for local tracking
}

interface ClientAddressBookProps {
  // API Mode: clientId present = use API for CRUD
  clientId?: string;
  onAddressSelected?: (address: ClientAddress) => void;
  // Draft Mode: for CREATE (before client exists)
  draftAddresses?: DraftAddress[];
  onDraftChange?: (addresses: DraftAddress[]) => void;
  // Callback to notify parent of address count changes
  onAddressCountChange?: (count: number) => void;
  // ID de dirección a precargar para edición (ej: desde modal de verificación)
  initialAddressId?: string;
}

export function ClientAddressBook({
  clientId,
  onAddressSelected,
  draftAddresses,
  onDraftChange,
  onAddressCountChange,
  initialAddressId,
}: ClientAddressBookProps) {
  console.log('[ClientAddressBook] Component MOUNT/RENDER');
  console.log('[ClientAddressBook] Props received:', { clientId, initialAddressId, isDraftMode: !clientId && draftAddresses !== undefined && onDraftChange !== undefined });
  
  // Determine mode
  const isDraftMode = !clientId && draftAddresses !== undefined && onDraftChange !== undefined;

  // Estado local para modo API (evita problemas de cache del store global)
  const [apiAddresses, setApiAddresses] = useState<ClientAddress[]>([]);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isFormExpanded, setIsFormExpanded] = useState(false);
  const [formKey, setFormKey] = useState(0); // Key to force form reset
  const [initialEditDone, setInitialEditDone] = useState(false);

  // Fetch direcciones del cliente - usando API directamente
  const fetchAddresses = useCallback(async () => {
    console.log('[ClientAddressBook] fetchAddresses called');
    console.log('[ClientAddressBook] clientId:', clientId);
    console.log('[ClientAddressBook] isDraftMode:', isDraftMode);
    
    if (!clientId) {
      console.log('[ClientAddressBook] No clientId - skipping fetch');
      return;
    }
    if (isDraftMode) {
      console.log('[ClientAddressBook] In draft mode - skipping fetch');
      return;
    }
    
    console.log('[ClientAddressBook] Starting API fetch...');
    setApiLoading(true);
    setApiError(null);
    
    try {
      const data = await addressesApi.getClientAddresses(clientId);
      console.log('[ClientAddressBook] API returned:', data);
      console.log('[ClientAddressBook] Count:', Array.isArray(data) ? data.length : 'not array');
      setApiAddresses(Array.isArray(data) ? data : []);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error fetching addresses';
      console.error('[ClientAddressBook] Error:', errorMsg, error);
      setApiError(errorMsg);
    } finally {
      setApiLoading(false);
      console.log('[ClientAddressBook] Fetch complete');
    }
  }, [clientId, isDraftMode]);

  // Load addresses from API only in API mode - SIEMPRE hacer fetch al montar
  useEffect(() => {
    console.log('[ClientAddressBook] useEffect triggered - will call fetchAddresses');
    fetchAddresses();
  }, [fetchAddresses]);

  // Precargar dirección inicial para edición cuando las direcciones cargan
  useEffect(() => {
    if (!isDraftMode && initialAddressId && apiAddresses.length > 0 && !initialEditDone) {
      const addressToEdit = apiAddresses.find(a => a.id === initialAddressId);
      if (addressToEdit) {
        console.log('[ClientAddressBook] Precargando dirección para edición:', addressToEdit.id);
        setEditingId(addressToEdit.id);
        setIsFormExpanded(true);
        setInitialEditDone(true);
      }
    }
  }, [isDraftMode, initialAddressId, apiAddresses, initialEditDone]);

  // Notify parent of address count changes
  useEffect(() => {
    if (onAddressCountChange) {
      const count = isDraftMode 
        ? (draftAddresses?.length ?? 0)
        : (apiAddresses?.length ?? 0);
      onAddressCountChange(count);
    }
  }, [isDraftMode, draftAddresses?.length, apiAddresses?.length, onAddressCountChange]);

  // Generate unique draft ID
  const generateDraftId = () => `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Handlers for DRAFT mode
  const handleAddDraft = (data: CreateClientAddressPayload) => {
    if (!onDraftChange || !draftAddresses) return;
    const newAddress: DraftAddress = {
      ...data,
      _draftId: generateDraftId(),
      is_default: draftAddresses.length === 0, // First one is default
    };
    onDraftChange([...draftAddresses, newAddress]);
    toast.success('Dirección agregada');
    setEditingId(null);
    setIsFormExpanded(false);
    setFormKey((k) => k + 1); // Reset form
  };

  const handleUpdateDraft = (data: CreateClientAddressPayload) => {
    if (!onDraftChange || !draftAddresses || !editingId) return;
    const updated = draftAddresses.map((addr) =>
      addr._draftId === editingId ? { ...addr, ...data } : addr
    );
    onDraftChange(updated);
    toast.success('Dirección actualizada');
    setEditingId(null);
    setIsFormExpanded(false);
    setFormKey((k) => k + 1); // Reset form
  };

  const handleDeleteDraft = (draftId: string) => {
    if (!onDraftChange || !draftAddresses) return;
    const wasDefault = draftAddresses.find((a) => a._draftId === draftId)?.is_default;
    let updated = draftAddresses.filter((a) => a._draftId !== draftId);
    // If deleted was default, make first one default
    if (wasDefault && updated.length > 0) {
      updated = updated.map((a, idx) => ({ ...a, is_default: idx === 0 }));
    }
    onDraftChange(updated);
    toast.success('Dirección eliminada');
    setDeleteConfirmId(null);
  };

  const handleSetDefaultDraft = (draftId: string) => {
    if (!onDraftChange || !draftAddresses) return;
    const updated = draftAddresses.map((a) => ({
      ...a,
      is_default: a._draftId === draftId,
    }));
    onDraftChange(updated);
    toast.success('Dirección predeterminada actualizada');
  };

  // Handlers for API mode
  const handleAddAddress = async (data: CreateClientAddressPayload) => {
    if (isDraftMode) {
      handleAddDraft(data);
      return;
    }
    try {
      await addressesApi.createAddress(clientId!, data);
      toast.success('Dirección agregada');
      await fetchAddresses(); // Refrescar lista
      setEditingId(null);
      setIsFormExpanded(false);
      setFormKey((k) => k + 1); // Reset form
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error al agregar dirección';
      toast.error(msg);
    }
  };

  const handleUpdateAddress = async (data: CreateClientAddressPayload) => {
    if (isDraftMode) {
      handleUpdateDraft(data);
      return;
    }
    if (editingId) {
      try {
        await addressesApi.updateAddress(clientId!, editingId, data);
        toast.success('Dirección actualizada');
        await fetchAddresses(); // Refrescar lista
        setEditingId(null);
        setIsFormExpanded(false);
        setFormKey((k) => k + 1); // Reset form
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Error al actualizar dirección';
        toast.error(msg);
      }
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (isDraftMode) {
      handleDeleteDraft(addressId);
      return;
    }
    try {
      await addressesApi.deleteAddress(clientId!, addressId);
      toast.success('Dirección eliminada');
      await fetchAddresses(); // Refrescar lista
      setDeleteConfirmId(null);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error al eliminar dirección';
      toast.error(msg);
    }
  };

  const handleSetDefault = async (addressId: string) => {
    if (isDraftMode) {
      handleSetDefaultDraft(addressId);
      return;
    }
    try {
      await addressesApi.setDefaultAddress(clientId!, addressId);
      toast.success('Dirección predeterminada actualizada');
      await fetchAddresses(); // Refrescar lista
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error al establecer dirección predeterminada';
      toast.error(msg);
    }
  };

  // Unified address list for both modes
  const addresses = isDraftMode ? draftAddresses || [] : apiAddresses;
  const loading = isDraftMode ? false : apiLoading;
  const error = isDraftMode ? null : apiError;

  // Normalize to common shape for rendering
  const addressesList = isDraftMode
    ? (draftAddresses || []).map((d) => ({
        id: d._draftId,
        label: d.label,
        street: d.street,
        number_ext: d.number_ext,
        number_int: d.number_int,
        neighborhood: d.neighborhood,
        city: d.city,
        state: d.state,
        zip_code: d.zip_code,
        references: d.references,
        is_default: d.is_default,
        geocode_status: undefined as string | undefined,
      }))
    : Array.isArray(apiAddresses)
      ? apiAddresses.filter((a): a is ClientAddress => a != null && typeof a === 'object' && 'id' in a)
      : [];

  const editingAddress = isDraftMode
    ? draftAddresses?.find((a) => a._draftId === editingId)
    : addressesList.find((a) => a?.id === editingId);

  const formatAddress = (address: { street?: string; number_ext?: string; number_int?: string; neighborhood?: string; city?: string }): string => {
    const parts = [
      address.street,
      address.number_ext && `#${address.number_ext}`,
      address.number_int && `-${address.number_int}`,
      address.neighborhood,
      address.city,
    ]
      .filter(Boolean)
      .join(', ');
    return parts;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="border-b-2 border-gray-200 pb-4">
        <h3 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
          <MdLocationOn className="w-6 h-6 text-blue-600" />
          Direcciones del Cliente
        </h3>
        <p className="text-sm text-gray-600">Gestiona múltiples ubicaciones y establece una como predeterminada</p>
      </div>

      {/* Layout: Desktop (2 cols) + Mobile (stacked) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Addresses List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-900">Tus Direcciones</h4>
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
              {addressesList.length}
            </span>
          </div>

          {/* Error State */}
          {error && (
            <div className="p-4 bg-red-50 border-2 border-red-300 rounded-lg text-red-700 text-sm font-medium flex items-center gap-2">
              <MdWarning className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}
          {loading && !addressesList.length ? (
            <div className="text-center py-12 text-gray-500 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-dashed border-gray-300 p-6">
              <div className="animate-spin inline-block w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full mb-3" />
              <p className="font-semibold">Cargando direcciones...</p>
            </div>
          ) : addressesList.length === 0 ? (
            <div className="text-center py-12 px-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-dashed border-blue-300 space-y-3">
              <MdLocationOn className="w-12 h-12 text-blue-300 mx-auto" />
              <div>
                <p className="text-gray-700 font-semibold">No hay direcciones registradas</p>
                <p className="text-gray-500 text-sm mt-1">Agrega una nueva dirección usando el formulario →</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {addressesList.map((address) => (
                <div 
                  key={address.id} 
                  className="p-5 border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-lg transition-all duration-200 bg-white hover:bg-blue-50 cursor-pointer group" 
                  onClick={() => {
                    // Only call onAddressSelected in API mode with real ClientAddress
                    if (!isDraftMode && onAddressSelected) {
                      const realAddress = apiAddresses.find((a) => a.id === address.id);
                      if (realAddress) onAddressSelected(realAddress);
                    }
                  }}
                >
                  {/* Address Card */}
                  <div className="space-y-3">
                    {/* Header with label and badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <h5 className="font-bold text-gray-900 text-base group-hover:text-blue-700 transition">
                        {address.label || 'Sin etiqueta'}
                      </h5>
                      <div className="flex gap-2 flex-wrap">
                        {address.is_default && (
                          <span className="flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                            <MdCheckCircle className="w-3.5 h-3.5" />
                            Default
                          </span>
                        )}
                        {address.geocode_status === 'OK' && (
                          <span className="flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                            <MdCheckCircle className="w-3.5 h-3.5" />
                            Verificada
                          </span>
                        )}
                        {address.geocode_status === 'PENDING' && (
                          <span className="px-2.5 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full">
                            ⏳ Pendiente
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Address text */}
                    <p className="text-sm text-gray-700 font-medium line-clamp-2 leading-relaxed">
                      {formatAddress(address)}
                    </p>

                    {/* Actions - Bottom */}
                    <div className="flex gap-2 mt-4 pt-3 border-t border-gray-200 flex-wrap">
                      {!address.is_default && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSetDefault(address.id);
                          }}
                          className="flex-1 min-w-24 text-xs px-3 py-2 border-2 border-emerald-300 text-emerald-700 rounded-md hover:bg-emerald-50 hover:border-emerald-400 transition font-medium"
                        >
                          ✓ Por Defecto
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingId(address.id);
                          setIsFormExpanded(true);
                        }}
                        className="flex-1 min-w-20 text-xs px-3 py-2 flex items-center justify-center gap-1 border-2 border-blue-300 text-blue-700 rounded-md hover:bg-blue-50 hover:border-blue-400 transition font-medium"
                      >
                        <MdEdit className="w-3.5 h-3.5" />
                        Editar
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmId(address.id);
                        }}
                        className="flex-1 min-w-20 text-xs px-3 py-2 flex items-center justify-center gap-1 border-2 border-red-300 text-red-700 rounded-md hover:bg-red-50 hover:border-red-400 transition font-medium"
                      >
                        <MdDelete className="w-3.5 h-3.5" />
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Address Form (Desktop visible, Mobile accordion) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Desktop - Always visible */}
          <div className="hidden lg:block">
            <div className="space-y-4">
              <div className="p-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
                <div className="bg-white rounded-lg p-6">
                  <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-lg">
                    <MdAdd className="w-6 h-6 text-blue-600" />
                    {editingId ? 'Editar Dirección' : 'Agregar Nueva Dirección'}
                  </h4>
                  <AddressForm
                    key={formKey}
                    address={editingAddress}
                    onSubmit={editingId ? handleUpdateAddress : handleAddAddress}
                    onCancel={() => {
                      setEditingId(null);
                      setFormKey((k) => k + 1); // Reset form on cancel
                    }}
                    loading={loading}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Mobile - Accordion */}
          <div className="lg:hidden">
            <button
              onClick={() => setIsFormExpanded(!isFormExpanded)}
              className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-bold shadow-lg hover:shadow-xl"
            >
              <span className="flex items-center gap-2">
                <MdAdd className="w-5 h-5" />
                {editingId ? 'Editar' : 'Agregar Nueva'} Dirección
              </span>
              <MdExpandMore
                className={`w-6 h-6 transition-transform duration-300 ${isFormExpanded ? 'rotate-180' : ''}`}
              />
            </button>

            {isFormExpanded && (
              <div className="mt-4 p-6 bg-white rounded-xl border-2 border-blue-200 shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  {editingId ? 'Editar Dirección' : 'Nueva Dirección'}
                </h4>
                <AddressForm
                  key={formKey}
                  address={editingAddress}
                  onSubmit={editingId ? handleUpdateAddress : handleAddAddress}
                  onCancel={() => {
                    setEditingId(null);
                    setIsFormExpanded(false);
                    setFormKey((k) => k + 1); // Reset form on cancel
                  }}
                  loading={loading}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 animate-in zoom-in duration-300">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-red-100 rounded-full">
                <MdWarning className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Confirmar eliminación</h3>
            </div>
            <p className="text-gray-600 leading-relaxed">¿Está seguro que desea eliminar esta dirección? Esta acción no se puede deshacer.</p>
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteAddress(deleteConfirmId)}
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <MdDelete className="w-4 h-4" />
                {loading ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
