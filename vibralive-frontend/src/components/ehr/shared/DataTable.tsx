'use client';

import { MdEdit, MdDelete } from 'react-icons/md';
import { DataTableProps, TableColumn } from './types';

export function DataTable<T extends { id: string }>({
  columns,
  data,
  emptyMessage = 'No hay registros',
  onEdit,
  onDelete,
  loading,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className="px-4 py-3 text-left text-sm font-semibold text-slate-900"
                style={{ width: col.width }}
              >
                {col.label}
              </th>
            ))}
            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900 w-24">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {data.map((row, idx) => (
            <tr key={row.id || idx} className="hover:bg-slate-50 transition">
              {columns.map((col) => {
                const value = row[col.key];
                const rendered = col.render ? col.render(value, row) : String(value || '');

                return (
                  <td
                    key={String(col.key)}
                    className="px-4 py-3 text-sm text-slate-700"
                    style={{ width: col.width }}
                  >
                    {rendered}
                  </td>
                );
              })}
              <td className="px-4 py-3 text-sm">
                <div className="flex gap-2">
                  <button
                    onClick={() => onEdit(row)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
                    title="Editar"
                  >
                    <MdEdit size={18} />
                  </button>
                  <button
                    onClick={() => onDelete(row)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                    title="Eliminar"
                  >
                    <MdDelete size={18} />
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
