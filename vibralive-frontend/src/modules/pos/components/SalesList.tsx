import React, { useState } from 'react';
import { Sale, SaleStatus } from '../stores/saleStore';
import { SaleStatusBadge } from './SaleStatusBadge';
import { posApi } from '../services/api';

interface SalesListProps {
  sales: Sale[];
  onSelectSale: (sale: Sale) => void;
  onRefresh: () => void;
}

/**
 * COMPONENTE: Lista/Tabla de Ventas
 * 
 * ✅ GOLDEN RULE IMPLEMENTATION
 * - SOLO muestra botones para DRAFT
 * - COMPLETED: solo muestra "Reembolsar"
 * - CANCELLED/REFUNDED: no muestra botones de acción
 */
export const SalesList: React.FC<SalesListProps> = ({
  sales,
  onSelectSale,
  onRefresh,
}) => {
  const [processingId, setProcessingId] = useState<string | null>(null);

  /**
   * Renderizar botones según status
   * 
   * DRAFT:     [Editar] [Cancelar] [Completar]
   * COMPLETED: [Reembolsar]
   * FINAL:     (sin botones)
   */
  const renderActions = (sale: Sale) => {
    if (sale.status === 'DRAFT') {
      return (
        <div className="flex gap-2">
          <button
            onClick={() => onSelectSale(sale)}
            disabled={processingId === sale.id}
            className="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded transition-colors"
            title="Editar esta venta DRAFT"
          >
            ✏️ Editar
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCancel(sale.id);
            }}
            disabled={processingId === sale.id}
            className="px-3 py-1 text-sm bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white rounded transition-colors"
            title="Cancelar esta venta DRAFT"
          >
            ❌ Cancelar
          </button>
        </div>
      );
    }

    if (sale.status === 'COMPLETED') {
      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleRefund(sale.id);
          }}
          disabled={processingId === sale.id}
          className="px-3 py-1 text-sm bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-400 text-white rounded transition-colors"
          title="Reembolsar esta venta COMPLETED"
        >
          💰 Reembolsar
        </button>
      );
    }

    // CANCELLED/REFUNDED - No mostrar botones
    return (
      <span className="text-xs text-gray-500">
        {sale.status === 'CANCELLED' ? '⛔ Cancelada' : '♻️ Reembolsada'}
      </span>
    );
  };

  const handleCancel = async (saleId: string) => {
    if (!window.confirm('¿Está seguro que desea cancelar esta venta?')) {
      return;
    }

    try {
      setProcessingId(saleId);
      await posApi.patch(`/pos/sales/${saleId}/cancel`);
      onRefresh();
    } catch (error: any) {
      console.error('Error al cancelar:', error);
      alert(error.response?.data?.message || 'Error al cancelar la venta');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRefund = async (saleId: string) => {
    if (
      !window.confirm('¿Está seguro que desea reembolsar esta venta? Se restaurará el inventario.')
    ) {
      return;
    }

    try {
      setProcessingId(saleId);
      await posApi.patch(`/pos/sales/${saleId}/refund`);
      onRefresh();
    } catch (error: any) {
      console.error('Error al reembolsar:', error);
      alert(error.response?.data?.message || 'Error al reembolsar la venta');
    } finally {
      setProcessingId(null);
    }
  };

  if (sales.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No hay ventas para mostrar</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sales.map((sale) => (
        <div
          key={sale.id}
          onClick={() => onSelectSale(sale)}
          className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">
                {sale.id}
              </h3>
              <p className="text-xs text-gray-500">
                {sale.createdAt
                  ? new Date(sale.createdAt).toLocaleString('es-ES')
                  : 'N/A'}
              </p>
            </div>
            <SaleStatusBadge status={sale.status} size="sm" />
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
            <div>
              <p className="text-gray-600">Items</p>
              <p className="font-semibold">{sale.items?.length || 0}</p>
            </div>
            <div>
              <p className="text-gray-600">Total</p>
              <p className="font-semibold text-green-600">
                ${sale.totalAmount?.toFixed(2) || '0.00'}
              </p>
            </div>
          </div>

          <div className="flex gap-2 justify-between items-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelectSale(sale);
              }}
              className="flex-1 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-900 rounded transition-colors"
              title="Ver detalles de esta venta"
            >
              👁️ Ver Detalles
            </button>
            {renderActions(sale)}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SalesList;
