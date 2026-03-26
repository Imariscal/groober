'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { MdMoreVert, MdEdit, MdDelete, MdToggleOn, MdShoppingCart, MdSpa, MdLocalPharmacy, MdStar, MdSchedule, MdOutlineShoppingCart } from 'react-icons/md';
import { PriceList, ServicePrice, ServicePackagePrice } from '@/types';
import { priceListsApi } from '@/api/price-lists-api';
import { useClinicTimezone } from '@/hooks/useClinicTimezone';
import { usePermissions } from '@/hooks/usePermissions';
import { formatInClinicTz } from '@/lib/datetime-tz';

interface PriceListCardProps {
  priceList: PriceList;
  size?: 'XS' | 'S' | 'M' | 'L';
  onEdit?: (priceList: PriceList) => void;
  onToggle?: (priceList: PriceList) => void;
  onDelete?: (priceList: PriceList) => void;
  onViewDetails?: (priceList: PriceList) => void;
}

export function PriceListCard({
  priceList,
  size = 'S',
  onEdit,
  onToggle,
  onDelete,
  onViewDetails,
}: PriceListCardProps) {
  const router = useRouter();
  const clinicTimezone = useClinicTimezone();
  const { has } = usePermissions();
  const [showMenu, setShowMenu] = React.useState(false);
  const [servicePrices, setServicePrices] = React.useState<ServicePrice[]>([]);
  const [packagePrices, setPackagePrices] = React.useState<ServicePackagePrice[]>([]);
  const [isLoadingServices, setIsLoadingServices] = React.useState(true);

  const sizeMap = {
    XS: 'h-56',
    S: 'h-auto',
    M: 'h-80',
    L: 'h-96',
  };

  React.useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingServices(true);
        const [prices, packages] = await Promise.all([
          priceListsApi.getServicePrices(priceList.id),
          priceListsApi.getPackagePrices(priceList.id),
        ]);
        setServicePrices(prices);
        setPackagePrices(packages);
      } catch (error) {
        console.error('Error loading price list data:', error);
      } finally {
        setIsLoadingServices(false);
      }
    };

    loadData();
  }, [priceList.id]);

  // Calculate service counts
  const totalServices = servicePrices.length;
  const groomingCount = servicePrices.filter(
    (sp) => sp.service?.category === 'GROOMING'
  ).length;
  const medicalCount = servicePrices.filter(
    (sp) => sp.service?.category === 'MEDICAL'
  ).length;

  const handleViewServices = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onViewDetails) {
      onViewDetails(priceList);
    } else {
      router.push(`/clinic/price-lists/${priceList.id}`);
    }
  };

  return (
    <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all ${sizeMap[size]} flex flex-col`}>
      {/* Header Azul */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-4 py-3 text-white flex-shrink-0">
        <div className="flex justify-between items-start gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 text-white font-bold text-lg ${
              priceList.isDefault ? 'bg-gradient-to-br from-yellow-300 to-yellow-500 shadow-lg' : 'bg-primary-400'
            }`}>
              {priceList.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-white truncate">{priceList.name}</h3>
              {priceList.description && (
                <p className="text-xs text-primary-100 truncate">{priceList.description}</p>
              )}
              <p className="text-xs text-primary-100 mt-0.5">{priceList.id.slice(0, 8)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex gap-1">
              {priceList.isDefault && (
                <span className="inline-flex items-center gap-0.5 px-2 py-1 rounded text-[10px] font-bold bg-yellow-400 text-yellow-900">
                  <MdStar size={10} />
                  Default
                </span>
              )}
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-medium ${
                  priceList.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}
              >
                {priceList.isActive ? 'Activa' : 'Inactiva'}
              </span>
            </div>

            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 hover:bg-primary-400 rounded transition-colors"
                title="Opciones"
              >
                <MdMoreVert size={18} className="text-white" />
              </button>

              {showMenu && (
                <div
                  className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl w-40 z-20"
                  onClick={() => setShowMenu(false)}
                >
                  {onEdit && has('price-lists:update') && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(priceList);
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <MdEdit size={14} className="text-primary-600" />
                      Editar
                    </button>
                  )}
                  {onToggle && has('price-lists:update') && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggle(priceList);
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <MdToggleOn size={14} className="text-purple-600" />
                      {priceList.isActive ? 'Desactivar' : 'Activar'}
                    </button>
                  )}
                  {onDelete && has('price-lists:delete') && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(priceList);
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-gray-200"
                    >
                      <MdDelete size={14} />
                      Eliminar
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-4 flex-1">
        {/* Fecha Creación */}
        <p className="text-xs text-gray-500 mb-3">
          Creado: {formatInClinicTz(new Date(priceList.createdAt), 'dd MMM yyyy', clinicTimezone)}
        </p>

        {/* Total Servicios y Paquetes - En una línea */}
        <div className="flex gap-4 mb-4 pb-3 border-b border-gray-200">
          <div className="flex-1 text-center">
            <p className="text-xs font-bold text-primary-600 uppercase tracking-wider mb-1">Total Servicios</p>
            <p className="text-3xl font-black text-primary-700">{isLoadingServices ? '—' : totalServices}</p>
          </div>
          <div className="flex-1 text-center">
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Total Paquetes</p>
            <p className="text-3xl font-black text-emerald-700">{isLoadingServices ? '—' : packagePrices.length}</p>
          </div>
        </div>

        {/* Breakdown - Grooming & Medical */}
        {totalServices > 0 && !isLoadingServices ? (
          <div className="space-y-2">
            {groomingCount > 0 && (
              <div className="flex items-center justify-between px-3 py-2 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-center gap-2">
                  <MdSpa className="text-amber-500" size={18} />
                  <span className="text-xs font-semibold text-gray-700">GROOMING</span>
                </div>
                <span className="text-lg font-bold text-amber-600">{groomingCount}</span>
              </div>
            )}
            {medicalCount > 0 && (
              <div className="flex items-center justify-between px-3 py-2 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2">
                  <MdLocalPharmacy className="text-purple-500" size={18} />
                  <span className="text-xs font-semibold text-gray-700">MÉDICOS</span>
                </div>
                <span className="text-lg font-bold text-purple-600">{medicalCount}</span>
              </div>
            )}
          </div>
        ) : isLoadingServices ? (
          <div className="text-center py-4 text-gray-400">Cargando...</div>
        ) : null}
      </div>

      {/* Footer Button */}
      <div className="px-4 py-3 border-t border-gray-200 flex-shrink-0">
        <button
          onClick={handleViewServices}
          className="w-full px-3 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
        >
          <MdShoppingCart size={16} />
          Ver Detalles
        </button>
      </div>
    </div>
  );
}


