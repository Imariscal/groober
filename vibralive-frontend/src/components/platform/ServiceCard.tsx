'use client';

import React from 'react';
import {
  MdMoreVert,
  MdEdit,
  MdDelete,
  MdBlock,
  MdLocalPharmacy,
  MdSpa,
  MdAccessTime,
  MdLocalOffer,
} from 'react-icons/md';
import { Service } from '@/types';
import { usePermissions } from '@/hooks/usePermissions';

interface ServiceCardProps {
  service: Service;
  servicePrice?: number;
  size?: 'XS' | 'S' | 'M' | 'L'; // XS: 180px, S: 256px, M: 320px, L: 384px
  onEdit?: (service: Service) => void;
  onDeactivate?: (service: Service) => void;
  onDelete?: (service: Service) => void;
}

export function ServiceCard({
  service,
  servicePrice,
  size = 'XS',
  onEdit,
  onDeactivate,
  onDelete,
}: ServiceCardProps) {
  const [showMenu, setShowMenu] = React.useState(false);
  const { has } = usePermissions();

  const sizeMap = {
    XS: 'h-56',   // 180px
    S: 'h-64',    // 256px
    M: 'h-80',    // 320px
    L: 'h-96',    // 384px
  };

  const getCategoryIcon = (category?: string) => {
    if (!category) return null;
    const cat = category.toLowerCase();
    if (cat.includes('medical') || cat.includes('médico')) {
      return <MdLocalPharmacy className="text-purple-500" size={16} />;
    }
    if (cat.includes('grooming') || cat.includes('baño')) {
      return <MdSpa className="text-amber-500" size={16} />;
    }
    return null;
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
              {service.name.charAt(0).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-white leading-tight truncate">
                {service.name}
              </h3>
              <p className="text-xs text-primary-100 mt-0.5">{service.id.slice(0, 8)}</p>
            </div>
          </div>

          {/* Estado Badge */}
          <div className="flex items-start gap-2">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold whitespace-nowrap ${
                service.isActive
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-400 text-white'
              }`}
            >
              {service.isActive ? 'Activo' : 'Inactivo'}
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
                  {onEdit && has('services:update') && (
                    <button
                      onClick={() => onEdit(service)}
                      className="w-full text-left px-3 py-2 text-xs text-primary-600 hover:bg-primary-50 flex items-center gap-2 transition-colors font-medium"
                    >
                      <MdEdit size={16} />
                      Editar
                    </button>
                  )}
                  {onDeactivate && has('services:update') && (
                    <button
                      onClick={() => onDeactivate(service)}
                      className="w-full text-left px-3 py-2 text-xs text-orange-600 hover:bg-orange-50 flex items-center gap-2 transition-colors font-medium"
                    >
                      <MdBlock size={16} />
                      {service.isActive ? 'Desactivar' : 'Activar'}
                    </button>
                  )}
                  {onDelete && has('services:delete') && (
                    <button
                      onClick={() => onDelete(service)}
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
      <div className="px-4 py-3 flex-1 flex flex-col gap-3 overflow-y-auto">
        {/* Categoría + Precio - Primera línea */}
        <div className="flex items-center justify-between gap-3">
          {service.category && (
            <div className="flex items-center gap-1.5">
              {getCategoryIcon(service.category)}
              <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                {service.category}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-primary-600 ml-auto">
            <MdLocalOffer size={16} />
            <span className="text-sm font-bold text-gray-900">
              ${Number(servicePrice || 0).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Descripción */}
        {service.description && (
          <div className="text-xs">
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">
              Descripción
            </p>
            <p className="text-sm text-gray-700 line-clamp-3 leading-snug">
              {service.description}
            </p>
          </div>
        )}

        {/* Duración */}
        {service.defaultDurationMinutes && (
          <div className="flex items-center gap-2">
            <MdAccessTime className="text-gray-400" size={16} />
            <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">
              Duración
            </span>
            <span className="text-sm text-gray-700 ml-auto font-medium">
              {service.defaultDurationMinutes} min
            </span>
          </div>
        )}
      </div>
    </div>
  );
}


