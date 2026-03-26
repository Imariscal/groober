'use client';

import React from 'react';
import { MdEdit, MdDelete, MdBlock } from 'react-icons/md';
import { ServicePackage } from '@/types';

interface PackageTableProps {
  packages: ServicePackage[];
  onEdit?: (pkg: ServicePackage) => void;
  onDeactivate?: (pkg: ServicePackage) => void;
  onDelete?: (pkg: ServicePackage) => void;
}

export function PackageTable({
  packages,
  onEdit,
  onDeactivate,
  onDelete,
}: PackageTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-gray-50/80 border-b border-gray-200">
          <tr>
            <th className="px-4 py-2.5 text-left font-medium text-gray-600 text-xs uppercase tracking-wide">
              Paquete
            </th>
            <th className="px-4 py-2.5 text-left font-medium text-gray-600 text-xs uppercase tracking-wide">
              Contenido
            </th>
            <th className="px-4 py-2.5 text-left font-medium text-gray-600 text-xs uppercase tracking-wide">
              Detalles
            </th>
            <th className="px-4 py-2.5 text-right font-medium text-gray-600 text-xs uppercase tracking-wide">
              Total
            </th>
            <th className="px-4 py-2.5 text-center font-medium text-gray-600 text-xs uppercase tracking-wide w-20">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {packages.map((pkg) => (
            <tr
              key={pkg.id}
              className={`transition group ${
                !pkg.isActive
                  ? 'bg-gray-50 hover:bg-gray-100 border-l-4 border-l-gray-400'
                  : 'hover:bg-blue-50/30 border-l-4 border-l-transparent'
              }`}
            >
              <td className="px-4 py-2.5">
                <div className="flex flex-col gap-1">
                  <div className="font-semibold text-gray-900">{pkg.name}</div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400 font-mono">
                      {pkg.id.slice(0, 8)}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                        pkg.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {pkg.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
              </td>
              <td className="px-4 py-2.5">
                <div className="text-sm text-gray-700 font-medium">
                  {pkg.items.length} {pkg.items.length === 1 ? 'servicio' : 'servicios'}
                </div>
              </td>
              <td className="px-4 py-2.5">
                <div className="text-xs text-gray-500 truncate max-w-xs line-clamp-1">
                  {pkg.description || '-'}
                </div>
              </td>
              <td className="px-4 py-2.5 text-right">
                {pkg.totalPrice ? (
                  <div className="text-sm font-bold text-green-600 bg-green-50 px-2 py-1 rounded inline-block whitespace-nowrap">
                    ${pkg.totalPrice.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                ) : (
                  <div className="text-xs text-gray-400">-</div>
                )}
              </td>
              <td className="px-4 py-2.5">
                <div className="flex items-center justify-center gap-2">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(pkg)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Editar"
                    >
                      <MdEdit size={18} />
                    </button>
                  )}
                  {onDeactivate && (
                    <button
                      onClick={() => onDeactivate(pkg)}
                      className="p-1.5 text-orange-600 hover:bg-orange-50 rounded transition-colors"
                      title={pkg.isActive ? 'Desactivar' : 'Activar'}
                    >
                      <MdBlock size={18} />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(pkg)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Eliminar"
                    >
                      <MdDelete size={18} />
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
