'use client';

import React from 'react';
import { MdEdit, MdDelete, MdBlock, MdLocalPharmacy, MdSpa, MdSchedule } from 'react-icons/md';
import { Service } from '@/types';

interface ServiceTableProps {
  services: Service[];
  onEdit?: (service: Service) => void;
  onDeactivate?: (service: Service) => void;
  onDelete?: (service: Service) => void;
}

export function ServiceTable({
  services,
  onEdit,
  onDeactivate,
  onDelete,
}: ServiceTableProps) {
  const getCategoryIcon = (category?: string) => {
    if (!category) return null;
    if (category.toLowerCase().includes('medical') || category.toLowerCase().includes('médico')) {
      return <MdLocalPharmacy className="text-purple-600" size={16} />;
    }
    if (category.toLowerCase().includes('grooming') || category.toLowerCase().includes('baño')) {
      return <MdSpa className="text-amber-600" size={16} />;
    }
    return null;
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-gray-50/80 border-b border-gray-200">
          <tr>
            <th className="px-4 py-2.5 text-left font-medium text-gray-600 text-xs uppercase tracking-wide">
              Servicio
            </th>
            <th className="px-4 py-2.5 text-left font-medium text-gray-600 text-xs uppercase tracking-wide">
              Categoría
            </th>
            <th className="px-4 py-2.5 text-left font-medium text-gray-600 text-xs uppercase tracking-wide">
              Detalles
            </th>
            <th className="px-4 py-2.5 text-left font-medium text-gray-600 text-xs uppercase tracking-wide">
              Precio
            </th>
            <th className="px-4 py-2.5 text-center font-medium text-gray-600 text-xs uppercase tracking-wide w-20">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {services.map((service) => (
            <tr
              key={service.id}
              className={`transition group ${
                !service.isActive
                  ? 'bg-gray-50 hover:bg-gray-100 border-l-4 border-l-gray-400'
                  : 'hover:bg-blue-50/30 border-l-4 border-l-transparent'
              }`}
            >
              <td className="px-4 py-2.5">
                <div className="flex flex-col gap-1">
                  <div className="font-semibold text-gray-900">{service.name}</div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400 font-mono">
                      {service.id.slice(0, 8)}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                        service.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {service.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
              </td>
              <td className="px-4 py-2.5">
                <div className="flex items-center gap-1.5">
                  {getCategoryIcon(service.category)}
                  <span className="text-sm text-gray-700">{service.category || '-'}</span>
                </div>
              </td>
              <td className="px-4 py-2.5">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <MdSchedule size={14} className="text-gray-400" />
                    {service.defaultDurationMinutes ? `${service.defaultDurationMinutes} min` : '-'}
                  </div>
                  <span className="text-xs text-gray-500 truncate">
                    {service.description || '-'}
                  </span>
                </div>
              </td>
              <td className="px-4 py-2.5 font-semibold text-blue-600">
                ${Number(service.price || 0).toFixed(2)}
              </td>
              <td className="px-4 py-2.5">
                <div className="flex gap-1 opacity-60 group-hover:opacity-100 transition-opacity justify-center">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(service)}
                      className="p-1 hover:bg-blue-100 rounded transition-colors"
                      title="Editar"
                    >
                      <MdEdit size={16} className="text-blue-600" />
                    </button>
                  )}
                  {onDeactivate && (
                    <button
                      onClick={() => onDeactivate(service)}
                      className="p-1 hover:bg-orange-100 rounded transition-colors"
                      title="Desactivar"
                    >
                      <MdBlock size={16} className="text-orange-600" />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(service)}
                      className="p-1 hover:bg-red-100 rounded transition-colors"
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
