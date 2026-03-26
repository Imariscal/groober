'use client';

import React from 'react';
import {
  MdMoreVert,
  MdEdit,
  MdDelete,
  MdBlock,
  MdLocalOffer,
} from 'react-icons/md';
import { ServicePackage } from '@/types';
import { usePermissions } from '@/hooks/usePermissions';

interface PackageCardProps {
  pkg: ServicePackage;
  size?: 'XS' | 'S' | 'M' | 'L'; // XS: 180px, S: 256px, M: 320px, L: 384px
  onEdit?: (pkg: ServicePackage) => void;
  onDeactivate?: (pkg: ServicePackage) => void;
  onDelete?: (pkg: ServicePackage) => void;
}

export function PackageCard({
  pkg,
  size = 'XS',
  onEdit,
  onDeactivate,
  onDelete,
}: PackageCardProps) {
  const [showMenu, setShowMenu] = React.useState(false);
  const { has } = usePermissions();

  const sizeMap = {
    XS: 'h-56',   // 180px
    S: 'h-64',    // 256px
    M: 'h-80',    // 320px
    L: 'h-96',    // 384px
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow ${sizeMap[size]} flex flex-col`}>
      {/* Header Azul */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-4 py-3 text-white relative flex-shrink-0">
        <div className="flex justify-between items-start gap-3">
          {/* Avatar + Nombre */}
          <div className="flex-1 flex items-start gap-3">
            {/* Avatar Inicial */}
            <div className="w-12 h-12 rounded-lg bg-primary-500 flex items-center justify-center flex-shrink-0 text-white font-bold text-lg">
              {pkg.name.charAt(0).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-white leading-tight truncate">
                {pkg.name}
              </h3>
              <p className="text-xs text-primary-100 mt-0.5">{pkg.id.slice(0, 8)}</p>
            </div>
          </div>

          {/* Estado Badge */}
          <div className="flex items-start gap-2">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold whitespace-nowrap ${
                pkg.isActive
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-400 text-white'
              }`}
            >
              {pkg.isActive ? 'Activo' : 'Inactivo'}
            </span>

            {/* Menú */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 hover:bg-primary-500 rounded transition-colors"
                title="Opciones"
              >
                <MdMoreVert size={20} className="text-white" />
              </button>

              {showMenu && (
                <div
                  className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl w-40 z-20 overflow-hidden"
                  onClick={() => setShowMenu(false)}
                >
                  {onEdit && has('packages:update') && (
                    <button
                      onClick={() => onEdit(pkg)}
                      className="w-full text-left px-3 py-2 text-xs text-primary-600 hover:bg-primary-50 flex items-center gap-2 transition-colors font-medium"
                    >
                      <MdEdit size={16} />
                      Editar
                    </button>
                  )}
                  {onDeactivate && has('packages:update') && (
                    <button
                      onClick={() => onDeactivate(pkg)}
                      className="w-full text-left px-3 py-2 text-xs text-orange-600 hover:bg-orange-50 flex items-center gap-2 transition-colors font-medium"
                    >
                      <MdBlock size={16} />
                      {pkg.isActive ? 'Desactivar' : 'Activar'}
                    </button>
                  )}
                  {onDelete && has('packages:delete') && (
                    <button
                      onClick={() => onDelete(pkg)}
                      className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors font-medium border-t border-gray-100"
                    >
                      <MdDelete size={16} />
                      Eliminar
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="px-3 py-2 flex-1 flex flex-col gap-2 overflow-hidden">
        {/* Descripción */}
        {pkg.description && (
          <p className="text-xs text-gray-600 line-clamp-1">{pkg.description}</p>
        )}

        {/* Items List - Centro */}
        {pkg.items.length > 0 && (
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="space-y-1">
              {pkg.items.slice(0, 3).map((item, idx) => (
                <div key={idx} className="text-xs text-gray-700 truncate">
                  <span className="font-medium">• {item.serviceName || item.serviceId}</span>
                  <span className="text-gray-500 text-xs"> (×{item.quantity})</span>
                </div>
              ))}
              {pkg.items.length > 3 && (
                <div className="text-xs text-gray-500 italic">
                  ... +{pkg.items.length - 3} más
                </div>
              )}
            </div>
          </div>
        )}

        {/* Total en esquina inferior derecha */}
        <div className="flex items-end justify-between pt-1 border-t border-gray-100 mt-auto">
          <span className="text-xs text-gray-500">
            {pkg.items.length} {pkg.items.length === 1 ? 'servicio' : 'servicios'}
          </span>
          <div className="text-right">
            {pkg.totalPrice ? (
              <div className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded whitespace-nowrap">
                ${pkg.totalPrice.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {pkg.currency || 'MXN'}
              </div>
            ) : (
              <div className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded">
                {pkg.items.reduce((sum, item) => sum + item.quantity, 0)} unid.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


