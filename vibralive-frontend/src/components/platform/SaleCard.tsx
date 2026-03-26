'use client';

import React, { useState } from 'react';
import { MdEdit, MdDelete, MdMoreVert, MdCheckCircle, MdAttachMoney } from 'react-icons/md';
import { formatCurrency } from '@/lib/currency';

interface Sale {
  id: string;
  date: string;
  items?: any[];
  total: number;
  status: 'DRAFT' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
  customerName?: string;
}

interface SaleCardProps {
  sale: Sale;
  onEdit?: (sale: Sale) => void;
  onDelete?: (sale: Sale) => void;
  onToggleActive?: (sale: Sale) => void;
  onRefund?: (sale: Sale) => void; // New callback for refunds
}

export function SaleCard({ sale, onEdit, onDelete, onToggleActive, onRefund }: SaleCardProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const isDraft = sale.status === 'DRAFT';
  const isCompleted = sale.status === 'COMPLETED';
  const isFinal = sale.status === 'CANCELLED' || sale.status === 'REFUNDED';

  const headerBg = isDraft
    ? 'bg-gradient-to-r from-gray-600 to-gray-700'
    : 'bg-gradient-to-r from-primary-600 to-primary-700';

  const statusLabel = 
    sale.status === 'COMPLETED' ? 'Completada' :
    sale.status === 'CANCELLED' ? 'Cancelada' :
    sale.status === 'REFUNDED' ? 'Reembolso' :
    'Borrador';
  
  const statusBadge = 
    sale.status === 'COMPLETED' ? 'bg-success-500' :
    sale.status === 'CANCELLED' ? 'bg-gray-500' :
    sale.status === 'REFUNDED' ? 'bg-blue-500' :
    'bg-slate-500';
  
  const cardBg = isDraft ? 'bg-gray-50' : 'bg-white';

  return (
    <div className={`rounded-lg border overflow-hidden transition-all hover:shadow-md h-96 flex flex-col ${cardBg} ${isDraft ? 'border-gray-200' : 'border-primary-200'}`}>
      {/* HEADER */}
      <div className={`${headerBg} px-4 py-3 relative flex-shrink-0`}>
        <span className={`absolute top-3 right-12 px-2.5 py-0.5 rounded text-xs font-semibold text-white ${statusBadge}`}>
          {statusLabel}
        </span>

        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            {sale.customerName?.slice(0, 2).toUpperCase() || '🛒'}
          </div>

          <div className="flex-1 min-w-0 pr-10">
            <h3 className="font-bold text-white text-base leading-tight truncate">{sale.customerName || 'Sin cliente'}</h3>
            <p className="text-white/60 text-xs font-mono mt-0.5">{sale.date}</p>
          </div>

          <div className="relative">
            {/* GOLDEN RULE: Only show action menu if not final status */}
            {!isFinal && (
              <>
                <button
                  onClick={() => setExpandedId(expandedId === sale.id ? null : sale.id)}
                  className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded transition"
                  title="Opciones"
                >
                  <MdMoreVert className="w-5 h-5" />
                </button>

                {expandedId === sale.id && (
                  <div className="absolute right-0 top-10 w-40 bg-white border border-gray-200 rounded-lg shadow-xl z-10 overflow-hidden">
                    {/* ONLY SHOW FOR DRAFT SALES */}
                    {isDraft && (
                      <>
                        <button
                          onClick={() => {
                            onEdit?.(sale);
                            setExpandedId(null);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-primary-50 text-primary-600 text-sm font-medium flex items-center gap-2 border-b border-gray-100"
                        >
                          <MdEdit className="w-4 h-4" />
                          Editar
                        </button>
                        <button
                          onClick={() => {
                            onToggleActive?.(sale);
                            setExpandedId(null);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-amber-50 text-amber-600 text-sm font-medium flex items-center gap-2"
                        >
                          <MdCheckCircle className="w-4 h-4" />
                          Completar
                        </button>
                      </>
                    )}

                    {/* ONLY SHOW FOR COMPLETED SALES */}
                    {isCompleted && (
                      <button
                        onClick={() => {
                          onRefund?.(sale);
                          setExpandedId(null);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-success-50 text-success-600 text-sm font-medium flex items-center gap-2"
                      >
                        <MdAttachMoney className="w-4 h-4" />
                        Reembolsar
                      </button>
                    )}
                  </div>
                )}
              </>
            )} 
             
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 p-4 flex flex-col gap-3 overflow-hidden">
        {/* PRODUCTS LIST */}
        {sale.items && sale.items.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs text-slate-600 font-medium">PRODUCTOS</div>
            {sale.items.slice(0, 3).map((item: any, idx: number) => (
              <div key={idx} className="bg-slate-50 rounded p-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-900 font-medium truncate">
                    {item.productName || item.name || `Producto ${idx + 1}`}
                  </span>
                  <span className="text-slate-600 whitespace-nowrap">x{item.quantity}</span>
                </div>
                <div className="text-slate-600 mt-0.5">
                  {formatCurrency(Number(item.unitPrice || item.price || 0))} c/u
                </div>
              </div>
            ))}
            {sale.items.length > 3 && (
              <div className="text-xs text-slate-500 italic pl-2">
                ... +{sale.items.length - 3} más
              </div>
            )}
          </div>
        )}

        <div className="space-y-2">
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600 font-medium">TOTAL</span>
              <span className="text-sm font-bold text-slate-900">{formatCurrency(Number(sale.total || 0))}</span>
            </div>
          </div>
        </div>

        <div className="flex-1" />

      </div>
    </div>
  );
}
