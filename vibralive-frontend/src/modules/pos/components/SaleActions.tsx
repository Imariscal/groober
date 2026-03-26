import React, { useState } from 'react';
import { useSaleStore, Sale } from '../stores/saleStore';
import { posApi } from '../services/api';
import { SaleStatusBadge } from './SaleStatusBadge';

interface SaleActionsProps {
  saleId: string;
  onEditClick?: () => void;
  onCancelComplete?: () => void;
  onCompleteComplete?: () => void;
  onRefundComplete?: () => void;
}

/**
 * COMPONENTE: SaleActions - Botones de Acción
 * 
 * ✅ GOLDEN RULE STRICT ENFORCEMENT
 * 
 * DRAFT:     [Editar] [Cancelar] [Completar Venta]
 * COMPLETED: [Reembolsar]
 * FINAL:     NO BOTONES - Solo mensaje informativo
 * 
 * NO MOSTRAR:
 * - Botón Editar si status !== DRAFT
 * - Botón Cancelar si status !== DRAFT
 * - Botón Convertir a Borrador (no existe esta funcionalidad)
 * - Botón Eliminar (no existe paa ventas completadas)
 */
export const SaleActions: React.FC<SaleActionsProps> = ({
  saleId,
  onEditClick,
  onCancelComplete,
  onCompleteComplete,
  onRefundComplete,
}) => {
  const { sale, setError, setSuccessMessage, setLoading } = useSaleStore();
  const [isProcessing, setIsProcessing] = useState(false);

  if (!sale) {
    return <div className="text-gray-500 text-sm">Cargando venta...</div>;
  }

  const isDraft = sale.status === 'DRAFT';
  const isCompleted = sale.status === 'COMPLETED';
  const isFinal = ['CANCELLED', 'REFUNDED'].includes(sale.status);

  const handleError = (err: any) => {
    console.error('Error:', err);
    let errorMessage = 'Error inesperado';

    if (err.response?.status === 400) {
      errorMessage = err.response.data.message || 'Operación no permitida';
    } else if (err.response?.status === 403) {
      errorMessage = 'No tienes permisos para esta operación';
    } else if (err.response?.status === 404) {
      errorMessage = 'Venta no encontrada';
    }

    setError(errorMessage);
  };

  const handleCancel = async () => {
    if (!window.confirm('¿Está seguro que desea cancelar esta venta?')) {
      return;
    }

    try {
      setIsProcessing(true);
      setLoading(true);
      await posApi.patch(`/pos/sales/${saleId}/cancel`);
      setSuccessMessage('Venta cancelada correctamente');
      onCancelComplete?.();
    } catch (err) {
      handleError(err);
    } finally {
      setIsProcessing(false);
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!window.confirm('¿Desea completar esta venta?')) {
      return;
    }

    try {
      setIsProcessing(true);
      setLoading(true);
      const response = await posApi.patch(`/pos/sales/${saleId}/complete`, {
        paymentMethod: 'CASH',
        paidAmount: sale.totalAmount,
      });
      setSuccessMessage('Venta completada correctamente');
      onCompleteComplete?.();
    } catch (err) {
      handleError(err);
    } finally {
      setIsProcessing(false);
      setLoading(false);
    }
  };

  const handleRefund = async () => {
    if (!window.confirm('¿Está seguro que desea reembolsar esta venta? Se restaurará el inventario.')) {
      return;
    }

    try {
      setIsProcessing(true);
      setLoading(true);
      await posApi.patch(`/pos/sales/${saleId}/refund`);
      setSuccessMessage('Venta reembolsada correctamente');
      onRefundComplete?.();
    } catch (err) {
      handleError(err);
    } finally {
      setIsProcessing(false);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* ✅ BOTONES SOLO PARA DRAFT */}
      {isDraft && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onEditClick}
            disabled={isProcessing}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded font-medium transition-colors"
            title="Editar items, cantidades y precios"
          >
            ✏️ Editar
          </button>

          <button
            onClick={handleCancel}
            disabled={isProcessing}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white rounded font-medium transition-colors"
            title="Cancelar esta venta"
          >
            ❌ Cancelar
          </button>

          <button
            onClick={handleComplete}
            disabled={isProcessing}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded font-medium transition-colors"
            title="Procesar pago y completar venta"
          >
            ✅ Completar Venta
          </button>
        </div>
      )}

      {/* ✅ BOTÓN SOLO PARA COMPLETED */}
      {isCompleted && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleRefund}
            disabled={isProcessing}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-400 text-white rounded font-medium transition-colors"
            title="Devolver los items y restaurar inventario"
          >
            💰 Reembolsar
          </button>
        </div>
      )}

      {/* ❌ NO MOSTRAR BOTONES PARA ESTADOS FINALES */}
      {isFinal && (
        <div className="flex items-center gap-3 p-3 bg-gray-100 border border-gray-300 rounded">
          <span className="text-xl">
            {sale.status === 'CANCELLED' ? '⛔' : '♻️'}
          </span>
          <div>
            <p className="text-gray-700 font-medium">Venta finalizada</p>
            <p className="text-sm text-gray-600">
              Esta venta no puede ser modificada
            </p>
          </div>
        </div>
      )}

      {/* Estado visual del badge */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Estado:</span>
        <SaleStatusBadge status={sale.status} size="md" />
      </div>
    </div>
  );
};

export default SaleActions;
