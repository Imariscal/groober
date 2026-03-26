'use client';

import React from 'react';
import { MdEdit, MdDelete, MdCheckCircle, MdAttachMoney } from 'react-icons/md';
import { formatCurrency } from '@/lib/currency';

interface Sale {
  id: string;
  date: string;
  items?: any[];
  total: number;
  status: 'DRAFT' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
  customerName?: string;
}

interface SalesTableProps {
  sales: Sale[];
  onEdit?: (sale: Sale) => void;
  onDelete?: (sale: Sale) => void;
  onToggleActive?: (sale: Sale) => void;
  onRefund?: (sale: Sale) => void; // New callback for refunds
}

export function SalesTable({ sales, onEdit, onDelete, onToggleActive, onRefund }: SalesTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-gray-50/80 border-b border-gray-200">
          <tr>
            <th className="px-4 py-2.5 text-left font-medium text-gray-600 text-xs uppercase tracking-wide">
              Cliente
            </th>
            <th className="px-4 py-2.5 text-left font-medium text-gray-600 text-xs uppercase tracking-wide">
              Fecha
            </th>
            <th className="px-4 py-2.5 text-center font-medium text-gray-600 text-xs uppercase tracking-wide">
              Items
            </th>
            <th className="px-4 py-2.5 text-right font-medium text-gray-600 text-xs uppercase tracking-wide">
              Total
            </th>
            <th className="px-4 py-2.5 text-center font-medium text-gray-600 text-xs uppercase tracking-wide">
              Estado
            </th>
            <th className="px-4 py-2.5 text-center font-medium text-gray-600 text-xs uppercase tracking-wide w-32">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {sales.map((sale) => {
            const isDraft = sale.status === 'DRAFT';
            const isCompleted = sale.status === 'COMPLETED';
            const isFinal = sale.status === 'CANCELLED' || sale.status === 'REFUNDED';

            const statusLabel = 
              sale.status === 'COMPLETED' ? 'Completada' :
              sale.status === 'CANCELLED' ? 'Cancelada' :
              sale.status === 'REFUNDED' ? 'Reembolso' :
              'Borrador';

            return (
              <tr
                key={sale.id}
                className={`transition group ${
                  isDraft
                    ? 'bg-gray-50 hover:bg-gray-100 border-l-4 border-l-gray-400'
                    : 'hover:bg-primary-50/30 border-l-4 border-l-primary-400'
                }`}
              >
                <td className="px-4 py-2.5">
                  <span className="font-semibold text-gray-900">{sale.customerName || 'Sin cliente'}</span>
                </td>

                <td className="px-4 py-2.5">
                  <span className="text-gray-600">{sale.date}</span>
                </td>

                <td className="px-4 py-2.5 text-center">
                  <span className="text-gray-900 font-medium">{sale.items?.length || 0}</span>
                </td>

                <td className="px-4 py-2.5 text-right">
                  <span className="text-gray-900 font-bold">{formatCurrency(Number(sale.total || 0))}</span>
                </td>

                <td className="px-4 py-2.5 text-center">
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded ${
                      sale.status === 'COMPLETED'
                        ? 'bg-success-100 text-success-700'
                        : sale.status === 'CANCELLED'
                        ? 'bg-gray-100 text-gray-700'
                        : sale.status === 'REFUNDED'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {statusLabel}
                  </span>
                </td>

                <td className="px-4 py-2.5">
                  {/* GOLDEN RULE: Conditional rendering based on status */}
                  {isDraft && (
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={() => onEdit?.(sale)}
                        className="p-2 text-primary-600 hover:bg-primary-100 rounded transition"
                        title="Editar"
                      >
                        <MdEdit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onToggleActive?.(sale)}
                        className="p-2 text-amber-600 hover:bg-amber-100 rounded transition"
                        title="Completar"
                      >
                        <MdCheckCircle className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {isCompleted && (
                    <div className="flex items-center justify-center">
                      <button
                        onClick={() => onRefund?.(sale)}
                        className="p-2 text-success-600 hover:bg-success-100 rounded transition"
                        title="Reembolsar"
                      >
                        <MdAttachMoney className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {isFinal && (
                    <div className="text-xs text-gray-500 font-medium text-center">
                      {statusLabel}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
