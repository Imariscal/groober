'use client';

import React from 'react';
import { MdEdit, MdDelete, MdCheckCircle, MdToggleOn, MdSpa, MdLocalPharmacy, MdAddCircle } from 'react-icons/md';
import { PriceList, ServicePrice } from '@/types';
import { priceListsApi } from '@/api/price-lists-api';
import { useClinicTimezone } from '@/hooks/useClinicTimezone';
import { formatInClinicTz } from '@/lib/datetime-tz';

interface PriceListTableProps {
  priceLists: PriceList[];
  onEdit?: (priceList: PriceList) => void;
  onToggle?: (priceList: PriceList) => void;
  onDelete?: (priceList: PriceList) => void;
  onViewDetails?: (priceList: PriceList) => void;
}

interface PriceListWithServiceCounts extends PriceList {
  groomingCount?: number;
  medicalCount?: number;
  totalServices?: number;
}

export function PriceListTable({
  priceLists,
  onEdit,
  onToggle,
  onDelete,
  onViewDetails,
}: PriceListTableProps) {
  const clinicTimezone = useClinicTimezone();
  const [priceLentsWithCounts, setPriceListsWithCounts] = React.useState<PriceListWithServiceCounts[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const loadServiceCounts = async () => {
      try {
        setIsLoading(true);
        const updatedLists = await Promise.all(
          priceLists.map(async (priceList) => {
            try {
              const prices = await priceListsApi.getServicePrices(priceList.id);
              const groomingCount = prices.filter(
                (sp) => sp.service?.category === 'GROOMING'
              ).length;
              const medicalCount = prices.filter(
                (sp) => sp.service?.category === 'MEDICAL'
              ).length;
              return {
                ...priceList,
                groomingCount,
                medicalCount,
                totalServices: prices.length,
              };
            } catch {
              return { ...priceList, groomingCount: 0, medicalCount: 0, totalServices: 0 };
            }
          })
        );
        setPriceListsWithCounts(updatedLists);
      } finally {
        setIsLoading(false);
      }
    };

    loadServiceCounts();
  }, [priceLists]);

  if (isLoading) {
    return <div className="text-center py-8 text-gray-500">Cargando...</div>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-gray-50/80 border-b border-gray-200">
          <tr>
            <th className="px-4 py-2.5 text-left font-medium text-gray-600 text-xs uppercase tracking-wide">
              Lista de Precios
            </th>
            <th className="px-4 py-2.5 text-left font-medium text-gray-600 text-xs uppercase tracking-wide">
              Servicios
            </th>
            <th className="px-4 py-2.5 text-left font-medium text-gray-600 text-xs uppercase tracking-wide">
              Detalles
            </th>
            <th className="px-4 py-2.5 text-center font-medium text-gray-600 text-xs uppercase tracking-wide">
              Agregar Servicios
            </th>
            <th className="px-4 py-2.5 text-center font-medium text-gray-600 text-xs uppercase tracking-wide w-40">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {priceLentsWithCounts.map((priceList) => (
            <tr
              key={priceList.id}
              className={`transition group ${
                !priceList.isActive
                  ? 'bg-gray-50 hover:bg-gray-100 border-l-4 border-l-gray-400'
                  : 'hover:bg-blue-50/30 border-l-4 border-l-transparent'
              }`}
            >
              {/* Nombre + Badge + Default */}
              <td className="px-4 py-3">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{priceList.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        priceList.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {priceList.isActive ? 'Activa' : 'Inactiva'}
                    </span>
                    {priceList.isDefault && (
                      <MdCheckCircle className="text-blue-600 w-4 h-4" title="Por defecto" />
                    )}
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono">
                    {priceList.id.slice(0, 8)}
                  </span>
                </div>
              </td>

              {/* Servicios - Grooming y Medical */}
              <td className="px-4 py-3">
                <div className="flex flex-col gap-2">
                  {priceList.groomingCount! > 0 && (
                    <div className="flex items-center gap-1.5 text-sm">
                      <MdSpa className="text-amber-500" size={16} />
                      <span className="font-medium text-gray-700">Grooming:</span>
                      <span className="font-bold text-amber-600">{priceList.groomingCount}</span>
                    </div>
                  )}
                  {priceList.medicalCount! > 0 && (
                    <div className="flex items-center gap-1.5 text-sm">
                      <MdLocalPharmacy className="text-purple-500" size={16} />
                      <span className="font-medium text-gray-700">Veterinario:</span>
                      <span className="font-bold text-purple-600">{priceList.medicalCount}</span>
                    </div>
                  )}
                  {priceList.totalServices === 0 && (
                    <span className="text-sm text-gray-400">Sin servicios</span>
                  )}
                </div>
              </td>

              {/* Detalles - Descripción + Fecha */}
              <td className="px-4 py-3">
                <div className="flex flex-col gap-2">
                  {priceList.description && (
                    <div className="text-sm text-gray-600">
                      {priceList.description}
                    </div>
                  )}
                  <span className="text-xs text-gray-500">
                    Creado: {formatInClinicTz(new Date(priceList.createdAt), 'dd MMM yyyy', clinicTimezone)}
                  </span>
                </div>
              </td>

              {/* Agregar Servicios */}
              <td className="px-4 py-3">
                {onViewDetails && (
                  <div className="flex justify-center">
                    <button
                      onClick={() => onViewDetails(priceList)}
                      disabled={!priceList.isActive}
                      className={`
                        group relative flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg
                        transition-all duration-200 ease-out
                        ${
                          priceList.isActive
                            ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md hover:shadow-lg hover:from-blue-700 hover:to-blue-800 active:scale-95'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                        }
                      `}
                      title={priceList.isActive ? 'Ir a agregar servicios' : 'La lista debe estar activa'}
                    >
                      <MdAddCircle size={18} className={priceList.isActive ? 'group-hover:rotate-90 transition-transform duration-300' : ''} />
                      <span>Servicios</span>
                      {priceList.isActive && (
                        <span className="absolute inset-0 rounded-lg bg-blue-600 opacity-0 group-hover:opacity-10 transition-opacity duration-200"></span>
                      )}
                    </button>
                  </div>
                )}
              </td>

              {/* Acciones */}
              <td className="px-4 py-3">
                <div className="flex gap-2 opacity-60 group-hover:opacity-100 transition-opacity justify-center">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(priceList)}
                      className="p-1.5 hover:bg-blue-100 rounded transition-colors"
                      title="Editar"
                    >
                      <MdEdit size={16} className="text-blue-600" />
                    </button>
                  )}
                  {onToggle && (
                    <button
                      onClick={() => onToggle(priceList)}
                      className="p-1.5 hover:bg-purple-100 rounded transition-colors"
                      title={priceList.isActive ? 'Desactivar' : 'Activar'}
                    >
                      <MdToggleOn size={16} className="text-purple-600" />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(priceList)}
                      className="p-1.5 hover:bg-red-100 rounded transition-colors"
                      title="Eliminar"
                    >
                      <MdDelete size={16} className="text-red-600" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
