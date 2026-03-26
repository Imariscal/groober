import React, { useEffect } from 'react';
import { useSaleStore } from '../stores/saleStore';
import { SaleStatusBadge } from './SaleStatusBadge';
import { SaleActions } from './SaleActions';
import { posApi } from '../services/api';

interface SaleDetailsProps {
  saleId: string;
  onEditModal?: () => void;
  onRefresh?: () => void;
}

export const SaleDetails: React.FC<SaleDetailsProps> = ({
  saleId,
  onEditModal,
  onRefresh,
}) => {
  const { sale, setError, setSuccessMessage, setLoading } = useSaleStore();

  useEffect(() => {
    const fetchSale = async () => {
      try {
        setLoading(true);
        const response = await posApi.get(`/pos/sales/${saleId}`);
        // Actualizar el store con la venta obtenida
        useSaleStore.setState({ sale: response.data.data });
      } catch (error) {
        setError('Error al cargar la venta');
      } finally {
        setLoading(false);
      }
    };

    if (saleId) {
      fetchSale();
    }
  }, [saleId, setLoading, setError]);

  if (!sale) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-gray-500">Cargando venta...</p>
        </div>
      </div>
    );
  }

  const showEditWarning = sale.status !== 'DRAFT';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header con estado */}
      <div className="flex justify-between items-start p-6 bg-white rounded-lg shadow">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Venta #{sale.id}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Creada: {sale.createdAt
              ? new Date(sale.createdAt).toLocaleString('es-ES')
              : 'N/A'}
          </p>
          {sale.completedAt && (
            <p className="text-sm text-gray-500">
              Completada: {new Date(sale.completedAt).toLocaleString('es-ES')}
            </p>
          )}
        </div>
        <SaleStatusBadge status={sale.status} size="lg" />
      </div>

      {/* Advertencia si no es DRAFT */}
      {showEditWarning && (
        <div className="p-4 bg-blue-50 border-l-4 border-blue-400 rounded text-blue-900">
          <p className="font-semibold">ℹ️ Venta Finalizada</p>
          <p className="text-sm mt-1">
            Esta venta ha sido completada y no se pueden realizar cambios.
            {sale.status === 'COMPLETED' &&
              ' Use "Reembolsar" si necesita revertir esta venta.'}
          </p>
        </div>
      )}

      {/* Items de la venta */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Artículos ({sale.items?.length || 0})
        </h2>
        {sale.items && sale.items.length > 0 ? (
          <div className="space-y-2 divide-y">
            {sale.items.map((item, idx) => (
              <div key={item.id || idx} className="py-3 flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">
                    {item.productName || item.productId}
                  </p>
                  <p className="text-sm text-gray-600">
                    {item.quantity} × ${item.unitPrice.toFixed(2)}
                  </p>
                </div>
                <p className="font-bold text-gray-900 ml-4">
                  ${item.subtotal.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">Sin artículos</p>
        )}
      </div>

      {/* Totales */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Resumen Financiero</h2>
        <div className="space-y-3">
          <div className="flex justify-between py-2">
            <span className="text-gray-700">Subtotal:</span>
            <span className="font-semibold">${sale.subtotal?.toFixed(2) || '0.00'}</span>
          </div>

          {sale.discountAmount && sale.discountAmount > 0 && (
            <div className="flex justify-between py-2 text-green-600">
              <span>Descuento:</span>
              <span className="font-semibold">-${sale.discountAmount.toFixed(2)}</span>
            </div>
          )}

          {sale.taxAmount && sale.taxAmount > 0 && (
            <div className="flex justify-between py-2 text-amber-600">
              <span>Impuesto:</span>
              <span className="font-semibold">+${sale.taxAmount.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between py-3 border-t-2 border-gray-200 pt-3">
            <span className="text-lg font-bold text-gray-900">Total:</span>
            <span className="text-2xl font-bold text-green-600">
              ${sale.totalAmount?.toFixed(2) || '0.00'}
            </span>
          </div>
        </div>
      </div>

      {/* Sistema de Acciones */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Acciones</h2>
        <SaleActions
          saleId={sale.id}
          onEditClick={onEditModal}
          onCancelComplete={onRefresh}
          onCompleteComplete={onRefresh}
          onRefundComplete={onRefresh}
        />
      </div>

      {/* Notas */}
      {sale.notes && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-900 mb-2">Notas</h3>
          <p className="text-gray-700 whitespace-pre-wrap">{sale.notes}</p>
        </div>
      )}
    </div>
  );
};

export default SaleDetails;
