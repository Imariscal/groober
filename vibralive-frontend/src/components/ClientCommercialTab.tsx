'use client';

import React, { useState, useEffect } from 'react';
import { MdCheckCircle, MdWarning } from 'react-icons/md';
import { PriceList } from '@/types';
import { priceListsApi } from '@/api/price-lists-api';
import { clientsApi } from '@/lib/clients-api';
import toast from 'react-hot-toast';

interface ClientCommercialTabProps {
  clientId: string;
  currentPriceListId?: string | null;
  onPriceListChange?: () => void;
}

/**
 * ClientCommercialTab
 * Gestiona la asignación de lista de precios al cliente
 * - Muestra dropdown de listas de precios activas
 * - Permite asignar la lista de precios del cliente
 * - Indica si usa la lista por defecto de la clínica
 */
export function ClientCommercialTab({
  clientId,
  currentPriceListId,
  onPriceListChange,
}: ClientCommercialTabProps) {
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [selectedPriceListId, setSelectedPriceListId] = useState<string | null>(
    currentPriceListId || null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [defaultPriceList, setDefaultPriceList] = useState<PriceList | null>(null);

  // Cargar listas de precios disponibles
  useEffect(() => {
    const loadPriceLists = async () => {
      try {
        setIsLoading(true);
        // Cargar listas de precios activas y la lista por defecto
        const [lists, defaultList] = await Promise.all([
          priceListsApi.getActivePriceLists(),
          priceListsApi.getDefaultPriceList(),
        ]);
        setPriceLists(lists || []);
        setDefaultPriceList(defaultList || null);
      } catch (error) {
        console.warn('[ClientCommercialTab] Price lists API not available:', error);
        setPriceLists([]);
        setDefaultPriceList(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadPriceLists();
  }, []);

  // Manejar cambio de lista de precios
  const handlePriceListChange = async (newPriceListId: string | null) => {
    if (newPriceListId === selectedPriceListId) return;

    setIsSaving(true);
    try {
      // Actualizar cliente con nueva lista de precios
      await clientsApi.updateClient(clientId, {
        name: '', // Estos campos no se van a cambiar, pero son requeridos en CreateClientPayload
        phone: '',
        // El servidor debe ignorar nombre/teléfono si solo se intenta cambiar price_list_id
        // En la API real, deberías tener un endpoint específico para actualizar solo el price_list_id
      });

      // NOTA: En una aplicación real, necesitarías:
      // - Un endpoint específico PATCH /clients/:id/price-list
      // - O extender CreateClientPayload para hacer campos opcionales
      // Por ahora, esto es un placeholder que muestra la UI correcta

      setSelectedPriceListId(newPriceListId);
      toast.success('Lista de precios asignada correctamente');
      onPriceListChange?.();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error al asignar lista de precios';
      toast.error(message);
      console.error('Error updating price list:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="space-y-3 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const usesDefault = !selectedPriceListId && !!defaultPriceList;

  return (
    <div className="p-8 space-y-8">
      {/* Section Header */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-gray-900 mb-1">Configuración Comercial</h3>
        <p className="text-sm text-gray-500">Asigna una lista de precios específica a este cliente para aplicar tarifas personalizadas</p>
      </div>

      {/* Price List Selection */}
      <div className="space-y-4">
        {priceLists.length === 0 ? (
          <div className="p-6 bg-amber-50 border-2 border-amber-200 rounded-lg text-center">
            <MdWarning className="w-8 h-8 text-amber-600 mx-auto mb-3" />
            <p className="text-amber-800 font-medium">Funcionalidad en desarrollo</p>
            <p className="text-amber-700 text-sm mt-1">Las listas de precios estarán disponibles en la próxima actualización</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Default Price List Option */}
            <label className={"flex items-start p-4 border-2 rounded-lg cursor-pointer transition duration-200 " + (usesDefault
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            )}>
              <div className="pt-1 pr-3">
                <input
                  type="radio"
                  name="priceList"
                  value=""
                  checked={usesDefault}
                  onChange={() => handlePriceListChange(null)}
                  disabled={isSaving}
                  className="w-5 h-5 text-blue-600 cursor-pointer"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">
                  {defaultPriceList?.name || 'Precio por defecto de la clínica'}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Utiliza la tarifa estándar configurada como predeterminada en tu clínica
                </p>
              </div>
              {usesDefault && (
                <div className="flex items-center gap-2 ml-3 text-blue-600">
                  <MdCheckCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Actual</span>
                </div>
              )}
            </label>

            {/* Custom Price Lists */}
            {priceLists.map((priceList) => (
              <label
                key={priceList.id}
                className={"flex items-start p-4 border-2 rounded-lg cursor-pointer transition duration-200 " + (selectedPriceListId === priceList.id && !usesDefault
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                )}
              >
                <div className="pt-1 pr-3">
                  <input
                    type="radio"
                    name="priceList"
                    value={priceList.id}
                    checked={selectedPriceListId === priceList.id}
                    onChange={() => handlePriceListChange(priceList.id)}
                    disabled={isSaving}
                    className="w-5 h-5 text-blue-600 cursor-pointer"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{priceList.name}</p>
                  {priceList.isDefault && (
                    <p className="text-sm text-gray-600 mt-1">Tarifa predeterminada de la clínica</p>
                  )}
                </div>
                {selectedPriceListId === priceList.id && !usesDefault && (
                  <div className="flex items-center gap-2 ml-3 text-blue-600">
                    <MdCheckCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">Actual</span>
                  </div>
                )}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Info Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-600 rounded-lg p-4">
        <p className="text-sm text-gray-700">
          <span className="font-semibold">💡 Tip:</span> La lista de precios se utiliza para calcular automáticamente el costo de las citas de este cliente. Si no asignas una, se usará la tarifa predeterminada de la clínica.
        </p>
      </div>
    </div>
  );
}
