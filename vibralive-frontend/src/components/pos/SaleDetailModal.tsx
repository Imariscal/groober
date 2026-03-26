'use client';

import React, { useState } from 'react';
import { FiX, FiCheck, FiTrash2, FiRefreshCw } from 'react-icons/fi';
import { displayFormatters } from '@/lib/datetime-tz';
import { formatCurrency } from '@/lib/formatting';

interface SaleDetailModalProps {
  sale: any;
  clinicTimezone?: string;
  onClose: () => void;
  onComplete?: (saleId: string) => void;
  onCancel?: (saleId: string) => void;
  onRefund?: (saleId: string) => void;
  isLoading?: boolean;
}

export default function SaleDetailModal({
  sale,
  clinicTimezone = 'UTC',
  onClose,
  onComplete,
  onCancel,
  onRefund,
  isLoading = false,
}: SaleDetailModalProps) {
  const [showConfirm, setShowConfirm] = useState<string | null>(null);

  const handleAction = (action: 'complete' | 'cancel' | 'refund') => {
    if (action === 'complete' && onComplete) {
      onComplete(sale.id);
    } else if (action === 'cancel' && onCancel) {
      onCancel(sale.id);
    } else if (action === 'refund' && onRefund) {
      onRefund(sale.id);
    }
    setShowConfirm(null);
  };

  const statusColor = {
    pending: 'yellow',
    completed: 'green',
    cancelled: 'red',
    refunded: 'blue',
  }[sale.status as 'pending' | 'completed' | 'cancelled' | 'refunded'] || 'gray';

  const statusLabel = {
    pending: 'Pendiente',
    completed: 'Completado',
    cancelled: 'Cancelado',
    refunded: 'Reembolsado',
  }[sale.status as 'pending' | 'completed' | 'cancelled' | 'refunded'] || sale.status;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-900">Detalles de Venta</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition"
            disabled={isLoading}
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status */}
          <div>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-${statusColor}-100 text-${statusColor}-800`}
            >
              {statusLabel}
            </span>
          </div>

          {/* Sale ID and Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-600 uppercase">ID</p>
              <p className="text-sm font-mono text-gray-900">
                {sale.id?.slice(0, 8).toUpperCase()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 uppercase">Fecha</p>
              <p className="text-sm text-gray-900">
                {displayFormatters.formatForModal(sale.createdAt, clinicTimezone)}
              </p>
            </div>
          </div>

          {/* Client Info */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Cliente</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div>
                <p className="text-xs text-gray-600">Nombre</p>
                <p className="text-sm font-medium text-gray-900">{sale.clientName}</p>
              </div>
              {sale.petName && (
                <div>
                  <p className="text-xs text-gray-600">Mascota</p>
                  <p className="text-sm font-medium text-gray-900">{sale.petName}</p>
                </div>
              )}
            </div>
          </div>

          {/* Items */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Productos</h3>
            <div className="space-y-2">
              {sale.items && sale.items.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {item.productName || item.name}
                    </p>
                    <p className="text-xs text-gray-600">
                      {item.quantity} × {formatCurrency(item.unitPrice || item.price || 0)}
                    </p>
                  </div>
                  <p className="font-semibold text-gray-900">
                    {formatCurrency((item.quantity || 1) * (item.unitPrice || item.price || 0))}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Payments - if available */}
          {sale.payments && sale.payments.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Pagos</h3>
              <div className="space-y-2">
                {sale.payments.map((payment: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-blue-50 rounded-lg"
                  >
                    <p className="text-sm text-gray-900">
                      {payment.method || 'Efectivo'}
                    </p>
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(payment.amount || 0)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Total */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-gray-900">Total:</span>
              <span className="text-2xl font-bold text-green-600">
                {formatCurrency(sale.total || 0)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            {sale.status === 'pending' && onComplete && (
              <button
                onClick={() => setShowConfirm('complete')}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiCheck size={18} />
                Marcar como Completado
              </button>
            )}

            {sale.status === 'completed' && onRefund && (
              <button
                onClick={() => setShowConfirm('refund')}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiRefreshCw size={18} />
                Reembolsar
              </button>
            )}

            {sale.status !== 'cancelled' && sale.status !== 'refunded' && onCancel && (
              <button
                onClick={() => setShowConfirm('cancel')}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiTrash2 size={18} />
                Cancelar Venta
              </button>
            )}

            <button
              onClick={onClose}
              disabled={isLoading}
              className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            >
              Cerrar
            </button>
          </div>
        </div>

        {/* Confirmation Dialog */}
        {showConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[51]">
            <div className="bg-white rounded-lg max-w-sm w-full mx-4 p-6">
              <h3 className="text-lg font-bold text-gray-900">
                {showConfirm === 'complete' && '¿Completar venta?'}
                {showConfirm === 'cancel' && '¿Cancelar venta?'}
                {showConfirm === 'refund' && '¿Reembolsar venta?'}
              </h3>
              <p className="mt-2 text-gray-600">
                Esta acción no se puede deshacer.
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowConfirm(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  disabled={isLoading}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleAction(showConfirm as any)}
                  disabled={isLoading}
                  className={`flex-1 px-4 py-2 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed ${
                    showConfirm === 'complete'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {isLoading ? 'Procesando...' : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
