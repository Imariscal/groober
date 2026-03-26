'use client';

import React from 'react';
import { MdEdit, MdDelete } from 'react-icons/md';
import { ServicePrice, Service } from '@/types';

interface PriceListServiceTableProps {
  servicePrices: ServicePrice[];
  services: Map<string, Service>;
  isLoading?: boolean;
  onEditPrice: (servicePrice: ServicePrice) => void;
  onRemoveService?: (servicePriceId: string, serviceId: string) => void;
}

export function PriceListServiceTable({
  servicePrices,
  services,
  isLoading = false,
  onEditPrice,
  onRemoveService,
}: PriceListServiceTableProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (servicePrices.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No hay servicios en esta lista de precios</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b-2 border-gray-300 bg-gray-50">
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
              Servicio
            </th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
              Precio
            </th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
              Moneda
            </th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
              Disponible
            </th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {servicePrices.map((servicePrice) => {
            const service = services.get(servicePrice.serviceId);
            const serviceName = service?.name || servicePrice.serviceName || 'Servicio desconocido';

            return (
              <tr key={servicePrice.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900">{serviceName}</td>
                <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                  ${Number(servicePrice.price).toFixed(2)}
                </td>
                <td className="px-4 py-3 text-sm text-center text-gray-600">
                  {servicePrice.currency || 'MXN'}
                </td>
                <td className="px-4 py-3 text-sm text-center">
                  {servicePrice.isAvailable ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Sí
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      No
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => onEditPrice(servicePrice)}
                      className="text-blue-600 hover:text-blue-700 p-1 rounded hover:bg-blue-50 transition"
                      title="Editar precio"
                    >
                      <MdEdit size={18} />
                    </button>
                    {onRemoveService && (
                      <button
                        onClick={() => onRemoveService(servicePrice.id, servicePrice.serviceId)}
                        className="text-red-600 hover:text-red-700 p-1 rounded hover:bg-red-50 transition"
                        title="Remover servicio"
                      >
                        <MdDelete size={18} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
