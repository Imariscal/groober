'use client';

import React from 'react';
import { MdEdit, MdDelete, MdCheckCircle, MdBlock, MdChecklistRtl } from 'react-icons/md';

interface Vaccine {
  id: string;
  name: string;
  description?: string;
  diseasesCovered?: string[];
  boosterDays?: number;
  isActive: boolean;
  createdAt?: string;
}

interface VaccinesTableProps {
  vaccines: Vaccine[];
  onEdit: (vaccine: Vaccine) => void;
  onDelete: (vaccine: Vaccine) => void;
  onActivate?: (vaccine: Vaccine) => void;
  onDeactivate?: (vaccine: Vaccine) => void;
}

const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  try {
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(dateString));
  } catch {
    return 'N/A';
  }
};

export function VaccinesTable({
  vaccines,
  onEdit,
  onDelete,
  onActivate,
  onDeactivate,
}: VaccinesTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="text-left px-4 py-3 font-semibold text-slate-700">Nombre</th>
            <th className="text-left px-4 py-3 font-semibold text-slate-700">Enfermedades</th>
            <th className="text-left px-4 py-3 font-semibold text-slate-700">Refuerzo</th>
            <th className="text-left px-4 py-3 font-semibold text-slate-700">Estado</th>
            <th className="text-left px-4 py-3 font-semibold text-slate-700">Creado</th>
            <th className="text-center px-4 py-3 font-semibold text-slate-700">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {vaccines.map((vaccine, index) => (
            <tr
              key={vaccine.id}
              className={`border-b border-slate-100 transition hover:bg-slate-50 ${
                index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
              }`}
            >
              <td className="px-4 py-3">
                <div>
                  <p className="font-medium text-slate-900">{vaccine.name}</p>
                  <p className="text-xs text-slate-500">{vaccine.id.slice(0, 8)}</p>
                </div>
              </td>
              <td className="px-4 py-3">
                <p className="text-slate-700 truncate">
                  {vaccine.diseasesCovered && vaccine.diseasesCovered.length > 0
                    ? vaccine.diseasesCovered.join(', ')
                    : '-'}
                </p>
              </td>
              <td className="px-4 py-3">
                <p className="text-slate-700">
                  {vaccine.boosterDays ? `Cada ${vaccine.boosterDays} días` : '-'}
                </p>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <MdCheckCircle
                    className={vaccine.isActive ? 'text-green-600' : 'text-slate-400'}
                    size={16}
                  />
                  <span
                    className={`text-xs font-medium ${
                      vaccine.isActive ? 'text-green-700' : 'text-slate-600'
                    }`}
                  >
                    {vaccine.isActive ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 text-slate-600">
                {formatDate(vaccine.createdAt)}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => onEdit(vaccine)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
                    title="Editar"
                  >
                    <MdEdit className="w-4 h-4" />
                  </button>
                  {vaccine.isActive ? (
                    <button
                      onClick={() => onDeactivate?.(vaccine)}
                      className="p-1.5 text-amber-600 hover:bg-amber-50 rounded transition"
                      title="Desactivar"
                    >
                      <MdBlock className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => onActivate?.(vaccine)}
                      className="p-1.5 text-green-600 hover:bg-green-50 rounded transition"
                      title="Activar"
                    >
                      <MdChecklistRtl className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => onDelete(vaccine)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                    title="Eliminar"
                  >
                    <MdDelete className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
