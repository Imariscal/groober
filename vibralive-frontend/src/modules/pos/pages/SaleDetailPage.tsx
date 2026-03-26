import React, { useState } from 'react';
import {
  SaleDetails,
  EditSaleModal,
  useSaleStore,
} from './index';

/**
 * EJEMPLO DE USO - Página de Detalle de Venta
 * 
 * Esta página demuestra cómo usar todos los componentes del módulo POS
 * para implementar una interfaz completa de gestión de ventas.
 */
interface SalePageExampleProps {
  saleId: string;
}

export const SalePageExample: React.FC<SalePageExampleProps> = ({ saleId }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { error, successMessage, setError, setSuccessMessage } = useSaleStore();

  // Auto-limpiar mensajes después de 5 segundos
  React.useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, setSuccessMessage]);

  React.useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, setError]);

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      {/* Notificaciones */}
      {successMessage && (
        <div className="fixed top-4 right-4 p-4 bg-green-500 text-white rounded-lg shadow-lg z-50 max-w-sm">
          <div className="flex items-center gap-2">
            <span className="text-xl">✅</span>
            <p>{successMessage}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="fixed top-4 right-4 p-4 bg-red-500 text-white rounded-lg shadow-lg z-50 max-w-sm">
          <div className="flex items-center gap-2">
            <span className="text-xl">❌</span>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Contenido Principal */}
      <SaleDetails
        saleId={saleId}
        onEditModal={() => setIsEditModalOpen(true)}
        onRefresh={() => {
          // Opcional: recargar la página
          window.location.reload();
        }}
      />

      {/* Modal de Edición */}
      <EditSaleModal
        isOpen={isEditModalOpen}
        sale={useSaleStore((state) => state.sale)}
        onClose={() => setIsEditModalOpen(false)}
        onSaveComplete={() => {
          setIsEditModalOpen(false);
          // Opcional: recargar venta
          window.location.reload();
        }}
      />
    </div>
  );
};

export default SalePageExample;
