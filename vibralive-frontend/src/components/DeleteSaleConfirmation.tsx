'use client';

import React, { useState } from 'react';
import { MdClose, MdWarning } from 'react-icons/md';
import toast from 'react-hot-toast';

interface DeleteSaleConfirmationProps {
  isOpen: boolean;
  sale: {
    id: string;
    date: string;
    items?: any[];
    total: number;
    status: 'DRAFT' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
    customerName?: string;
  } | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function DeleteSaleConfirmation({ isOpen, sale, onClose, onSuccess }: DeleteSaleConfirmationProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!sale?.id) return;

    try {
      setLoading(true);
      toast.success('Venta eliminada exitosamente');
      onSuccess?.();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar venta');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !sale) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-critical-100 rounded-lg">
              <MdWarning size={24} className="text-critical-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Eliminar Venta</h2>
          </div>
          <button onClick={onClose} disabled={loading} className="p-1 hover:bg-gray-100 rounded transition">
            <MdClose size={24} className="text-gray-600" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-critical-50 border border-critical-200 rounded-lg p-4">
            <p className="text-gray-900 font-semibold">
              ¿Estás seguro de que deseas eliminar la venta de{' '}
              <span className="text-critical-600">{sale.customerName || 'Sin nombre'}</span>?
            </p>
          </div>

          <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between">
              <span className="text-gray-600 font-medium">Fecha:</span>
              <span className="font-semibold text-gray-900">{sale.date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 font-medium">Items:</span>
              <span className="font-semibold text-gray-900">{sale.items}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 font-medium">Total:</span>
              <span className="font-semibold text-gray-900">${sale.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 font-medium">Estado:</span>
              <span className={`text-xs font-bold px-2 py-1 rounded ${
                sale.status === 'COMPLETED' ? 'bg-success-100 text-success-700' : 'bg-slate-100 text-slate-700'
              }`}>
                {sale.status === 'COMPLETED' ? 'Completada' : 'Borrador'}
              </span>
            </div>
          </div>

          <p className="text-sm text-gray-600">Esta acción no se puede deshacer.</p>
        </div>

        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition font-semibold"
          >
            Cancelar
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-critical-600 text-white rounded-lg hover:bg-critical-700 disabled:opacity-50 transition font-semibold"
          >
            {loading ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
}
